import {
  ROOM_CODE_LENGTH,
  ROOM_CODE_CHARS,
  MIN_PLAYERS,
  MAX_PLAYERS,
  type Player,
  type PlayerWithRole,
  type Role,
  type Card,
  type Phase,
  type ClientGameState,
  type Winner,
  CardSuit,
  CardRank,
} from '@the-killer/shared';

export interface GameRoom {
  code: string;
  hostId: string;
  players: Map<string, PlayerWithRole>;
  phase: Phase;
  round: number;

  // Night tracking
  detectiveTarget: string | null;
  detectiveResult: 'killer' | 'citizen' | null;
  killerTarget: string | null;

  // Day tracking
  accusedPlayerId: string | null;
  votes: Map<string, boolean>;

  // Death tracking
  killedThisNight: string | null;
  eliminatedThisDay: string | null;

  // Result
  winner: Winner | null;

  // Timers
  phaseTimer: ReturnType<typeof setTimeout> | null;
  phaseEndTime: number;
}

// חנות חדרים בזיכרון
const rooms = new Map<string, GameRoom>();

// מיפוי socketId -> roomCode
const playerRooms = new Map<string, string>();

function generateRoomCode(): string {
  let code: string;
  do {
    code = '';
    for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
      code += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)];
    }
  } while (rooms.has(code));
  return code;
}

export function createRoom(hostId: string, displayName: string): GameRoom {
  const code = generateRoomCode();
  const hostPlayer: PlayerWithRole = {
    id: hostId,
    displayName,
    isAlive: true,
    isConnected: true,
    role: 'citizen' as Role,
    card: { suit: CardSuit.HEARTS, rank: CardRank.TWO },
  };

  const room: GameRoom = {
    code,
    hostId,
    players: new Map([[hostId, hostPlayer]]),
    phase: 'waiting' as Phase,
    round: 0,
    detectiveTarget: null,
    detectiveResult: null,
    killerTarget: null,
    accusedPlayerId: null,
    votes: new Map(),
    killedThisNight: null,
    eliminatedThisDay: null,
    winner: null,
    phaseTimer: null,
    phaseEndTime: 0,
  };

  rooms.set(code, room);
  playerRooms.set(hostId, code);
  return room;
}

export function joinRoom(code: string, playerId: string, displayName: string): GameRoom | null {
  const room = rooms.get(code);
  if (!room) return null;
  if (room.phase !== ('waiting' as Phase)) return null;
  if (room.players.size >= MAX_PLAYERS) return null;

  const player: PlayerWithRole = {
    id: playerId,
    displayName,
    isAlive: true,
    isConnected: true,
    role: 'citizen' as Role,
    card: { suit: CardSuit.HEARTS, rank: CardRank.TWO },
  };

  room.players.set(playerId, player);
  playerRooms.set(playerId, code);
  return room;
}

export function getRoom(code: string): GameRoom | undefined {
  return rooms.get(code);
}

export function getRoomByPlayer(playerId: string): GameRoom | undefined {
  const code = playerRooms.get(playerId);
  if (!code) return undefined;
  return rooms.get(code);
}

export function removePlayer(playerId: string): GameRoom | undefined {
  const code = playerRooms.get(playerId);
  if (!code) return undefined;
  const room = rooms.get(code);
  if (!room) return undefined;

  if (room.phase === ('waiting' as Phase)) {
    room.players.delete(playerId);
    playerRooms.delete(playerId);

    if (room.players.size === 0) {
      if (room.phaseTimer) clearTimeout(room.phaseTimer);
      rooms.delete(code);
      return undefined;
    }

    // אם המארח עזב, העבר למישהו אחר
    if (room.hostId === playerId) {
      room.hostId = room.players.keys().next().value!;
    }
  } else {
    // במהלך המשחק, סמן כמנותק
    const player = room.players.get(playerId);
    if (player) {
      player.isConnected = false;
    }
  }

  return room;
}

export function assignRoles(room: GameRoom): void {
  const playerIds = Array.from(room.players.keys());
  // ערבוב Fisher-Yates
  for (let i = playerIds.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [playerIds[i], playerIds[j]] = [playerIds[j], playerIds[i]];
  }

  const suits = [CardSuit.HEARTS, CardSuit.DIAMONDS, CardSuit.CLUBS, CardSuit.SPADES];
  const numberRanks = [
    CardRank.TWO, CardRank.THREE, CardRank.FOUR, CardRank.FIVE,
    CardRank.SIX, CardRank.SEVEN, CardRank.EIGHT, CardRank.NINE, CardRank.TEN,
  ];

  playerIds.forEach((id, index) => {
    const player = room.players.get(id)!;
    const suit = suits[index % suits.length];

    if (index === 0) {
      // רוצח = מלכה
      player.role = 'killer' as Role;
      player.card = { suit, rank: CardRank.QUEEN };
    } else if (index === 1) {
      // בלש = מלך
      player.role = 'detective' as Role;
      player.card = { suit, rank: CardRank.KING };
    } else {
      // אזרח = מספר
      player.role = 'citizen' as Role;
      player.card = { suit, rank: numberRanks[(index - 2) % numberRanks.length] };
    }
  });
}

export function getPublicPlayers(room: GameRoom): Player[] {
  return Array.from(room.players.values()).map((p) => ({
    id: p.id,
    displayName: p.displayName,
    isAlive: p.isAlive,
    isConnected: p.isConnected,
  }));
}

export function getClientState(room: GameRoom, playerId: string): ClientGameState {
  const player = room.players.get(playerId);
  const players = Array.from(room.players.values()).map((p) => ({
    id: p.id,
    displayName: p.displayName,
    isAlive: p.isAlive,
    isConnected: p.isConnected,
  }));

  const state: ClientGameState = {
    phase: room.phase,
    round: room.round,
    players,
    myId: playerId,
    hostId: room.hostId,
    votes: Object.fromEntries(room.votes),
    timeRemaining: Math.max(0, room.phaseEndTime - Date.now()),
  };

  // תפקיד אישי
  if (player && room.phase !== ('waiting' as Phase)) {
    state.myRole = player.role;
    state.myCard = player.card;
  }

  // תוצאת בלש
  if (player?.role === ('detective' as Role) && room.detectiveResult) {
    state.detectiveResult = room.detectiveResult;
  }

  // נאשם
  if (room.accusedPlayerId) {
    state.accusedPlayerId = room.accusedPlayerId;
  }

  // הכרזת מוות
  if (room.killedThisNight) {
    state.killedPlayerId = room.killedThisNight;
  }

  // הוצאה להורג
  if (room.eliminatedThisDay) {
    state.eliminatedPlayerId = room.eliminatedThisDay;
  }

  // סוף משחק - חשיפת כל התפקידים
  if (room.phase === ('game_over' as Phase)) {
    state.winner = room.winner!;
    state.allRoles = {};
    for (const [id, p] of room.players) {
      state.allRoles[id] = { role: p.role, card: p.card };
    }
  }

  return state;
}

export function getAlivePlayers(room: GameRoom): PlayerWithRole[] {
  return Array.from(room.players.values()).filter((p) => p.isAlive);
}

export function checkWinCondition(room: GameRoom): Winner | null {
  const alive = getAlivePlayers(room);
  const aliveKillers = alive.filter((p) => p.role === ('killer' as Role));
  const aliveCitizens = alive.filter((p) => p.role !== ('killer' as Role));

  // אזרחים מנצחים - כל הרוצחים מתו
  if (aliveKillers.length === 0) return 'citizens';

  // רוצח מנצח - נשאר רוצח ואזרח אחד בלבד
  if (aliveCitizens.length <= 1) return 'killer';

  return null;
}

export function canStartGame(room: GameRoom): boolean {
  return room.players.size >= MIN_PLAYERS && room.phase === ('waiting' as Phase);
}

export function cleanupRoom(code: string): void {
  const room = rooms.get(code);
  if (room) {
    if (room.phaseTimer) clearTimeout(room.phaseTimer);
    for (const playerId of room.players.keys()) {
      playerRooms.delete(playerId);
    }
    rooms.delete(code);
  }
}

import { Phase, TIMERS, type Winner } from '@the-killer/shared';
import {
  type GameRoom,
  assignRoles,
  getAlivePlayers,
  checkWinCondition,
  getClientState,
} from '../rooms/manager';
import type { Server } from 'socket.io';

// מנוע המשחק - מנהל מעברי שלבים וטיימרים

export function startGame(room: GameRoom, io: Server): void {
  assignRoles(room);
  room.round = 0;
  room.phase = Phase.DEALING_CARDS;
  room.phaseEndTime = Date.now() + TIMERS.CARD_REVEAL;

  broadcastState(room, io);

  room.phaseTimer = setTimeout(() => {
    transitionToDay(room, io);
  }, TIMERS.CARD_REVEAL);
}

function transitionToNight(room: GameRoom, io: Server): void {
  room.round++;
  room.killedThisNight = null;
  room.detectiveTarget = null;
  room.detectiveResult = null;
  room.killerTarget = null;

  // בדוק אם הבלש חי
  const detective = getAlivePlayers(room).find((p) => p.role === 'detective');

  if (detective) {
    room.phase = Phase.NIGHT_DETECTIVE;
    room.phaseEndTime = Date.now() + TIMERS.DETECTIVE_PHASE;
    broadcastState(room, io);

    room.phaseTimer = setTimeout(() => {
      transitionToKillerPhase(room, io);
    }, TIMERS.DETECTIVE_PHASE);
  } else {
    // בלש מת - השכמה מזויפת ואז עובר לרוצח
    room.phase = Phase.NIGHT_DETECTIVE;
    room.phaseEndTime = Date.now() + TIMERS.DETECTIVE_PHASE;
    broadcastState(room, io);

    room.phaseTimer = setTimeout(() => {
      transitionToKillerPhase(room, io);
    }, TIMERS.DETECTIVE_PHASE);
  }
}

function transitionToKillerPhase(room: GameRoom, io: Server): void {
  const killer = getAlivePlayers(room).find((p) => p.role === 'killer');

  room.phase = Phase.NIGHT_KILLER;
  room.phaseEndTime = Date.now() + TIMERS.KILLER_PHASE;
  broadcastState(room, io);

  room.phaseTimer = setTimeout(() => {
    resolveNight(room, io);
  }, TIMERS.KILLER_PHASE);
}

function resolveNight(room: GameRoom, io: Server): void {
  // אם הרוצח בחר מטרה
  if (room.killerTarget) {
    const target = room.players.get(room.killerTarget);
    if (target && target.isAlive) {
      target.isAlive = false;
      room.killedThisNight = room.killerTarget;
    }
  }

  // בדוק תנאי ניצחון
  const winner = checkWinCondition(room);
  if (winner) {
    endGame(room, io, winner);
    return;
  }

  transitionToDayAnnouncement(room, io);
}

function transitionToDayAnnouncement(room: GameRoom, io: Server): void {
  room.phase = Phase.DAY_ANNOUNCEMENT;
  room.phaseEndTime = Date.now() + TIMERS.DAY_ANNOUNCEMENT;
  broadcastState(room, io);

  // שלח הודעת מנחה
  const killed = room.killedThisNight
    ? room.players.get(room.killedThisNight)
    : null;

  const message = killed
    ? `העיירה מתעוררת... ${killed.displayName} נמצא/ה ללא רוח חיים.`
    : 'העיירה מתעוררת... כולם שרדו את הלילה!';

  io.to(room.code).emit('game:narrator', { message });

  room.phaseTimer = setTimeout(() => {
    transitionToDay(room, io);
  }, TIMERS.DAY_ANNOUNCEMENT);
}

function transitionToDay(room: GameRoom, io: Server): void {
  room.phase = Phase.DAY_DISCUSSION;
  room.accusedPlayerId = null;
  room.eliminatedThisDay = null;
  room.votes.clear();
  room.phaseEndTime = 0; // דיון חופשי - ללא טיימר קשיח
  broadcastState(room, io);

  io.to(room.code).emit('game:narrator', {
    message: 'זמן דיון! מי לדעתכם הרוצח? כל שחקן יכול להאשים מישהו.',
  });
}

export function handleDetectiveAction(
  room: GameRoom,
  playerId: string,
  targetId: string,
  io: Server
): boolean {
  if (room.phase !== Phase.NIGHT_DETECTIVE) return false;

  const player = room.players.get(playerId);
  if (!player || player.role !== 'detective' || !player.isAlive) return false;

  const target = room.players.get(targetId);
  if (!target || !target.isAlive || targetId === playerId) return false;

  room.detectiveTarget = targetId;
  room.detectiveResult = target.role === 'killer' ? 'killer' : 'citizen';

  // שלח תוצאה רק לבלש
  broadcastState(room, io);

  // עבור ישירות לשלב הרוצח
  if (room.phaseTimer) clearTimeout(room.phaseTimer);
  room.phaseTimer = setTimeout(() => {
    transitionToKillerPhase(room, io);
  }, 2000); // 2 שניות לראות את התוצאה

  return true;
}

export function handleKillerAction(
  room: GameRoom,
  playerId: string,
  targetId: string,
  io: Server
): boolean {
  if (room.phase !== Phase.NIGHT_KILLER) return false;

  const player = room.players.get(playerId);
  if (!player || player.role !== 'killer' || !player.isAlive) return false;

  const target = room.players.get(targetId);
  if (!target || !target.isAlive || targetId === playerId) return false;

  room.killerTarget = targetId;

  // עבור ישירות לפתרון הלילה
  if (room.phaseTimer) clearTimeout(room.phaseTimer);
  room.phaseTimer = setTimeout(() => {
    resolveNight(room, io);
  }, 1000);

  return true;
}

export function handleAccusation(
  room: GameRoom,
  accuserId: string,
  targetId: string,
  io: Server
): boolean {
  if (room.phase !== Phase.DAY_DISCUSSION) return false;

  const accuser = room.players.get(accuserId);
  if (!accuser || !accuser.isAlive) return false;

  const target = room.players.get(targetId);
  if (!target || !target.isAlive || targetId === accuserId) return false;

  room.phase = Phase.DAY_DEFENSE;
  room.accusedPlayerId = targetId;
  room.votes.clear();
  room.phaseEndTime = Date.now() + TIMERS.DEFENSE_PHASE;
  broadcastState(room, io);

  io.to(room.code).emit('game:narrator', {
    message: `${accuser.displayName} מאשים/ה את ${target.displayName}! ל-${target.displayName} יש 30 שניות להגנה.`,
  });

  room.phaseTimer = setTimeout(() => {
    transitionToVoting(room, io);
  }, TIMERS.DEFENSE_PHASE);

  return true;
}

function transitionToVoting(room: GameRoom, io: Server): void {
  room.phase = Phase.DAY_VOTING;
  room.votes.clear();
  room.phaseEndTime = Date.now() + TIMERS.VOTING_PHASE;
  broadcastState(room, io);

  const accused = room.players.get(room.accusedPlayerId!);
  io.to(room.code).emit('game:narrator', {
    message: `הצביעו! האם ${accused?.displayName} אשם/ה? רוב קולות = הוצאה להורג.`,
  });

  room.phaseTimer = setTimeout(() => {
    resolveVote(room, io);
  }, TIMERS.VOTING_PHASE);
}

export function handleVote(
  room: GameRoom,
  playerId: string,
  guilty: boolean,
  io: Server
): boolean {
  if (room.phase !== Phase.DAY_VOTING) return false;

  const player = room.players.get(playerId);
  if (!player || !player.isAlive) return false;

  // הנאשם לא מצביע
  if (playerId === room.accusedPlayerId) return false;

  room.votes.set(playerId, guilty);
  broadcastState(room, io);

  // בדוק אם כולם הצביעו
  const aliveVoters = getAlivePlayers(room).filter(
    (p) => p.id !== room.accusedPlayerId
  );
  if (room.votes.size >= aliveVoters.length) {
    if (room.phaseTimer) clearTimeout(room.phaseTimer);
    resolveVote(room, io);
  }

  return true;
}

function resolveVote(room: GameRoom, io: Server): void {
  const guiltyVotes = Array.from(room.votes.values()).filter((v) => v).length;
  const totalVoters = getAlivePlayers(room).filter(
    (p) => p.id !== room.accusedPlayerId
  ).length;
  const majority = Math.floor(totalVoters / 2) + 1;

  if (guiltyVotes >= majority) {
    // הוצאה להורג
    const accused = room.players.get(room.accusedPlayerId!);
    if (accused) {
      accused.isAlive = false;
      room.eliminatedThisDay = room.accusedPlayerId!;

      io.to(room.code).emit('game:narrator', {
        message: `${accused.displayName} הוצא/ה להורג! התפקיד שלו/ה היה: ${getRoleDisplayName(accused.role)}.`,
      });

      // בדוק תנאי ניצחון
      const winner = checkWinCondition(room);
      if (winner) {
        endGame(room, io, winner);
        return;
      }
    }

    // עבור ללילה
    broadcastState(room, io);
    room.phaseTimer = setTimeout(() => {
      transitionToNight(room, io);
    }, 3000);
  } else {
    // אין רוב - חזרה לדיון
    io.to(room.code).emit('game:narrator', {
      message: `אין רוב קולות. ${room.players.get(room.accusedPlayerId!)?.displayName} נשאר/ת במשחק. הדיון ממשיך.`,
    });

    room.accusedPlayerId = null;
    room.votes.clear();
    transitionToDay(room, io);
  }
}

export function handleEndDiscussion(
  room: GameRoom,
  playerId: string,
  io: Server
): boolean {
  if (room.phase !== Phase.DAY_DISCUSSION) return false;
  if (playerId !== room.hostId) return false;

  // המארח יכול לסיים את הדיון ולעבור ללילה
  if (room.phaseTimer) clearTimeout(room.phaseTimer);
  transitionToNight(room, io);
  return true;
}

function endGame(room: GameRoom, io: Server, winner: Winner): void {
  if (room.phaseTimer) clearTimeout(room.phaseTimer);
  room.phase = Phase.GAME_OVER;
  room.winner = winner;
  room.phaseEndTime = 0;

  const message =
    winner === 'citizens'
      ? 'האזרחים ניצחו! הרוצח נתפס!'
      : 'הרוצח ניצח! העיירה נכנעה!';

  io.to(room.code).emit('game:narrator', { message });
  broadcastState(room, io);
}

function broadcastState(room: GameRoom, io: Server): void {
  for (const [playerId] of room.players) {
    const state = getClientState(room, playerId);
    io.to(playerId).emit('game:state', state);
  }
}

function getRoleDisplayName(role: string): string {
  switch (role) {
    case 'killer':
      return 'רוצח 🔪';
    case 'detective':
      return 'בלש 🔍';
    case 'citizen':
      return 'אזרח 👤';
    default:
      return role;
  }
}

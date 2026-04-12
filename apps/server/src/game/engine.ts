import { Phase, type Winner } from '../shared/types';
import { TIMERS } from '../shared/constants';
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

/**
 * דיון חופשי — 60 שניות, ואז עובר אוטומטית להצבעה
 */
function transitionToDay(room: GameRoom, io: Server): void {
  room.phase = Phase.DAY_DISCUSSION;
  room.accusedPlayerId = null;
  room.eliminatedThisDay = null;
  room.votes.clear();
  room.phaseEndTime = Date.now() + TIMERS.DISCUSSION_PHASE;
  broadcastState(room, io);

  io.to(room.code).emit('game:narrator', {
    message: 'זמן דיון! יש לכם 60 שניות לדון ולהחליט מי הרוצח. הצביעו בחכמה!',
  });

  // אחרי 60 שניות — עבור להצבעה
  room.phaseTimer = setTimeout(() => {
    transitionToVoting(room, io);
  }, TIMERS.DISCUSSION_PHASE);
}

/**
 * שלב ההצבעה — כל שחקן חי בוחר למי להצביע (הצבעת רוב יחסי)
 */
function transitionToVoting(room: GameRoom, io: Server): void {
  room.phase = Phase.DAY_VOTING;
  room.votes.clear();
  room.phaseEndTime = Date.now() + TIMERS.VOTING_PHASE;
  broadcastState(room, io);

  io.to(room.code).emit('game:narrator', {
    message: 'הצבעה! בחרו מי לדעתכם הרוצח. השחקן עם הכי הרבה קולות יוצא מהמשחק!',
  });

  room.phaseTimer = setTimeout(() => {
    resolveVote(room, io);
  }, TIMERS.VOTING_PHASE);
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

/**
 * הצבעה — כל שחקן חי בוחר מי הרוצח לדעתו
 * @param targetId מזהה השחקן שמצביעים נגדו
 */
export function handleVote(
  room: GameRoom,
  playerId: string,
  targetId: string,
  io: Server
): boolean {
  if (room.phase !== Phase.DAY_VOTING) return false;

  const player = room.players.get(playerId);
  if (!player || !player.isAlive) return false;

  const target = room.players.get(targetId);
  if (!target || !target.isAlive || targetId === playerId) return false;

  room.votes.set(playerId, targetId);
  broadcastState(room, io);

  // בדוק אם כולם הצביעו
  const aliveVoters = getAlivePlayers(room);
  if (room.votes.size >= aliveVoters.length) {
    if (room.phaseTimer) clearTimeout(room.phaseTimer);
    resolveVote(room, io);
  }

  return true;
}

/**
 * פתרון הצבעה — רוב יחסי (הכי הרבה קולות)
 * במקרה שיוויון — אף אחד לא מוצא
 */
function resolveVote(room: GameRoom, io: Server): void {
  // ספירת קולות לכל שחקן
  const voteCounts = new Map<string, number>();
  for (const targetId of room.votes.values()) {
    voteCounts.set(targetId, (voteCounts.get(targetId) ?? 0) + 1);
  }

  // מצא מקסימום קולות
  let maxVotes = 0;
  let leadingPlayers: string[] = [];

  for (const [playerId, count] of voteCounts) {
    if (count > maxVotes) {
      maxVotes = count;
      leadingPlayers = [playerId];
    } else if (count === maxVotes) {
      leadingPlayers.push(playerId);
    }
  }

  const totalVoters = getAlivePlayers(room).length;

  // שיוויון — אף אחד לא מוצא
  if (leadingPlayers.length !== 1 || maxVotes === 0) {
    io.to(room.code).emit('game:narrator', {
      message: 'לא הוכרע — שיוויון בהצבעה. המשחק ממשיך ללילה.',
    });

    room.accusedPlayerId = null;
    broadcastState(room, io);

    room.phaseTimer = setTimeout(() => {
      transitionToNight(room, io);
    }, 3000);
    return;
  }

  const eliminatedId = leadingPlayers[0];
  const eliminated = room.players.get(eliminatedId);

  if (eliminated) {
    eliminated.isAlive = false;
    room.eliminatedThisDay = eliminatedId;

    io.to(room.code).emit('game:narrator', {
      message: `${eliminated.displayName} הוצא/ה מהמשחק עם ${maxVotes} קולות מתוך ${totalVoters}! התפקיד שלו/ה היה: ${getRoleDisplayName(eliminated.role)}.`,
    });

    // בדוק תנאי ניצחון
    const winner = checkWinCondition(room);
    if (winner) {
      broadcastState(room, io);
      endGame(room, io, winner);
      return;
    }
  }

  // עבור ללילה
  broadcastState(room, io);
  room.phaseTimer = setTimeout(() => {
    transitionToNight(room, io);
  }, 3000);
}

/**
 * המארח יכול לדחוף להצבעה מוקדמת (לפני סיום 60 שניות)
 */
export function handleEndDiscussion(
  room: GameRoom,
  playerId: string,
  io: Server
): boolean {
  if (room.phase !== Phase.DAY_DISCUSSION) return false;
  if (playerId !== room.hostId) return false;

  if (room.phaseTimer) clearTimeout(room.phaseTimer);
  transitionToVoting(room, io);
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

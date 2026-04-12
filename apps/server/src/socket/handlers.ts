import type { Server, Socket } from 'socket.io';
import { CLIENT_EVENTS, SERVER_EVENTS } from '../shared/events';
import { MIN_PLAYERS } from '../shared/constants';
import {
  createRoom,
  joinRoom,
  removePlayer,
  getRoomByPlayer,
  getRoom,
  getPublicPlayers,
  getClientState,
  canStartGame,
} from '../rooms/manager';
import {
  startGame,
  handleDetectiveAction,
  handleKillerAction,
  handleVote,
  handleEndDiscussion,
} from '../game/engine';

export function registerHandlers(io: Server, socket: Socket): void {
  // === יצירת חדר ===
  socket.on(CLIENT_EVENTS.ROOM_CREATE, ({ displayName }: { displayName: string }) => {
    if (!displayName?.trim()) {
      socket.emit(SERVER_EVENTS.ERROR, { message: 'יש להזין שם תצוגה' });
      return;
    }

    const room = createRoom(socket.id, displayName.trim());
    socket.join(room.code);

    socket.emit(SERVER_EVENTS.ROOM_CREATED, {
      roomCode: room.code,
      playerId: socket.id,
    });

    socket.emit(SERVER_EVENTS.ROOM_JOINED, {
      players: getPublicPlayers(room),
      roomCode: room.code,
      hostId: room.hostId,
    });
  });

  // === הצטרפות לחדר ===
  socket.on(CLIENT_EVENTS.ROOM_JOIN, ({ roomCode, displayName }: { roomCode: string; displayName: string }) => {
    if (!displayName?.trim() || !roomCode?.trim()) {
      socket.emit(SERVER_EVENTS.ERROR, { message: 'יש להזין שם וקוד חדר' });
      return;
    }

    const room = joinRoom(roomCode.trim().toUpperCase(), socket.id, displayName.trim());
    if (!room) {
      socket.emit(SERVER_EVENTS.ROOM_ERROR, { message: 'חדר לא נמצא, מלא, או שהמשחק כבר התחיל' });
      return;
    }

    socket.join(room.code);

    socket.emit(SERVER_EVENTS.ROOM_JOINED, {
      players: getPublicPlayers(room),
      roomCode: room.code,
      hostId: room.hostId,
    });

    // הודע לכולם על שחקן חדש
    socket.to(room.code).emit(SERVER_EVENTS.ROOM_PLAYER_JOINED, {
      player: {
        id: socket.id,
        displayName: displayName.trim(),
        isAlive: true,
        isConnected: true,
      },
    });
  });

  // === התחלת משחק ===
  socket.on(CLIENT_EVENTS.GAME_START, () => {
    const room = getRoomByPlayer(socket.id);
    if (!room) return;

    if (socket.id !== room.hostId) {
      socket.emit(SERVER_EVENTS.ERROR, { message: 'רק המארח יכול להתחיל את המשחק' });
      return;
    }

    if (!canStartGame(room)) {
      socket.emit(SERVER_EVENTS.ERROR, { message: `צריך לפחות ${MIN_PLAYERS} שחקנים כדי להתחיל` });
      return;
    }

    startGame(room, io);
  });

  // === פעולת לילה ===
  socket.on(CLIENT_EVENTS.NIGHT_ACTION, ({ targetPlayerId }: { targetPlayerId: string }) => {
    const room = getRoomByPlayer(socket.id);
    if (!room) return;

    const player = room.players.get(socket.id);
    if (!player) return;

    if (player.role === 'detective') {
      handleDetectiveAction(room, socket.id, targetPlayerId, io);
    } else if (player.role === 'killer') {
      handleKillerAction(room, socket.id, targetPlayerId, io);
    }
  });

  // === הצבעה — בוחר שחקן ספציפי (רוב יחסי) ===
  socket.on(CLIENT_EVENTS.DAY_VOTE, ({ targetPlayerId }: { targetPlayerId: string }) => {
    const room = getRoomByPlayer(socket.id);
    if (!room) return;
    handleVote(room, socket.id, targetPlayerId, io);
  });

  // === סיום דיון ===
  socket.on(CLIENT_EVENTS.DAY_END_DISCUSSION, () => {
    const room = getRoomByPlayer(socket.id);
    if (!room) return;
    handleEndDiscussion(room, socket.id, io);
  });

  // === הודעת צ'אט ===
  socket.on(CLIENT_EVENTS.CHAT_MESSAGE, ({ text }: { text: string }) => {
    const room = getRoomByPlayer(socket.id);
    if (!room) return;

    const player = room.players.get(socket.id);
    if (!player || !player.isAlive) return;

    io.to(room.code).emit(SERVER_EVENTS.CHAT_MESSAGE, {
      playerId: socket.id,
      displayName: player.displayName,
      text: text.trim(),
      timestamp: Date.now(),
    });
  });

  // === WebRTC Signaling Relay ===
  socket.on('webrtc:join', ({ roomCode }: { roomCode: string }) => {
    socket.to(roomCode).emit('webrtc:peer-joined', { peerId: socket.id });
  });

  socket.on('webrtc:offer', ({ to, offer }: { to: string; offer: unknown }) => {
    socket.to(to).emit('webrtc:offer', { from: socket.id, offer });
  });

  socket.on('webrtc:answer', ({ to, answer }: { to: string; answer: unknown }) => {
    socket.to(to).emit('webrtc:answer', { from: socket.id, answer });
  });

  socket.on('webrtc:ice-candidate', ({ to, candidate }: { to: string; candidate: unknown }) => {
    socket.to(to).emit('webrtc:ice-candidate', { from: socket.id, candidate });
  });

  // === התנתקות ===
  socket.on('disconnect', () => {
    const room = removePlayer(socket.id);
    if (room) {
      io.to(room.code).emit(SERVER_EVENTS.ROOM_PLAYER_LEFT, {
        playerId: socket.id,
      });

      // עדכן סטייט לכל השחקנים
      for (const [playerId] of room.players) {
        const state = getClientState(room, playerId);
        io.to(playerId).emit(SERVER_EVENTS.GAME_STATE, state);
      }
    }
  });
}

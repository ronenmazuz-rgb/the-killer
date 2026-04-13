'use client';

import { useEffect, useCallback } from 'react';
import { connectSocket, disconnectSocket, getSocket } from '@/lib/socket';
import { useGameStore } from '@/stores/gameStore';
import { SERVER_EVENTS, CLIENT_EVENTS } from '@the-killer/shared';

export function useSocket() {
  const store = useGameStore();

  useEffect(() => {
    const socket = connectSocket();

    // הגדר handlers עם שמות - כדי שאפשר להסיר רק אותם ב-cleanup
    const onConnect = () => {
      store.setConnected(true);
      store.setPlayerId(socket.id!);
    };
    const onDisconnect = () => store.setConnected(false);
    const onRoomCreated = ({ roomCode, playerId }: { roomCode: string; playerId: string }) => {
      store.setRoomCode(roomCode);
      store.setPlayerId(playerId);
    };
    const onRoomJoined = ({ players, roomCode, hostId }: { players: any[]; roomCode: string; hostId: string }) => {
      store.setRoomCode(roomCode);
      store.setLobbyPlayers(players);
      store.setHostId(hostId);
    };
    const onPlayerJoined = ({ player }: { player: any }) => store.addLobbyPlayer(player);
    const onPlayerLeft = ({ playerId }: { playerId: string }) => store.removeLobbyPlayer(playerId);
    const onGameState = (state: any) => store.setGameState(state);
    const onNarrator = ({ message }: { message: string }) => store.addNarratorMessage(message);
    const onChat = (message: any) => store.addChatMessage(message);
    const onError = ({ message }: { message: string }) => console.error('שגיאת שרת:', message);
    const onRoomError = ({ message }: { message: string }) => {
      console.error('שגיאת חדר:', message);
      alert(message);
    };
    const onRoomsList = ({ rooms }: { rooms: any[] }) => store.setAvailableRooms(rooms);
    const onRoomsUpdated = (payload: any) => store.updateAvailableRoom(payload);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on(SERVER_EVENTS.ROOM_CREATED, onRoomCreated);
    socket.on(SERVER_EVENTS.ROOM_JOINED, onRoomJoined);
    socket.on(SERVER_EVENTS.ROOM_PLAYER_JOINED, onPlayerJoined);
    socket.on(SERVER_EVENTS.ROOM_PLAYER_LEFT, onPlayerLeft);
    socket.on(SERVER_EVENTS.GAME_STATE, onGameState);
    socket.on(SERVER_EVENTS.GAME_NARRATOR, onNarrator);
    socket.on(SERVER_EVENTS.CHAT_MESSAGE, onChat);
    socket.on(SERVER_EVENTS.ERROR, onError);
    socket.on(SERVER_EVENTS.ROOM_ERROR, onRoomError);
    socket.on(SERVER_EVENTS.ROOMS_LIST, onRoomsList);
    socket.on(SERVER_EVENTS.ROOMS_UPDATED, onRoomsUpdated);

    // אם כבר מחובר (reconnect), עדכן את ה-id
    if (socket.connected) {
      store.setConnected(true);
      store.setPlayerId(socket.id!);
    }

    return () => {
      // הסר רק את ה-handlers הספציפיים שלנו
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off(SERVER_EVENTS.ROOM_CREATED, onRoomCreated);
      socket.off(SERVER_EVENTS.ROOM_JOINED, onRoomJoined);
      socket.off(SERVER_EVENTS.ROOM_PLAYER_JOINED, onPlayerJoined);
      socket.off(SERVER_EVENTS.ROOM_PLAYER_LEFT, onPlayerLeft);
      socket.off(SERVER_EVENTS.GAME_STATE, onGameState);
      socket.off(SERVER_EVENTS.GAME_NARRATOR, onNarrator);
      socket.off(SERVER_EVENTS.CHAT_MESSAGE, onChat);
      socket.off(SERVER_EVENTS.ERROR, onError);
      socket.off(SERVER_EVENTS.ROOM_ERROR, onRoomError);
      socket.off(SERVER_EVENTS.ROOMS_LIST, onRoomsList);
      socket.off(SERVER_EVENTS.ROOMS_UPDATED, onRoomsUpdated);
    };
  }, []);

  const createRoom = useCallback((displayName: string, password?: string) => {
    getSocket().emit(CLIENT_EVENTS.ROOM_CREATE, { displayName, password });
  }, []);

  const joinRoom = useCallback((roomCode: string, displayName: string, password?: string) => {
    getSocket().emit(CLIENT_EVENTS.ROOM_JOIN, { roomCode, displayName, password });
  }, []);

  const subscribeToRooms = useCallback(() => {
    getSocket().emit(CLIENT_EVENTS.ROOMS_SUBSCRIBE);
  }, []);

  const unsubscribeFromRooms = useCallback(() => {
    getSocket().emit(CLIENT_EVENTS.ROOMS_UNSUBSCRIBE);
  }, []);

  const startGame = useCallback(() => {
    getSocket().emit(CLIENT_EVENTS.GAME_START);
  }, []);

  const nightAction = useCallback((targetPlayerId: string) => {
    getSocket().emit(CLIENT_EVENTS.NIGHT_ACTION, { targetPlayerId });
  }, []);

  const vote = useCallback((targetPlayerId: string) => {
    getSocket().emit(CLIENT_EVENTS.DAY_VOTE, { targetPlayerId });
  }, []);

  const endDiscussion = useCallback(() => {
    getSocket().emit(CLIENT_EVENTS.DAY_END_DISCUSSION);
  }, []);

  const sendChat = useCallback((text: string) => {
    getSocket().emit(CLIENT_EVENTS.CHAT_MESSAGE, { text });
  }, []);

  return {
    createRoom,
    joinRoom,
    startGame,
    nightAction,
    vote,
    endDiscussion,
    sendChat,
    subscribeToRooms,
    unsubscribeFromRooms,
  };
}

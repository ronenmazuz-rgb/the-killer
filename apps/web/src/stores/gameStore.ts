'use client';

import { create } from 'zustand';
import type {
  ClientGameState,
  Player,
  ChatMessagePayload,
  RoomListItem,
} from '@the-killer/shared';

interface GameStore {
  // חיבור
  isConnected: boolean;
  setConnected: (connected: boolean) => void;

  // חדר
  roomCode: string | null;
  setRoomCode: (code: string | null) => void;
  playerId: string | null;
  setPlayerId: (id: string | null) => void;
  displayName: string;
  setDisplayName: (name: string) => void;

  // שחקנים בלובי
  lobbyPlayers: Player[];
  setLobbyPlayers: (players: Player[]) => void;
  addLobbyPlayer: (player: Player) => void;
  removeLobbyPlayer: (playerId: string) => void;
  hostId: string | null;
  setHostId: (id: string | null) => void;

  // רשימת חדרים
  availableRooms: RoomListItem[];
  setAvailableRooms: (rooms: RoomListItem[]) => void;
  updateAvailableRoom: (payload: { action: string; room?: RoomListItem; code?: string }) => void;

  // סטייט משחק
  gameState: ClientGameState | null;
  setGameState: (state: ClientGameState) => void;

  // הודעות מנחה
  narratorMessages: string[];
  addNarratorMessage: (message: string) => void;

  // צ'אט
  chatMessages: ChatMessagePayload[];
  addChatMessage: (message: ChatMessagePayload) => void;

  // ניקוי
  reset: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  isConnected: false,
  setConnected: (connected) => set({ isConnected: connected }),

  roomCode: null,
  setRoomCode: (code) => set({ roomCode: code }),
  playerId: null,
  setPlayerId: (id) => set({ playerId: id }),
  displayName: '',
  setDisplayName: (name) => set({ displayName: name }),

  lobbyPlayers: [],
  setLobbyPlayers: (players) => set({ lobbyPlayers: players }),
  addLobbyPlayer: (player) =>
    set((state) => ({
      lobbyPlayers: [...state.lobbyPlayers.filter((p) => p.id !== player.id), player],
    })),
  removeLobbyPlayer: (playerId) =>
    set((state) => ({
      lobbyPlayers: state.lobbyPlayers.filter((p) => p.id !== playerId),
    })),
  hostId: null,
  setHostId: (id) => set({ hostId: id }),

  availableRooms: [],
  setAvailableRooms: (rooms) => set({ availableRooms: rooms }),
  updateAvailableRoom: (payload) =>
    set((state) => {
      if (payload.action === 'added' && payload.room) {
        return { availableRooms: [...state.availableRooms, payload.room] };
      }
      if (payload.action === 'removed') {
        return { availableRooms: state.availableRooms.filter((r) => r.code !== (payload.code ?? payload.room?.code)) };
      }
      if (payload.action === 'updated' && payload.room) {
        return {
          availableRooms: state.availableRooms.map((r) =>
            r.code === payload.room!.code ? payload.room! : r
          ),
        };
      }
      return {};
    }),

  gameState: null,
  setGameState: (gameState) => set({ gameState }),

  narratorMessages: [],
  addNarratorMessage: (message) =>
    set((state) => ({
      narratorMessages: [...state.narratorMessages.slice(-20), message],
    })),

  chatMessages: [],
  addChatMessage: (message) =>
    set((state) => ({
      chatMessages: [...state.chatMessages.slice(-50), message],
    })),

  reset: () =>
    set({
      roomCode: null,
      playerId: null,
      lobbyPlayers: [],
      hostId: null,
      gameState: null,
      narratorMessages: [],
      chatMessages: [],
    }),
}));

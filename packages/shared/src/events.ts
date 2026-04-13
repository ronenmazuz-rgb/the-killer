// === אירועי Socket.IO ===

// קליינט -> שרת
export const CLIENT_EVENTS = {
  ROOM_CREATE: 'room:create',
  ROOM_JOIN: 'room:join',
  ROOMS_SUBSCRIBE: 'rooms:subscribe',
  ROOMS_UNSUBSCRIBE: 'rooms:unsubscribe',
  GAME_START: 'game:start',
  CARDS_REVEALED: 'cards:revealed',
  NIGHT_ACTION: 'night:action',
  DAY_ACCUSE: 'day:accuse',
  DAY_VOTE: 'day:vote',
  DAY_END_DISCUSSION: 'day:end-discussion',
  CHAT_MESSAGE: 'chat:message',
} as const;

// שרת -> קליינט
export const SERVER_EVENTS = {
  ROOM_CREATED: 'room:created',
  ROOM_JOINED: 'room:joined',
  ROOM_PLAYER_JOINED: 'room:player-joined',
  ROOM_PLAYER_LEFT: 'room:player-left',
  ROOM_ERROR: 'room:error',
  ROOMS_LIST: 'rooms:list',
  ROOMS_UPDATED: 'rooms:updated',
  GAME_STATE: 'game:state',
  GAME_NARRATOR: 'game:narrator',
  GAME_OVER: 'game:over',
  CHAT_MESSAGE: 'chat:message',
  ERROR: 'error',
} as const;

// === Payload Types ===

export interface RoomCreatePayload {
  displayName: string;
  password?: string;
}

export interface RoomJoinPayload {
  roomCode: string;
  displayName: string;
  password?: string;
}

export interface RoomCreatedPayload {
  roomCode: string;
  playerId: string;
}

export interface NightActionPayload {
  targetPlayerId: string;
}

export interface AccusePayload {
  targetPlayerId: string;
}

export interface VotePayload {
  guilty: boolean;
}

export interface NarratorPayload {
  message: string;
}

export interface ChatMessagePayload {
  playerId: string;
  displayName: string;
  text: string;
  timestamp: number;
}

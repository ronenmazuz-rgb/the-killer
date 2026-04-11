export const CLIENT_EVENTS = {
  ROOM_CREATE: 'room:create',
  ROOM_JOIN: 'room:join',
  GAME_START: 'game:start',
  CARDS_REVEALED: 'cards:revealed',
  NIGHT_ACTION: 'night:action',
  DAY_ACCUSE: 'day:accuse',
  DAY_VOTE: 'day:vote',
  DAY_END_DISCUSSION: 'day:end-discussion',
  CHAT_MESSAGE: 'chat:message',
} as const;

export const SERVER_EVENTS = {
  ROOM_CREATED: 'room:created',
  ROOM_JOINED: 'room:joined',
  ROOM_PLAYER_JOINED: 'room:player-joined',
  ROOM_PLAYER_LEFT: 'room:player-left',
  ROOM_ERROR: 'room:error',
  GAME_STATE: 'game:state',
  GAME_NARRATOR: 'game:narrator',
  GAME_OVER: 'game:over',
  CHAT_MESSAGE: 'chat:message',
  ERROR: 'error',
} as const;

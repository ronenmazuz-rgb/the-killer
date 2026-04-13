// === תפקידים ===
export enum Role {
  KILLER = 'killer',
  DETECTIVE = 'detective',
  CITIZEN = 'citizen',
}

// === סוגי קלפים ===
export enum CardSuit {
  HEARTS = 'hearts',
  DIAMONDS = 'diamonds',
  CLUBS = 'clubs',
  SPADES = 'spades',
}

export enum CardRank {
  TWO = '2',
  THREE = '3',
  FOUR = '4',
  FIVE = '5',
  SIX = '6',
  SEVEN = '7',
  EIGHT = '8',
  NINE = '9',
  TEN = '10',
  QUEEN = 'Q',
  KING = 'K',
}

export interface Card {
  suit: CardSuit;
  rank: CardRank;
}

// === שלבי משחק ===
export enum Phase {
  WAITING = 'waiting',
  DEALING_CARDS = 'dealing_cards',
  NIGHT_DETECTIVE = 'night_detective',
  NIGHT_KILLER = 'night_killer',
  DAY_ANNOUNCEMENT = 'day_announcement',
  DAY_DISCUSSION = 'day_discussion',
  DAY_ACCUSATION = 'day_accusation',
  DAY_DEFENSE = 'day_defense',
  DAY_VOTING = 'day_voting',
  GAME_OVER = 'game_over',
}

// === שחקן ===
export interface Player {
  id: string;
  displayName: string;
  isAlive: boolean;
  isConnected: boolean;
}

export interface PlayerWithRole extends Player {
  role: Role;
  card: Card;
}

// === סטייט שהקליינט מקבל ===
export interface ClientGameState {
  phase: Phase;
  round: number;
  players: Player[];
  myRole?: Role;
  myCard?: Card;
  accusedPlayerId?: string;
  votes: Record<string, string>; // voterId → targetPlayerId
  killedPlayerId?: string;
  eliminatedPlayerId?: string;
  detectiveResult?: 'killer' | 'citizen';
  winner?: 'citizens' | 'killer';
  allRoles?: Record<string, { role: Role; card: Card }>;
  timeRemaining: number;
  hostId: string;
  myId: string;
}

// === חדר ===
export interface RoomInfo {
  code: string;
  players: Player[];
  hostId: string;
  isGameActive: boolean;
}

// === פריט ברשימת חדרים ===
export interface RoomListItem {
  code: string;
  hostName: string;
  playerCount: number;
  maxPlayers: number;
  hasPassword: boolean;
}

// === תוצאת ניצחון ===
export type Winner = 'citizens' | 'killer';

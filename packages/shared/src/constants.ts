// === מגבלות שחקנים ===
export const MIN_PLAYERS = 4;
export const MAX_PLAYERS = 12;

// === טיימרים (במילישניות) ===
export const TIMERS = {
  CARD_REVEAL: 5000,        // 5 שניות לאנימציית קלף
  DETECTIVE_PHASE: 15000,   // 15 שניות לבלש
  KILLER_PHASE: 15000,      // 15 שניות לרוצח
  DAY_ANNOUNCEMENT: 5000,   // 5 שניות להכרזה
  DEFENSE_PHASE: 30000,     // 30 שניות להגנה (deprecated)
  VOTING_PHASE: 30000,      // 30 שניות להצבעה
  DISCUSSION_PHASE: 60000,  // 60 שניות לדיון חופשי
} as const;

// === קודי חדר ===
export const ROOM_CODE_LENGTH = 6;
export const ROOM_CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // ללא תווים מבלבלים

// === חלוקת תפקידים (MVP - רוצח אחד) ===
export const ROLE_DISTRIBUTION = {
  KILLERS: 1,
  DETECTIVES: 1,
  // השאר אזרחים
} as const;

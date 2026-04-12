/**
 * חישוב מיקומי מושבים מסביב לשולחן אובלי
 * השחקן הנוכחי תמיד בתחתית, המנחה בראש
 */

export interface SeatPosition {
  x: number; // אחוז (0-100)
  y: number; // אחוז (0-100)
  angle: number; // זווית ברדיאנים
}

/**
 * מחשב מיקומי מושבים על אליפסה
 * @param playerCount מספר שחקנים (לא כולל מנחה)
 * @param myIndex האינדקס שלי במערך השחקנים
 * @param isMobile האם מובייל
 * @returns מערך מיקומים — אינדקס 0 = אני (תחתית), השאר בכיוון השעון
 */
export function calculateSeatPositions(
  playerCount: number,
  myIndex: number,
  isMobile = false,
): SeatPosition[] {
  // רדיוסי האליפסה (באחוזים מהמיכל)
  // גדולים יותר כדי שיהיה מקום לעיגולי וידאו גדולים
  const a = isMobile ? 44 : 47; // חצי-ציר אופקי
  const b = isMobile ? 38 : 42; // חצי-ציר אנכי

  const centerX = 50;
  const centerY = 50;

  const positions: SeatPosition[] = [];

  // מפזר N שחקנים על האליפסה
  // השחקן הנוכחי (myIndex) תמיד בתחתית (270° = 3π/2)
  // השחקנים מסודרים בכיוון השעון מהתחתית

  // אנחנו מפזרים שחקנים על 330° (פתח של 30° בראש שמור למנחה)
  // הפיזור הוא סימטרי סביב הציר האנכי
  // השחקן הנוכחי (relIndex 0) תמיד בתחתית (270°)
  const arcGapDeg = 30; // פתח בראש (מעלות) — שמור למנחה
  const totalArcRad = (360 - arcGapDeg) * (Math.PI / 180); // 330° ברדיאנים

  for (let i = 0; i < playerCount; i++) {
    const relativeIndex = (i - myIndex + playerCount) % playerCount;

    let angle: number;
    if (playerCount === 1) {
      angle = (3 * Math.PI) / 2; // תחתית בלבד
    } else {
      // מפזר N שחקנים על 330°, מתחיל ב-270° (תחתית)
      // relIndex 0 = 270°, ממשיך בכיוון ה-RTL (נגד כיוון השעון בתצוגה)
      // כלומר מסתובב ב +totalArc/N כל פעם
      const step = totalArcRad / playerCount;
      const startAngle = (3 * Math.PI) / 2;
      angle = startAngle + step * relativeIndex;
    }

    const x = centerX + a * Math.cos(angle);
    const y = centerY - b * Math.sin(angle);

    positions.push({ x, y, angle });
  }

  return positions;
}

/**
 * מיקום קבוע למנחה — תמיד בראש השולחן
 */
export function getNarratorPosition(isMobile = false): SeatPosition {
  return {
    x: 50,
    y: isMobile ? 3 : 2,
    angle: Math.PI / 2,
  };
}

/**
 * יוצר hash מספרי מ-string (לבחירת אווטאר רנדומלית אבל קבועה)
 */
export function hashStringToNumber(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * בוחר אמוג'י אווטאר לפי ID שחקן
 */
const AVATAR_EMOJIS = [
  '🦊', '🐺', '🦁', '🐯', '🦅', '🦉', '🐍', '🦇',
  '🐻', '🦈', '🐙', '🦎', '🐊', '🦂', '🕷️', '🐞',
  '🦋', '🐝', '🐸', '🐲', '🦄', '🐴', '🐶', '🐱',
];

export function getPlayerAvatar(playerId: string): string {
  const hash = hashStringToNumber(playerId);
  return AVATAR_EMOJIS[hash % AVATAR_EMOJIS.length];
}

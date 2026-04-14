/**
 * חישוב מיקומי מושבים מסביב לשולחן אובלי
 * השחקן הנוכחי תמיד בתחתית, המנחה בראש
 * האלגוריתם מחלק שחקנים בצורה סימטרית — זוגות ימין/שמאל
 */

export interface SeatPosition {
  x: number; // אחוז (0-100)
  y: number; // אחוז (0-100)
  angle: number; // זווית ברדיאנים
}

/**
 * מחשב מיקומי מושבים על אליפסה בצורה סימטרית
 * @param playerCount מספר שחקנים (לא כולל מנחה)
 * @param myIndex האינדקס שלי במערך השחקנים
 * @param isMobile האם מובייל
 * @returns מערך מיקומים — אינדקס 0 = אני (תחתית), השאר בסימטריה
 */
export function calculateSeatPositions(
  playerCount: number,
  myIndex: number,
  isMobile = false,
): SeatPosition[] {
  // רדיוסי האליפסה (באחוזים מהמיכל)
  const a = isMobile ? 40 : 42; // חצי-ציר אופקי
  const b = isMobile ? 32 : 34; // חצי-ציר אנכי

  const centerX = 50;
  const centerY = 50;

  const positions: SeatPosition[] = [];

  // חישוב פרמטרי פיזור סימטרי:
  // - nOthers = מספר שחקנים פרט לי
  // - hasTop = האם יש שחקן אחד שמוצב בדיוק בראש (כשnOthers אי-זוגי)
  // - nPairs = מספר זוגות (ימין + שמאל)
  // - stepDeg = מרווח זוויתי בין זוגות
  const nOthers = playerCount - 1;
  const hasTop = nOthers % 2 === 1;
  const nPairs = Math.floor(nOthers / 2);

  // חלוקת 330° בין כל ה"חריצים" (כולל אני בתחתית)
  // totalDenominator = מספר חריצים = nPairs*2 + (top ? 1 : 0) + 1 (אני)
  const totalDenominator = 2 * nPairs + (hasTop ? 1 : 0) + 1;
  const stepDeg = nOthers > 0 ? 330 / totalDenominator : 0;

  for (let i = 0; i < playerCount; i++) {
    const relIndex = (i - myIndex + playerCount) % playerCount;
    let angleDeg: number;

    if (playerCount === 1) {
      angleDeg = 270; // רק אני — תחתית
    } else if (relIndex === 0) {
      angleDeg = 270; // אני — תמיד בתחתית
    } else if (hasTop && relIndex === nOthers) {
      // שחקן בראש — כשמספר האחרים אי-זוגי, האחרון הולך לראש
      angleDeg = 90;
    } else {
      // זוגות סימטריים:
      // relIndex אי-זוגי (1, 3, 5, ...) → ימין (270° + offset)
      // relIndex זוגי (2, 4, 6, ...) → שמאל (270° - offset)
      const pairNumber = Math.ceil(relIndex / 2); // 1, 1, 2, 2, 3, 3 ...
      const isRight = relIndex % 2 === 1;
      const offset = pairNumber * stepDeg;
      angleDeg = isRight ? 270 + offset : 270 - offset;
    }

    const angle = (angleDeg * Math.PI) / 180;
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

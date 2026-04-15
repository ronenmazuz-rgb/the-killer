'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Phase } from '@the-killer/shared';
import { narratorSpeak } from '@/lib/sounds';

interface NarratorSeatProps {
  phase: Phase;
  round: number;
  killedPlayerName?: string;
  accusedPlayerName?: string;
  eliminatedPlayerName?: string;
  winner?: 'citizens' | 'killer';
  isMobile?: boolean;
}

/**
 * טקסטי המנחה לפי שלב
 */
function getNarratorText(
  phase: Phase,
  round: number,
  killedPlayerName?: string,
  accusedPlayerName?: string,
  eliminatedPlayerName?: string,
  winner?: 'citizens' | 'killer',
): string {
  switch (phase) {
    case 'dealing_cards':
      return 'ברוכים הבאים לעיירה! כעת אני מחלק את הקלפים... גורלכם נחרץ.';
    case 'night_detective':
      return round === 1
        ? 'לילה יורד על העיירה... הבלש מתעורר. פקח את עיניך וחקור!'
        : 'לילה שוב יורד... הבלש, פקח עיניך!';
    case 'night_killer':
      return 'הרוצח מתעורר... בחר את הקורבן הבא שלך!';
    case 'day_announcement':
      if (killedPlayerName) {
        return `בוקר טוב עיירה! בלילה אירע דבר נורא... ${killedPlayerName} נמצא/ה דקור/ה ללא רוח חיים!`;
      }
      return 'בוקר טוב! הלילה עבר בשלום. אף אחד לא נפגע.';
    case 'day_discussion':
      return 'תושבי העיירה, יש לכם 60 שניות לדון! מי לדעתכם הרוצח?';
    case 'day_voting':
      return 'הגיע זמן ההצבעה! בחרו מי לדעתכם הרוצח — השחקן עם הכי הרבה קולות יוצא!';
    case 'game_over':
      if (winner === 'citizens') {
        return 'האזרחים ניצחו! הרוצח נתפס! השלום חזר לעיירה!';
      }
      return 'הרוצח ניצח! העיירה נפלה לידי החושך...';
    default:
      return '';
  }
}

/**
 * שם השלב בעברית
 */
const phaseLabels: Record<string, string> = {
  dealing_cards: '🃏 חלוקת קלפים',
  night_detective: '🌙 לילה',
  night_killer: '🌙 לילה',
  day_announcement: '☀️ בוקר',
  day_discussion: '💬 דיון חופשי',
  day_voting: '🗳️ הצבעה',
  game_over: '🏁 סוף',
};

export default function NarratorSeat({
  phase,
  round,
  killedPlayerName,
  accusedPlayerName,
  eliminatedPlayerName,
  winner,
  isMobile,
}: NarratorSeatProps) {
  const [displayedText, setDisplayedText] = useState('');
  const fullText = getNarratorText(phase, round, killedPlayerName, accusedPlayerName, eliminatedPlayerName, winner);
  const prevPhaseRef = useRef(phase);
  const typingRef = useRef<NodeJS.Timeout | null>(null);

  // typing animation + TTS — מופעל רק כשהשלב או הטקסט משתנה (לא כל render)
  useEffect(() => {
    prevPhaseRef.current = phase;

    // ביטול הקלדה קודמת
    if (typingRef.current) clearInterval(typingRef.current);

    setDisplayedText('');
    let charIndex = 0;

    // הקלדה אות-אות
    typingRef.current = setInterval(() => {
      charIndex++;
      setDisplayedText(fullText.slice(0, charIndex));
      if (charIndex >= fullText.length) {
        if (typingRef.current) clearInterval(typingRef.current);
      }
    }, 40); // 40ms per character

    // TTS — עיכוב קטן כדי שההקלדה תתחיל לפני ההקראה
    if (fullText) {
      setTimeout(() => narratorSpeak(fullText), 400);
    }

    return () => {
      if (typingRef.current) clearInterval(typingRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, fullText]); // ❗ אל תוסיף displayedText — יגרום לgמגמגום!

  const avatarSize = isMobile ? 34 : 40;

  return (
    <div className="w-full flex items-center gap-2 px-3 py-2
      bg-killer-surface/80 backdrop-blur-sm
      border-b border-killer-gold/15 shadow-md"
      style={{ minHeight: isMobile ? 52 : 60 }}
    >
      {/* Badge שלב */}
      <span className="flex-shrink-0 text-[9px] px-1.5 py-0.5 rounded-full
        bg-killer-gold/20 text-killer-gold font-bold border border-killer-gold/30 whitespace-nowrap">
        {phaseLabels[phase] || phase}
        {round > 0 && ` · ${round}`}
      </span>

      {/* אווטאר מנחה */}
      <div
        className="flex-shrink-0 rounded-full flex items-center justify-center
          bg-gradient-to-br from-killer-gold/30 to-killer-surface
          border-2 border-killer-gold/50 shadow-md"
        style={{ width: avatarSize, height: avatarSize }}
      >
        <span style={{ fontSize: avatarSize * 0.45 }}>🎩</span>
      </div>

      {/* טקסט מנחה */}
      <AnimatePresence mode="wait">
        {displayedText && (
          <motion.p
            key={phase}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className={`flex-1 text-killer-text font-medium leading-snug
              ${isMobile ? 'text-[10px]' : 'text-[11px]'}
              line-clamp-2`}
          >
            {displayedText}
            {displayedText.length < fullText.length && (
              <span className="typing-cursor mr-0.5" />
            )}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

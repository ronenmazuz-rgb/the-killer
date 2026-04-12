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
      return 'תושבי העיירה, הגיע הזמן לדון! מי לדעתכם הרוצח?';
    case 'day_defense':
      if (accusedPlayerName) {
        return `${accusedPlayerName} הואשם/ה! זה הזמן להגן על עצמך!`;
      }
      return 'הנאשם/ת, הגן/י על עצמך!';
    case 'day_voting':
      if (accusedPlayerName) {
        return `הגיע זמן ההצבעה! האם ${accusedPlayerName} אשם/ה או חף/ה מפשע?`;
      }
      return 'הגיע זמן ההצבעה!';
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
  day_discussion: '☀️ דיון',
  day_defense: '⚖️ הגנה',
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

  // typing animation + TTS
  useEffect(() => {
    // רק כשהשלב משתנה
    if (phase === prevPhaseRef.current && displayedText === fullText) return;
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

    // TTS
    if (fullText) {
      // עיכוב קטן כדי שההקלדה תתחיל לפני ההקראה
      setTimeout(() => narratorSpeak(fullText), 300);
    }

    return () => {
      if (typingRef.current) clearInterval(typingRef.current);
    };
  }, [phase, fullText, displayedText]);

  const avatarSize = isMobile ? 40 : 56;

  return (
    <div
      className="absolute flex flex-col items-center"
      style={{
        left: '50%',
        top: isMobile ? '1%' : '1%',
        transform: 'translateX(-50%)',
        zIndex: 30,
      }}
    >
      {/* Badge שלב */}
      <div className="mb-1">
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-killer-gold/20 text-killer-gold font-bold border border-killer-gold/30">
          {phaseLabels[phase] || phase}
          {round > 0 && ` · סיבוב ${round}`}
        </span>
      </div>

      {/* אווטאר מנחה */}
      <div
        className="rounded-full flex items-center justify-center
          bg-gradient-to-br from-killer-gold/30 to-killer-surface
          border-2 border-killer-gold/50 shadow-lg"
        style={{ width: avatarSize, height: avatarSize }}
      >
        <span style={{ fontSize: avatarSize * 0.45 }}>🎩</span>
      </div>

      {/* בועת דיבור */}
      <AnimatePresence mode="wait">
        {displayedText && (
          <motion.div
            key={phase}
            initial={{ opacity: 0, y: -5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="mt-2 speech-bubble max-w-[280px] sm:max-w-[360px]"
          >
            <p className={`text-killer-text font-medium leading-relaxed text-center ${
              isMobile ? 'text-[11px]' : 'text-xs'
            }`}>
              {displayedText}
              {displayedText.length < fullText.length && (
                <span className="typing-cursor mr-0.5" />
              )}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* תווית */}
      <span className="text-[9px] text-killer-gold/60 font-medium mt-1">המנחה</span>
    </div>
  );
}

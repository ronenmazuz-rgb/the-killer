'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { Card, Role } from '@the-killer/shared';

interface CardRevealProps {
  card: Card;
  role: Role;
  onComplete?: () => void;
}

const roleColors: Record<string, { glow: string; bg: string; label: string }> = {
  killer: { glow: 'shadow-killer-red-glow/60', bg: 'from-red-950 to-red-900', label: 'רוצח' },
  detective: { glow: 'shadow-killer-blue-glow/60', bg: 'from-blue-950 to-blue-900', label: 'בלש' },
  citizen: { glow: 'shadow-killer-text-dim/30', bg: 'from-gray-800 to-gray-700', label: 'אזרח' },
};

const suitSymbols: Record<string, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

const suitColors: Record<string, string> = {
  hearts: 'text-red-500',
  diamonds: 'text-red-500',
  clubs: 'text-white',
  spades: 'text-white',
};

export default function CardReveal({ card, role, onComplete }: CardRevealProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const colors = roleColors[role];
  const suitSymbol = suitSymbols[card.suit];
  const suitColor = suitColors[card.suit];

  useEffect(() => {
    const timer = setTimeout(() => setIsFlipped(true), 800);
    const completeTimer = setTimeout(() => onComplete?.(), 4000);
    return () => {
      clearTimeout(timer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="text-center">
        {/* קלף */}
        <div className="card-flip w-48 h-72 mx-auto mb-6 cursor-pointer">
          <motion.div
            className="card-flip-inner w-full h-full relative"
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* גב הקלף */}
            <div
              className="absolute inset-0 backface-hidden rounded-xl border-2 border-killer-text-dim/30
                bg-gradient-to-br from-killer-red-dark to-killer-surface flex items-center justify-center"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <div className="w-36 h-56 border-2 border-killer-gold/30 rounded-lg flex items-center justify-center">
                <span className="text-5xl font-black text-killer-gold/40">?</span>
              </div>
            </div>

            {/* פני הקלף */}
            <div
              className={`absolute inset-0 backface-hidden rounded-xl border-2 border-killer-text-dim/20
                bg-gradient-to-br ${colors.bg} flex flex-col items-center justify-between p-4
                shadow-2xl ${colors.glow}`}
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              {/* פינה עליונה */}
              <div className="self-start">
                <p className="text-2xl font-black leading-none">{card.rank}</p>
                <p className={`text-xl ${suitColor}`}>{suitSymbol}</p>
              </div>

              {/* מרכז */}
              <div className="text-center">
                <p className={`text-6xl ${suitColor}`}>{suitSymbol}</p>
                <p className="text-lg font-bold mt-2">{colors.label}</p>
              </div>

              {/* פינה תחתונה */}
              <div className="self-end rotate-180">
                <p className="text-2xl font-black leading-none">{card.rank}</p>
                <p className={`text-xl ${suitColor}`}>{suitSymbol}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* תיאור תפקיד */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isFlipped ? 1 : 0, y: isFlipped ? 0 : 20 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <p className="text-2xl font-bold mb-2">
            {role === 'killer' && '🔪 את/ה הרוצח!'}
            {role === 'detective' && '🔍 את/ה הבלש!'}
            {role === 'citizen' && '👤 את/ה אזרח/ית'}
          </p>
          <p className="text-killer-text-dim">
            {role === 'killer' && 'בלילה תבחר/י את הקורבן הבא. הסתר/י את זהותך!'}
            {role === 'detective' && 'בלילה תוכל/י לבדוק חשוד אחד. עזור/י לעיירה!'}
            {role === 'citizen' && 'עזור/י לגלות מי הרוצח לפני שיהיה מאוחר מדי!'}
          </p>
        </motion.div>
      </div>
    </div>
  );
}

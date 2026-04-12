'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Card, Role } from '@the-killer/shared';

interface MiniCardProps {
  card?: Card;
  role?: Role;
  isFaceUp: boolean;
  size?: 'sm' | 'lg';
  isKilled?: boolean;
}

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

const roleBorders: Record<string, string> = {
  killer: 'ring-2 ring-killer-red/50',
  detective: 'ring-2 ring-killer-blue-glow/50',
  citizen: '',
};

export default function MiniCard({ card, role, isFaceUp, size = 'sm', isKilled }: MiniCardProps) {
  const [showFace, setShowFace] = useState(isFaceUp);

  useEffect(() => {
    setShowFace(isFaceUp);
  }, [isFaceUp]);

  const dimensions = size === 'lg'
    ? 'w-14 h-20 text-xs'
    : 'w-10 h-14 text-[10px]';

  const suitSymbol = card ? suitSymbols[card.suit] : '';
  const suitColor = card ? suitColors[card.suit] : '';

  return (
    <div className={`relative ${dimensions}`}>
      <motion.div
        className="w-full h-full relative"
        animate={{ rotateY: showFace ? 180 : 0 }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* גב הקלף */}
        <div
          className={`absolute inset-0 rounded-md card-back-pattern flex items-center justify-center ${
            isKilled ? 'opacity-60' : ''
          }`}
          style={{ backfaceVisibility: 'hidden' }}
        >
          <span className="text-poker-card-gold/40 font-black" style={{ fontSize: size === 'lg' ? '18px' : '14px' }}>
            ♦
          </span>
        </div>

        {/* פני הקלף */}
        <div
          className={`absolute inset-0 rounded-md bg-gradient-to-br from-gray-100 to-gray-200
            flex flex-col items-center justify-between p-0.5 shadow-md
            ${role ? roleBorders[role] || '' : ''}`}
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          {card && (
            <>
              {/* פינה עליונה */}
              <div className="self-start leading-none">
                <p className={`font-black ${suitColor}`} style={{ fontSize: size === 'lg' ? '12px' : '9px' }}>
                  {card.rank}
                </p>
                <p className={suitColor} style={{ fontSize: size === 'lg' ? '10px' : '7px' }}>
                  {suitSymbol}
                </p>
              </div>

              {/* מרכז */}
              <p className={`${suitColor} font-bold`} style={{ fontSize: size === 'lg' ? '20px' : '14px' }}>
                {suitSymbol}
              </p>

              {/* פינה תחתונה */}
              <div className="self-end rotate-180 leading-none">
                <p className={`font-black ${suitColor}`} style={{ fontSize: size === 'lg' ? '12px' : '9px' }}>
                  {card.rank}
                </p>
                <p className={suitColor} style={{ fontSize: size === 'lg' ? '10px' : '7px' }}>
                  {suitSymbol}
                </p>
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* כתם דם על קלף שנרצח */}
      <AnimatePresence>
        {isKilled && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.7 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
          >
            <div className="w-6 h-6 bg-blood rounded-full blur-[2px]" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

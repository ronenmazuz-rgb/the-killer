'use client';

import { motion } from 'framer-motion';
import type { Role, Card, Winner } from '@the-killer/shared';

interface GameOverModalProps {
  winner: Winner;
  allRoles: Record<string, { role: Role; card: Card }>;
  players: { id: string; displayName: string }[];
  onPlayAgain: () => void;
}

const roleLabels: Record<string, string> = {
  killer: '🔪 רוצח',
  detective: '🔍 בלש',
  citizen: '👤 אזרח',
};

const suitSymbols: Record<string, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

export default function GameOverModal({
  winner,
  allRoles,
  players,
  onPlayAgain,
}: GameOverModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
    >
      <motion.div
        initial={{ scale: 0.8, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 20 }}
        className="bg-killer-surface rounded-2xl p-8 max-w-md w-full border border-killer-text-dim/10"
      >
        {/* כותרת ניצחון */}
        <div className="text-center mb-6">
          <motion.h2
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
            className={`text-4xl font-black mb-2 ${
              winner === 'citizens' ? 'text-green-400' : 'text-killer-red'
            }`}
          >
            {winner === 'citizens' ? '🎉 האזרחים ניצחו!' : '🔪 הרוצח ניצח!'}
          </motion.h2>
          <p className="text-killer-text-dim">
            {winner === 'citizens'
              ? 'הרוצח נתפס! העיירה בטוחה שוב.'
              : 'העיירה נכנעה לרוצח!'}
          </p>
        </div>

        {/* חשיפת כל הקלפים */}
        <div className="space-y-2 mb-6">
          <p className="text-killer-text-dim text-sm font-medium mb-2">
            חשיפת תפקידים:
          </p>
          {players.map((player, i) => {
            const info = allRoles[player.id];
            if (!info) return null;
            return (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.15 }}
                className={`flex items-center justify-between rounded-lg px-4 py-3 ${
                  info.role === 'killer'
                    ? 'bg-red-950/40 border border-killer-red/20'
                    : info.role === 'detective'
                      ? 'bg-blue-950/40 border border-killer-blue-glow/20'
                      : 'bg-killer-bg border border-killer-text-dim/10'
                }`}
              >
                <span className="font-medium">{player.displayName}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{roleLabels[info.role]}</span>
                  <span className="text-xs text-killer-text-dim">
                    {info.card.rank}
                    {suitSymbols[info.card.suit]}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* כפתור */}
        <button onClick={onPlayAgain} className="btn-primary w-full text-lg">
          חזרה ללובי
        </button>
      </motion.div>
    </motion.div>
  );
}

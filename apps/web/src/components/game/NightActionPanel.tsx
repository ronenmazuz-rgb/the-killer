'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Player } from '@the-killer/shared';

interface NightActionPanelProps {
  role: 'detective' | 'killer';
  players: Player[];
  myId: string;
  detectiveResult?: 'killer' | 'citizen';
  onSelectTarget: (targetId: string) => void;
}

export default function NightActionPanel({
  role,
  players,
  myId,
  detectiveResult,
  onSelectTarget,
}: NightActionPanelProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const alivePlayers = players.filter((p) => p.isAlive && p.id !== myId);

  const handleSelect = (playerId: string) => {
    if (selectedId) return; // כבר בחרת
    setSelectedId(playerId);
    onSelectTarget(playerId);
  };

  return (
    <div className="night-overlay">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-lg px-4"
      >
        {/* כותרת */}
        <h2 className="text-3xl font-bold mb-2">
          {role === 'detective' ? '🔍 שלב הבלש' : '🔪 שלב הרוצח'}
        </h2>
        <p className="text-killer-text-dim mb-8">
          {role === 'detective'
            ? 'בחר/י חשוד לבדיקה'
            : 'בחר/י את הקורבן הבא'}
        </p>

        {/* תוצאת בלש */}
        {detectiveResult && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`mb-6 p-4 rounded-xl text-xl font-bold ${
              detectiveResult === 'killer'
                ? 'bg-red-950/80 text-killer-red border border-killer-red/30'
                : 'bg-green-950/80 text-green-400 border border-green-500/30'
            }`}
          >
            {detectiveResult === 'killer' ? '🔪 רוצח נתעב!' : '✓ אזרח תמים'}
          </motion.div>
        )}

        {/* רשת שחקנים */}
        {!detectiveResult && (
          <div className="grid grid-cols-2 gap-3">
            {alivePlayers.map((player) => (
              <motion.button
                key={player.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSelect(player.id)}
                disabled={!!selectedId}
                className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                  selectedId === player.id
                    ? role === 'detective'
                      ? 'border-killer-blue-glow bg-blue-950/50'
                      : 'border-killer-red bg-red-950/50'
                    : 'border-killer-text-dim/20 bg-killer-surface/50 hover:border-killer-text-dim/50'
                } ${selectedId && selectedId !== player.id ? 'opacity-40' : ''}`}
              >
                <p className="text-lg font-bold">{player.displayName}</p>
                {selectedId === player.id && (
                  <p className="text-sm text-killer-text-dim mt-1">
                    {role === 'detective' ? 'נבדק/ת...' : 'נבחר/ה'}
                  </p>
                )}
              </motion.button>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

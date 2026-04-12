'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Player, Phase } from '@the-killer/shared';

interface TableCenterProps {
  phase: Phase;
  isHost: boolean;
  isAlive: boolean;
  myId: string;
  accusedPlayer?: Player;
  votes: Record<string, boolean>;
  isAccused: boolean;
  detectiveResult?: 'killer' | 'citizen';
  showNightAction: boolean;
  nightRole?: 'detective' | 'killer';
  isNightWaiting: boolean;
  onEndDiscussion: () => void;
  onVote: (guilty: boolean) => void;
  isMobile?: boolean;
}

export default function TableCenter({
  phase,
  isHost,
  isAlive,
  myId,
  accusedPlayer,
  votes,
  isAccused,
  detectiveResult,
  showNightAction,
  nightRole,
  isNightWaiting,
  onEndDiscussion,
  onVote,
  isMobile,
}: TableCenterProps) {
  const [hasVoted, setHasVoted] = useState(false);

  // Reset vote state on phase change
  if (phase !== 'day_voting' && hasVoted) {
    setHasVoted(false);
  }

  const totalVotes = Object.keys(votes).length;
  const guiltyCount = Object.values(votes).filter((v) => v).length;
  const innocentCount = totalVotes - guiltyCount;

  return (
    <div
      className="absolute flex items-center justify-center pointer-events-none"
      style={{
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 28,
        width: isMobile ? '70%' : '50%',
        maxWidth: '380px',
      }}
    >
      <AnimatePresence mode="wait">
        {/* === שלב לילה — שחקן פאסיבי === */}
        {isNightWaiting && (
          <motion.div
            key="night-waiting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center pointer-events-auto"
          >
            <p className="text-3xl mb-2">🌙</p>
            <p className="text-killer-text-dim text-sm">
              {!isAlive ? 'צופה מהצד...' : 'עצום/י עיניים...'}
            </p>
          </motion.div>
        )}

        {/* === שלב לילה — פעולה === */}
        {showNightAction && (
          <motion.div
            key="night-action"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center pointer-events-auto"
          >
            <h3 className="text-lg font-bold mb-1">
              {nightRole === 'detective' ? '🔍 בחר/י חשוד' : '🔪 בחר/י קורבן'}
            </h3>
            <p className="text-killer-text-dim text-xs">
              לחץ/י על שחקן בשולחן
            </p>

            {/* תוצאת בלש */}
            {detectiveResult && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`mt-3 px-4 py-2 rounded-xl text-sm font-bold ${
                  detectiveResult === 'killer'
                    ? 'bg-red-950/80 text-killer-red border border-killer-red/30'
                    : 'bg-green-950/80 text-green-400 border border-green-500/30'
                }`}
              >
                {detectiveResult === 'killer' ? '🔪 רוצח!' : '✓ חף מפשע'}
              </motion.div>
            )}
          </motion.div>
        )}

        {/* === הכרזת בוקר === */}
        {phase === 'day_announcement' && (
          <motion.div
            key="announcement"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="text-center pointer-events-auto"
          >
            <p className="text-4xl mb-2">☀️</p>
          </motion.div>
        )}

        {/* === דיון === */}
        {phase === 'day_discussion' && (
          <motion.div
            key="discussion"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center pointer-events-auto"
          >
            <p className="text-sm text-killer-text-dim mb-2">
              💬 לחצו על שחקן כדי להאשים
            </p>
            {isHost && (
              <button
                onClick={onEndDiscussion}
                className="btn-secondary text-xs px-4 py-2"
              >
                סיום דיון → לילה
              </button>
            )}
          </motion.div>
        )}

        {/* === הגנה === */}
        {phase === 'day_defense' && accusedPlayer && (
          <motion.div
            key="defense"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center pointer-events-auto bg-red-950/30 rounded-xl p-4 border border-killer-red/20"
          >
            <h3 className="text-base font-bold text-killer-red mb-1">
              ⚖️ {accusedPlayer.displayName} על הכוונת!
            </h3>
            <p className="text-killer-text-dim text-xs">
              {isAccused ? 'הגן/י על עצמך!' : 'ממתינים להגנה...'}
            </p>
          </motion.div>
        )}

        {/* === הצבעה === */}
        {phase === 'day_voting' && accusedPlayer && (
          <motion.div
            key="voting"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="text-center pointer-events-auto bg-killer-surface/80 rounded-xl p-4 border border-killer-text-dim/20"
          >
            <h3 className="text-sm font-bold mb-2">
              האם {accusedPlayer.displayName} אשם/ה?
            </h3>

            {/* ספירת קולות */}
            <div className="flex justify-center gap-6 mb-3">
              <div className="text-center">
                <p className="text-killer-red font-bold text-xl">{guiltyCount}</p>
                <p className="text-killer-text-dim text-[10px]">אשם/ה</p>
              </div>
              <div className="text-center">
                <p className="text-green-400 font-bold text-xl">{innocentCount}</p>
                <p className="text-killer-text-dim text-[10px]">חף/ה</p>
              </div>
            </div>

            {/* כפתורי הצבעה */}
            {isAlive && !isAccused && !hasVoted && (
              <div className={`flex gap-2 ${isMobile ? 'flex-col' : ''}`}>
                <button
                  onClick={() => { setHasVoted(true); onVote(true); }}
                  className="flex-1 bg-red-900/50 hover:bg-red-800/60 border border-killer-red/30
                    rounded-lg py-2 text-sm font-bold text-killer-red transition-all"
                >
                  אשם/ה 👎
                </button>
                <button
                  onClick={() => { setHasVoted(true); onVote(false); }}
                  className="flex-1 bg-green-900/30 hover:bg-green-800/40 border border-green-500/30
                    rounded-lg py-2 text-sm font-bold text-green-400 transition-all"
                >
                  חף/ה 👍
                </button>
              </div>
            )}

            {hasVoted && (
              <p className="text-killer-text-dim text-xs mt-1">✓ הצבעתך נרשמה</p>
            )}
            {isAccused && (
              <p className="text-killer-text-dim text-xs mt-1">את/ה הנאשם/ת</p>
            )}
          </motion.div>
        )}

        {/* === שחקן מת === */}
        {!isAlive && phase !== 'game_over' &&
          !isNightWaiting &&
          phase !== 'day_announcement' && (
          <motion.div
            key="dead"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center pointer-events-auto"
          >
            <p className="text-killer-text-dim text-xs">💀 צופה בשקט...</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

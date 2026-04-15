'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Player, Phase } from '@the-killer/shared';

interface TableCenterProps {
  phase: Phase;
  isHost: boolean;
  isAlive: boolean;
  myId: string;
  alivePlayers: Player[]; // כל השחקנים החיים (לרשימת הצבעה)
  votes: Record<string, string>; // voterId → targetId
  detectiveResult?: 'killer' | 'citizen';
  showNightAction: boolean;
  nightRole?: 'detective' | 'killer';
  isNightWaiting: boolean;
  discussionTimeRemaining?: number; // מילישניות שנשארו לדיון
  onEndDiscussion: () => void;
  onVote: (targetPlayerId: string) => void;
  isMobile?: boolean;
}

/**
 * פורמט שניות → mm:ss
 */
function formatTime(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function TableCenter({
  phase,
  isHost,
  isAlive,
  myId,
  alivePlayers,
  votes,
  detectiveResult,
  showNightAction,
  nightRole,
  isNightWaiting,
  discussionTimeRemaining,
  onEndDiscussion,
  onVote,
  isMobile,
}: TableCenterProps) {
  const [myVote, setMyVote] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(discussionTimeRemaining ?? 0);

  // Reset vote on phase change
  useEffect(() => {
    if (phase !== 'day_voting') {
      setMyVote(null);
    }
  }, [phase]);

  // Countdown timer for discussion phase
  useEffect(() => {
    if (phase !== 'day_discussion' || !discussionTimeRemaining) {
      setTimeLeft(discussionTimeRemaining ?? 0);
      return;
    }

    setTimeLeft(discussionTimeRemaining);
    const interval = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, discussionTimeRemaining]);

  // קולות שקיבל כל שחקן בהצבעה
  const voteCountForPlayer = (playerId: string): number =>
    Object.values(votes).filter((v) => v === playerId).length;

  const totalVotes = Object.keys(votes).length;
  const isUrgent = timeLeft < 15000 && timeLeft > 0;

  // שחקנים שניתן להצביע עליהם = כל השחקנים החיים פרט לי
  const votablePlayers = alivePlayers.filter((p) => p.id !== myId);

  return (
    <div
      className="w-full flex items-center justify-center
        bg-killer-surface/75 backdrop-blur-sm border-t border-killer-text-dim/15"
      style={{ minHeight: 56, paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="w-full max-w-sm px-4 py-2">
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
            <p className="text-killer-text-dim text-xs">לחץ/י על שחקן בשולחן</p>

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

        {/* === דיון חופשי — 60 שניות עם ספירה לאחור === */}
        {phase === 'day_discussion' && (
          <motion.div
            key="discussion"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center pointer-events-auto w-full"
          >
            {/* שעון ספירה לאחור */}
            <motion.div
              className={`text-4xl font-bold mb-2 font-mono ${
                isUrgent ? 'text-killer-red' : 'text-killer-gold'
              }`}
              animate={isUrgent ? { scale: [1, 1.05, 1] } : {}}
              transition={{ repeat: Infinity, duration: 1 }}
            >
              {formatTime(timeLeft)}
            </motion.div>
            <p className="text-killer-text-dim text-xs mb-3">💬 זמן לדון — מי הרוצח?</p>
            {isHost && (
              <button
                onClick={onEndDiscussion}
                className="btn-secondary text-xs px-4 py-2"
              >
                דלג להצבעה →
              </button>
            )}
          </motion.div>
        )}

        {/* === הצבעה — כל שחקן חי = מועמד === */}
        {phase === 'day_voting' && (
          <motion.div
            key="voting"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="w-full pointer-events-auto bg-killer-surface/85 rounded-xl p-3 border border-killer-text-dim/20"
          >
            <h3 className="text-sm font-bold mb-2 text-center">
              🗳️ מי הרוצח? ({totalVotes}/{alivePlayers.length} הצביעו)
            </h3>

            {/* רשימת מועמדים */}
            {isAlive && !myVote ? (
              <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
                {votablePlayers.map((player) => (
                  <button
                    key={player.id}
                    onClick={() => {
                      setMyVote(player.id);
                      onVote(player.id);
                    }}
                    className="flex items-center justify-between px-3 py-2 rounded-lg
                      bg-killer-bg/60 hover:bg-killer-red/20 border border-white/10
                      hover:border-killer-red/40 transition-all text-sm font-medium text-left"
                  >
                    <span>{player.displayName}</span>
                    {voteCountForPlayer(player.id) > 0 && (
                      <span className="text-killer-red text-xs font-bold">
                        {voteCountForPlayer(player.id)} 🗳️
                      </span>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              /* אחרי הצבעה — הצג תוצאות */
              <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
                {alivePlayers.map((player) => {
                  const count = voteCountForPlayer(player.id);
                  const isLeading = count > 0 && count === Math.max(...alivePlayers.map(p => voteCountForPlayer(p.id)));
                  return (
                    <div
                      key={player.id}
                      className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs ${
                        isLeading
                          ? 'bg-killer-red/20 border border-killer-red/40 text-killer-red font-bold'
                          : 'bg-killer-bg/40 border border-white/5 text-killer-text-dim'
                      }`}
                    >
                      <span>{player.displayName}</span>
                      <span>{count > 0 ? `${count} 🗳️` : '—'}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {myVote && (
              <p className="text-killer-text-dim text-xs mt-2 text-center">
                ✓ הצבעתך נרשמה
              </p>
            )}
            {!isAlive && (
              <p className="text-killer-text-dim text-xs mt-2 text-center">
                💀 צופה בהצבעה
              </p>
            )}
          </motion.div>
        )}

        {/* === שחקן מת (לא בהצבעה ולא בלילה) === */}
        {!isAlive && phase !== 'game_over' &&
          !isNightWaiting && phase !== 'day_announcement' &&
          phase !== 'day_voting' && (
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
    </div>
  );
}

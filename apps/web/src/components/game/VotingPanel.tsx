'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Player, Phase } from '@the-killer/shared';

interface VotingPanelProps {
  phase: Phase;
  accusedPlayer: Player | undefined;
  players: Player[];
  myId: string;
  votes: Record<string, boolean>;
  onAccuse: (targetId: string) => void;
  onVote: (guilty: boolean) => void;
}

export default function VotingPanel({
  phase,
  accusedPlayer,
  players,
  myId,
  votes,
  onAccuse,
  onVote,
}: VotingPanelProps) {
  const [hasVoted, setHasVoted] = useState(false);
  const alivePlayers = players.filter((p) => p.isAlive && p.id !== myId);
  const myPlayer = players.find((p) => p.id === myId);
  const isAlive = myPlayer?.isAlive ?? false;
  const isAccused = myId === accusedPlayer?.id;

  // שלב האשמה - בחירת חשוד
  if (phase === 'day_discussion' && isAlive) {
    return (
      <div className="bg-killer-surface/80 rounded-xl p-4 border border-killer-text-dim/10">
        <h3 className="font-bold mb-3 text-lg">האשם/י מישהו</h3>
        <div className="grid grid-cols-2 gap-2">
          {alivePlayers.map((player) => (
            <button
              key={player.id}
              onClick={() => onAccuse(player.id)}
              className="bg-killer-bg hover:bg-killer-red-dark/30 border border-killer-text-dim/20
                hover:border-killer-red/50 rounded-lg p-3 text-sm font-medium transition-all"
            >
              {player.displayName}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // שלב הגנה
  if (phase === 'day_defense' && accusedPlayer) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-red-950/30 rounded-xl p-6 border border-killer-red/20 text-center"
      >
        <h3 className="text-xl font-bold mb-2 text-killer-red">
          {accusedPlayer.displayName} על הכוונת!
        </h3>
        <p className="text-killer-text-dim">
          {isAccused
            ? 'זה הזמן שלך להגן על עצמך! דבר/י!'
            : `${accusedPlayer.displayName} מגן/ה על עצמו/ה...`}
        </p>
      </motion.div>
    );
  }

  // שלב הצבעה
  if (phase === 'day_voting' && accusedPlayer) {
    const totalVotes = Object.keys(votes).length;
    const guiltyCount = Object.values(votes).filter((v) => v).length;
    const innocentCount = totalVotes - guiltyCount;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-killer-surface/80 rounded-xl p-6 border border-killer-text-dim/10"
      >
        <h3 className="text-xl font-bold mb-2 text-center">
          האם {accusedPlayer.displayName} אשם/ה?
        </h3>

        {/* תוצאות */}
        <div className="flex justify-center gap-8 my-4 text-lg">
          <div className="text-center">
            <p className="text-killer-red font-bold text-2xl">{guiltyCount}</p>
            <p className="text-killer-text-dim text-sm">אשם/ה</p>
          </div>
          <div className="text-center">
            <p className="text-green-400 font-bold text-2xl">{innocentCount}</p>
            <p className="text-killer-text-dim text-sm">חף/ה</p>
          </div>
        </div>

        {/* כפתורי הצבעה */}
        {isAlive && !isAccused && !hasVoted && (
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => { setHasVoted(true); onVote(true); }}
              className="flex-1 bg-red-900/50 hover:bg-red-800/60 border border-killer-red/30
                rounded-lg py-3 font-bold text-killer-red transition-all"
            >
              אשם/ה 👎
            </button>
            <button
              onClick={() => { setHasVoted(true); onVote(false); }}
              className="flex-1 bg-green-900/30 hover:bg-green-800/40 border border-green-500/30
                rounded-lg py-3 font-bold text-green-400 transition-all"
            >
              חף/ה מפשע 👍
            </button>
          </div>
        )}

        {hasVoted && (
          <p className="text-center text-killer-text-dim mt-3">הצבעתך נרשמה!</p>
        )}

        {isAccused && (
          <p className="text-center text-killer-text-dim mt-3">
            את/ה הנאשם/ת - לא ניתן להצביע
          </p>
        )}
      </motion.div>
    );
  }

  return null;
}

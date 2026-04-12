'use client';

import { motion } from 'framer-motion';
import type { Player, Card, Role } from '@the-killer/shared';
import MiniCard from './MiniCard';
import MiniVideo from './MiniVideo';
import KillAnimation from './KillAnimation';
import BloodSplatter from './BloodSplatter';
import { getPlayerAvatar } from '@/lib/seatPositions';

interface PlayerSeatProps {
  player: Player;
  isSelf: boolean;
  myRole?: Role;
  myCard?: Card;
  position: { x: number; y: number };
  isTargetable: boolean;
  isTargetableBlue?: boolean;
  isSelected: boolean;
  isAccused: boolean;
  isDead: boolean;
  isBeingKilled?: boolean;
  hasVoted?: boolean;
  voteValue?: boolean;
  onSelect?: (playerId: string) => void;
  videoStream?: MediaStream | null;
  isMobile?: boolean;
}

const roleLabels: Record<string, string> = {
  killer: '🔪',
  detective: '🔍',
  citizen: '👤',
};

export default function PlayerSeat({
  player,
  isSelf,
  myRole,
  myCard,
  position,
  isTargetable,
  isTargetableBlue,
  isSelected,
  isAccused,
  isDead,
  isBeingKilled,
  hasVoted,
  voteValue,
  onSelect,
  videoStream,
  isMobile,
}: PlayerSeatProps) {
  const avatar = getPlayerAvatar(player.id);
  const avatarSize = isMobile ? 44 : 64;
  const cardSize = isSelf ? 'lg' : 'sm';

  const handleClick = () => {
    if (isTargetable && onSelect) {
      onSelect(player.id);
    }
  };

  // CSS classes לפי מצב
  const seatClasses = [
    isTargetable && !isTargetableBlue && 'seat-targetable',
    isTargetableBlue && 'seat-targetable-blue',
    isAccused && 'seat-accused',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <motion.div
      className="absolute flex flex-col items-center"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: isSelf ? 25 : isBeingKilled ? 35 : 20,
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      {/* מיכל ראשי — אווטאר + קלף */}
      <div
        className={`relative flex flex-col items-center gap-1 ${seatClasses}
          ${isTargetable ? 'cursor-pointer' : ''}
          ${isDead ? 'opacity-40 grayscale' : ''}
          rounded-xl p-1.5 transition-all duration-300`}
        onClick={handleClick}
        role={isTargetable ? 'button' : undefined}
        tabIndex={isTargetable ? 0 : undefined}
      >
        {/* אווטאר */}
        <div className="relative">
          <div
            className={`rounded-full flex items-center justify-center
              bg-killer-surface border-2 transition-all duration-300
              ${isSelf ? 'border-killer-gold/60' : 'border-killer-text-dim/30'}
              ${isSelected ? 'border-killer-red ring-2 ring-killer-red/40' : ''}
              ${isAccused ? 'border-red-500' : ''}`}
            style={{ width: avatarSize, height: avatarSize }}
          >
            <span style={{ fontSize: avatarSize * 0.5 }}>{avatar}</span>
          </div>

          {/* וידאו קטן בפינה */}
          {videoStream && (
            <div className="absolute -bottom-1 -right-1">
              <MiniVideo
                stream={videoStream}
                isLocal={isSelf}
                size={isMobile ? 24 : 32}
              />
            </div>
          )}

          {/* סטטוס */}
          <div
            className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border border-killer-bg ${
              !player.isConnected
                ? 'bg-yellow-500'
                : isDead
                  ? 'bg-red-600'
                  : 'bg-green-500'
            }`}
          />

          {/* כתם דם על שחקן מת */}
          {isDead && !isBeingKilled && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-2xl opacity-70">💀</span>
            </div>
          )}

          {/* אנימציית רצח */}
          <KillAnimation active={!!isBeingKilled} />

          {/* טיפות דם מיובשות (נשארות אחרי רצח) */}
          {isDead && <BloodSplatter active={isDead} count={5} />}
        </div>

        {/* קלף */}
        <MiniCard
          card={isSelf ? myCard : undefined}
          role={isSelf ? myRole : undefined}
          isFaceUp={isSelf}
          size={cardSize as 'sm' | 'lg'}
          isKilled={isDead}
        />

        {/* שם + badge */}
        <div className="flex flex-col items-center gap-0.5 mt-0.5">
          <span
            className={`font-medium text-killer-text truncate max-w-[80px] text-center leading-tight ${
              isMobile ? 'text-[10px]' : 'text-xs'
            } ${isDead ? 'line-through text-killer-text-dim' : ''}`}
          >
            {player.displayName}
            {isSelf && ' (אתה)'}
          </span>

          {/* badge תפקיד — רק לעצמי */}
          {isSelf && myRole && (
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                myRole === 'killer'
                  ? 'bg-red-950/60 text-killer-red'
                  : myRole === 'detective'
                    ? 'bg-blue-950/60 text-killer-blue-glow'
                    : 'bg-gray-800/60 text-killer-text-dim'
              }`}
            >
              {roleLabels[myRole]}
            </span>
          )}
        </div>

        {/* אינדיקטור הצבעה */}
        {hasVoted && voteValue !== undefined && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-2 -left-2 text-lg"
          >
            {voteValue ? '👎' : '👍'}
          </motion.span>
        )}
      </div>
    </motion.div>
  );
}

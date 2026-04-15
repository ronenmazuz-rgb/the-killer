'use client';

import { motion, AnimatePresence } from 'framer-motion';
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

  // עיגול וידאו גדול — לב הממשק
  const circleSize = isMobile ? 72 : 128;

  const handleClick = () => {
    if (isTargetable && onSelect) onSelect(player.id);
  };

  // גלאות מצב לצבע הגבול
  const ringColor = isAccused
    ? 'border-red-500 ring-4 ring-red-500/40'
    : isSelected
      ? 'border-killer-red ring-4 ring-killer-red/40'
      : isTargetableBlue
        ? 'border-killer-blue-glow ring-4 ring-killer-blue-glow/30'
        : isTargetable
          ? 'border-killer-red ring-4 ring-killer-red/30'
          : isSelf
            ? 'border-killer-gold/70'
            : 'border-white/20';

  // CSS classes לאפקטי pulse
  const pulseClass = isTargetable && !isTargetableBlue
    ? 'seat-targetable'
    : isTargetableBlue
      ? 'seat-targetable-blue'
      : isAccused
        ? 'seat-accused'
        : '';

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
      transition={{ duration: 0.45, delay: 0.1 }}
    >
      {/* עיגול הוידאו — האלמנט הראשי */}
      <div
        className={`relative rounded-full overflow-hidden border-3 border-[3px] transition-all duration-300
          ${ringColor} ${pulseClass}
          ${isTargetable ? 'cursor-pointer' : ''}
          ${isDead ? 'opacity-40 grayscale' : ''}
          bg-killer-surface shadow-xl`}
        style={{ width: circleSize, height: circleSize }}
        onClick={handleClick}
        role={isTargetable ? 'button' : undefined}
        tabIndex={isTargetable ? 0 : undefined}
      >
        {/* וידאו / אמוג'י */}
        {videoStream ? (
          <MiniVideo stream={videoStream} isLocal={isSelf} size={circleSize} />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span style={{ fontSize: circleSize * 0.44 }}>{avatar}</span>
          </div>
        )}

        {/* שם — overlay בתחתית העיגול */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-[2px] py-1 text-center">
          <span
            className={`font-semibold text-white truncate block leading-tight px-1
              ${isMobile ? 'text-[10px]' : 'text-[11px]'}`}
          >
            {player.displayName}{isSelf ? ' ✦' : ''}
          </span>
        </div>

        {/* תפקיד badge — overlay פינה עליונה שמאל (רק לעצמי) */}
        {isSelf && myRole && (
          <div className={`absolute top-1.5 left-1.5 text-[13px] leading-none
            rounded-full w-6 h-6 flex items-center justify-center
            ${myRole === 'killer' ? 'bg-red-900/80' : myRole === 'detective' ? 'bg-blue-900/80' : 'bg-gray-800/80'}`}>
            {roleLabels[myRole]}
          </div>
        )}

        {/* 💀 על מת */}
        {isDead && !isBeingKilled && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-4xl opacity-80">💀</span>
          </div>
        )}

        {/* אנימציית רצח */}
        <KillAnimation active={!!isBeingKilled} />

        {/* דם */}
        {isDead && <BloodSplatter active={isDead} count={5} />}
      </div>

      {/* נקודת סטטוס */}
      <div
        className={`absolute -top-0.5 right-2 w-3.5 h-3.5 rounded-full border-2 border-killer-bg ${
          !player.isConnected ? 'bg-yellow-400' : isDead ? 'bg-red-600' : 'bg-green-400'
        }`}
      />

      {/* קלף — מתחת לעיגול */}
      <div className="mt-1.5">
        <MiniCard
          card={isSelf ? myCard : undefined}
          role={isSelf ? myRole : undefined}
          isFaceUp={isSelf}
          size={isSelf ? 'lg' : 'sm'}
          isKilled={isDead}
        />
      </div>

      {/* אינדיקטור הצבעה — מראה שהשחקן הצביע */}
      <AnimatePresence>
        {hasVoted && (
          <motion.span
            key="vote"
            initial={{ scale: 0, y: -10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0 }}
            className="absolute -top-3 -left-1 text-xl drop-shadow-lg"
          >
            🗳️
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

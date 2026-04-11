'use client';

import type { Player } from '@the-killer/shared';

interface PlayerListProps {
  players: Player[];
  myId: string;
}

export default function PlayerList({ players, myId }: PlayerListProps) {
  return (
    <div className="bg-killer-surface/60 rounded-xl p-4 border border-killer-text-dim/10">
      <h3 className="text-sm font-bold text-killer-text-dim mb-3">
        שחקנים ({players.filter((p) => p.isAlive).length}/{players.length})
      </h3>
      <div className="space-y-1.5">
        {players.map((player) => (
          <div
            key={player.id}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all ${
              player.isAlive
                ? 'bg-killer-bg/50'
                : 'bg-killer-bg/20 opacity-50'
            }`}
          >
            {/* סטטוס */}
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
              !player.isConnected
                ? 'bg-yellow-500'
                : player.isAlive
                  ? 'bg-green-500'
                  : 'bg-red-600'
            }`} />

            {/* שם */}
            <span className={`flex-1 font-medium ${
              !player.isAlive ? 'line-through text-killer-text-dim' : ''
            }`}>
              {player.displayName}
              {player.id === myId && ' (את/ה)'}
            </span>

            {/* סימונים */}
            {!player.isAlive && (
              <span className="text-xs text-killer-red">💀</span>
            )}
            {!player.isConnected && (
              <span className="text-xs text-yellow-500">מנותק</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

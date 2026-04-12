'use client';

import { useState } from 'react';
import { Phase } from '@the-killer/shared';
import type { Player, Card, Role } from '@the-killer/shared';
import PokerTable from '@/components/game/PokerTable';
import NarratorSeat from '@/components/game/NarratorSeat';
import PlayerSeat from '@/components/game/PlayerSeat';
import TableCenter from '@/components/game/TableCenter';
import MediaControls from '@/components/game/MediaControls';

// Mock data
const mockPlayers: Player[] = [
  { id: 'me', displayName: 'אני', isAlive: true, isConnected: true },
  { id: 'p2', displayName: 'דני', isAlive: true, isConnected: true },
  { id: 'p3', displayName: 'מיכל', isAlive: true, isConnected: true },
  { id: 'p4', displayName: 'יוסי', isAlive: false, isConnected: true },
  { id: 'p5', displayName: 'שרה', isAlive: true, isConnected: true },
  { id: 'p6', displayName: 'אבי', isAlive: true, isConnected: false },
];

const mockCard: Card = { suit: 'hearts' as any, rank: 'Q' as any };
const mockRole: Role = 'killer' as any;

import { calculateSeatPositions } from '@/lib/seatPositions';

export default function TestTable() {
  const [phase, setPhase] = useState<Phase>(Phase.DAY_DISCUSSION);
  const [isMobile] = useState(false);
  const [killingPlayer, setKillingPlayer] = useState<string | null>(null);

  const myIndex = 0;
  const positions = calculateSeatPositions(mockPlayers.length, myIndex, isMobile);

  const isNight = phase === Phase.NIGHT_DETECTIVE || phase === Phase.NIGHT_KILLER;

  return (
    <div className="min-h-screen flex flex-col">
      {/* בקרי בדיקה */}
      <div className="fixed top-2 right-2 z-50 bg-killer-surface/90 rounded-lg p-3 border border-killer-text-dim/20 text-xs space-y-1">
        <p className="font-bold text-killer-gold mb-2">🧪 בדיקת שולחן</p>
        <div className="flex flex-wrap gap-1">
          {[
            Phase.DAY_DISCUSSION,
            Phase.DAY_DEFENSE,
            Phase.DAY_VOTING,
            Phase.DAY_ANNOUNCEMENT,
            Phase.NIGHT_DETECTIVE,
            Phase.NIGHT_KILLER,
          ].map((p) => (
            <button
              key={p}
              onClick={() => setPhase(p)}
              className={`px-2 py-1 rounded text-[10px] ${
                phase === p ? 'bg-killer-red text-white' : 'bg-killer-bg text-killer-text-dim hover:bg-killer-surface'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <button
          onClick={() => {
            setKillingPlayer(killingPlayer ? null : 'p4');
          }}
          className="mt-1 px-2 py-1 rounded bg-red-900 text-white text-[10px]"
        >
          🔪 {killingPlayer ? 'עצור רצח' : 'הפעל אנימציית רצח'}
        </button>
      </div>

      {/* שכבת לילה */}
      {isNight && (
        <div className="fixed inset-0 bg-killer-night/90 z-10 transition-opacity duration-1000" />
      )}

      {/* שולחן */}
      <div className="relative z-20 w-full h-screen flex items-center justify-center">
        <PokerTable isNight={isNight} isMobile={isMobile}>
          <NarratorSeat
            phase={phase}
            round={1}
            killedPlayerName={killingPlayer ? 'יוסי' : undefined}
            accusedPlayerName={phase === Phase.DAY_DEFENSE ? 'דני' : undefined}
            isMobile={isMobile}
          />

          {mockPlayers.map((player, index) => {
            const relIndex = (index - myIndex + mockPlayers.length) % mockPlayers.length;
            const pos = positions[relIndex];
            if (!pos) return null;

            return (
              <PlayerSeat
                key={player.id}
                player={player}
                isSelf={player.id === 'me'}
                myRole={player.id === 'me' ? mockRole : undefined}
                myCard={player.id === 'me' ? mockCard : undefined}
                position={pos}
                isTargetable={phase === Phase.DAY_DISCUSSION && player.id !== 'me' && player.isAlive}
                isTargetableBlue={phase === Phase.NIGHT_DETECTIVE && player.id !== 'me' && player.isAlive}
                isSelected={false}
                isAccused={phase === Phase.DAY_DEFENSE && player.id === 'p2'}
                isDead={!player.isAlive}
                isBeingKilled={killingPlayer === player.id}
                onSelect={(id) => console.log('Selected:', id)}
                isMobile={isMobile}
              />
            );
          })}

          <TableCenter
            phase={phase}
            isHost={true}
            isAlive={true}
            myId="me"
            accusedPlayer={phase === Phase.DAY_DEFENSE || phase === Phase.DAY_VOTING ? mockPlayers[1] : undefined}
            votes={{ p3: true, p5: false }}
            isAccused={false}
            showNightAction={phase === Phase.NIGHT_DETECTIVE || phase === Phase.NIGHT_KILLER}
            nightRole={phase === Phase.NIGHT_DETECTIVE ? 'detective' : phase === Phase.NIGHT_KILLER ? 'killer' : undefined}
            isNightWaiting={false}
            onEndDiscussion={() => console.log('End discussion')}
            onVote={(v) => console.log('Vote:', v)}
            isMobile={isMobile}
          />
        </PokerTable>
      </div>

      <MediaControls
        isMicOn={true}
        isCameraOn={true}
        onToggleMic={() => {}}
        onToggleCamera={() => {}}
      />
    </div>
  );
}

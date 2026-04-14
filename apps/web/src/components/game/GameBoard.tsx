'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Phase } from '@the-killer/shared';
import { useGameStore } from '@/stores/gameStore';
import { useSocket } from '@/hooks/useSocket';
import { useWebRTC } from '@/hooks/useWebRTC';
import { calculateSeatPositions } from '@/lib/seatPositions';
import { SoundManager } from '@/lib/sounds';
import CardReveal from './CardReveal';
import GameOverModal from './GameOverModal';
import PokerTable from './PokerTable';
import NarratorSeat from './NarratorSeat';
import PlayerSeat from './PlayerSeat';
import TableCenter from './TableCenter';
import MediaControls from './MediaControls';

export default function GameBoard() {
  const { gameState, narratorMessages, roomCode } = useGameStore();
  const { nightAction, vote, endDiscussion } = useSocket();
  const [cardRevealed, setCardRevealed] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [killedPlayerId, setKilledPlayerId] = useState<string | null>(null);
  const [showKillAnim, setShowKillAnim] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { localStream, remoteStreams, mediaError, isMicOn, isCameraOn, toggleMic, toggleCamera } =
    useWebRTC(roomCode ?? null);

  // בדיקת מובייל
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // טעינת סאונדים מראש
  useEffect(() => {
    SoundManager.preload();
  }, []);

  // === סאונד לפי שלב ===
  useEffect(() => {
    if (!gameState) return;
    const { phase } = gameState;

    switch (phase) {
      case Phase.NIGHT_DETECTIVE:
      case Phase.NIGHT_KILLER:
        SoundManager.play('heartbeat', 0.3);
        break;
      case Phase.DAY_ANNOUNCEMENT:
        if (gameState.killedPlayerId) {
          // עיכוב לאנימציית הרצח
          setTimeout(() => SoundManager.play('knifeStab'), 800);
          setTimeout(() => SoundManager.play('crowdGasp', 0.6), 2000);
        }
        break;
      case Phase.DAY_DISCUSSION:
        break;
      case Phase.DAY_VOTING:
        SoundManager.setAmbience('tension');
        SoundManager.play('gavel');
        break;
      case Phase.DEALING_CARDS:
        SoundManager.play('cardDeal');
        break;
      case Phase.GAME_OVER:
        SoundManager.setAmbience(null);
        if (gameState.winner === 'citizens') {
          SoundManager.play('victory');
        } else {
          SoundManager.play('defeat');
        }
        break;
    }
  }, [gameState?.phase]);

  // === איפוס בחירת מטרה בתחילת כל לילה ===
  useEffect(() => {
    if (
      gameState?.phase === Phase.NIGHT_DETECTIVE ||
      gameState?.phase === Phase.NIGHT_KILLER
    ) {
      setSelectedTarget(null);
    }
  }, [gameState?.phase, gameState?.round]);

  // === אנימציית רצח ===
  useEffect(() => {
    if (!gameState) return;
    if (gameState.phase === Phase.DAY_ANNOUNCEMENT && gameState.killedPlayerId) {
      setKilledPlayerId(gameState.killedPlayerId);
      setShowKillAnim(true);
      // האנימציה נמשכת 4 שניות
      const timer = setTimeout(() => setShowKillAnim(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [gameState?.phase, gameState?.killedPlayerId]);

  if (!gameState) return null;

  const {
    phase,
    round,
    players,
    myRole,
    myCard,
    myId,
    hostId,
    votes,
    detectiveResult,
    winner,
    allRoles,
  } = gameState;

  const myPlayer = players.find((p) => p.id === myId);
  const isAlive = myPlayer?.isAlive ?? false;
  const isHost = myId === hostId;

  // חשיפת קלף
  if (phase === Phase.DEALING_CARDS && myCard && myRole && !cardRevealed) {
    return (
      <CardReveal
        card={myCard}
        role={myRole}
        onComplete={() => setCardRevealed(true)}
      />
    );
  }

  // סוף משחק
  if (phase === Phase.GAME_OVER && winner && allRoles) {
    return (
      <GameOverModal
        winner={winner}
        allRoles={allRoles}
        players={players}
        onPlayAgain={() => {
          window.location.href = '/';
        }}
      />
    );
  }

  // === חישוב מושבים ===
  const myIndex = players.findIndex((p) => p.id === myId);
  const seatPositions = calculateSeatPositions(players.length, myIndex >= 0 ? myIndex : 0, isMobile);

  // === מצבי שלב ===
  const isNight = phase === Phase.NIGHT_DETECTIVE || phase === Phase.NIGHT_KILLER;
  const showDetectiveAction = phase === Phase.NIGHT_DETECTIVE && myRole === 'detective' && isAlive;
  const showKillerAction = phase === Phase.NIGHT_KILLER && myRole === 'killer' && isAlive;
  const showNightAction = showDetectiveAction || showKillerAction;
  const isNightWaiting = isNight && !showNightAction;
  const isDayPhase = phase === Phase.DAY_DISCUSSION ||
    phase === Phase.DAY_VOTING || phase === Phase.DAY_ANNOUNCEMENT;

  // === מי ניתן לבחירה (רק בלילה) ===
  const getTargetable = (playerId: string): boolean => {
    if (playerId === myId) return false;
    const player = players.find((p) => p.id === playerId);
    if (!player?.isAlive) return false;

    if (showDetectiveAction && !selectedTarget) return true;
    if (showKillerAction && !selectedTarget) return true;

    return false;
  };

  // === לחיצה על מושב (רק בלילה) ===
  const handleSeatSelect = (playerId: string) => {
    if (showDetectiveAction || showKillerAction) {
      setSelectedTarget(playerId);
      nightAction(playerId);
    }
  };

  // שחקנים חיים (לרשימת הצבעה)
  const alivePlayers = players.filter((p) => p.isAlive);

  // === שמות לטקסט מנחה ===
  const killedPlayer = players.find((p) => p.id === gameState.killedPlayerId);
  const eliminatedPlayer = players.find((p) => p.id === gameState.eliminatedPlayerId);

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden">
      {/* שכבת לילה */}
      {isNight && (
        <div className="fixed inset-0 bg-killer-night/90 z-10 transition-opacity duration-1000" />
      )}

      {/* שולחן פוקר */}
      <div className="relative z-20 w-full h-screen flex items-center justify-center">
        <PokerTable isNight={isNight} isMobile={isMobile}>
          {/* מנחה */}
          <NarratorSeat
            phase={phase}
            round={round}
            killedPlayerName={killedPlayer?.displayName}
            eliminatedPlayerName={eliminatedPlayer?.displayName}
            winner={winner}
            isMobile={isMobile}
          />

          {/* מושבי שחקנים */}
          {players.map((player, index) => {
            const pos = seatPositions[index];
            if (!pos) return null;

            return (
              <PlayerSeat
                key={player.id}
                player={player}
                isSelf={player.id === myId}
                myRole={player.id === myId ? myRole : undefined}
                myCard={player.id === myId ? myCard : undefined}
                position={pos}
                isTargetable={getTargetable(player.id)}
                isTargetableBlue={showDetectiveAction && getTargetable(player.id)}
                isSelected={selectedTarget === player.id}
                isAccused={false}
                isDead={!player.isAlive}
                isBeingKilled={showKillAnim && player.id === killedPlayerId}
                hasVoted={votes[player.id] !== undefined}
                voteValue={undefined}
                onSelect={handleSeatSelect}
                videoStream={
                  player.id === myId
                    ? localStream
                    : remoteStreams.get(player.id) ?? null
                }
                isMobile={isMobile}
              />
            );
          })}

          {/* מרכז שולחן */}
          <TableCenter
            phase={phase}
            isHost={isHost}
            isAlive={isAlive}
            myId={myId}
            alivePlayers={alivePlayers}
            votes={votes}
            detectiveResult={detectiveResult}
            showNightAction={showNightAction}
            nightRole={showDetectiveAction ? 'detective' : showKillerAction ? 'killer' : undefined}
            isNightWaiting={isNightWaiting}
            discussionTimeRemaining={gameState.timeRemaining}
            onEndDiscussion={endDiscussion}
            onVote={vote}
            isMobile={isMobile}
          />
        </PokerTable>
      </div>

      {/* בקרי מדיה */}
      {isDayPhase && (
        <MediaControls
          isMicOn={isMicOn}
          isCameraOn={isCameraOn}
          onToggleMic={toggleMic}
          onToggleCamera={toggleCamera}
        />
      )}
    </div>
  );
}

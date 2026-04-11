'use client';

import { useState } from 'react';
import { Phase } from '@the-killer/shared';
import { useGameStore } from '@/stores/gameStore';
import { useSocket } from '@/hooks/useSocket';
import { useWebRTC } from '@/hooks/useWebRTC';
import CardReveal from './CardReveal';
import NightActionPanel from './NightActionPanel';
import VotingPanel from './VotingPanel';
import GameOverModal from './GameOverModal';
import NarratorBanner from './NarratorBanner';
import PlayerList from './PlayerList';
import VideoGrid from './VideoGrid';

export default function GameBoard() {
  const { gameState, narratorMessages, roomCode } = useGameStore();
  const { nightAction, accuse, vote, endDiscussion } = useSocket();
  const [cardRevealed, setCardRevealed] = useState(false);
  const { localStream, remoteStreams, mediaError, isMicOn, isCameraOn, toggleMic, toggleCamera } =
    useWebRTC(roomCode ?? null);

  if (!gameState) return null;

  const {
    phase,
    round,
    players,
    myRole,
    myCard,
    myId,
    hostId,
    accusedPlayerId,
    votes,
    detectiveResult,
    winner,
    allRoles,
  } = gameState;

  const myPlayer = players.find((p) => p.id === myId);
  const isAlive = myPlayer?.isAlive ?? false;
  const accusedPlayer = players.find((p) => p.id === accusedPlayerId);
  const isHost = myId === hostId;

  // שם השלב בעברית
  const phaseLabels: Record<string, string> = {
    [Phase.DEALING_CARDS]: 'חלוקת קלפים',
    [Phase.NIGHT_DETECTIVE]: '🌙 לילה - שלב הבלש',
    [Phase.NIGHT_KILLER]: '🌙 לילה - שלב הרוצח',
    [Phase.DAY_ANNOUNCEMENT]: '☀️ בוקר טוב עיירה',
    [Phase.DAY_DISCUSSION]: '☀️ זמן דיון',
    [Phase.DAY_ACCUSATION]: '☀️ האשמה',
    [Phase.DAY_DEFENSE]: '⚖️ הגנה',
    [Phase.DAY_VOTING]: '🗳️ הצבעה',
    [Phase.GAME_OVER]: 'סוף המשחק',
  };

  // רול באדג'
  const roleBadge = myRole && (
    <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold ${
      myRole === 'killer'
        ? 'bg-red-950/60 text-killer-red border border-killer-red/30'
        : myRole === 'detective'
          ? 'bg-blue-950/60 text-killer-blue-glow border border-killer-blue-glow/30'
          : 'bg-gray-800/60 text-killer-text border border-killer-text-dim/30'
    }`}>
      {myRole === 'killer' && '🔪 רוצח'}
      {myRole === 'detective' && '🔍 בלש'}
      {myRole === 'citizen' && '👤 אזרח'}
    </div>
  );

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

  // שלב לילה - בלש
  const showDetectivePanel =
    phase === Phase.NIGHT_DETECTIVE && myRole === 'detective' && isAlive;

  // שלב לילה - רוצח
  const showKillerPanel =
    phase === Phase.NIGHT_KILLER && myRole === 'killer' && isAlive;

  // שלב לילה - שחקן פאסיבי (אזרח או שחקן מת)
  const showNightWaiting =
    (phase === Phase.NIGHT_DETECTIVE || phase === Phase.NIGHT_KILLER) &&
    !showDetectivePanel &&
    !showKillerPanel;

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

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-killer-surface/50 border-b border-killer-text-dim/10 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">{phaseLabels[phase] || phase}</h1>
            {round > 0 && (
              <p className="text-killer-text-dim text-xs">סיבוב {round}</p>
            )}
          </div>
          {roleBadge}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-4 space-y-4">
        {/* הודעת מנחה */}
        <NarratorBanner messages={narratorMessages} />

        {/* שלב לילה - שחקן פאסיבי */}
        {showNightWaiting && (
          <div className="night-overlay">
            <div className="text-center">
              <p className="text-4xl mb-4">🌙</p>
              <h2 className="text-2xl font-bold mb-2">לילה יורד על העיירה...</h2>
              <p className="text-killer-text-dim">
                {!isAlive
                  ? 'את/ה צופה מהצד...'
                  : 'עצום/י עיניים והמתן/י...'}
              </p>
            </div>
          </div>
        )}

        {/* פאנל בלש */}
        {showDetectivePanel && (
          <NightActionPanel
            role="detective"
            players={players}
            myId={myId}
            detectiveResult={detectiveResult}
            onSelectTarget={nightAction}
          />
        )}

        {/* פאנל רוצח */}
        {showKillerPanel && (
          <NightActionPanel
            role="killer"
            players={players}
            myId={myId}
            onSelectTarget={nightAction}
          />
        )}

        {/* וידאו - שלבי יום */}
        {(phase === Phase.DAY_DISCUSSION ||
          phase === Phase.DAY_DEFENSE ||
          phase === Phase.DAY_VOTING ||
          phase === Phase.DAY_ANNOUNCEMENT) && (
          <VideoGrid
            players={players}
            myId={myId}
            localStream={localStream}
            remoteStreams={remoteStreams}
            mediaError={mediaError}
            isMicOn={isMicOn}
            isCameraOn={isCameraOn}
            onToggleMic={toggleMic}
            onToggleCamera={toggleCamera}
          />
        )}

        {/* שלב יום */}
        {(phase === Phase.DAY_DISCUSSION ||
          phase === Phase.DAY_DEFENSE ||
          phase === Phase.DAY_VOTING ||
          phase === Phase.DAY_ANNOUNCEMENT) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* רשימת שחקנים */}
            <div className="md:col-span-1">
              <PlayerList players={players} myId={myId} />

              {/* כפתור סיום דיון למארח */}
              {phase === Phase.DAY_DISCUSSION && isHost && (
                <button
                  onClick={endDiscussion}
                  className="btn-secondary w-full mt-3 text-sm"
                >
                  סיום דיון → לילה
                </button>
              )}
            </div>

            {/* אזור דיון/הצבעה */}
            <div className="md:col-span-2">
              <VotingPanel
                phase={phase}
                accusedPlayer={accusedPlayer}
                players={players}
                myId={myId}
                votes={votes}
                onAccuse={accuse}
                onVote={vote}
              />

              {/* הודעה למתים */}
              {!isAlive && (
                <div className="mt-4 bg-killer-bg/50 rounded-xl p-4 text-center text-killer-text-dim">
                  <p>💀 את/ה מחוץ למשחק. צופה בשקט...</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* הכרזת בוקר */}
        {phase === Phase.DAY_ANNOUNCEMENT && (
          <div className="text-center py-12">
            <p className="text-5xl mb-4">☀️</p>
            <h2 className="text-2xl font-bold">בוקר טוב עיירה!</h2>
          </div>
        )}
      </main>
    </div>
  );
}

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';
import { useGameStore } from '@/stores/gameStore';
import Image from 'next/image';
import { MIN_PLAYERS } from '@the-killer/shared';

function LobbyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mode = searchParams.get('mode') || 'create';

  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { createRoom, joinRoom, startGame } = useSocket();
  const {
    roomCode: currentRoom,
    lobbyPlayers,
    hostId,
    playerId,
    gameState,
  } = useGameStore();

  // אם יש סטייט משחק - עבור לחדר
  useEffect(() => {
    if (gameState && currentRoom) {
      router.push(`/room/${currentRoom}`);
    }
  }, [gameState, currentRoom, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);

    if (mode === 'create') {
      createRoom(name.trim());
    } else {
      if (!roomCode.trim()) return;
      joinRoom(roomCode.trim().toUpperCase(), name.trim());
    }
  };

  const handleStartGame = () => {
    startGame();
  };

  const isHost = playerId === hostId;
  const canStart = lobbyPlayers.length >= MIN_PLAYERS;

  // אם יש חדר - הצג חדר המתנה
  if (currentRoom) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4">
        <Image
          src="/logo.png"
          alt="The Killer"
          width={300}
          height={168}
          className="mb-6"
        />

        <div className="bg-killer-surface rounded-2xl p-8 w-full max-w-md border border-killer-text-dim/10">
          <h2 className="text-2xl font-bold text-center mb-2">חדר המתנה</h2>

          {/* קוד חדר */}
          <div className="bg-killer-bg rounded-xl p-4 mb-6 text-center">
            <p className="text-killer-text-dim text-sm mb-1">קוד החדר</p>
            <p className="text-3xl font-black tracking-[0.3em] text-killer-red">
              {currentRoom}
            </p>
            <button
              onClick={() => navigator.clipboard.writeText(currentRoom)}
              className="text-killer-text-dim text-xs mt-2 hover:text-killer-text transition-colors"
            >
              לחץ להעתקה
            </button>
          </div>

          {/* רשימת שחקנים */}
          <div className="mb-6">
            <p className="text-killer-text-dim text-sm mb-3">
              שחקנים ({lobbyPlayers.length}/{MIN_PLAYERS} מינימום)
            </p>
            <div className="space-y-2">
              {lobbyPlayers.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between bg-killer-bg rounded-lg px-4 py-3"
                >
                  <span className="font-medium">{player.displayName}</span>
                  {player.id === hostId && (
                    <span className="text-killer-gold text-xs font-bold">
                      מארח
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* כפתור התחלה */}
          {isHost ? (
            <button
              onClick={handleStartGame}
              disabled={!canStart}
              className="btn-primary w-full text-lg"
            >
              {canStart
                ? 'התחל משחק!'
                : `ממתין לשחקנים (${lobbyPlayers.length}/${MIN_PLAYERS})`}
            </button>
          ) : (
            <p className="text-center text-killer-text-dim">
              ממתין למארח להתחיל את המשחק...
            </p>
          )}
        </div>
      </main>
    );
  }

  // טופס יצירה/הצטרפות
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <Image
        src="/logo.png"
        alt="The Killer"
        width={300}
        height={168}
        className="mb-8"
      />

      <div className="bg-killer-surface rounded-2xl p-8 w-full max-w-md border border-killer-text-dim/10">
        <h2 className="text-2xl font-bold text-center mb-6">
          {mode === 'create' ? 'צור חדר חדש' : 'הצטרף לחדר'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-killer-text-dim text-sm mb-1">
              שם התצוגה שלך
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="הכנס שם..."
              className="input-field w-full"
              maxLength={20}
              autoFocus
            />
          </div>

          {mode === 'join' && (
            <div>
              <label className="block text-killer-text-dim text-sm mb-1">
                קוד החדר
              </label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="הכנס קוד חדר..."
                className="input-field w-full tracking-[0.2em] text-center text-lg"
                maxLength={6}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !name.trim() || (mode === 'join' && !roomCode.trim())}
            className="btn-primary w-full text-lg"
          >
            {mode === 'create' ? 'צור חדר' : 'הצטרף'}
          </button>
        </form>

        <button
          onClick={() => router.push('/')}
          className="mt-4 text-killer-text-dim text-sm w-full text-center hover:text-killer-text transition-colors"
        >
          חזרה לדף הראשי
        </button>
      </div>
    </main>
  );
}

export default function LobbyPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-killer-text-dim">טוען...</p>
      </main>
    }>
      <LobbyContent />
    </Suspense>
  );
}

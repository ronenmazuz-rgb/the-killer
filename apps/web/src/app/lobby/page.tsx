'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';
import { useGameStore } from '@/stores/gameStore';
import { useWebRTC } from '@/hooks/useWebRTC';
import VideoGrid from '@/components/game/VideoGrid';
import Image from 'next/image';
import { MIN_PLAYERS } from '@the-killer/shared';

function LobbyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mode = searchParams.get('mode') || 'create';

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [usePassword, setUsePassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBrowsing, setIsBrowsing] = useState(false);
  const [joinPasswordCode, setJoinPasswordCode] = useState<string | null>(null);
  const [joinPassword, setJoinPassword] = useState('');

  const { createRoom, joinRoom, startGame, subscribeToRooms, unsubscribeFromRooms } = useSocket();
  const {
    roomCode: currentRoom,
    lobbyPlayers,
    hostId,
    playerId,
    gameState,
    availableRooms,
  } = useGameStore();

  const { localStream, remoteStreams, mediaError, isMicOn, isCameraOn, toggleMic, toggleCamera } =
    useWebRTC(currentRoom ?? null);

  // אם יש סטייט משחק - עבור לחדר
  useEffect(() => {
    if (gameState && currentRoom) {
      router.push(`/room/${currentRoom}`);
    }
  }, [gameState, currentRoom, router]);

  // ניקוי subscription כשעוזבים
  useEffect(() => {
    return () => {
      if (isBrowsing) {
        unsubscribeFromRooms();
      }
    };
  }, [isBrowsing, unsubscribeFromRooms]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);

    if (mode === 'create') {
      createRoom(name.trim(), usePassword ? password : undefined);
    }
  };

  const handleBrowseStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsBrowsing(true);
    subscribeToRooms();
  };

  const handleJoinFromBrowser = (code: string, hasPassword: boolean) => {
    if (hasPassword) {
      setJoinPasswordCode(code);
      setJoinPassword('');
    } else {
      joinRoom(code, name.trim());
    }
  };

  const handleJoinWithPassword = () => {
    if (joinPasswordCode) {
      joinRoom(joinPasswordCode, name.trim(), joinPassword);
      setJoinPasswordCode(null);
      setJoinPassword('');
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
          <h2 className="text-2xl font-bold text-center mb-6">חדר המתנה</h2>

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

          {/* וידאו */}
          {playerId && (
            <div className="mb-6">
              <VideoGrid
                players={lobbyPlayers}
                myId={playerId}
                localStream={localStream}
                remoteStreams={remoteStreams}
                mediaError={mediaError}
                isMicOn={isMicOn}
                isCameraOn={isCameraOn}
                onToggleMic={toggleMic}
                onToggleCamera={toggleCamera}
              />
            </div>
          )}

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

  // === מצב גלישה בחדרים ===
  if (mode === 'browse' && isBrowsing) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
        <Image
          src="/logo.png"
          alt="The Killer"
          width={300}
          height={168}
          className="mb-6"
        />

        <div className="bg-killer-surface rounded-2xl p-8 w-full max-w-lg border border-killer-text-dim/10">
          <h2 className="text-2xl font-bold text-center mb-6">חדרים פתוחים</h2>

          {/* מודל סיסמה */}
          {joinPasswordCode && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
              <div className="bg-killer-surface rounded-2xl p-6 w-full max-w-sm border border-killer-text-dim/10 mx-4">
                <h3 className="text-lg font-bold mb-4 text-center">החדר מוגן בסיסמה</h3>
                <input
                  type="password"
                  value={joinPassword}
                  onChange={(e) => setJoinPassword(e.target.value)}
                  placeholder="הכנס סיסמה..."
                  className="input-field w-full mb-4"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleJoinWithPassword()}
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleJoinWithPassword}
                    disabled={!joinPassword.trim()}
                    className="btn-primary flex-1"
                  >
                    הצטרף
                  </button>
                  <button
                    onClick={() => setJoinPasswordCode(null)}
                    className="btn-secondary flex-1"
                  >
                    ביטול
                  </button>
                </div>
              </div>
            </div>
          )}

          {availableRooms.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-killer-text-dim text-lg mb-4">אין חדרים פתוחים כרגע</p>
              <button
                onClick={() => router.push('/lobby?mode=create')}
                className="btn-primary"
              >
                צור חדר חדש
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {availableRooms.map((room) => (
                <button
                  key={room.code}
                  onClick={() => handleJoinFromBrowser(room.code, room.hasPassword)}
                  className="w-full bg-killer-bg rounded-xl p-4 border border-killer-text-dim/10 hover:border-killer-red/50 transition-all text-right flex items-center justify-between group"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {room.hasPassword && (
                        <span className="text-killer-gold text-sm" title="מוגן בסיסמה">
                          🔒
                        </span>
                      )}
                      <span className="font-bold text-killer-text group-hover:text-killer-red transition-colors">
                        {room.hostName}
                      </span>
                    </div>
                  </div>
                  <div className="text-left">
                    <span className="text-killer-text-dim text-sm">
                      {room.playerCount}/{room.maxPlayers}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() => {
              setIsBrowsing(false);
              unsubscribeFromRooms();
            }}
            className="mt-6 text-killer-text-dim text-sm w-full text-center hover:text-killer-text transition-colors"
          >
            חזרה
          </button>
        </div>
      </main>
    );
  }

  // === טופס יצירה / הצטרפות / גלישה (שלב שם) ===
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
          {mode === 'create' ? 'צור חדר חדש' : 'מצא משחק'}
        </h2>

        <form onSubmit={mode === 'browse' ? handleBrowseStart : handleSubmit} className="space-y-4">
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

          {mode === 'create' && (
            <div>
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={usePassword}
                  onChange={(e) => setUsePassword(e.target.checked)}
                  className="w-4 h-4 accent-killer-red"
                />
                <span className="text-killer-text-dim text-sm">הגן על החדר בסיסמה</span>
              </label>
              {usePassword && (
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="הכנס סיסמה..."
                  className="input-field w-full mt-2"
                />
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={
              isSubmitting ||
              !name.trim() ||
              (mode === 'create' && usePassword && !password.trim())
            }
            className="btn-primary w-full text-lg"
          >
            {mode === 'create' ? 'צור חדר' : 'חפש משחקים'}
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

'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useGameStore } from '@/stores/gameStore';
import { useSocket } from '@/hooks/useSocket';
import GameBoard from '@/components/game/GameBoard';

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const { gameState, roomCode } = useGameStore();

  // חיבור Socket
  useSocket();

  // אם אין חדר, חזור ללובי
  useEffect(() => {
    if (!roomCode) {
      router.push('/');
    }
  }, [roomCode, router]);

  if (!gameState) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-killer-red border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-killer-text-dim">טוען משחק...</p>
        </div>
      </main>
    );
  }

  return <GameBoard />;
}

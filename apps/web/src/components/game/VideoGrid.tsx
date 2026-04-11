'use client';

import { useEffect, useRef, useState } from 'react';
import type { Player } from '@the-killer/shared';

interface VideoTileProps {
  stream: MediaStream | null;
  player: Player;
  isLocal?: boolean;
}

function VideoTile({ stream, player, isLocal }: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const isAlive = player.isAlive;

  return (
    <div className={`relative rounded-xl overflow-hidden bg-gray-900 aspect-video border ${
      isAlive ? 'border-killer-text-dim/20' : 'border-red-900/30'
    } ${!isAlive ? 'opacity-40' : ''}`}>
      <video
        ref={videoRef}
        autoPlay
        muted={isLocal}
        playsInline
        className={`w-full h-full object-cover ${!stream ? 'hidden' : ''}`}
      />
      {!stream && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl">{isAlive ? '🎭' : '💀'}</span>
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1">
        <span className="text-xs text-white font-medium truncate block">
          {player.displayName}{isLocal ? ' (אתה)' : ''}{!isAlive ? ' 💀' : ''}
        </span>
      </div>
    </div>
  );
}

interface VideoGridProps {
  players: Player[];
  myId: string;
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  mediaError: string | null;
  isMicOn: boolean;
  isCameraOn: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  hidden?: boolean;
}

export default function VideoGrid({
  players,
  myId,
  localStream,
  remoteStreams,
  mediaError,
  isMicOn,
  isCameraOn,
  onToggleMic,
  onToggleCamera,
  hidden = false,
}: VideoGridProps) {
  const [collapsed, setCollapsed] = useState(false);

  if (hidden) return null;

  const myPlayer = players.find((p) => p.id === myId);
  const otherPlayers = players.filter((p) => p.id !== myId);
  const allPlayers = myPlayer ? [myPlayer, ...otherPlayers] : otherPlayers;

  const count = allPlayers.length;
  const gridCols =
    count <= 2 ? 'grid-cols-2' :
    count <= 4 ? 'grid-cols-2 sm:grid-cols-4' :
    'grid-cols-3 sm:grid-cols-4';

  return (
    <div className="bg-killer-surface/40 rounded-xl border border-killer-text-dim/10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-killer-text-dim/10">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-killer-text-dim">📹 וידאו</span>
          {mediaError && (
            <span className="text-xs text-yellow-500">{mediaError}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Mic toggle */}
          <button
            onClick={onToggleMic}
            className={`rounded-full p-1.5 text-xs transition-colors ${
              isMicOn ? 'bg-green-900/40 text-green-400 hover:bg-green-900/60' : 'bg-red-900/40 text-red-400 hover:bg-red-900/60'
            }`}
            title={isMicOn ? 'השתק מיקרופון' : 'הפעל מיקרופון'}
          >
            {isMicOn ? '🎙️' : '🔇'}
          </button>
          {/* Camera toggle */}
          <button
            onClick={onToggleCamera}
            className={`rounded-full p-1.5 text-xs transition-colors ${
              isCameraOn ? 'bg-green-900/40 text-green-400 hover:bg-green-900/60' : 'bg-red-900/40 text-red-400 hover:bg-red-900/60'
            }`}
            title={isCameraOn ? 'כבה מצלמה' : 'הפעל מצלמה'}
          >
            {isCameraOn ? '📷' : '🚫'}
          </button>
          {/* Collapse */}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="text-killer-text-dim hover:text-killer-text text-xs px-2 py-1 rounded transition-colors"
          >
            {collapsed ? '▼ הרחב' : '▲ כווץ'}
          </button>
        </div>
      </div>

      {/* Video grid */}
      {!collapsed && (
        <div className={`grid ${gridCols} gap-2 p-2`}>
          {allPlayers.map((player) => (
            <VideoTile
              key={player.id}
              stream={player.id === myId ? localStream : (remoteStreams.get(player.id) ?? null)}
              player={player}
              isLocal={player.id === myId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

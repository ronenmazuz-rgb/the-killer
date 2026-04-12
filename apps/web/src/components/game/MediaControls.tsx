'use client';

import { useState } from 'react';
import { SoundManager } from '@/lib/sounds';

interface MediaControlsProps {
  isMicOn: boolean;
  isCameraOn: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
}

/**
 * בקרי מדיה צפים — mic, camera, volume
 * נמצא בתחתית המסך תמיד
 */
export default function MediaControls({
  isMicOn,
  isCameraOn,
  onToggleMic,
  onToggleCamera,
}: MediaControlsProps) {
  const [isSoundMuted, setIsSoundMuted] = useState(false);

  const handleSoundToggle = () => {
    const muted = SoundManager.toggleMute();
    setIsSoundMuted(muted);
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50
      flex items-center gap-2 bg-killer-surface/90 backdrop-blur-sm
      rounded-full px-4 py-2 border border-killer-text-dim/20 shadow-xl">
      {/* מיקרופון */}
      <button
        onClick={onToggleMic}
        className={`rounded-full p-2 text-sm transition-colors ${
          isMicOn
            ? 'bg-green-900/40 text-green-400 hover:bg-green-900/60'
            : 'bg-red-900/40 text-red-400 hover:bg-red-900/60'
        }`}
        title={isMicOn ? 'השתק מיקרופון' : 'הפעל מיקרופון'}
      >
        {isMicOn ? '🎙️' : '🔇'}
      </button>

      {/* מצלמה */}
      <button
        onClick={onToggleCamera}
        className={`rounded-full p-2 text-sm transition-colors ${
          isCameraOn
            ? 'bg-green-900/40 text-green-400 hover:bg-green-900/60'
            : 'bg-red-900/40 text-red-400 hover:bg-red-900/60'
        }`}
        title={isCameraOn ? 'כבה מצלמה' : 'הפעל מצלמה'}
      >
        {isCameraOn ? '📷' : '🚫'}
      </button>

      {/* פסיק */}
      <div className="w-px h-6 bg-killer-text-dim/20" />

      {/* סאונד */}
      <button
        onClick={handleSoundToggle}
        className={`rounded-full p-2 text-sm transition-colors ${
          !isSoundMuted
            ? 'bg-killer-surface hover:bg-killer-surface/60 text-killer-text'
            : 'bg-red-900/40 text-red-400 hover:bg-red-900/60'
        }`}
        title={isSoundMuted ? 'הפעל סאונד' : 'השתק סאונד'}
      >
        {isSoundMuted ? '🔈' : '🔊'}
      </button>
    </div>
  );
}

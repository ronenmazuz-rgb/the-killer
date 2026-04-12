'use client';

import { useEffect, useRef } from 'react';

interface MiniVideoProps {
  stream: MediaStream | null;
  isLocal?: boolean;
  size?: number;
}

/**
 * וידאו מעגלי קטן — מוצג בפינת כל מושב שחקן
 */
export default function MiniVideo({ stream, isLocal, size = 48 }: MiniVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  if (!stream) return null;

  return (
    <div
      className="rounded-full overflow-hidden border-2 border-killer-surface/80 shadow-md"
      style={{ width: size, height: size }}
    >
      <video
        ref={videoRef}
        autoPlay
        muted={isLocal}
        playsInline
        className="w-full h-full object-cover"
      />
    </div>
  );
}

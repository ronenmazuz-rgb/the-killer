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
    <video
      ref={videoRef}
      autoPlay
      muted={isLocal}
      playsInline
      style={{ width: size, height: size }}
      className="object-cover rounded-full block"
    />
  );
}

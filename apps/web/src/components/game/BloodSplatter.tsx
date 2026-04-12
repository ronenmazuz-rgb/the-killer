'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface BloodSplatterProps {
  /** מספר טיפות */
  count?: number;
  /** האם מוצג */
  active: boolean;
}

interface Droplet {
  id: number;
  x: number;
  y: number;
  size: number;
  angle: number;
  distance: number;
  delay: number;
  type: 'splash' | 'drip';
}

/** Seeded pseudo-random (mulberry32) — deterministic per seed */
function seededRandom(seed: number) {
  let t = seed + 0x6D2B79F5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function generateDroplets(count: number, seed: number): Droplet[] {
  return Array.from({ length: count }, (_, i) => {
    const r1 = seededRandom(seed + i * 7);
    const r2 = seededRandom(seed + i * 13 + 1);
    const r3 = seededRandom(seed + i * 17 + 2);
    const r4 = seededRandom(seed + i * 23 + 3);
    const angle = (Math.PI * 2 * i) / count + (r1 - 0.5) * 0.8;
    const distance = 15 + r2 * 30;
    return {
      id: i,
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      size: 4 + r3 * 8,
      angle,
      distance,
      delay: i * 0.05,
      type: (r4 > 0.5 ? 'splash' : 'drip') as 'splash' | 'drip',
    };
  });
}

export default function BloodSplatter({ count = 8, active }: BloodSplatterProps) {
  // Seed קבוע כדי למנוע hydration mismatch
  const [droplets] = useState<Droplet[]>(() => generateDroplets(count, 42));

  if (!active) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-20 overflow-visible">
      {droplets.map((drop) => (
        <motion.div
          key={drop.id}
          className="absolute rounded-full"
          style={{
            left: '50%',
            top: '50%',
            width: drop.size,
            height: drop.type === 'drip' ? drop.size * 1.8 : drop.size,
            backgroundColor: drop.id % 3 === 0 ? '#CC0000' : drop.id % 3 === 1 ? '#8B0000' : '#6B0000',
            borderRadius: drop.type === 'drip' ? '50% 50% 50% 50% / 60% 60% 40% 40%' : '50%',
          }}
          initial={{
            x: 0,
            y: 0,
            scale: 0,
            opacity: 0,
          }}
          animate={{
            x: drop.x,
            y: drop.y + (drop.type === 'drip' ? 20 : 0),
            scale: [0, 1.5, 1],
            opacity: [0, 1, 0.8, 0],
          }}
          transition={{
            duration: drop.type === 'drip' ? 3 : 2,
            delay: drop.delay,
            ease: 'easeOut',
            opacity: {
              times: [0, 0.2, 0.7, 1],
              duration: drop.type === 'drip' ? 4 : 3,
            },
          }}
        />
      ))}

      {/* כתם דם מרכזי */}
      <motion.div
        className="absolute"
        style={{
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.3, 1], opacity: [0, 0.9, 0.6] }}
        transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
      >
        <div
          className="bg-blood-dark rounded-full blur-[1px]"
          style={{ width: 16, height: 16 }}
        />
      </motion.div>
    </div>
  );
}

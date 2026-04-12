'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BloodSplatter from './BloodSplatter';

interface KillAnimationProps {
  /** האם האנימציה פעילה */
  active: boolean;
  /** callback כשהאנימציה מסתיימת */
  onComplete?: () => void;
}

/**
 * אנימציית רצח — סכין ננעצת + טיפות דם
 * מוצגת מעל למושב הקורבן
 */
export default function KillAnimation({ active, onComplete }: KillAnimationProps) {
  const [showBlood, setShowBlood] = useState(false);
  const [showKnife, setShowKnife] = useState(false);

  useEffect(() => {
    if (!active) {
      setShowBlood(false);
      setShowKnife(false);
      return;
    }

    setShowKnife(true);

    // טיפות דם מופיעות ברגע הפגיעה (אחרי 0.8 שניות)
    const bloodTimer = setTimeout(() => setShowBlood(true), 800);

    // סכין נעלמת אחרי 3 שניות
    const knifeTimer = setTimeout(() => setShowKnife(false), 3000);

    // האנימציה מסתיימת אחרי 4 שניות
    const completeTimer = setTimeout(() => {
      onComplete?.();
    }, 4000);

    return () => {
      clearTimeout(bloodTimer);
      clearTimeout(knifeTimer);
      clearTimeout(completeTimer);
    };
  }, [active, onComplete]);

  return (
    <AnimatePresence>
      {active && (
        <div className="absolute inset-0 pointer-events-none z-30 overflow-visible">
          {/* סכין */}
          {showKnife && (
            <motion.div
              className="absolute left-1/2 top-1/2"
              style={{ transform: 'translate(-50%, -50%)' }}
              initial={{ y: -120, rotate: -45, scale: 1.8, opacity: 0 }}
              animate={{ y: 0, rotate: 0, scale: 1, opacity: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{
                duration: 0.8,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
            >
              {/* סכין SVG */}
              <svg
                width="40"
                height="60"
                viewBox="0 0 40 60"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="drop-shadow-lg"
              >
                {/* להב */}
                <path
                  d="M20 0 L26 35 L20 40 L14 35 Z"
                  fill="url(#blade-gradient)"
                  stroke="#999"
                  strokeWidth="0.5"
                />
                {/* חריץ */}
                <path
                  d="M20 5 L23 30 L20 33 L17 30 Z"
                  fill="none"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="0.5"
                />
                {/* ידית */}
                <rect x="16" y="38" width="8" height="18" rx="2" fill="#3B1F0B" />
                <rect x="15" y="36" width="10" height="4" rx="1" fill="#5C3317" />
                {/* דם על הלהב */}
                <path
                  d="M18 15 Q20 20 22 18 Q21 25 19 22 Z"
                  fill="#8B0000"
                  opacity="0.7"
                />
                <defs>
                  <linearGradient id="blade-gradient" x1="14" y1="0" x2="26" y2="40">
                    <stop offset="0%" stopColor="#E8E8E8" />
                    <stop offset="50%" stopColor="#C0C0C0" />
                    <stop offset="100%" stopColor="#A0A0A0" />
                  </linearGradient>
                </defs>
              </svg>
            </motion.div>
          )}

          {/* טיפות דם */}
          <BloodSplatter active={showBlood} count={10} />
        </div>
      )}
    </AnimatePresence>
  );
}

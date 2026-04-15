'use client';

import type { ReactNode } from 'react';

interface PokerTableProps {
  children: ReactNode;
  isNight: boolean;
  isMobile?: boolean;
}

/**
 * השולחן האובלי — הלב של לייאאוט המשחק
 * מכיל את כל המושבים, המנחה, והמרכז
 */
export default function PokerTable({ children, isNight, isMobile }: PokerTableProps) {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* שולחן אובלי */}
      <div
        className={`relative ${isNight ? 'table-night' : 'table-day'}`}
        style={{
          width: isMobile ? '88vw' : '72vw',
          height: isMobile ? '45vh' : '42vh',
          maxWidth: '900px',
          maxHeight: '460px',
        }}
      >
        {/* מסגרת עץ חיצונית */}
        <div
          className="absolute inset-0 rounded-[50%]"
          style={{
            background: 'linear-gradient(180deg, #8B5A2B 0%, #5C3317 40%, #3B1F0B 100%)',
            padding: isMobile ? '6px' : '10px',
          }}
        >
          {/* משטח לבד */}
          <div className="w-full h-full rounded-[50%] poker-felt poker-table-border relative overflow-visible">
            {/* תבנית עדינה על הלבד */}
            <div
              className="absolute inset-0 rounded-[50%] opacity-10 pointer-events-none"
              style={{
                background: 'radial-gradient(circle at 50% 50%, transparent 30%, rgba(0,0,0,0.3) 100%)',
              }}
            />

            {/* קו זהב עדין סביב השולחן */}
            <div
              className="absolute inset-2 rounded-[50%] pointer-events-none"
              style={{
                border: '1px solid rgba(197, 165, 90, 0.15)',
              }}
            />
          </div>
        </div>
      </div>

      {/* ילדים — מושבים מסביב לשולחן
           המיכל גדול מהאליפסה ב-~80px לכל צד,
           כך שהאחוזים של seatPositions (a=42,b=34) מציבים שחקנים
           על קצה האליפסה ולא בתוכה */}
      <div
        className="absolute"
        style={{
          width: isMobile ? 'calc(88vw + 72px)' : 'calc(72vw + 160px)',
          height: isMobile ? 'calc(45vh + 72px)' : 'calc(42vh + 160px)',
          maxWidth: isMobile ? '972px' : '1060px',
          maxHeight: isMobile ? '532px' : '620px',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        {children}
      </div>
    </div>
  );
}

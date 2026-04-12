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

      {/* ילדים — מושבים, מנחה, מרכז (מחוץ לטרנספורם של הלילה) */}
      <div
        className="absolute"
        style={{
          width: isMobile ? '88vw' : '72vw',
          height: isMobile ? '45vh' : '42vh',
          maxWidth: '900px',
          maxHeight: '460px',
        }}
      >
        {children}
      </div>
    </div>
  );
}

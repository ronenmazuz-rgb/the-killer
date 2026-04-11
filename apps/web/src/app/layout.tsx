import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'The Killer - משחק מרובה משתתפים',
  description: 'משחק הרוצח האונליין - מי הרוצח ביניכם?',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl">
      <body className="min-h-screen bg-killer-bg text-killer-text font-game">
        <div className="fog-bg" />
        <div className="relative z-10 min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}

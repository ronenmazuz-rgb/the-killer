'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      {/* לוגו */}
      <div className="mb-8 pulse-glow rounded-2xl overflow-hidden">
        <Image
          src="/logo.png"
          alt="The Killer"
          width={500}
          height={280}
          priority
          className="w-full max-w-lg"
        />
      </div>

      {/* כותרת */}
      <h1 className="text-4xl md:text-5xl font-black text-center mb-3 bg-gradient-to-r from-killer-red-dark to-killer-red bg-clip-text text-transparent">
        THE KILLER
      </h1>
      <p className="text-killer-text-dim text-lg mb-12 text-center">
        משחק מרובה משתתפים אונליין - מי הרוצח ביניכם?
      </p>

      {/* כפתורים */}
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <Link href="/lobby?mode=create" className="btn-primary text-center text-lg">
          צור חדר חדש
        </Link>
        <Link href="/lobby?mode=browse" className="btn-secondary text-center text-lg">
          מצא משחק
        </Link>
      </div>

      {/* חוקים */}
      <div className="mt-16 max-w-md text-center text-killer-text-dim text-sm">
        <p className="mb-2 text-killer-text font-medium">איך משחקים?</p>
        <p>
          כל שחקן מקבל קלף. מי שמקבל <span className="text-killer-red font-bold">מלכה</span> הוא הרוצח,
          מי שמקבל <span className="text-killer-blue-glow font-bold">מלך</span> הוא הבלש,
          והשאר <span className="text-killer-text font-bold">אזרחים</span>.
          מצאו את הרוצח לפני שיהיה מאוחר מדי!
        </p>
      </div>
    </main>
  );
}

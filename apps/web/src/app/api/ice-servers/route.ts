import { NextResponse } from 'next/server';

// מנע cache של Next.js על route handler זה — credentials חייבים להיות fresh
export const dynamic = 'force-dynamic';

// שרתי TURN ציבוריים חינמיים — freestun + Open Relay כ-fallback
const FALLBACK_TURN = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  {
    urls: 'turn:freestun.net:3478',
    username: 'freestun',
    credential: 'freestun',
  },
  {
    urls: 'turns:freestun.net:5349',
    username: 'freestun',
    credential: 'freestun',
  },
  {
    urls: 'turn:openrelay.metered.ca:80',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  {
    urls: 'turn:openrelay.metered.ca:443',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  {
    urls: 'turn:openrelay.metered.ca:443?transport=tcp',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
];

/**
 * מחזיר ICE servers (STUN + TURN) לחיבורי WebRTC.
 * מנסה קודם Metered.ca API (POST ליצירת credentials זמניים) —
 * אם נכשל, מחזיר TURN ציבורי (freestun + Open Relay).
 */
export async function GET() {
  const apiKey = process.env.METERED_API_KEY;
  const appName = process.env.METERED_APP_NAME;

  if (apiKey && appName) {
    try {
      // POST יוצר credentials זמניים — לא תלוי ב-credentials שנוצרו בדשבורד
      const url = `https://${appName}.metered.live/api/v1/turn/credentials?apiKey=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: `session-${Date.now()}`, expiresInSeconds: 86400 }),
        cache: 'no-store',
      });

      if (res.ok) {
        const iceServers = await res.json();
        if (Array.isArray(iceServers) && iceServers.length > 0) {
          console.log('[ICE API] Got', iceServers.length, 'ICE servers from Metered (POST)');
          return NextResponse.json(iceServers);
        }
        console.warn('[ICE API] Metered POST returned empty array');
      } else {
        const body = await res.text().catch(() => '');
        console.warn('[ICE API] Metered POST returned', res.status, body.slice(0, 120));
      }
    } catch (err) {
      console.warn('[ICE API] Metered fetch failed:', err);
    }
  }

  // fallback: freestun + Open Relay ציבורי
  console.log('[ICE API] Using fallback TURN servers (freestun + Open Relay)');
  return NextResponse.json(FALLBACK_TURN);
}

import { NextResponse } from 'next/server';

// שרתי TURN ציבוריים חינמיים (Open Relay Project מבית Metered.ca)
const OPEN_RELAY_TURN = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
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
  {
    urls: 'turn:openrelay.metered.ca:80?transport=tcp',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
];

/**
 * מחזיר ICE servers (STUN + TURN) לחיבורי WebRTC
 * מנסה קודם Metered.ca API עם API key — אם נכשל, משתמש ב-Open Relay ציבורי
 */
export async function GET() {
  const apiKey = process.env.METERED_API_KEY;
  const appName = process.env.METERED_APP_NAME;

  if (apiKey && appName) {
    try {
      const url = `https://${appName}.metered.live/api/v1/turn/credentials?apiKey=${apiKey}`;
      const res = await fetch(url, { next: { revalidate: 3600 } });

      if (res.ok) {
        const iceServers = await res.json();
        console.log('[ICE API] Got', iceServers.length, 'ICE servers from Metered');
        return NextResponse.json(iceServers, {
          headers: { 'Cache-Control': 'public, max-age=3600' },
        });
      }
      console.warn('[ICE API] Metered returned', res.status, '— falling back to Open Relay');
    } catch (err) {
      console.warn('[ICE API] Metered fetch failed:', err);
    }
  }

  // fallback: Open Relay TURN ציבורי
  console.log('[ICE API] Using Open Relay public TURN servers');
  return NextResponse.json(OPEN_RELAY_TURN);
}

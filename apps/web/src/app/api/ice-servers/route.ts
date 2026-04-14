import { NextResponse } from 'next/server';

/**
 * מחזיר ICE servers (STUN + TURN) לחיבורי WebRTC
 * TURN credentials מגיעים מ-Metered.ca API
 */
export async function GET() {
  const apiKey = process.env.METERED_API_KEY;
  const appName = process.env.METERED_APP_NAME;

  // אם אין API key — החזר רק STUN (עובד רק באותה רשת)
  if (!apiKey || !appName) {
    return NextResponse.json([
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ]);
  }

  try {
    const url = `https://${appName}.metered.live/api/v1/turn/credentials?apiKey=${apiKey}`;
    console.log('[ICE API] Fetching from Metered:', url.replace(apiKey, '***'));
    const res = await fetch(url, { next: { revalidate: 3600 } });

    if (!res.ok) {
      const body = await res.text();
      console.error('[ICE API] Metered error:', res.status, body);
      throw new Error(`Metered API ${res.status}`);
    }

    const iceServers = await res.json();
    console.log('[ICE API] Got', iceServers.length, 'ICE servers from Metered');
    return NextResponse.json(iceServers, {
      headers: { 'Cache-Control': 'public, max-age=3600' },
    });
  } catch (err) {
    console.error('[ICE API] Falling back to STUN only:', err);
    return NextResponse.json([
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ]);
  }
}

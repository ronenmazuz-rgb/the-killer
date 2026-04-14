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
    const res = await fetch(
      `https://${appName}.metered.live/api/v1/turn/credentials?apiKey=${apiKey}`,
      { next: { revalidate: 3600 } } // cache לשעה
    );

    if (!res.ok) throw new Error('Metered API failed');

    const iceServers = await res.json();
    return NextResponse.json(iceServers, {
      headers: { 'Cache-Control': 'public, max-age=3600' },
    });
  } catch {
    // fallback — STUN בלבד
    return NextResponse.json([
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ]);
  }
}

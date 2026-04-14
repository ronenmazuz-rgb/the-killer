import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.METERED_API_KEY;
  const appName = process.env.METERED_APP_NAME;

  const debug: Record<string, unknown> = {
    hasApiKey: !!apiKey,
    hasAppName: !!appName,
    appName: appName ?? '(not set)',
    apiKeyPrefix: apiKey ? apiKey.slice(0, 6) + '...' : '(not set)',
  };

  if (!apiKey || !appName) {
    return NextResponse.json({ ...debug, result: 'env vars missing — falling back to STUN' });
  }

  try {
    const url = `https://${appName}.metered.live/api/v1/turn/credentials?apiKey=${apiKey}`;
    debug.fetchUrl = url.replace(apiKey, '***');
    const res = await fetch(url);
    const body = await res.text();
    debug.status = res.status;
    debug.responseBody = body.slice(0, 500);
    if (res.ok) {
      const servers = JSON.parse(body);
      debug.result = 'OK';
      debug.turnCount = servers.filter((s: { urls: string | string[] }) =>
        (Array.isArray(s.urls) ? s.urls : [s.urls]).some((u: string) => u.startsWith('turn:'))
      ).length;
    } else {
      debug.result = 'Metered API error';
    }
  } catch (err) {
    debug.result = 'fetch failed';
    debug.error = String(err);
  }

  return NextResponse.json(debug);
}

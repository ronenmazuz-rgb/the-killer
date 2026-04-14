import { NextRequest, NextResponse } from 'next/server';

// מגבלת אורך של Google Translate TTS
const MAX_CHARS = 200;

export async function GET(request: NextRequest) {
  const text = request.nextUrl.searchParams.get('text')?.slice(0, MAX_CHARS);
  if (!text?.trim()) {
    return NextResponse.json({ error: 'missing text' }, { status: 400 });
  }

  const url =
    `https://translate.google.com/translate_tts` +
    `?ie=UTF-8&q=${encodeURIComponent(text)}&tl=he&client=tw-ob&ttsspeed=0.9`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36',
        Referer: 'https://translate.google.com/',
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'TTS upstream failed' }, { status: 502 });
    }

    const audio = await res.arrayBuffer();
    return new NextResponse(audio, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch {
    return NextResponse.json({ error: 'TTS fetch error' }, { status: 500 });
  }
}

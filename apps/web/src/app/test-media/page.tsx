'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { narratorSpeak, narratorStop, SoundManager } from '@/lib/sounds';
import { calculateSeatPositions } from '@/lib/seatPositions';

// ביטויים לבדיקת TTS
const TTS_SAMPLES = [
  'ברוכים הבאים למשחק הרוצח. הלילה מישהו ביניכם ייעלם.',
  'שחקן יקר, הינך הרוצח. בחר קורבן בקפידה.',
  'הבלש מתעורר וחוקר את החשודים.',
  'הבוקר הגיע. גופה נמצאה. מי עשה זאת?',
  'ההצבעה הסתיימה. העיר מוציאה להורג את החשוד.',
  'האזרחים ניצחו! הרוצח נחשף.',
];

// אפקטי סאונד לבדיקה
const SFX_LIST = [
  { key: 'cardDeal', label: '🃏 חלוקת קלפים' },
  { key: 'cardFlip', label: '🔄 הפיכת קלף' },
  { key: 'knifeStab', label: '🔪 דקירה' },
  { key: 'heartbeat', label: '💓 דפיקות לב' },
  { key: 'gavel', label: '⚖️ פטיש שופט' },
  { key: 'crowdGasp', label: '😱 קהל נדהם' },
  { key: 'victory', label: '🏆 ניצחון' },
  { key: 'defeat', label: '💀 הפסד' },
] as const;

const AMBIENCE_LIST = [
  { key: 'nightAmbience', label: '🌙 לילה' },
  { key: 'dayAmbience', label: '☀️ יום' },
  { key: 'tension', label: '😰 מתח' },
] as const;

const PLAYER_NAMES = ['אני', 'דוד', 'שרה', 'יוסי', 'מרים', 'אלי', 'נועה', 'רון', 'תמר', 'גיל', 'ליאת', 'עמיר'];

function SeatSimulator() {
  const [playerCount, setPlayerCount] = useState(4);
  const positions = calculateSeatPositions(playerCount, 0, false);

  // אחוזי השולחן האובלי (כמו ב-PokerTable)
  const TABLE_W = 72; // vw — משתמש ב-% עבור הדמיה
  const TABLE_H = 42; // vh

  return (
    <section className="bg-killer-surface rounded-2xl p-6 border border-killer-text-dim/10 mb-6">
      <h2 className="text-lg font-bold mb-1">🪑 סימולציית מושבים</h2>
      <p className="text-killer-text-dim text-xs mb-4">בדיקה שהשחקנים יושבים נכון סביב השולחן לפי מספר שחקנים</p>

      {/* בורר מספר שחקנים */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-killer-text-dim text-sm">מספר שחקנים:</span>
        {[4,5,6,7,8,9,10,11,12].map(n => (
          <button
            key={n}
            onClick={() => setPlayerCount(n)}
            className={`w-8 h-8 rounded-lg text-sm font-bold transition-colors ${
              playerCount === n
                ? 'bg-killer-red text-white'
                : 'bg-killer-bg text-killer-text-dim hover:text-killer-text'
            }`}
          >
            {n}
          </button>
        ))}
      </div>

      {/* שולחן + מושבים */}
      <div className="relative w-full" style={{ paddingBottom: '42%' }}>
        {/* אובל השולחן */}
        <div
          className="absolute inset-0 rounded-[50%] border-4 border-amber-800"
          style={{ background: 'radial-gradient(ellipse, #1a472a 60%, #0f2d1a 100%)' }}
        />
        {/* מנחה — תמיד בראש */}
        <div
          className="absolute flex flex-col items-center"
          style={{ left: '50%', top: '2%', transform: 'translate(-50%, 0)' }}
        >
          <div className="w-8 h-8 rounded-full bg-killer-gold/30 border-2 border-killer-gold flex items-center justify-center text-xs">🎩</div>
          <span className="text-[9px] text-killer-gold mt-0.5">מנחה</span>
        </div>

        {/* מושבי שחקנים */}
        {positions.map((pos, i) => (
          <div
            key={i}
            className="absolute flex flex-col items-center"
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-xs font-bold
              ${i === 0 ? 'bg-killer-red/30 border-killer-red text-killer-red' : 'bg-white/10 border-white/40 text-white'}`}>
              {i === 0 ? '✦' : i}
            </div>
            <span className={`text-[9px] mt-0.5 ${i === 0 ? 'text-killer-red' : 'text-killer-text-dim'}`}>
              {PLAYER_NAMES[i] ?? `שחקן ${i}`}
            </span>
          </div>
        ))}
      </div>

      <p className="text-killer-text-dim text-xs mt-3">
        ✦ = אתה (תמיד בתחתית) · מספרים = שחקנים אחרים · 🎩 = מנחה
      </p>
    </section>
  );
}

export default function TestMediaPage() {
  // מצלמה ומיק
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [micLevel, setMicLevel] = useState(0);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);

  // TTS
  const [ttsText, setTtsText] = useState(TTS_SAMPLES[0]);
  const [ttsRate, setTtsRate] = useState(1.0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Ambience
  const [activeAmbience, setActiveAmbience] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // פתיחת מדיה
  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (cancelled) { s.getTracks().forEach(t => t.stop()); return; }
        setStream(s);

        // חיבור אנליזר מיק
        const ctx = new AudioContext();
        audioCtxRef.current = ctx;
        const source = ctx.createMediaStreamSource(s);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;

        // לולאת רמת מיק
        const data = new Uint8Array(analyser.frequencyBinCount);
        function tick() {
          analyser.getByteFrequencyData(data);
          const avg = data.reduce((a, b) => a + b, 0) / data.length;
          setMicLevel(Math.min(100, avg * 2.5));
          animFrameRef.current = requestAnimationFrame(tick);
        }
        tick();
      } catch {
        setMediaError('לא ניתן לגשת למצלמה/מיקרופון — אשר הרשאות בדפדפן');
      }
    }
    init();
    return () => {
      cancelled = true;
      cancelAnimationFrame(animFrameRef.current);
      audioCtxRef.current?.close();
    };
  }, []);

  // חיבור stream לוידאו
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const toggleMic = useCallback(() => {
    if (!stream) return;
    stream.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsMicOn(prev => !prev);
  }, [stream]);

  const toggleCamera = useCallback(() => {
    if (!stream) return;
    stream.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsCameraOn(prev => !prev);
  }, [stream]);

  const handleSpeak = () => {
    setIsSpeaking(true);
    narratorSpeak(ttsText, ttsRate);
    // הסר דגל אחרי כמה שניות (אין onend נגיש מבחוץ)
    setTimeout(() => setIsSpeaking(false), ttsText.length * 80 + 500);
  };

  const handleStopSpeak = () => {
    narratorStop();
    setIsSpeaking(false);
  };

  const handleAmbience = (key: string) => {
    if (activeAmbience === key) {
      SoundManager.setAmbience(null);
      setActiveAmbience(null);
    } else {
      SoundManager.setAmbience(key as any);
      setActiveAmbience(key);
    }
  };

  return (
    <main className="min-h-screen bg-killer-bg text-killer-text p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-black mb-1 text-killer-red">🧪 בדיקת מדיה</h1>
      <p className="text-killer-text-dim text-sm mb-8">בדיקת מצלמה, מיקרופון וסאונד — ללא צורך בשחקנים נוספים</p>

      {/* ===== מצלמה + מיק ===== */}
      <section className="bg-killer-surface rounded-2xl p-6 border border-killer-text-dim/10 mb-6">
        <h2 className="text-lg font-bold mb-4">📹 מצלמה ומיקרופון</h2>

        {mediaError ? (
          <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 text-red-300 text-sm">
            {mediaError}
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {/* תצוגה מקדימה */}
            <div className="relative rounded-xl overflow-hidden bg-black w-full sm:w-64 aspect-video">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className={`w-full h-full object-cover ${!isCameraOn ? 'opacity-0' : ''}`}
              />
              {!isCameraOn && (
                <div className="absolute inset-0 flex items-center justify-center text-killer-text-dim text-sm">
                  מצלמה כבויה
                </div>
              )}
              {!stream && (
                <div className="absolute inset-0 flex items-center justify-center text-killer-text-dim text-sm">
                  טוען...
                </div>
              )}
            </div>

            {/* בקרים ומד מיק */}
            <div className="flex-1 space-y-4">
              {/* מד רמת מיק */}
              <div>
                <p className="text-killer-text-dim text-sm mb-2">
                  {isMicOn ? '🎙️ רמת מיקרופון' : '🔇 מיקרופון כבוי'}
                </p>
                <div className="h-4 bg-killer-bg rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-75"
                    style={{
                      width: `${isMicOn ? micLevel : 0}%`,
                      backgroundColor: micLevel > 70 ? '#ef4444' : micLevel > 40 ? '#f59e0b' : '#22c55e',
                    }}
                  />
                </div>
                <p className="text-killer-text-dim text-xs mt-1">
                  {isMicOn ? (micLevel > 5 ? 'קול מזוהה ✅' : 'דבר לתוך המיקרופון...') : ''}
                </p>
              </div>

              {/* כפתורי שליטה */}
              <div className="flex gap-3">
                <button
                  onClick={toggleMic}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    isMicOn
                      ? 'bg-green-900/40 border border-green-700 text-green-300 hover:bg-green-900/60'
                      : 'bg-red-900/40 border border-red-700 text-red-300 hover:bg-red-900/60'
                  }`}
                >
                  {isMicOn ? '🎙️ כבה מיק' : '🔇 הפעל מיק'}
                </button>
                <button
                  onClick={toggleCamera}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    isCameraOn
                      ? 'bg-green-900/40 border border-green-700 text-green-300 hover:bg-green-900/60'
                      : 'bg-red-900/40 border border-red-700 text-red-300 hover:bg-red-900/60'
                  }`}
                >
                  {isCameraOn ? '📷 כבה מצלמה' : '🚫 הפעל מצלמה'}
                </button>
              </div>

              {stream && (
                <p className="text-green-400 text-xs">
                  ✅ מדיה מחוברת ({stream.getVideoTracks().length > 0 ? 'וידאו + ' : ''}אודיו)
                </p>
              )}
            </div>
          </div>
        )}
      </section>

      {/* ===== TTS ===== */}
      <section className="bg-killer-surface rounded-2xl p-6 border border-killer-text-dim/10 mb-6">
        <h2 className="text-lg font-bold mb-4">🎩 מנחה — קריינות TTS</h2>

        <p className="text-green-400 text-xs mb-3">✅ קריינות עברית דרך Google Translate TTS</p>

        {/* בחר טקסט מוכן */}
        <div className="flex flex-wrap gap-2 mb-4">
          {TTS_SAMPLES.map((sample, i) => (
            <button
              key={i}
              onClick={() => setTtsText(sample)}
              className={`px-3 py-1 rounded-lg text-xs transition-colors ${
                ttsText === sample
                  ? 'bg-killer-red text-white'
                  : 'bg-killer-bg text-killer-text-dim hover:text-killer-text'
              }`}
            >
              {i + 1}. {sample.slice(0, 20)}...
            </button>
          ))}
        </div>

        {/* עריכה חופשית */}
        <textarea
          value={ttsText}
          onChange={(e) => setTtsText(e.target.value)}
          className="input-field w-full h-20 resize-none text-sm mb-3"
          placeholder="הקלד טקסט לבדיקה..."
          dir="rtl"
        />

        {/* מהירות */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-killer-text-dim text-sm">מהירות:</span>
          <input
            type="range"
            min="0.5"
            max="1.5"
            step="0.1"
            value={ttsRate}
            onChange={(e) => setTtsRate(parseFloat(e.target.value))}
            className="flex-1"
          />
          <span className="text-killer-text text-sm w-8">{ttsRate.toFixed(1)}x</span>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSpeak}
            disabled={!ttsText.trim()}
            className="btn-primary"
          >
            {isSpeaking ? '▶️ מקריין...' : '▶️ הקרא'}
          </button>
          <button
            onClick={handleStopSpeak}
            className="btn-secondary"
          >
            ⏹️ עצור
          </button>
        </div>
      </section>

      {/* ===== SFX ===== */}
      <section className="bg-killer-surface rounded-2xl p-6 border border-killer-text-dim/10 mb-6">
        <h2 className="text-lg font-bold mb-4">🔊 אפקטי סאונד</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {SFX_LIST.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => SoundManager.play(key as any)}
              className="bg-killer-bg rounded-xl px-3 py-3 text-sm hover:bg-killer-surface border border-killer-text-dim/10 hover:border-killer-red/40 transition-all text-center"
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* ===== אמביינס ===== */}
      <section className="bg-killer-surface rounded-2xl p-6 border border-killer-text-dim/10 mb-6">
        <h2 className="text-lg font-bold mb-4">🎵 מוזיקת רקע (אמביינס)</h2>
        <div className="flex flex-wrap gap-3">
          {AMBIENCE_LIST.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleAmbience(key)}
              className={`px-4 py-2 rounded-xl text-sm transition-colors border ${
                activeAmbience === key
                  ? 'bg-killer-red/20 border-killer-red text-killer-red'
                  : 'bg-killer-bg border-killer-text-dim/10 hover:border-killer-red/40'
              }`}
            >
              {label} {activeAmbience === key ? '(פועל — לחץ לעצירה)' : ''}
            </button>
          ))}
          {activeAmbience && (
            <button
              onClick={() => { SoundManager.setAmbience(null); setActiveAmbience(null); }}
              className="px-4 py-2 rounded-xl text-sm bg-killer-bg border border-killer-text-dim/10 hover:border-red-500/40 text-killer-text-dim"
            >
              ⏹️ עצור הכל
            </button>
          )}
        </div>
      </section>

      {/* ===== סימולציית מושבים ===== */}
      <SeatSimulator />

      {/* לינק חזרה */}
      <a href="/" className="text-killer-text-dim text-sm hover:text-killer-text transition-colors">
        ← חזרה לדף הראשי
      </a>
    </main>
  );
}

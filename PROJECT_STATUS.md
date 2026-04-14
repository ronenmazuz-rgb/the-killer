# משחק הרוצח — סיכום פרויקט

> עודכן לאחרונה: 14 אפריל 2026 (WebRTC TURN fix)

---

## 🏗️ ארכיטקטורה

**Turborepo Monorepo** עם שלושה חלקים:

| Package | Tech | מה זה |
|---|---|---|
| `apps/web` | Next.js 15 + React 19 + TypeScript + Tailwind | Frontend |
| `apps/server` | Node.js + Socket.IO + TypeScript | Backend |
| `packages/shared` | TypeScript | Types, events, constants משותפים |

---

## 🚀 Deployment — מצב נוכחי

### שרת (Railway) ✅
- **URL:** `https://the-killerserver-production.up.railway.app`
- **GitHub auto-deploy:** כל push ל-`main` → deploy אוטומטי

### Frontend (Vercel) ✅
- **URL:** `https://the-killer-web.vercel.app`
- **Project:** `the-killer-web` תחת `ronenmazuz-rgbs-projects`
- **GitHub auto-deploy:** כל push ל-`main` → deploy אוטומטי
- **Env vars ב-Vercel:**
  - `NEXT_PUBLIC_SOCKET_URL` = `https://the-killerserver-production.up.railway.app`
  - `METERED_API_KEY` = `8zKfDlLCJqrKeJG4iFgH7oWMVNj_KylnuwaSVxFYtGNtRbkB`
  - `METERED_APP_NAME` = `the-killer`
- **GitHub:** `https://github.com/ronenmazuz-rgb/the-killer`

---

## 🎮 מצב המשחק

### פיצ'רים שמומשו ✅

#### UI / UX
- שולחן פוקר אימרסיבי (`PokerTable.tsx`)
- עיגולי וידאו לכל שחקן
- מושבים באליפסה — המשתמש תמיד בתחתית, שאר השחקנים מסביב
- מנחה עם TTS עברי ו-typing animation
- קלף אישי (reveal animation) בתחילת משחק
- MediaControls (מיק/מצלמה) בזמן יום

#### זרימת משחק
1. **DEALING_CARDS** (5s) — כל שחקן רואה קלף שלו
2. **NIGHT_DETECTIVE** (15s) — בלש בוחר לחקור
3. **NIGHT_KILLER** (15s) — רוצח בוחר קורבן
4. **DAY_ANNOUNCEMENT** (5s) — מי נהרג
5. **DAY_DISCUSSION** (60s) — דיון עם ספירה לאחור
6. **DAY_VOTING** (30s) — הצבעה
7. **רוב יחסי** — הכי הרבה קולות מוצא; שיוויון = אף אחד לא מוצא

#### סאונד
- SFX: `cardDeal`, `knifeStab`, `crowdGasp`, `heartbeat`, `gavel`, `victory`, `defeat`
- TTS עברי דרך Google Translate proxy (`/api/tts`)
- **הוסרו** סאונדי יום/לילה ambient (לפי בקשת המשתמש)

---

## 🐛 בעיות שנפתרו בסשנים האחרונים

| בעיה | פתרון | קובץ |
|---|---|---|
| TTS עברי לא עבד בWindows | החלפת Web Speech API ב-Google Translate proxy | `apps/web/src/app/api/tts/route.ts`, `sounds.ts` |
| שחקנים לא ישבו נכון סביב השולחן (לא-host) | תוקן `seatPositions[relIndex]` → `seatPositions[index]` | `GameBoard.tsx` |
| שחקנים חצו גבולות המסך | הקטנת רדיוסי האליפסה (a=42, b=34) | `seatPositions.ts` |
| בחירת לילה לא עבדה מסיבוב 2 | הוסף useEffect שמאפס `selectedTarget` בכל לילה | `GameBoard.tsx` |
| TURN servers (race condition) | `webrtc:join` נשלח עכשיו רק **אחרי** טעינת ICE servers | `useWebRTC.ts` |
| Next.js מזרז תשובת API | הוסף `export const dynamic = 'force-dynamic'` | `ice-servers/route.ts` |

---

## ✅ WebRTC בין-עירוני — תיקון מיושם (14 אפריל 2026)

### מה שונה
| קובץ | שינוי |
|---|---|
| `ice-servers/route.ts` | שינוי מ-GET ל-**POST** ל-Metered.ca (יוצר credentials זמניים); fallback: freestun + Open Relay |
| `useWebRTC.ts` | הוסף `freestun.net` ל-FALLBACK_ICE; הוסף **ICE restart** אוטומטי כש-ICE נכשל |

### שכבות הגנה
1. **Metered.ca POST** — יוצר credentials זמניים (86400s) ללא צורך בדשבורד
2. **freestun.net:3478 + 5349** — TURN חינמי ואמין כ-fallback
3. **Open Relay** — גיבוי אחרון
4. **ICE Restart** — אם החיבור נכשל, ה-offerer שולח offer חדש עם `iceRestart: true`

### לאמת
- `/api/debug-ice` — בדוק שה-POST מצליח
- Console: `[WebRTC] ICE servers loaded:` — אמור לכלול TURN servers
- Console: `[WebRTC] ICE connection state → connected` בין שחקנים ברשתות שונות

---

## 📁 קבצים מרכזיים

```
apps/web/src/
├── app/
│   ├── page.tsx                    # דף בית
│   ├── lobby/page.tsx              # לובי
│   ├── game/page.tsx               # דף המשחק
│   ├── test-media/page.tsx         # בדיקת מדיה + seat simulator
│   └── api/
│       ├── tts/route.ts            # Google Translate TTS proxy
│       ├── ice-servers/route.ts    # TURN/STUN credentials API
│       └── debug-ice/route.ts      # אבחון Metered.ca
├── components/game/
│   ├── GameBoard.tsx               # קומפוננטה ראשית
│   ├── PokerTable.tsx
│   ├── PlayerSeat.tsx
│   ├── NarratorSeat.tsx
│   ├── TableCenter.tsx             # טיימר דיון + הצבעה
│   ├── CardReveal.tsx
│   ├── GameOverModal.tsx
│   └── MediaControls.tsx
├── hooks/
│   ├── useSocket.ts
│   └── useWebRTC.ts                # WebRTC + ICE
├── lib/
│   ├── seatPositions.ts            # אלגוריתם מיקום מושבים
│   ├── sounds.ts                   # SoundManager + TTS
│   └── socket.ts
└── stores/gameStore.ts

apps/server/src/
├── game/engine.ts                  # לוגיקת משחק
├── rooms/manager.ts
└── socket/handlers.ts              # WebRTC signaling + game events
```

---

## 🔧 הרצה מקומית

```bash
# Terminal 1 — שרת
cd apps/server && npx tsx src/index.ts

# Terminal 2 — frontend
cd apps/web && npm run dev
# http://localhost:3000
```

---

## 🔜 מה נשאר לעשות

1. **תקן WebRTC בין-עירוני** — ראה "אפשרות א'" למעלה (יצירת TURN credential ב-Metered.ca)
2. בדיקת משחק מלא עם 4+ שחקנים

# משחק הרוצח — סיכום פרויקט

> עודכן לאחרונה: 14 אפריל 2026

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

## ⚠️ בעיה פתוחה: WebRTC בין-עירוני לא עובד

### תסמינים
- שחקנים באותה רשת רואים אחד את השני ✅
- שחקנים ברשתות שונות (ערים שונות) לא ✅
- ICE connection מגיע ל-`checking` ואז `failed`

### מה מומש
- `/api/ice-servers` — מחזיר STUN + TURN (Open Relay)
- `FALLBACK_ICE` בקליינט — כולל openrelay.metered.ca
- Debug endpoint: `/api/debug-ice`

### שורש הבעיה
**Metered.ca GET credentials API מחזיר 401**, למרות שה-SECRET KEY נכון:
- `GET https://the-killer.metered.live/api/v1/turn/credentials?apiKey=8zKfDl...` → `{"error":"Invalid API Key"}`
- הבדיקה אישרה: ה-SECRET KEY בדשבורד (`8zKfDl...`) זהה למה שב-Vercel
- תוכנית TURN: **TURN TRIAL GLOBAL 500MB**, תוקף עד MAY-14-2026, שימוש: 0GB
- **אין credentials שנוצרו** בדף "TURN Credentials" (ריק, מבקש "Generate First Credential")

### השערה
ייתכן שה-GET endpoint של Metered.ca לא מחזיר credentials דינמיים, אלא רק מציג credentials **סטטיים** שנוצרו ידנית. כיוון שאין credentials סטטיים, ה-API מחזיר 401.

### מה נשאר לנסות
**אפשרות א' (ראשון לנסות):** ב-Metered.ca dashboard → TURN Server → לחץ "Add Credential" ליצור credential סטטי. לאחר מכן בדוק שוב `/api/ice-servers` — אולי ימלא את הרשימה.

**אפשרות ב':** שנה את `/api/ice-servers` לבצע POST request ליצירת credentials זמניים:
```
POST https://the-killer.metered.live/api/v1/turn/credentials?apiKey=KEY
Body: { "label": "game-session" }
```
Response מחזיר `{ username, password }` שניתן להשתמש בהם כ-TURN credentials.

**אפשרות ג' (קיים כרגע - לא אמין):** Open Relay ציבורי (`openrelay.metered.ca`) — ICE מגיע ל-checking ונופל.

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

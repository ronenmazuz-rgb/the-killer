# משחק הרוצח — סיכום פרויקט

> עודכן לאחרונה: 13 אפריל 2026

---

## 🏗️ ארכיטקטורה

**Turborepo Monorepo** עם שלושה חלקים:

| Package | Tech | מה זה |
|---|---|---|
| `apps/web` | Next.js 15 + React 19 + TypeScript + Tailwind + Framer Motion | Frontend |
| `apps/server` | Node.js + Socket.IO + TypeScript | Backend (WebSocket server) |
| `packages/shared` | TypeScript | Types, events, constants משותפים |

---

## 🚀 Deployment

### שרת (Railway) — **פועל ✅**
- **URL:** `https://the-killerserver-production.up.railway.app`
- **Project name:** `successful-recreation`
- **Service:** `@the-killer/server`
- **GitHub auto-deploy:** כן — כל push ל-`main` מעלה אוטומטית
- **Variable קיים:** `CLIENT_URL` (מוסתר)

### Frontend (Vercel) — **לא הושלם ❌**
- המשתמש מחובר כ-`ronenmazuz-rgb`
- הבעיה: Vercel מנסה להתקין `@the-killer/shared` מ-npm registry ולא מוצא אותו (זו חבילת workspace מקומית)
- **הפתרון שלא הושלם:** צריך לפרוס מה-root של ה-monorepo (לא מ-`apps/web`)
- `.env.production` קיים ב-`apps/web/.env.production` עם:
  ```
  NEXT_PUBLIC_SOCKET_URL=https://the-killerserver-production.up.railway.app
  ```

### 🔧 מה צריך לעשות כדי להשלים ה-Vercel deployment:

**אפשרות A — דרך Vercel UI (הכי פשוטה):**
1. היכנס לvercel.com → New Project
2. Import `the-killer` repo מ-GitHub
3. **Root Directory:** השאר ריק (root של ה-repo)
4. **Framework Preset:** Next.js
5. **Build Command:** `npm run build --workspace=@the-killer/web`
6. **Output Directory:** `apps/web/.next`
7. **Environment Variable:** `NEXT_PUBLIC_SOCKET_URL` = `https://the-killerserver-production.up.railway.app`
8. Deploy
9. אחרי שמקבלים URL — עדכן ב-Railway את `CLIENT_URL` ל-Vercel URL

**אפשרות B — CLI מה-root:**
```bash
cd "משחק הרוצח"   # root של ה-monorepo
# צור vercel.json בroot:
# { "buildCommand": "npm run build --workspace=@the-killer/web", "outputDirectory": "apps/web/.next", "framework": "nextjs" }
npx vercel --prod --yes
```

---

## 🎮 מצב המשחק

### פיצ'רים שמומשו ✅

#### UI / UX
- **שולחן פוקר אימרסיבי** — `PokerTable.tsx` עם גרדיאנט ירוק-כהה, קצוות עגולות, blood splatter
- **עיגולי וידאו גדולים** — 128px desktop, 88px mobile (הכי חשוב לראות הבעות פנים)
- **מושבים סימטריים** — אלגוריתם חדש ב-`seatPositions.ts` שמציב שחקנים בזוגות ימין/שמאל:
  - N=4: 270°, 350°, 190°, 90°
  - N=6: 270°, 325°, 215°, 17°, 163°, 90°
- **מנחה** (🎩) — animation הקלדה אות-אות + TTS עברי
- **קלף אישי** — reveal animation בתחילת משחק

#### זרימת משחק (חדשה)
1. **DEALING_CARDS** (5s) — כל שחקן רואה את הקלף שלו
2. **NIGHT_DETECTIVE** (15s) — הבלש בוחר שחקן לחקור
3. **NIGHT_KILLER** (15s) — הרוצח בוחר קורבן
4. **DAY_ANNOUNCEMENT** (5s) — הכרזה על מי נהרג
5. **DAY_DISCUSSION** (60s) — דיון חופשי עם ספירה לאחור אנימציה
6. **DAY_VOTING** (30s) — כל שחקן חי בוחר מי לדעתו הרוצח
7. **רוב יחסי** — הכי הרבה קולות מוצא; שיוויון = אף אחד לא מוצא
8. חזרה ל-NIGHT או GAME_OVER

#### WebRTC
- וידאו ואודיו חי בין שחקנים
- `localStream` ו-`remoteStreams` מנוהלים ב-`useWebRTC.ts`
- `MiniVideo.tsx` — video element שממלא את העיגול

#### TTS (מנחה)
- `narratorSpeak()` ב-`sounds.ts` — Web Speech API, עברית
- תוקן: לא מגמגם יותר (הוסרה `displayedText` מה-dependency array של useEffect)
- תוקן: Chrome pause bug workaround (resume כל שנייה)

---

## 📁 קבצים מרכזיים

```
apps/web/src/
├── app/
│   ├── page.tsx              # דף בית — כניסה/יצירת חדר
│   ├── lobby/page.tsx        # לובי — רשימת שחקנים
│   ├── room/[code]/page.tsx  # דף המשחק
│   └── test-table/page.tsx   # דף בדיקה ויזואלית
├── components/game/
│   ├── GameBoard.tsx         # הקומפוננטה הראשית — מנהלת כל המשחק
│   ├── PokerTable.tsx        # עיצוב שולחן הפוקר
│   ├── PlayerSeat.tsx        # עיגול שחקן (וידאו/אמוג'י + שם + תפקיד)
│   ├── MiniVideo.tsx         # וידאו בתוך העיגול
│   ├── NarratorSeat.tsx      # מנחה עם TTS + typing animation
│   ├── TableCenter.tsx       # מרכז שולחן (טיימר דיון, הצבעה)
│   ├── CardReveal.tsx        # אנימציית גילוי קלף
│   ├── BloodSplatter.tsx     # אפקט דם (seeded random למניעת hydration error)
│   ├── GameOverModal.tsx     # מסך סיום
│   └── MediaControls.tsx     # כפתורי מיק/מצלמה
├── lib/
│   ├── seatPositions.ts      # אלגוריתם מיקום מושבים סימטרי
│   ├── sounds.ts             # SoundManager (Howler.js) + narratorSpeak (TTS)
│   └── socket.ts             # Socket.IO client
├── hooks/
│   ├── useSocket.ts          # Socket events + emit functions
│   └── useWebRTC.ts          # WebRTC peer connections
└── stores/
    └── gameStore.ts          # Zustand store

apps/server/src/
├── game/engine.ts            # לוגיקת משחק — מעברי שלב, טיימרים, הצבעה
├── rooms/manager.ts          # ניהול חדרים בזיכרון
├── socket/handlers.ts        # Socket.IO event handlers
└── shared/
    ├── types.ts              # Phase, Role, ClientGameState וכו'
    ├── events.ts             # CLIENT_EVENTS, SERVER_EVENTS
    └── constants.ts          # TIMERS (DISCUSSION_PHASE=60s, VOTING_PHASE=30s)

packages/shared/src/
├── types.ts                  # אותם types — מייוצאים ל-frontend
├── events.ts
└── constants.ts
```

---

## 🐛 בעיות שנפתרו

| בעיה | פתרון |
|---|---|
| Hydration mismatch (500 error) ב-BloodSplatter | החלפת `Math.random()` בseeded PRNG (`mulberry32`) |
| TTS מגמגם בכבדות | הסרת `displayedText` מdependency array + Chrome pause workaround |
| עיגולים לא סימטריים | אלגוריתם זוגות ימין/שמאל חדש ב-seatPositions.ts |
| שרת לא עלה ל-Railway | תיקון start command ו-monorepo build config |
| Vercel לא מוצא @the-killer/shared | עדיין לא נפתר (ראה למעלה) |

---

## ⚠️ דברים חשובים לדעת

1. **Railway trial** — מסך Railway הראה "3 days or $4.64 left" — ייתכן שצריך להוסיף אמצעי תשלום
2. **`votes` type שונה** — מ-`Record<string, boolean>` ל-`Record<string, string>` (voterId → targetId) — כל הcode עודכן בהתאם
3. **אין DAY_DEFENSE יותר** — הוסר מזרימת המשחק (enum עדיין קיים)
4. **GitHub repo:** `https://github.com/ronenmazuz-rgb/the-killer`
5. **Vercel account:** `ronenmazuz-rgb`

---

## 🔜 מה נשאר לעשות

1. **השלם Vercel deployment** (ראה הוראות למעלה)
2. **עדכן CLIENT_URL ב-Railway** לאחר קבלת Vercel URL
3. **בדיקה עם חברים** — משחק אמיתי עם 4+ שחקנים
4. שדרוג Railway מ-trial לחשבון בתשלום אם צריך

---

## 🚀 הרצה מקומית

```bash
# Terminal 1 — שרת
cd apps/server
npx tsx src/index.ts

# Terminal 2 — frontend
cd apps/web
npm run dev

# פתח: http://localhost:3000
```

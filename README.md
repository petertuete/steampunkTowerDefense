# BrowserGame - Tower Defense Prototype

Phaser-3 Tower-Defense-Prototyp mit:

- Frontend (Vite + Phaser)
- Mini-Backend (Express)
- Highscore/Run-Tracking via Supabase

## Projektstruktur

- `frontend/` - Spielclient
- `lernen/backend-mini/` - API fuer Run-Submit und Leaderboard
- `*.md` - Spezifikationen, Guides und Handovers

## Voraussetzungen

- Node.js 18+
- npm
- Supabase-Projekt (fuer Highscore)

## Lokale Entwicklung

### 1) Frontend

```bash
npm --prefix frontend install
npm --prefix frontend run dev
```

### 2) Backend

```bash
npm --prefix lernen/backend-mini install
npm --prefix lernen/backend-mini run dev
```

Wenn kein `run dev` vorhanden ist:

```bash
node lernen/backend-mini/server.js
```

## Environment Variablen

### Backend (`lernen/backend-mini/.env`)

```env
PORT=3001
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:8000,http://localhost:8080
RUNS_RATE_LIMIT_WINDOW_MS=60000
RUNS_RATE_LIMIT_MAX=30
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

Fuer Deployment:

- `NODE_ENV=production`
- `ALLOWED_ORIGINS` auf eure Frontend-Domain setzen (z. B. `https://your-game.vercel.app`)
- Optional: `RUNS_RATE_LIMIT_WINDOW_MS` und `RUNS_RATE_LIMIT_MAX` fuer strengere Limits anpassen

### Frontend (`frontend/.env`)

```env
VITE_API_BASE_URL=http://localhost:3001
VITE_CLIENT_VERSION=dev-local
```

## Deployment (empfohlen)

- Frontend: Vercel
- Backend: Render
- Datenbank: Supabase

## Hinweis

Service-Role-Keys niemals ins Repo committen. Die `.gitignore` blockt `.env`-Dateien absichtlich.

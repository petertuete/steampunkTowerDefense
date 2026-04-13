# API Specification — BrowserGame Run and Leaderboard API

Version: 1.1  
Datum: 13. April 2026  
Base URL lokal: http://localhost:3001/api/v1  
Base URL online: https://<domain>/api/v1

---

## Allgemeine Konventionen

- Alle Requests und Responses verwenden `Content-Type: application/json`
- Timestamps im ISO-8601-Format (UTC)
- Die API liegt unter `/api/v1/`
- Fehlerresponses verwenden aktuell ein einfaches Format: `{ "error": "..." }`

---

## Endpunkte

### GET /api/v1/health
Health-Check fuer lokale Entwicklung und Deployment-Pruefung.

#### Erfolgs-Response `200 OK`
```json
{
  "status": "ok",
  "service": "highscore-api",
  "environment": "development",
  "supabaseConfigured": true,
  "runAuthConfigured": true
}
```

---

### GET /api/v1/auth/challenge
Liefert ein kurzlebiges Run-Auth-Token fuer einen anschliessenden Run-Submit.

#### Erfolgs-Response `200 OK`
```json
{
  "token": "<signed-token>",
  "expiresInSec": 60
}
```

#### Fehler
- `503`: Run-Auth ist auf dem Backend nicht konfiguriert.
- `429`: Challenge-Rate-Limit erreicht.

---

### POST /api/v1/runs
Speichert einen kompletten Run inklusive serverseitig verifizierter Score-Daten und Tower-Nutzung.

#### Header
- `X-Run-Auth-Token: <token>`

#### Minimal relevanter Request Body
```json
{
  "playerName": "SteamLord",
  "result": "won",
  "selectedLevelKey": "level3",
  "selectedLevelNumber": 3,
  "waveReached": 20,
  "totalWaves": 20,
  "totalKills": 123,
  "totalLeaks": 0,
  "totalGoldEarned": 2500,
  "totalGoldSpent": 1800,
  "totalGoldRemaining": 700,
  "livesRemaining": 20,
  "scoreGold": 700,
  "scorePoints": 3450,
  "scoreMeta": {
    "totalNoLeakWaves": 55,
    "runHasSoldTower": false,
    "scoreBreakdown": {
      "killPoints": 1230,
      "noLeakWavePoints": 2750,
      "levelClearPoints": 900,
      "goldPoints": 700
    }
  },
  "towerUsageByLevel": {
    "level1": {
      "levelNumber": 1,
      "levelName": "Beginner",
      "placements": []
    }
  },
  "clientVersion": "dev-local"
}
```

#### Wichtige Validierung
- `playerName`: 3-10 Zeichen nach Sanitize-Regeln
- `scoreMeta` ist Pflicht
- `scorePoints` muss exakt zur serverseitigen Formel passen
- `scoreGold` muss zu `goldPoints` passen
- `towerUsageByLevel` wird strikt validiert und normalisiert
- Ohne gueltiges `X-Run-Auth-Token` wird der Submit abgelehnt

#### Erfolgs-Response `201 Created`
```json
{
  "ok": true,
  "run": {
    "id": 42,
    "player_name": "SteamLord",
    "score_points": 3450,
    "score_gold": 700,
    "result": "won",
    "submitted_at": "2026-04-13T12:00:00.000Z"
  },
  "placementsSaved": 18
}
```

#### Fehler
- `400`: ungueltige Payload oder unplausible Score-Daten
- `401`: fehlendes oder ungueltiges Run-Auth-Token
- `429`: Submit-Rate-Limit erreicht
- `503`: Supabase oder Run-Auth nicht korrekt konfiguriert

---

### GET /api/v1/scores
Liefert Leaderboard-Eintraege, standardmaessig Top-20, maximal 100.

#### Query-Parameter
| Parameter | Typ | Default | Regeln |
|-----------|-----|---------|--------|
| `limit` | integer | `20` | min `1`, max `100` |

#### Erfolgs-Response `200 OK`
```json
{
  "items": [
    {
      "id": 42,
      "player_name": "SteamLord",
      "score_points": 3450,
      "score_gold": 700,
      "result": "won",
      "selected_level_number": 3,
      "wave_reached": 20,
      "submitted_at": "2026-04-13T12:00:00.000Z"
    }
  ]
}
```

#### Verhalten
- Sortierung: zuerst `score_points` absteigend, dann `submitted_at` absteigend
- Response enthaelt immer `items`, auch wenn leer
- Ein Spieler darf mehrfach in der Liste erscheinen

---

## Persistenz

### Tabelle `game_runs`
Speichert den kanonischen Run inklusive `score_points`, `score_gold`, Ergebnis, Telemetrie und `tower_usage_by_level`.

### Tabelle `tower_usage_entries`
Speichert flache Placements pro Run fuer spaetere Auswertung.

---

## Sicherheit

- HMAC-basierte Run-Authentifizierung ueber `RUN_AUTH_SECRET`
- Nonce-/Replay-Schutz fuer Run-Submits
- Rate-Limiting fuer Challenge- und Run-Endpunkte
- CORS ueber `ALLOWED_ORIGINS`
- Serverseitige Score-Verifikation statt blindem Client-Trust

---

## Umgebungsvariablen

| Variable | Beispielwert | Beschreibung |
|----------|--------------|--------------|
| `PORT` | `3001` | Port des Backends |
| `NODE_ENV` | `development` | Laufzeitmodus |
| `ALLOWED_ORIGINS` | `http://localhost:5173` | Erlaubte Frontend-Origins |
| `RUN_AUTH_SECRET` | `<long-random-secret>` | HMAC-Secret fuer Run-Auth |
| `RUN_AUTH_TOKEN_TTL_SECONDS` | `60` | Token-Lebensdauer |
| `RUNS_RATE_LIMIT_WINDOW_MS` | `60000` | Zeitfenster fuer Run-Submit-Limits |
| `RUNS_RATE_LIMIT_MAX` | `30` | Max. Run-Submits pro Fenster |
| `CHALLENGE_RATE_LIMIT_WINDOW_MS` | `60000` | Zeitfenster fuer Challenge-Limits |
| `CHALLENGE_RATE_LIMIT_MAX` | `60` | Max. Challenges pro Fenster |
| `SUPABASE_URL` | `https://<project>.supabase.co` | Supabase-Projekt |
| `SUPABASE_SERVICE_ROLE_KEY` | `<service-role-key>` | Admin-Key fuer Inserts |

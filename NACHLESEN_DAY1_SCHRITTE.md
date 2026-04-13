# Nachlesen Day 1 und heutiger Stand

Datum letzte Aktualisierung: 5. April 2026

## Zweck dieser Datei
Diese Datei ist jetzt zweigeteilt:
1. Historie: Was an Day 1 gelernt und gebaut wurde
2. Status heute: Was daraus im echten Projekt entstanden ist

---

## A) Historie (Day 1, 16. Maerz 2026)

Day 1 war die HTTP/CORS-Basisrunde:
- Mini-Frontend gebaut ([lernen/button.html](lernen/button.html), [lernen/button-backend.html](lernen/button-backend.html))
- Mini-Backend mit Express gebaut ([lernen/backend-mini/server.js](lernen/backend-mini/server.js))
- Health-Endpoint getestet
- CORS-Problem verstanden und geloest

Kurz gesagt:
Der Grundfluss Frontend -> Backend -> JSON-Antwort wurde praktisch geuebt und verstanden.

---

## B) Was daraus heute geworden ist (Live-Stand)

Aus dem Day-1-Setup ist ein deploytes Spiel geworden:

1. Gameplay
- 3-Level-Kampagne spielbar
- 5 Turmtypen aktiv (ohne Moerser)
- Wave-System auf String-Notation umgebaut (`n`, `s`, `a`, `.`)
- Level-2 Geometrie als Zickzack-Pfad getuned

2. Highscore und Daten
- Nameingabe am Endscreen (3-10 Zeichen)
- Score-Submit ans Backend
- Top-20 Leaderboard am Endscreen
- Tower-Usage-Analytics pro Level gespeichert

3. Backend/Security
- Supabase-Integration produktiv
- CORS ueber `ALLOWED_ORIGINS` env-gesteuert
- Production-safe Health-Endpoint
- Dependency-Security-Check durchgefuehrt und behoben

4. Release/Operations
- GitHub-Repo eingerichtet und gepusht
- Tag gesetzt: `v1.0.0-live`
- Frontend auf Vercel deployed
- Backend auf Render deployed

---

## C) Schneller Wiedereinstieg (morgen)

1. Projektstand lesen:
- [HANDOVER_STATUS.md](HANDOVER_STATUS.md)
- [RESUME_NEXT_STEPS.md](RESUME_NEXT_STEPS.md)

2. Lokal starten:
- Frontend: `npm --prefix frontend run dev`
- Backend: `npm --prefix lernen/backend-mini start`

3. Fokus naechste Session:
- Balancing-Feintuning Level 2/3 mit echten Tester-Runs
- Optional Rate-Limit fuer Run-Submit

---

## D) Merksatz

Day 1 war der Schraubenzieher.
Jetzt steht damit eine laufende Arcade-Maschine online.

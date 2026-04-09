# Handover Status - BrowserGame

Datum: 7. April 2026

## Projektziel
Steampunk Pixel-Art Tower Defense als spec-driven Vibe-Coding-Projekt, zuerst lokal kostenlos, spaeter onlinefaehig.

## Aktueller Realstand
3-Level-Kampagne spielbar, Highscore-Pipeline produktiv online, Deployment live (Frontend + Backend), Security-Hardening umgesetzt.

Implementiert (Stand 5. April 2026):
- Grid + Pfad-Visualisierung (Startfeld grün, Zielfeld rot, Pfad grau)
- Enemy-Movement entlang Wegpunkten (deltaTime-basiert)
- Tower-Placement (Linksklick), Tower-Verkauf (Shift+Linksklick, 75% Rückgeld)
- Kollisionen: keine Tower auf Pfad, keine Überlappung
- Targeting-System (First-Targeting, 40px Ziellinie)
- Schusslogik + Projektile für Dampfkanone und Hochdruck-Kanone
- Flammenwerfer: kontinuierlicher Beam-Schaden (rote Linie) + Nachbrennen (DoT) beim Radius-Verlassen
- Tesla: Instant-Chain-Lightning (kein Projektil), blauer Blitz-Schuss-Flash, Primärblitz nur wenn Ziel überlebt
- Tesla-Kettensymbol/Blitz auch bei Hop-Gegnern nur wenn beide alive
- Generator-Buff: +15% Damage, nicht stapelbar (maximal 1 Generator pro Turm)
- Mörser ENTFERNT (kein Gameplay-Nutzen)
- Damage + Kill + Gold-Reward
- Wave-System als String-Notation (n/s/a/.) fuer feingranulare Spawn-Choreografie
- "Jetzt starten" Button + Space-Shortcut für Wave-Skip
- Leben-System + Leak-Schaden
- Game Over Screen + Win Screen inkl. Neustart
- Tower-Wechsel per Taste T inkl. HUD-Feedback
- Cursor-Preview für Tower-Platzierung (crosshair / not-allowed bei Shift)
- Enemy-Healthbars
- Run-Telemetrie: Kills, Leaks, Gold-Einnahmen/Ausgaben, Tower-Nutzung
- 3-Level-Kampagne: Beginner (15 Wellen), Advanced (20 Wellen), Ultimate (25 Wellen)
- Automatische Level-Progression nach Abschluss
- Kumulatives Gold-Scoring: Gold aus alten Levels → Sonderkonto, neues Level mit frischem STARTING_GOLD
- Level-Selector im HUD ([Beginner] [Advanced] [Ultimate])
- Wellen-Skalierung: Gegner-HP +14% pro Welle (innerhalb eines Levels)
- Level-Skalierung: Gegner-HP x1.0 / x1.6 / x2.2 je Level
- Armored-Gegner haben 50% DoT-Resistenz
- Flammwerfer-Nachbrennen-Cooldown: max. 1x alle 2.5s pro Gegner
- Sell-Modus-Anzeige im HUD (grün = Bauen / rot = Verkaufen mit Shift)
- Speed-Toggle per Taste S (1x / 2x)
- Tower.destroy() idempotent und null-safe
- Endscreen-Nameingabe + Score-Submit an Backend
- Top-10 Leaderboard im Endscreen (Win + Game Over)
- Tower-Nutzungsanalyse pro Level inkl. Grid/Screen-Koordinaten
- Level-2 Geometrie auf Zickzack-Pfad umgestellt
- Level-2 Economy-Tuning: doppelter Gold-Reward pro Kill
- Player-Name auf 3-10 Zeichen begrenzt (Frontend + Backend)
- Backend Security-Hardening:
   - CORS ueber ALLOWED_ORIGINS steuerbar
   - NODE_ENV-aware Health-Endpoint (keine sensitiven Details in production)
   - x-powered-by Header deaktiviert
- Dependencies geprueft, ReDoS-Luecke (path-to-regexp) behoben
- GitHub-Repo erstellt und initialisiert
- Release-Tag gesetzt und gepusht: v1.0.0-live
- Spiel online deployed (Vercel + Render)

## Kritische Architektur-Info
Phaser scene.restart() führt create() neu aus, aber nicht den Constructor.
Mutable Spielzustand IMMER in create() zurücksetzen.
init(data) Hook fängt restart()-Payload (campaignContinue, selectedLevelKey, carryState).
Gold-Trennung: this.gold = spendbar, this.accumulatedScoreGold = Sonderkonto.

## Relevante Dateien (Core)
- frontend/src/scenes/GameScene.js (Kampagne, Gold-Trennung, Speed-Toggle, Sell-Logik, Submit/Leaderboard)
- frontend/src/entities/Enemy.js (HP-Skalierung Level+Welle, DoT-Resistenz Armored)
- frontend/src/entities/Tower.js (Flammenwerfer-Beam, Tesla-Blitz, Generator-Cap, destroy())
- frontend/src/entities/Projectile.js (AoE, DoT, Chain für Projektil-Tower)
- frontend/src/config/waves.js (3 Levels im n/s/a/. Wave-Stringformat)
- frontend/src/config/enemies.js
- frontend/src/config/towers.js (5 Tower-Typen, kein Mörser)
- frontend/src/config/paths.js (3 Level-Pfade: S-Form, Level-2-Zickzack, Gerader)
- lernen/backend-mini/server.js (Supabase API, Input-Validation, CORS-Hardening)
- lernen/backend-mini/supabase.schema.sql (game_runs + tower_usage_entries + RLS)

## Lokales Starten (sicherer Ablauf)
1. Frontend:
   - cd frontend
   - npm install
   - npm run dev
   - Browser: http://localhost:5173

2. Backend (optional für spätere Score-API):
   - cd lernen/backend-mini
   - npm install
   - node server.js

Wichtig:
- npm run dev im Projekt-Root (/BrowserGame) funktioniert NICHT.
- Dev-Server immer aus frontend/ starten.

## Steuerung (Stand 4. April 2026)
- Linksklick: Tower platzieren
- Shift + Linksklick: Tower verkaufen (75% Rückgeld)
- T: Tower-Typ wechseln
- S: Speed 1x/2x umschalten
- Space: nächste Welle jetzt starten

## Verifizierter Zustand am Ende dieses Tages
- 3-Level-Kampagne komplett spielbar inkl. Auto-Progression
- Kumulatives Scoring korrekt (Gold aus Level 1+2+3 im Endscore)
- Highscore-Submit live inkl. Nameingabe und Top-10 Anzeige
- Tower-Usage-Analytics in DB gespeichert
- Level-2 Pfad + Economy erfolgreich nachgetuned
- Wave-System auf n/s/a/. umgestellt und laeuft
- Backend audit: 0 vulnerabilities (prod dependencies)
- Security-Hardening deployed und produktiv
- GitHub + Tag v1.0.0-live vorhanden
- Vercel + Render Deployment erfolgreich

## Update Session 7. April 2026 (Scoring + UI)
- Neues Punkte-System produktiv integriert:
   - +10 pro Kill
   - +50 pro leak-freie Welle
   - +500 + 20 pro Leben bei Level-Clear
   - +1 pro Endgold
   - Perfection-Multiplikator x1.5 ohne Turmverkauf im Run
- Score wird serverseitig als `score_points` gespeichert und Leaderboard danach sortiert
- Leaderboard auf Top-20 umgestellt (API + Frontend)
- Endscreen auf 3-Panel-Layout umgebaut:
   - links: Punkte-Rechnung des konkreten Runs
   - mitte: Game Over / Win Summary
   - rechts: Top-20 Liste
- HUD zeigt waehrend des Spiels den Live-Score (`Score: ... pts`)
- CORS-Matching im Backend gehaertet (Origin-Normalisierung + localhost/127.0.0.1 defaults)
- Online-Test (live) erfolgreich durchgefuehrt

## Aktuelle Tags / Checkpoints
- v1.0.0-live (frueherer Live-Release)
- v1.1.0-scoring-live (Scoring-Overhaul + Top20 + Endscreen/HUD + CORS)

## Release-1 Scope Summary (aktuell verbindlich)
In Scope (v1):
- 5 Turmtypen (Dampfkanone, Hochdruck-Kanone, Flammenwerfer, Tesla, Generator)
- 3-Level-Kampagne mit Auto-Progression und kumulativem Scoring
- Wave-/Level-Gameplay, Leben/Gold/HUD, Win/Lose + Neustart
- Balancing-Tracking (Kills, Leaks, Gold, Turm-Nutzung)
- Highscore-API bleibt technisch vorbereitet

Out of Scope (Post-Release):
- Turm-Upgrades (3 Stufen + Ult)
- Upgrade-UI und Upgrade-Assets
- Ult-Spezialfaehigkeiten als alternative Upgrade-Pfade

Merksatz fuer Folge-Sessions:
- Release 1 = spielbarer Core ohne Upgrade-System.

## Offene naechste Schritte (priorisiert)
1. Balancing-Feintuning Level 2/3 auf Basis echter Tester-Runs
2. Optional: bestehende Rate-Limits / Challenge-TTL auf Basis echter Nutzung nachjustieren
3. Optional: Tester-Feedback-Loop aufsetzen (Formular + Auswertung)
4. Supabase service-role key vorsorglich rotieren
5. Post-Release Backlog unveraendert: Turm-Upgrades + Upgrade-UI

## Kommunikationsstil (User-Praeferenz)
- Ansprache: Copilot
- Ton: trocken, nerdig, intelligent, ironisch/sarkastisch
- Humor: schwarzer nerdiger Humor willkommen
- Vorgehen: kleine klare Schritte, einsteigerfreundlich

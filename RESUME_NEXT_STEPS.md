# Resume Next Steps

Wenn nach vollständigem Kontextverlust weitergemacht werden soll, nutze diesen Starttext:

Ich möchte exakt am letzten BrowserGame-Checkpoint weitermachen.
Bitte lies zuerst HANDOVER_STATUS.md und danach frontend/src/scenes/GameScene.js.
Führe dann einen kurzen Ist-Check durch (was läuft bereits, was fehlt noch) und schlage den nächsten kleinstmöglichen Schritt vor.
Arbeite in kleinen, testbaren Schritten.
Nutze den Stil: trocken, nerdig, intelligent, mit Ironie/Sarkasmus.
Sprich mich im lockeren Du-Stil an, und ich nenne dich Copilot.

## Schnellstart für den nächsten Tag
1. cd frontend
2. npm install
3. npm run dev
4. Browser auf http://localhost:5173
5. Kurztest:
   - Beginner-Level starten
   - Tower platzieren (Linksklick)
   - Tower verkaufen (Shift+Linksklick)
   - T zum Tower-Wechsel
   - S für 2x Speed
   - Flammenwerfer: rote Linie beim Schuss sichtbar, Nachbrennen bei Radius-Verlassen
   - Tesla: blauer Blitz-Flash beim Schuss
  - Endscreen: Name eingeben (3-10 Zeichen), Score speichern
  - Top-20 Leaderboard wird geladen
  - HUD: Live-Score waehrend des Spiels sichtbar

## Deployment-Status
- Frontend ist auf Vercel live
- Backend ist auf Render live
- Supabase Speicherung funktioniert (game_runs + tower_usage_entries)
- Git-Tag fuer Live-Stand vorhanden: v1.0.0-live
- Neuer Checkpoint-Tag vorhanden: v1.1.0-scoring-live

## Aktueller Funktionsstand (7. April 2026)
- 3-Level-Kampagne: Beginner / Advanced / Ultimate
- Auto-Progression nach Level-Abschluss
- Kumulatives Gold-Scoring (Gold aus vorherigen Levels = Sonderkonto)
- Jedes neue Level startet mit frischem STARTING_GOLD (400g)
- 5 Turm-Typen (Mörser entfernt):
  - Dampfkanone: Standard-Projektil
  - Hochdruck-Kanone: Langstrecken-Projektil
  - Flammenwerfer: Beam-Schaden (kontinuierlich) + Nachbrennen DoT
  - Tesla: Instant-Chain-Blitz, kein Projektil
  - Generator: +15% Buff (nicht stapelbar)
- Tower verkaufen per Shift+Linksklick (75%)
- Sell-Modus-Anzeige im HUD
- Speed-Toggle S (1x / 2x)
- Wellen-Skalierung: +14% HP pro Welle
- Level-Skalierung: x1.0 / x1.6 / x2.2 HP
- Armored: 50% DoT-Resistenz
- Nachbrennen-Cooldown: 1x alle 2.5s pro Gegner
- Wave-Stringformat aktiv: n/s/a/. (inkl. Extra-Pausen via '.')
- Level-2 Pfad als Zickzack umgesetzt
- Level-2 Gegner droppen doppeltes Gold
- Nameingabe und Score-Submit ans Backend abgeschlossen
- Endscreen Top-20 Leaderboard abgeschlossen
- Backend-Hardening aktiv (ALLOWED_ORIGINS, production-safe health)
- Punkte-System aktiv (Kill/Wave/Clear/Gold + Perfection x1.5)
- Endscreen 3-Panel-Layout aktiv (Run-Rechnung | Summary | Top20)
- HUD-Live-Score aktiv

## Nächste offene Themen

### Prio 1 - Balancing weiter tunen
- Punkte-System Feintuning auf Basis echter Runs (Gewichtung Kill/Wave/Clear/Gold/Perfection)
- Level 1 Beginner: Flammenwerfer-Only sollte spätestens Welle 5-6 Probleme machen
- Level 2 + 3: mit echten externen Testern evaluieren
- Telemetrie-Daten nutzen: Kills/Leaks/Gold-Ausgaben im Konsolenlog
- Wellen-Skalierungsfaktor (aktuell 14%) ggf. weiter anpassen

### Prio 2 - Stabilisierung Security/Operations
- Service-role key rotation in Supabase (vorsorglich)
- Optional: Rate-Limiter fuer POST /api/v1/runs
- Optional: Monitoring/Alerting fuer Render Logs

### Prio 3 - Optional Polish
- Leaderboard-UI visuell verfeinern
- Level-Beschreibungen im Selector ([Beginner - Einsteiger])
- Grafik/Asset-Phase planen (Sprites, Tiles, Steampunk-Look)

## Scope-Hinweis (wichtig)
- Release 1 bewusst ohne Turm-Upgrades.
- Upgrades + Upgrade-UI sind Post-Release.
- Mörser bleibt entfernt bis er sinnvoll eingebaut werden kann.

## Falls etwas plötzlich kaputt wirkt
- Erst prüfen, ob Dev-Server im richtigen Ordner gestartet wurde (frontend/)
- Danach Console-Logs im Browser checken (F12)
- Dann gezielt GameScene.js State-Transitions prüfen (init/create/restart)
- Bei Port-Konflikt: die im Vite-Terminal ausgegebene URL nutzen
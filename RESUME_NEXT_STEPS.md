# Resume Next Steps — Handover 29. April 2026

**Status:** ✅ Production-ready. Gameplay stabil, Security gehaertet, UI/HUD visuell konsolidiert, Dependencies aktualisiert, Audio-Basis integriert.

Wenn nach vollständigem Kontextverlust weitergemacht werden soll:

**Starttext:**
```
Ich möchte exakt am letzten BrowserGame-Checkpoint weitermachen (29.4.2026, EOD).
Bitte lies zuerst HANDOVER_STATUS.md und danach frontend/src/scenes/GameScene.js.
Führe dann einen kurzen Ist-Check durch (was läuft bereits, was fehlt noch) 
und schlage den nächsten kleinstmöglichen Schritt vor.
Arbeite in kleinen, testbaren Schritten.
Nutze den Stil: trocken, nerdig, intelligent, mit Ironie/Sarkasmus.
Sprich mich im lockeren Du-Stil an, und ich nenne dich Copilot.
```

## Schnellstart für den nächsten Tag
1. cd frontend
2. npm install
3. npm run dev
4. Browser auf http://localhost:5173
5. Kurztest:
  - Intro-Screen optisch prüfen (Dampf, Glas-Panel, Start-Button, Hilfe-Modal)
  - Ingame-HUD optisch prüfen (Brass/Smoke-Glass, Buttons, Mode-Toggle)
  - Wave-Preview prüfen: Rahmen gedaempft, Kernfarbe je Gegnertyp sichtbar
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
  - Audio: Musik-Loop laeuft, SFX fuer Place/Kill/Wave/Leak/Invalid/WaveComplete ausloesen

## Deployment-Status
- Frontend ist auf Vercel live
- Backend ist auf Render live
- Supabase Speicherung funktioniert (game_runs + tower_usage_entries)
- Git-Tag fuer Live-Stand vorhanden: v1.0.0-live
- Neuer Checkpoint-Tag vorhanden: v1.1.0-scoring-live

## Aktueller Funktionsstand (13. April 2026, 20:45 UTC)
- ✅ 3-Level-Kampagne: Beginner / Advanced / Ultimate (15 / 20 / 20 Wellen)
- ✅ Auto-Progression nach Level-Abschluss
- ✅ Kumulatives Gold-Scoring
- ✅ 5 Turm-Typen mit Balancing:
  - Dampfkanone: 30 DMG, 0,4 Fire Rate, Range 120
  - Hochdruck-Kanone: 40 DMG, 0,3 Fire Rate, Range 180
  - Flammenwerfer: 25 DMG, 0,5 Fire Rate, Beam + 5 DoT
  - Tesla: 30 DMG, 0,5 Fire Rate, Range 130, Chain
  - Generator: +33% Buff (non-stacking)
- ✅ Tower verkaufen (Shift+Click, 75%)
- ✅ Speed-Toggle (S: 1x/2x)
- ✅ Wellen-Skalierung: +14% HP/Wave
- ✅ Intro-Screen: überarbeiteter Text, korrigierter Generator-Buff auf +33%
- ✅ Scoring-Modal im Intro: sauber, ohne Beispiel-Rechnung

## Zuletzt commitet (13.4.2026 20:45)
```
Commit: 05a1a6e
Message: Intro screen refinements: cleaner UI text, fix generator buff to +33%, remove example calculation
```

## Zuletzt commitet (28.4.2026 EOD)
```
Commit: 8d49f2b
Message: Polish UI consistency across intro, HUD, and overlay screens
```

## Zuletzt commitet (29.4.2026)
```
Commit: efe0e0f
Message: Update backend-mini dependencies and config

Commit: 9514250
Message: Update dependencies

Commit: cf0ad8c
Message: Add background music (Victoriana Loop) to gameplay scene
```

Dateien der letzten beiden Commits:
- frontend/package.json
- frontend/package-lock.json
- lernen/backend-mini/package.json
- lernen/backend-mini/package-lock.json
- lernen/backend-mini/server.js

## Deployment-Live-Status (bestätigt)
- ✅ Frontend läuft auf Vercel
- ✅ Backend läuft auf Render (Supabase konfiguriert)
- ✅ Score-Submit E2E-Test erfolgreich
- ✅ Supabase Key-Rotation abgeschlossen (secret key aktiv, alter JWT-Key revoked)
- ✅ CORS & Query-Validation hardening live
- ✅ Leaderboard live abrufbar

## Nächste offene Themen (priorisiert)

### Prio 1 — Balancing & Gameplay-Feintuning
- Level 1 Testieren: mit Flammenwerfer-Only bis Welle 5 durchkommen (danach sollte es knackig werden)
- Level 2 & 3: echte externe Tester feedback sammeln
- Punkte-Gewichtung Evaluieren: Kill vs Wave vs Clear - sind alle gleichgewichtig genug?
- Telemetrie durchschauen: Was spielen Nutzer, wo brechen sie ab?
- Wellen-Skalierung (aktuell +14% HP): nachjustieren falls nötig

### Prio 2 — Performance & Stabilitaet
- FirstTimeStart: Performance beim Level-Laden (Assets-Async laden?)
- Memory: Lange Sessions (20+ Minuten) testen auf Leaks
- FPS-Monitoring: Ist 60 FPS stabil gehalten auf schwächeren Rechnern?

### Prio 3 — Live-Hardening (wenn mehr Spieler kommen)
- Replay-Defense live testen (Nonce-Duplikat => 401)
- Rate-Limits Nachjustierung basierend auf echter Nutzung
- Monitoring/Alerting Render Logs aufsetzen

### Prio 4 — Nice-to-Have
- Sound/SFX Ausbau (teilweise erledigt, nicht mission-critical)
  - offen: Tower-Sell, UI-Click/Hover, Win/Lose-Stinger
- Particles/Juice (optional)
  aber keine inhaltlich gefaketen Runs.
- Lösung: Server-side Game Simulation oder inkrementelle signierte Events (jeder Kill/jede Welle einzeln
  ans Backend). Größerer Umbau, lohnt sich erst bei echtem Leaderboard-Missbrauch.
- Trigger: Wenn Leaderboard-Fakes sichtbar werden oder Spielerkreis auf >50 aktive Nutzer wächst.

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
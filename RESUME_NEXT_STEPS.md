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
   - Level 1 durchspielen → Level 2 startet automatisch
   - Endscreen zeigt Gesamt-Score aus Level 1+2+3

## Aktueller Funktionsstand (4. April 2026)
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

## Nächste offene Themen

### Prio 1 - Balancing weiter tunen
- Level 1 Beginner: Flammenwerfer-Only sollte spätestens Welle 5-6 Probleme machen
- Level 2 + 3: noch nicht gründlich getestet
- Telemetrie-Daten nutzen: Kills/Leaks/Gold-Ausgaben im Konsolenlog
- Wellen-Skalierungsfaktor (aktuell 14%) ggf. weiter anpassen

### Prio 2 - Backend Score-Integration
- Endscreen "Score absenden" Button verdrahten
- POST /api/v1/scores (totalScoreGold, playerName, levelReached)
- Spielername-Input vorm ersten Level oder beim Endscreen

### Prio 3 - Optional Polish
- Highscore-Liste nach Kampagnenende anzeigen
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
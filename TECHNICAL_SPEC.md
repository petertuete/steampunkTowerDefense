# Technical Specification — Steampunk Tower Defense

Version: 0.1  
Datum: 15. März 2026  
Status: Draft (Release 1 Scope)

## 1. Ziel und Zweck
Diese Spezifikation definiert die technische Umsetzung von Release 1 auf Basis des Game Design Documents.

### Akzeptanzkriterien
- Die Architektur ist in klar getrennte Systeme aufgeteilt.
- Alle Kernmechaniken aus dem GDD sind technisch abbildbar.
- Spätere Features koennen ohne grundlegenden Umbau ergaenzt werden.

### Definition of Done
- Alle folgenden Kapitel sind mit Entscheidungen und Schnittstellen beschrieben.
- Offene Punkte sind explizit markiert.

---

## 2. Scope fuer Release 1
### In Scope
- Singleplayer Tower Defense im Browser
- 3 Level mit 10/15/20 Wellen
- 6 Turmtypen (ohne Upgrade-System in Release 1)
- Gegnertypen: normal, gepanzert, schnell, heiler, Zwischenboss (Split), Endboss
- HUD: Level, Restgegner, Wellen-Timer, Gold
- Highscore-Upload und Top-100 Anzeige

### Out of Scope (spater)
- Turm-Upgrades (3 Stufen + Ult)
- Fliegende Gegner
- Fruehstart der Welle mit Bonusgold
- Einzigartige Spezialfaehigkeiten pro Turm-Ult
- Multiplayer

### Akzeptanzkriterien
- Alle In-Scope-Features sind in mindestens einer technischen Komponente verortet.
- Out-of-Scope-Features sind nicht implizit im Release-Plan enthalten.

### Definition of Done
- Scope ist mit GDD konsistent.
- Priorisierung Release 1 vs. Post-Release ist dokumentiert.

---

## 3. Systemarchitektur
### Architekturprinzipien
- Datengetrieben: Turm-, Gegner-, Wellen- und Map-Werte in Konfigurationsdateien
- Trennung von Spielregeln und Darstellung
- Kleine, klar abgegrenzte Subsysteme

### Subsysteme
- WaveSpawnerSystem
- PathMovementSystem
- TargetingSystem
- CombatSystem
- EconomySystem
- LifeSystem
- HUDSystem
- LevelProgressionSystem

### Akzeptanzkriterien
- Jedes Subsystem hat klaren Input, Output und Verantwortung.
- Kein Subsystem mischt UI-Logik mit Kernkampfregeln.

### Definition of Done
- Architekturdiagramm (textuell) vorhanden.
- Abhaengigkeiten zwischen Systemen dokumentiert.

---

## 4. Tech Stack und Laufzeitmodell
### Frontend
- Phaser 3 fuer Rendering, Input, Update-Loop
- Vite fuer Dev-Server und Build

### Backend
- Node.js + Express fuer Highscore-API
- SQLite als Datenbank fuer lokale Entwicklung und einfachen Betrieb

### Kommunikation
- REST/JSON zwischen Game-Client und Score-API

### Akzeptanzkriterien
- Lokaler Start von Frontend und Backend getrennt moeglich.
- API-Endpunkte sind stabil versionierbar.

### Definition of Done
- Kompatible Node-Version festgelegt.
- Startbefehle und Umgebungsvariablen spezifiziert.

---

## 5. Projektstruktur
### Vorgeschlagene Verzeichnisse
- frontend/
- frontend/src/scenes/
- frontend/src/systems/
- frontend/src/entities/
- frontend/src/config/
- frontend/src/ui/
- frontend/assets/
- backend/
- backend/src/routes/
- backend/src/services/
- backend/src/db/
- shared/ (optional, fuer gemeinsame Typen)

### Akzeptanzkriterien
- Ordnerstruktur bildet die Systemarchitektur direkt ab.
- Konfigurationsdaten sind nicht in Szenen hardcoded.

### Definition of Done
- Struktur im Repo angelegt.
- Verantwortlichkeiten je Ordner dokumentiert.

---

## 6. Datenmodelle und Konfigurationen
### Kernmodelle
- TowerDefinition: id, name, baseStats, cost, sellValueRule
- EnemyDefinition: id, hp, speed, armor, rewardGold, traits, leakDamage, splitConfig
- WaveDefinition: waveNumber, entries(type, count, interval)
- LevelDefinition: id, mapId, waveSetId, startGold, startLives
- MapDefinition: gridSize(24x16), pathTiles, buildableTiles, blockedTiles
- ScoreEntry: playerName, scoreGold, createdAt

### Datenquellen
- JSON oder TS-Configs im frontend/src/config/

### Akzeptanzkriterien
- Alle Release-1-Mechaniken sind ueber Daten konfigurierbar.
- Balance-Anpassungen erfordern keine Aenderung im Combat-Code.

### Definition of Done
- Schemas und Pflichtfelder sind dokumentiert.
- Validierungsregeln fuer Konfigurationsdaten festgelegt.

---

## 7. Gameplay-Flow (Runtime)
### Hauptablauf
1. Level wird geladen (Map, Startwerte, WaveSet).
2. Bauen/Verkaufen waehrend Build- und Wave-Phasen.
3. Welle laeuft, Gegner folgen Pfad, Tuerme greifen an.
4. Zwischen Wellen laeuft 10s Timer.
5. Nach letzter Welle: naechstes Level oder Spielende.
6. Bei Sieg/Niederlage: Score-Submit-Dialog.

### Akzeptanzkriterien
- Kein Softlock zwischen Wellen.
- Leak-Schaden wird korrekt pro Gegnertyp angewendet.
- Zwischenboss-Split spawnte Kindgegner eindeutig und reproduzierbar.

### Definition of Done
- Sequenzdiagramm (textuell) fuer Wave-Zyklus dokumentiert.
- Kritische Zustandsuebergaenge spezifiziert (pause, game over, level clear).

---

## 8. Kampf- und Zielsystem
### Zielregeln
- Standardzielregel: naechster Gegner zum Ziel innerhalb Reichweite
- Turmtypen-spezifische Regeln: Single, AoE, Chain, Buff

### Schadensmodell
- Physischer Schaden wird bei gepanzerten Zielen reduziert
- Flammwerfer erzeugt DoT
- Generator erhoeht Nachbarturm-Schaden prozentual

### Upgrade-Regeln (Post-Release)
- In Release 1 nicht enthalten
- Geplant: 3 lineare Upgrades + 1 starke Ult-Stufe
- Geplant: Ult = starke Verstaerkung der bestehenden Basisfaehigkeit

### Akzeptanzkriterien
- Schaden, Angriffsrate, Reichweite und Buffs stacken nach klaren Regeln.
- Kampfwerte und UI-Anzeige sind konsistent (ohne Upgrade-System in Release 1).

### Definition of Done
- Formeln fuer Schaden/Buff/DoT dokumentiert.
- Edge Cases spezifiziert (z. B. Ziel stirbt waehrend Projektilflug).

---

## 9. Economy und Progression
### Regeln
- Gold durch Kills (inkl. hoeherer Rewards fuer Zwischenboss/Endboss)
- Turmverkauf = 50% Rueckerstattung des Kaufpreises
- Highscore = Restgold nach Abschluss von Level 3

### Akzeptanzkriterien
- Goldkonto kann nie inkonsistent negativ werden.
- Highscore-Berechnung nutzt exakt den finalen Goldwert.

### Definition of Done
- Alle Goldquellen und Goldsenken tabellarisch dokumentiert.
- End-of-Run-Berechnung reproduzierbar beschrieben.

---

## 10. UI/HUD und UX-Flows
### HUD Pflichtfelder
- Level
- Restgegner im Level
- Zeit bis naechste Welle
- Gold

### UX-Flows
- Turm kaufen/platzieren
- Turm auswaehlen/verkaufen
- Nameingabe fuer Highscore nach Run-Ende

### Akzeptanzkriterien
- HUD-Werte aktualisieren in Echtzeit ohne merkliche Verzoegerung.
- Kritische Aktionen haben eindeutiges Feedback (invalid placement, zu wenig Gold).

### Definition of Done
- UI-States dokumentiert (normal, selected, disabled, game over).
- Keyboard/Mouse-Interaktionen spezifiziert.

---

## 11. Highscore API
### Endpunkte
- POST /api/v1/scores
- GET /api/v1/scores  (fest Top-100, kein limit-Parameter)

### Request/Response (konzeptionell)
- POST Body: playerName, scoreGold
- GET Response: Liste nach scoreGold absteigend, bei Gleichstand frueherer Timestamp gewinnt

### Validierung
- playerName: 1-20 Zeichen, nur [A-Za-z0-9 _-], keine reinen Leerzeichen
- scoreGold: integer >= 0, <= 9999999

### Akzeptanzkriterien
- Ungueltige Eingaben liefern definierte Fehlercodes.
- GET liefert stabile Top-100 Sortierung.

### Definition of Done
- API-Vertrag dokumentiert (inkl. Fehlerfaelle).
- DB-Schema fuer Score-Tabelle definiert.

---

## 12. Persistenz und Datenbank
### SQLite Tabelle
- scores(id, player_name, score_gold, created_at)

### Akzeptanzkriterien
- Inserts und Reads funktionieren lokal robust.
- Sortierung und Limit werden DB-seitig umgesetzt.

### Definition of Done
- SQL-Migration fuer initiales Schema vorhanden.
- Index auf score_gold und created_at definiert.

---

## 13. Performance, Stabilitaet, Sicherheit
### Performance-Ziele
- Stabile Framerate auf typischem Laptop-Browser
- Keine stark ansteigende Speicherbelegung ueber lange Sessions

### Stabilitaet
- Kein Crash bei vielen gleichzeitigen Gegnern/Projektilen

### Basis-Sicherheit (API)
- Eingabevalidierung
- Simples Rate-Limiting fuer Score-Submit
- CORS nur fuer erlaubte Origin(s)

### Akzeptanzkriterien
- Keine Blocker in Boss-, Split- und Wave-Ende-Szenarien.
- API lehnt fehlerhafte Payloads kontrolliert ab.

### Definition of Done
- Mindest-Error-Handling definiert.
- Logging fuer API-Fehler vorhanden.

---

## 14. Teststrategie
### Testebenen
- Unit-Tests: Kampf, Buffs, Economy, Split, Leak-Schaden
- Integrations-Tests: Wave-Zyklus, Levelabschluss, Scoreberechnung
- API-Tests: POST/GET inkl. Validierung

### Akzeptanzkriterien
- Kritische Kernregeln haben automatisierte Tests.
- Regressionsfaelle fuer bekannte Bugs sind erfassbar.

### Definition of Done
- Testmatrix dokumentiert.
- Mindestabdeckung der Core-Logik festgelegt.

---

## 15. Deployment-Readiness
### Lokal
- Frontend und Backend per Dev-Commands startbar
- API-URL ueber Env konfigurierbar

### Spaeter Online
- Frontend statisch hostbar
- Backend auf Node-kompatiblem Host deploybar

### Akzeptanzkriterien
- Kein Code-Fork fuer lokal vs. online noetig.
- Konfiguration erfolgt ausschliesslich ueber Umgebungswerte.

### Definition of Done
- Deployment-Checkliste vorhanden.
- Beispiel-.env dokumentiert.

---

## 16. Milestones und Definition of Ready
### Milestone 1: Vertical Slice
- 1 Level, 2 Turmtypen, 2 Gegnertypen, 3 Wellen, lokaler Score

### Milestone 2: Release-1 Complete
- Voller Umfang gemaess GDD

### Milestone 3: Online Highscore
- API angebunden, Top-10 im Spiel sichtbar

### Akzeptanzkriterien
- Jeder Milestone hat messbare Lieferobjekte.
- Abnahme erfolgt anhand dieser Spezifikation.

### Definition of Done
- Milestone-Kriterien als Checkliste gepflegt.
- Offene Risiken pro Milestone dokumentiert.

---

## 17. Offene Punkte
- Exakte Basiswerte pro Turm und Gegner (Final Balancing)
- Exakte Spawn-Komposition pro Welle
- API-Rate-Limit-Grenzwerte fuer produktiven Betrieb

### Akzeptanzkriterien
- Offene Punkte sind priorisiert und haben Besitzer.

### Definition of Done
- Offene Punkte vor Start der Implementierung entweder geklaert oder bewusst in Backlog ueberfuehrt.

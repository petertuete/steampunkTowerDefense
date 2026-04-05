# Umsetzungsstrategie

Version: 0.1  
Datum: 15. Maerz 2026  
Bezug: GDD, Technical Spec, API Spec, Asset Spec

## 1. Zielbild
Das Projekt wird spec-driven in klaren Milestones umgesetzt. Jeder Milestone liefert ein lauffaehiges, pruefbares Ergebnis. Erst wenn die Abnahmekriterien eines Milestones erfuellt sind, startet der naechste.

## 2. Vorgehensprinzipien
- Vertical-Slice-first: frueh spielbar statt spaet perfekt.
- Datengetrieben: Gegner, Tuerme, Wellen und Level in Configs.
- Platzhalter-first bei Assets, spaeter schrittweise Ersetzung.
- Kleine, testbare Inkremente statt grosser Big-Bang-Implementierungen.
- Release-1 Scope strikt halten, Post-Release Features nicht vorziehen.

## 3. Milestone-Plan

### Milestone 0: Setup-Ready
Dauer: 0.5 Tag

Lieferumfang:
- Frontend (Vite + Phaser) lokal startbar
- Backend (Express + SQLite) lokal startbar
- Basis-Ordnerstruktur gemaess Technical Spec
- Konfigurierbare API-URL und CORS

Abnahme:
- Frontend und Backend laufen parallel lokal
- Health-Check Endpoint liefert 200

### Milestone 1: Vertical Slice
Dauer: 3 bis 5 Tage

Lieferumfang:
- 1 Level, 3 Wellen
- 2 Turmtypen, 2 Gegnertypen
- Kaufen und Verkaufen
- HUD-Basiswerte
- Score speichern und Top-Liste lesen

Abnahme:
- Kompletter Spiel-Loop ohne Softlock
- Score wird korrekt gespeichert und angezeigt

### Milestone 2: Core Gameplay Complete
Dauer: 5 bis 7 Tage

Lieferumfang:
- Vollstaendige 3 Level mit 10/15/20 Wellen
- Alle 6 Turmtypen
- Alle Gegnertypen inkl. Heiler
- Zwischenboss-Split und Endboss
- Turm-Upgrades bleiben Post-Release

Abnahme:
- Leak-Schaden korrekt (-1/-5/-20)
- Zwischenboss-Split reproduzierbar
- Win/Lose-Bedingungen stabil

### Milestone 3: UI/UX und Highscore Final
Dauer: 2 bis 3 Tage

Lieferumfang:
- Top-100 Anzeige im Spiel
- Namenseingabe am Run-Ende
- Nutzerfeedback bei Fehlerfaellen
- Basis-SFX integriert

Abnahme:
- API-Vertrag vollstaendig umgesetzt
- UI bleibt stabil bei API-Fehlern

### Milestone 4: Stabilisierung und Release Candidate
Dauer: 2 bis 3 Tage

Lieferumfang:
- Bugfixing und Performance-Pass
- Smoke-Tests kritischer Flows
- Deployment-Vorbereitung (lokal/online faehig)

Abnahme:
- Keine Blocker in Boss-, Split- und Wave-Ende-Flows
- Reproduzierbarer lokaler Start ohne Workarounds

## 4. Grobe Zeitplanung

### Variante A: Fokus-Plan (ca. 2 bis 3 Wochen)
- Woche 1: Milestone 0 + 1
- Woche 2: Milestone 2
- Woche 3: Milestone 3 + 4

### Variante B: Entspannter Plan (ca. 4 bis 6 Wochen)
- Woche 1: Milestone 0 + Architekturgrundlage
- Woche 2: Milestone 1
- Woche 3 bis 4: Milestone 2
- Woche 5: Milestone 3
- Woche 6: Milestone 4 + Reserven

## 5. Risiko- und Gegenmassnahmen
- Risiko: Scope Creep durch Zusatzfeatures
  - Gegenmassnahme: Post-Release Backlog strikt getrennt halten
- Risiko: Balancing-Aufwand unterschaetzt
  - Gegenmassnahme: Werte in Config-Dateien, schnelle Iteration ohne Codeumbau
- Risiko: Asset-Produktion bremst Fortschritt
  - Gegenmassnahme: Platzhalter-first bis Core Gameplay stabil ist
- Risiko: API-Spam oder inkonsistente Scores
  - Gegenmassnahme: Validierung, Rate-Limit, klares Error-Handling

## 6. Go/No-Go Kriterien vor Implementierungsstart
- Spezifikationen konsistent und freigegeben
- Milestone-Reihenfolge und Zeitvariante gewaehlt
- Prioritaeten fuer erste Tickets festgelegt
- Definition of Done pro Milestone bestaetigt

## 7. Definition of Done fuer Release 1
- Alle In-Scope Features aus den Specs implementiert
- Top-100 Highscore Ende-zu-Ende funktional
- Keine kritischen Gameplay-Blocker
- Lokales Setup stabil und online-faehig vorbereitet

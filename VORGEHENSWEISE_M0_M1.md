# Vorgehensweise fuer Milestone 0 und Milestone 1

Version: 0.1  
Datum: 15. Maerz 2026  
Zielgruppe: Einsteiger ohne Programmiererfahrung

## 1. Warum diese Vorgehensweise
Du baust zuerst einen kleinen, durchgaengig funktionierenden Spielkern (Vertical Slice), statt lange nur Teilmodule zu bauen. Dadurch bekommst du frueh Feedback und lernst schneller.

## 2. Lern- und Arbeitsprinzipien
- In kleinen Schritten arbeiten
- Pro Arbeitseinheit nur 1 neues Kernkonzept
- Sofort testen, nicht auf spaeter verschieben
- Fehler protokollieren und reproduzierbar machen
- Scope fuer Release 1 strikt halten

## 3. Milestone 0 Plan (Setup-Ready)
### Ziel
Lokale Entwicklungsumgebung steht und Frontend/Backend koennen miteinander sprechen.

### Techniken
- Node.js und npm
- Vite (Frontend Dev-Server)
- Express (Backend API)
- CORS
- Umgebungsvariablen

### Konzepte, die verstanden werden muessen
- Client-Server-Modell
- HTTP-Request/Response
- JSON
- Ports und lokale URLs
- Projektstruktur und Startskripte

### Lernerfolg nach Milestone 0
- Du kannst eine lokale Web-App und API starten
- Du kannst einfache API-Antworten testen und lesen

## 4. Milestone 1 Plan (Vertical Slice)
### Ziel
Ein kleines, komplett spielbares Mini-Spiel mit Score-Submit.

### Techniken
- Phaser Scene und Game Loop
- Gegnerbewegung entlang Pfad
- Turm-Targeting und Trefferlogik
- Goldsystem (Kauf/Verkauf, Upgrades erst spaeter)
- HUD-Anzeige
- REST-Anbindung an Highscore-API

### Konzepte, die verstanden werden muessen
- Update-Zyklus pro Frame
- Zustandslogik (Build, Wave, Game Over)
- Datengetriebene Konfiguration
- Einfache Balancing-Logik
- Fehlerbehandlung bei API-Calls

### Lernerfolg nach Milestone 1
- Du kannst eine komplette Gameplay-Schleife bauen
- Du kannst Daten vom Spiel ins Backend speichern

## 5. Didaktische Reihenfolge (fuer Einsteiger)
1. Erst lauffaehig machen
2. Dann korrekt machen
3. Dann sauber machen
4. Dann verbessern

Bedeutung:
- Lauffaehig: Feature funktioniert grundsaetzlich
- Korrekt: Edge Cases und Fehlerfaelle behandelt
- Sauber: Struktur refaktoriert, lesbar und wartbar
- Verbessern: Balance, Effekte, bessere Assets

## 6. Empfohlener Tagesrhythmus
- 60-90 min Lernen (Theorie + kleine Uebung)
- 90-120 min Implementierung
- 20-30 min Testen und Notizen

## 7. Pruefmethode pro Task
Pro Task immer dieselben 5 Fragen:
1. Was ist das Ziel?
2. Was ist der kleinste testbare Schritt?
3. Wie pruefe ich Erfolg?
4. Was kann schiefgehen?
5. Was notiere ich fuer spaeter?

## 8. Stop-Regeln (sehr wichtig)
- Nicht an 5 Baustellen gleichzeitig arbeiten
- Keine Post-Release Features vor Milestone-1-Abnahme
- Bei Blocker laenger als 45 min: Problem isolieren, vereinfachen, dann weiter

## 9. Erfolgskriterien
### Milestone 0 ist fertig wenn
- Frontend und Backend lokal stabil laufen
- Health-Endpoint vom Frontend erreichbar ist

### Milestone 1 ist fertig wenn
- 1 Level mit 3 Wellen spielbar ist
- 2 Turmtypen und 2 Gegnertypen stabil funktionieren
- Score gespeichert und als Top-Liste geladen werden kann

## 10. Naechster Schritt nach diesen Milestones
Nach Milestone 1 wird der Umfang auf den kompletten Release-1 Scope ausgebaut (alle Tuerme, alle Gegner, 3 Level, Top-100 und Stabilisierung).

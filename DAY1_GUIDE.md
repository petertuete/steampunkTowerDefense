# Day 1 Guide (Einsteiger)

Datum: 15. Maerz 2026  
Ziel: Nach Day 1 laufen Frontend und Backend lokal und sprechen miteinander.

## 1. Lernziele fuer Day 1
- Verstehen, was Frontend und Backend sind
- Ein Frontend lokal starten
- Ein Backend lokal starten
- Eine erste API-Antwort sehen
- Eine erste Verbindung Frontend -> Backend testen

## 2. Ergebnis am Ende von Day 1
- Frontend startet mit Dev-Server
- Backend startet mit HTTP-Server
- Ein Health-Endpoint antwortet mit 200
- Frontend kann den Health-Endpoint aufrufen

## 3. Zeitplan (ca. 3.5 bis 5 Stunden)
- Block A (45-60 min): Grundlagen verstehen
- Block B (60-90 min): Frontend starten
- Block C (60-90 min): Backend starten
- Block D (45-60 min): Verbindung testen
- Block E (20-30 min): Fehlercheck und Notizen

## 4. Block A - Grundlagen verstehen
### Was du verstehen solltest
- Frontend: zeigt UI, nimmt Eingaben an
- Backend: verarbeitet Requests, liefert Daten
- HTTP: Anfrage und Antwort
- JSON: Datenformat fuer API

### Mini-Uebung
- Schreibe in 3 Saetzen auf, was Frontend und Backend in deinem Spiel machen.

## 5. Block B - Frontend lokal starten
### Ziel
- Vite-Projekt laeuft lokal und ist im Browser sichtbar.

### Checklist
1. Frontend-Projekt anlegen
2. Abhaengigkeiten installieren
3. Dev-Server starten
4. Browser testen

### Verstanden, wenn
- Du den Unterschied zwischen Build und Dev-Server erklaeren kannst.

## 6. Block C - Backend lokal starten
### Ziel
- Express-Server laeuft lokal und hat mindestens einen Endpoint.

### Checklist
1. Backend-Projekt anlegen
2. Express installieren
3. Server starten
4. Health-Route anlegen (z. B. /api/v1/health)

### Verstanden, wenn
- Du erklaeren kannst, was ein Endpoint ist.

## 7. Block D - Frontend mit Backend verbinden
### Ziel
- Frontend ruft den Health-Endpoint auf und zeigt Ergebnis.

### Checklist
1. CORS im Backend konfigurieren
2. API-URL im Frontend als Konfigurationswert setzen
3. Request aus Frontend senden
4. Antwort sichtbar anzeigen

### Verstanden, wenn
- Du siehst: Verbindung klappt, Daten kommen als JSON zurueck.

## 8. Typische Fehler und schnelle Checks
### Problem: Frontend laeuft, Backend nicht erreichbar
- Check: Laeuft Backend wirklich auf dem erwarteten Port?
- Check: Ist die API-URL im Frontend korrekt?

### Problem: CORS Error im Browser
- Check: CORS-Origin im Backend auf Frontend-URL gesetzt?
- Check: Backend neu gestartet nach Config-Aenderung?

### Problem: 404 statt 200
- Check: Route exakt gleich geschrieben?
- Check: Prefix /api/v1 verwendet?

### Problem: 500 Error
- Check: Server-Logs lesen, erste Exception finden
- Check: Schrittweise isolieren (Route ohne Logik testen)

## 9. Day-1 Abnahme (Done)
- Frontend startet lokal ohne Fehler
- Backend startet lokal ohne Fehler
- GET auf Health-Endpoint liefert 200
- Frontend zeigt die API-Antwort erfolgreich an
- Du hast 5 bis 10 Stichpunkte gelerntes notiert

## 10. Lernjournal (ausfuellen)
- Was habe ich heute verstanden?
- Wo habe ich am laengsten festgesteckt?
- Welcher Fehler war neu fuer mich?
- Was mache ich morgen zuerst?

## 11. Vorbereitung fuer Day 2
- Ordnerstruktur gemaess Technical Spec pruefen
- Erste Phaser-Scene planen
- Platzhalter-Assets fuer Grid und Einheiten vorbereiten

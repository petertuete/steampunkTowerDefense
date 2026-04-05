# Nachlesen Day 1: Was die einzelnen Schritte bedeuten

Datum: 16. Maerz 2026  
Kontext: Erste praktische Uebungen zu Frontend, Backend, HTTP und CORS

## 1. Ziel von Day 1
Du wolltest nicht einfach nur Befehle eintippen, sondern verstehen, wie Browser und Server zusammenarbeiten.

Das Ziel war ein kompletter Mini-Durchlauf:
1. Frontend startet
2. Backend startet
3. Frontend sendet Request an Backend
4. Backend antwortet mit JSON
5. Frontend zeigt die Antwort an

---

## 2. Was du konkret gemacht hast

## Schritt A: button.html erstellt und getestet
Datei: lernen/button.html

### Was passiert technisch?
- Der Browser laedt HTML und zeigt Button + Textfeld an.
- Beim Klick startet JavaScript eine `fetch`-Anfrage.
- Die Antwort wird mit `res.json()` in ein JavaScript-Objekt umgewandelt.
- Das Objekt wird als Text in die Seite geschrieben.

### Was du dabei gelernt hast
- Wie Frontend-JavaScript auf Benutzereingaben reagiert.
- Wie Daten von einer API geholt und dargestellt werden.

### Typischer Stolperstein
- Datei nicht gespeichert => Browser zeigt alten Inhalt oder leer.
- Das ist normal und passiert jedem.

---

## Schritt B: Node.js und npm installiert

### Warum war das noetig?
- `node` fuehrt JavaScript ausserhalb des Browsers aus (Server-Seite).
- `npm` verwaltet Pakete und Projektkonfiguration.

### Was die Befehle bedeuten
- `node --version`: zeigt, ob Node verfuegbar ist
- `npm --version`: zeigt, ob npm verfuegbar ist

### Ergebnis
- Node und npm waren danach korrekt installiert.

---

## Schritt C: `npm init -y`
Ordner: lernen/backend-mini

### Bedeutung
- Erstellt eine `package.json` mit Standardwerten.
- Das ist der "Steckbrief" deines Backend-Projekts.

### Wofuer wird package.json genutzt?
- Speichert Abhaengigkeiten (z. B. express)
- Definiert Scripts
- Dokumentiert Basisdaten des Projekts

---

## Schritt D: `npm install express`

### Bedeutung
- Installiert das Express-Framework.
- Tragt Express in `dependencies` ein.
- Erstellt/aktualisiert `package-lock.json` fuer reproduzierbare Installationen.

### Warum Express?
- Du kannst einfach API-Endpunkte bauen, z. B. `/api/v1/health`.

---

## Schritt E: server.js erstellt und gestartet
Datei: lernen/backend-mini/server.js

### Was macht dein Server-Code?
1. `express()` erstellt die App
2. Route `GET /api/v1/health` wird definiert
3. Bei Anfrage liefert der Server JSON mit Status 200
4. `app.listen(3001)` startet den Server

### Bedeutung von Health-Endpoint
- Ein schneller Testpunkt: "Server lebt und antwortet"

---

## Schritt F: package.json Fehler behoben

### Was war der Fehler?
- Aus Versehen stand JavaScript-Code in `package.json`.
- `package.json` muss reines JSON sein.

### Fehlermeldung
- `ERR_INVALID_PACKAGE_CONFIG`

### Lernpunkt
- Dateityp und Syntax strikt trennen:
  - `server.js`: JavaScript
  - `package.json`: JSON

---

## Schritt G: Frontend -> lokales Backend verbunden
Datei: lernen/button-backend.html

### Was sollte passieren?
- Button klickt
- Frontend ruft `http://localhost:3001/api/v1/health` auf
- Antwort erscheint im Browser

### Erstes Problem
- Fehler: `Origin null is not allowed by Access-Control-Allow-Origin`

### Warum?
- HTML wurde direkt als Datei (`file://...`) geoeffnet.
- Dann hat die Seite Origin `null`.
- Browser blockt aus Sicherheitsgruenden den Request (CORS).

### Loesung
1. CORS im Backend konfigurieren
2. HTML ueber lokalen Webserver laden (z. B. `python3 -m http.server 8080`)
3. Danach hat die Seite eine echte Origin (z. B. `http://localhost:8080`)
4. Backend erlaubt diese Origin -> Request klappt

### Ergebnis
- JSON-Antwort wurde erfolgreich angezeigt:
  - `{ "status": "ok", "service": "highscore-api" }`

---

## 3. Die wichtigsten Begriffe in einfach

### Frontend
- Was der Nutzer sieht und bedient (HTML/CSS/JS im Browser).

### Backend
- Serverlogik, die Daten verarbeitet und Antworten liefert.

### Endpoint
- Eine URL mit Funktion, z. B. `/api/v1/health`.

### HTTP-Statuscode
- Zahl, die den Ausgang beschreibt:
  - 200 = OK
  - 400 = Fehler in Anfrage
  - 500 = Serverfehler

### JSON
- Standard-Datenformat fuer APIs.

### CORS
- Browser-Sicherheitsregel: Eine Webseite darf nicht beliebig andere Server anfragen.
- Server muss erlauben, welche Origins zugreifen duerfen.

### Origin
- Kombination aus Protokoll + Host + Port, z. B. `http://localhost:8080`.

---

## 4. Warum das wichtig fuer dein Tower-Defense ist
Du hast bereits den Kernmechanismus geuebt, den das echte Spiel spaeter nutzt:
- Frontend sendet Daten
- Backend validiert und speichert
- Frontend laedt Daten und zeigt sie an

Das ist exakt die Basis fuer:
- Score absenden (POST)
- Top-100 laden (GET)

---

## 5. Was du wirklich erreicht hast
- Du hast einen funktionierenden Mini-Client gebaut.
- Du hast ein funktionierendes Mini-Backend gebaut.
- Du hast CORS nicht nur gehoert, sondern praktisch geloest.
- Du hast einen kompletten End-to-End-Flow realisiert.

Kurz gesagt: Du bist von "keine Programmiererfahrung" zu "versteht den HTTP-Grundfluss in der Praxis" gekommen.

---

## 6. Wenn du es spaeter wiederholen willst (Kurzversion)
1. Backend starten: `node server.js`
2. HTML ueber lokalen Server starten: `python3 -m http.server 8080`
3. Seite oeffnen: `http://localhost:8080/button-backend.html`
4. Button klicken, JSON sehen

Wenn das klappt, ist dein Lern-Setup stabil.

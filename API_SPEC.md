# API Specification — Steampunk Tower Defense Highscore API

Version: 1.0  
Datum: 15. März 2026  
Base URL lokal: http://localhost:3001/api/v1  
Base URL online: https://<domain>/api/v1

---

## Allgemeine Konventionen

- Alle Requests und Responses verwenden `Content-Type: application/json`
- Timestamps im ISO-8601-Format (UTC)
- Fehlgenannte Felder liefern immer ein einheitliches Error-Objekt
- API liegt unter `/api/v1/` fuer spaetere Versionierbarkeit

### Einheitliches Error-Response-Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "playerName must only contain alphanumeric characters, spaces, hyphens, or underscores."
  }
}
```

### Fehlercodes
| Code                  | HTTP-Status | Bedeutung                                   |
|-----------------------|-------------|---------------------------------------------|
| VALIDATION_ERROR      | 400         | Eingabe ungueltig                           |
| MISSING_FIELD         | 400         | Pflichtfeld fehlt                           |
| RATE_LIMIT_EXCEEDED   | 429         | Zu viele Requests in kurzer Zeit            |
| INTERNAL_ERROR        | 500         | Serverseitiger Fehler                       |

---

## Endpunkte

---

### POST /api/v1/scores
Score eines Spielers einreichen.

#### Request Body
```json
{
  "playerName": "string",
  "scoreGold": 0
}
```

#### Feldregeln
| Feld        | Typ     | Pflicht | Regeln                                                                 |
|-------------|---------|---------|------------------------------------------------------------------------|
| playerName  | string  | ja      | 1–20 Zeichen, nur: `[A-Za-z0-9 _-]`, keine reinen Leerzeichen-Strings |
| scoreGold   | integer | ja      | >= 0, <= 9999999 (Plausibilitaetsgrenze)                              |

#### Erfolgs-Response `201 Created`
```json
{
  "id": 42,
  "playerName": "SteamLord",
  "scoreGold": 4800,
  "createdAt": "2026-03-15T14:22:00Z"
}
```

#### Fehler-Responses
| Szenario                         | HTTP | code               |
|----------------------------------|------|--------------------|
| Fehlendes Feld                   | 400  | MISSING_FIELD      |
| Name ungueltige Zeichen          | 400  | VALIDATION_ERROR   |
| Name zu lang / leer              | 400  | VALIDATION_ERROR   |
| scoreGold negativ oder zu gross  | 400  | VALIDATION_ERROR   |
| Zu viele Submits                 | 429  | RATE_LIMIT_EXCEEDED|

---

### GET /api/v1/scores
Top-100 Highscores abrufen, absteigend nach scoreGold sortiert.  
Bei gleichem scoreGold: frueherer Zeitstempel gewinnt.

#### Query-Parameter
Keine. Die Liste ist immer auf Top-100 begrenzt.

#### Erfolgs-Response `200 OK`
```json
{
  "scores": [
    {
      "rank": 1,
      "playerName": "SteamLord",
      "scoreGold": 4800,
      "createdAt": "2026-03-15T14:22:00Z"
    },
    {
      "rank": 2,
      "playerName": "GearMaster",
      "scoreGold": 4200,
      "createdAt": "2026-03-14T10:05:00Z"
    }
  ]
}
```

#### Verhalten
- Gibt immer ein Array zurueck, auch wenn leer (`"scores": []`)
- Rang wird serverseitig berechnet und mitgeliefert
- Ein Spieler darf mehrfach in der Liste erscheinen

---

## Datenbank-Schema

### Tabelle: `scores`
```sql
CREATE TABLE scores (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  player_name TEXT    NOT NULL,
  score_gold  INTEGER NOT NULL,
  created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX idx_scores_gold_time ON scores (score_gold DESC, created_at ASC);
```

---

## Validierungsregeln (Detail)

### playerName
- Regex: `^[A-Za-z0-9 _-]{1,20}$`
- Darf nicht ausschliesslich aus Leerzeichen bestehen
- Wird vor Speicherung getrimmt

### scoreGold
- Muss ganzzahlig sein (kein Float)
- Wertebereich: 0 bis 9.999.999
- Wird serverseitig nicht berechnet — Plausibilitaetsgrenze schuetzt vor offensichtlicher Manipulation

---

## Sicherheit

### Rate-Limiting (POST /api/v1/scores)
- Max. 5 Score-Submits pro IP-Adresse innerhalb von 60 Sekunden
- Response bei Ueberschreitung: HTTP 429 mit `Retry-After`-Header

### CORS
- Lokale Entwicklung: `http://localhost:5173` (Vite-Standard)
- Produktiv: nur konfigurierte Frontend-Domain als erlaubte Origin
- CORS-Origin per Umgebungsvariable konfiguriert, nicht hardcoded

### Input-Safety
- Kein HTML oder Script-Code wird gespeichert oder ausgegeben (Eingabe per Regex beschraenkt)
- SQL-Injection-Schutz durch ausschliessliche Nutzung von Prepared Statements

---

## Umgebungsvariablen

| Variable          | Beispielwert                  | Beschreibung                     |
|-------------------|-------------------------------|----------------------------------|
| PORT              | 3001                          | Port des Backends                |
| CORS_ORIGIN       | http://localhost:5173         | Erlaubte Frontend-Origin         |
| DB_PATH           | ./data/scores.db              | Pfad zur SQLite-Datei            |

---

## Beispiel-.env
```
PORT=3001
CORS_ORIGIN=http://localhost:5173
DB_PATH=./data/scores.db
```

---

## Zukuenftige Erweiterungen (Post-Release)
| Feature                          | Beschreibung                                      |
|----------------------------------|---------------------------------------------------|
| Pagination (GET)                 | `?page=` und `?limit=` Parameter                  |
| Nur bester Score pro Spieler     | Deduplizierung optional per Query-Parameter       |
| Spielversion im Score speichern  | `gameVersion`-Feld im POST-Body                  |
| Admin-Endpunkt zum Loeschen      | Mit API-Key gesichert                             |

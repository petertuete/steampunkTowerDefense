# Game Design Document — Steampunk Tower Defense

**Version:** 0.2  
**Datum:** 13. April 2026  
**Genre:** Tower Defense  
**Stil:** Steampunk, Pixel-Art  
**Plattform:** Browser (lokal + online-fähig)  
**Modus:** Solo, Online-Highscore

---

## 1. Spielprinzip

Der Spieler platziert Türme entlang eines fest vorgegebenen Pfads, um Wellen von Steampunk-Gegnern daran zu hindern, das Ziel zu erreichen. Gegner die durchkommen kosten Leben. Besiegte Gegner geben Gold, das für neue Türme verwendet wird. Der Highscore ergibt sich aus einem Punktesystem: Kills, leak-freie Wellen, Level-Clears, Restgold und ein optionaler Perfection-Multiplikator.

---

## 2. Win/Lose-Bedingungen

- **Verloren:** Lebenspunkte sinken auf 0
- **Gewonnen:** Alle Wellen aller Level erfolgreich abgeschlossen
- **Highscore:** Punktesystem (Kills + leak-freie Wellen + Level-Clear + Restgold). Optionaler Perfection-Multiplikator x1.5 bei einem Run ohne Turmverkauf.

---

## 3. Leben & Schaden durch Gegner

| Gegner-Typ       | Leben-Abzug beim Durchkommen |
|------------------|------------------------------|
| Normal-Gegner    | -1 Leben                     |
| Schnell-Gegner   | -1 Leben                     |
| Gepanzert-Gegner | -1 Leben                     |

**Startleben:** 20

> Zwischenboss und Endboss mit erhöhtem Leak-Schaden sind Post-Release.

---

## 4. Level & Wellen

| Level | Name     | Wellen | Beschreibung                                       |
|-------|----------|--------|----------------------------------------------------|
| 1     | Beginner | 15     | Einführung, Normal + Schnell + Gepanzert           |
| 2     | Advanced | 20     | Zickzack-Pfad, doppeltes Gold, alle Gegnertypen    |
| 3     | Ultimate | 20     | Komplexe Wellen-Komposition, alle Turmtypen        |

### Wellen-System
- Zwischen jeder Welle: **10 Sekunden Timer** + 15 Sekunden Bauzeit vor Welle 1
- Nächste Welle früher manuell starten: **Space** oder „Jetzt starten"-Button
- Wellen-Strings: Zeichenformat `n` (Normal) / `s` (Schnell) / `a` (Gepanzert) / `.` (Pause)
- Wellen-Skalierung: Gegner-HP +14% pro Welle
- Level-Skalierung: HP x1.0 / x1.6 / x2.2 je Level

### Karten-Layout
- **Größe:** 24×16 Tiles
- **Pfad:** Fest vorgegeben je Level (Level 1: S-Form, Level 2: Zickzack, Level 3: Gerader Pfad)
- Türme können nur auf nicht-Pfad-Tiles platziert werden
- Hindernisse und komplexere Pfade: **Post-Release**

---

## 5. Gegner-Typen

### Implementierte Gegner (Release 1)

| Typ       | Eigenschaften                                                   |
|-----------|-----------------------------------------------------------------|
| Normal    | Standardwerte, keine Besonderheit                               |
| Schnell   | Niedrige HP, hohe Bewegungsgeschwindigkeit                      |
| Gepanzert | Hohe HP, 50% DoT-Resistenz gegen Flammen-Nachbrennen           |

### Gold-Belohnungen (konfiguriert in enemies.js)
| Gegner-Typ | Level 1 | Level 2 (x2) |
|------------|---------|--------------|
| Normal     | ~10G    | ~20G         |
| Schnell    | ~8G     | ~16G         |
| Gepanzert  | ~15G    | ~30G         |

> Heiler, Zwischenboss und Endboss sind Post-Release.

---

## 6. Turm-Typen

In **Version 1** haben Türme **keine Upgrades**. Turm-Upgrades (3 Stufen + Ult) sind Post-Release.

Verkauf eines Turms gibt **75% des Kaufpreises** zurück.

### Turm-Übersicht (Release 1)

| Turm             | Kosten | Range | Schaden | FireRate | Besonderheit                                        |
|------------------|--------|-------|---------|----------|-----------------------------------------------------|
| Dampfkanone      | 150    | 150   | 30      | 0.8/s    | Standard-Projektil, ausgewogen                      |
| Hochdruck-Kanone | 220    | 200   | 50      | 0.5/s    | Langstrecke, Einzelziel                             |
| Flammwerfer      | 170    | 85    | 30      | 1.2/s    | Beam-Schaden + Nachbrennen DoT, kurze Range         |
| Tesla-Turm       | 220    | 130   | 30      | 0.5/s    | Instant-Kettenblitz auf max. 3 Ziele (Chain x2)     |
| Generator        | 110    | 120   | —       | —        | +33% Damage auf angrenzende Türme (nicht stapelbar) |

> Dampfmörser ist entfernt.

### Level-Freischaltung
| Level | Verfügbare Türme                              |
|-------|-----------------------------------------------|
| 1     | Dampfkanone, Generator                        |
| 2     | + Flammwerfer                                 |
| 3     | + Tesla-Turm, Hochdruck-Kanone                |

---

## 7. Economy

- **Gold verdienen:** Gegner besiegen (Level 2 gibt doppeltes Gold)
- **Gold ausgeben:** Türme kaufen
- **Gold zurückbekommen:** Turm verkaufen = 75% des Kaufpreises
- **Startgold pro Level:** 400 Gold (frisch je Level)
- **Kumulatives Score-Gold:** Restgold aus vorherigen Levels fließt ins Score-Konto, nicht ins Spiel-Gold

---

## 8. HUD (Heads-Up Display)

Immer sichtbar während des Spiels:

| Element            | Beschreibung                                   |
|--------------------|------------------------------------------------|
| Level-Selector     | [Beginner] [Advanced] [Ultimate]               |
| Level-Anzeige      | Aktuelles Level und Welle                      |
| Restgegner         | Verbleibende Gegner im laufenden Level         |
| Wellen-Timer       | Countdown bis zur nächsten Welle               |
| Gold               | Aktuelles Gold des Spielers                    |
| Live-Score         | Aktueller Punktestand während des Spiels       |
| Sell-Modus-Anzeige | Grün = Bauen, Rot = Verkaufen (Shift gedrückt) |

### Steuerung
| Taste / Aktion     | Funktion                         |
|--------------------|----------------------------------|
| Linksklick         | Turm platzieren                  |
| Shift + Linksklick | Turm verkaufen (75% Rückgeld)    |
| T                  | Turm-Typ wechseln                |
| S                  | Speed 1x / 2x umschalten        |
| Space              | Nächste Welle sofort starten     |

---

## 9. Highscore-System

### Punkte-Formel
| Aktion              | Punkte                                    |
|---------------------|-------------------------------------------|
| Kill                | +10 pro Kill                              |
| Leak-freie Welle    | +50 pro Welle ohne Leak                   |
| Level-Clear         | +500 + 20 pro verbleibende Leben          |
| Restgold            | +1 pro Gold                               |
| Perfection-Bonus    | x1.5 Multiplikator bei 0 Turmverkäufen   |

- **Eingabe:** Spielername per Textfeld nach Game Over / Game Won (3–10 Zeichen)
- **Anzeige:** Top-20 Leaderboard im Endscreen
- **Backend:** POST /api/v1/runs (mit HMAC-Auth) + GET /api/v1/scores
- **Score-Trust:** Backend berechnet und verifiziert den Score serverseitig

---

## 10. Schwierigkeit

- Kein Schwierigkeitswahlmenü im ersten Release
- Schwierigkeit wird durch Level-Progression gesteuert
- Highscore-Anreiz motiviert optimales Spiel

---

## 11. Geplante zukünftige Features (Post-Release)

| Feature                              | Priorität |
|--------------------------------------|-----------|
| Turm-Upgrades (3 Stufen + Ult)       | Hoch      |
| Fliegende Gegner (eigener Pfad/Layer)| Mittel    |
| Frühzeitiger Wellen-Start + Gold-Bonus | Niedrig |
| Einzigartige Ult-Spezialfähigkeiten pro Turm | Hoch |
| Karten mit Hindernissen (ab Level 2/3 verfügbar) | Hoch |
| Schwierigkeitsstufen                 | Niedrig   |
| Mehrere Karten pro Level             | Mittel    |

---

## 12. Stil & Atmosphäre

- **Art-Style:** Pixel-Art
- **Theme:** Steampunk (Dampfmaschinen, Zahnräder, viktorianische Ästhetik, Kupfer/Bronze-Töne)
- **Gegner-Thematik:** Dampfgetriebene Automaten, mechanische Roboter, Zeppelin-Drohnen (post-Release)
- **Turm-Thematik:** Industriell-mechanische Konstruktionen, Dampf-Partikeleffekte

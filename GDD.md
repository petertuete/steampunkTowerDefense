# Game Design Document — Steampunk Tower Defense

**Version:** 0.1  
**Datum:** 15. März 2026  
**Genre:** Tower Defense  
**Stil:** Steampunk, Pixel-Art  
**Plattform:** Browser (lokal + online-fähig)  
**Modus:** Solo, Online-Highscore

---

## 1. Spielprinzip

Der Spieler platziert Türme entlang eines fest vorgegebenen Pfads, um Wellen von Steampunk-Gegnern daran zu hindern, das Ziel zu erreichen. Gegner die durchkommen kosten Leben. Besiegte Gegner geben Gold, das für neue Türme verwendet wird. Das übrig gebliebene Gold am Ende des letzten Levels ist der Highscore-Wert.

---

## 2. Win/Lose-Bedingungen

- **Verloren:** Lebenspunkte sinken auf 0
- **Gewonnen:** Alle Wellen aller Level erfolgreich abgeschlossen
- **Highscore:** Restgold nach dem letzten Level (Level 3, letzte Welle)

---

## 3. Leben & Schaden durch Gegner

| Gegner-Typ       | Leben-Abzug beim Durchkommen |
|------------------|------------------------------|
| Normal-Gegner    | -1 Leben                     |
| Zwischenboss     | -5 Leben                     |
| Endboss          | -20 Leben                    |

**Startleben:** 20

---

## 4. Level & Wellen

| Level | Wellen | Beschreibung                          |
|-------|--------|---------------------------------------|
| 1     | 10     | Einführung, einfache Gegner           |
| 2     | 15     | Zwischenboss, gepanzerte Gegner       |
| 3     | 20     | Alle Gegnertypen, Endboss in letzter Welle |

### Wellen-System
- Zwischen jeder Welle: **10 Sekunden Timer**
- Nächste Welle früher manuell starten (mit Gold-Bonus): **geplant für späteres Update**

### Karten-Layout
- **Größe:** 24×16 Tiles (32×32px pro Tile = 768×512px Spielfläche)
- **Pfad:** Fest vorgegeben, keine Hindernisse (Release 1, alle Level)
- Türme können nur auf nicht-Pfad-Tiles platziert werden
- Hindernisse und komplexere Pfade: **geplant für Post-Release** (siehe Abschnitt 11)

---

## 5. Gegner-Typen

### Basis-Gegner

| Typ        | Eigenschaften                                           |
|------------|---------------------------------------------------------|
| Normal     | Standardwerte, keine Besonderheit                       |
| Gepanzert  | Hohe HP, reduzierter physischer Schaden                 |
| Schnell    | Geringe HP, hohe Bewegungsgeschwindigkeit               |
| Heiler     | Heilt nahe Gegner in regelmäßigen Abständen             |

### Zwischenboss
- Hohe HP, gibt viel Gold
- **Splittet sich beim Tod** in mehrere kleinere Einheiten auf
- Kosten beim Durchkommen: **-5 Leben**

### Endboss
- Sehr hohe HP, sehr viel Gold
- Besitzt eine der Basis-Eigenschaften (Gepanzert / Schnell / Heiler)
- Erscheint in der letzten Welle von Level 3
- Kostet beim Durchkommen: **-20 Leben**

### Gold-Belohnungen (Richtwerte, feinjustierbar)
| Gegner-Typ    | Gold-Belohnung |
|---------------|----------------|
| Normal        | 10 Gold        |
| Gepanzert     | 15 Gold        |
| Schnell       | 8 Gold         |
| Heiler        | 12 Gold        |
| Zwischenboss  | 50 Gold        |
| Endboss       | 150 Gold       |

---

## 6. Turm-Typen

In **Version 1** haben Türme **keine Upgrades**.  
Turm-Upgrades (3 Stufen + Ult) sind bewusst auf eine spätere Version verschoben.  
> **Geplant für späteres Update:** Upgrade-System inkl. ultimativer Aufwertung und optionalen Spezialfähigkeiten.

Verkauf eines Turms gibt **50% des Kaufpreises** zurück.

### Turm-Übersicht

| Turm               | Reichweite | Schaden     | Frequenz | Besonderheit                              |
|--------------------|------------|-------------|----------|-------------------------------------------|
| Dampfkanone        | Mittel     | Mittel      | Mittel   | Standard-Turm, ausgewogen                 |
| Hochdruck-Kanone   | Lang       | Hoch        | Niedrig  | Sniper-Stil, Einzelziel                   |
| Dampfmörser        | Lang       | Fläche      | Niedrig  | Flächenschaden, ideale gegen Gruppen      |
| Flammwerfer        | Kurz       | Fläche + DoT| Mittel   | Damage over Time, kurze Reichweite        |
| Tesla-Turm         | Mittel     | Kettenblitz | Mittel   | Trifft mehrere Gegner in einer Kette      |
| Generator          | —          | Kein Schaden| —        | Erhöht Schaden aller benachbarten Türme   |

### Upgrade-Kosten (für spätere Version, Richtwerte)
| Stufe              | Kostenbeispiel (Dampfkanone) |
|--------------------|------------------------------|
| Kauf               | 100 Gold                     |
| Upgrade 1          | 75 Gold                      |
| Upgrade 2          | 125 Gold                     |
| Upgrade 3          | 200 Gold                     |
| Ultimative Ult     | 350 Gold                     |

---

## 7. Economy

- **Gold verdienen:** Gegner besiegen
- **Gold ausgeben:** Türme kaufen
- **Gold zurückbekommen:** Turm verkaufen = 50% des Kaufpreises
- **Highscore:** Gesamtes verbleibendes Gold nach Level 3, letzte Welle

---

## 8. HUD (Heads-Up Display)

Immer sichtbar während des Spiels:

| Element              | Beschreibung                         |
|----------------------|--------------------------------------|
| Level-Anzeige        | Aktuelles Level (z.B. "Level 2/3")   |
| Restgegner           | Verbleibende Gegner im laufenden Level |
| Wellen-Timer         | Countdown bis zur nächsten Welle     |
| Gold                 | Aktuelles Gold des Spielers          |

---

## 9. Highscore-System

- **Score-Wert:** Restgold am Ende von Level 3
- **Eingabe:** Spielername per Textfeld nach Game Over / Game Won
- **Anzeige:** Online-Highscore-Liste (Top 100)
- **Backend:** REST API (POST Score / GET Top 100)

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

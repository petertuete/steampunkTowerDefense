# Asset Specification — Steampunk Tower Defense

Version: 0.1  
Datum: 15. Maerz 2026  
Status: Release-1 Asset Blueprint

## 1. Ziel
Diese Spezifikation definiert alle visuellen und akustischen Asset-Anforderungen fuer Release 1 mit Platzhalter-First-Strategie.

## 2. Leitprinzipien
- Grid-basiertes Spiel mit 32x32 Tiles
- Gegner und Tuerme passen jeweils in ein Tile (Footprint 1x1)
- Standardgegner sind visuell kleiner als Bosse
- Release 1 nutzt Platzhalter, finale Pixel-Art wird iterativ ersetzt
- Animationsumfang in Release 1 minimal

## 3. Technische Basisdaten
- Tile-Groesse: 32x32 px
- Map-Groesse: 24x16 Tiles
- Zielauflosung Spielfeld: 768x512 px
- Asset-Format Bild: PNG (mit Transparenz)
- Asset-Format Audio: OGG oder WAV
- Farbmodus: Pixel-Art-geeignet, harte Kanten, kein antialiasing im Sprite

## 4. Verzeichnisstruktur (vorgeschlagen)
- frontend/assets/tiles/
- frontend/assets/enemies/
- frontend/assets/towers/
- frontend/assets/ui/
- frontend/assets/effects/
- frontend/assets/audio/sfx/
- frontend/assets/audio/music/
- frontend/assets/placeholders/

## 5. Skalierungs- und Groessenregeln
### 5.1 Gegner
- Normal, gepanzert, schnell, heiler: sichtbarer Körper innerhalb von 20x20 bis 24x24 px
- Zwischenboss: sichtbarer Körper innerhalb von 28x28 bis 32x32 px
- Endboss: sichtbarer Körper innerhalb von 32x32 px (volle Tile-Ausnutzung)
- Alle Gegner behalten denselben logischen Footprint (1 Tile), auch wenn die Grafik kleiner ist

### 5.2 Tuerme
- Alle Tuerme: maximal 32x32 px pro Basis-Sprite
- Waffe/Top-Teil darf innerhalb des Tiles rotieren, darf aber Tile-Grenzen nicht visuell stark ueberschreiten
- Generator: 32x32 px mit klar erkennbarem Support-Charakter

### 5.3 Projektile und Effekte
- Projektil-Sprites klein halten (4x4 bis 12x12 px)
- Explosionen/Flammen/Blitze duerfen 1-2 Tiles ueberdecken, aber Hitbox bleibt systemseitig geregelt

## 6. Gegner-Assetliste
### 6.1 Release 1 Pflicht
- enemy_normal_idle (Sprite/Sheet)
- enemy_armored_idle
- enemy_fast_idle
- enemy_healer_idle
- miniboss_idle
- miniboss_split_child_idle
- boss_idle

### 6.2 Optionale spaetere Varianten
- enemy_normal_walk_final
- enemy_armored_walk_final
- enemy_fast_walk_final
- enemy_healer_cast_final
- boss_phase_variants

## 7. Turm-Assetliste
### 7.1 Release 1 Pflicht
- tower_steam_cannon_base
- tower_highpressure_cannon_base
- tower_mortar_base
- tower_flamethrower_base
- tower_tesla_base
- tower_generator_base

### 7.2 Upgrade-Darstellung
Release 1:
- Keine Upgrade-Darstellung erforderlich (Upgrade-System ist Post-Release)

Spaeter:
- Upgrade-Status ueber UI-Levelmarker (I, II, III, ULT)
- Optional ein Tint/Overlay je Upgrade-Stufe
- Eigene Turm-Sprites pro Upgrade-Stufe

## 8. Animationen
### 8.1 Release 1 (minimal)
- Gegner: idle/walk in einem minimalen Loop (2-4 Frames)
- Tod: optional 2-3 Frames oder einfacher Fade-Out Effekt
- Tuerme: kein komplexes Idle noetig, nur optionaler 2-Frame-Bewegungsakzent
- Angriffseffekte primar ueber Projektile/Particle statt komplexe Turm-Animationen

### 8.2 Spaeteres Release
- Erweiterte Walk/Attack/Death-Sequenzen
- Cast-Animation fuer Heiler
- Komplexere Boss-Phasenanimationen

## 9. Platzhalter-Strategie (Release 1)
### 9.1 Stil der Platzhalter
- Einfache geometrische Formen mit klaren Farben je Einheitstyp
- Einheitliche Konturfarbe fuer Lesbarkeit
- Symbolik statt Detail (z. B. Plus-Symbol fuer Heiler)

### 9.2 Platzhalter-Mapping
- Normal: grauer Kreis/Automat
- Gepanzert: dunkler Block mit Schild-Symbol
- Schnell: schlankes, helles Symbol mit Pfeil-Motiv
- Heiler: gruene Markierung mit Plus-Symbol
- Zwischenboss: grosses Kupfer-Symbol
- Endboss: markantes rotes/bronzenes Boss-Symbol
- Generator: gelber Ring/Spule

### 9.3 Austauschprozess
- Dateinamen bleiben stabil
- Finale Assets ersetzen Platzhalter unter gleichem Namen
- Keine Codeaenderung beim Asset-Austausch erforderlich

## 10. Tileset-Spezifikation
### 10.1 Pflicht-Tiles Release 1
- ground_buildable_a
- ground_buildable_b
- path_straight
- path_corner
- path_t_junction (optional, falls noetig)
- spawn_tile
- base_tile

### 10.2 Stilvorgaben
- Steampunk-Boden (Metallplatten, Nieten, Rohre als Dekor)
- Pfad klar von buildbaren Feldern unterscheidbar
- Kontrast fuer gute Lesbarkeit bei kleinen Zoomstufen

## 11. UI-Assets
### 11.1 Release 1 Pflicht
- Turm-Button-Icons (6)
- Sell-Button-Icon
- Gold-Icon
- Wave-Timer-Icon
- Level-Label-Panel

### 11.3 Spaeter (Post-Release)
- Upgrade-Button-Icon

### 11.2 Designvorgaben
- Pixel-UI, klar lesbar
- Hoher Kontrast fuer Zahlenwerte
- Keine rein dekorativen Icons ohne Funktion

## 12. Effekt-Assets
### 12.1 Release 1 Pflicht
- projectile_bullet
- projectile_shell
- projectile_flame
- projectile_tesla_arc
- hit_spark
- explosion_small
- buff_aura_generator

### 12.2 Regeln
- Effekte muessen Gameplay unterstuetzen, nicht verdecken
- Tesla-Kette visuell eindeutig zwischen Zielen lesbar

## 13. Audio-Assets (Minimalumfang)
### 13.1 SFX Pflicht
- turret_shot_basic
- turret_shot_mortar
- turret_shot_flame_loop
- turret_shot_tesla
- enemy_hit
- enemy_die
- boss_spawn
- wave_start
- wave_clear
- ui_click
- invalid_action

### 13.2 Musik
- 1 Loop-Track fuer Gameplay (Steampunk-Atmosphaere, dezent)
- Optional 1 Track fuer Game Over/Win spaeter

## 14. Benennungsstandard
- Kleinbuchstaben, snake_case
- Einheitliches Praefix nach Kategorie:
  - enemy_
  - tower_
  - tile_
  - ui_
  - fx_
  - sfx_
- Keine Leerzeichen in Dateinamen

Beispiele:
- enemy_healer_idle.png
- tower_tesla_base.png
- fx_explosion_small.png

## 15. Qualitaetskriterien
### Akzeptanzkriterien
- Alle Pflicht-Assets aus Release 1 sind vorhanden oder als Platzhalter ersetzt
- Jede spielrelevante Einheit ist visuell sofort unterscheidbar
- Bosse sind deutlich groesser wahrnehmbar als Standardgegner
- Keine Asset-Datei bricht die 1x1 Tile-Footprint-Logik fuer Kernobjekte

### Definition of Done
- Asset-Checklist fuer Release 1 ist vollstaendig abgehakt
- Alle Platzhalter sind im Spiel korrekt geladen
- Austausch einzelner Platzhalter gegen finale Assets funktioniert ohne Codeaenderung

## 16. Post-Release Asset-Erweiterungen
- Finale Pixel-Art-Sets fuer alle Gegner/Tuerme
- Erweiterte Animationen
- Fliegende Gegner + eigener visuelle Layer
- Spezielle Ult-Effekte pro Turm
- Mehr UI-Skins und Kartenvarianten

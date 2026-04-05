/**
 * Path Configuration
 * 
 * Definiert die Wege, auf denen Gegner laufen (als Tile-Koordinaten)
 * Format: Array von {gridX, gridY} - jedes Feld ist 40x40 Pixel
 * Der Pfad belegt die gesamte Feldbreite
 * 
 * TODO: Später aus externen Map-Dateien laden
 */

const TILE_SIZE = 40;

// Pfad als Grid-Koordinaten (nicht Pixel!)
export const PATHS = {
  level1: [
    // S-Pfad: lang rechts, runter, lang links, runter, lang rechts
    // Abschnitt 1: oben von links nach rechts
    { gridX: 0, gridY: 2 },
    { gridX: 1, gridY: 2 },
    { gridX: 2, gridY: 2 },
    { gridX: 3, gridY: 2 },
    { gridX: 4, gridY: 2 },
    { gridX: 5, gridY: 2 },
    { gridX: 6, gridY: 2 },
    { gridX: 7, gridY: 2 },
    { gridX: 8, gridY: 2 },
    { gridX: 9, gridY: 2 },
    { gridX: 10, gridY: 2 },
    { gridX: 11, gridY: 2 },
    { gridX: 12, gridY: 2 },
    { gridX: 13, gridY: 2 },
    { gridX: 14, gridY: 2 },
    { gridX: 15, gridY: 2 },
    { gridX: 16, gridY: 2 },
    { gridX: 17, gridY: 2 },
    { gridX: 18, gridY: 2 },
    { gridX: 19, gridY: 2 },
    { gridX: 20, gridY: 2 },
    { gridX: 21, gridY: 2 },
    { gridX: 22, gridY: 2 },
    // Abschnitt 2: runter
    { gridX: 22, gridY: 3 },
    { gridX: 22, gridY: 4 },
    { gridX: 22, gridY: 5 },
    { gridX: 22, gridY: 6 },
    { gridX: 22, gridY: 7 },
    { gridX: 22, gridY: 8 },
    // Abschnitt 3: von rechts nach links
    { gridX: 21, gridY: 8 },
    { gridX: 20, gridY: 8 },
    { gridX: 19, gridY: 8 },
    { gridX: 18, gridY: 8 },
    { gridX: 17, gridY: 8 },
    { gridX: 16, gridY: 8 },
    { gridX: 15, gridY: 8 },
    { gridX: 14, gridY: 8 },
    { gridX: 13, gridY: 8 },
    { gridX: 12, gridY: 8 },
    { gridX: 11, gridY: 8 },
    { gridX: 10, gridY: 8 },
    { gridX: 9, gridY: 8 },
    { gridX: 8, gridY: 8 },
    { gridX: 7, gridY: 8 },
    { gridX: 6, gridY: 8 },
    // Abschnitt 4: runter
    { gridX: 6, gridY: 9 },
    { gridX: 6, gridY: 10 },
    { gridX: 6, gridY: 11 },
    { gridX: 6, gridY: 12 },
    { gridX: 6, gridY: 13 },
    { gridX: 6, gridY: 14 },
    // Abschnitt 5: unten von links nach rechts zum Ziel
    { gridX: 7, gridY: 14 },
    { gridX: 8, gridY: 14 },
    { gridX: 9, gridY: 14 },
    { gridX: 10, gridY: 14 },
    { gridX: 11, gridY: 14 },
    { gridX: 12, gridY: 14 },
    { gridX: 13, gridY: 14 },
    { gridX: 14, gridY: 14 },
    { gridX: 15, gridY: 14 },
    { gridX: 16, gridY: 14 },
    { gridX: 17, gridY: 14 },
    { gridX: 18, gridY: 14 },
    { gridX: 19, gridY: 14 },
    { gridX: 20, gridY: 14 },
    { gridX: 21, gridY: 14 },
    { gridX: 22, gridY: 14 },
    { gridX: 23, gridY: 14 },
    { gridX: 24, gridY: 14 },
    { gridX: 25, gridY: 14 },
    { gridX: 26, gridY: 14 },
  ],
  level2: [
    // Zickzack-Pfad: rechts → unten → rechts (3 Felder) → hoch → rechts zum Exit
    // Abschnitt 1: horizontal nach rechts
    { gridX: 0, gridY: 2 },
    { gridX: 1, gridY: 2 },
    { gridX: 2, gridY: 2 },
    { gridX: 3, gridY: 2 },
    { gridX: 4, gridY: 2 },
    { gridX: 5, gridY: 2 },
    { gridX: 6, gridY: 2 },
    { gridX: 7, gridY: 2 },
    { gridX: 8, gridY: 2 },
    { gridX: 9, gridY: 2 },
    { gridX: 10, gridY: 2 },
    // Abschnitt 2: vertikal nach unten (Spalte 10)
    { gridX: 10, gridY: 3 },
    { gridX: 10, gridY: 4 },
    { gridX: 10, gridY: 5 },
    { gridX: 10, gridY: 6 },
    { gridX: 10, gridY: 7 },
    { gridX: 10, gridY: 8 },
    { gridX: 10, gridY: 9 },
    { gridX: 10, gridY: 10 },
    { gridX: 10, gridY: 11 },
    { gridX: 10, gridY: 12 },
    // Abschnitt 3: 3 Felder nach rechts (Reihe 12)
    { gridX: 11, gridY: 12 },
    { gridX: 12, gridY: 12 },
    { gridX: 13, gridY: 12 },
    // Abschnitt 4: vertikal nach oben zurück zur Ausgangshöhe (Spalte 13)
    { gridX: 13, gridY: 11 },
    { gridX: 13, gridY: 10 },
    { gridX: 13, gridY: 9 },
    { gridX: 13, gridY: 8 },
    { gridX: 13, gridY: 7 },
    { gridX: 13, gridY: 6 },
    { gridX: 13, gridY: 5 },
    { gridX: 13, gridY: 4 },
    { gridX: 13, gridY: 3 },
    { gridX: 13, gridY: 2 },
    // Abschnitt 5: horizontal nach rechts zum Exit
    { gridX: 14, gridY: 2 },
    { gridX: 15, gridY: 2 },
    { gridX: 16, gridY: 2 },
    { gridX: 17, gridY: 2 },
    { gridX: 18, gridY: 2 },
    { gridX: 19, gridY: 2 },
    { gridX: 20, gridY: 2 },
    { gridX: 21, gridY: 2 },
    { gridX: 22, gridY: 2 },
    { gridX: 23, gridY: 2 },
    { gridX: 24, gridY: 2 },
    { gridX: 25, gridY: 2 },
    { gridX: 26, gridY: 2 },
  ],
  level3: [
    // Level 3: schnurgerader Pfad von links nach rechts
    { gridX: 0, gridY: 8 },
    { gridX: 1, gridY: 8 },
    { gridX: 2, gridY: 8 },
    { gridX: 3, gridY: 8 },
    { gridX: 4, gridY: 8 },
    { gridX: 5, gridY: 8 },
    { gridX: 6, gridY: 8 },
    { gridX: 7, gridY: 8 },
    { gridX: 8, gridY: 8 },
    { gridX: 9, gridY: 8 },
    { gridX: 10, gridY: 8 },
    { gridX: 11, gridY: 8 },
    { gridX: 12, gridY: 8 },
    { gridX: 13, gridY: 8 },
    { gridX: 14, gridY: 8 },
    { gridX: 15, gridY: 8 },
    { gridX: 16, gridY: 8 },
    { gridX: 17, gridY: 8 },
    { gridX: 18, gridY: 8 },
    { gridX: 19, gridY: 8 },
    { gridX: 20, gridY: 8 },
    { gridX: 21, gridY: 8 },
    { gridX: 22, gridY: 8 },
    { gridX: 23, gridY: 8 },
    { gridX: 24, gridY: 8 },
    { gridX: 25, gridY: 8 },
    { gridX: 26, gridY: 8 },
    { gridX: 27, gridY: 8 },
    { gridX: 28, gridY: 8 },
    { gridX: 29, gridY: 8 },
    { gridX: 30, gridY: 8 },
    { gridX: 31, gridY: 8 },
  ]
};

// Konvertiere zu Pixel-Koordinaten für die Gegner
export function gridToPixel(gridCoord) {
  return {
    x: gridCoord.gridX * TILE_SIZE + TILE_SIZE / 2,
    y: gridCoord.gridY * TILE_SIZE + TILE_SIZE / 2
  };
}

// Konvertiere Pfad zu Pixel-Koordinaten
export function getPixelPath(gridPath) {
  return gridPath.map(gridToPixel);
}

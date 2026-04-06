/**
 * Wave Configuration
 * 
 * Definiert Level und Wellen mit Gegner-Komposition
 */

// Wave-Format: String aus Zeichen
//   n = Normal-Gegner
//   s = Schnell-Gegner (speed)
//   a = Gepanzert-Gegner (armored)
//   . = Extra-Pause (1 Sekunde zusätzlich)
// Beispiel: 'nnn.ss.a' = 3 Normal, Pause, 2 Schnell, Pause, 1 Gepanzert
export const LEVELS = {
  level1: {
    levelNumber: 1,
    displayName: 'Beginner',
    totalWaves: 15,
    allowedTowers: ['steamCannon', 'generator'],
    waves: [
      'n...nn..nnn.nnnn',       // W1:  10n 0s 0a
      'nnn.nnn.nnnn',           // W2:  10n 0s 0a
      'nnn.nnn..s..s',          // W3:  6n 2s 0a
      'nnn.s.nnn.ss',           // W4:  6n 3s 0a
      'n.s.n.s.ns.ns.nsns',     // W5:  6n 7s 0a
      'n.s.ns.s.ns.sns.sns',    // W6:  4n 8s 0a  - speed-dominant, kein a
      'nn.a..nn.a',             // W7:  4n 2a 0s  - erste Armored, kleine Gruppen
      'nnn.aa.nnn.aa',          // W8:  6n 4a 0s  - mehr Armored, Paare
      'nn.aaa.nn.aaa',          // W9:  4n 6a 0s  - Armored-Mehrheit
      'n.aaaa.n.aaaa.a',        // W10: 2n 9a 0s  - fast nur Armored, Druckwelle
      'n.ssssssss.aaaaaaaaa',   // W11: 1n 8s 9a
      'n.sssssssss.aaaaaaaaa',  // W12: 1n 9s 9a
      'ssssssssss.aaaaaaaaa',   // W13: 10s 9a
      'ssssssssss.aaaaaaaaaa',  // W14: 10s 10a
      'sssssssssss.aaaaaaaaaa', // W15: 11s 10a (finale)
    ]
  },
  level2: {
    levelNumber: 2,
    displayName: 'Advanced',
    totalWaves: 20,
    allowedTowers: ['steamCannon', 'generator', 'flamethrower'],
    waves: [
      'nnn',                    // W1:  3n
      'nnnn.s',                 // W2:  4n 1s
      'nnnn.ss',                // W3:  4n 2s
      'nnn.ss.a',               // W4:  3n 2s 1a
      'nn.sss.a',               // W5:  2n 3s 1a
      'n.sss.aa',               // W6:  1n 3s 2a
      'n.sss.aa',               // W7:  1n 3s 2a
      'ssss.aaa',               // W8:  4s 3a
      'ssss.aaa',               // W9:  4s 3a
      'sss.aaaa',               // W10: 3s 4a
      'n.ssss.aaaa',            // W11: 1n 4s 4a
      'n.sssss.aaaa',           // W12: 1n 5s 4a
      'sssss.aaaaa',            // W13: 5s 5a
      'n.ssss.aaaaaa',          // W14: 1n 4s 6a
      'ssssss.aaaaa',           // W15: 6s 5a
      'n.sssss.aaaaaa',         // W16: 1n 5s 6a
      'ssssss.aaaaaa',          // W17: 6s 6a
      'n.ssssss.aaaaaa',        // W18: 1n 6s 6a
      'sssssss.aaaaaa',         // W19: 7s 6a
      'ssssss.aaaaaaaa',        // W20: 6s 8a (finale)
    ]
  },
  level3: {
    levelNumber: 3,
    displayName: 'Ultimate',
    totalWaves: 25,
    waves: [
      'nnnn.s',                      // W1:  4n 1s
      'nnnnn.s',                     // W2:  5n 1s
      'nnnn.ss.a',                   // W3:  4n 2s 1a
      'nnnn.sss.a',                  // W4:  4n 3s 1a
      'nnn.sss.aa',                  // W5:  3n 3s 2a
      'nnn.ssss.aa',                 // W6:  3n 4s 2a
      'nn.ssss.aaa',                 // W7:  2n 4s 3a
      'nn.sssss.aaa',                // W8:  2n 5s 3a
      'n.sssss.aaaa',                // W9:  1n 5s 4a
      'n.ssssss.aaaa',               // W10: 1n 6s 4a
      'n.ssssss.aaaaa',              // W11: 1n 6s 5a
      'sssssss.aaaaa',               // W12: 7s 5a
      'n.ssssss.aaaaaa',             // W13: 1n 6s 6a
      'sssssss.aaaaaa',              // W14: 7s 6a
      'n.sssssss.aaaaaa',            // W15: 1n 7s 6a
      'ssssssss.aaaaaa',             // W16: 8s 6a
      'n.sssssss.aaaaaaa',           // W17: 1n 7s 7a
      'ssssssss.aaaaaaa',            // W18: 8s 7a
      'n.ssssssss.aaaaaaa',          // W19: 1n 8s 7a
      'sssssssss.aaaaaaa',           // W20: 9s 7a
      'n.ssssssss.aaaaaaaa',         // W21: 1n 8s 8a
      'sssssssss.aaaaaaaa',          // W22: 9s 8a
      'n.sssssssss.aaaaaaaa',        // W23: 1n 9s 8a
      'ssssssssss.aaaaaaaa',         // W24: 10s 8a
      'ssssssssss.aaaaaaaaaa',       // W25: 10s 10a (finale)
    ]
  }
};

export const WAVE_CONFIG = {
  INITIAL_BUILD_PAUSE: 15000, // 15 Sekunden Vorbereitungszeit vor Welle 1
  PAUSE_BETWEEN_WAVES: 10000, // 10 Sekunden in millisekunden
  SPAWN_INTERVAL: 1000,       // 1000ms (1 Sekunde) zwischen Gegner-Spawns pro Welle
  EXTRA_PAUSE_MS: 1000,       // Extra-Pause durch '.' im Wave-String
  MAX_LIVES: 20
};

export const DEFAULT_LEVEL = 'level1';

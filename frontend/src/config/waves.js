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
      'n.n.n.n',                          // W1:  4n 0s 0a
      'nnn.nnn.nnn',                      // W2:  9n 0s 0a
      'nnnnnnnnn',                        // W3:  9n 0s 0a
      'n.s.n.s.n',                        // W4:  3n 2s 0a
      'n.ss.n.ss.ns',                     // W5:  3n 6s 0a
      'nnsss.nnsss',                      // W6:  4n 6s 0a
      'nn.a.nn',                          // W7:  4n 0s 1a
      'nn.aa.nn',                         // W8:  4n 0s 2a
      'n.aaa.aaa',                        // W9:  1n 0s 6a
      'aaa.aaa.aaa',                      // W10: 0n 0s 9a
      'ss.nn.aa.sna',                     // W11: 3n 3s 3a
      'nsa.nnssaa.nsa',                   // W12: 5n 4s 4a
      'nnn.sss.aaa.nnn',                  // W13: 6n 3s 3a
      'a.n.s..aa.nn.ss..ans',             // W14: 4n 4s 4a
      'aaaaaaaaaa',                       // W15: 0n 0s 10a
      'aaaannnnaa',                        // W16: 4n 0s 6a
      'aaannaaaaann',                      // W17: 2n 0s 9a
      'aaaaansaaaaans',                    // W18: 0n 2s 10a
      'aanaanaanaanaan',                   // W19: 6n 0s 8a
      'aaaaannaaaaassaaaaa',              // W20: 7n 2s 10a
    ]
  },
  level3: {
    levelNumber: 3,
    displayName: 'Ultimate',
    totalWaves: 20,
    allowedTowers: ['steamCannon', 'generator', 'flamethrower', 'Tesla'],
    waves: [
      'n.n.n.nn',                      // W1:  5n 0s 0a
      'nnn.nnn.nnn',                  // W2:  9n 0s 0a
      'nnnnn.nnnn.n',                 // W3:  10n 0s 0a
      's.s.s.s.s.s.s.s',              // W4:  0n 8s 0a
      'sss.sss',                      // W5:  0n 6s 0a
      'ss.nn.ss.nn.ss',               // W6:  4n 6s 0a
      'nnn.a.nnn',                    // W7:  6n 0s 1a
      'nn.nnn.a.aa.aaa',              // W8:  5n 0s 6a
      'aa.nn.aa.nn.aa',               // W9:  4n 0s 6a
      'sss.aaa.aa.a',                 // W10: 0n 3s 6a
      'sss.aaa.sss.a',                // W11: 0n 6s 4a
      'aaa.s.ss.aaa.sss',             // W12: 0n 6s 6a
      'sna.san.nas.nsa',              // W13: 4n 4s 4a
      'nas.nsa.asn.ans',              // W14: 4n 4s 4a
      'ans..ans.ans.ansans',          // W15: 6n 5s 5a
      'nnnss.nnsss.nnnsss',           // W16: 8n 7s 0a
      'aaans.aaasn.aaaaa',            // W17: 2n 2s 11a
      'aaaaannnnn.aaannn',            // W18: 8n 0s 8a
      'ansansansansansans',           // W19: 6n 6s 6a
      'aaaasaaaaaaasaaaaaaa',         // W20: 0n 2s 18a
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

/**
 * Tower Configuration
 * 
 * Definiert alle 6 Turm-Typen mit ihren Stats
 * 
 * TODO:
 * - Werte aus GDD balancieren
 * - Upgrade-Kosten und Boni definieren
 * - Ult-Mechaniken (für später)
 */

export const TOWER_TYPES = {
  steamCannon: {
    name: 'Dampfkanone',
    cost: 150,
    range: 150,
    damage: 30,
    fireRate: 0.8,
    color: 0xff8800
  },
  highPressure: {
    name: 'Hochdruck-Kanone',
    cost: 220,
    range: 200,
    damage: 50,
    fireRate: 0.5,
    color: 0xffaa00
  },
  flamethrower: {
    name: 'Flammwerfer',
    cost: 170,
    range: 85,
    damage: 30,
    fireRate: 1.2,
    color: 0xff3300,
    isDoT: true,
    dotDurationMs: 2500,
    dotTickIntervalMs: 250,
    dotDamageMultiplier: 0.3
  },
  Tesla: {
    name: 'Tesla-Turm',
    cost: 220,
    range: 130,
    damage: 30,
    fireRate: 0.5,
    color: 0x0088ff,
    isChain: true,
    chainCount: 2,
    chainRange: 90,
    chainDamageMultiplier: 0.7
  },
  generator: {
    name: 'Generator',
    cost: 110,
    range: 120,
    damage: 0,
    fireRate: 0,
    color: 0x00ff00,
    isBuff: true
  }
};

// Upgrade-Kosten (Basis)
export const UPGRADE_COSTS = {
  level1: 75,
  level2: 125,
  level3: 200,
  ult: 350
};

// Startgold für Spieler
export const STARTING_GOLD = 400;

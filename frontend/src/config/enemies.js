/**
 * Enemy Configuration
 * 
 * Definiert Gegner-Typen und ihre Reward-Werte
 */

export const ENEMY_TYPES = {
  normal: {
    name: 'Normal',
    maxHealth: 60,
    speed: 100,
    reward: 5
  },
  fast: {
    name: 'Schnell',
    maxHealth: 40,
    speed: 160,
    reward: 8
  },
  armored: {
    name: 'Gepanzert',
    maxHealth: 130,
    speed: 60,
    reward: 12
  }
};

export const DEFAULT_ENEMY_TYPE = 'normal';

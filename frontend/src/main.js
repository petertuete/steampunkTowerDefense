import Phaser from 'phaser';
import { IntroScene } from './scenes/IntroScene.js';
import GameScene from './scenes/GameScene.js';

/**
 * Haupteinstiegspunkt für das Spiel
 * Konfiguriert Phaser und startet die erste Scene
 */

const config = {
  type: Phaser.AUTO,
  width: 1280,
  height: 960,
  parent: 'game-container',
  scene: [IntroScene, GameScene],
  render: {
    pixelArt: true,
    antialias: false
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  }
};

const game = new Phaser.Game(config);

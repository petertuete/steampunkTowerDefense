export class IntroScene extends Phaser.Scene {
  constructor() {
    super({ key: 'IntroScene' });
  }

  create() {
    const width = this.scale.width;
    const height = this.scale.height;

    // Hintergrund
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a1a).setOrigin(0.5);

    // Titel
    this.add.text(width / 2, 60, 'STEAMPUNK TOWER DEFENSE', {
      fontSize: '36px',
      fill: '#ffff00',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Anleitung
    const instructionY = 150;
    const lineSpacing = 24;
    const instructions = [
      'GRUNDLEGENDE STEUERUNG:',
      '',
      'CLICK - Turm platzieren auf dem Feld',
      'SHIFT + CLICK - Turm verkaufen',
      'T - Turm-Typ wechseln',
      'S - Spielgeschwindigkeit (1x → 2x → 3x)',
      '',
      'ZIEL: Baue Türme, um enemy waves zu besiegen',
      'Greife nach Ansage auf "JETZT STARTEN"',
      '',
      'TÜRME:',
      '• Dampfkanone (Grün) - Basis-Turm',
      '• Generator (Helldunkelgrün) - Buff für andere Türme',
      '',
      'GEGNER:',
      '• Grün - Normal',
      '• Orange - Schnell',
      '• Gelb - Gepanzert (tankt mehr Schaden)'
    ];

    instructions.forEach((line, index) => {
      let color = '#cccccc';
      let fontSize = '14px';
      let bold = false;

      if (line === 'GRUNDLEGENDE STEUERUNG:' || line === 'TÜRME:' || line === 'GEGNER:') {
        color = '#00ff00';
        fontSize = '16px';
        bold = true;
      }

      this.add.text(width / 2, instructionY + index * lineSpacing, line, {
        fontSize: fontSize,
        fill: color,
        fontFamily: 'Courier',
        fontStyle: bold ? 'bold' : 'normal',
        align: 'center'
      }).setOrigin(0.5);
    });

    // Start Button
    const startBtnY = instructionY + instructions.length * lineSpacing + 40;

    const createButton = (x, y, text) => {
      const btn = this.add.text(x, y, text, {
        fontSize: '18px',
        fill: '#00ff00',
        fontFamily: 'Courier',
        fontStyle: 'bold',
        backgroundColor: '#003300',
        padding: { x: 14, y: 6 }
      })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

      btn.on('pointerdown', () => this.startGame(false));
      btn.on('pointerover', () => btn.setStyle({ fill: '#ffff00' }));
      btn.on('pointerout', () => btn.setStyle({ fill: '#00ff00' }));

      return btn;
    };

    createButton(width / 2, startBtnY, '[ SPIELSTART ]');

    // Leertaste zum Starten
    this.input.keyboard.on('keydown-SPACE', () => this.startGame(false));
    this.input.keyboard.on('keydown-D', () => this.startGame(true));

    // Hinweis unten
    this.add.text(width / 2, height - 20, 'Leertaste/Button = normal | D = Debug-Start', {
      fontSize: '12px',
      fill: '#888888',
      fontFamily: 'Courier'
    }).setOrigin(0.5);
  }

  startGame(debugMode = false) {
    this.scene.start('GameScene', { debugMode });
  }
}

export class IntroScene extends Phaser.Scene {
  constructor() {
    super({ key: 'IntroScene' });
  }

  preload() {
    this.load.image('intro-bg', '/intro-bg.png');
  }

  create() {
    const width = this.scale.width;
    const height = this.scale.height;

    // Hintergrundbild
    this.add.image(width / 2, height / 2, 'intro-bg')
      .setDisplaySize(width, height)
      .setOrigin(0.5);

    // Globales Dark-Overlay für Lesbarkeit
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.52).setOrigin(0.5);

    // Panel hinter Anweisungen für stabile Lesbarkeit
    const panelHeight = 520;
    this.add.rectangle(width / 2, 360, 920, panelHeight, 0x0b1118, 0.72)
      .setOrigin(0.5)
      .setStrokeStyle(2, 0x3a4f63, 0.8);

    // Titel
    this.add.text(width / 2, 60, 'STEAMPUNK TOWER DEFENSE', {
      fontSize: '36px',
      fill: '#ffd166',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5).setShadow(0, 2, '#000000', 8, true, true);

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
      let color = '#f1f5f9';
      let fontSize = '14px';
      let bold = false;

      if (line === 'GRUNDLEGENDE STEUERUNG:' || line === 'TÜRME:' || line === 'GEGNER:') {
        color = '#7dd3fc';
        fontSize = '16px';
        bold = true;
      }

      this.add.text(width / 2, instructionY + index * lineSpacing, line, {
        fontSize: fontSize,
        fill: color,
        fontFamily: 'Courier',
        fontStyle: bold ? 'bold' : 'normal',
        align: 'center'
      }).setOrigin(0.5).setShadow(0, 1, '#000000', 6, true, true);
    });

    // Start Button
    const startBtnY = instructionY + instructions.length * lineSpacing + 40;

    const createButton = (x, y, text) => {
      const btn = this.add.text(x, y, text, {
        fontSize: '18px',
        fill: '#d1fae5',
        fontFamily: 'Courier',
        fontStyle: 'bold',
        backgroundColor: '#064e3b',
        padding: { x: 14, y: 6 }
      })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

      btn.on('pointerdown', () => this.startGame(false));
      btn.on('pointerover', () => btn.setStyle({ fill: '#fef08a', backgroundColor: '#065f46' }));
      btn.on('pointerout', () => btn.setStyle({ fill: '#d1fae5', backgroundColor: '#064e3b' }));

      return btn;
    };

    createButton(width / 2, startBtnY, '[ SPIELSTART ]');

    // Leertaste zum Starten
    this.input.keyboard.on('keydown-SPACE', () => this.startGame(false));
    this.input.keyboard.on('keydown-D', () => this.startGame(true));

    // Hinweis unten
    this.add.text(width / 2, height - 20, 'Leertaste/Button = normal | D = Debug-Start', {
      fontSize: '12px',
      fill: '#cbd5e1',
      fontFamily: 'Courier'
    }).setOrigin(0.5).setShadow(0, 1, '#000000', 5, true, true);
  }

  startGame(debugMode = false) {
    this.scene.start('GameScene', { debugMode });
  }
}

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

    // Leichter Dampf-Layer im Hintergrund für mehr Bewegung auf dem Intro-Screen
    if (!this.textures.exists('steam-dot')) {
      const steamDot = this.make.graphics({ add: false });
      steamDot.fillStyle(0xffffff, 1);
      steamDot.fillCircle(4, 4, 4);
      steamDot.generateTexture('steam-dot', 8, 8);
      steamDot.destroy();
    }
    this.add.particles(0, 0, 'steam-dot', {
      x: { min: 60, max: width - 60 },
      y: height + 40,
      speedY: { min: -62, max: -26 },
      speedX: { min: -20, max: 20 },
      lifespan: { min: 5400, max: 9800 },
      scale: { start: 0.25, end: 1.65 },
      alpha: { start: 0.26, end: 0 },
      frequency: 70,
      quantity: 2
    }).setDepth(1);

    this.add.particles(0, 0, 'steam-dot', {
      x: { min: 120, max: width - 120 },
      y: height + 30,
      speedY: { min: -76, max: -34 },
      speedX: { min: -28, max: 28 },
      lifespan: { min: 3600, max: 7200 },
      scale: { start: 0.14, end: 1.2 },
      alpha: { start: 0.16, end: 0 },
      frequency: 48,
      quantity: 2
    }).setDepth(1);

    this.add.particles(0, 0, 'steam-dot', {
      x: { min: 200, max: width - 200 },
      y: { min: height * 0.5, max: height + 20 },
      speedY: { min: -36, max: -12 },
      speedX: { min: -12, max: 12 },
      lifespan: { min: 5200, max: 11000 },
      scale: { start: 0.45, end: 2.1 },
      alpha: { start: 0.08, end: 0 },
      frequency: 150,
      quantity: 1
    }).setDepth(1);

    // Panel hinter Anweisungen für stabile Lesbarkeit im Brass-Stil
    const panelHeight = 520;
    this.add.rectangle(width / 2, 364, 940, panelHeight + 18, 0x000000, 0.32)
      .setOrigin(0.5);

    this.add.rectangle(width / 2, 360, 932, panelHeight + 10, 0x2a1e14, 0.94)
      .setOrigin(0.5)
      .setStrokeStyle(3, 0xcfab72, 0.92);

    this.add.rectangle(width / 2, 360, 904, panelHeight - 18, 0x091018, 0.26)
      .setOrigin(0.5)
      .setStrokeStyle(2, 0xd0ad77, 0.22);

    // Subtile Rauchglas-Layer statt hartem Reflexbalken
    this.add.rectangle(width / 2, 360, 888, panelHeight - 34, 0x1a2633, 0.08).setOrigin(0.5);
    this.add.rectangle(width / 2, 154, 880, 18, 0xf6dfb6, 0.05).setOrigin(0.5);
    this.add.rectangle(width / 2, 566, 880, 14, 0x05080d, 0.08).setOrigin(0.5);
    this.add.rectangle(width / 2 - 330, 360, 2, panelHeight - 42, 0xf3ddb3, 0.08).setOrigin(0.5);
    this.add.rectangle(width / 2 + 330, 360, 2, panelHeight - 42, 0xf3ddb3, 0.05).setOrigin(0.5);

    const panelRivets = [
      [width / 2 - 466, 95],
      [width / 2 + 466, 95],
      [width / 2 - 466, 625],
      [width / 2 + 466, 625]
    ];
    panelRivets.forEach(([x, y]) => {
      this.add.circle(x, y, 6, 0xd5b27b, 0.95).setStrokeStyle(1, 0x2c2118, 0.95);
      this.add.circle(x, y, 2, 0xf8e8c6, 0.65);
    });

    // Titelplakette im gleichen Materialmix wie Hauptpanel und Buttons
    this.add.rectangle(width / 2, 64, 646, 66, 0x000000, 0.28).setOrigin(0.5);
    this.add.rectangle(width / 2, 60, 636, 62, 0x2d2015, 0.95)
      .setOrigin(0.5)
      .setStrokeStyle(3, 0xd0ac74, 0.95);
    this.add.rectangle(width / 2, 60, 612, 42, 0x101721, 0.42)
      .setOrigin(0.5)
      .setStrokeStyle(1, 0xf3ddb3, 0.2);
    this.add.rectangle(width / 2, 48, 598, 10, 0xf3ddb3, 0.05).setOrigin(0.5);
    this.add.circle(width / 2 - 298, 60, 5, 0xd4b17b, 0.95).setStrokeStyle(1, 0x2c2118, 0.95);
    this.add.circle(width / 2 + 298, 60, 5, 0xd4b17b, 0.95).setStrokeStyle(1, 0x2c2118, 0.95);

    const title = this.add.text(width / 2, 60, 'STEAMPUNK TOWER DEFENSE', {
      fontSize: '36px',
      fill: '#ffd166',
      fontFamily: 'Georgia',
      fontStyle: 'bold'
    }).setOrigin(0.5).setShadow(0, 2, '#000000', 8, true, true);
    this.tweens.add({
      targets: title,
      y: title.y + 5,
      duration: 2200,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });

    // Anleitung mit klarer Hierarchie statt Textwand
    const instructionBlocks = [
      {
        title: 'STEUERUNG',
        y: 214,
        height: 132,
        lines: [
          'CLICK: Turm platzieren',
          'SHIFT + CLICK: Turm verkaufen',
          '1-4: Turm direkt wählen',
          'T: Turm-Typ wechseln',
          'S: Spielgeschwindigkeit 1x / 2x / 3x'
        ]
      },
      {
        title: 'AUFTRAG',
        y: 344,
        height: 88,
        lines: [
          'Wehre die Gegnerwellen ab und halte die Linie.',
          'Start per SPIELSTART oder Leertaste.'
        ]
      },
      {
        title: 'EINHEITEN IM FELD',
        y: 485,
        height: 154,
        lines: [
          'Dampfkanone: rasant, hoher Schaden',
          'Generator: verstaerkt andere Tuerme (+33%)',
          'Waldlaeufer: Standard-Gegner',
          'Racer: schnell, leicht zu unterschaetzen',
          'Panzer: langsam, zaeh, unerquicklich'
        ]
      }
    ];

    instructionBlocks.forEach((block) => {
      this.add.rectangle(width / 2, block.y, 820, block.height, 0x101722, 0.2)
        .setOrigin(0.5)
        .setStrokeStyle(1, 0xd2ae79, 0.15);
      this.add.rectangle(width / 2, block.y - block.height / 2 + 32, 760, 1, 0xd7b47b, 0.25)
        .setOrigin(0.5);

      this.add.text(width / 2, block.y - block.height / 2 + 14, block.title, {
        fontSize: '15px',
        fill: '#f2d19a',
        fontFamily: 'Georgia',
        fontStyle: 'bold',
        align: 'center'
      }).setOrigin(0.5).setShadow(0, 1, '#000000', 4, true, true);

      const textStartY = block.y - block.height / 2 + 52;
      block.lines.forEach((line, index) => {
        this.add.text(width / 2, textStartY + index * 22, line, {
          fontSize: '14px',
          fill: '#ece5d8',
          fontFamily: 'Courier',
          align: 'center'
        }).setOrigin(0.5).setShadow(0, 1, '#000000', 5, true, true);
      });
    });

    // Start Button
    const startBtnY = 598;

    const createButton = (x, y, text) => {
      const shadow = this.add.rectangle(x, y + 4, 304, 56, 0x000000, 0.35).setOrigin(0.5);
      const plate = this.add.rectangle(x, y, 304, 56, 0x2f2419, 0.95)
        .setOrigin(0.5)
        .setStrokeStyle(2, 0xc8a466, 0.95);
      const inset = this.add.rectangle(x, y, 286, 40, 0x121922, 0.42)
        .setOrigin(0.5)
        .setStrokeStyle(1, 0xe8d3a6, 0.28);
      const insetGlow = this.add.rectangle(x, y - 10, 272, 8, 0xf5deb6, 0.05).setOrigin(0.5);

      const leftRivet = this.add.circle(x - 130, y, 4, 0xceb07d, 0.95)
        .setStrokeStyle(1, 0x2b2118, 0.9);
      const rightRivet = this.add.circle(x + 130, y, 4, 0xceb07d, 0.95)
        .setStrokeStyle(1, 0x2b2118, 0.9);

      const label = this.add.text(x, y, text, {
        fontSize: '20px',
        fill: '#f7ebcf',
        fontFamily: 'Courier',
        fontStyle: 'bold'
      }).setOrigin(0.5).setShadow(0, 1, '#000000', 4, true, true);

      const hitArea = this.add.rectangle(x, y, 304, 56, 0x000000, 0.001)
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

      const applyIdleStyle = () => {
        plate.setFillStyle(0x2f2419, 0.95);
        plate.setStrokeStyle(2, 0xc8a466, 0.95);
        inset.setFillStyle(0x121922, 0.42);
        inset.setStrokeStyle(1, 0xe8d3a6, 0.28);
        insetGlow.setAlpha(0.05);
        label.setColor('#f7ebcf');
        label.setScale(1);
      };

      const applyHoverStyle = () => {
        plate.setFillStyle(0x3b2c1d, 0.98);
        plate.setStrokeStyle(2, 0xf3d49b, 1);
        inset.setFillStyle(0x17202b, 0.5);
        inset.setStrokeStyle(1, 0xf0dab0, 0.35);
        insetGlow.setAlpha(0.09);
        label.setColor('#fff6dd');
        label.setScale(1.03);
      };

      hitArea.on('pointerdown', () => this.startGame(false));
      hitArea.on('pointerover', applyHoverStyle);
      hitArea.on('pointerout', applyIdleStyle);

      applyIdleStyle();

      return { hitArea, shadow, plate, inset, insetGlow, leftRivet, rightRivet, label };
    };

    createButton(width / 2, startBtnY, 'SPIELSTART');

    // Leertaste zum Starten
    this.input.keyboard.on('keydown-SPACE', () => this.startGame(false));
    this.input.keyboard.on('keydown-D', () => this.startGame(true));

    // Hilfe-Button im gleichen Materialstil wie der Start-Button
    const infoX = width - 70;
    const infoY = 34;
    const infoShadow = this.add.rectangle(infoX, infoY + 2, 88, 34, 0x000000, 0.35).setOrigin(0.5);
    const infoPlate = this.add.rectangle(infoX, infoY, 88, 34, 0x312418, 0.96)
      .setOrigin(0.5)
      .setStrokeStyle(2, 0xd7b37b, 0.94);
    const infoInset = this.add.rectangle(infoX, infoY, 78, 24, 0x654729, 0.94)
      .setOrigin(0.5)
      .setStrokeStyle(1, 0xf0dab0, 0.6);
    const infoLabel = this.add.text(infoX, infoY, 'HILFE', {
      fontSize: '13px',
      fill: '#f7ebcf',
      fontFamily: 'Courier',
      fontStyle: 'bold'
    }).setOrigin(0.5).setShadow(0, 1, '#000000', 3, true, true);

    const infoBtn = this.add.rectangle(infoX, infoY, 88, 34, 0x000000, 0.001)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    const setInfoIdle = () => {
      infoPlate.setFillStyle(0x312418, 0.96);
      infoPlate.setStrokeStyle(2, 0xd7b37b, 0.94);
      infoInset.setFillStyle(0x654729, 0.94);
      infoLabel.setColor('#f7ebcf');
      infoLabel.setScale(1);
    };

    const setInfoHover = () => {
      infoPlate.setFillStyle(0x3f2d1c, 1);
      infoPlate.setStrokeStyle(2, 0xffd9a2, 1);
      infoInset.setFillStyle(0x7b5430, 0.96);
      infoLabel.setColor('#fff3d8');
      infoLabel.setScale(1.03);
    };

    infoBtn.on('pointerdown', () => this.showScoringInfo());
    infoBtn.on('pointerover', setInfoHover);
    infoBtn.on('pointerout', setInfoIdle);
    setInfoIdle();

    // Hinweis unten dezent eingefasst
    const footerY = height - 22;
    this.add.rectangle(width / 2, footerY + 2, 330, 24, 0x000000, 0.22).setOrigin(0.5);
    this.add.rectangle(width / 2, footerY, 326, 22, 0x231a14, 0.54)
      .setOrigin(0.5)
      .setStrokeStyle(1, 0xd0ad77, 0.28);
    this.add.rectangle(width / 2, footerY, 314, 14, 0x101721, 0.18)
      .setOrigin(0.5)
      .setStrokeStyle(1, 0xf3ddb3, 0.08);

    this.add.text(width / 2, footerY, 'Leertaste/Button = normal | D = Debug-Start', {
      fontSize: '12px',
      fill: '#d7d4cd',
      fontFamily: 'Courier'
    }).setOrigin(0.5).setShadow(0, 1, '#000000', 5, true, true);
  }

  showScoringInfo() {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:radial-gradient(circle at 50% 20%, rgba(36,25,15,0.55), rgba(0,0,0,0.86));display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px;box-sizing:border-box;';

    const box = document.createElement('div');
    box.style.cssText = 'background:linear-gradient(180deg,#2d2015 0%,#1b1714 20%,#131922 100%);border:3px solid #d4ae74;border-radius:12px;padding:26px 24px 22px;max-width:660px;width:min(660px,100%);max-height:82vh;overflow-y:auto;font-family:Courier,monospace;box-shadow:0 18px 50px rgba(0,0,0,0.55), inset 0 0 0 2px rgba(243,216,170,0.22);color:#e5e7eb;';

    const title = document.createElement('div');
    title.textContent = 'SCORING-SYSTEM';
    title.style.cssText = 'color:#f7d39a;font-size:26px;font-weight:700;margin-bottom:16px;text-align:center;letter-spacing:1.2px;text-shadow:0 2px 8px rgba(0,0,0,0.5);font-family:Georgia,"Times New Roman",serif;';

    const content = document.createElement('div');
    content.innerHTML = `
      <div style="font-size:13px;line-height:1.65;color:#eee9df;">
        <div style="margin-bottom:14px;">
          <span style="color:#f2c989;font-weight:700;font-family:Georgia,&quot;Times New Roman&quot;,serif;font-size:17px;letter-spacing:0.5px;">Punkte-Quellen</span>
        </div>
        <div style="margin-left:12px;margin-bottom:12px;padding:12px 14px;min-height:74px;background:rgba(18,24,32,0.42);border:1px solid rgba(212,174,116,0.38);border-radius:8px;">
          • <span style="color:#f0d9af;">Kills:</span> 10 Punkte pro Gegner<br>
          • <span style="color:#f0d9af;">Leak-freie Wellen:</span> 50 Punkte pro Welle (wenn keine durchkommen)<br>
          • <span style="color:#f0d9af;">Level geschafft:</span> 500 Base + 20 pro verbliebenem Leben<br>
          • <span style="color:#f0d9af;">Endgold:</span> 1 Punkt pro Gold in der Kasse
        </div>

        <div style="margin-bottom:14px;margin-top:16px;">
          <span style="color:#f2c989;font-weight:700;font-family:Georgia,&quot;Times New Roman&quot;,serif;font-size:17px;letter-spacing:0.5px;">Perfection Bonus - die grosse Belohnung</span>
        </div>
        <div style="margin-left:12px;margin-bottom:12px;padding:12px 14px;min-height:74px;background:rgba(18,24,32,0.42);border:1px solid rgba(212,174,116,0.38);border-radius:8px;">
          Wenn du <span style="color:#fbbf24;font-weight:bold;">keinen Turm verkauft hast</span> (Perfect Play):<br>
          <span style="color:#fbbf24;font-weight:bold;">Finale Score × 1.5</span>
        </div>

        <div style="margin-top:16px;margin-left:12px;padding:12px 14px;min-height:74px;background:rgba(18,24,32,0.42);border:1px solid rgba(212,174,116,0.38);border-radius:8px;font-size:13px;color:#eee9df;">
          <span style="font-weight:bold;">Strategie-Tipp:</span> Planen ist alles. Gib keinen Turm her fuer +50% Bonus.
        </div>
      </div>
    `;

    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Schließen';
    closeBtn.style.cssText = 'background:linear-gradient(180deg,#6d4a2b,#4d3520);color:#fff1d5;border:2px solid #d4ae74;border-radius:8px;padding:10px 18px;margin-top:18px;cursor:pointer;font-family:Courier,monospace;font-weight:bold;display:block;margin-left:auto;margin-right:auto;letter-spacing:0.4px;';

    closeBtn.addEventListener('click', () => {
      document.body.removeChild(overlay);
    });

    closeBtn.addEventListener('mouseover', () => {
      closeBtn.style.background = 'linear-gradient(180deg,#7d5731,#5a3f25)';
      closeBtn.style.borderColor = '#f5d9a7';
    });

    closeBtn.addEventListener('mouseout', () => {
      closeBtn.style.background = 'linear-gradient(180deg,#6d4a2b,#4d3520)';
      closeBtn.style.borderColor = '#d4ae74';
    });

    box.appendChild(title);
    box.appendChild(content);
    box.appendChild(closeBtn);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
  }

  startGame(debugMode = false) {
    this.scene.start('GameScene', { debugMode });
  }
}

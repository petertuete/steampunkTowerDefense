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
      '1-4 - Turm direkt auswaehlen (je nach freigeschaltetem Slot)',
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

    // Info Button (?) - oben rechts
    const infoBtn = this.add.text(width - 30, 30, '[ ? ]', {
      fontSize: '16px',
      fill: '#7dd3fc',
      fontFamily: 'Courier',
      fontStyle: 'bold',
      backgroundColor: '#0c3d54',
      padding: { x: 8, y: 4 }
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    infoBtn.on('pointerdown', () => this.showScoringInfo());
    infoBtn.on('pointerover', () => infoBtn.setStyle({ fill: '#fef08a', backgroundColor: '#1e5a6b' }));
    infoBtn.on('pointerout', () => infoBtn.setStyle({ fill: '#7dd3fc', backgroundColor: '#0c3d54' }));

    // Hinweis unten
    this.add.text(width / 2, height - 20, 'Leertaste/Button = normal | D = Debug-Start', {
      fontSize: '12px',
      fill: '#cbd5e1',
      fontFamily: 'Courier'
    }).setOrigin(0.5).setShadow(0, 1, '#000000', 5, true, true);
  }

  showScoringInfo() {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.75);display:flex;align-items:center;justify-content:center;z-index:9999;';

    const box = document.createElement('div');
    box.style.cssText = 'background:#1a2332;border:2px solid #4488ff;border-radius:8px;padding:24px;max-width:600px;max-height:80vh;overflow-y:auto;font-family:Courier,monospace;';

    const title = document.createElement('div');
    title.textContent = 'SCORING-SYSTEM';
    title.style.cssText = 'color:#ffd166;font-size:20px;font-weight:bold;margin-bottom:16px;text-align:center;';

    const content = document.createElement('div');
    content.innerHTML = `
      <div style="color:#d1fae5;font-size:13px;line-height:1.6;color:#dde6ff;">
        <div style="margin-bottom:14px;">
          <span style="color:#7dd3fc;font-weight:bold;">Basis-Score pro Level:</span>
        </div>
        <div style="margin-left:12px;margin-bottom:12px;">
          • <span style="color:#a7f3d0;">Kills:</span> 10 Punkte pro Kill<br>
          • <span style="color:#a7f3d0;">Leak-freie Wellen:</span> 50 Punkte pro Welle ohne Leak<br>
          • <span style="color:#a7f3d0;">Level erfolgreich:</span> 500 + 20 Punkte je Leben<br>
          • <span style="color:#a7f3d0;">Endgold:</span> 1 Punkt pro Gold
        </div>

        <div style="margin-bottom:14px;margin-top:16px;">
          <span style="color:#7dd3fc;font-weight:bold;">Perfection Bonus:</span>
        </div>
        <div style="margin-left:12px;margin-bottom:12px;padding:10px;background:rgba(100,200,100,0.1);border-left:2px solid #86efac;">
          Wenn du <span style="color:#fbbf24;font-weight:bold;">kein Turm verkauft</span> hast:<br>
          <span style="color:#fbbf24;font-weight:bold;">Finale Score × 1.5</span>
        </div>

        <div style="margin-bottom:14px;margin-top:16px;">
          <span style="color:#7dd3fc;font-weight:bold;">Beispiel:</span>
        </div>
        <div style="margin-left:12px;padding:10px;background:rgba(68,136,255,0.1);border-left:2px solid #60a5fa;font-size:12px;">
          100 Kills (1000) + 10 leak-freie Wellen (500) +<br>
          12 Leben (740) + 150 Gold = <span style="color:#86efac;">2390 Basis</span><br>
          <br>
          <span style="color:#fbbf24;">✓ Kein Verkauf:</span> 2390 × 1.5 = <span style="color:#86efac;font-weight:bold;">3585 Punkte</span><br>
          <span style="color:#f87171;">✗ Mit Verkauf:</span> 2390 × 1.0 = <span style="color:#86efac;">2390 Punkte</span>
        </div>

        <div style="margin-top:16px;padding:10px;background:rgba(200,100,100,0.1);border-left:2px solid #fca5a5;font-size:12px;color:#fecaca;">
          💡 <span style="font-weight:bold;">Hinweis:</span> Plane deine Türme sorgfältig! Perfekt geplant ohne Verkauf: 50% Bonus-Punkte.
        </div>
      </div>
    `;

    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Schließen';
    closeBtn.style.cssText = 'background:#064e3b;color:#d1fae5;border:1px solid #10b981;border-radius:4px;padding:10px 16px;margin-top:16px;cursor:pointer;font-family:Courier,monospace;font-weight:bold;display:block;margin-left:auto;margin-right:auto;';

    closeBtn.addEventListener('click', () => {
      document.body.removeChild(overlay);
    });

    closeBtn.addEventListener('mouseover', () => {
      closeBtn.style.background = '#065f46';
      closeBtn.style.borderColor = '#34d399';
    });

    closeBtn.addEventListener('mouseout', () => {
      closeBtn.style.background = '#064e3b';
      closeBtn.style.borderColor = '#10b981';
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

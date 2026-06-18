import { COLORS } from '../utils/Constants.js';
import { gameManager } from '../managers/GameManager.js';
import { networkManager } from '../managers/NetworkManager.js';
import { SERVER_URL } from '../config/networkConfig.js';

export class MatchmakingScene extends Phaser.Scene {
  constructor() {
    super('MatchmakingScene');
  }

  create() {
    this.add.rectangle(640, 360, 1280, 720, COLORS.BACKGROUND);

    this.state = 'menu';
    this.roomCode = null;
    this.codeInput = '';

    this.title = this.add.text(640, 100, 'MULTIPLAYER PvP 1x1', {
      fontFamily: 'Arial',
      fontSize: '40px',
      color: '#00ffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // ----- Tracker de status do servidor -----
    this.createServerStatusIndicator();

    this.createButton = this.add.text(640, 320, 'CRIAR SALA', {
      fontFamily: 'Arial',
      fontSize: '32px',
      color: '#ffffff',
      backgroundColor: '#111827',
      padding: { x: 24, y: 12 }
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    this.createButton.on('pointerover', () => {
      this.createButton.setStyle({ color: '#00ffff' });
    });

    this.createButton.on('pointerout', () => {
      this.createButton.setStyle({ color: '#ffffff' });
    });

    this.createButton.on('pointerdown', () => {
      this.createRoom();
    });

    this.joinButton = this.add.text(640, 420, 'ENTRAR SALA', {
      fontFamily: 'Arial',
      fontSize: '32px',
      color: '#ffffff',
      backgroundColor: '#111827',
      padding: { x: 24, y: 12 }
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    this.joinButton.on('pointerover', () => {
      this.joinButton.setStyle({ color: '#00ffff' });
    });

    this.joinButton.on('pointerout', () => {
      this.joinButton.setStyle({ color: '#ffffff' });
    });

    this.joinButton.on('pointerdown', () => {
      this.showJoinInput();
    });

    this.backButton = this.add.text(640, 600, 'VOLTAR', {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#888888',
      backgroundColor: '#111827',
      padding: { x: 16, y: 8 }
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    this.backButton.on('pointerdown', () => {
      this.scene.start('MenuScene');
    });

    this.statusText = this.add.text(640, 500, '', {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#00ff00'
    }).setOrigin(0.5);

    this.input.keyboard.on('keydown-ESC', () => {
      this.scene.start('MenuScene');
    });

    // Para o polling de status quando a cena for encerrada.
    this.events.once('shutdown', () => this.stopServerStatusPolling());
    this.events.once('destroy', () => this.stopServerStatusPolling());

    networkManager.on('room:created', (data) => {
      this.roomCode = data.code;
      this.showCreatedRoom();
    });

    networkManager.on('room:joined', () => {
      gameManager.setMultiplayer(true);
      // não inicia GameScene ainda
    });

    networkManager.on('room:joinFailed', (data) => {
      this.statusText.setText(`Erro: ${data.reason}`);
    });

    networkManager.on('game:start', (data) => {
      const currentData = gameManager.getMultiplayerData() || {};
      const selfId = networkManager.getSocketId();
      gameManager.setMultiplayerData({
        ...currentData,
        ...data,
        selfId,
        // Âncora de tempo real (wall clock) do MOMENTO em que recebemos
        // game:start. A contagem é calculada a partir daqui usando Date.now(),
        // por isso ela não "congela" se a janela perder o foco.
        countdownStart: Date.now(),
        countdownMs: data.countdown || 3000
      });
      this.scene.start('GameScene');
    });
  }

  /* ------------------------------------------------------------
   *  Tracker de status do servidor (health-check)
   * ---------------------------------------------------------- */
  createServerStatusIndicator() {
    // Ponto colorido + texto, no topo da tela.
    this.statusDot = this.add.circle(478, 160, 8, 0xffcc00).setOrigin(0.5);

    this.serverStatusText = this.add.text(496, 160, 'Verificando servidor...', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#cccccc'
    }).setOrigin(0, 0.5);

    // Mensagem auxiliar (aparece quando o servidor está acordando/offline).
    this.serverHintText = this.add.text(640, 185, '', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#888888'
    }).setOrigin(0.5);

    this.serverOnline = false;

    // Primeira checagem imediata e depois polling periódico.
    this.checkServerStatus();
    this.statusPoll = setInterval(() => this.checkServerStatus(), 4000);
  }

  setServerStatus(state) {
    // state: 'checking' | 'online' | 'offline'
    if (!this.statusDot || !this.serverStatusText) return;

    if (state === 'online') {
      this.serverOnline = true;
      this.statusDot.setFillStyle(0x00ff66);
      this.serverStatusText.setText('Servidor online').setColor('#00ff66');
      this.serverHintText.setText('');
    } else if (state === 'checking') {
      this.statusDot.setFillStyle(0xffcc00);
      this.serverStatusText.setText('Verificando servidor...').setColor('#cccccc');
    } else {
      this.serverOnline = false;
      this.statusDot.setFillStyle(0xff3355);
      this.serverStatusText.setText('Servidor offline').setColor('#ff3355');
      this.serverHintText.setText(
        'O servidor pode estar hibernando. Aguarde ~30-60s que ele acorda...'
      );
    }
  }

  async checkServerStatus() {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(`${SERVER_URL}/health`, {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (res.ok) {
        this.setServerStatus('online');
      } else {
        this.setServerStatus('offline');
      }
    } catch (err) {
      // Falha de rede / timeout / servidor hibernando
      this.setServerStatus('offline');
    }
  }

  stopServerStatusPolling() {
    if (this.statusPoll) {
      clearInterval(this.statusPoll);
      this.statusPoll = null;
    }
  }

  createRoom() {
    this.createButton.setActive(false);
    this.joinButton.setActive(false);
    this.statusText.setText('Criando sala...');
    gameManager.setMultiplayerData({ role: 'host' });
    networkManager.send('room:create', {});
  }

  showCreatedRoom() {
    this.title.setText(`CÓDIGO DA SALA`);
    this.createButton.destroy();
    this.joinButton.destroy();
    this.statusText.destroy();

    this.codeText = this.add.text(640, 300, this.roomCode, {
      fontFamily: 'Arial',
      fontSize: '72px',
      color: '#00ff00',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.copyText = this.add.text(640, 420, 'Compartilhe este código com seu oponente', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#888888'
    }).setOrigin(0.5);

    this.waitText = this.add.text(640, 500, 'Aguardando oponente...', {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#00ffff'
    }).setOrigin(0.5);

    this.backButton.setPosition(640, 600);
  }

  showJoinInput() {
    this.createButton.destroy();
    this.joinButton.destroy();

    this.codeInput = '';

    gameManager.setMultiplayerData({ role: 'guest' });
    
    this.inputText = this.add.text(640, 320, 'INSIRA O CÓDIGO:', {
      fontFamily: 'Arial',
      fontSize: '28px',
      color: '#ffffff'
    }).setOrigin(0.5);

    const inputConfig = {
      maxLength: 4,
      width: 300,
      height: 60,
      backgroundColor: '#111827',
      color: '#00ffff',
      fontSize: '48px'
    };

    this.input.keyboard.on('keydown', (event) => {
      if (event.key === 'Enter') {
        const code = this.codeInput;
        if (code && code.length === 4) {
          networkManager.send('room:join', { code });
          this.statusText.setText('Entrando na sala...');
        }
      } else if (event.key === 'Backspace') {
        this.codeInput = this.codeInput.slice(0, -1);
      } else if (/^[0-9]$/.test(event.key) && this.codeInput.length < 4) {
        this.codeInput += event.key;
      }
      this.updateCodeDisplay();
    });

    this.updateCodeDisplay();
  }

  updateCodeDisplay() {
    if (this.codeDisplay) this.codeDisplay.destroy();
    this.codeDisplay = this.add.text(640, 420, this.codeInput || '_____', {
      fontFamily: 'Arial',
      fontSize: '56px',
      color: '#00ff00',
      fontStyle: 'bold'
    }).setOrigin(0.5);
  }
}
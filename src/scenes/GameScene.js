import {
    GRID_COLS,
    GRID_ROWS,
    GRID_SIZE,
    ARENA_OFFSET_X,
    ARENA_OFFSET_Y,
    COLORS,
    DIFFICULTY,
    DEGUB,
    DIRECTIONS
} from '../utils/Constants.js';

import { gameManager } from '../managers/GameManager.js';

import { GridSystem } from '../systems/GridSystem.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';
import { ArenaSystem } from '../systems/ArenaSystem.js';
import { PowerUpSystem } from '../systems/PowerUpSystem.js';

import { Player } from '../entities/Player.js';
import { Bot } from '../entities/Bot.js';
import { RemotePlayer } from '../entities/RemotePlayer.js';

import { audioManager } from '../managers/AudioManager.js';
import { networkManager } from '../managers/NetworkManager.js';

export class GameScene extends Phaser.Scene {

    constructor() {
        super('GameScene');
    }

    create() {

        this.gameEnded = false;
        this.matchElapsedTime = 0;

        this.isMultiplayer = gameManager.getMultiplayer();

        this.gridSystem = new GridSystem(
            GRID_COLS,
            GRID_ROWS
        );

        this.arenaSystem = new ArenaSystem(this);

        // PowerUp só existe no singleplayer (servidor não simula powerup)
        this.powerUpSystem = this.isMultiplayer
            ? null
            : new PowerUpSystem(this, this.gridSystem, this.arenaSystem);

        this.drawArena();
        this.createEntities();
        this.createHUD();

        if (this.isMultiplayer) {
            this.setupMultiplayerListeners();
        }

        audioManager.playMusic('match');

        if (!this.isMultiplayer) {
            networkManager.send('match:start', {
                difficulty: gameManager.getDifficulty()
            });
        }

        // Input local: no modo online, capturamos direção para enviar ao servidor
        this.setupOnlineInput();

        this.input.keyboard.on('keydown-ESC', () => {
            this.scene.start('MenuScene');
        });

        this.events.on('shutdown', () => {
            this.cleanupMultiplayerListeners?.();
        });

        this.events.on('sleep', () => {
            this.cleanupMultiplayerListeners?.();
        });
    }

    createEntities() {
        const mpData = gameManager.getMultiplayerData();

        const difficulty = gameManager.getDifficulty() || DIFFICULTY.FACIL;
        const botColor = this.getBotColor(difficulty);

        this.remotePlayer = null;     // oponente (modo online)
        this.localRenderPlayer = null; // nosso próprio boneco renderizado pelo servidor
        this.bots = [];
        this.player = null;           // Player simulado (apenas singleplayer)
        this.powerUpSprite = null;    // sprite do power-up (apenas modo online)

        if (this.isMultiplayer && mpData) {
            const isHost = mpData.role === 'host';

            // Cores/posições devem espelhar o servidor (host inferior-esq, guest superior-dir)
            const localColor = isHost ? COLORS.PLAYER : COLORS.HARD;
            const remoteColor = isHost ? COLORS.HARD : COLORS.PLAYER;

            const localStart = isHost
                ? { x: 1, y: GRID_ROWS - 2 }
                : { x: GRID_COLS - 2, y: 1 };
            const remoteStart = isHost
                ? { x: GRID_COLS - 2, y: 1 }
                : { x: 1, y: GRID_ROWS - 2 };

            const localDir = isHost ? DIRECTIONS.RIGHT : DIRECTIONS.LEFT;

            // Nosso boneco: renderizado a partir do estado do servidor
            this.localRenderPlayer = new RemotePlayer(
                this, this.gridSystem,
                localStart.x, localStart.y, localColor
            );
            this.localRenderPlayer.direction = localDir;
            this.localDirection = localDir;
            this.pendingDirection = localDir;

            // Oponente
            this.remotePlayer = new RemotePlayer(
                this, this.gridSystem,
                remoteStart.x, remoteStart.y, remoteColor
            );

            return;
        }

        // ---------- Singleplayer (inalterado) ----------
        this.player = new Player(
            this, this.gridSystem, 1, GRID_ROWS - 2, COLORS.PLAYER
        );

        this.bots.push(new Bot(
            this, this.gridSystem, GRID_COLS - 2, 1, botColor, difficulty, this.player
        ));
        this.bots.push(new Bot(
            this, this.gridSystem, GRID_COLS - 2, GRID_ROWS - 2, botColor, difficulty, this.player
        ));
        this.bots.push(new Bot(
            this, this.gridSystem, Math.floor(GRID_COLS / 2), 1, botColor, difficulty, this.player
        ));
    }

    getBotColor(difficulty) {
        switch (difficulty) {
            case DIFFICULTY.MEDIO:
                return COLORS.MEDIUM;
            case DIFFICULTY.DIFICIL:
                return COLORS.HARD;
            case DIFFICULTY.FACIL:
            default:
                return COLORS.EASY;
        }
    }

    drawArena() {
        const graphics = this.add.graphics();
        graphics.lineStyle(1, COLORS.GRID, 0.9);

        for (let x = 0; x <= GRID_COLS; x++) {
            graphics.moveTo(ARENA_OFFSET_X + (x * GRID_SIZE), ARENA_OFFSET_Y);
            graphics.lineTo(
                ARENA_OFFSET_X + (x * GRID_SIZE),
                ARENA_OFFSET_Y + (GRID_ROWS * GRID_SIZE)
            );
        }

        for (let y = 0; y <= GRID_ROWS; y++) {
            graphics.moveTo(ARENA_OFFSET_X, ARENA_OFFSET_Y + (y * GRID_SIZE));
            graphics.lineTo(
                ARENA_OFFSET_X + (GRID_COLS * GRID_SIZE),
                ARENA_OFFSET_Y + (y * GRID_SIZE)
            );
        }

        graphics.strokePath();
    }

    createHUD() {
        if (!DEGUB) {
            return;
        }
        this.hudText = this.add.text(40, 40, '', {
            fontSize: '24px',
            color: '#ffffff'
        });
    }

    updateHUD(elapsedTime) {
        if (!DEGUB || !this.hudText) {
            return;
        }

        if (this.isMultiplayer) {
            const meAlive = this.localRenderPlayer?.alive ? 'vivo' : 'morto';
            const oppAlive = this.remotePlayer?.alive ? 'vivo' : 'morto';
            this.hudText.setText([
                `[ONLINE] Voce: ${meAlive}`,
                `Oponente: ${oppAlive}`,
                `ESC - Menu`
            ]);
            return;
        }

        const aliveBots = this.bots.filter(bot => bot.alive).length;
        const remaining = this.arenaSystem.getRemainingTime(elapsedTime);

        this.hudText.setText([
            `Bots vivos: ${aliveBots}`,
            `Proximo fechamento: ${remaining}s`,
            `ESC - Menu`
        ]);
    }

    /* ------------------------------------------------------------
     *  UPDATE
     * ---------------------------------------------------------- */
    update(time, delta) {
        if (this.gameEnded) {
            return;
        }

        if (this.isMultiplayer) {
            // No modo online não simulamos: apenas lemos input e enviamos.
            this.handleOnlineInput();
            this.updateHUD(this.matchElapsedTime);
            return;
        }

        // ---------- Singleplayer (inalterado) ----------
        this.matchElapsedTime += delta;
        this.arenaSystem.update(this.matchElapsedTime);
        this.player.update(time);

        for (const bot of this.bots) {
            bot.update(time);
        }

        this.powerUpSystem.update(
            this.matchElapsedTime,
            [this.player, ...this.bots]
        );

        this.checkCollisions();
        this.checkArenaDeaths();
        this.checkVictory();
        this.updateHUD(this.matchElapsedTime);
    }

    /* ------------------------------------------------------------
     *  Singleplayer: colisões e vitória (inalterado)
     * ---------------------------------------------------------- */
    checkCollisions() {
        this.checkEntityCollision(this.player);
        for (const bot of this.bots) {
            this.checkEntityCollision(bot);
        }
    }

    checkEntityCollision(entity) {
        if (!entity.alive) {
            return;
        }

        const collision = CollisionSystem.checkCollision(
            this.gridSystem, entity.gridX, entity.gridY
        );

        if (collision || !this.gridSystem.isInside(entity.gridX, entity.gridY)) {
            entity.die();
            audioManager.playSFX('entity-death');
        }
    }

    checkArenaDeaths() {
        const entities = [this.player, ...this.bots];

        for (const entity of entities) {
            if (!entity.alive) {
                continue;
            }

            const inside = this.arenaSystem.isInsideActiveArena(
                entity.gridX, entity.gridY
            );

            if (!inside) {
                entity.die();
                audioManager.playSFX('arena-death');
            }
        }
    }

    checkVictory() {
        if (!this.player.alive) {
            this.finishGame(false);
            return;
        }

        const aliveBots = this.bots.filter(bot => bot.alive);
        if (aliveBots.length === 0) {
            this.finishGame(true);
        }
    }

    /* ------------------------------------------------------------
     *  Online: input -> envio de direção ao servidor
     * ---------------------------------------------------------- */
    setupOnlineInput() {
        if (!this.isMultiplayer) {
            return;
        }
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });
    }

    handleOnlineInput() {
        if (!this.cursors) return;

        const current = this.localDirection || DIRECTIONS.RIGHT;
        let desired = null;

        if (this.cursors.left.isDown || this.wasd.left.isDown) {
            if (current !== DIRECTIONS.RIGHT) desired = DIRECTIONS.LEFT;
        } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
            if (current !== DIRECTIONS.LEFT) desired = DIRECTIONS.RIGHT;
        } else if (this.cursors.up.isDown || this.wasd.up.isDown) {
            if (current !== DIRECTIONS.DOWN) desired = DIRECTIONS.UP;
        } else if (this.cursors.down.isDown || this.wasd.down.isDown) {
            if (current !== DIRECTIONS.UP) desired = DIRECTIONS.DOWN;
        }

        if (desired && desired !== this.pendingDirection) {
            this.pendingDirection = desired;
            networkManager.send('player:input', { direction: desired });
        }
    }

    /* ------------------------------------------------------------
     *  Online: listeners do servidor autoritativo
     * ---------------------------------------------------------- */
    setupMultiplayerListeners() {
        const mpData = gameManager.getMultiplayerData() || {};

        this.stateUpdateHandler = (snapshot) => {
            if (this.gameEnded || !snapshot) return;
            this.applyServerSnapshot(snapshot);
        };

        this.matchOverHandler = (data) => {
            if (this.gameEnded) return;
            const myId = mpData.selfId;
            const playerWon = data && data.winnerId && data.winnerId === myId;
            this.finishGame(Boolean(playerWon));
        };

        this.opponentDisconnectHandler = () => {
            if (!this.gameEnded) {
                this.finishGame(true);
            }
        };

        this.powerUpCollectedHandler = () => {
            audioManager.playSFX('powerup-speed');
        };

        networkManager.on('state:update', this.stateUpdateHandler);
        networkManager.on('match:over', this.matchOverHandler);
        networkManager.on('opponent:disconnected', this.opponentDisconnectHandler);
        networkManager.on('powerup:collected', this.powerUpCollectedHandler);
    }

    applyServerSnapshot(snapshot) {
        this.matchElapsedTime = snapshot.elapsed || this.matchElapsedTime;

        // Atualiza a arena visual a partir do estado autoritativo
        if (snapshot.arena) {
            this.arenaSystem.applyServerState(snapshot.arena);
        }

        // Renderiza o power-up vindo do servidor
        this.renderPowerUp(snapshot.powerUp);

        const mpData = gameManager.getMultiplayerData() || {};
        const myId = mpData.selfId;

        for (const ps of snapshot.players) {
            const isSelf = myId ? ps.id === myId : ps.role === mpData.role;

            if (isSelf) {
                this.localDirection = ps.direction || this.localDirection;
                this.localRenderPlayer?.applyState(ps);
            } else {
                this.remotePlayer?.applyState(ps);
            }
        }
    }

    renderPowerUp(powerUp) {
        if (!powerUp) {
            // sem power-up no mapa: remove o sprite se existir
            if (this.powerUpSprite) {
                this.powerUpSprite.destroy();
                this.powerUpSprite = null;
            }
            return;
        }

        const px = ARENA_OFFSET_X + (powerUp.x * GRID_SIZE) + GRID_SIZE / 2;
        const py = ARENA_OFFSET_Y + (powerUp.y * GRID_SIZE) + GRID_SIZE / 2;

        if (!this.powerUpSprite) {
            this.powerUpSprite = this.add.rectangle(
                px, py,
                GRID_SIZE - 6, GRID_SIZE - 6,
                COLORS.POWER_UP
            );
            this.powerUpSprite.setStrokeStyle(2, 0xffffff, 0.9);
        } else {
            this.powerUpSprite.setPosition(px, py);
        }
    }

    cleanupMultiplayerListeners() {
        if (this.stateUpdateHandler) {
            networkManager.off('state:update', this.stateUpdateHandler);
        }
        if (this.matchOverHandler) {
            networkManager.off('match:over', this.matchOverHandler);
        }
        if (this.opponentDisconnectHandler) {
            networkManager.off('opponent:disconnected', this.opponentDisconnectHandler);
        }
        if (this.powerUpCollectedHandler) {
            networkManager.off('powerup:collected', this.powerUpCollectedHandler);
        }
    }

    finishGame(playerWon) {
        if (this.gameEnded) {
            return;
        }
        this.gameEnded = true;

        gameManager.setWinner(playerWon);
        audioManager.stopMusic();
        audioManager.playSFX(playerWon ? 'victory' : 'defeat');

        if (!this.isMultiplayer) {
            networkManager.send('match:end', { playerWon });
        }

        this.time.delayedCall(1000, () => {
            this.scene.start('GameOverScene');
        });
    }
}

import {
    GRID_COLS,
    GRID_ROWS,
    GRID_SIZE,
    ARENA_OFFSET_X,
    ARENA_OFFSET_Y,
    COLORS
} from '../utils/Constants.js';

import { gameManager } from '../managers/GameManager.js';

import { GridSystem } from '../systems/GridSystem.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';
import { ArenaSystem } from '../systems/ArenaSystem.js';
import { PowerUpSystem } from '../systems/PowerUpSystem.js';

import { Player } from '../entities/Player.js';
import { Bot } from '../entities/Bot.js';

import { audioManager } from '../managers/AudioManager.js';
import { networkManager } from '../managers/NetworkManager.js';

export class GameScene extends Phaser.Scene {

    constructor() {
        super('GameScene');
    }

    create() {

        this.cameras.main.fadeIn(300);

        this.gameEnded = false;

        this.matchStartTime = this.time.now;

        this.gridSystem = new GridSystem(
            GRID_COLS,
            GRID_ROWS
        );

        this.arenaSystem =
            new ArenaSystem(this);

        this.powerUpSystem =
            new PowerUpSystem(
                this,
                this.gridSystem,
                this.arenaSystem
            );

        this.drawArena();

        this.createEntities();

        this.createHUD();

        audioManager.playMusic('match');
        networkManager.send('match:start', {
            difficulty: gameManager.getDifficulty()
        });

        this.input.keyboard.on(
            'keydown-ESC',
            () => {
                this.scene.start('MenuScene');
            }
        );
    }

    createEntities() {

        this.player = new Player(
            this,
            this.gridSystem,
            1,
            GRID_ROWS - 2,
            COLORS.PLAYER
        );

        this.bots = [];

        this.bots.push(
            new Bot(
                this,
                this.gridSystem,
                GRID_COLS - 2,
                1,
                COLORS.EASY,
                'FACIL',
                this.player
            )
        );

        this.bots.push(
            new Bot(
                this,
                this.gridSystem,
                GRID_COLS - 2,
                GRID_ROWS - 2,
                COLORS.MEDIUM,
                'MEDIO',
                this.player
            )
        );

        this.bots.push(
            new Bot(
                this,
                this.gridSystem,
                Math.floor(GRID_COLS / 2),
                1,
                COLORS.HARD,
                'DIFICIL',
                this.player
            )
        );
    }

    drawArena() {

        const background = this.add.graphics();

        background.fillStyle(0x07101c, 1);
        background.fillRect(
            ARENA_OFFSET_X - 18,
            ARENA_OFFSET_Y - 18,
            (GRID_COLS * GRID_SIZE) + 36,
            (GRID_ROWS * GRID_SIZE) + 36
        );

        background.lineStyle(3, COLORS.PLAYER, 0.4);
        background.strokeRect(
            ARENA_OFFSET_X - 2,
            ARENA_OFFSET_Y - 2,
            GRID_COLS * GRID_SIZE + 4,
            GRID_ROWS * GRID_SIZE + 4
        );

        const graphics = this.add.graphics();

        graphics.lineStyle(
            1,
            COLORS.GRID,
            0.9
        );

        for (let x = 0; x <= GRID_COLS; x++) {

            graphics.moveTo(
                ARENA_OFFSET_X + (x * GRID_SIZE),
                ARENA_OFFSET_Y
            );

            graphics.lineTo(
                ARENA_OFFSET_X + (x * GRID_SIZE),
                ARENA_OFFSET_Y +
                (GRID_ROWS * GRID_SIZE)
            );
        }

        for (let y = 0; y <= GRID_ROWS; y++) {

            graphics.moveTo(
                ARENA_OFFSET_X,
                ARENA_OFFSET_Y +
                (y * GRID_SIZE)
            );

            graphics.lineTo(
                ARENA_OFFSET_X +
                (GRID_COLS * GRID_SIZE),

                ARENA_OFFSET_Y +
                (y * GRID_SIZE)
            );
        }

        graphics.strokePath();

        const glow = this.add.graphics();

        glow.lineStyle(8, COLORS.PLAYER, 0.08);
        glow.strokeRect(
            ARENA_OFFSET_X - 5,
            ARENA_OFFSET_Y - 5,
            GRID_COLS * GRID_SIZE + 10,
            GRID_ROWS * GRID_SIZE + 10
        );
    }

    createHUD() {

        this.hudText = this.add.text(
            40,
            40,
            '',
            {
                fontSize: '24px',
                color: '#ffffff'
            }
        );
    }

    updateHUD(elapsedTime) {

        const aliveBots =
            this.bots.filter(
                bot => bot.alive
            ).length;

        const remaining =
            this.arenaSystem.getRemainingTime(
                elapsedTime
            );

        this.hudText.setText([
            `Bots vivos: ${aliveBots}`,
            `Próximo fechamento: ${remaining}s`,
            `ESC - Menu`
        ]);
    }

    update(time) {

        if (this.gameEnded) {
            return;
        }

        const elapsedTime =
            time - this.matchStartTime;

        this.arenaSystem.update(
            elapsedTime
        );

        this.player.update(time);

        for (const bot of this.bots) {
            bot.update(time);
        }

        this.powerUpSystem.update(
            time,
            [
                this.player,
                ...this.bots
            ]
        );

        this.checkCollisions();

        this.checkArenaDeaths();

        this.checkVictory();

        this.updateHUD(elapsedTime);
    }

    checkCollisions() {

        this.checkEntityCollision(
            this.player
        );

        for (const bot of this.bots) {

            this.checkEntityCollision(bot);
        }
    }

    checkEntityCollision(entity) {

        if (!entity.alive) {
            return;
        }

        const collision =
            CollisionSystem.checkCollision(
                this.gridSystem,
                entity.gridX,
                entity.gridY
            );

        if (
            collision ||
            !this.gridSystem.isInside(
                entity.gridX,
                entity.gridY
            )
        ) {

            entity.die();
            audioManager.playSFX('entity-death');
        }
    }

    checkArenaDeaths() {

        const entities = [
            this.player,
            ...this.bots
        ];

        for (const entity of entities) {

            if (!entity.alive) {
                continue;
            }

            const inside =
                this.arenaSystem
                    .isInsideActiveArena(
                        entity.gridX,
                        entity.gridY
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

        const aliveBots =
            this.bots.filter(
                bot => bot.alive
            );

        if (aliveBots.length === 0) {

            this.finishGame(true);
        }
    }

    finishGame(playerWon) {

        if (this.gameEnded) {
            return;
        }

        this.gameEnded = true;

        gameManager.setWinner(playerWon);
        audioManager.stopMusic();
        audioManager.playSFX(
            playerWon ? 'victory' : 'defeat'
        );
        networkManager.send('match:end', {
            playerWon
        });

        this.time.delayedCall(
            1000,
            () => {

                this.scene.start(
                    'GameOverScene'
                );
            }
        );
    }
}

import {
    GRID_SIZE,
    ARENA_OFFSET_X,
    ARENA_OFFSET_Y,
    DIRECTIONS,
    MOVE_DELAY
} from '../utils/Constants.js';

import { Trail } from './Trail.js';

export class Player {

    constructor(scene, gridSystem, x, y, color) {

        this.scene = scene;

        this.gridSystem = gridSystem;

        this.gridX = x;
        this.gridY = y;

        this.direction = DIRECTIONS.RIGHT;
        this.nextDirection = DIRECTIONS.RIGHT;

        this.moveTimer = 0;
        this.moveDelay = MOVE_DELAY;
        this.speedBoostTimer = null;

        this.alive = true;

        this.color = color;

        this.trails = [];

        this.glow = scene.add.rectangle(
            0,
            0,
            GRID_SIZE,
            GRID_SIZE,
            color,
            0.26
        );

        this.rectangle = scene.add.rectangle(
            0,
            0,
            GRID_SIZE - 6,
            GRID_SIZE - 6,
            color
        );
        this.rectangle.setStrokeStyle(2, 0xffffff, 0.85);

        this.updatePosition();

        this.setupInput();
    }

    setupInput() {

        this.cursors =
            this.scene.input.keyboard.createCursorKeys();

        this.wasd = this.scene.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });
    }

    update(time) {

        if (!this.alive) {
            return;
        }

        this.handleInput();

        if (time >= this.moveTimer) {

            this.move();

            this.moveTimer = time + this.moveDelay;
        }
    }

    handleInput() {

        if (
            this.cursors.left.isDown ||
            this.wasd.left.isDown
        ) {

            if (this.direction !== DIRECTIONS.RIGHT) {
                this.nextDirection = DIRECTIONS.LEFT;
            }
        }

        else if (
            this.cursors.right.isDown ||
            this.wasd.right.isDown
        ) {

            if (this.direction !== DIRECTIONS.LEFT) {
                this.nextDirection = DIRECTIONS.RIGHT;
            }
        }

        else if (
            this.cursors.up.isDown ||
            this.wasd.up.isDown
        ) {

            if (this.direction !== DIRECTIONS.DOWN) {
                this.nextDirection = DIRECTIONS.UP;
            }
        }

        else if (
            this.cursors.down.isDown ||
            this.wasd.down.isDown
        ) {

            if (this.direction !== DIRECTIONS.UP) {
                this.nextDirection = DIRECTIONS.DOWN;
            }
        }
    }

    move() {

        this.direction = this.nextDirection;

        this.leaveTrail();

        this.gridX += this.direction.x;
        this.gridY += this.direction.y;

        this.updatePosition();
    }

    leaveTrail() {

        const trail = new Trail(
            this.scene,
            this.gridX,
            this.gridY,
            this.color
        );

        this.trails.push(trail);

        this.gridSystem.occupy(
            this.gridX,
            this.gridY,
            true
        );
    }

    updatePosition() {

        this.rectangle.x =
            ARENA_OFFSET_X +
            (this.gridX * GRID_SIZE) +
            GRID_SIZE / 2;

        this.rectangle.y =
            ARENA_OFFSET_Y +
            (this.gridY * GRID_SIZE) +
            GRID_SIZE / 2;

        this.glow.x = this.rectangle.x;
        this.glow.y = this.rectangle.y;
    }

    applySpeedBoost(multiplier, duration) {

        this.moveDelay =
            Math.max(
                40,
                Math.floor(MOVE_DELAY * multiplier)
            );

        this.rectangle.setScale(1.12);
        this.glow.setAlpha(0.48);

        if (this.speedBoostTimer) {
            this.speedBoostTimer.remove(false);
        }

        this.speedBoostTimer =
            this.scene.time.delayedCall(
                duration,
                () => {
                    this.moveDelay = MOVE_DELAY;
                    this.rectangle.setScale(1);
                    this.glow.setAlpha(0.26);
                    this.speedBoostTimer = null;
                }
            );
    }

    die() {

        this.alive = false;

        this.rectangle.setFillStyle(0xffffff);
        this.glow.setFillStyle(0xffffff, 0.2);
    }
}

import {
    GRID_SIZE,
    ARENA_OFFSET_X,
    ARENA_OFFSET_Y,
    MOVE_DELAY,
    DIFFICULTY
} from '../utils/Constants.js';

import { Trail } from './Trail.js';

import { EasyAI } from '../ai/EasyAI.js';
import { MediumAI } from '../ai/MediumAI.js';
import { HardAI } from '../ai/HardAI.js';

export class Bot {

    constructor(
        scene,
        gridSystem,
        x,
        y,
        color,
        difficulty,
        player
    ) {

        this.scene = scene;

        this.gridSystem = gridSystem;

        this.gridX = x;
        this.gridY = y;

        this.direction = { x: -1, y: 0 };

        this.moveTimer = 0;

        this.alive = true;

        this.color = color;

        this.difficulty = difficulty;

        this.player = player;

        this.trails = [];

        this.moveDelay = this.getDifficultyDelay();

        this.rectangle = scene.add.rectangle(
            0,
            0,
            GRID_SIZE - 4,
            GRID_SIZE - 4,
            color
        );

        this.updatePosition();
    }

    getDifficultyDelay() {

        switch (this.difficulty) {

            case DIFFICULTY.FACIL:
                return MOVE_DELAY + 60;

            case DIFFICULTY.MEDIO:
                return MOVE_DELAY;

            case DIFFICULTY.DIFICIL:
                return MOVE_DELAY - 25;

            default:
                return MOVE_DELAY;
        }
    }

    update(time) {

        if (!this.alive) {
            return;
        }

        if (time >= this.moveTimer) {

            this.chooseDirection();

            this.move();

            this.moveTimer =
                time + this.moveDelay;
        }
    }

    chooseDirection() {

        switch (this.difficulty) {

            case DIFFICULTY.FACIL:

                this.direction =
                    EasyAI.getDirection(
                        this,
                        this.gridSystem
                    );

                break;

            case DIFFICULTY.MEDIO:

                this.direction =
                    MediumAI.getDirection(
                        this,
                        this.gridSystem
                    );

                break;

            case DIFFICULTY.DIFICIL:

                this.direction =
                    HardAI.getDirection(
                        this,
                        this.gridSystem,
                        this.player
                    );

                break;
        }
    }

    move() {

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
    }

    die() {

        this.alive = false;

        this.rectangle.setFillStyle(0xffffff);
    }
}
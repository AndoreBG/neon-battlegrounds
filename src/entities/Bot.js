import {
    GRID_SIZE,
    ARENA_OFFSET_X,
    ARENA_OFFSET_Y,
    DIRECTIONS,
    MOVE_DELAY
} from '../utils/Constants.js';

import { Trail } from './Trail.js';

export class Bot {

    constructor(scene, gridSystem, x, y, color) {

        this.scene = scene;

        this.gridSystem = gridSystem;

        this.gridX = x;
        this.gridY = y;

        this.direction = DIRECTIONS.LEFT;

        this.moveTimer = 0;

        this.alive = true;

        this.color = color;

        this.trails = [];

        this.rectangle = scene.add.rectangle(
            0,
            0,
            GRID_SIZE - 4,
            GRID_SIZE - 4,
            color
        );

        this.updatePosition();
    }

    update(time) {

        if (!this.alive) {
            return;
        }

        if (time >= this.moveTimer) {

            this.chooseDirection();

            this.move();

            this.moveTimer = time + MOVE_DELAY;
        }
    }

    chooseDirection() {

        const possible = [];

        for (const dir of Object.values(DIRECTIONS)) {

            const nx = this.gridX + dir.x;
            const ny = this.gridY + dir.y;

            if (!this.gridSystem.isOccupied(nx, ny)) {

                possible.push(dir);
            }
        }

        if (possible.length > 0) {

            this.direction =
                Phaser.Utils.Array.GetRandom(possible);
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
import {
    GRID_COLS,
    GRID_ROWS,
    GRID_SIZE,
    ARENA_OFFSET_X,
    ARENA_OFFSET_Y,
    POWER_UP,
    COLORS
} from '../utils/Constants.js';

import { audioManager } from '../managers/AudioManager.js';

export class PowerUpSystem {

    constructor(scene, gridSystem, arenaSystem) {

        this.scene = scene;
        this.gridSystem = gridSystem;
        this.arenaSystem = arenaSystem;

        this.activePowerUp = null;
        this.nextSpawnTime =
            POWER_UP.SPAWN_DELAY;
    }

    update(elapsedTime, entities) {

        if (
            !this.activePowerUp &&
            elapsedTime >= this.nextSpawnTime
        ) {
            this.spawn(entities, elapsedTime);
        }

        if (!this.activePowerUp) {
            return;
        }

        for (const entity of entities) {

            if (!entity.alive) {
                continue;
            }

            if (
                entity.gridX === this.activePowerUp.gridX &&
                entity.gridY === this.activePowerUp.gridY
            ) {
                this.collect(entity, elapsedTime);
                break;
            }
        }
    }

    spawn(entities, elapsedTime) {

        const freeCells = [];

        for (let x = 0; x < GRID_COLS; x++) {

            for (let y = 0; y < GRID_ROWS; y++) {

                if (!this.canSpawnAt(x, y, entities)) {
                    continue;
                }

                freeCells.push({ x, y });
            }
        }

        if (freeCells.length === 0) {
            this.nextSpawnTime =
                elapsedTime + POWER_UP.RESPAWN_DELAY;
            return;
        }

        const cell =
            Phaser.Utils.Array.GetRandom(freeCells);

        this.activePowerUp = {
            gridX: cell.x,
            gridY: cell.y,
            core: this.createBlock(cell.x, cell.y, GRID_SIZE - 6)
        };

        this.activePowerUp.core.setStrokeStyle(
            2,
            0xffffff,
            0.9
        );
    }

    canSpawnAt(x, y, entities) {

        if (this.gridSystem.isOccupied(x, y)) {
            return false;
        }

        if (!this.arenaSystem.isInsideActiveArena(x, y)) {
            return false;
        }

        return !entities.some(entity => (
            entity.alive &&
            entity.gridX === x &&
            entity.gridY === y
        ));
    }

    createBlock(gridX, gridY, size) {

        return this.scene.add.rectangle(
            ARENA_OFFSET_X + (gridX * GRID_SIZE) + GRID_SIZE / 2,
            ARENA_OFFSET_Y + (gridY * GRID_SIZE) + GRID_SIZE / 2,
            size,
            size,
            COLORS.POWER_UP
        );
    }

    collect(entity, elapsedTime) {

        if (entity.applySpeedBoost) {
            entity.applySpeedBoost(
                POWER_UP.SPEED_MULTIPLIER,
                POWER_UP.DURATION
            );
        }

        audioManager.playSFX('powerup-speed');

        this.destroyActivePowerUp();

        this.nextSpawnTime =
            elapsedTime + POWER_UP.RESPAWN_DELAY;
    }

    destroyActivePowerUp() {

        if (!this.activePowerUp) {
            return;
        }

        this.activePowerUp.core.destroy();
        this.activePowerUp = null;
    }
}

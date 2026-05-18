import {
    GRID_SIZE,
    ARENA_OFFSET_X,
    ARENA_OFFSET_Y,
    MOVE_DELAY,
    DIFFICULTY,
    DIRECTIONS
} from '../utils/Constants.js';

import { Trail } from './Trail.js';

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

        this.baseMoveDelay = this.getDifficultyDelay();
        this.moveDelay = this.baseMoveDelay;
        this.speedBoostTimer = null;

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
                        this.gridSystem,
                        this.scene.arenaSystem
                    );

                break;

            case DIFFICULTY.DIFICIL:

                this.direction =
                    HardAI.getDirection(
                        this,
                        this.gridSystem,
                        this.player,
                        this.scene.arenaSystem
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

    applySpeedBoost(multiplier, duration) {

        this.moveDelay =
            Math.max(
                40,
                Math.floor(this.baseMoveDelay * multiplier)
            );

        if (this.speedBoostTimer) {
            this.speedBoostTimer.remove(false);
        }

        this.speedBoostTimer =
            this.scene.time.delayedCall(
                duration,
                () => {
                    this.moveDelay = this.baseMoveDelay;
                    this.speedBoostTimer = null;
                }
            );
    }

    die() {

        this.alive = false;

        this.rectangle.setFillStyle(0xffffff);
    }
}

class EasyAI {

    static getDirection(bot, gridSystem) {

        const possible = [];

        for (const dir of Object.values(DIRECTIONS)) {

            if (
                dir.x === -bot.direction.x &&
                dir.y === -bot.direction.y
            ) {
                continue;
            }

            const nx = bot.gridX + dir.x;
            const ny = bot.gridY + dir.y;

            if (!gridSystem.isOccupied(nx, ny)) {
                possible.push(dir);
            }
        }

        if (possible.length === 0) {
            return bot.direction;
        }

        return Phaser.Utils.Array.GetRandom(possible);
    }
}

class MediumAI {

    static getDirection(bot, gridSystem, arenaSystem = null) {

        let bestDirection = bot.direction;
        let bestScore = -9999;

        for (const dir of Object.values(DIRECTIONS)) {

            if (
                dir.x === -bot.direction.x &&
                dir.y === -bot.direction.y
            ) {
                continue;
            }

            const nx = bot.gridX + dir.x;
            const ny = bot.gridY + dir.y;

            if (
                gridSystem.isOccupied(nx, ny) ||
                (
                    arenaSystem &&
                    !arenaSystem.isInsideActiveArena(nx, ny)
                )
            ) {
                continue;
            }

            const score =
                this.calculateFreeSpace(
                    gridSystem,
                    nx,
                    ny,
                    arenaSystem
                );

            if (score > bestScore) {

                bestScore = score;
                bestDirection = dir;
            }
        }

        return bestDirection;
    }

    static calculateFreeSpace(gridSystem, x, y, arenaSystem = null) {

        let score = 0;

        for (const dir of Object.values(DIRECTIONS)) {

            const nx = x + dir.x;
            const ny = y + dir.y;

            if (
                !gridSystem.isOccupied(nx, ny) &&
                (
                    !arenaSystem ||
                    arenaSystem.isInsideActiveArena(nx, ny)
                )
            ) {
                score++;
            }
        }

        return score;
    }
}

class HardAI {

    static getDirection(bot, gridSystem, player, arenaSystem = null) {

        let bestDirection = bot.direction;
        let bestScore = -99999;

        for (const dir of Object.values(DIRECTIONS)) {

            if (
                dir.x === -bot.direction.x &&
                dir.y === -bot.direction.y
            ) {
                continue;
            }

            const nx = bot.gridX + dir.x;
            const ny = bot.gridY + dir.y;

            if (
                gridSystem.isOccupied(nx, ny) ||
                (
                    arenaSystem &&
                    !arenaSystem.isInsideActiveArena(nx, ny)
                )
            ) {
                continue;
            }

            const freeSpace =
                this.calculateFreeSpace(
                    gridSystem,
                    nx,
                    ny,
                    arenaSystem
                );

            const exits =
                this.countImmediateExits(
                    gridSystem,
                    nx,
                    ny,
                    dir,
                    arenaSystem
                );

            let score = freeSpace * 4;

            score += exits * 18;

            if (exits <= 1) {
                score -= 45;
            }

            score -= this.distanceToPlayer(
                nx,
                ny,
                player
            ) * 3;

            score += this.cutsPlayerPath(
                nx,
                ny,
                player
            );

            if (score > bestScore) {

                bestScore = score;
                bestDirection = dir;
            }
        }

        return bestDirection;
    }

    static calculateFreeSpace(gridSystem, x, y, arenaSystem = null) {

        let score = 0;
        const queue = [{ x, y }];
        const visited = new Set([`${x},${y}`]);

        while (queue.length > 0 && score < 90) {

            const cell = queue.shift();
            score++;

            for (const dir of Object.values(DIRECTIONS)) {

                const nx = cell.x + dir.x;
                const ny = cell.y + dir.y;
                const key = `${nx},${ny}`;

                if (visited.has(key)) {
                    continue;
                }

                if (
                    gridSystem.isOccupied(nx, ny) ||
                    (
                        arenaSystem &&
                        !arenaSystem.isInsideActiveArena(nx, ny)
                    )
                ) {
                    continue;
                }

                visited.add(key);
                queue.push({ x: nx, y: ny });
            }
        }

        return score;
    }

    static countImmediateExits(
        gridSystem,
        x,
        y,
        currentDirection,
        arenaSystem = null
    ) {

        let exits = 0;

        for (const dir of Object.values(DIRECTIONS)) {

            if (
                dir.x === -currentDirection.x &&
                dir.y === -currentDirection.y
            ) {
                continue;
            }

            const nx = x + dir.x;
            const ny = y + dir.y;

            if (
                !gridSystem.isOccupied(nx, ny) &&
                (
                    !arenaSystem ||
                    arenaSystem.isInsideActiveArena(nx, ny)
                )
            ) {
                exits++;
            }
        }

        return exits;
    }

    static distanceToPlayer(x, y, player) {

        return (
            Math.abs(player.gridX - x) +
            Math.abs(player.gridY - y)
        );
    }

    static cutsPlayerPath(x, y, player) {

        const playerDistance =
            this.distanceToPlayer(x, y, player);

        if (playerDistance > 5) {
            return 0;
        }

        const sameLane =
            x === player.gridX ||
            y === player.gridY;

        return sameLane ? 22 : 8;
    }
}

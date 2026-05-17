import { DIRECTIONS } from '../utils/Constants.js';

export class MediumAI {

    static getDirection(bot, gridSystem) {

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

            if (gridSystem.isOccupied(nx, ny)) {
                continue;
            }

            const score =
                this.calculateFreeSpace(
                    gridSystem,
                    nx,
                    ny
                );

            if (score > bestScore) {

                bestScore = score;
                bestDirection = dir;
            }
        }

        return bestDirection;
    }

    static calculateFreeSpace(gridSystem, x, y) {

        let score = 0;

        for (const dir of Object.values(DIRECTIONS)) {

            const nx = x + dir.x;
            const ny = y + dir.y;

            if (!gridSystem.isOccupied(nx, ny)) {
                score++;
            }
        }

        return score;
    }
}
import { DIRECTIONS } from '../utils/Constants.js';

export class HardAI {

    static getDirection(bot, gridSystem, player) {

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

            if (gridSystem.isOccupied(nx, ny)) {
                continue;
            }

            let score = 0;

            score += this.calculateFreeSpace(
                gridSystem,
                nx,
                ny
            ) * 10;

            score -= this.distanceToPlayer(
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

    static distanceToPlayer(x, y, player) {

        return (
            Math.abs(player.gridX - x) +
            Math.abs(player.gridY - y)
        );
    }
}
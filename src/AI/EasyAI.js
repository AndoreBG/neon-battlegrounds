import { DIRECTIONS } from '../utils/Constants.js';

export class EasyAI {

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
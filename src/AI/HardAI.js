import { DIRECTIONS } from '../utils/Constants.js';

export class HardAI {

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

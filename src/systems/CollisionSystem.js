export class CollisionSystem {

    static checkCollision(gridSystem, x, y) {

        return gridSystem.isOccupied(x, y);
    }
}
import {
    GRID_SIZE,
    ARENA_OFFSET_X,
    ARENA_OFFSET_Y
} from '../utils/Constants.js';

export class Trail {

    constructor(scene, gridX, gridY, color) {

        this.scene = scene;

        this.gridX = gridX;
        this.gridY = gridY;

        this.rectangle = scene.add.rectangle(
            ARENA_OFFSET_X + (gridX * GRID_SIZE) + GRID_SIZE / 2,
            ARENA_OFFSET_Y + (gridY * GRID_SIZE) + GRID_SIZE / 2,
            GRID_SIZE - 2,
            GRID_SIZE - 2,
            color
        );
    }
}

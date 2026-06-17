import {
    GRID_SIZE,
    ARENA_OFFSET_X,
    ARENA_OFFSET_Y,
    COLORS
} from '../utils/Constants.js';

import { Trail } from './Trail.js';

export class RemotePlayer {
    constructor(scene, gridSystem, x, y, color) {
        this.scene = scene;
        this.gridSystem = gridSystem;
        this.gridX = x;
        this.gridY = y;
        this.direction = { x: 1, y: 0 };
        this.alive = true;
        this.color = color;
        this.trails = [];

        this.rectangle = scene.add.rectangle(
            ARENA_OFFSET_X + (this.gridX * GRID_SIZE) + GRID_SIZE / 2,
            ARENA_OFFSET_Y + (this.gridY * GRID_SIZE) + GRID_SIZE / 2,
            GRID_SIZE - 2,
            GRID_SIZE - 2,
            this.color
        );

        // NÃO ocupe a posição inicial e não crie trilha aqui
        // A primeira trilha será criada quando o remoto se mover
    }

    updatePosition(newX, newY, direction) {
      if (!this.alive) return;
      if (this.gridX === newX && this.gridY === newY) return;

      // Deixa trilha na posição ANTERIOR
      this.gridSystem.occupy(this.gridX, this.gridY);
      const trail = new Trail(this.scene, this.gridX, this.gridY, this.color); // <-- corrigido
      this.trails.push(trail);

      // Move para a nova posição
      this.gridX = newX;
      this.gridY = newY;
      this.direction = direction;

      this.rectangle.setPosition(
        ARENA_OFFSET_X + (this.gridX * GRID_SIZE) + GRID_SIZE / 2,
        ARENA_OFFSET_Y + (this.gridY * GRID_SIZE) + GRID_SIZE / 2
      );
    }

    die() {
        this.alive = false;
        this.rectangle.setFillStyle(0x444444);
    }

    destroy() {
        this.rectangle.destroy();
        for (const trail of this.trails) {
            trail.destroy();
        }
    }
}
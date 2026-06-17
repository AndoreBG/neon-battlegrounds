import {
    GRID_SIZE,
    ARENA_OFFSET_X,
    ARENA_OFFSET_Y
} from '../utils/Constants.js';

import { Trail } from './Trail.js';

/**
 * Representa um jogador renderizado a partir do estado AUTORITATIVO do servidor.
 * Não simula movimento: apenas desenha a posição/rastro recebidos.
 * Usado tanto para o oponente quanto para o próprio jogador no modo online.
 */
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
        // chave "x,y" -> true, para não duplicar rastros
        this.trailKeys = new Set();

        this.rectangle = scene.add.rectangle(
            ARENA_OFFSET_X + (this.gridX * GRID_SIZE) + GRID_SIZE / 2,
            ARENA_OFFSET_Y + (this.gridY * GRID_SIZE) + GRID_SIZE / 2,
            GRID_SIZE - 2,
            GRID_SIZE - 2,
            this.color
        );
    }

    /**
     * Aplica o estado absoluto vindo do servidor.
     * Marca rastro em TODAS as células percorridas desde a última posição
     * (preenchendo eventuais lacunas se uma atualização foi perdida).
     */
    applyState(state) {
        if (!state) return;

        if (state.alive === false && this.alive) {
            this.die();
        }

        // Efeito visual de boost de velocidade (borda branca quando ativo)
        if (this.alive) {
            if (state.boost && !this._boostShown) {
                this.rectangle.setStrokeStyle(2, 0xffffff, 1);
                this._boostShown = true;
            } else if (!state.boost && this._boostShown) {
                this.rectangle.setStrokeStyle();
                this._boostShown = false;
            }
        }

        const newX = state.x;
        const newY = state.y;

        if (state.direction) {
            this.direction = state.direction;
        }

        // Preenche o rastro da posição antiga até a nova (a posição atual
        // da cabeça vira rastro; a nova cabeça fica sem rastro).
        if (this.alive) {
            this._fillTrail(this.gridX, this.gridY, newX, newY);
        }

        this.gridX = newX;
        this.gridY = newY;

        this.rectangle.setPosition(
            ARENA_OFFSET_X + (this.gridX * GRID_SIZE) + GRID_SIZE / 2,
            ARENA_OFFSET_Y + (this.gridY * GRID_SIZE) + GRID_SIZE / 2
        );
    }

    _fillTrail(fromX, fromY, toX, toY) {
        // marca a célula de origem (onde a cabeça estava)
        this._addTrailCell(fromX, fromY);

        // se a cabeça pulou mais de uma célula (perda de pacote), preenche o meio
        const dx = Math.sign(toX - fromX);
        const dy = Math.sign(toY - fromY);

        // só interpola em linha reta (movimento de grid é sempre ortogonal)
        if (dx !== 0 && dy === 0) {
            for (let x = fromX + dx; x !== toX; x += dx) {
                this._addTrailCell(x, fromY);
            }
        } else if (dy !== 0 && dx === 0) {
            for (let y = fromY + dy; y !== toY; y += dy) {
                this._addTrailCell(fromX, y);
            }
        }
    }

    _addTrailCell(x, y) {
        const key = `${x},${y}`;
        if (this.trailKeys.has(key)) return;
        this.trailKeys.add(key);

        this.gridSystem.occupy(x, y, true);
        this.trails.push(new Trail(this.scene, x, y, this.color));
    }

    die() {
        this.alive = false;
        this.rectangle.setFillStyle(0x444444);
    }

    destroy() {
        this.rectangle.destroy();
        for (const trail of this.trails) {
            trail.rectangle?.destroy();
        }
        this.trails = [];
    }
}

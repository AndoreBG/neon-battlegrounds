import {
    GRID_COLS,
    GRID_ROWS,
    GRID_SIZE,
    ARENA_OFFSET_X,
    ARENA_OFFSET_Y,
    COLORS,
    ARENA_TIMERS
} from '../utils/Constants.js';

export class ArenaSystem {

    constructor(scene) {

        this.scene = scene;

        this.shrinkLevel = 0;

        this.warningBlocks = [];

        this.disabledBlocks = [];

        this.warningActive = false;

        this.warningEndTime = 0;

        this.nextShrinkTime =
            ARENA_TIMERS.INITIAL_SHRINK_DELAY;

        this.shrinkInterval =
            ARENA_TIMERS.SHRINK_INTERVAL;

        this.warningDuration =
            ARENA_TIMERS.WARNING_DURATION;

        this.warningBlinkDuration =
            ARENA_TIMERS.WARNING_BLINK_DURATION;

        this.currentBounds = {
            left: 0,
            right: GRID_COLS - 1,
            top: 0,
            bottom: GRID_ROWS - 1
        };
    }

    update(elapsedTime) {

        if (this.warningActive) {
            return;
        }

        if (
            elapsedTime >= this.nextShrinkTime
        ) {

            this.startWarning(elapsedTime);
        }
    }

    startWarning(elapsedTime) {

        if (
            this.currentBounds.right - this.currentBounds.left <= 6 ||
            this.currentBounds.bottom - this.currentBounds.top <= 6
        ) {
            this.nextShrinkTime = Number.POSITIVE_INFINITY;
            return;
        }

        this.warningActive = true;
        this.warningEndTime =
            elapsedTime + this.warningDuration;

        const nextBounds = {
            left: this.currentBounds.left + 1,
            right: this.currentBounds.right - 1,
            top: this.currentBounds.top + 1,
            bottom: this.currentBounds.bottom - 1
        };

        this.createWarningBlocks(nextBounds);

        this.scene.time.delayedCall(
            this.warningDuration,
            () => {

                this.disableBlocks(nextBounds);

                this.currentBounds = nextBounds;
                this.warningActive = false;
                this.nextShrinkTime =
                    this.warningEndTime +
                    this.shrinkInterval;
            }
        );
    }

    createWarningBlocks(bounds) {

        this.clearWarningBlocks();

        for (let x = 0; x < GRID_COLS; x++) {

            for (let y = 0; y < GRID_ROWS; y++) {

                const inCurrentBounds =
                    this.isInsideBounds(
                        x,
                        y,
                        this.currentBounds
                    );

                const outsideNextBounds =
                    !this.isInsideBounds(
                        x,
                        y,
                        bounds
                    );

                if (!inCurrentBounds || !outsideNextBounds) {
                    continue;
                }

                const block =
                    this.scene.add.rectangle(
                        ARENA_OFFSET_X +
                        (x * GRID_SIZE) +
                        GRID_SIZE / 2,

                        ARENA_OFFSET_Y +
                        (y * GRID_SIZE) +
                        GRID_SIZE / 2,

                        GRID_SIZE - 2,
                        GRID_SIZE - 2,
                        COLORS.WARNING
                    );

                this.scene.tweens.add({
                    targets: block,
                    alpha: 0.2,
                    duration: this.warningBlinkDuration,
                    yoyo: true,
                    repeat: -1
                });

                this.warningBlocks.push(block);
            }
        }
    }

    disableBlocks(bounds) {

        this.clearWarningBlocks();

        for (let x = 0; x < GRID_COLS; x++) {

            for (let y = 0; y < GRID_ROWS; y++) {

                const inCurrentBounds =
                    this.isInsideBounds(
                        x,
                        y,
                        this.currentBounds
                    );

                const outsideNextBounds =
                    !this.isInsideBounds(
                        x,
                        y,
                        bounds
                    );

                if (!inCurrentBounds || !outsideNextBounds) {
                    continue;
                }

                const block =
                    this.scene.add.rectangle(
                        ARENA_OFFSET_X +
                        (x * GRID_SIZE) +
                        GRID_SIZE / 2,

                        ARENA_OFFSET_Y +
                        (y * GRID_SIZE) +
                        GRID_SIZE / 2,

                        GRID_SIZE - 2,
                        GRID_SIZE - 2,
                        0x444444
                    );

                this.disabledBlocks.push(block);
            }
        }
    }

    clearWarningBlocks() {

        for (const block of this.warningBlocks) {
            block.destroy();
        }

        this.warningBlocks = [];
    }

    /**
     * Modo online: aplica o estado de arena autoritativo do servidor.
     * Não usa timers locais; apenas reflete bounds e blocos de aviso/desabilitados.
     */
    applyServerState(arenaState) {

        if (!arenaState || !arenaState.bounds) {
            return;
        }

        const nextBounds = arenaState.bounds;

        // Aviso (blocos piscando) com base no pendingBounds enviado pelo servidor
        if (arenaState.warningActive && arenaState.pendingBounds) {
            if (!this._serverWarningShown) {
                this.createWarningBlocks(arenaState.pendingBounds);
                this._serverWarningShown = true;
            }
        } else {
            this._serverWarningShown = false;
        }

        // Se os limites mudaram, materializa os blocos desabilitados
        const changed =
            !this._lastBounds ||
            this._lastBounds.left !== nextBounds.left ||
            this._lastBounds.right !== nextBounds.right ||
            this._lastBounds.top !== nextBounds.top ||
            this._lastBounds.bottom !== nextBounds.bottom;

        if (changed && this._lastBounds) {
            // os blocos a desabilitar são a "casca" entre o limite antigo e o novo
            this.currentBounds = this._lastBounds;
            this.disableBlocks(nextBounds);
        }

        this.currentBounds = nextBounds;
        this._lastBounds = { ...nextBounds };
    }

    isInsideActiveArena(x, y) {

        return this.isInsideBounds(
            x,
            y,
            this.currentBounds
        );
    }

    isInsideBounds(x, y, bounds) {

        return (
            x >= bounds.left &&
            x <= bounds.right &&
            y >= bounds.top &&
            y <= bounds.bottom
        );
    }

    getRemainingTime(elapsedTime) {

        if (this.warningActive) {

            const warningRemaining =
                Math.ceil(
                    (this.warningEndTime - elapsedTime) / 1000
                );

            return Math.max(0, warningRemaining);
        }

        const remaining =
            Math.ceil(
                (this.nextShrinkTime - elapsedTime) / 1000
            );

        return Math.max(0, remaining);
    }
}
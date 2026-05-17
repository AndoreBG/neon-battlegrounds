import {
    GRID_COLS,
    GRID_ROWS,
    GRID_SIZE,
    ARENA_OFFSET_X,
    ARENA_OFFSET_Y,
    COLORS
} from '../utils/Constants.js';

export class ArenaSystem {

    constructor(scene) {

        this.scene = scene;

        this.shrinkLevel = 0;

        this.warningBlocks = [];

        this.disabledBlocks = [];

        this.nextShrinkTime = 15000;

        this.shrinkInterval = 10000;

        this.warningDuration = 3000;

        this.currentBounds = {
            left: 0,
            right: GRID_COLS - 1,
            top: 0,
            bottom: GRID_ROWS - 1
        };
    }

    update(elapsedTime) {

        if (
            elapsedTime >= this.nextShrinkTime
        ) {

            this.startWarning();

            this.nextShrinkTime +=
                this.shrinkInterval;
        }
    }

    startWarning() {

        if (
            this.currentBounds.right - this.currentBounds.left <= 6 ||
            this.currentBounds.bottom - this.currentBounds.top <= 6
        ) {
            return;
        }

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
                    duration: 400,
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

        const remaining =
            Math.ceil(
                (this.nextShrinkTime - elapsedTime) / 1000
            );

        return Math.max(0, remaining);
    }
}

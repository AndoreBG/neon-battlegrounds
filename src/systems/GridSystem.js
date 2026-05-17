export class GridSystem {

    constructor(cols, rows) {

        this.cols = cols;
        this.rows = rows;

        this.grid = [];

        for (let y = 0; y < rows; y++) {

            const row = [];

            for (let x = 0; x < cols; x++) {

                row.push(null);
            }

            this.grid.push(row);
        }
    }

    isInside(x, y) {

        return (
            x >= 0 &&
            x < this.cols &&
            y >= 0 &&
            y < this.rows
        );
    }

    isOccupied(x, y) {

        if (!this.isInside(x, y)) {
            return true;
        }

        return this.grid[y][x] !== null;
    }

    occupy(x, y, value = true) {

        if (!this.isInside(x, y)) {
            return;
        }

        this.grid[y][x] = value;
    }

    clear() {

        for (let y = 0; y < this.rows; y++) {

            for (let x = 0; x < this.cols; x++) {

                this.grid[y][x] = null;
            }
        }
    }
}
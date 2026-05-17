class GameManager {
    constructor() {
        this.reset();
    }

    reset() {
        this.difficulty = null;
        this.playerWon = false;
    }

    setDifficulty(difficulty) {
        this.difficulty = difficulty;
    }

    getDifficulty() {
        return this.difficulty;
    }

    setWinner(playerWon) {
        this.playerWon = playerWon;
    }

    hasPlayerWon() {
        return this.playerWon;
    }
}

export const gameManager = new GameManager();
class GameManager {
    constructor() {
        this.reset();
    }

    reset() {
        this.difficulty = null;
        this.playerWon = false;
        this.isMultiplayer = false;
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

    setMultiplayer(isMultiplayer) {
        this.isMultiplayer = isMultiplayer;
    }

    getMultiplayer() {
        return this.isMultiplayer;
    }
}

export const gameManager = new GameManager();
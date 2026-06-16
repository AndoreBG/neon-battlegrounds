class GameManager {
    constructor() {
        this.reset();
    }

    reset() {
        this.difficulty = null;
        this.playerWon = false;
        this.isMultiplayer = false;
        this.multiplayerData = null;
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
    
    setMultiplayerData(data) {
        this.multiplayerData = data;
    }
    
    getMultiplayerData() {
        return this.multiplayerData;
    }
}

export const gameManager = new GameManager();
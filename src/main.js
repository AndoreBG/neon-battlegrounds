import { gameConfig } from './config/gameConfig.js';
import { networkManager } from './managers/NetworkManager.js';

window.addEventListener('load', () => {
    // Initialize Socket.io connection
    const socket = io('http://localhost:3000', {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5
    });

    networkManager.connect(socket);

    new Phaser.Game(gameConfig);
});
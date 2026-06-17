import { gameConfig } from './config/gameConfig.js';
import { networkManager } from './managers/NetworkManager.js';
import { SERVER_URL } from './config/networkConfig.js';

window.addEventListener('load', () => {
    // Inicializa a conexão Socket.io.
    // SERVER_URL aponta para localhost em desenvolvimento e para o servidor
    // publicado quando o front roda no GitHub Pages (ver networkConfig.js).
    const socket = io(SERVER_URL, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5
    });

    networkManager.connect(socket);

    new Phaser.Game(gameConfig);
});

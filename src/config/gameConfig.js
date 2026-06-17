import { BootScene } from '../scenes/BootScene.js';
import { MenuScene } from '../scenes/MenuScene.js';
import { DifficultyScene } from '../scenes/DifficultyScene.js';
import { MatchmakingScene } from '../scenes/MatchmakingScene.js';
import { GameScene } from '../scenes/GameScene.js';
import { GameOverScene } from '../scenes/GameOverScene.js';

export const gameConfig = {
    type: Phaser.AUTO,

    parent: 'game-container',

    width: 1280,
    height: 720,

    backgroundColor: '#05070d',

    // Mantém o loop usando setTimeout além do requestAnimationFrame.
    // Reduz o "congelamento" do loop quando a janela perde o foco
    // (defesa extra; no modo online a verdade está no servidor).
    fps: {
        target: 60,
        forceSetTimeOut: true
    },

    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },

    scene: [
        BootScene,
        MenuScene,
        DifficultyScene,
        MatchmakingScene,
        GameScene,
        GameOverScene
    ]
};
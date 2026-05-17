import { gameManager } from '../managers/GameManager.js';

export class GameOverScene extends Phaser.Scene {

    constructor() {
        super('GameOverScene');
    }

    create() {

        const victoryText =
            gameManager.hasPlayerWon()
                ? 'VOCÊ VENCEU'
                : 'GAME OVER';

        this.add.text(
            640,
            220,
            victoryText,
            {
                fontFamily: 'Arial',
                fontSize: '56px',
                color: '#ffffff'
            }
        ).setOrigin(0.5);

        const retryButton = this.add.text(
            640,
            380,
            'TENTAR NOVAMENTE',
            {
                fontSize: '30px',
                color: '#00ffff',
                backgroundColor: '#111827',
                padding: {
                    x: 24,
                    y: 12
                }
            }
        )
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

        retryButton.on('pointerdown', () => {
            this.scene.start('GameScene');
        });

        const menuButton = this.add.text(
            640,
            480,
            'MENU PRINCIPAL',
            {
                fontSize: '30px',
                color: '#ffffff',
                backgroundColor: '#111827',
                padding: {
                    x: 24,
                    y: 12
                }
            }
        )
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

        menuButton.on('pointerdown', () => {

            gameManager.reset();

            this.scene.start('MenuScene');
        });
    }
}
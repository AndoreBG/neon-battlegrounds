import { DIFFICULTY } from '../utils/Constants.js';
import { gameManager } from '../managers/GameManager.js';

export class DifficultyScene extends Phaser.Scene {

    constructor() {
        super('DifficultyScene');
    }

    create() {

        this.cameras.main.fadeIn(300);

        this.add.text(
            640,
            140,
            'SELECIONE A DIFICULDADE',
            {
                fontFamily: 'Arial',
                fontSize: '36px',
                color: '#ffffff'
            }
        ).setOrigin(0.5);

        this.createDifficultyButton(
            640,
            260,
            'FÁCIL',
            '#00ff66',
            DIFFICULTY.FACIL
        );

        this.createDifficultyButton(
            640,
            380,
            'MÉDIO',
            '#ffcc00',
            DIFFICULTY.MEDIO
        );

        this.createDifficultyButton(
            640,
            500,
            'DIFÍCIL',
            '#ff3355',
            DIFFICULTY.DIFICIL
        );

        const backButton = this.add.text(
            80,
            50,
            '< VOLTAR',
            {
                fontSize: '24px',
                color: '#ffffff'
            }
        )
        .setInteractive({ useHandCursor: true });

        backButton.on('pointerdown', () => {
            this.scene.start('MenuScene');
        });
    }

    createDifficultyButton(x, y, label, color, difficulty) {

        const button = this.add.text(
            x,
            y,
            label,
            {
                fontFamily: 'Arial',
                fontSize: '30px',
                color: color,
                backgroundColor: '#111827',
                padding: {
                    x: 30,
                    y: 15
                }
            }
        )
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

        button.on('pointerdown', () => {

            gameManager.setDifficulty(difficulty);

            this.scene.start('GameScene');
        });
    }
}
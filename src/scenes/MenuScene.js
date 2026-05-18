import { COLORS } from '../utils/Constants.js';

export class MenuScene extends Phaser.Scene {

    constructor() {
        super('MenuScene');
    }

    create() {

        this.add.rectangle(
            640,
            360,
            1280,
            720,
            COLORS.BACKGROUND
        );

        this.add.text(
            640,
            180,
            'NEON BATTLEGROUNDS',
            {
                fontFamily: 'Arial',
                fontSize: '48px',
                color: '#00ffff',
                fontStyle: 'bold'
            }
        ).setOrigin(0.5);

        const playButton = this.add.text(
            640,
            360,
            'JOGAR',
            {
                fontFamily: 'Arial',
                fontSize: '32px',
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

        playButton.on('pointerover', () => {
            playButton.setStyle({
                color: '#00ffff'
            });
        });

        playButton.on('pointerout', () => {
            playButton.setStyle({
                color: '#ffffff'
            });
        });

        playButton.on('pointerdown', () => {
            this.scene.start('DifficultyScene');
        });

        this.add.text(
            640,
            650,
            'TRON Arcade Survival',
            {
                fontSize: '18px',
                color: '#666666'
            }
        ).setOrigin(0.5);
    }
}

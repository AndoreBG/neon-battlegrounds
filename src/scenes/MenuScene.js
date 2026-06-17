import { COLORS } from '../utils/Constants.js';
import { gameManager } from '../managers/GameManager.js';

export class MenuScene extends Phaser.Scene {

    constructor() {
        super('MenuScene');
    }

    create() {

        gameManager.reset();

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

        const pvpButton = this.add.text(
            640,
            450,
            'PvP MULTIPLAYER',
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

        pvpButton.on('pointerover', () => {
            pvpButton.setStyle({
                color: '#00ffff'
            });
        });

        pvpButton.on('pointerout', () => {
            pvpButton.setStyle({
                color: '#ffffff'
            });
        });

        pvpButton.on('pointerdown', () => {
            this.scene.start('MatchmakingScene');
        });

        // ----- Controles do jogo -----
        this.add.text(
            640,
            545,
            'CONTROLES',
            {
                fontFamily: 'Arial',
                fontSize: '22px',
                color: '#00ffff',
                fontStyle: 'bold'
            }
        ).setOrigin(0.5);

        this.add.text(
            640,
            585,
            'WASD  ou  \u2190 \u2191 \u2192 \u2193',
            {
                fontFamily: 'Arial',
                fontSize: '26px',
                color: '#ffffff'
            }
        ).setOrigin(0.5);

        this.add.text(
            640,
            650,
            'Desenvolvido por Mika Games',
            {
                fontSize: '18px',
                color: '#666666'
            }
        ).setOrigin(0.5);
    }
}

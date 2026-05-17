class AudioManager {
    constructor() {
        this.enabled = true;
        this.debug = false;
    }

    playMusic(key) {
        this.log('music:start', key);
    }

    stopMusic() {
        this.log('music:stop');
    }

    playSFX(key) {
        this.log('sfx', key);
    }

    log(type, key = '') {
        if (!this.debug) {
            return;
        }

        console.info(`[audio] ${type}`, key);
    }
}

export const audioManager = new AudioManager();

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

export const GRID_SIZE = 24;

export const GRID_COLS = 20;
export const GRID_ROWS = 20;

export const ARENA_OFFSET_X =
    (GAME_WIDTH - (GRID_COLS * GRID_SIZE)) / 2;

export const ARENA_OFFSET_Y =
    (GAME_HEIGHT - (GRID_ROWS * GRID_SIZE)) / 2;

export const MOVE_DELAY = 120;

export const POWER_UP = {
    SPAWN_DELAY: 4000,
    RESPAWN_DELAY: 7000,
    SPEED_MULTIPLIER: 1 / 1.4,
    DURATION: 5000
};

export const DIRECTIONS = {
    UP: { x: 0, y: -1 },
    DOWN: { x: 0, y: 1 },
    LEFT: { x: -1, y: 0 },
    RIGHT: { x: 1, y: 0 }
};

export const DIFFICULTY = {
    FACIL: 'FACIL',
    MEDIO: 'MEDIO',
    DIFICIL: 'DIFICIL'
};

export const COLORS = {
    BACKGROUND: 0x05070d,
    GRID: 0x16213a,

    PLAYER: 0x00ffff,

    EASY: 0x00ff66,
    MEDIUM: 0xffcc00,
    HARD: 0xff3355,

    POWER_UP: 0xff4dff,
    WARNING: 0xff3355,
    WALL: 0x666666,

    TEXT: '#ffffff'
};

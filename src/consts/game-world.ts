
export const TILE_SIZE = 32;
export const COLS = 19;
// Increased rows to make the game world taller (more vertical space)
export const ROWS = 17;
export const GAME_WIDTH = TILE_SIZE * COLS - TILE_SIZE * 2;
export const GAME_HEIGHT = TILE_SIZE * ROWS - TILE_SIZE * 2;

// Extra visual height for the background/starfield so it matches
// the extended collision grid and comfortably fills tall screens.
// This does NOT change gameplay bounds, only how tall the level
// texture is rendered. Increase/decrease this to taste.
export const LEVEL_EXTRA_TILE_ROWS = 24;
export const LEVEL_HEIGHT = GAME_HEIGHT + TILE_SIZE * LEVEL_EXTRA_TILE_ROWS;

export const SPEED = 2;

export const OFFSET_X = 0;
export const OFFSET_Y = TILE_SIZE / 2;

// Collision constants
export const ENEMY_COLLISION_MULTIPLIER = 10.0; // Makes enemy hitbox 5x larger than visual sprite for better gameplay

// Global mobile / desktop detection helpers so we can keep a single
// definition and reuse it across the game.
//
// Note: these are runtime checks (not build-time); they safely no-op
// when `window` is not available.
export const isMobile = (): boolean => {
  if (typeof window === "undefined") {
    return false;
  }

  const width = window.innerWidth;
  const height = window.innerHeight;

  // Simple heuristic: narrow or portrait-ish screens count as mobile.
  return width <= 768 || height > width;
};

export const isDesktop = (): boolean => !isMobile();


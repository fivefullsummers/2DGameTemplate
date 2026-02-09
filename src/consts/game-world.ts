
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
export const ENEMY_COLLISION_MULTIPLIER = 10.0; // Legacy / other uses
/**
 * Radius (px) for player bullet vs enemy hit. Used in BulletManager and debug UI (press C).
 * Mobile keeps the original, slightly more generous radius; desktop uses a tighter radius.
 */
export const ENEMY_BULLET_HIT_RADIUS = typeof window === "undefined"
  ? 22
  : (window.innerWidth <= 768 || window.innerHeight > window.innerWidth ? 22 : 12);

/** Player bullet vs enemy bullet: count as hit when centers are within this distance (px). */
export const BULLET_VS_BULLET_HIT_RADIUS = 28;
/** When player bullet is within this distance (px) of an enemy bullet, nudge it toward the enemy bullet. */
export const BULLET_ATTRACTION_RADIUS = 56;
/** How fast (px per frame) to pull player bullet toward nearby enemy bullet. */
export const BULLET_ATTRACTION_STRENGTH = 2.8;

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


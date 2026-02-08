import { COLS, ROWS, TILE_SIZE } from "./game-world";
import { ENEMY_SPACING_X, ENEMY_SPACING_Y, ENEMY_FORMATION_OFFSET_Y } from "./tuning-config";

// Enemy spawn map: 0 = no enemy, 1 = enemy spawns here
// Each cell represents a 32x32 tile position
// Dimensions: 19 columns × ROWS rows (matches game world tile grid)
export const ENEMIES_MAP: number[][] = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  // Rows 2–6: 5 rows of enemies, 9 columns wide, centered.
  // Padding: 5 empty tiles on each side (indices 0–4 and 14–18 are 0).
  [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
];

// Validate enemies map dimensions
if (ENEMIES_MAP.length !== ROWS || ENEMIES_MAP[0].length !== COLS) {
  console.error(`Enemies map size mismatch! Expected ${ROWS}x${COLS}`);
}

export interface EnemyPosition {
  x: number;
  y: number;
  row: number;
  col: number;
}

// Helper function to get enemy positions from the map (with grid row/col for spreader)
export const getEnemyPositions = (): EnemyPosition[] => {
  const positions: EnemyPosition[] = [];

  // First pass: find horizontal extent (min/max columns that contain enemies)
  let minCol: number | null = null;
  let maxCol: number | null = null;

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (ENEMIES_MAP[row][col] === 1) {
        if (minCol === null || col < minCol) minCol = col;
        if (maxCol === null || col > maxCol) maxCol = col;
      }
    }
  }

  // Compute a horizontal offset so the formation is centered in the
  // playfield, regardless of how wide the enemy block is.
  let centerOffsetX = 0;
  if (minCol !== null && maxCol !== null) {
    const formationWidth = (maxCol - minCol + 1) * ENEMY_SPACING_X;
    const currentCenterX = minCol * ENEMY_SPACING_X + formationWidth / 2;

    // Align the enemy formation's center to the same horizontal
    // center used for the player start position. In world units,
    // the player starts at ((COLS - 2) * TILE_SIZE) / 2.
    const desiredCenterX = ((COLS - 2) * TILE_SIZE) / 2;

    centerOffsetX = desiredCenterX - currentCenterX;
  }

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (ENEMIES_MAP[row][col] === 1) {
        // Convert tile coordinates to pixel coordinates.
        // Use configurable spacing and apply a global horizontal
        // offset so the whole formation is centered on X.
        const x = col * ENEMY_SPACING_X + ENEMY_SPACING_X / 2 + centerOffsetX;
        const y = row * ENEMY_SPACING_Y + ENEMY_SPACING_Y / 2 + ENEMY_FORMATION_OFFSET_Y;
        positions.push({ x, y, row, col });
      }
    }
  }

  return positions;
};

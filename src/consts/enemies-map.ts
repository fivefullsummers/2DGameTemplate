import { COLS, ROWS, TILE_SIZE } from "./game-world";

// Enemy spawn map: 0 = no enemy, 1 = enemy spawns here
// Each cell represents a 32x32 tile position
// Dimensions: 19 columns × 13 rows (matches game world tile grid)
export const ENEMIES_MAP: number[][] = [
  // Row 0
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  // Row 1 - Example enemies in a row (you can edit this to place enemies anywhere)
  [0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
  // Row 2
  [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0],
  // Row 3
  [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0],
  // Row 4
  [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0],
  // Row 5
  [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
  // Row 6
  [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
  // Row 7
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
  // Row 8
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  // Row 9
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  // Row 10
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  // Row 11
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  // Row 12
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
];

// Validate enemies map dimensions
if (ENEMIES_MAP.length !== ROWS || ENEMIES_MAP[0].length !== COLS) {
  console.error(`Enemies map size mismatch! Expected ${ROWS}x${COLS}`);
}

// Helper function to get enemy positions from the map
export const getEnemyPositions = (): Array<{ x: number; y: number }> => {
  const positions: Array<{ x: number; y: number }> = [];
  
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (ENEMIES_MAP[row][col] === 1) {
        // Convert tile coordinates to pixel coordinates
        // Center enemies in their tiles (since EnemyStatic uses anchor={0.5})
        const x = col * TILE_SIZE + TILE_SIZE / 2;
        const y = row * TILE_SIZE + TILE_SIZE / 2;
        positions.push({ x, y });
      }
    }
  }
  
  return positions;
};

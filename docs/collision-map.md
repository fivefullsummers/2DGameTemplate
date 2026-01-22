# Collision Map

The collision map defines which areas in the game world can be walked on and which are blocked by obstacles.

## Structure

- **Dimensions**: 38 columns × 26 rows (4x granularity: each 32×32 tile is divided into 4 sub-tiles)
- **Sub-Tile Size**: 16×16 pixels per collision cell
- **Tile Size**: 32×32 pixels (each tile = 4 collision cells)
- **Data Format**: 2D array of numbers

## Granularity System

The collision map uses **4x granularity** - each visual tile (32×32 pixels) is divided into 4 sub-tiles (16×16 pixels each). This provides much more precise collision detection, allowing you to:
- Create partial obstacles within a tile
- Have more accurate collision boundaries
- Fine-tune walkable areas around obstacles

**Mapping:**
- 1 visual tile (32×32) = 4 collision cells (16×16 each)
- Original map: 19×13 tiles → Collision map: 38×26 cells

## Collision Values

- `0` = **Walkable** - Player can move through this sub-tile
- `1` = **Blocked** - Impassable obstacle (walls, water, bushes, rocks)

## Visual Diagram

The collision map is 38×26 cells (each cell is 16×16 pixels). Each visual tile (32×32) corresponds to a 2×2 block of collision cells.

```
Collision Map (38×26 cells, 16×16 each):
┌─────────────────────────────────────────────────────────────────┐
│ 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 │ Row 0-1 (Top padding)
│ 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 │ Row 2-3
│ 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 │ Row 4-5
│ ... (interior walkable area with obstacles) ...                  │
│ 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 │ Row 24-25 (Bottom padding)
└─────────────────────────────────────────────────────────────────┘
  ↑                                                                 ↑
Col 0-1                                                         Col 36-37
(Left padding)                                              (Right padding)

Legend:
  1 = Blocked sub-tile (red border in debug, 16×16 pixels)
  0 = Walkable sub-tile (16×16 pixels)
  
Visible Tilemap Area: Rows 2-23, Cols 2-35 (corresponds to 11×17 tiles)
Padding Boundaries: Rows 0-1, Rows 24-25, Cols 0-1, Cols 36-37
```

**Note:** The collision map is automatically expanded from the original 13×19 tile map. Each original tile cell becomes 4 sub-tiles (2×2 grid) in the collision map.

## Padding and Boundary System

The collision map uses **1 tile of padding** on all sides to create an invisible boundary that prevents the hero from walking off the map. This padding allows the hero to walk right up to the edges of the visible tilemap without falling off.

### Coordinate Offset System

The collision map is **offset** from the visible tilemap by 1 tile (32 pixels):

```
Collision Map (0,0) → World Position (-32, -16)  [Outside tilemap]
Collision Map (2,2) → World Position (0, 16)      [Top-left of visible tilemap]
```

This offset is implemented in the `isBlocked()` function:

```typescript
const col = Math.floor((centerX + TILE_SIZE) / COLLISION_SUB_TILE_SIZE);
const row = Math.floor((centerY + TILE_SIZE) / COLLISION_SUB_TILE_SIZE);
```

The `+ TILE_SIZE` shifts the coordinate system by 1 tile (32 pixels), and division by `COLLISION_SUB_TILE_SIZE` (16 pixels) converts to sub-tile coordinates. This makes the collision map's first 2 rows/columns represent the area **outside** the visible tilemap.

### Boundary Frame Structure

```
Rows 0-1:     [1,1,1,1,... all blocked ...1,1,1,1]  ← Top boundary (outside tilemap)
Rows 2-23:    [1,1,0,0,... walkable ...0,0,1,1]     ← Left/Right boundaries
Rows 24-25:   [1,1,1,1,... all blocked ...1,1,1,1]  ← Bottom boundary (outside tilemap)
              ↑↑                                   ↑↑
            Cols 0-1                          Cols 36-37
         (Left boundary)                  (Right boundary)
```

**Boundary regions:**
- **Rows 0-1**: Top padding boundary (2 rows = 1 tile, outside visible tilemap)
- **Rows 24-25**: Bottom padding boundary (2 rows = 1 tile, outside visible tilemap)
- **Cols 0-1** (Rows 2-23): Left padding boundary (2 cols = 1 tile)
- **Cols 36-37** (Rows 2-23): Right padding boundary (2 cols = 1 tile)
- **Cols 2-35, Rows 2-23**: Walkable interior (34×22 = 748 sub-tiles = 187 tiles)

### Why Use Padding?

**Benefits:**
1. ✅ Hero can walk to the very edge of the visible tilemap
2. ✅ Invisible boundary prevents walking off the map
3. ✅ No need for hard-coded position checks
4. ✅ Consistent with the tile-based collision system
5. ✅ Easy to visualize with debug rendering

**Without padding:** You'd need to add extra bounds checking or the hero could walk off the map edges.

**With padding:** The boundary is naturally part of the collision map, and `isBlocked()` handles it automatically.

## Map Layout

Based on `map.png`, the following obstacles are marked as blocked:

### Border Walls (Padding Boundaries)
- **Row 0**: Complete top boundary (outside visible tilemap)
- **Row 12**: Complete bottom boundary (outside visible tilemap)
- **Col 0** (Rows 1-11): Left boundary
- **Col 18** (Rows 1-11): Right boundary

### Interior Obstacles
The interior walkable area (Cols 1-17, Rows 1-11) can contain additional obstacles:

### Water & Bushes (Top-Left Area)
- Rows 2-4, cols 1-2: Water tile and surrounding bushes
- Row 2-4, col 5: Bush obstacles

### Rocks & Bushes (Right Side)
- Row 7, cols 14-15: Rock obstacles
- Row 9, cols 12-14: Bush group

## Usage

```typescript
import { COLLISION_MAP, isBlocked } from "../consts/collision-map";

// Check if a position is blocked
const blocked = isBlocked(x, y);

// Access collision map directly
const tileValue = COLLISION_MAP[row][col];
```

## Helper Function

**`isBlocked(x: number, y: number): boolean`**

- Converts pixel coordinates to tile coordinates **with padding offset**
- Returns `true` if the tile is blocked or out of bounds
- Returns `false` if the tile is walkable

**Implementation:**
```typescript
export const isBlocked = (x: number, y: number): boolean => {
  // Account for character center offset (character is centered in tile)
  const centerX = x + TILE_SIZE / 2;
  const centerY = y + TILE_SIZE / 2;
  
  // Add TILE_SIZE offset to account for 1 tile of padding in the collision map
  // This makes collision map (0,0) represent the area BEFORE the tilemap
  // Use COLLISION_SUB_TILE_SIZE (16px) for 4x granularity
  const col = Math.floor((centerX + TILE_SIZE) / COLLISION_SUB_TILE_SIZE);
  const row = Math.floor((centerY + TILE_SIZE) / COLLISION_SUB_TILE_SIZE);
  
  if (row < 0 || row >= COLLISION_ROWS || col < 0 || col >= COLLISION_COLS) {
    return true; // Out of bounds
  }
  
  return COLLISION_MAP[row][col] === 1;
};
```

**Key aspects:**
1. **Character center offset**: `+ TILE_SIZE / 2` accounts for hero being centered in their tile
2. **Padding offset**: `+ TILE_SIZE` in the division shifts the coordinate system by 1 tile (32px)
3. **Sub-tile granularity**: Division by `COLLISION_SUB_TILE_SIZE` (16px) provides 4x precision
4. **Bounds checking**: Positions outside the collision map array are always blocked

## Debug Visualization

The `CollisionDebug` component renders red borders around blocked sub-tiles (16×16 cells). It also uses the padding offset:

```typescript
// Render blocked sub-tiles with -TILE_SIZE offset to match coordinate system
g.drawRect(
  colIndex * COLLISION_SUB_TILE_SIZE + OFFSET_X - TILE_SIZE,
  rowIndex * COLLISION_SUB_TILE_SIZE + OFFSET_Y - TILE_SIZE,
  COLLISION_SUB_TILE_SIZE,
  COLLISION_SUB_TILE_SIZE
);
```

This ensures the debug visualization matches where collisions actually occur in the game world. Each red border represents a 16×16 pixel collision cell.

## Coordinate Mapping Examples

| World Position (x, y) | Collision Map [row][col] | Result |
|----------------------|--------------------------|---------|
| (-32, -16) | [0][0] | Blocked (top-left padding) |
| (0, 16) | [2][2] | Depends (top-left of tilemap) |
| (256, 160) | [12][18] | Depends (center of tilemap) |
| (512, 336) | [22][34] | Depends (bottom-right of tilemap) |
| (544, 352) | [24][36] | Blocked (bottom-right padding) |

**Note:** With 4x granularity, each visual tile position maps to 4 collision cells. The examples above show the top-left collision cell of each tile.

## Adding Custom Obstacles

The collision map is automatically generated from the original tile-based map. To add custom obstacles with precise control, you can modify the `ORIGINAL_COLLISION_MAP` in `collision-map.ts`, or directly edit the expanded `COLLISION_MAP` for fine-grained control.

**For tile-based obstacles** (modify `ORIGINAL_COLLISION_MAP`):
```typescript
const ORIGINAL_COLLISION_MAP: number[][] = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Top boundary
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // Added obstacle
  [1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // Added obstacle
  // ... rest of map
];
```

**For sub-tile precision** (modify `COLLISION_MAP` directly after expansion):
```typescript
// Example: Block only the top-left quarter of a tile
// If tile is at row 3, col 5 in original map:
// That becomes rows 6-7, cols 10-11 in collision map
COLLISION_MAP[6][10] = 1;  // Top-left sub-tile blocked
COLLISION_MAP[6][11] = 0;  // Top-right sub-tile walkable
COLLISION_MAP[7][10] = 0;  // Bottom-left sub-tile walkable
COLLISION_MAP[7][11] = 0;  // Bottom-right sub-tile walkable
```

**Important rules:**
1. ⚠️ **Never modify** Rows 0-1, Rows 24-25, Cols 0-1, or Cols 36-37 (boundaries must stay blocked)
2. ✅ Only modify the interior: Rows 2-23, Cols 2-35
3. ✅ Use 1 for obstacles, 0 for walkable areas
4. ✅ Each visual tile (32×32) = 4 collision cells (16×16 each)
5. ✅ Match the obstacle positions with your tilemap visuals

**Example: Adding a partial obstacle (half a tile):**
```typescript
// Block left half of a tile at original position (row 3, col 5)
// Original tile maps to collision cells: rows 6-7, cols 10-11
COLLISION_MAP[6][10] = 1;  // Top-left blocked
COLLISION_MAP[7][10] = 1;  // Bottom-left blocked
COLLISION_MAP[6][11] = 0;  // Top-right walkable
COLLISION_MAP[7][11] = 0;  // Bottom-right walkable
```

## Troubleshooting

### Hero walks through obstacles
- Check that the collision map has `1` at the correct row/column
- Remember: Row/Col indices include the padding offset (2 rows/cols = 1 tile)
- Use `CollisionDebug` component to visualize blocked sub-tiles
- With 4x granularity, you may need to block multiple adjacent cells

### Hero can't reach edge of map
- Ensure only Rows 0-1, Rows 24-25, Cols 0-1, and Cols 36-37 are fully blocked
- Check that Rows 2-23, Cols 2-35 have `0` values (except for obstacles)

### Collision debug doesn't align with tilemap
- Verify `CollisionDebug` uses the `-TILE_SIZE` offset
- Check that `OFFSET_X` and `OFFSET_Y` match between Level and CollisionDebug

### Hero walks off the map
- Verify the boundary frame is complete (all 1s on edges)
- Check that `isBlocked()` includes the `+ TILE_SIZE` offset
- Ensure bounds checking in `isBlocked()` returns `true` for out-of-bounds

## Notes

- Coordinates are in pixels and automatically converted to sub-tile indices (16×16 cells)
- The **padding offset** shifts the collision map by 1 tile (32px) in all directions
- **4x granularity**: Each visual tile (32×32) is divided into 4 collision cells (16×16 each)
- Out-of-bounds positions are always considered blocked
- The collision map validates against `COLLISION_ROWS` and `COLLISION_COLS` constants on load
- Hero can walk right up to visible edges thanks to the padding boundary system
- Use `CollisionDebug` component during development to visualize the collision map
- The collision map is automatically expanded from the original tile-based map for backward compatibility
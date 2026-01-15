# Collision Map

The collision map defines which tiles in the game world can be walked on and which are blocked by obstacles.

## Structure

- **Dimensions**: 19 columns × 13 rows (matching `COLS` and `ROWS` constants)
- **Tile Size**: 32×32 pixels
- **Data Format**: 2D array of numbers

## Collision Values

- `0` = **Walkable** - Player can move through this tile
- `1` = **Blocked** - Impassable obstacle (walls, water, bushes, rocks)

## Visual Diagram

```
┌─────────────────────────────────────────┐
│ 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 │ Row 0 (Top padding)
│ 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 │ Row 1
│ 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 │ Row 2
│ 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 │ Row 3
│ 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 │ Row 4
│ 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 │ Row 5
│ 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 │ Row 6
│ 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 │ Row 7
│ 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 │ Row 8
│ 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 │ Row 9
│ 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 │ Row 10
│ 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 │ Row 11
│ 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 │ Row 12 (Bottom padding)
└─────────────────────────────────────────┘
  ↑                                     ↑
Col 0                                 Col 18
(Left padding)                   (Right padding)

Legend:
  1 = Blocked tile (red border in debug)
  0 = Walkable tile
  
Visible Tilemap Area: Rows 1-11, Cols 1-17
Padding Boundaries: Row 0, Row 12, Col 0, Col 18
```

## Padding and Boundary System

The collision map uses **1 tile of padding** on all sides to create an invisible boundary that prevents the hero from walking off the map. This padding allows the hero to walk right up to the edges of the visible tilemap without falling off.

### Coordinate Offset System

The collision map is **offset** from the visible tilemap by 1 tile:

```
Collision Map (0,0) → World Position (-32, -16)  [Outside tilemap]
Collision Map (1,1) → World Position (0, 16)     [Top-left of visible tilemap]
```

This offset is implemented in the `isBlocked()` function:

```typescript
const col = Math.floor((centerX + TILE_SIZE) / TILE_SIZE);
const row = Math.floor((centerY + TILE_SIZE) / TILE_SIZE);
```

The `+ TILE_SIZE` shifts the coordinate system so the collision map's first row/column represents the area **outside** the visible tilemap.

### Boundary Frame Structure

```
Row 0:     [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]  ← Top boundary (outside tilemap)
Rows 1-11: [1,0,0,0,0,... walkable ...0,0,0,0,0,1]  ← Left/Right boundaries
Row 12:    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]  ← Bottom boundary (outside tilemap)
           ↑                                     ↑
         Col 0                                 Col 18
       (Left boundary)                    (Right boundary)
```

**Boundary regions:**
- **Row 0**: Top padding boundary (outside visible tilemap)
- **Row 12**: Bottom padding boundary (outside visible tilemap)
- **Col 0** (Rows 1-11): Left padding boundary
- **Col 18** (Rows 1-11): Right padding boundary
- **Cols 1-17, Rows 1-11**: Walkable interior (17×11 = 187 tiles)

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
  const col = Math.floor((centerX + TILE_SIZE) / TILE_SIZE);
  const row = Math.floor((centerY + TILE_SIZE) / TILE_SIZE);
  
  if (row < 0 || row >= ROWS || col < 0 || col >= COLS) {
    return true; // Out of bounds
  }
  
  return COLLISION_MAP[row][col] === 1;
};
```

**Key aspects:**
1. **Character center offset**: `+ TILE_SIZE / 2` accounts for hero being centered in their tile
2. **Padding offset**: `+ TILE_SIZE` in the division shifts the coordinate system by 1 tile
3. **Bounds checking**: Positions outside the collision map array are always blocked

## Debug Visualization

The `CollisionDebug` component renders red borders around blocked tiles. It also uses the padding offset:

```typescript
// Render blocked tiles with -TILE_SIZE offset to match coordinate system
g.drawRect(
  colIndex * TILE_SIZE + OFFSET_X - TILE_SIZE,
  rowIndex * TILE_SIZE + OFFSET_Y - TILE_SIZE,
  TILE_SIZE,
  TILE_SIZE
);
```

This ensures the debug visualization matches where collisions actually occur in the game world.

## Coordinate Mapping Examples

| World Position (x, y) | Collision Map [row][col] | Result |
|----------------------|--------------------------|---------|
| (-32, -16) | [0][0] | Blocked (top-left padding) |
| (0, 16) | [1][1] | Depends (top-left of tilemap) |
| (256, 160) | [6][9] | Depends (center of tilemap) |
| (512, 336) | [11][17] | Depends (bottom-right of tilemap) |
| (544, 352) | [12][18] | Blocked (bottom-right padding) |

## Adding Custom Obstacles

To add obstacles within the walkable area, modify the collision map matrix:

```typescript
export const COLLISION_MAP: number[][] = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Top boundary
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // Added obstacle
  [1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // Added obstacle
  // ... rest of map
];
```

**Important rules:**
1. ⚠️ **Never modify** Row 0, Row 12, Col 0, or Col 18 (boundaries must stay blocked)
2. ✅ Only modify the interior: Rows 1-11, Cols 1-17
3. ✅ Use 1 for obstacles, 0 for walkable areas
4. ✅ Match the obstacle positions with your tilemap visuals

**Example: Adding a 2×2 rock at position (3, 5):**
```typescript
// Row 3, Cols 5-6 = top of rock
[1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
// Row 4, Cols 5-6 = bottom of rock
[1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
```

## Troubleshooting

### Hero walks through obstacles
- Check that the collision map has `1` at the correct row/column
- Remember: Row/Col indices include the padding offset
- Use `CollisionDebug` component to visualize blocked tiles

### Hero can't reach edge of map
- Ensure only Row 0, Row 12, Col 0, and Col 18 are fully blocked
- Check that Rows 1-11, Cols 1-17 have `0` values (except for obstacles)

### Collision debug doesn't align with tilemap
- Verify `CollisionDebug` uses the `-TILE_SIZE` offset
- Check that `OFFSET_X` and `OFFSET_Y` match between Level and CollisionDebug

### Hero walks off the map
- Verify the boundary frame is complete (all 1s on edges)
- Check that `isBlocked()` includes the `+ TILE_SIZE` offset
- Ensure bounds checking in `isBlocked()` returns `true` for out-of-bounds

## Notes

- Coordinates are in pixels and automatically converted to tile indices
- The **padding offset** shifts the collision map by 1 tile in all directions
- Out-of-bounds positions are always considered blocked
- The collision map validates against `ROWS` and `COLS` constants on load
- Hero can walk right up to visible edges thanks to the padding boundary system
- Use `CollisionDebug` component during development to visualize the collision map

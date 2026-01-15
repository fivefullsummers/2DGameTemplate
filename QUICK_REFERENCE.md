# HeroAnimated Quick Reference

## Essential Configuration

### Location: `src/components/HeroAnimated.tsx`

```typescript
// FRAME DIMENSIONS (lines 10-11)
const FRAME_WIDTH = 64;   // Width of each sprite frame
const FRAME_HEIGHT = 64;  // Height of each sprite frame

// ANIMATION SHEET CONFIGURATION (lines 14-39)
interface AnimationSheet {
  asset: string;             // Path to sprite sheet image
  frameSequence: number[];   // Frames to play in order
  idleFrame: number | null;  // Idle/standing frame (null if none)
  framesPerStep: number;     // Frames per step cycle
  speed: number;             // Animation speed multiplier
}

const ANIMATION_SHEETS: Record<string, AnimationSheet> = {
  idle: {
    asset: heroIdleAsset,
    frameSequence: [0, 0, 1],  // Subtle breathing animation
    idleFrame: 0,
    framesPerStep: 1,
    speed: 0.08,           // Very slow
  },
  walk: {
    asset: heroWalkAsset,
    frameSequence: [1, 2, 3, 4, 5, 6, 7, 8],  // Frames 1-8
    idleFrame: 0,          // Frame 0 is standing pose
    framesPerStep: 3,
    speed: 0.15,
  },
  run: {
    asset: heroRunAsset,
    frameSequence: [0, 1, 2, 3, 4, 5, 6, 7],  // Frames 0-7
    idleFrame: null,       // No idle in run.png
    framesPerStep: 2,
    speed: 0.25,           // Faster than walk
  },
};

// ANIMATION ROWS (lines 43-50) - Which row for each direction
const ANIMATIONS = {
  UP: 0,     // Row 0: walking up
  LEFT: 1,   // Row 1: walking left  
  DOWN: 2,   // Row 2: walking down
  RIGHT: 3,  // Row 3: walking right
};

// RENDERING (lines ~220-226)
<Sprite
  texture={currentTexture}
  x={position.x + TILE_SIZE / 2}  // Center horizontally in tile
  y={position.y + TILE_SIZE / 2}  // Center vertically in tile
  scale={0.5}   // Scale 64px sprite to fit 32px tile
  anchor={0.5}  // Center the sprite's pivot point
/>
```

## Common Adjustments

| What to Change | Property | Options |
|---------------|----------|---------|
| **Idle animation speed** | `idle.speed` | `0.05` very slow, `0.08` normal, `0.15` faster |
| **Walk animation speed** | `walk.speed` | `0.05` slow, `0.15` normal, `0.3` fast |
| **Run animation speed** | `run.speed` | `0.15` slow, `0.25` normal, `0.4` fast |
| **Idle frame sequence** | `idle.frameSequence` | `[0,0,1]` breathing, `[0,1,2]` more motion |
| **Walk step size** | `walk.framesPerStep` | `2` quick, `3` default, `4` long |
| **Run step size** | `run.framesPerStep` | `1` quick, `2` default, `3` long |
| **Sprite scale** | `scale` | `0.5` small, `1` normal, `2` large |
| **Frame dimensions** | `FRAME_WIDTH/HEIGHT` | `16`, `32`, `64`, `128` |
| **Walk frame sequence** | `walk.frameSequence` | `[1,2,3,4,5,6,7,8]` or custom |
| **Run frame sequence** | `run.frameSequence` | `[0,1,2,3,4,5,6,7]` or custom |
| **Direction rows** | `ANIMATIONS.UP/DOWN/etc` | Any row number 0-3 |

## Your Current Setup

**Idle Sprite Sheet (idle.png):**
- Dimensions: 192×256 pixels (3 frames × 4 rows)
- Frame size: 64×64 pixels
- Frames 0-1: Breathing animation (frame 0 held twice)
- Rows: 0=Up, 1=Left, 2=Down, 3=Right
- Plays continuously when no input

**Walk Sprite Sheet (walk.png):**
- Dimensions: 832×256 pixels (13 frames × 4 rows)
- Frame size: 64×64 pixels
- Frame 0: Standing pose (fallback)
- Frames 1-8: Walking animation
- Rows: 0=Up, 1=Left, 2=Down, 3=Right

**Run Sprite Sheet (run.png):**
- Dimensions: 512×256 pixels (8 frames × 4 rows)
- Frame size: 64×64 pixels
- Frames 0-7: Running animation
- Rows: 0=Up, 1=Left, 2=Down, 3=Right

**Display:**
- Tile size: 32×32 pixels
- Sprite scale: 0.5 (scales 64px down to 32px)
- Positioning: Centered in tile

**Animation:**
- Idle: 3 frames ([0,0,1]), speed 0.08, loops continuously
- Walk: 8 frames (1-8), speed 0.15, 3 frames/step
- Run: 8 frames (0-7), speed 0.25, 2 frames/step
- Controls: No input = idle, Arrow keys = walk, Shift + Arrows = run

## Troubleshooting

### Animation too fast/slow
```typescript
const ANIMATION_SPEED = 0.10; // Adjust this value (line 14)
```

### Wrong animation for direction
```typescript
// Test each row to find which is which
const ANIMATIONS = {
  UP: 0,    // Try different numbers
  LEFT: 1,  // until animations match
  DOWN: 2,
  RIGHT: 3,
};
```

### Sprite too big/small
```typescript
<Sprite
  scale={0.5}  // Adjust this value (line 152)
/>
```

### Not centered in tile
```typescript
<Sprite
  x={position.x + TILE_SIZE / 2}  // Add tile offset (line 150)
  y={position.y + TILE_SIZE / 2}  // Add tile offset (line 151)
/>
```

### Steps too long/short
```typescript
const FRAMES_PER_STEP = 3; // Change this (line 15)
// Try: 2 (quick), 3 (default), 4 (longer)
```

## File Structure

```
src/
├── components/
│   └── HeroAnimated.tsx           # ← Main animation component
├── utils/
│   └── textureCache.ts            # ← Texture caching system
├── assets/
│   └── hero_anim.png              # ← Your sprite sheet
└── consts/
    └── game-world.ts              # ← TILE_SIZE = 32
```

## How It Works (Simplified)

1. **Start**: Character begins in idle animation (breathing loop)
2. **Load**: Sprite sheets loaded into texture cache (shared by all heroes)
3. **Input**: System detects keyboard input and selects animation sheet
   - No input → idle.png (breathing)
   - Arrow keys → walk.png (walking)
   - Shift + arrows → run.png (running)
4. **Calculate**: Position calculated: `x = frame × 64`, `y = row × 64`
5. **Extract**: Rectangle extracts one 64×64 frame from current sheet
6. **Display**: Frame rendered at 0.5 scale (appears 32×32)
7. **Advance**: Frame increments based on animation speed
8. **Loop**: Animation loops through frameSequence continuously
9. **Transition**: Frame synchronization when switching sheets

## Example Modifications

### Add a new animation sheet (e.g., attack)
```typescript
// 1. Import the sprite sheet
import heroAttackAsset from "../assets/attack.png";

// 2. Add to ANIMATION_SHEETS
const ANIMATION_SHEETS: Record<string, AnimationSheet> = {
  walk: { /* ... */ },
  run: { /* ... */ },
  attack: {
    asset: heroAttackAsset,
    frameSequence: [0, 1, 2, 3, 4, 5],  // 6 frame attack
    idleFrame: null,
    framesPerStep: 6,  // Complete full attack
    speed: 0.3,        // Fast attack
  },
};

// 3. Add trigger logic (example with Space key)
if (pressedKeys.includes("SPACE")) {
  setCurrentSheetName("attack");
}
```

### Change walk animation speed
```typescript
walk: {
  // ...
  speed: 0.25,  // Was 0.15 (faster walking)
}
```

### Use different frames for walking
```typescript
walk: {
  // ...
  frameSequence: [2, 3, 4, 5, 6, 7],  // Skip first/last frames
}
```

### Make run animation slower
```typescript
run: {
  // ...
  speed: 0.18,  // Was 0.25 (slower running)
  framesPerStep: 3,  // Was 2 (longer steps)
}
```

### Use different sprite sheet with 32×32 frames
```typescript
const FRAME_WIDTH = 32;   // Was 64
const FRAME_HEIGHT = 32;  // Was 64

<Sprite scale={1} />  // Was 0.5
```

### Swap left/right animations
```typescript
const ANIMATIONS = {
  UP: 0,
  LEFT: 3,   // Swap these
  DOWN: 2,
  RIGHT: 1,  // Swap these
};
```

### Add repeated frames (slower animation)
```typescript
walk: {
  // ...
  frameSequence: [1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8],  // Each frame twice
}
```

### Change idle breathing pattern
```typescript
idle: {
  // ...
  frameSequence: [0, 1, 2],  // Was [0,0,1] - more active breathing
  speed: 0.12,               // Was 0.08 - faster breathing
}
```

### Make idle completely static (no animation)
```typescript
idle: {
  // ...
  frameSequence: [0],  // Just hold frame 0, no animation
  speed: 0.01,         // Very slow (doesn't matter for single frame)
}
```

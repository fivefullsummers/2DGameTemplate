# Sprite Animation Guide

## What is Sprite Animation?

Sprite animation is a technique where you display a sequence of images (frames) rapidly to create the illusion of movement. Instead of storing each frame as a separate file, we use a **sprite sheet** - a single image containing all animation frames arranged in a grid.

## Two Approaches to Sprite Animation

This guide covers two approaches:
1. **Using AnimatedSprite** (recommended, simpler) - `HeroAnimatedSimple.tsx`
2. **Manual frame management** (educational, more control) - `HeroAnimated.tsx`

## Understanding Sprite Sheets

### Structure
A sprite sheet is organized in a grid:
- **Columns**: Individual frames of animation (time progression)
- **Rows**: Different animations or directions (walk up, walk down, idle, attack, etc.)

Example layout:
```
Row 0: [Frame 0] [Frame 1] [Frame 2] [Frame 3] ... → Walk Down
Row 1: [Frame 0] [Frame 1] [Frame 2] [Frame 3] ... → Walk Left
Row 2: [Frame 0] [Frame 1] [Frame 2] [Frame 3] ... → Walk Right
Row 3: [Frame 0] [Frame 1] [Frame 2] [Frame 3] ... → Walk Up
```

### Benefits
1. **Efficient loading**: One HTTP request instead of dozens
2. **Better performance**: Texture atlasing reduces GPU state changes
3. **Easier organization**: All related animations in one file

## How Sprite Animation Works

### The Core Concept

1. **Load the sprite sheet** as a single texture
2. **Define frame dimensions** (width and height of each frame)
3. **Calculate frame position** using column and row indices
4. **Extract a sub-texture** for the current frame
5. **Display the sub-texture** on screen
6. **Update the frame** over time to create animation

### The Mathematics

To extract a frame from the sprite sheet:

```
Frame X Position = Column Index × Frame Width
Frame Y Position = Row Index × Frame Height
```

For example, to get the 3rd frame (column 2) of the walking down animation (row 0):
```
X = 2 × 32 = 64 pixels from left
Y = 0 × 32 = 0 pixels from top
Width = 32 pixels
Height = 32 pixels
```

## Implementation Breakdown

### 1. Configuration

```typescript
const FRAME_WIDTH = 32;  // Each frame is 32x32 pixels
const FRAME_HEIGHT = 32;
const ANIMATION_SPEED = 0.15; // Controls animation playback speed
```

### 2. Loading the Sprite Sheet

```typescript
const baseTexture = useMemo(() => {
  return PIXI.Texture.from(heroAnimAsset);
}, []);
```

This creates a single texture from the entire sprite sheet image.

### 3. Extracting Individual Frames

```typescript
const currentTexture = useMemo(() => {
  // Calculate position in sprite sheet
  const x = currentFrame * FRAME_WIDTH;
  const y = currentRow * FRAME_HEIGHT;

  // Define the rectangular region to extract
  const rectangle = new PIXI.Rectangle(x, y, FRAME_WIDTH, FRAME_HEIGHT);
  
  // Create a new texture showing only that region
  const texture = new PIXI.Texture(baseTexture.baseTexture, rectangle);
  
  return texture;
}, [baseTexture, currentFrame, currentRow]);
```

**PIXI.Rectangle** defines which portion of the sprite sheet to display:
- `x, y`: Top-left corner of the frame
- `width, height`: Size of the frame

### 4. Frame Animation Loop

The animation loop has two parts:

#### A. Frame Accumulator Pattern

```typescript
const [frameAccumulator, setFrameAccumulator] = useState(0);

setFrameAccumulator((prev) => {
  const newAccumulator = prev + ANIMATION_SPEED * delta;
  
  if (newAccumulator >= 1) {
    setCurrentFrame((frame) => (frame + 1) % 4);
    return 0; // Reset
  }
  
  return newAccumulator;
});
```

**Why use an accumulator?**
- `delta` varies based on frame rate (16ms at 60fps, 33ms at 30fps)
- Direct increment would make animation speed depend on frame rate
- Accumulator ensures consistent animation speed across different devices

**How it works:**
1. Add `ANIMATION_SPEED * delta` to accumulator
2. When accumulator ≥ 1, advance to next frame
3. Reset accumulator to 0
4. This creates frame-rate-independent animation

#### B. Cycling Through Frames

```typescript
setCurrentFrame((frame) => (frame + 1) % 4);
```

The modulo operator (`%`) wraps the frame back to 0:
- Frame 0 → Frame 1 → Frame 2 → Frame 3 → Frame 0 (loops)

### 5. Direction-Based Animation

```typescript
const ANIMATIONS = {
  DOWN: 0,
  LEFT: 1,
  RIGHT: 2,
  UP: 3,
};
```

Each direction maps to a row in the sprite sheet. When movement is detected:

```typescript
if (Math.abs(dx) > Math.abs(dy)) {
  // Horizontal movement dominant
  setCurrentRow(dx > 0 ? ANIMATIONS.RIGHT : ANIMATIONS.LEFT);
} else {
  // Vertical movement dominant
  setCurrentRow(dy > 0 ? ANIMATIONS.DOWN : ANIMATIONS.UP);
}
```

This chooses the appropriate animation row based on the character's direction.

## State Management

The component tracks several pieces of state:

```typescript
const [currentFrame, setCurrentFrame] = useState(0);     // Which column (0-11)
const [currentRow, setCurrentRow] = useState(0);         // Which row (0-7)
const [frameAccumulator, setFrameAccumulator] = useState(0); // Timer for frames
const [isWalking, setIsWalking] = useState(false);       // Is character moving?
```

## Animation Flow Diagram

```
User Input
    ↓
Movement Direction Determined
    ↓
Select Animation Row (UP/DOWN/LEFT/RIGHT)
    ↓
Frame Accumulator Updates (every frame)
    ↓
When Accumulator ≥ 1: Advance Frame
    ↓
Extract Frame from Sprite Sheet
    ↓
Render to Screen
    ↓
Loop back to Frame Accumulator
```

## Key Concepts

### Delta Time
`delta` represents the time elapsed since the last frame. At 60 FPS:
- delta ≈ 1.0
- At 30 FPS: delta ≈ 2.0
- At 120 FPS: delta ≈ 0.5

Multiplying by delta ensures animations run at the same speed regardless of frame rate.

### Texture Atlasing
Instead of creating separate textures for each frame, we create "views" into different parts of one large texture. This is much more efficient for rendering.

### useMemo Optimization
```typescript
const currentTexture = useMemo(() => {
  // Create texture
}, [baseTexture, currentFrame, currentRow]);
```

This prevents recreating the texture every render. Only recreates when `currentFrame` or `currentRow` changes.

## Customization Tips

### Adjusting Animation Speed
```typescript
const ANIMATION_SPEED = 0.15; // Lower = slower, Higher = faster
```

### Using Different Frame Counts
If your walk animation uses 6 frames instead of 4:
```typescript
return (frame + 1) % 6; // Cycle through 0-5
```

### Picking Specific Frame Ranges
Your sprite sheet might have many frames per row, but you only want to use certain ones:

```typescript
const WALK_START_FRAME = 0;  // Start at frame 0
const WALK_END_FRAME = 3;    // End at frame 3 (uses frames 0,1,2,3)
const WALK_FRAME_COUNT = WALK_END_FRAME - WALK_START_FRAME + 1;

// In your frame cycling logic:
setCurrentFrame((frame) => {
  const nextFrame = frame + 1;
  if (nextFrame > WALK_END_FRAME) {
    return WALK_START_FRAME; // Loop back to start
  }
  return nextFrame;
});

// When calculating texture position:
const x = (WALK_START_FRAME + currentFrame) * FRAME_WIDTH;
```

**Example: Using frames 3-6 for walking:**
```typescript
const WALK_START = 3;
const WALK_END = 6;
// Cycle through: 3 → 4 → 5 → 6 → 3 (loops)
return (frame + 1) % (WALK_END - WALK_START + 1) + WALK_START;
```

### Finding the Right Row for Your Animation

Your sprite sheet has multiple rows. To find which row has the animation you want:

**Step 1: Determine frame and row dimensions**
1. Open your sprite sheet in an image editor
2. Measure one sprite (likely 16x16, 32x32, or 64x64 pixels)
3. Update `FRAME_WIDTH` and `FRAME_HEIGHT`

**Step 2: Test each row**
```typescript
const ANIMATIONS = {
  DOWN: 0,   // Try row 0
  LEFT: 1,   // Try row 1
  RIGHT: 2,  // Try row 2
  UP: 3,     // Try row 3
};

// Temporarily lock to one row to test:
const [currentRow] = useState(0); // Test row 0
```

**Step 3: Adjust based on what you see**
- If character walks backwards, swap rows or use different frame ranges
- If character is upside down, you might have the wrong row
- If animation is scrambled, adjust your FRAME_WIDTH/HEIGHT

### Sizing and Positioning

#### Making the Hero Smaller/Larger
```typescript
<Sprite
  scale={2} // Change this number:
            // 1 = original size
            // 0.5 = half size
            // 2 = double size
            // Try: 1, 1.5, 0.75, etc.
/>
```

#### Centering in a Tile
If you're using grid-based movement (like HeroGrid):

```typescript
// Option 1: Offset the sprite position
<Sprite
  x={position.x + TILE_SIZE / 2}  // Center in tile
  y={position.y + TILE_SIZE / 2}
  anchor={0.5}  // Center the sprite's pivot point
/>

// Option 2: Start position aligned to tile grid
const [position, setPosition] = useState({ 
  x: TILE_SIZE / 2,     // Start in center of first tile
  y: TILE_SIZE / 2 
});
```

**Understanding `anchor`:**
- `anchor={0}` - Top-left corner of sprite at x,y position
- `anchor={0.5}` - Center of sprite at x,y position
- `anchor={1}` - Bottom-right corner of sprite at x,y position
- `anchor={[0.5, 1]}` - Centered horizontally, bottom at y position (good for characters!)

#### Quick Sizing Reference
```typescript
// For 32x32 sprite sheet with 32x32 tiles:
scale={1}, anchor={0.5} // Sprite exactly fills tile

// For 16x16 sprite sheet with 32x32 tiles:
scale={2}, anchor={0.5} // Scale up to fill tile

// For 64x64 sprite sheet with 32x32 tiles:
scale={0.5}, anchor={0.5} // Scale down to fit tile
```

### Common Issues & Solutions

#### Issue: Wrong animation plays for direction
**Solution:** Your sprite sheet rows are in a different order. Update the ANIMATIONS mapping:
```typescript
// If LEFT and RIGHT are swapped:
const ANIMATIONS = {
  DOWN: 0,
  RIGHT: 1,  // Swap these
  LEFT: 2,   // Swap these
  UP: 3,
};
```

#### Issue: Animation plays in reverse
**Solution:** Reverse the frame order or use negative increment:
```typescript
// Option 1: Start from end and go backwards
return frame === 0 ? 3 : frame - 1; // 3 → 2 → 1 → 0

// Option 2: Reverse your frame extraction
const x = (FRAME_COUNT - 1 - currentFrame) * FRAME_WIDTH;
```

#### Issue: Character slides without animating
**Solution:** Check that `isWalking` is being set correctly:
```typescript
console.log('Is Walking:', isWalking); // Add debug log
```

#### Issue: Animation too fast/slow
**Solution:** Adjust ANIMATION_SPEED:
```typescript
const ANIMATION_SPEED = 0.15; // Try 0.05 to 0.3
// Lower = slower, Higher = faster
```

### Adding More Animations
```typescript
const ANIMATIONS = {
  // ... existing animations
  ATTACK: 4,  // Add new row
  JUMP: 5,    // Add new row
};
```

### Idle Animations
When the character stops moving, you can:
1. Show frame 0 of the direction (static)
2. Use a separate idle animation row with breathing/blinking

## Common Patterns

### Start/End Frames
If you only want to use frames 2-5 of a row:
```typescript
const startFrame = 2;
const endFrame = 5;
const frameCount = endFrame - startFrame + 1;

setCurrentFrame((frame) => {
  const nextFrame = frame + 1;
  if (nextFrame > endFrame) return startFrame;
  return nextFrame;
});
```

### One-Shot Animations
For animations that play once (like attacking):
```typescript
setCurrentFrame((frame) => {
  if (frame >= maxFrame) {
    setAnimationComplete(true);
    return maxFrame; // Stay on last frame
  }
  return frame + 1;
});
```

## Performance Considerations

1. **Sprite sheet size**: Keep under 2048x2048 for compatibility
2. **Frame count**: More frames = smoother animation but larger file
3. **Texture updates**: Only update when frame changes (use useMemo)
4. **Power of 2**: Use dimensions like 32x32, 64x64 for better GPU performance

## Debugging Tips

### Visualize Current Frame
```typescript
console.log(`Row: ${currentRow}, Frame: ${currentFrame}`);
```

### Show Frame Boundaries
Draw a border around the sprite to verify frame extraction:
```typescript
<Graphics
  draw={(g) => {
    g.lineStyle(2, 0xff0000);
    g.drawRect(position.x, position.y, FRAME_WIDTH, FRAME_HEIGHT);
  }}
/>
```

### Slow Down Animation
Set `ANIMATION_SPEED = 0.05` to see individual frames clearly.

## Approach 1: Using AnimatedSprite (Recommended)

PixiJS provides a built-in `AnimatedSprite` component that handles frame cycling automatically. This is the **simpler and recommended approach** for most use cases.

### Implementation

```typescript
import { AnimatedSprite } from "@pixi/react";

// Create array of textures for animation
const animationTextures = useMemo(() => {
  const frames = [];
  for (let i = 0; i < frameCount; i++) {
    const x = i * FRAME_WIDTH;
    const y = row * FRAME_HEIGHT;
    const rectangle = new PIXI.Rectangle(x, y, FRAME_WIDTH, FRAME_HEIGHT);
    frames.push(new PIXI.Texture(baseTexture.baseTexture, rectangle));
  }
  return frames;
}, [baseTexture]);

// Use AnimatedSprite
<AnimatedSprite
  textures={animationTextures}
  isPlaying={isWalking}
  animationSpeed={8 / 60} // 8 FPS
  x={position.x}
  y={position.y}
/>
```

### Key Props

- **textures**: Array of PIXI.Texture objects for the animation
- **isPlaying**: Boolean to start/stop animation
- **animationSpeed**: Speed multiplier (0-1 scale, where 1 = 60 FPS)
- **loop**: Whether to loop (default: true)
- **onComplete**: Callback when animation finishes (for non-looping)

### Advantages
- ✅ Automatic frame cycling
- ✅ Built-in play/pause control
- ✅ Less boilerplate code
- ✅ Handles looping automatically
- ✅ No manual frame accumulator needed

### When to Use
- Standard looping animations (walking, running, idle)
- When you want simple, clean code
- When you don't need frame-by-frame control

## Approach 2: Manual Frame Management

The manual approach gives you complete control over frame selection and timing. This is useful for complex animation logic.

### Advantages
- ✅ Full control over frame selection
- ✅ Can create complex animation logic
- ✅ Can mix different frame ranges
- ✅ Better for state machines

### When to Use
- Complex animation sequences
- When you need to skip frames or reverse
- Custom animation timing logic
- Learning how animations work under the hood

### Comparison

| Feature | AnimatedSprite | Manual |
|---------|---------------|--------|
| Ease of use | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| Control | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Code length | Short | Longer |
| Performance | Optimized | Same |
| Best for | Standard animations | Complex logic |

## Converting FPS to Animation Speed

AnimatedSprite uses a 0-1 scale where 1.0 = 60 FPS:

```typescript
const fps = 8; // Desired frames per second
const animationSpeed = fps / 60; // Convert to PixiJS scale
```

Examples:
- 6 FPS = 0.1 (slow walking)
- 12 FPS = 0.2 (normal walking)
- 30 FPS = 0.5 (fast action)
- 60 FPS = 1.0 (very smooth)

## Summary

Sprite animation works by:
1. Loading a sprite sheet (grid of images)
2. Extracting frames using rectangles to create texture arrays
3. Either:
   - **Simple**: Pass textures to AnimatedSprite and let it handle cycling
   - **Advanced**: Manually update which frame to display each tick
4. The animation creates the illusion of motion - like a flip book!

**Recommendation**: Start with `AnimatedSprite` for cleaner code. Use manual approach only when you need special control over frame selection logic.

---

## LPC (Liberated Pixel Cup) Sprite Sheet Format

Your `hero_anim.png` is an **LPC Universal Spritesheet**. This is a standardized format with specific dimensions and layout.

### ⚠️ IMPORTANT: Your Sprite Sheet Type

**Your sprite sheet dimensions: 832×256 pixels**
- **4 rows only** (limited version with just walk animations)
- **13 frames per row**
- Rows 0-3: Walk animations (Up, Left, Down, Right)

**Full LPC sheets:** 832×1344 pixels (21 rows with multiple animation types)

### Critical Specifications

**Frame Dimensions:**
- Each frame: **64×64 pixels** (NOT 32×32!)
- Your TILE_SIZE: **32×32 pixels**
- **Required scale: 0.5** to fit character in tiles

**Correct Configuration:**
```typescript
const FRAME_WIDTH = 64;   // LPC standard frame size
const FRAME_HEIGHT = 64;  // LPC standard frame size

// In your Sprite component:
<Sprite
  scale={0.5}  // Scale down 64px sprite to fit 32px tile
  anchor={0.5} // Center the sprite
/>
```

### LPC Standard Animation Layout (Full Version)

**Note: Your sprite sheet is a LIMITED version with only 4 rows!**

The FULL LPC sprite sheet has **21 rows** with different animations:

| Rows | Animation | Frames | Description |
|------|-----------|--------|-------------|
| 0-3 | **Spellcast** | 7 frames | Up, Left, Down, Right |
| 4-7 | **Walk** | 9 frames | Up, Left, Down, Right |
| 8-11 | **Slash** | 6 frames | Up, Left, Down, Right |
| 12-15 | **Shoot** | 13 frames | Up, Left, Down, Right |
| 16-19 | **Thrust** | 8 frames | Up, Left, Down, Right |
| 20 | **Hurt** | 6 frames | Universal hurt animation |

### Your Limited Sprite Sheet (4 rows only)

**Your sprite sheet dimensions: 832x256 pixels**
- Width: 832px = 13 frames (64px each)
- Height: 256px = 4 rows (64px each)

**Walk animation uses rows 0-3:**
- Row 0: Walk UP
- Row 1: Walk LEFT  
- Row 2: Walk DOWN
- Row 3: Walk RIGHT

**9 frames per direction** (frames 0-8)

### Walk Animation Details (Full LPC - 21 rows)

In full LPC sheets, walk animation uses rows 4-7, but your sheet only has the walk animations in rows 0-3.

**Correct ANIMATIONS configuration for walking (limited 4-row sheet):**
```typescript
const ANIMATIONS = {
  UP: 0,     // Row 0
  LEFT: 1,   // Row 1
  DOWN: 2,   // Row 2
  RIGHT: 3,  // Row 3
};

// Update frame cycling to use 9 frames:
return (frame + 1) % 9; // Cycle through 0-8
```

**For full 21-row LPC sheets, use:**
```typescript
const ANIMATIONS = {
  UP: 4,     // Row 4
  LEFT: 5,   // Row 5
  DOWN: 6,   // Row 6
  RIGHT: 7,  // Row 7
};
```

### Optimized Walk Animation (Use Middle Frames)

LPC walk has 9 frames, but typically you only use the **middle 6-7 frames** for smoother looping:

```typescript
const WALK_START_FRAME = 1;  // Skip first frame
const WALK_END_FRAME = 7;    // Skip last frame
const WALK_FRAME_COUNT = WALK_END_FRAME - WALK_START_FRAME + 1; // 7 frames

// Update your currentTexture calculation (around line 44):
const x = (WALK_START_FRAME + currentFrame) * FRAME_WIDTH;
const y = currentRow * FRAME_HEIGHT;

// Update frame cycling (around line 113):
return (frame + 1) % WALK_FRAME_COUNT; // Cycles 0-6
```

### Idle Animations

LPC sheets typically use **frame 0 or 1** of each direction for idle:

```typescript
const ANIMATIONS = {
  // Walking
  WALK_UP: 4,
  WALK_LEFT: 5,
  WALK_DOWN: 6,
  WALK_RIGHT: 7,
  
  // Idle (same rows, just stay on frame 0)
  IDLE_UP: 4,
  IDLE_LEFT: 5,
  IDLE_DOWN: 6,
  IDLE_RIGHT: 7,
};

// When idle, lock to frame 0:
if (!isWalking) {
  setCurrentFrame(0);
}
```

### Character Positioning for LPC

**Centering a 64×64 sprite in a 32×32 tile:**

```typescript
// Option 1: Offset position
<Sprite
  x={position.x + TILE_SIZE / 2}  // Center horizontally
  y={position.y + TILE_SIZE / 2}  // Center vertically
  scale={0.5}
  anchor={0.5}
/>

// Option 2: Bottom-centered (character's feet at tile bottom)
<Sprite
  x={position.x + TILE_SIZE / 2}
  y={position.y + TILE_SIZE}  // Align to bottom of tile
  scale={0.5}
  anchor={[0.5, 1]}  // Anchor at bottom center
/>
```

### Complete Working Configuration (for your 4-row sheet)

```typescript
// At the top of HeroAnimated.tsx
const FRAME_WIDTH = 64;   // LPC frame size
const FRAME_HEIGHT = 64;
const ANIMATION_SPEED = 0.15;

// Walk animation frames (using middle frames for smooth loop)
const WALK_START_FRAME = 1;
const WALK_END_FRAME = 7;
const WALK_FRAME_COUNT = WALK_END_FRAME - WALK_START_FRAME + 1;

// Your sprite sheet only has 4 rows (0-3)
const ANIMATIONS = {
  UP: 0,     // Row 0
  LEFT: 1,   // Row 1
  DOWN: 2,   // Row 2
  RIGHT: 3,  // Row 3
  IDLE_UP: 0,
  IDLE_LEFT: 1,
  IDLE_DOWN: 2,
  IDLE_RIGHT: 3,
};

// In currentTexture calculation:
const x = (isWalking ? WALK_START_FRAME + currentFrame : 0) * FRAME_WIDTH;

// In frame cycling:
return (frame + 1) % WALK_FRAME_COUNT;

// In render:
<Sprite
  texture={currentTexture}
  x={position.x + TILE_SIZE / 2}
  y={position.y + TILE_SIZE / 2}
  scale={0.5}  // Scale 64px to 32px
  anchor={0.5}
/>
```

### Other Available Animations

**Your sprite sheet (4 rows) only has walk animations.**

For full LPC sheets (21 rows), you can add these other animations:

```typescript
const ANIMATIONS = {
  // Spellcast (rows 0-3, 7 frames)
  SPELLCAST_UP: 0,
  SPELLCAST_LEFT: 1,
  SPELLCAST_DOWN: 2,
  SPELLCAST_RIGHT: 3,
  
  // Walk (rows 4-7, 9 frames)
  WALK_UP: 4,
  WALK_LEFT: 5,
  WALK_DOWN: 6,
  WALK_RIGHT: 7,
  
  // Slash attack (rows 8-11, 6 frames)
  SLASH_UP: 8,
  SLASH_LEFT: 9,
  SLASH_DOWN: 10,
  SLASH_RIGHT: 11,
  
  // Shoot bow (rows 12-15, 13 frames)
  SHOOT_UP: 12,
  SHOOT_LEFT: 13,
  SHOOT_DOWN: 14,
  SHOOT_RIGHT: 15,
  
  // Hurt (row 20, 6 frames)
  HURT: 20,
};
```

**To use full LPC sheets with all animations, download from:**
- https://sanderfrenken.github.io/Universal-LPC-Spritesheet-Character-Generator/

---

## Troubleshooting Your Current Setup

### Problem: Hero is Too Big

**Location:** Line 132 in `HeroAnimated.tsx`

```typescript
<Sprite
  scale={2} // ← CHANGE THIS NUMBER
  anchor={0.5}
/>
```

**Try these values:**
- `scale={1}` - Original sprite size
- `scale={0.5}` - Half size
- `scale={1.5}` - 50% larger

### Problem: Hero Not Centered in Tile

**Location:** Lines 131-132 in `HeroAnimated.tsx`

**Current Code:**
```typescript
x={position.x}
y={position.y}
```

**Fix Option 1 - Offset the rendering:**
```typescript
x={position.x + TILE_SIZE / 2}  // Add this to center in tile
y={position.y + TILE_SIZE / 2}  // Add this to center in tile
```

**Fix Option 2 - Change starting position (Line 30):**
```typescript
const [position, setPosition] = useState({ 
  x: TILE_SIZE / 2,  // Start centered in first tile
  y: TILE_SIZE / 2 
});
```

### Problem: Wrong Images Animate When Moving

**Location:** Lines 16-25 in `HeroAnimated.tsx`

```typescript
const ANIMATIONS = {
  DOWN: 0,   // ← These numbers are ROW numbers
  LEFT: 1,   // ← Change these to match your sprite sheet
  RIGHT: 2,
  UP: 3,
  IDLE_DOWN: 4,
  IDLE_LEFT: 5,
  IDLE_RIGHT: 6,
  IDLE_UP: 7,
};
```

**How to find the right rows:**

1. **Temporarily lock the animation to one row** (Line 32):
```typescript
// Comment out the original line and test with a fixed row:
// const [currentRow, setCurrentRow] = useState(ANIMATIONS.IDLE_DOWN);
const [currentRow, setCurrentRow] = useState(0); // Test row 0
```

2. **Test each row:**
   - Set `useState(0)` - Press arrow keys, see what animates
   - Set `useState(1)` - Press arrow keys, see what animates  
   - Set `useState(2)` - Press arrow keys, see what animates
   - Continue until you find which row = which direction

3. **Update the ANIMATIONS mapping** based on what you found:
```typescript
// Example: If you found row 2 is walking down:
const ANIMATIONS = {
  DOWN: 2,  // ← Update with your findings
  LEFT: 0,
  RIGHT: 1,
  UP: 3,
  // ... etc
};
```

### Problem: Using Specific Frames (Not All 12)

**Location:** Line 113 in `HeroAnimated.tsx`

```typescript
return (frame + 1) % 4; // ← This cycles through frames 0,1,2,3
```

**To use different frames:**

```typescript
// Use frames 0-5 (6 frames):
return (frame + 1) % 6;

// Use frames 2-5 only:
const START = 2;
const END = 5;
const x = (START + currentFrame) * FRAME_WIDTH; // Line 44
return (frame + 1) % (END - START + 1); // Line 113
```

**To see which frames you're using, add debug:**
```typescript
// Add after line 44:
console.log(`Frame: ${currentFrame}, Row: ${currentRow}`);
```

### Quick Debug Checklist

Add these temporary logs to understand what's happening:

```typescript
// Line 45 - See which part of sprite sheet is being shown:
console.log(`X: ${x}, Y: ${y}, Frame: ${currentFrame}, Row: ${currentRow}`);

// Line 75 - See if movement is detected:
console.log(`Moving: ${moving}, dx: ${dx}, dy: ${dy}`);

// Line 86 - See which direction is chosen:
console.log(`Direction chosen: ${dx > 0 ? 'RIGHT' : 'LEFT'}`);
```

### Summary of Key Lines to Modify

| Issue | File Location | What to Change |
|-------|---------------|----------------|
| Size too big | Line 132 | `scale={2}` → **`scale={0.5}`** for LPC |
| Not centered | Lines 131-132 | Add `+ TILE_SIZE/2` to x and y |
| Wrong animation | Lines 16-25 | Walk = rows 4-7, NOT 0-3 |
| Wrong frames used | Line 113 | Change `% 4` to `% 9` (or `% 7` for optimized) |
| Frame size wrong | Lines 8-9 | **Must be 64×64 for LPC sprites** |

### Quick Fix for Your Limited LPC Sprite (4 rows)

**Your sprite sheet: 832x256 pixels = 13 frames × 4 rows**

**Change these exact lines in HeroAnimated.tsx:**

```typescript
// Lines 8-9: Frame size
const FRAME_WIDTH = 64;   // Change from 32
const FRAME_HEIGHT = 64;  // Change from 32

// Lines 16-23: Animation rows (LIMITED SHEET - rows 0-3 only!)
const ANIMATIONS = {
  UP: 0,     // Row 0: walking up
  LEFT: 1,   // Row 1: walking left
  DOWN: 2,   // Row 2: walking down
  RIGHT: 3,  // Row 3: walking right
  IDLE_UP: 0,
  IDLE_LEFT: 1,
  IDLE_DOWN: 2,
  IDLE_RIGHT: 3,
};

// Line 113: Frame count
return (frame + 1) % 9; // LPC walk has 9 frames

// Line 132: Scale
scale={0.5}  // Scale down to fit 32px tile
```

**Note:** Full LPC sheets use rows 4-7 for walking, but your sheet only has rows 0-3.

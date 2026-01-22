# Collision Debug Visualization

## Overview
Visual debugging tool to display collision boundaries around the player and enemies. This helps you verify and adjust collision detection sizes.

---

## How to Use

### Toggle Collision Boundaries
**Press the `C` key** to show/hide collision boundaries.

### What You'll See

#### Player (Green Circle)
- **Green outline circle** - Shows the collision radius around the player
- **Green filled area** - Semi-transparent zone indicating collision area
- **Center crosshair** - Shows the exact player position

#### Enemies (Red Circles)
- **Red outline circles** - Show collision radius around each enemy
- **Red filled areas** - Semi-transparent zones indicating collision areas
- **Center dots** - Show exact enemy positions

#### Info Panel (Top-Left)
Displays collision size information:
- Player radius and diameter
- Enemy radius and diameter
- Color-coded indicators
- Toggle instructions

---

## Current Collision Sizes

### Player
- **Radius**: 16.0 pixels (TILE_SIZE / 2)
- **Diameter**: 32.0 pixels
- **Color**: Green (#00ff00)

### Enemies
- **Radius**: 4.8 pixels ((TILE_SIZE * ENEMY_SCALE) / 2)
  - TILE_SIZE = 32 pixels
  - ENEMY_SCALE = 0.3 (30%)
  - Radius = (32 * 0.3) / 2 = 4.8 pixels
- **Diameter**: 9.6 pixels
- **Color**: Red (#ff0000)

---

## Collision Detection Logic

### Player Hit by Enemy Bullet
Location: `src/components/EnemyBullet.tsx` (line 76-83)
```typescript
const playerRadius = TILE_SIZE / 2;        // 16 pixels
const bulletRadius = 8;                     // 8 pixels
const distance = Math.sqrt(dx * dx + dy * dy);

if (distance < bulletRadius + playerRadius) {
  // Hit detected at 24 pixels (8 + 16)
}
```

### Enemy Hit by Player Bullet
Location: `src/components/Bullet.tsx` (line 142-149)
```typescript
const enemyRadius = (TILE_SIZE * ENEMY_SCALE) / 2;  // 4.8 pixels
const bulletRadius = (frameWidth * scale) / 2;       // Varies by bullet type
const distance = Math.sqrt(dx * dx + dy * dy);

if (distance < bulletRadius + enemyRadius) {
  // Hit detected
}
```

---

## Adjusting Collision Sizes

### To Make Player Hitbox Larger/Smaller
Modify the player radius calculation in collision detection:
```typescript
// In EnemyBullet.tsx
const playerRadius = TILE_SIZE / 2;  // Change divisor (smaller = larger hitbox)
```

### To Make Enemy Hitbox Larger/Smaller
Modify `ENEMY_SCALE` constant:
```typescript
// In src/consts/enemy-config.ts
export const ENEMY_SCALE = 0.3; // Increase for larger hitbox (0.5 = 50%)
```

### Current Scale Effects
| ENEMY_SCALE | Radius | Diameter | Notes |
|-------------|--------|----------|-------|
| 0.2 | 3.2px | 6.4px | Very small, hard to hit |
| 0.3 | 4.8px | 9.6px | **Current** - Small but fair |
| 0.4 | 6.4px | 12.8px | Medium size |
| 0.5 | 8.0px | 16.0px | Large, easier to hit |

---

## Files Involved

### New Components
- `src/components/EntityCollisionDebug.tsx` - Draws collision circles on canvas
- `src/components/CollisionInfo.tsx` - HTML overlay with collision info
- `src/components/CollisionInfo.css` - Styling for info panel

### Modified Components
- `src/components/Experience.tsx` - Integrated collision debug with 'C' key toggle

### Configuration Files
- `src/consts/enemy-config.ts` - Contains `ENEMY_SCALE` constant
- `src/consts/game-world.ts` - Contains `TILE_SIZE` constant

---

## Keyboard Controls

| Key | Action |
|-----|--------|
| `C` | Toggle collision boundaries on/off |
| Arrow Keys | Move player |
| Space | Shoot |

---

## Testing Recommendations

### 1. Visual Inspection
- Toggle collision boundaries (press `C`)
- Observe if circles match sprite sizes
- Check if boundaries feel fair for gameplay

### 2. Hitbox Size Testing
**Player Hitbox (Current: 16px radius)**
- If too small: Bullets pass through player visually but don't register
- If too large: Player gets hit even when bullet appears to miss
- **Recommendation**: Should match ~70-80% of visible sprite size

**Enemy Hitbox (Current: 4.8px radius)**
- If too small: Hard to hit enemies, frustrating gameplay
- If too large: Too easy, reduces challenge
- **Recommendation**: Should match ~60-70% of visible sprite size

### 3. Gameplay Feel
Play a few rounds and evaluate:
- Does the player feel too easy or too hard to hit?
- Do enemies feel too easy or too hard to hit?
- Are there any "unfair" hits that look like misses?

---

## Common Issues & Solutions

### Issue: Enemy hitboxes are too small
**Solution**: Increase `ENEMY_SCALE` in `src/consts/enemy-config.ts`
```typescript
export const ENEMY_SCALE = 0.4; // Up from 0.3
```

### Issue: Player hitbox is too large
**Solution**: Adjust player radius calculation in `EnemyBullet.tsx`
```typescript
const playerRadius = TILE_SIZE / 3; // Down from TILE_SIZE / 2
```

### Issue: Collision circles don't update positions
**Solution**: The circles should follow entities automatically. If not, ensure:
- `playerPositionRef` is being updated in `PlayerAnimated`
- Enemy `positionRef` is updated in `EnemyFormation`

### Issue: Can't see collision circles
**Solution**: 
1. Press `C` key to toggle on
2. Check if `showCollisionDebug` state is true
3. Ensure circles aren't hidden behind sprites (z-index)

---

## Performance Notes

- Collision debug visualization has minimal performance impact
- Drawing circles uses PixiJS Graphics API (hardware accelerated)
- Only renders when visible (`isVisible={showCollisionDebug}`)
- Safe to leave in production (toggle off by default)

---

## Visual Examples

### Player Collision (Green)
```
      _______________
     /               \
    /    Player       \
   |    (Sprite)       |
   |                   |  ← 16px radius
   |        +          |  ← Center point
   |                   |
    \                 /
     \_______________/
        Green circle
```

### Enemy Collision (Red)
```
      ____
     /    \
    | Enemy |
    |  (^)  |  ← 4.8px radius
    |   +   |  ← Center point
     \____/
    Red circle
```

---

## Future Enhancements

Potential improvements to collision debug:
- [ ] Show bullet collision boundaries
- [ ] Display distance between player and nearest enemy
- [ ] Highlight active collision zones (when hit occurs)
- [ ] Adjustable collision sizes via UI sliders
- [ ] Color change when collision is active
- [ ] Show collision history (recent hits)

---

*Press `C` to toggle collision boundaries and see them in action!*

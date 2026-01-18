# Shooting System Documentation

## Overview

The shooting system provides a flexible, configurable framework for implementing ranged combat in your 2D game. It includes:

- ✅ **Configurable bullets** - Easy to create different bullet types
- ✅ **Configurable guns** - Different weapons with unique fire rates
- ✅ **Shoot animation** - Full 13-frame shooting animation for the hero
- ✅ **Directional shooting** - Bullets fire in the direction the hero is facing
- ✅ **Collision detection** - Bullets destroyed on wall impact
- ✅ **Lifetime management** - Bullets auto-destroy after a set time
- ✅ **Fire rate control** - Cooldown between shots
- ✅ **Automatic fire** - Hold spacebar for continuous shooting (gun-dependent)

## Architecture

### Components

```
Experience.tsx
├── BulletManager (manages all bullets)
│   └── Bullet[] (individual bullet sprites)
└── HeroAnimated (hero with shooting capability)
```

### Files

| File | Purpose |
|------|---------|
| `consts/bullet-config.ts` | Bullet and gun type definitions |
| `components/Bullet.tsx` | Individual bullet component |
| `components/BulletManager.tsx` | Manages all active bullets |
| `components/HeroAnimated.tsx` | Hero with shooting capability |
| `hooks/useControls.ts` | Keyboard controls including shoot key |

## Quick Start

### Basic Usage

```typescript
// In Experience.tsx (already set up)
import BulletManager, { BulletManagerRef } from "./BulletManager";
import HeroAnimated from "./HeroAnimated";

const Experience = () => {
  const bulletManagerRef = useRef<BulletManagerRef>(null);

  return (
    <Stage>
      <Container>
        <BulletManager ref={bulletManagerRef} />
        <HeroAnimated 
          bulletManagerRef={bulletManagerRef}
          gunType="pistol"  // Change gun type here
        />
      </Container>
    </Stage>
  );
};
```

### Controls

- **Arrow Keys**: Move and aim direction
- **Spacebar**: Shoot in the direction you're facing
- **Shift + Arrows**: Run while aiming

## Configuration

### Bullet Types

Edit `src/consts/bullet-config.ts` to customize bullets:

```typescript
export const BULLET_TYPES: Record<string, BulletConfig> = {
  basic: {
    name: "Basic Bullet",
    spriteAsset: bulletAsset,
    row: 0,                // Row in bullet.png sprite sheet
    col: 0,                // Column in bullet.png sprite sheet
    speed: 5,              // Pixels per frame
    damage: 10,            // Damage value
    frameWidth: 32,        // Frame width in sprite sheet
    frameHeight: 32,       // Frame height in sprite sheet
    scale: 0.5,            // Visual scale
    lifetime: 2000,        // Max lifetime (ms), 0 = unlimited
  },
  // Add more bullet types...
};
```

### Gun Types

Edit `src/consts/bullet-config.ts` to customize guns:

```typescript
export const GUN_TYPES: Record<string, GunConfig> = {
  pistol: {
    name: "Pistol",
    bulletType: "basic",   // Which bullet config to use
    fireRate: 300,         // Milliseconds between shots
    automatic: false,      // Hold key to auto-fire?
  },
  machineGun: {
    name: "Machine Gun",
    bulletType: "fast",
    fireRate: 100,         // Faster fire rate
    automatic: true,       // Hold spacebar for continuous fire
  },
  // Add more gun types...
};
```

### Predefined Configurations

**Bullets:**
- `basic`: Standard bullet (speed 5, damage 10)
- `fast`: Quick bullet (speed 8, damage 8, smaller)
- `heavy`: Powerful bullet (speed 3, damage 25, larger)

**Guns:**
- `pistol`: Semi-auto, 300ms cooldown, basic bullets
- `machineGun`: Full-auto, 100ms cooldown, fast bullets
- `cannon`: Semi-auto, 800ms cooldown, heavy bullets

## Changing Weapons

### Method 1: Static Configuration

Set the gun type when rendering HeroAnimated:

```typescript
<HeroAnimated 
  bulletManagerRef={bulletManagerRef}
  gunType="machineGun"  // Change this to switch weapons
/>
```

### Method 2: Dynamic Weapon Switching

Add state management for dynamic weapon switching:

```typescript
const [currentGun, setCurrentGun] = useState("pistol");

// Switch weapons with number keys
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === "1") setCurrentGun("pistol");
    if (e.key === "2") setCurrentGun("machineGun");
    if (e.key === "3") setCurrentGun("cannon");
  };
  window.addEventListener("keypress", handleKeyPress);
  return () => window.removeEventListener("keypress", handleKeyPress);
}, []);

return <HeroAnimated gunType={currentGun} bulletManagerRef={bulletManagerRef} />;
```

## Creating Custom Bullets

### Step 1: Add Bullet Configuration

```typescript
// In bullet-config.ts
export const BULLET_TYPES: Record<string, BulletConfig> = {
  // ... existing bullets
  plasma: {
    name: "Plasma Bolt",
    spriteAsset: bulletAsset,
    row: 0,  // bullet.png only has row 0
    col: 0,  // bullet.png is a single frame sprite
    speed: 7,
    damage: 15,
    frameWidth: 32,
    frameHeight: 32,
    scale: 0.6,
    lifetime: 2500,
  },
};
```

### Step 2: Create Gun That Uses It

```typescript
// In bullet-config.ts
export const GUN_TYPES: Record<string, GunConfig> = {
  // ... existing guns
  plasmaRifle: {
    name: "Plasma Rifle",
    bulletType: "plasma",  // Use your custom bullet
    fireRate: 250,
    automatic: true,
  },
};
```

### Step 3: Use the New Gun

```typescript
<HeroAnimated gunType="plasmaRifle" bulletManagerRef={bulletManagerRef} />
```

## Bullet Sprite Sheet Format

The `bullet.png` sprite is a single frame image:

```
Dimensions: 17×17 pixels (single frame sprite)
```

**Default bullet sprite:**
- Row: 0 (only row available)
- Col: 0 (only column available)
- Size: 17×17 pixels per frame
- Scaled to: ~8.5×8.5 pixels (scale: 0.5)

**Note:** All bullet types use the same sprite from `bullet.png`. They are differentiated by their properties (speed, damage, scale, lifetime) rather than different sprite frames.

**To customize bullets:**
1. All bullets use `row: 0` and `col: 0` (bullet.png is a single frame)
2. Adjust `scale` to change visual size
3. Adjust `speed`, `damage`, and `lifetime` for different bullet behaviors

## Shoot Animation

The hero plays a 13-frame shooting animation when firing:

```typescript
// In HeroAnimated.tsx - ANIMATION_SHEETS
shoot: {
  asset: heroShootAsset,                          // shoot.png
  frameSequence: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  idleFrame: null,
  framesPerStep: 13,                              // Complete full animation
  speed: 0.30,                                    // Fast animation
},
```

**Animation flow:**
1. Spacebar pressed → Start shooting animation
2. Play all 13 frames
3. Return to idle/walk animation
4. Hero can't shoot again until fire rate cooldown expires

**Adjusting shoot animation speed:**
```typescript
shoot: {
  speed: 0.20,  // Slower shooting animation
  // or
  speed: 0.40,  // Faster shooting animation
}
```

## Fire Rate & Cooldown

Fire rate prevents shooting too frequently:

```typescript
const currentGun = GUN_TYPES["pistol"];
const fireRate = currentGun.fireRate; // 300ms between shots

// In HeroAnimated.tsx
const now = Date.now();
const canFireAgain = now - lastShotTime.current >= currentGun.fireRate;
```

**Fire rate examples:**
- 100ms = 10 shots per second (machine gun)
- 300ms = 3.3 shots per second (pistol)
- 800ms = 1.25 shots per second (cannon)

## Automatic vs Semi-Automatic

**Semi-Automatic** (`automatic: false`):
- Must press spacebar for each shot
- Uses `consumeShootPress()` - detects key press events

**Automatic** (`automatic: true`):
- Hold spacebar for continuous fire
- Uses `isShootHeld()` - checks if key is currently held
- Still respects fire rate cooldown

```typescript
// In HeroAnimated.tsx
const shouldShoot = shootKeyPressed || (currentGun.automatic && shootKeyHeld);
```

## Bullet Lifetime

Bullets can auto-destroy after a set time:

```typescript
lifetime: 2000,  // Bullet lasts 2 seconds
lifetime: 0,     // Bullet lasts forever (until hitting wall)
```

**Why use lifetime?**
- Prevents bullets from traveling infinitely
- Reduces number of active entities
- Better performance with many bullets

## Bullet Collision

Bullets automatically destroy when hitting walls:

```typescript
// In Bullet.tsx
if (isBlocked(newX, newY)) {
  onDestroy(id);  // Remove bullet
  return prev;
}
```

**Collision checked every frame:**
1. Bullet moves in direction
2. New position checked against collision map
3. If blocked, bullet destroys immediately

## Bullet Direction

Bullets fire in the direction the hero is facing:

```typescript
// Direction determined by hero's current animation row
if (currentRow === ANIMATIONS.UP) shootDirection = "UP";
else if (currentRow === ANIMATIONS.DOWN) shootDirection = "DOWN";
else if (currentRow === ANIMATIONS.LEFT) shootDirection = "LEFT";
else if (currentRow === ANIMATIONS.RIGHT) shootDirection = "RIGHT";
```

**Important:** Hero must be facing a direction to shoot. The last direction moved determines shoot direction when idle.

## Performance Considerations

### Bullet Pooling (Future Enhancement)

For games with many bullets, consider implementing object pooling:

```typescript
// Instead of destroying bullets, reuse them
const bulletPool: Bullet[] = [];

function getBullet() {
  return bulletPool.pop() || createNewBullet();
}

function returnBullet(bullet: Bullet) {
  bullet.reset();
  bulletPool.push(bullet);
}
```

### Limiting Active Bullets

Add a maximum bullet count:

```typescript
// In BulletManager.tsx
const MAX_BULLETS = 50;

const spawnBullet = useCallback((...) => {
  if (bullets.length >= MAX_BULLETS) {
    return; // Don't spawn if at limit
  }
  // ... spawn logic
}, [bullets]);
```

## Advanced Customization

### Different Bullet Sprites per Direction

```typescript
// In bullet-config.ts
export interface BulletConfig {
  // ... existing properties
  rowByDirection?: {
    UP: number;
    DOWN: number;
    LEFT: number;
    RIGHT: number;
  };
}

// Usage
plasma: {
  // ...
  rowByDirection: {
    UP: 2,
    DOWN: 3,
    LEFT: 4,
    RIGHT: 5,
  },
}
```

### Animated Bullets

Add frame animation to bullets:

```typescript
// In Bullet.tsx - add animation state
const [bulletFrame, setBulletFrame] = useState(0);

useTick((delta) => {
  // ... movement logic
  
  // Animate bullet sprite
  setBulletFrame((prev) => (prev + 0.2 * delta) % bulletFrameCount);
});
```

### Bullet Effects on Destroy

```typescript
// In Bullet.tsx
if (isBlocked(newX, newY)) {
  // Spawn explosion effect
  spawnExplosion(newX, newY);
  
  onDestroy(id);
  return prev;
}
```

### Homing Bullets

```typescript
// In Bullet.tsx useTick
if (config.homing && target) {
  // Calculate angle to target
  const dx = target.x - position.x;
  const dy = target.y - position.y;
  const angle = Math.atan2(dy, dx);
  
  // Move toward target
  newX += Math.cos(angle) * config.speed * delta;
  newY += Math.sin(angle) * config.speed * delta;
}
```

## Troubleshooting

### Bullets not appearing
- Check that `BulletManager` is rendered before `HeroAnimated`
- Verify `bulletManagerRef` is passed correctly
- Check browser console for errors

### Shoot animation not playing
- Verify `shoot.png` exists in assets folder
- Check that `heroShootAsset` is imported correctly
- Ensure shooting animation completes (check framesPerStep)

### Can't shoot fast enough
- Decrease `fireRate` in gun config (lower = faster)
- Set `automatic: true` for continuous fire

### Bullets going wrong direction
- Check that hero is facing the correct direction before shooting
- Verify `currentRow` matches `ANIMATIONS` direction constants

### Bullets passing through walls
- Verify collision map is set up correctly
- Check that `isBlocked()` is working properly
- Test collision detection with `CollisionDebug` component

### Performance issues with many bullets
- Reduce `lifetime` for bullets
- Add maximum bullet limit
- Consider implementing bullet pooling

## Example: Complete Custom Weapon

```typescript
// 1. Define bullet type
export const BULLET_TYPES = {
  explosive: {
    name: "Explosive Round",
    spriteAsset: bulletAsset,
    row: 0,  // bullet.png only has row 0
    col: 0,  // bullet.png is a single frame sprite
    speed: 4,
    damage: 50,
    frameWidth: 32,
    frameHeight: 32,
    scale: 0.8,
    lifetime: 3000,
  },
};

// 2. Define gun that uses it
export const GUN_TYPES = {
  rocketLauncher: {
    name: "Rocket Launcher",
    bulletType: "explosive",
    fireRate: 1000,  // 1 second between shots
    automatic: false,
  },
};

// 3. Use in game
<HeroAnimated 
  gunType="rocketLauncher" 
  bulletManagerRef={bulletManagerRef} 
/>
```

## Summary

**To add a new weapon system:**
1. ✅ Define bullet configuration in `bullet-config.ts`
2. ✅ Define gun configuration in `bullet-config.ts`
3. ✅ Pass gun type to `HeroAnimated` component
4. ✅ Press spacebar to shoot!

**Key configuration values:**
- **Bullet speed**: Controls how fast bullets move
- **Fire rate**: Cooldown between shots (milliseconds)
- **Automatic**: Hold key for continuous fire
- **Damage**: Bullet damage value (for future enemy system)
- **Lifetime**: How long bullets exist before auto-destroying

The shooting system is designed to be easily extended with new bullet types, gun types, and custom behaviors!

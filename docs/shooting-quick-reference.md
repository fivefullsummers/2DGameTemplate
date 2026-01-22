# Shooting System Quick Reference

## Quick Config Changes

### Change Gun Type

```typescript
// In Experience.tsx
<HeroAnimated 
  bulletManagerRef={bulletManagerRef}
  gunType="pistol"  // ← Change this: "pistol", "machineGun", "cannon"
/>
```

### Change Bullet Speed

```typescript
// In bullet-config.ts → BULLET_TYPES
basic: {
  speed: 5,  // ← Higher = faster bullet
}
```

### Change Fire Rate

```typescript
// In bullet-config.ts → GUN_TYPES
pistol: {
  fireRate: 300,  // ← Lower = shoots faster (milliseconds)
}
```

### Enable Automatic Fire

```typescript
// In bullet-config.ts → GUN_TYPES
pistol: {
  automatic: true,  // ← Hold spacebar for continuous fire
}
```

### Change Bullet Damage

```typescript
// In bullet-config.ts → BULLET_TYPES
basic: {
  damage: 10,  // ← Higher = more damage
}
```

### Change Bullet Lifetime

```typescript
// In bullet-config.ts → BULLET_TYPES
basic: {
  lifetime: 2000,  // ← Milliseconds (0 = unlimited)
}
```

### Change Bullet Sprite

```typescript
// In bullet-config.ts → BULLET_TYPES
basic: {
  row: 0,   // ← Row in bullet.png (only row 0 available)
  col: 0,   // ← Column in bullet.png (bullet.png is a single frame)
  scale: 0.5,  // ← Size multiplier
}
```

### Change Shoot Animation Speed

```typescript
// In HeroAnimated.tsx → ANIMATION_SHEETS
shoot: {
  speed: 0.30,  // ← Higher = faster animation
}
```

## Available Presets

### Bullet Types
- `"basic"` - Standard (speed 5, damage 10)
- `"fast"` - Quick (speed 8, damage 8)
- `"heavy"` - Powerful (speed 3, damage 25)

### Gun Types
- `"pistol"` - Semi-auto, 300ms cooldown
- `"machineGun"` - Full-auto, 100ms cooldown
- `"cannon"` - Semi-auto, 800ms cooldown

## Controls

| Key | Action |
|-----|--------|
| **Spacebar** | Shoot |
| **Arrow Keys** | Move & Aim |
| **Shift** | Run |

## Quick Add New Weapon

```typescript
// 1. Add to BULLET_TYPES in bullet-config.ts
myBullet: {
  name: "My Bullet",
  spriteAsset: bulletAsset,
  row: 0,  // ← bullet.png only has row 0
  col: 0,  // ← bullet.png is a single frame sprite
  speed: 6,
  damage: 15,
  frameWidth: 17,
  frameHeight: 17,
  scale: 0.5,
  lifetime: 2000,
},

// 2. Add to GUN_TYPES in bullet-config.ts
myGun: {
  name: "My Gun",
  bulletType: "myBullet",
  fireRate: 200,
  automatic: false,
},

// 3. Use in Experience.tsx
<HeroAnimated gunType="myGun" bulletManagerRef={bulletManagerRef} />
```

## File Locations

| What | Where |
|------|-------|
| Bullet/Gun configs | `src/consts/bullet-config.ts` |
| Bullet component | `src/components/Bullet.tsx` |
| Bullet manager | `src/components/BulletManager.tsx` |
| Hero shooting | `src/components/HeroAnimated.tsx` |
| Shoot controls | `src/hooks/useControls.ts` |
| Integration | `src/components/Experience.tsx` |

## Common Values

### Fire Rate (milliseconds between shots)
- Very Fast: `50-100ms` (20-10 shots/sec)
- Fast: `100-200ms` (10-5 shots/sec)
- Normal: `200-400ms` (5-2.5 shots/sec)
- Slow: `400-800ms` (2.5-1.25 shots/sec)
- Very Slow: `800+ms` (<1.25 shots/sec)

### Bullet Speed (pixels per frame)
- Very Slow: `1-2`
- Slow: `3-4`
- Normal: `5-6`
- Fast: `7-9`
- Very Fast: `10+`

### Bullet Lifetime (milliseconds)
- Short: `500-1000ms`
- Normal: `1500-2500ms`
- Long: `3000-5000ms`
- Unlimited: `0`

### Bullet Scale
- Tiny: `0.2-0.3`
- Small: `0.4-0.5`
- Normal: `0.6-0.7`
- Large: `0.8-1.0`
- Huge: `1.0+`

## Performance Tips

### Limit Active Bullets
```typescript
// In BulletManager.tsx
const MAX_BULLETS = 50;
if (bullets.length >= MAX_BULLETS) return;
```

### Use Lifetime
```typescript
// Prevent infinite bullets
lifetime: 2000,  // Auto-destroy after 2 seconds
```

### Reduce Fire Rate
```typescript
// Slower = fewer bullets on screen
fireRate: 300,  // Instead of 100
```

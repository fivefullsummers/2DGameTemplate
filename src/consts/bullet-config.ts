// Frame dimensions for shot.png sprite sheet
// Adjusting dimensions - will be verified at runtime
export const BULLET_FRAME_WIDTH = 32;
export const BULLET_FRAME_HEIGHT = 32;

// Asset alias for bullet sprite (loaded via AssetLoader)
const BULLET_ASSET_ALIAS = "guns";

// Bullet configuration interface
export interface BulletConfig {
  name: string;
  spriteAsset: string;     // Asset alias (not file path)
  row: number;             // Which row in the sprite sheet
  col: number;             // Which column in the sprite sheet
  speed: number;           // Pixels per frame
  damage: number;          // Damage dealt
  frameWidth: number;      // Width of sprite frame
  frameHeight: number;     // Height of sprite frame
  scale: number;           // Scale of the bullet sprite
  lifetime: number;        // Max lifetime in milliseconds (0 = unlimited)
}

// Predefined bullet types - easily configurable
// Note: shot.png dimensions configured above
// All bullet types use the same sprite, differentiated by speed, scale, and damage
export const BULLET_TYPES: Record<string, BulletConfig> = {
  basic: {
    name: "Basic Bullet",
    spriteAsset: BULLET_ASSET_ALIAS,
    row: 0,                // Row 0
    col: 0,                // Col 0
    speed: 5,              // 5 pixels per frame
    damage: 10,
    frameWidth: BULLET_FRAME_WIDTH,
    frameHeight: BULLET_FRAME_HEIGHT,
    scale: 0.05,           // Small size for shot.png
    lifetime: 0,           // Unlimited - bullets travel until hitting a wall
  },
  fast: {
    name: "Fast Bullet",
    spriteAsset: BULLET_ASSET_ALIAS,
    row: 0,                // Row 0
    col: 0,                // Same sprite, different properties
    speed: 8,              // Faster
    damage: 8,
    frameWidth: BULLET_FRAME_WIDTH,
    frameHeight: BULLET_FRAME_HEIGHT,
    scale: 0.05,           // Smaller and faster
    lifetime: 0,           // Unlimited - bullets travel until hitting a wall
  },
  heavy: {
    name: "Heavy Bullet",
    spriteAsset: BULLET_ASSET_ALIAS,
    row: 0,                // Row 0
    col: 0,                // Same sprite, different properties
    speed: 3,              // Slower
    damage: 25,            // More damage
    frameWidth: BULLET_FRAME_WIDTH,
    frameHeight: BULLET_FRAME_HEIGHT,
    scale: 0.20,           // Larger but still reasonable
    lifetime: 3000,
  },
  spaceInvadersBullet: {
    name: "Space Invaders Bullet",
    spriteAsset: BULLET_ASSET_ALIAS,
    row: 0,
    col: 0,
    speed: 6,              // Medium-fast (Space Invaders bullets were visible but fast)
    damage: 100,           // One-hit kill
    frameWidth: BULLET_FRAME_WIDTH,
    frameHeight: BULLET_FRAME_HEIGHT,
    scale: 0.05,           // Small for Space Invaders style
    lifetime: 0,           // Unlimited - travels until hitting something
  },
};

// Default bullet type
export const DEFAULT_BULLET_TYPE = "basic";

// Gun configuration interface
export interface GunConfig {
  name: string;
  bulletType: string;      // Which bullet config to use
  fireRate: number;        // Milliseconds between shots
  automatic: boolean;      // Can hold key to fire continuously?
}

// Predefined gun types
export const GUN_TYPES: Record<string, GunConfig> = {
  pistol: {
    name: "Pistol",
    bulletType: "basic",
    fireRate: 300,         // 300ms between shots
    automatic: false,      // Must press key for each shot
  },
  machineGun: {
    name: "Machine Gun",
    bulletType: "Heavy Bullet",
    fireRate: 100,         // 100ms between shots
    automatic: false,       // Hold key to fire
  },
  cannon: {
    name: "Cannon",
    bulletType: "heavy",
    fireRate: 800,         // 800ms between shots
    automatic: false,
  },
  spaceInvaders: {
    name: "Space Invaders Gun",
    bulletType: "spaceInvadersBullet",
    fireRate: 0,
    automatic: false,      // Space Invaders is single-shot
  },
  // One-press-one-shot gun with zero cooldown.
  // Uses the basic bullet config but does not impose any time delay
  // between shots; each press immediately fires a bullet.
  instantShot: {
    name: "Instant Shot",
    bulletType: "basic",
    fireRate: 300,         // 300ms cooldown shown in UI
    automatic: false,    // one press = one shot
  },
};

// Default gun type
export const DEFAULT_GUN_TYPE = "Machine Gun";

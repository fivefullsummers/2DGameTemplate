import bulletAsset from "../assets/misc/bullet.png";

// Frame dimensions for bullet.png sprite sheet
// bullet.png is 17x17 pixels (single frame sprite)
export const BULLET_FRAME_WIDTH = 17;
export const BULLET_FRAME_HEIGHT = 17;

// Bullet configuration interface
export interface BulletConfig {
  name: string;
  spriteAsset: string;     // Path to sprite sheet
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
// Note: bullet.png is 17x17 pixels (single frame sprite)
// All bullet types use the same sprite, differentiated by speed, scale, and damage
export const BULLET_TYPES: Record<string, BulletConfig> = {
  basic: {
    name: "Basic Bullet",
    spriteAsset: bulletAsset,
    row: 0,                // Row 0 (bullet.png only has 1 row)
    col: 0,                // Col 0 in bullet.png
    speed: 5,              // 5 pixels per frame
    damage: 10,
    frameWidth: BULLET_FRAME_WIDTH,
    frameHeight: BULLET_FRAME_HEIGHT,
    scale: 0.5,            // Scale down to ~8.5x8.5
    lifetime: 2000,        // 2 seconds
  },
  fast: {
    name: "Fast Bullet",
    spriteAsset: bulletAsset,
    row: 0,                // Row 0 (bullet.png only has 1 row)
    col: 0,                // Same sprite, different properties
    speed: 8,              // Faster
    damage: 8,
    frameWidth: BULLET_FRAME_WIDTH,
    frameHeight: BULLET_FRAME_HEIGHT,
    scale: 0.4,            // Smaller
    lifetime: 1500,
  },
  heavy: {
    name: "Heavy Bullet",
    spriteAsset: bulletAsset,
    row: 0,                // Row 0 (bullet.png only has 1 row)
    col: 0,                // Same sprite, different properties
    speed: 3,              // Slower
    damage: 25,            // More damage
    frameWidth: BULLET_FRAME_WIDTH,
    frameHeight: BULLET_FRAME_HEIGHT,
    scale: 0.7,            // Larger
    lifetime: 3000,
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
    bulletType: "fast",
    fireRate: 100,         // 100ms between shots
    automatic: true,       // Hold key to fire
  },
  cannon: {
    name: "Cannon",
    bulletType: "heavy",
    fireRate: 800,         // 800ms between shots
    automatic: false,
  },
};

// Default gun type
export const DEFAULT_GUN_TYPE = "pistol";

// Frame dimensions for shot.png sprite sheet
// Adjusting dimensions - will be verified at runtime
export const BULLET_FRAME_WIDTH = 32;
export const BULLET_FRAME_HEIGHT = 32;

// Asset alias for bullet sprite (loaded via AssetLoader)
const BULLET_ASSET_ALIAS = "guns";

// Match enemy bullet size (ENEMY_BULLET_SCALE = 0.05 in EnemyFormation)
const BULLET_SCALE_SMALL = 0.05;

// Sound alias for bullet fire (loaded via AssetLoader)
const BULLET_SOUND_PLACEHOLDER = "pound-sound";

// Speed curve: explosive exit, then ease to cruise (bigger curve = more punch)
const BULLET_INITIAL_SPEED_MULTIPLIER = 4;
const BULLET_SPEED_DECAY_MS = 180;

// Bullet configuration interface
export interface BulletConfig {
  name: string;
  spriteAsset: string;
  row: number;
  col: number;
  speed: number;
  damage: number;
  frameWidth: number;
  frameHeight: number;
  scale: number;
  lifetime: number;
  /** Max instances of this bullet type on screen at once */
  maxOnScreen: number;
  /** When set, overrides gun fire rate (ms between shots) for spray-style weapons */
  fireRateMs?: number;
  soundId?: string;
  /** Speed curve: start at (speed * initialSpeedMultiplier), ease to cruise (speed) over speedDecayMs. */
  initialSpeedMultiplier?: number;
  speedDecayMs?: number;
}

// Predefined bullet types - easily configurable
// Note: shot.png dimensions configured above
// All bullet types use the same sprite, differentiated by speed, scale, and damage
export const BULLET_TYPES: Record<string, BulletConfig> = {
  basic: {
    name: "Basic Bullet",
    spriteAsset: BULLET_ASSET_ALIAS,
    row: 0,
    col: 0,
    speed: 5,
    damage: 10,
    frameWidth: BULLET_FRAME_WIDTH,
    frameHeight: BULLET_FRAME_HEIGHT,
    scale: BULLET_SCALE_SMALL,
    lifetime: 0,
    maxOnScreen: 1,
    soundId: BULLET_SOUND_PLACEHOLDER,
    initialSpeedMultiplier: BULLET_INITIAL_SPEED_MULTIPLIER,
    speedDecayMs: BULLET_SPEED_DECAY_MS,
  },
  fast: {
    name: "Fast Bullet",
    spriteAsset: BULLET_ASSET_ALIAS,
    row: 0,
    col: 0,
    speed: 8,
    damage: 8,
    frameWidth: BULLET_FRAME_WIDTH,
    frameHeight: BULLET_FRAME_HEIGHT,
    scale: BULLET_SCALE_SMALL,
    lifetime: 0,
    maxOnScreen: 5,
    soundId: BULLET_SOUND_PLACEHOLDER,
    initialSpeedMultiplier: BULLET_INITIAL_SPEED_MULTIPLIER,
    speedDecayMs: BULLET_SPEED_DECAY_MS,
  },
  heavy: {
    name: "Heavy Bullet",
    spriteAsset: BULLET_ASSET_ALIAS,
    row: 0,
    col: 0,
    speed: 3,
    damage: 25,
    frameWidth: BULLET_FRAME_WIDTH,
    frameHeight: BULLET_FRAME_HEIGHT,
    scale: BULLET_SCALE_SMALL,
    lifetime: 3000,
    maxOnScreen: 1,
    soundId: BULLET_SOUND_PLACEHOLDER,
    initialSpeedMultiplier: BULLET_INITIAL_SPEED_MULTIPLIER,
    speedDecayMs: BULLET_SPEED_DECAY_MS,
  },
  spaceInvadersBullet: {
    name: "Space Invaders Bullet",
    spriteAsset: BULLET_ASSET_ALIAS,
    row: 0,
    col: 0,
    speed: 6,
    damage: 100,
    frameWidth: BULLET_FRAME_WIDTH,
    frameHeight: BULLET_FRAME_HEIGHT,
    scale: BULLET_SCALE_SMALL,
    lifetime: 0,
    maxOnScreen: 1,
    soundId: BULLET_SOUND_PLACEHOLDER,
    initialSpeedMultiplier: BULLET_INITIAL_SPEED_MULTIPLIER,
    speedDecayMs: BULLET_SPEED_DECAY_MS,
  },
  spreader: {
    name: "Spreader",
    spriteAsset: BULLET_ASSET_ALIAS,
    row: 0,
    col: 0,
    speed: 6,
    damage: 100,
    frameWidth: BULLET_FRAME_WIDTH,
    frameHeight: BULLET_FRAME_HEIGHT,
    scale: BULLET_SCALE_SMALL,
    lifetime: 0,
    maxOnScreen: 1,
    soundId: BULLET_SOUND_PLACEHOLDER,
    initialSpeedMultiplier: BULLET_INITIAL_SPEED_MULTIPLIER,
    speedDecayMs: BULLET_SPEED_DECAY_MS,
  },
  heavyMachineGun: {
    name: "Heavy Machine Gun",
    spriteAsset: BULLET_ASSET_ALIAS,
    row: 0,
    col: 0,
    speed: 7,
    damage: 6,
    frameWidth: BULLET_FRAME_WIDTH,
    frameHeight: BULLET_FRAME_HEIGHT,
    scale: BULLET_SCALE_SMALL,
    lifetime: 0,
    maxOnScreen: 500,
    fireRateMs: 40,
    soundId: BULLET_SOUND_PLACEHOLDER,
    initialSpeedMultiplier: BULLET_INITIAL_SPEED_MULTIPLIER,
    speedDecayMs: BULLET_SPEED_DECAY_MS,
  },
  lineGun: {
    name: "Line Gun",
    spriteAsset: BULLET_ASSET_ALIAS,
    row: 0,
    col: 0,
    speed: 6,
    damage: 100,
    frameWidth: BULLET_FRAME_WIDTH,
    frameHeight: BULLET_FRAME_HEIGHT,
    scale: BULLET_SCALE_SMALL,
    lifetime: 0,
    maxOnScreen: 1,
    soundId: BULLET_SOUND_PLACEHOLDER,
    initialSpeedMultiplier: BULLET_INITIAL_SPEED_MULTIPLIER,
    speedDecayMs: BULLET_SPEED_DECAY_MS,
  },
};

// Default bullet type
export const DEFAULT_BULLET_TYPE = "basic";

/** Last 3 guns from powerup spritesheet: spreader, heavyMachineGun, lineGun (alternate when collecting). */
export const POWERUP_GUN_BULLET_TYPES: readonly string[] = [
  "spreader",
  "heavyMachineGun",
  "lineGun",
];

export const POWERUP_FRAME_COUNT = POWERUP_GUN_BULLET_TYPES.length;

/** Spritesheet has 5 frames; we show the last 3 (indices 2, 3, 4). */
export const POWERUP_SPRITE_FRAME_OFFSET = 2;

/** Frame index in guns.png (5-frame powerup spritesheet) for each bullet type. Frame 1 = basic. */
export const BULLET_TYPE_TO_GUN_FRAME: Record<string, number> = {
  basic: 1,
  spreader: 2,
  heavyMachineGun: 3,
  lineGun: 4,
};
export const DEFAULT_GUN_FRAME = 1;

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
  // Spreader: one shot kills center enemy then wave of neighbors by radius
  spreader: {
    name: "Spreader",
    bulletType: "spreader",
    fireRate: 0,
    automatic: false,
  },
  // Line Gun: one shot kills entire row in a line, domino-style
  lineGun: {
    name: "Line Gun",
    bulletType: "lineGun",
    fireRate: 0,
    automatic: false,
  },
};

// Default gun type
export const DEFAULT_GUN_TYPE = "Machine Gun";

// Spreader gun: explosive wave by grid radius (Chebyshev distance)
// spread_radius 1 = center + ring 1 (up to 8 neighbors), 2 = + ring 2 (up to 16 more), etc.
export const SPREADER_SPREAD_RADIUS = 1;
// Delay in ms between each radius wave (center dies, then ring 1, then ring 2...)
export const SPREADER_WAVE_DELAY_MS = 120;

// Central gameplay "tuning" configuration.
// 
// All the sizes and spacing that you are likely to tweak for
// different devices (mobile vs desktop) live in this file so
// you can change them in ONE place.
//
// What you can adjust here:
// - Enemy visual scale
// - Enemy formation spacing
// - Enemy vertical offset (how high the formation sits)
// - Player visual scale
// - Player starting Y position
//
// To make desktop look different from mobile, change ONLY the
// values in the `desktop` section below.

import { TILE_SIZE, isMobile } from "./game-world";

type DeviceProfile = "mobile" | "desktop";

const activeProfile: DeviceProfile = isMobile() ? "mobile" : "desktop";

const DEVICE_TUNING = {
  mobile: {
    // Enemies
    enemyScale: 0.1,
    enemySpacingX: TILE_SIZE * 1.7,
    enemySpacingY: TILE_SIZE * 1.5,
    enemyFormationOffsetY: TILE_SIZE * 3,

    // Player
    playerScale: 0.23,
    playerStartY: TILE_SIZE * 23,
  },
  desktop: {
    // Enemies
    enemyScale: 0.05,
    enemySpacingX: TILE_SIZE * 1,
    enemySpacingY: TILE_SIZE * 1,
    enemyFormationOffsetY: TILE_SIZE * 1,

    // Player
    playerScale: 0.1,
    playerStartY: TILE_SIZE * 12,
  },
} as const;

const ACTIVE_TUNING = DEVICE_TUNING[activeProfile];

// Enemy configuration (used across the game)
export const ENEMY_SCALE = ACTIVE_TUNING.enemyScale;
export const ENEMY_SPACING_X = ACTIVE_TUNING.enemySpacingX;
export const ENEMY_SPACING_Y = ACTIVE_TUNING.enemySpacingY;
export const ENEMY_FORMATION_OFFSET_Y = ACTIVE_TUNING.enemyFormationOffsetY;

// Player configuration (used by PlayerAnimated)
export const PLAYER_SCALE = ACTIVE_TUNING.playerScale;
export const PLAYER_START_Y = ACTIVE_TUNING.playerStartY;

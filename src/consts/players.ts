/**
 * Player character definitions for the player select screen and in-game.
 * Each player has a unique spritesheet, sounds, and weapon (bullet type).
 */

import { BULLET_TYPES } from "./bullet-config";

export interface PlayerConfig {
  id: string;
  name: string;
  /** Bullet type key from BULLET_TYPES (weapon of choice) */
  weaponOfChoice: string;
  /** Asset alias for hero sprite sheet (idle/exit animation) */
  heroAsset: string;
  /** Asset alias for death/explosion sprite sheet */
  explosionAsset: string;
  /** Sound alias for death/explosion (optional; falls back to explosion-sound) */
  deathSoundId?: string;
  /** Sound for shooting is defined per bullet type in BULLET_TYPES */
  /** Optional tint for the player sprite (e.g. 0xff8888). 0xffffff = no tint. */
  tint?: number;
}

export const PLAYER_CONFIGS: Record<string, PlayerConfig> = {
  president: {
    id: "president",
    name: "The Unstoppable President",
    weaponOfChoice: "basic",
    heroAsset: "hero-cool",
    explosionAsset: "hero-explosion",
    deathSoundId: "explosion-sound",
    tint: 0xffffff, // white (default)
  },
  incredible: {
    id: "incredible",
    name: "The Incredible UP",
    weaponOfChoice: "fast",
    heroAsset: "hero-cool",
    explosionAsset: "hero-explosion",
    deathSoundId: "explosion-sound",
    tint: 0x88ccff, // light blue
  },
  tbc1: {
    id: "tbc1",
    name: "Name TBC",
    weaponOfChoice: "heavy",
    heroAsset: "hero-cool",
    explosionAsset: "hero-explosion",
    deathSoundId: "explosion-sound",
    tint: 0xffcc88, // orange
  },
  tbc2: {
    id: "tbc2",
    name: "Name TBC",
    weaponOfChoice: "spaceInvadersBullet",
    heroAsset: "hero-cool",
    explosionAsset: "hero-explosion",
    deathSoundId: "explosion-sound",
    tint: 0xcc88ff, // purple
  },
};

/** Ordered list of player ids for the select screen (2x2 grid) */
export const PLAYER_IDS = Object.keys(PLAYER_CONFIGS);

/** Default player id when none selected (e.g. first in list) */
export const DEFAULT_PLAYER_ID = PLAYER_IDS[0] ?? "president";

/** Get display name for weapon of choice from BULLET_TYPES */
export function getWeaponDisplayName(bulletTypeKey: string): string {
  return BULLET_TYPES[bulletTypeKey]?.name ?? bulletTypeKey;
}

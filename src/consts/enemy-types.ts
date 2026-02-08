/**
 * Enemy type definitions for the pre-game screen and in-game formation.
 * Each type has its own spritesheet (asset alias), shooting sound, bullet sprite,
 * and mission text. Use the same assets for all types until you add unique art.
 */

export interface EnemyTypeConfig {
  id: string;
  /** Display name (e.g. "HEALTHCARE") shown on pre-game and in UI */
  name: string;
  /** Asset alias for enemy sprite sheet (loaded via AssetLoader) */
  spriteAsset: string;
  /** Asset alias for enemy death/explosion sprite sheet */
  explosionAsset: string;
  /** Sound alias for enemy shooting (played when this type fires) */
  shootSoundId: string;
  /** Asset alias for enemy bullet sprite (e.g. "guns" = shot.png) */
  bulletSpriteAsset: string;
  /** Optional tint for enemy bullets (e.g. 0xff0000 = red). Default 0xff0000. */
  bulletTint?: number;
  /** Optional tint for the enemy sprite (e.g. 0xff8888). 0xffffff = no tint. */
  tint?: number;
  /** Mission title or theme line (e.g. "Destroy healthcare funding.") */
  missionLines: string[];
}

/** All enemy types keyed by id. Use current shared assets for all until you add per-type art. */
export const ENEMY_TYPE_CONFIGS: Record<string, EnemyTypeConfig> = {
  healthcare: {
    id: "healthcare",
    name: "HEALTHCARE",
    spriteAsset: "enemy-animated",
    explosionAsset: "enemy-explosion",
    shootSoundId: "pound-sound",
    bulletSpriteAsset: "guns",
    bulletTint: 0xff0000,
    tint: 0x88ff88, // green
    missionLines: ["Destroy healthcare funding.", "Pocket the cash."],
  },
  education: {
    id: "education",
    name: "EDUCATION",
    spriteAsset: "enemy-animated",
    explosionAsset: "enemy-explosion",
    shootSoundId: "pound-sound",
    bulletSpriteAsset: "guns",
    bulletTint: 0xffaa00,
    tint: 0xffff88, // yellow
    missionLines: ["Defund public schools.", "Privatize the rest."],
  },
  defense: {
    id: "defense",
    name: "DEFENSE",
    spriteAsset: "enemy-animated",
    explosionAsset: "enemy-explosion",
    shootSoundId: "pound-sound",
    bulletSpriteAsset: "guns",
    bulletTint: 0x00aaff,
    tint: 0x88aaff, // blue
    missionLines: ["Siphon defense contracts.", "Leave no trace."],
  },
  welfare: {
    id: "welfare",
    name: "WELFARE",
    spriteAsset: "enemy-animated",
    explosionAsset: "enemy-explosion",
    shootSoundId: "pound-sound",
    bulletSpriteAsset: "guns",
    bulletTint: 0xff00ff,
    tint: 0xff88ff, // magenta
    missionLines: ["Cut welfare programs.", "Take the savings."],
  },
};

/** Ordered list of enemy type ids (e.g. for level 1 = first, level 2 = second). */
export const ENEMY_TYPE_IDS = Object.keys(ENEMY_TYPE_CONFIGS);

/** Default enemy type id when none selected (e.g. level 1). */
export const DEFAULT_ENEMY_TYPE_ID = ENEMY_TYPE_IDS[0] ?? "healthcare";

/** Get config for an enemy type. */
export function getEnemyTypeConfig(enemyTypeId: string): EnemyTypeConfig | undefined {
  return ENEMY_TYPE_CONFIGS[enemyTypeId];
}

/** Get display name for an enemy type. */
export function getEnemyTypeDisplayName(enemyTypeId: string): string {
  return ENEMY_TYPE_CONFIGS[enemyTypeId]?.name ?? enemyTypeId;
}

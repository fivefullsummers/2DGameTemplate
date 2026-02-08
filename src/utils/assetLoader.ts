import * as PIXI from "pixi.js";
import { sound } from "@pixi/sound";

// Import all assets
import heroCoolAsset from "../assets/hero/cool.png";
import heroExplosionAsset from "../assets/hero/cool_explosion.png";
import enemyAnimatedAsset from "../assets/enemies/enemy.png";
import enemyExplosionAsset from "../assets/enemies/enemy_explosion.png";
import mapAsset from "../assets/back.png";
import gunsAsset from "../assets/misc/shot.png";
import powerupGunsAsset from "../assets/misc/guns.png";
import explosionSound from "../assets/sounds/explosion.wav";
import poundSound from "../assets/sounds/Pound.wav";
import level1Music from "../assets/sounds/ymcabit.mp3";
import sfxDeathscreamAlien from "../assets/sounds/sfx_deathscream_alien3.wav";
import sfxDeathscreamHuman from "../assets/sounds/sfx_deathscream_human1.wav";
import sfxCoin from "../assets/sounds/sfx_coin_double5.wav";
import sfxButton from "../assets/sounds/sfx_sounds_button11.wav";

/**
 * Asset manifest - defines all assets that need to be loaded
 */
export interface AssetDefinition {
  alias: string;
  src: string;
  description: string;
}

export const ASSET_MANIFEST: AssetDefinition[] = [
  {
    alias: "hero-cool",
    src: heroCoolAsset,
    description: "Hero cool sprite",
  },
  {
    alias: "hero-explosion",
    src: heroExplosionAsset,
    description: "Hero death explosion animation",
  },
  {
    alias: "enemy-animated",
    src: enemyAnimatedAsset,
    description: "Animated enemy sprite sheet",
  },
  {
    alias: "enemy-explosion",
    src: enemyExplosionAsset,
    description: "Enemy death explosion animation",
  },
  {
    alias: "level-map",
    src: mapAsset,
    description: "Game level map",
  },
  {
    alias: "guns",
    src: gunsAsset,
    description: "Bullet/shot sprites (shot.png)",
  },
  {
    alias: "powerup-guns",
    src: powerupGunsAsset,
    description: "Powerup gun spritesheet (guns.png, 5 frames)",
  },
  {
    alias: "explosion-sound",
    src: explosionSound,
    description: "Explosion sound effect",
  },
  {
    alias: "pound-sound",
    src: poundSound,
    description: "Pound sound effect for shooting",
  },
  {
    alias: "level1-music",
    src: level1Music,
    description: "Level 1 background music",
  },
  {
    alias: "alien-death",
    src: sfxDeathscreamAlien,
    description: "Enemy death scream",
  },
  {
    alias: "human-death",
    src: sfxDeathscreamHuman,
    description: "Human death scream",
  },
  {
    alias: "coin",
    src: sfxCoin,
    description: "Coin / start game sound",
  },
  {
    alias: "button-click",
    src: sfxButton,
    description: "Menu button click",
  },
];

/** Resolved URL for powerup guns spritesheet (guns.png); use for DOM img/background, same source as Powerup. */
export const powerupGunsUrl = powerupGunsAsset as string;

/**
 * Progress callback type
 */
export type ProgressCallback = (progress: number, currentAsset: string) => void;

/**
 * Asset Loader class - manages loading all game assets with progress tracking
 */
export class AssetLoader {
  private assets: AssetDefinition[];
  private loadedCount = 0;
  private totalCount = 0;

  constructor(manifest: AssetDefinition[]) {
    this.assets = manifest;
    this.totalCount = manifest.length;
  }

  /**
   * Load all assets with progress tracking
   * @param onProgress - Callback fired when progress updates
   * @returns Promise that resolves when all assets are loaded
   */
  async loadAll(onProgress?: ProgressCallback): Promise<void> {
    this.loadedCount = 0;

    // Add all assets to PIXI's asset loader using the new API format
    for (const asset of this.assets) {
      PIXI.Assets.add({ alias: asset.alias, src: asset.src });
    }

    // Load assets with progress tracking
    const aliases = this.assets.map((a) => a.alias);
    
    return new Promise((resolve, reject) => {
      // Load all assets
      PIXI.Assets.load(aliases, (progress) => {
        // PIXI's progress is 0 to 1
        if (onProgress) {
          const currentAsset = this.assets[Math.floor(progress * this.assets.length)]?.description || "Loading...";
          onProgress(progress, currentAsset);
        }
      })
      .then(async () => {
        // Register audio files with PIXI sound system after loading
        const audioAssets = [
          { alias: "explosion-sound", src: explosionSound },
          { alias: "pound-sound", src: poundSound },
          { alias: "level1-music", src: level1Music },
          { alias: "alien-death", src: sfxDeathscreamAlien },
          { alias: "human-death", src: sfxDeathscreamHuman },
          { alias: "coin", src: sfxCoin },
          { alias: "button-click", src: sfxButton },
        ];
        
        // Register each sound with the sound system using the source path
        for (const audioAsset of audioAssets) {
          try {
            // Check if sound already exists before adding
            if (!sound.exists(audioAsset.alias)) {
              sound.add(audioAsset.alias, audioAsset.src);
            }
          } catch (error) {
            console.warn(`Failed to register sound ${audioAsset.alias}:`, error);
          }
        }
        
        this.loadedCount = this.totalCount;
        if (onProgress) {
          onProgress(1, "Complete!");
        }
        resolve();
      })
        .catch((error) => {
          console.error("Failed to load assets:", error);
          reject(error);
        });
    });
  }

  /**
   * Get current loading progress (0 to 1)
   */
  getProgress(): number {
    return this.totalCount === 0 ? 1 : this.loadedCount / this.totalCount;
  }

  /**
   * Check if all assets are loaded
   */
  isComplete(): boolean {
    return this.loadedCount === this.totalCount;
  }

  /**
   * Get loaded asset by alias
   */
  getAsset(alias: string): PIXI.Texture | undefined {
    return PIXI.Assets.get(alias);
  }
}

// Export singleton instance
export const assetLoader = new AssetLoader(ASSET_MANIFEST);

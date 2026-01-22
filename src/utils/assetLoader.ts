import * as PIXI from "pixi.js";
import { sound } from "@pixi/sound";

// Import all assets
import heroWalkAsset from "../assets/hero/walk.png";
import heroRunAsset from "../assets/hero/run.png";
import heroIdleAsset from "../assets/hero/idle.png";
import heroShootAsset from "../assets/hero/shoot.png";
import heroCoolAsset from "../assets/hero/cool.png";
import heroExplosionAsset from "../assets/hero/cool_explosion.png";
import enemyWalkAsset from "../assets/enemies/walk.png";
import enemyRunAsset from "../assets/enemies/run.png";
import enemyIdleAsset from "../assets/enemies/idle.png";
import enemyRed1Asset from "../assets/enemies/enemyRed1.png";
import enemyRed2Asset from "../assets/enemies/enemyRed2.png";
import enemyRed3Asset from "../assets/enemies/enemyRed3.png";
import enemyRed4Asset from "../assets/enemies/enemyRed4.png";
import enemyRed5Asset from "../assets/enemies/enemyRed5.png";
import enemyAnimatedAsset from "../assets/enemies/enemy.png";
import enemyExplosionAsset from "../assets/enemies/enemy_explosion.png";
import mapAsset from "../assets/back.png";
import gunsAsset from "../assets/misc/shot.png";
import spaceInvadersMusic from "../assets/sounds/start2.mp3";
import explosionSound from "../assets/sounds/explosion.wav";
import poundSound from "../assets/sounds/Pound.wav";
import level1Music from "../assets/sounds/SpaceInvaders2.mp3";

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
    alias: "hero-walk",
    src: heroWalkAsset,
    description: "Hero walking animation",
  },
  {
    alias: "hero-run",
    src: heroRunAsset,
    description: "Hero running animation",
  },
  {
    alias: "hero-idle",
    src: heroIdleAsset,
    description: "Hero idle animation",
  },
  {
    alias: "hero-shoot",
    src: heroShootAsset,
    description: "Hero shooting animation",
  },
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
    alias: "enemy-walk",
    src: enemyWalkAsset,
    description: "Enemy walking animation",
  },
  {
    alias: "enemy-run",
    src: enemyRunAsset,
    description: "Enemy running animation",
  },
  {
    alias: "enemy-idle",
    src: enemyIdleAsset,
    description: "Enemy idle animation",
  },
  {
    alias: "enemy-red-1",
    src: enemyRed1Asset,
    description: "Enemy red sprite 1",
  },
  {
    alias: "enemy-red-2",
    src: enemyRed2Asset,
    description: "Enemy red sprite 2",
  },
  {
    alias: "enemy-red-3",
    src: enemyRed3Asset,
    description: "Enemy red sprite 3",
  },
  {
    alias: "enemy-red-4",
    src: enemyRed4Asset,
    description: "Enemy red sprite 4",
  },
  {
    alias: "enemy-red-5",
    src: enemyRed5Asset,
    description: "Enemy red sprite 5",
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
    alias: "space-invaders-music",
    src: spaceInvadersMusic,
    description: "Space Invaders theme music",
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
];

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
          { alias: "space-invaders-music", src: spaceInvadersMusic },
          { alias: "explosion-sound", src: explosionSound },
          { alias: "pound-sound", src: poundSound },
          { alias: "level1-music", src: level1Music },
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

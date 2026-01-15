import * as PIXI from "pixi.js";

// Import all assets
import walkAsset from "../assets/walk.png";
import runAsset from "../assets/run.png";
import idleAsset from "../assets/idle.png";
import shootAsset from "../assets/shoot.png";
import mapAsset from "../assets/map.png";
import gunsAsset from "../assets/guns.png";

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
    src: walkAsset,
    description: "Hero walking animation",
  },
  {
    alias: "hero-run",
    src: runAsset,
    description: "Hero running animation",
  },
  {
    alias: "hero-idle",
    src: idleAsset,
    description: "Hero idle animation",
  },
  {
    alias: "hero-shoot",
    src: shootAsset,
    description: "Hero shooting animation",
  },
  {
    alias: "level-map",
    src: mapAsset,
    description: "Game level map",
  },
  {
    alias: "guns",
    src: gunsAsset,
    description: "Bullet sprites",
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
      // Track individual asset loads
      let loadedAssets = 0;

      // Load all assets
      PIXI.Assets.load(aliases, (progress) => {
        // PIXI's progress is 0 to 1
        if (onProgress) {
          const currentAsset = this.assets[Math.floor(progress * this.assets.length)]?.description || "Loading...";
          onProgress(progress, currentAsset);
        }
      })
        .then(() => {
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

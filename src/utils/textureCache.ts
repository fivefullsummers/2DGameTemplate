import * as PIXI from "pixi.js";

/**
 * Texture cache to prevent loading the same texture multiple times.
 * Ensures memory efficiency when multiple entities use the same sprite sheet.
 */
class TextureCache {
  private cache = new Map<string, PIXI.Texture>();

  /**
   * Get a texture from cache, or load it if not already cached.
   * @param assetPath - The path/URL to the texture asset
   * @returns The cached or newly loaded PIXI.Texture
   */
  getTexture(assetPath: string): PIXI.Texture {
    if (!this.cache.has(assetPath)) {
      const texture = PIXI.Texture.from(assetPath);
      
      // Ensure texture is valid before caching
      if (!texture || !texture.baseTexture) {
        console.warn(`Failed to load texture: ${assetPath}`);
      }
      
      this.cache.set(assetPath, texture);
    }
    return this.cache.get(assetPath)!;
  }

  /**
   * Clear a specific texture from cache.
   * Useful when you want to reload an asset.
   */
  clearTexture(assetPath: string): void {
    const texture = this.cache.get(assetPath);
    if (texture) {
      texture.destroy(true);
      this.cache.delete(assetPath);
    }
  }

  /**
   * Clear all cached textures.
   * Useful for cleanup or when changing scenes.
   */
  clearAll(): void {
    this.cache.forEach((texture) => texture.destroy(true));
    this.cache.clear();
  }

  /**
   * Get the number of cached textures.
   */
  get size(): number {
    return this.cache.size;
  }
}

// Export a singleton instance
export const textureCache = new TextureCache();

// Export the class for testing or custom instances
export { TextureCache };

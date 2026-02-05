import { Sprite, useTick } from "@pixi/react";
import { useState, useMemo, useEffect, RefObject } from "react";
import * as PIXI from "pixi.js";
import { BulletConfig } from "../consts/bullet-config";
import { COLLISION_MAP, COLLISION_SUB_TILE_SIZE, COLLISION_ROWS, COLLISION_COLS } from "../consts/collision-map";
import { TILE_SIZE, ENEMY_COLLISION_MULTIPLIER } from "../consts/game-world";
import { IPosition } from "../types/common";
import { ENEMY_SCALE } from "../consts/tuning-config";

export interface BulletProps {
  id: string;
  startX: number;
  startY: number;
  direction: "UP" | "DOWN" | "LEFT" | "RIGHT";
  config: BulletConfig;
  onDestroy: (id: string) => void;
  enemyPositionsRef?: RefObject<Map<string, IPosition>>;
  onEnemyHit?: (enemyId: string) => void;
}

const Bullet = ({ id, startX, startY, direction, config, onDestroy, enemyPositionsRef, onEnemyHit }: BulletProps) => {
  const [position, setPosition] = useState({ x: startX, y: startY });
  const [createdAt] = useState(Date.now());
  const [shouldDestroy, setShouldDestroy] = useState(false);

  // Get base texture from preloaded assets
  const cachedTexture = useMemo(() => {
    return PIXI.Assets.get(config.spriteAsset);
  }, [config.spriteAsset]);

  // Create texture for the bullet (single frame, no animation)
  const bulletTexture = useMemo(() => {
    // Wait for texture to load
    if (!cachedTexture.baseTexture || cachedTexture.baseTexture.width === 0) {
      return cachedTexture; // Return base texture while loading
    }

    // For shot.png, use the full texture dimensions instead of config dimensions
    // This ensures proper centering with anchor 0.5
    const textureWidth = cachedTexture.baseTexture.width;
    const textureHeight = cachedTexture.baseTexture.height;
    
    // Create rectangle for the full texture
    const rectangle = new PIXI.Rectangle(0, 0, textureWidth, textureHeight);
    
    // Create a new texture from the cached base texture using the rectangle
    const texture = new PIXI.Texture(cachedTexture.baseTexture, rectangle);
    
    return texture;
  }, [cachedTexture]);

  // Calculate rotation based on direction
  // Note: shot.png is oriented horizontally by default, so we adjust accordingly
  const rotation = useMemo(() => {
    switch (direction) {
      case "UP": return 0;    // -90 degrees (rotate left from horizontal)
      case "DOWN": return Math.PI / 2;   // 90 degrees (rotate right from horizontal)
      case "LEFT": return Math.PI;       // 180 degrees (flip horizontal)
      case "RIGHT": return 0;            // 0 degrees (default horizontal)
      default: return 0;
    }
  }, [direction]);

  // Handle destruction outside of render
  useEffect(() => {
    if (shouldDestroy) {
      onDestroy(id);
    }
  }, [shouldDestroy, id, onDestroy]);

  // Update bullet position each frame
  useTick((delta) => {
    // Check lifetime first
    if (config.lifetime > 0) {
      const age = Date.now() - createdAt;
      if (age >= config.lifetime) {
        setShouldDestroy(true);
        return;
      }
    }

    setPosition((prev) => {
      let newX = prev.x;
      let newY = prev.y;

      // Move in the specified direction
      switch (direction) {
        case "UP":
          newY -= config.speed * delta;
          break;
        case "DOWN":
          newY += config.speed * delta;
          break;
        case "LEFT":
          newX -= config.speed * delta;
          break;
        case "RIGHT":
          newX += config.speed * delta;
          break;
      }

      // Check if bullet is off screen
      const offScreenTop = newY < -TILE_SIZE;
      const offScreenBottom = newY > (COLLISION_ROWS * COLLISION_SUB_TILE_SIZE);
      const offScreenLeft = newX < -TILE_SIZE;
      const offScreenRight = newX > (COLLISION_COLS * COLLISION_SUB_TILE_SIZE);
      
      if (offScreenTop || offScreenBottom || offScreenLeft || offScreenRight) {
        setShouldDestroy(true);
        return prev;
      }

      // Check for collision with walls (bullet-specific collision check)
      // Bullets are small and centered, so we check the exact position
      const bulletCol = Math.floor((newX + TILE_SIZE) / COLLISION_SUB_TILE_SIZE);
      const bulletRow = Math.floor((newY + TILE_SIZE) / COLLISION_SUB_TILE_SIZE);
      
      // Only check collision if within the actual playable area (skip boundary padding)
      // Boundary rows: 0-1 (top) and 24-25 (bottom) are all blocked padding
      // Boundary cols: 0-1 (left) and 36-37 (right) are all blocked padding
      const isInPlayableArea = bulletRow >= 2 && bulletRow < COLLISION_ROWS - 2 && 
                                bulletCol >= 2 && bulletCol < COLLISION_COLS - 2;
      
      if (isInPlayableArea) {
        // Check if hitting an actual wall (not boundary padding)
        if (COLLISION_MAP[bulletRow][bulletCol] === 1) {
          setShouldDestroy(true);
          return prev;
        }
      }

      // Check for collision with enemies
      if (enemyPositionsRef?.current && onEnemyHit) {
        const bulletCenterX = newX;
        const bulletCenterY = newY;
        const bulletRadius = (config.frameWidth * config.scale) / 2; // Approximate bullet radius
        
        for (const [enemyId, enemyPos] of enemyPositionsRef.current.entries()) {
          // Enemy position is already centered (from getEnemyPositions)
          const enemyCenterX = enemyPos.x;
          const enemyCenterY = enemyPos.y;
          // Approximate enemy size with larger hitbox
          const enemyRadius = (TILE_SIZE * ENEMY_SCALE * ENEMY_COLLISION_MULTIPLIER) / 2;
          
          const dx = bulletCenterX - enemyCenterX;
          const dy = bulletCenterY - enemyCenterY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // Check if bullet collides with enemy
          if (distance < bulletRadius + enemyRadius) {
            // Hit an enemy!
            onEnemyHit(enemyId);
            setShouldDestroy(true);
            return prev;
          }
        }
      }

      return { x: newX, y: newY };
    });
  });

  return (
    <Sprite
      texture={bulletTexture}
      x={position.x}
      y={position.y}
      scale={config.scale}
      anchor={0.5}
      rotation={rotation}
      tint={0xffff00} // Yellow tint to make player bullets visible
    />
  );
};

export default Bullet;

import { Sprite, useTick } from "@pixi/react";
import { useState, useMemo, useEffect } from "react";
import * as PIXI from "pixi.js";
import { BulletConfig } from "../consts/bullet-config";
import { textureCache } from "../utils/textureCache";
import { isBlocked } from "../consts/collision-map";

export interface BulletProps {
  id: string;
  startX: number;
  startY: number;
  direction: "UP" | "DOWN" | "LEFT" | "RIGHT";
  config: BulletConfig;
  onDestroy: (id: string) => void;
}

const Bullet = ({ id, startX, startY, direction, config, onDestroy }: BulletProps) => {
  const [position, setPosition] = useState({ x: startX, y: startY });
  const [createdAt] = useState(Date.now());
  const [shouldDestroy, setShouldDestroy] = useState(false);

  // Get base texture from cache
  const cachedTexture = useMemo(() => {
    return textureCache.getTexture(config.spriteAsset);
  }, [config.spriteAsset]);

  // Create texture for the bullet (single frame, no animation)
  const bulletTexture = useMemo(() => {
    // Wait for texture to load
    if (!cachedTexture.baseTexture || cachedTexture.baseTexture.width === 0) {
      return cachedTexture; // Return base texture while loading
    }

    // Calculate position in sprite sheet  
    const x = config.col * config.frameWidth;
    const y = config.row * config.frameHeight;

    // Create rectangle for this specific bullet sprite
    const rectangle = new PIXI.Rectangle(x, y, config.frameWidth, config.frameHeight);
    
    // Create a new texture from the cached base texture using the rectangle
    const texture = new PIXI.Texture(cachedTexture.baseTexture, rectangle);
    
    return texture;
  }, [cachedTexture, config.col, config.row, config.frameWidth, config.frameHeight]);

  // Calculate rotation based on direction
  const rotation = useMemo(() => {
    switch (direction) {
      case "UP": return -Math.PI / 2;    // -90 degrees
      case "DOWN": return Math.PI / 2;   // 90 degrees
      case "LEFT": return Math.PI;       // 180 degrees
      case "RIGHT": return 0;            // 0 degrees
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

      // Check for collision with walls
      if (isBlocked(newX, newY)) {
        setShouldDestroy(true);
        return prev;
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
    />
  );
};

export default Bullet;

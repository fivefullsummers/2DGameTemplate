import { Sprite, useTick } from "@pixi/react";
import { useState, useMemo, useEffect } from "react";
import * as PIXI from "pixi.js";
import { TILE_SIZE } from "../consts/game-world";
import { PLAYER_COLLISION_RADIUS } from "../consts/tuning-config";

export interface EnemyBulletProps {
  id: string;
  startX: number;
  startY: number;
  onDestroy: (id: string) => void;
  onPlayerHit?: () => void;
  playerPositionRef?: React.RefObject<{ x: number; y: number }>;
  speed: number; // Speed varies based on remaining enemies
}

const EnemyBullet = ({ 
  id, 
  startX, 
  startY, 
  onDestroy, 
  onPlayerHit,
  playerPositionRef,
  speed 
}: EnemyBulletProps) => {
  const [position, setPosition] = useState({ x: startX, y: startY });
  const [shouldDestroy, setShouldDestroy] = useState(false);
  const [hasHitPlayer, setHasHitPlayer] = useState(false);

  // Get base texture from preloaded assets
  const cachedTexture = useMemo(() => {
    return PIXI.Assets.get("guns");
  }, []);

  // Create texture for the bullet (using full texture dimensions)
  const bulletTexture = useMemo(() => {
    if (!cachedTexture.baseTexture || cachedTexture.baseTexture.width === 0) {
      return cachedTexture;
    }

    // Use the full texture (shot.png) - let PixiJS determine dimensions
    const rectangle = new PIXI.Rectangle(0, 0, cachedTexture.baseTexture.width, cachedTexture.baseTexture.height);
    const texture = new PIXI.Texture(cachedTexture.baseTexture, rectangle);
    
    return texture;
  }, [cachedTexture]);

  useEffect(() => {
    if (shouldDestroy) {
      onDestroy(id);
    }
  }, [shouldDestroy, id, onDestroy]);

  // Handle player hit in useEffect to avoid setState during render
  useEffect(() => {
    if (hasHitPlayer && onPlayerHit) {
      onPlayerHit();
    }
  }, [hasHitPlayer, onPlayerHit]);

  // Update bullet position each frame
  useTick((delta) => {
    setPosition((prev) => {
      const newY = prev.y + speed * delta;

      // Check if off screen (bottom)
      if (newY > TILE_SIZE * 35) {
        setShouldDestroy(true);
        return prev;
      }

      // Check collision with player
      if (playerPositionRef?.current) {
        const playerX = playerPositionRef.current.x;
        const playerY = playerPositionRef.current.y;
        // Calculate bullet radius based on scale (0.15) and texture size
        const bulletRadius = (cachedTexture.baseTexture.width * 0.15) / 2; // scale 0.15 applied to sprite

        // Player sprite uses anchor={0.5}, so position is already centered
        // No need to add TILE_SIZE/2 offset
        const dx = prev.x - playerX;
        const dy = newY - playerY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < bulletRadius + PLAYER_COLLISION_RADIUS) {
          // Hit player!
          setHasHitPlayer(true);
          setShouldDestroy(true);
          return prev;
        }
      }

      return { x: prev.x, y: newY };
    });
  });

  return (
    <Sprite
      texture={bulletTexture}
      x={position.x}
      y={position.y}
      scale={0.05} // Much smaller scale for enemy bullets (was 0.5)
      anchor={0.5}
      tint={0xff0000} // Red tint for enemy bullets
      rotation={Math.PI} // Rotate 180 degrees to point down
    />
  );
};

export default EnemyBullet;

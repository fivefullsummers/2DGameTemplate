/**
 * EntityCollisionDebug - Visualize collision boundaries for entities
 * Shows circular collision zones around player and enemies
 */

import { Graphics, useTick } from "@pixi/react";
import { Graphics as PixiGraphics } from "pixi.js";
import { useCallback, useRef } from "react";
import { TILE_SIZE, ENEMY_COLLISION_MULTIPLIER } from "../consts/game-world";
import { ENEMY_SCALE } from "../consts/tuning-config";
import { IPosition } from "../types/common";

interface EnemyData {
  id: string;
  x: number;
  y: number;
  spriteIndex: number;
  positionRef: React.MutableRefObject<IPosition>;
}

interface EntityCollisionDebugProps {
  isVisible?: boolean;
  playerPositionRef?: React.MutableRefObject<IPosition>;
  enemies?: EnemyData[];
}

const EntityCollisionDebug = ({ 
  isVisible = true, 
  playerPositionRef,
  enemies = []
}: EntityCollisionDebugProps) => {
  
  // Collision radius calculations (matching the actual collision detection)
  const PLAYER_RADIUS = TILE_SIZE / 2; // 16 pixels (from EnemyBullet.tsx line 76)
  const ENEMY_RADIUS = (TILE_SIZE * ENEMY_SCALE * ENEMY_COLLISION_MULTIPLIER) / 2; // Actual collision area
  
  const graphicsRef = useRef<PixiGraphics>(null);

  // Update every frame to track positions smoothly
  useTick(() => {
    if (!graphicsRef.current || !isVisible) return;

    const g = graphicsRef.current;
    g.clear();

    // Draw player collision boundary
    if (playerPositionRef?.current) {
      const playerPosition = playerPositionRef.current;
      
      // Player sprite uses anchor={0.5}, so position is already the center
      const collisionCenterX = playerPosition.x;
      const collisionCenterY = playerPosition.y;
      
      // Effective collision radius includes bullet radius (8px) + player radius (16px) = 24px total
      const bulletRadius = 8;
      const effectiveRadius = PLAYER_RADIUS + bulletRadius;
      
      // Draw center point
      g.lineStyle(0);
      g.beginFill(0x00ff00, 1.0);
      g.drawCircle(collisionCenterX, collisionCenterY, 3);
      g.endFill();
      
      // Draw crosshair at collision center
      g.lineStyle(1, 0x00ff00, 0.6);
      g.moveTo(collisionCenterX - 8, collisionCenterY);
      g.lineTo(collisionCenterX + 8, collisionCenterY);
      g.moveTo(collisionCenterX, collisionCenterY - 8);
      g.lineTo(collisionCenterX, collisionCenterY + 8);
      
      // Draw player hitbox (just player radius, not including bullet)
      g.lineStyle(2, 0x00ff00, 0.5); // Green, semi-transparent
      g.drawCircle(collisionCenterX, collisionCenterY, PLAYER_RADIUS);
      
      // Draw EFFECTIVE collision area (includes bullet radius)
      g.lineStyle(3, 0x00ff00, 0.9); // Green, thick, very visible
      g.drawCircle(collisionCenterX, collisionCenterY, effectiveRadius);
      
      // Add a filled semi-transparent area to show the danger zone
      g.lineStyle(0);
      g.beginFill(0x00ff00, 0.15);
      g.drawCircle(collisionCenterX, collisionCenterY, effectiveRadius);
      g.endFill();
    }

    // Draw enemy collision boundaries
    enemies.forEach((enemy) => {
      const enemyPos = enemy.positionRef.current;
      
      // Draw outer circle (collision boundary)
      g.lineStyle(2, 0xff0000, 0.8); // Red, thick, mostly opaque
      g.drawCircle(
        enemyPos.x,
        enemyPos.y,
        ENEMY_RADIUS
      );
      
      // Draw center point
      g.lineStyle(0);
      g.beginFill(0xff0000, 0.8);
      g.drawCircle(enemyPos.x, enemyPos.y, 2);
      g.endFill();
      
      // Draw filled semi-transparent area
      g.beginFill(0xff0000, 0.1);
      g.drawCircle(enemyPos.x, enemyPos.y, ENEMY_RADIUS);
      g.endFill();
    });
  });

  // Initial draw callback (for Graphics component)
  const draw = useCallback((g: PixiGraphics) => {
    graphicsRef.current = g;
    // Initial draw will be handled by useTick
  }, []);

  if (!isVisible) {
    return null;
  }

  return <Graphics draw={draw} />;
};

export default EntityCollisionDebug;

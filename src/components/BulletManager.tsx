import { Container } from "@pixi/react";
import { useState, useCallback, forwardRef, useImperativeHandle, RefObject } from "react";
import Bullet from "./Bullet";
import { BULLET_TYPES, BulletConfig } from "../consts/bullet-config";
import { IPosition } from "../types/common";

interface BulletData {
  id: string;
  x: number;
  y: number;
  direction: "UP" | "DOWN" | "LEFT" | "RIGHT";
  config: BulletConfig;
}

export interface BulletManagerRef {
  spawnBullet: (
    x: number,
    y: number,
    direction: "UP" | "DOWN" | "LEFT" | "RIGHT",
    bulletType?: string
  ) => void;
}

interface BulletManagerProps {
  enemyPositionsRef?: RefObject<Map<string, IPosition>>;
  onEnemyHit?: (enemyId: string) => void;
  maxBullets?: number; // Space Invaders style: limit bullets on screen (default: unlimited)
}

const BulletManager = forwardRef<BulletManagerRef, BulletManagerProps>(
  ({ enemyPositionsRef, onEnemyHit, maxBullets }, ref) => {
  const [bullets, setBullets] = useState<BulletData[]>([]);

  // Spawn a new bullet
  const spawnBullet = useCallback(
    (
      x: number,
      y: number,
      direction: "UP" | "DOWN" | "LEFT" | "RIGHT",
      bulletType: string = "basic"
    ) => {
      // Check bullet limit (Space Invaders allows only 1 bullet)
      if (maxBullets !== undefined && bullets.length >= maxBullets) {
        return; // Don't spawn if at max
      }

      const config = BULLET_TYPES[bulletType];
      if (!config) {
        console.warn(`Unknown bullet type: ${bulletType}`);
        return;
      }

      const newBullet: BulletData = {
        id: `bullet-${Date.now()}-${Math.random()}`,
        x,
        y,
        direction,
        config,
      };

      setBullets((prev) => [...prev, newBullet]);
    },
    [maxBullets, bullets.length]
  );

  // Remove a bullet by ID
  const destroyBullet = useCallback((id: string) => {
    setBullets((prev) => prev.filter((bullet) => bullet.id !== id));
  }, []);

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    spawnBullet,
  }));

  return (
    <Container>
      {bullets.map((bullet) => (
        <Bullet
          key={bullet.id}
          id={bullet.id}
          startX={bullet.x}
          startY={bullet.y}
          direction={bullet.direction}
          config={bullet.config}
          onDestroy={destroyBullet}
          enemyPositionsRef={enemyPositionsRef}
          onEnemyHit={onEnemyHit}
        />
      ))}
    </Container>
  );
});

BulletManager.displayName = "BulletManager";

export default BulletManager;

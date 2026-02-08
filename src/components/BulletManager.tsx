import { Container, useTick } from "@pixi/react";
import { useState, useCallback, forwardRef, useImperativeHandle, RefObject } from "react";
import { sound } from "@pixi/sound";
import Bullet from "./Bullet";
import { BULLET_TYPES, BulletConfig } from "../consts/bullet-config";
import { IPosition } from "../types/common";
import {
  COLLISION_MAP,
  COLLISION_SUB_TILE_SIZE,
  COLLISION_ROWS,
  COLLISION_COLS,
} from "../consts/collision-map";
import { TILE_SIZE, ENEMY_COLLISION_MULTIPLIER } from "../consts/game-world";
import { ENEMY_SCALE } from "../consts/tuning-config";

interface BulletData {
  id: string;
  x: number;
  y: number;
  direction: "UP" | "DOWN" | "LEFT" | "RIGHT";
  config: BulletConfig;
  bulletType: string; // key in BULLET_TYPES, e.g. "basic", "spreader"
  createdAt: number;
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
  onEnemyHit?: (enemyId: string, bulletType: string) => void;
}

const BulletManager = forwardRef<BulletManagerRef, BulletManagerProps>(
  ({ enemyPositionsRef, onEnemyHit }, ref) => {
    const [bullets, setBullets] = useState<BulletData[]>([]);

    const spawnBullet = useCallback(
      (
        x: number,
        y: number,
        direction: "UP" | "DOWN" | "LEFT" | "RIGHT",
        bulletType: string = "basic"
      ) => {
        const config = BULLET_TYPES[bulletType];
        if (!config) return;

        setBullets((prev) => {
          const sameTypeCount = prev.filter((b) => b.bulletType === bulletType).length;
          if (sameTypeCount >= config.maxOnScreen) return prev;
          const newBullet: BulletData = {
            id: `bullet-${Date.now()}-${Math.random()}`,
            x,
            y,
            direction,
            config,
            bulletType,
            createdAt: Date.now(),
          };
          const soundId = config.soundId ?? "pound-sound";
          const fireSfx = sound.find(soundId);
          if (fireSfx) fireSfx.play({ volume: soundId === "pound-sound" ? 0.05 : 0.5 });
          return [...prev, newBullet];
        });
      },
      []
    );

    useImperativeHandle(ref, () => ({ spawnBullet }), [spawnBullet]);

    // Single tick: update all bullet positions, collision, lifetime; one setState per frame
    useTick((delta) => {
      if (bullets.length === 0) return;

      const enemyPositions = enemyPositionsRef?.current;
      const nextBullets: BulletData[] = [];
      const enemyRadius =
        enemyPositions && onEnemyHit
          ? (TILE_SIZE * ENEMY_SCALE * ENEMY_COLLISION_MULTIPLIER) / 2
          : 0;

      for (const bullet of bullets) {
        if (bullet.config.lifetime > 0) {
          const age = Date.now() - bullet.createdAt;
          if (age >= bullet.config.lifetime) continue;
        }

        let newX = bullet.x;
        let newY = bullet.y;
        switch (bullet.direction) {
          case "UP":
            newY -= bullet.config.speed * delta;
            break;
          case "DOWN":
            newY += bullet.config.speed * delta;
            break;
          case "LEFT":
            newX -= bullet.config.speed * delta;
            break;
          case "RIGHT":
            newX += bullet.config.speed * delta;
            break;
        }

        const offScreenTop = newY < -TILE_SIZE;
        const offScreenBottom = newY > COLLISION_ROWS * COLLISION_SUB_TILE_SIZE;
        const offScreenLeft = newX < -TILE_SIZE;
        const offScreenRight = newX > COLLISION_COLS * COLLISION_SUB_TILE_SIZE;
        if (offScreenTop || offScreenBottom || offScreenLeft || offScreenRight) continue;

        const bulletCol = Math.floor((newX + TILE_SIZE) / COLLISION_SUB_TILE_SIZE);
        const bulletRow = Math.floor((newY + TILE_SIZE) / COLLISION_SUB_TILE_SIZE);
        const isInPlayableArea =
          bulletRow >= 2 &&
          bulletRow < COLLISION_ROWS - 2 &&
          bulletCol >= 2 &&
          bulletCol < COLLISION_COLS - 2;
        if (isInPlayableArea && COLLISION_MAP[bulletRow][bulletCol] === 1) continue;

        let hitEnemy = false;
        if (enemyPositions && onEnemyHit) {
          const bulletRadius = (bullet.config.frameWidth * bullet.config.scale) / 2;
          for (const [enemyId, enemyPos] of enemyPositions.entries()) {
            const dx = newX - enemyPos.x;
            const dy = newY - enemyPos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < bulletRadius + enemyRadius) {
              onEnemyHit(enemyId, bullet.bulletType);
              hitEnemy = true;
              break;
            }
          }
        }
        if (hitEnemy) continue;

        nextBullets.push({ ...bullet, x: newX, y: newY });
      }

      setBullets(nextBullets);
    });

    return (
      <Container>
        {bullets.map((bullet) => (
          <Bullet
            key={bullet.id}
            id={bullet.id}
            x={bullet.x}
            y={bullet.y}
            direction={bullet.direction}
            config={bullet.config}
          />
        ))}
      </Container>
    );
  }
);

BulletManager.displayName = "BulletManager";

export default BulletManager;

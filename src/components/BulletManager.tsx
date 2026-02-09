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
import {
  TILE_SIZE,
  ENEMY_BULLET_HIT_RADIUS,
  BULLET_VS_BULLET_HIT_RADIUS,
  BULLET_ATTRACTION_RADIUS,
  BULLET_ATTRACTION_STRENGTH,
  isDesktop,
} from "../consts/game-world";

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
  /** Enemy bullet positions (id -> {x,y,isPowerupBullet}) for collision; both bullets destroyed on hit; powerup only if green. */
  enemyBulletPositionsRef?: RefObject<Map<string, { x: number; y: number; isPowerupBullet?: boolean }>>;
  onPlayerBulletHitEnemyBullet?: (x: number, y: number, enemyBulletId: string, isPowerupBullet: boolean) => void;
  /** Powerup positions (id -> {x,y}) for collision; when player bullet hits one, callback is called. */
  powerupPositionsRef?: RefObject<Map<string, { x: number; y: number }>>;
  onPlayerBulletHitPowerup?: (powerupId: string) => void;
}

const BulletManager = forwardRef<BulletManagerRef, BulletManagerProps>(
  ({ enemyPositionsRef, onEnemyHit, enemyBulletPositionsRef, onPlayerBulletHitEnemyBullet, powerupPositionsRef, onPlayerBulletHitPowerup }, ref) => {
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
      const enemyBulletHitRadius = enemyPositions && onEnemyHit ? ENEMY_BULLET_HIT_RADIUS : 0;

      for (const bullet of bullets) {
        const age = Date.now() - bullet.createdAt;
        if (bullet.config.lifetime > 0 && age >= bullet.config.lifetime) continue;

        const cruiseSpeed = bullet.config.speed;
        const mult = bullet.config.initialSpeedMultiplier ?? 1;
        const decayMs = bullet.config.speedDecayMs ?? 0;
        let effectiveSpeed = cruiseSpeed;
        if (mult > 1 && decayMs > 0) {
          const t = Math.exp(-age / decayMs);
          const desktopInitialBoostScale = isDesktop() ? 0.5 : 1; // Soften explosive start on desktop only
          effectiveSpeed = cruiseSpeed * (1 + (mult - 1) * t * desktopInitialBoostScale);
        }

        let newX = bullet.x;
        let newY = bullet.y;
        switch (bullet.direction) {
          case "UP":
            newY -= effectiveSpeed * delta;
            break;
          case "DOWN":
            newY += effectiveSpeed * delta;
            break;
          case "LEFT":
            newX -= effectiveSpeed * delta;
            break;
          case "RIGHT":
            newX += effectiveSpeed * delta;
            break;
        }

        // Attraction: only toward green powerup bullets. Regular red bullets no longer attract player shots.
        const enemyBulletPositionsForAttraction = enemyBulletPositionsRef?.current;
        if (enemyBulletPositionsForAttraction && onPlayerBulletHitEnemyBullet) {
          let nearestDist = Infinity;
          let nearestPos: { x: number; y: number } | null = null;
          for (const enemyPos of enemyBulletPositionsForAttraction.values()) {
            if (!enemyPos.isPowerupBullet) continue;
            const dx = enemyPos.x - newX;
            const dy = enemyPos.y - newY;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d < nearestDist && d < BULLET_ATTRACTION_RADIUS && d > 0) {
              nearestDist = d;
              nearestPos = enemyPos;
            }
          }
          if (nearestPos) {
            const dx = nearestPos.x - newX;
            const dy = nearestPos.y - newY;
            const invDist = 1 / nearestDist;
            const pull = BULLET_ATTRACTION_STRENGTH * delta;
            newX += dx * invDist * pull;
            newY += dy * invDist * pull;
          }
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

        // Player bullet vs enemy bullet. OFF for regular bullets (bullets pass through); ON for green powerup bullets only.
        // To re-enable collision for all: remove the "enemyPos.isPowerupBullet" check below.
        const enemyBulletPositions = enemyBulletPositionsRef?.current;
        let hitEnemyBullet = false;
        if (enemyBulletPositions && onPlayerBulletHitEnemyBullet) {
          for (const [enemyBulletId, enemyPos] of enemyBulletPositions.entries()) {
            const dx = newX - enemyPos.x;
            const dy = newY - enemyPos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < BULLET_VS_BULLET_HIT_RADIUS && enemyPos.isPowerupBullet) {
              onPlayerBulletHitEnemyBullet(newX, newY, enemyBulletId, true);
              hitEnemyBullet = true;
              break;
            }
          }
        }
        if (hitEnemyBullet) continue;

        const bulletRadius = (bullet.config.frameWidth * bullet.config.scale) / 2;

        // Player bullet vs powerup: collect powerup (callback handles removal and bullet type)
        const powerupPositions = powerupPositionsRef?.current;
        const POWERUP_COLLISION_RADIUS = 12;
        let hitPowerup = false;
        if (powerupPositions && onPlayerBulletHitPowerup) {
          for (const [powerupId, powerupPos] of powerupPositions.entries()) {
            const dx = newX - powerupPos.x;
            const dy = newY - powerupPos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < bulletRadius + POWERUP_COLLISION_RADIUS) {
              onPlayerBulletHitPowerup(powerupId);
              hitPowerup = true;
              break;
            }
          }
        }
        if (hitPowerup) continue;

        let hitEnemy = false;
        if (enemyPositions && onEnemyHit) {
          for (const [enemyId, enemyPos] of enemyPositions.entries()) {
            const dx = newX - enemyPos.x;
            const dy = newY - enemyPos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < bulletRadius + enemyBulletHitRadius) {
              // Delegate special behavior (spreader, lineGun, etc.) to onEnemyHit,
              // just like other bullet types.
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

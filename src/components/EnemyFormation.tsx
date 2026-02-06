import { Container, useTick } from "@pixi/react";
import { useState, useCallback, useRef, useMemo } from "react";
import * as PIXI from "pixi.js";
import { ENEMY_SCALE, PLAYER_START_Y } from "../consts/tuning-config";
import { TILE_SIZE, COLS } from "../consts/game-world";
import { IPosition } from "../types/common";
import { textureCache } from "../utils/textureCache";
import enemyAnimatedAsset from "../assets/enemies/enemy.png";
import { gameState } from "../utils/GameState";

const ENEMY_BULLET_SCALE = 0.05;
const ENEMY_BULLET_TINT = 0xff0000;
const PLAYER_RADIUS = TILE_SIZE / 2;

// Enemy animation configuration
// Frame sequence: 0 -> 1 -> 2 -> 1 -> 0 (5-step cycle)
const FRAME_SEQUENCE = [0, 1, 2, 1];
const ENEMY_FRAME_WIDTH = 512; // Each frame is 512 pixels wide (1536px / 3 frames)
const ENEMY_FRAME_HEIGHT = 288; // Frame height (sprite sheet is 1536x288)

// Explosion animation configuration
const EXPLOSION_FRAME_SEQUENCE = [0, 1, 2]; // 3 frame explosion
const EXPLOSION_FRAME_WIDTH = 512; // Same width as enemy frames (1536px / 3 frames)
const EXPLOSION_SPEED = 0.8; // Faster animation speed for snappier explosion (increased from 0.15)

interface EnemyData {
  id: string;
  x: number;
  y: number;
  spriteIndex: number;
  positionRef: React.MutableRefObject<IPosition>;
  animFrame?: number; // Current animation frame index in sequence
  lastX?: number; // Track last x position to detect movement
  isExploding?: boolean; // Track if enemy is playing explosion animation
}

interface EnemyFormationProps {
  enemies: EnemyData[];
  onEnemyRemove: (enemyId: string) => void;
  playerPositionRef?: React.RefObject<{ x: number; y: number }>;
  onPlayerHit?: () => void;
}

interface EnemyBulletData {
  id: string;
  x: number;
  y: number;
}

const EnemyFormation = ({ enemies, onEnemyRemove, playerPositionRef, onPlayerHit }: EnemyFormationProps) => {
  const [direction, setDirection] = useState<1 | -1>(1); // 1 = right, -1 = left
  const [enemyBullets, setEnemyBullets] = useState<EnemyBulletData[]>([]);
  const lastMoveTime = useRef<number>(Date.now());
  const lastShootTime = useRef<number>(Date.now());
  const initialEnemyCount = useRef<number>(enemies.length);

  // Imperative sprite management (no per-frame React re-renders)
  const containerRef = useRef<PIXI.Container>(null);
  const enemySpriteMapRef = useRef<Map<string, PIXI.Sprite>>(new Map());
  const bulletSpriteMapRef = useRef<Map<string, PIXI.Sprite>>(new Map());
  const bulletPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  const explosionSpriteMapRef = useRef<Map<string, PIXI.Sprite>>(new Map());

  // Initialize animation state for each enemy
  const enemyAnimState = useRef<Map<string, { frameIndex: number; lastX: number }>>(new Map());
  
  // Track explosion animation state
  const explosionState = useRef<Map<string, { frameIndex: number; frameAccumulator: number }>>(new Map());
  
  // Initialize animation state for new enemies
  enemies.forEach((enemy) => {
    if (!enemyAnimState.current.has(enemy.id)) {
      enemyAnimState.current.set(enemy.id, { 
        frameIndex: 0, 
        lastX: enemy.positionRef.current.x 
      });
    }
    
    // Initialize explosion state for newly exploding enemies
    if (enemy.isExploding && !explosionState.current.has(enemy.id)) {
      explosionState.current.set(enemy.id, {
        frameIndex: 0,
        frameAccumulator: 0,
      });
    }
  });

  // Same easing as player: lerp display position toward target for smooth movement
  const ACCELERATION_FACTOR = 0.18; // 0–1, higher = snappier, lower = more floaty

  // Display positions (eased); logical position stays in positionRef for gameplay
  const displayPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());

  // Space Invaders movement parameters
  const HORIZONTAL_STEP = TILE_SIZE / 8; // Small step per move (4 pixels)
  const VERTICAL_STEP = TILE_SIZE / 2; // Half a tile down when hitting edge
  const BASE_MOVE_DELAY = 800; // Base delay in ms when all enemies alive
  const MIN_MOVE_DELAY = 150; // Minimum delay (when few enemies left)
  
  // Space Invaders shooting parameters
  const MAX_ENEMY_BULLETS = 2; // Only 3 enemy bullets on screen at once
  const BASE_SHOOT_DELAY = 1500; // Base delay between shots (1.5 seconds)
  const MIN_SHOOT_DELAY = 1500; // Minimum delay when few enemies left
  const BULLET_SPEED_NORMAL = 4; // Normal bullet speed (pixels per frame)
  const BULLET_SPEED_FAST = 5; // Fast bullet speed when ≤8 enemies
  const FEW_ENEMIES_THRESHOLD = 8; // Speed up bullets when this many or fewer
  
  // Screen boundaries (accounting for game world)
  const LEFT_BOUNDARY = TILE_SIZE * 1.5;
  const RIGHT_BOUNDARY = (COLS - 2.5) * TILE_SIZE;

  // Calculate current move delay based on remaining enemy count
  const getMoveDelay = useCallback(() => {
    if (enemies.length === 0) return BASE_MOVE_DELAY;
    
    // Speed increases as enemies die (fewer enemies = faster movement)
    const speedMultiplier = enemies.length / initialEnemyCount.current;
    const delay = BASE_MOVE_DELAY * speedMultiplier;
    
    return Math.max(delay, MIN_MOVE_DELAY);
  }, [enemies.length]);

  // Calculate current shoot delay (faster as enemies die)
  const getShootDelay = useCallback(() => {
    if (enemies.length === 0) return BASE_SHOOT_DELAY;
    
    const speedMultiplier = enemies.length / initialEnemyCount.current;
    const delay = BASE_SHOOT_DELAY * speedMultiplier;
    
    return Math.max(delay, MIN_SHOOT_DELAY);
  }, [enemies.length]);

  // Get bullet speed based on enemy count
  const getBulletSpeed = useCallback(() => {
    return enemies.length <= FEW_ENEMIES_THRESHOLD ? BULLET_SPEED_FAST : BULLET_SPEED_NORMAL;
  }, [enemies.length]);

  // Find bottommost enemies in each column (only these can shoot)
  const getBottommostEnemies = useCallback(() => {
    if (enemies.length === 0) return [];

    // Group enemies by column (x position)
    const columnMap = new Map<number, EnemyData[]>();
    
    enemies.forEach((enemy) => {
      const x = Math.round(enemy.positionRef.current.x);
      if (!columnMap.has(x)) {
        columnMap.set(x, []);
      }
      columnMap.get(x)!.push(enemy);
    });

    // Get the bottommost (highest y value) enemy in each column
    const bottommost: EnemyData[] = [];
    columnMap.forEach((columnEnemies) => {
      let bottom = columnEnemies[0];
      columnEnemies.forEach((enemy) => {
        if (enemy.positionRef.current.y > bottom.positionRef.current.y) {
          bottom = enemy;
        }
      });
      bottommost.push(bottom);
    });

    return bottommost;
  }, [enemies]);

  // Spawn enemy bullet
  const spawnEnemyBullet = useCallback(() => {
    // Check bullet limit
    if (enemyBullets.length >= MAX_ENEMY_BULLETS) return;

    // Get eligible shooters (bottommost in each column)
    const shooters = getBottommostEnemies();
    if (shooters.length === 0) return;

    // Pick random shooter
    const shooter = shooters[Math.floor(Math.random() * shooters.length)];
    
    const newBullet: EnemyBulletData = {
      id: `enemy-bullet-${Date.now()}-${Math.random()}`,
      x: shooter.positionRef.current.x,
      y: shooter.positionRef.current.y + TILE_SIZE / 2, // Start below enemy
    };

    bulletPositionsRef.current.set(newBullet.id, { x: newBullet.x, y: newBullet.y });
    setEnemyBullets((prev) => [...prev, newBullet]);
  }, [enemyBullets.length, getBottommostEnemies]);

  // Check if any enemy would hit the boundary
  const checkBoundary = useCallback(() => {
    if (enemies.length === 0) return { hitLeft: false, hitRight: false };

    let minX = Infinity;
    let maxX = -Infinity;

    enemies.forEach((enemy) => {
      const x = enemy.positionRef.current.x;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
    });

    const hitRight = maxX + HORIZONTAL_STEP >= RIGHT_BOUNDARY;
    const hitLeft = minX - HORIZONTAL_STEP <= LEFT_BOUNDARY;

    return { hitLeft, hitRight };
  }, [enemies]);

  // Move all enemies together (Space Invaders style), update bullets, sync imperative sprites
  useTick((delta) => {
    const container = containerRef.current;
    const bulletTexture = enemyBulletTextureRef.current;

    if (enemies.length === 0) {
      if (container) {
        enemySpriteMapRef.current.forEach((sprite) => {
          container.removeChild(sprite);
          sprite.destroy();
        });
        enemySpriteMapRef.current.clear();
        bulletSpriteMapRef.current.forEach((sprite) => {
          container.removeChild(sprite);
          sprite.destroy();
        });
        bulletSpriteMapRef.current.clear();
        bulletPositionsRef.current.clear();
      }
      return;
    }

    const now = Date.now();

    // Handle explosion animations (separate explosion sprites)
    enemies.forEach((enemy) => {
      if (!enemy.isExploding) return;

      const expState = explosionState.current.get(enemy.id);
      if (expState) {
        // Advance explosion animation
        expState.frameAccumulator += EXPLOSION_SPEED * delta;
        if (expState.frameAccumulator >= 1) {
          expState.frameAccumulator = 0;
          expState.frameIndex += 1;

          // Explosion finished: clean up sprite and enemy
          if (expState.frameIndex >= EXPLOSION_FRAME_SEQUENCE.length) {
            const expSprite = explosionSpriteMapRef.current.get(enemy.id);
            if (expSprite && container) {
              container.removeChild(expSprite);
              expSprite.destroy();
              explosionSpriteMapRef.current.delete(enemy.id);
            }
            onEnemyRemove(enemy.id);
            explosionState.current.delete(enemy.id);
            return;
          }
        }
      }

      // Drive dedicated explosion sprite (not the main enemy sprite)
      const base = explosionBaseTexture;
      const frames = explosionFrameTextures;
      if (base && frames.size > 0 && container) {
        const state = explosionState.current.get(enemy.id);
        if (!state) return;
        const actualFrame = EXPLOSION_FRAME_SEQUENCE[state.frameIndex] ?? 0;
        const texture =
          frames.get(actualFrame) ??
          base;

        let expSprite = explosionSpriteMapRef.current.get(enemy.id);
        if (!expSprite) {
          expSprite = new PIXI.Sprite(texture);
          expSprite.anchor.set(0.5);
          expSprite.scale.set(ENEMY_SCALE);
          explosionSpriteMapRef.current.set(enemy.id, expSprite);
          container.addChild(expSprite);
        }
        expSprite.x = enemy.positionRef.current.x;
        expSprite.y = enemy.positionRef.current.y;
        expSprite.texture = texture;
      }
    });

    const activeEnemies = enemies.filter((e) => !e.isExploding);
    if (activeEnemies.length === 0) {
      // Still sync display (exploding enemies) and bullets
    } else {
      // Ease display position toward logical position
      activeEnemies.forEach((enemy) => {
        let display = displayPositionsRef.current.get(enemy.id);
        const target = enemy.positionRef.current;
        if (!display) {
          display = { x: target.x, y: target.y };
          displayPositionsRef.current.set(enemy.id, display);
        }
        display.x += (target.x - display.x) * ACCELERATION_FACTOR;
        display.y += (target.y - display.y) * ACCELERATION_FACTOR;
      });

      // Handle movement
      const moveDelay = getMoveDelay();
      if (now - lastMoveTime.current >= moveDelay) {
        lastMoveTime.current = now;
        const { hitLeft, hitRight } = checkBoundary();

        if ((direction === 1 && hitRight) || (direction === -1 && hitLeft)) {
          activeEnemies.forEach((enemy) => {
            enemy.positionRef.current.y += VERTICAL_STEP;
          });
          const bottomMostY = activeEnemies.reduce(
            (maxY, enemy) => Math.max(maxY, enemy.positionRef.current.y),
            -Infinity
          );
          if (bottomMostY >= PLAYER_START_Y) {
            gameState.triggerGameOver();
            return;
          }
          setDirection((prev) => (prev === 1 ? -1 : 1));
        } else {
          activeEnemies.forEach((enemy) => {
            enemy.positionRef.current.x += HORIZONTAL_STEP * direction;
            const animState = enemyAnimState.current.get(enemy.id);
            if (animState && Math.abs(enemy.positionRef.current.x - animState.lastX) >= HORIZONTAL_STEP) {
              animState.frameIndex = (animState.frameIndex + 1) % FRAME_SEQUENCE.length;
              animState.lastX = enemy.positionRef.current.x;
            }
          });
        }
      }
    }

    // Clean up display positions for removed enemies
    displayPositionsRef.current.forEach((_, id) => {
      if (!enemies.some((e) => e.id === id)) {
        displayPositionsRef.current.delete(id);
      }
    });

    // Handle shooting
    const shootDelay = getShootDelay();
    if (now - lastShootTime.current >= shootDelay) {
      lastShootTime.current = now;
      spawnEnemyBullet();
    }

    // Update enemy bullet positions and check collision/off-screen
    const bulletSpeed = getBulletSpeed();
    const idsToRemove = new Set<string>();
    let didHitPlayer = false;
    const bulletRadius = bulletTexture?.baseTexture?.width
      ? (bulletTexture.baseTexture.width * ENEMY_BULLET_SCALE) / 2
      : 4;

    enemyBullets.forEach((bullet) => {
      const pos = bulletPositionsRef.current.get(bullet.id) ?? { x: bullet.x, y: bullet.y };
      pos.y += bulletSpeed * delta;
      bulletPositionsRef.current.set(bullet.id, pos);

      if (pos.y > TILE_SIZE * 35) {
        idsToRemove.add(bullet.id);
      } else if (playerPositionRef?.current) {
        const playerX = playerPositionRef.current.x;
        const playerY = playerPositionRef.current.y;
        const dx = pos.x - playerX;
        const dy = pos.y - playerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < bulletRadius + PLAYER_RADIUS) {
          idsToRemove.add(bullet.id);
          didHitPlayer = true;
        }
      }
    });

    if (idsToRemove.size > 0) {
      idsToRemove.forEach((id) => {
        bulletPositionsRef.current.delete(id);
        const sprite = bulletSpriteMapRef.current.get(id);
        if (sprite && container) {
          container.removeChild(sprite);
          sprite.destroy();
          bulletSpriteMapRef.current.delete(id);
        }
      });
      if (didHitPlayer) onPlayerHit?.();
      setEnemyBullets((prev) => prev.filter((b) => !idsToRemove.has(b.id)));
    }

    // Sync imperative enemy sprites (only live enemies; explosions use separate sprites)
    if (container) {
      enemies.forEach((enemy) => {
        // If this enemy is exploding, its normal sprite should be gone
        if (enemy.isExploding) {
          const deadSprite = enemySpriteMapRef.current.get(enemy.id);
          if (deadSprite) {
            container.removeChild(deadSprite);
            deadSprite.destroy();
            enemySpriteMapRef.current.delete(enemy.id);
          }
          return;
        }

        const display = displayPositionsRef.current.get(enemy.id) ?? enemy.positionRef.current;
        let sprite = enemySpriteMapRef.current.get(enemy.id);
        if (!sprite) {
          sprite = new PIXI.Sprite(getEnemyTexture(enemy.id));
          sprite.anchor.set(0.5);
          sprite.scale.set(ENEMY_SCALE);
          enemySpriteMapRef.current.set(enemy.id, sprite);
        }
        sprite.x = display.x;
        sprite.y = display.y;
        sprite.texture = getEnemyTexture(enemy.id);
        if (!sprite.parent) container.addChild(sprite);
      });
      enemySpriteMapRef.current.forEach((sprite, id) => {
        if (!enemies.some((e) => e.id === id)) {
          container.removeChild(sprite);
          sprite.destroy();
          enemySpriteMapRef.current.delete(id);
        }
      });

      // Sync imperative bullet sprites (skip bullets we just removed this tick — state is still stale)
      if (bulletTexture) {
        enemyBullets.forEach((bullet) => {
          if (idsToRemove.has(bullet.id)) return;
          const pos = bulletPositionsRef.current.get(bullet.id) ?? { x: bullet.x, y: bullet.y };
          let sprite = bulletSpriteMapRef.current.get(bullet.id);
          if (!sprite) {
            sprite = new PIXI.Sprite(bulletTexture);
            sprite.anchor.set(0.5);
            sprite.scale.set(ENEMY_BULLET_SCALE);
            sprite.tint = ENEMY_BULLET_TINT;
            sprite.rotation = Math.PI;
            bulletSpriteMapRef.current.set(bullet.id, sprite);
          }
          sprite.x = pos.x;
          sprite.y = pos.y;
          if (!sprite.parent) container.addChild(sprite);
        });
        bulletSpriteMapRef.current.forEach((sprite, id) => {
          if (!enemyBullets.some((b) => b.id === id)) {
            container.removeChild(sprite);
            sprite.destroy();
            bulletSpriteMapRef.current.delete(id);
            bulletPositionsRef.current.delete(id);
          }
        });
      }
    }
  });

  // Get cached texture for enemy animation sprite sheet
  const enemyBaseTexture = useMemo(() => {
    return textureCache.getTexture(enemyAnimatedAsset);
  }, []);

  // Get cached texture for enemy explosion sprite sheet
  const explosionBaseTexture = useMemo(() => {
    return PIXI.Assets.get("enemy-explosion");
  }, []);

  // Pre-create frame textures for enemy and explosion sheets (avoid per-frame allocations)
  const enemyFrameTextures = useMemo(() => {
    const map = new Map<number, PIXI.Texture>();
    const base = enemyBaseTexture.baseTexture;
    if (!base) return map;
    const uniqueFrames = [...new Set(FRAME_SEQUENCE)];
    uniqueFrames.forEach((actualFrame) => {
      const x = actualFrame * ENEMY_FRAME_WIDTH;
      const y = 0;
      const rect = new PIXI.Rectangle(x, y, ENEMY_FRAME_WIDTH, ENEMY_FRAME_HEIGHT);
      map.set(actualFrame, new PIXI.Texture(base, rect));
    });
    return map;
  }, [enemyBaseTexture]);

  const explosionFrameTextures = useMemo(() => {
    const map = new Map<number, PIXI.Texture>();
    const base = explosionBaseTexture?.baseTexture;
    if (!base || base.width === 0) return map;
    const frameHeight = base.height;
    EXPLOSION_FRAME_SEQUENCE.forEach((actualFrame) => {
      const x = actualFrame * EXPLOSION_FRAME_WIDTH;
      const y = 0;
      const rect = new PIXI.Rectangle(x, y, EXPLOSION_FRAME_WIDTH, frameHeight);
      map.set(actualFrame, new PIXI.Texture(base, rect));
    });
    return map;
  }, [explosionBaseTexture]);

  // Get sprite texture for a live enemy (no explosion frames)
  const getEnemyTexture = useCallback(
    (enemyId: string) => {
      const animState = enemyAnimState.current.get(enemyId);
      if (!animState) return enemyBaseTexture;
      const actualFrame = FRAME_SEQUENCE[animState.frameIndex] ?? 0;
      return enemyFrameTextures.get(actualFrame) ?? enemyBaseTexture;
    },
    [enemyBaseTexture, enemyFrameTextures]
  );

  // Bullet texture for imperative enemy bullet sprites
  const enemyBulletTextureRef = useRef<PIXI.Texture | null>(null);
  if (!enemyBulletTextureRef.current) {
    const guns = PIXI.Assets.get("guns");
    if (guns?.baseTexture?.width) {
      enemyBulletTextureRef.current = new PIXI.Texture(
        guns.baseTexture,
        new PIXI.Rectangle(0, 0, guns.baseTexture.width, guns.baseTexture.height)
      );
    }
  }

  // Single container: all enemies and bullets are updated imperatively in useTick (no React re-renders)
  return <Container ref={containerRef} />;
};

export default EnemyFormation;

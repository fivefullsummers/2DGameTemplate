import { Container, useTick, Sprite } from "@pixi/react";
import { useState, useCallback, useRef, useMemo } from "react";
import * as PIXI from "pixi.js";
import { ENEMY_SCALE } from "../consts/enemy-config";
import { TILE_SIZE, COLS } from "../consts/game-world";
import { IPosition } from "../types/common";
import EnemyBullet from "./EnemyBullet";
import { textureCache } from "../utils/textureCache";
import enemyAnimatedAsset from "../assets/enemies/enemy.png";

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
  const [, forceUpdate] = useState(0); // Force re-render when enemies move
  const [enemyBullets, setEnemyBullets] = useState<EnemyBulletData[]>([]);
  const lastMoveTime = useRef<number>(Date.now());
  const lastShootTime = useRef<number>(Date.now());
  const initialEnemyCount = useRef<number>(enemies.length);

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

    setEnemyBullets((prev) => [...prev, newBullet]);
  }, [enemyBullets.length, getBottommostEnemies]);

  // Destroy enemy bullet
  const destroyEnemyBullet = useCallback((bulletId: string) => {
    setEnemyBullets((prev) => prev.filter((bullet) => bullet.id !== bulletId));
  }, []);

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

  // Move all enemies together (Space Invaders style) and handle shooting
  useTick((delta) => {
    if (enemies.length === 0) return;

    const now = Date.now();
    
    // Handle explosion animations
    enemies.forEach((enemy) => {
      if (enemy.isExploding) {
        const expState = explosionState.current.get(enemy.id);
        if (expState) {
          // Advance frame accumulator
          expState.frameAccumulator += EXPLOSION_SPEED * delta;
          
          if (expState.frameAccumulator >= 1) {
            expState.frameAccumulator = 0;
            expState.frameIndex += 1;
            
            // Check if explosion animation is complete
            if (expState.frameIndex >= EXPLOSION_FRAME_SEQUENCE.length) {
              // Remove enemy after explosion completes
              onEnemyRemove(enemy.id);
              explosionState.current.delete(enemy.id);
            }
          }
        }
      }
    });
    
    // Only move non-exploding enemies
    const activeEnemies = enemies.filter((e) => !e.isExploding);
    if (activeEnemies.length === 0) return;
    
    // Handle movement
    const moveDelay = getMoveDelay();
    if (now - lastMoveTime.current >= moveDelay) {
      lastMoveTime.current = now;

      const { hitLeft, hitRight } = checkBoundary();

      // Check if we need to reverse direction and move down
      if ((direction === 1 && hitRight) || (direction === -1 && hitLeft)) {
        // Move down and reverse direction
        activeEnemies.forEach((enemy) => {
          enemy.positionRef.current.y += VERTICAL_STEP;
        });
        setDirection((prev) => (prev === 1 ? -1 : 1));
        forceUpdate((prev) => prev + 1); // Trigger re-render
      } else {
        // Move horizontally
        activeEnemies.forEach((enemy) => {
          enemy.positionRef.current.x += HORIZONTAL_STEP * direction;
          
          // Update animation frame on x-axis movement
          const animState = enemyAnimState.current.get(enemy.id);
          if (animState && Math.abs(enemy.positionRef.current.x - animState.lastX) >= HORIZONTAL_STEP) {
            // Advance to next frame in sequence
            animState.frameIndex = (animState.frameIndex + 1) % FRAME_SEQUENCE.length;
            animState.lastX = enemy.positionRef.current.x;
          }
        });
        forceUpdate((prev) => prev + 1); // Trigger re-render
      }
    }

    // Handle shooting (Space Invaders: random bottommost enemy shoots)
    const shootDelay = getShootDelay();
    if (now - lastShootTime.current >= shootDelay) {
      lastShootTime.current = now;
      spawnEnemyBullet();
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

  // Get sprite texture based on animation frame for a specific enemy
  const getEnemyTexture = useCallback((enemyId: string, isExploding: boolean) => {
    // If exploding, use explosion texture
    if (isExploding) {
      const expState = explosionState.current.get(enemyId);
      if (!expState || !explosionBaseTexture.baseTexture) return explosionBaseTexture;

      // Get actual frame number from explosion sequence
      const actualFrame = EXPLOSION_FRAME_SEQUENCE[expState.frameIndex] || 0;
      
      // Calculate position in explosion sprite sheet
      // Use the actual texture height since explosion has different dimensions
      const explosionFrameHeight = explosionBaseTexture.baseTexture.height;
      const x = actualFrame * EXPLOSION_FRAME_WIDTH;
      const y = 0; // Single row sprite sheet

      // Create rectangle for this frame using actual explosion dimensions
      const rectangle = new PIXI.Rectangle(x, y, EXPLOSION_FRAME_WIDTH, explosionFrameHeight);
      
      // Create texture from explosion base texture
      return new PIXI.Texture(explosionBaseTexture.baseTexture, rectangle);
    }

    // Normal enemy animation
    const animState = enemyAnimState.current.get(enemyId);
    if (!animState) return enemyBaseTexture;

    // Get actual frame number from sequence
    const actualFrame = FRAME_SEQUENCE[animState.frameIndex];
    
    // Calculate position in sprite sheet
    const x = actualFrame * ENEMY_FRAME_WIDTH;
    const y = 0; // Single row sprite sheet

    // Create rectangle for this frame
    const rectangle = new PIXI.Rectangle(x, y, ENEMY_FRAME_WIDTH, ENEMY_FRAME_HEIGHT);
    
    // Create texture from base texture
    return new PIXI.Texture(enemyBaseTexture.baseTexture, rectangle);
  }, [enemyBaseTexture, explosionBaseTexture]);

  // Render enemies and bullets
  return (
    <Container>
      {/* Enemy sprites */}
      {enemies.map((enemy) => (
        <Sprite
          key={enemy.id}
          texture={getEnemyTexture(enemy.id, enemy.isExploding || false)}
          x={enemy.positionRef.current.x}
          y={enemy.positionRef.current.y}
          scale={ENEMY_SCALE}
          anchor={0.5}
        />
      ))}
      
      {/* Enemy bullets */}
      {enemyBullets.map((bullet) => (
        <EnemyBullet
          key={bullet.id}
          id={bullet.id}
          startX={bullet.x}
          startY={bullet.y}
          speed={getBulletSpeed()}
          onDestroy={destroyEnemyBullet}
          onPlayerHit={onPlayerHit}
          playerPositionRef={playerPositionRef}
        />
      ))}
    </Container>
  );
};

export default EnemyFormation;

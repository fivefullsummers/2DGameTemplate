import { Sprite, useTick } from "@pixi/react";
import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import * as PIXI from "pixi.js";
import { sound } from "@pixi/sound";
import { TILE_SIZE, COLS } from "../consts/game-world";
import { isBlocked } from "../consts/collision-map";
import { BulletManagerRef } from "./BulletManager";
import { GUN_TYPES, DEFAULT_GUN_TYPE } from "../consts/bullet-config";
import { Direction, IPosition } from "../types/common";
import { PLAYER_SCALE, PLAYER_START_Y } from "../consts/tuning-config";

// Sprite sheet configuration for cool.png
// cool.png is 1536 width with 3 sprites horizontally
const FRAME_WIDTH = 512;  // 1536 / 3 = 512 pixels per frame
// FRAME_HEIGHT will be determined from actual texture height

// Movement speed & feel
// Base horizontal speed; we also apply a small easing so movement
// feels like it has a bit of acceleration instead of instant start/stop.
const MOVEMENT_SPEED = 6.5; // Pixels per frame (higher than before)
const SPEED_BOOST_MULTIPLIER = 2; // Speed multiplier when shift is pressed
const ACCELERATION_FACTOR = 0.18; // 0–1, higher = snappier, lower = more floaty

// Animation sheet configuration
interface AnimationSheet {
  asset: string;             // Path to the sprite sheet image
  frameSequence: number[];   // The sequence of frames to play
  idleFrame: number | null;  // The frame to show when standing still
  framesPerStep: number;     // Frames per step cycle
  speed: number;             // Animation speed multiplier
}

// Get preloaded textures (loaded via AssetLoader)
const getAssetPath = (assetAlias: string): string => {
  // Return the alias so we can fetch it from PIXI.Assets later
  return assetAlias;
};

const ANIMATION_SHEETS: Record<string, AnimationSheet> = {
  idle: {
    asset: getAssetPath("hero-cool"),
    frameSequence: [0, 1], // Cycle through all 3 frames
    idleFrame: 0,          // Frame 0 is default idle pose
    framesPerStep: 1,      // Complete quickly when transitioning
    speed: 0.15,           // Animation speed
  },
  explosion: {
    asset: getAssetPath("hero-explosion"),
    frameSequence: [0, 1, 2], // 3 frame explosion
    idleFrame: null,
    framesPerStep: 1,
    speed: 0.15,           // Explosion animation speed
  },
};

// Single row animation (no direction rows needed for this sprite)
const ANIMATIONS = {
  IDLE: 0,  // Only one row
};

type PressedKey = Direction | 'SHIFT' | 'SHOOT';

export interface PlayerRef {
  triggerDeath: () => void;
}

interface PlayerAnimatedProps {
  bulletManagerRef?: React.RefObject<BulletManagerRef>;
  gunType?: string;
  getControlsDirection: () => { currentKey: Direction, pressedKeys: PressedKey[] };
  consumeShootPress: () => boolean;
  isShootHeld: () => boolean;
  positionRef?: React.MutableRefObject<IPosition>;
  playerRef?: React.MutableRefObject<PlayerRef | null>;
  initialY?: number;
  notifyShotFired: (fireRate: number) => void;
}

const PlayerAnimated = ({ 
  bulletManagerRef, 
  gunType = DEFAULT_GUN_TYPE,
  getControlsDirection,
  consumeShootPress,
  isShootHeld,
  positionRef,
  playerRef,
  initialY,
  notifyShotFired,
}: PlayerAnimatedProps) => {
  // Calculate bottom center position (Space Invaders style) within the
  // collision-safe playfield. We move the *world* visually via
  // verticalOffset in Experience.tsx instead of pushing the player
  // below the collision map (which breaks movement).
  const startX = ((COLS - 2) * TILE_SIZE) / 2; // Center horizontally
  // Default Y comes from central tuning config (enemy-config.ts)
  const defaultStartY = PLAYER_START_Y;
  const startY = initialY !== undefined ? initialY : defaultStartY;
  const [position, setPosition] = useState({ x: startX, y: startY });
  
  // Death/respawn state
  const [isDead, setIsDead] = useState(false);
  const [isExploding, setIsExploding] = useState(false);
  const deathPosition = useRef<IPosition | null>(null);
  
  // Keep position ref in sync with position state
  useEffect(() => {
    if (positionRef) {
      positionRef.current = position;
    }
  }, [position, positionRef]);
  
  const [currentFrame, setCurrentFrame] = useState(0);
  const [currentRow] = useState(ANIMATIONS.IDLE);
  const [currentSheetName, setCurrentSheetName] = useState<string>("idle");
  const [, setFrameAccumulator] = useState(0);
  const [isWalking, setIsWalking] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const lastShotTime = useRef(0);
  const velocityXRef = useRef(0); // for eased horizontal movement
  
  // Death trigger function
  const triggerDeath = useCallback(() => {
    if (isDead || isExploding) return; // Already dead or exploding
    
    // Play explosion sound
    const explosionSfx = sound.find("explosion-sound");
    if (explosionSfx) {
      explosionSfx.play({ volume: 0.5 });
    }
    
    setIsDead(true);
    setIsExploding(true);
    deathPosition.current = { ...position };
    setCurrentSheetName("explosion");
    setCurrentFrame(0);
    setFrameAccumulator(0);
  }, [isDead, isExploding, position]);

  // Expose death trigger to parent via ref
  useEffect(() => {
    if (playerRef) {
      playerRef.current = { triggerDeath };
    }
  }, [playerRef, triggerDeath]);
  
  // Get current gun configuration
  const currentGun = GUN_TYPES[gunType] || GUN_TYPES[DEFAULT_GUN_TYPE];

  // Get current animation sheet configuration
  const currentSheet = ANIMATION_SHEETS[currentSheetName];

  // Get base texture from preloaded assets
  const cachedTexture = useMemo(() => {
    return PIXI.Assets.get(currentSheet.asset);
  }, [currentSheet.asset]);

  // Create texture for current frame
  const currentTexture = useMemo(() => {
    const frameIndex = currentFrame % currentSheet.frameSequence.length;
    const actualFrame = currentSheet.frameSequence[frameIndex];
    
    if (actualFrame === undefined) {
      console.warn(`Frame ${frameIndex} not found in sequence:`, currentSheet.frameSequence);
      return cachedTexture;
    }
    
    // Get actual texture dimensions (wait for texture to load)
    if (!cachedTexture.baseTexture || cachedTexture.baseTexture.width === 0) {
      return cachedTexture; // Return base texture while loading
    }
    
    // Use actual texture height for single-row sprite sheet
    const actualFrameHeight = cachedTexture.baseTexture.height;
    
    // Calculate the position of the current frame in the sprite sheet
    // cool.png has 3 frames horizontally, so x = frame * FRAME_WIDTH
    const x = actualFrame * FRAME_WIDTH;
    const y = currentRow * actualFrameHeight;

    const rectangle = new PIXI.Rectangle(x, y, FRAME_WIDTH, actualFrameHeight);
    const texture = new PIXI.Texture(cachedTexture.baseTexture, rectangle);
    
    return texture;
  }, [cachedTexture, currentFrame, currentRow, currentSheet.frameSequence]);

  useTick((delta) => {
    // Handle explosion animation
    if (isExploding) {
      setFrameAccumulator((prev) => {
        const newAccumulator = prev + currentSheet.speed * delta;
        
        if (newAccumulator >= 1) {
          setCurrentFrame((frame) => {
            const nextFrame = frame + 1;
            
            // Check if explosion animation is complete
            if (nextFrame >= currentSheet.frameSequence.length) {
              // Respawn player
              setIsExploding(false);
              setIsDead(false);
              setPosition({ x: startX, y: startY });
              deathPosition.current = null;
              setCurrentSheetName("idle");
              setCurrentFrame(0);
              setFrameAccumulator(0);
              return 0;
            }
            
            return nextFrame;
          });
          return 0;
        }
        
        return newAccumulator;
      });
      return; // Don't process other logic while exploding
    }

    // Don't process controls if dead
    if (isDead) return;

    const { pressedKeys } = getControlsDirection();

    // Handle shooting input
    const canShoot = bulletManagerRef?.current;
    const shootKeyPressed = consumeShootPress();
    const shootKeyHeld = isShootHeld();
    
    // Check fire rate cooldown
    const now = Date.now();
    const canFireAgain = now - lastShotTime.current >= currentGun.fireRate;
    
    // Trigger shooting if conditions are met (always shoot UP)
    if (canShoot && canFireAgain) {
      // Single shot or automatic
      const shouldShoot = shootKeyPressed || (currentGun.automatic && shootKeyHeld);
      
      if (shouldShoot) {
        lastShotTime.current = now;

        // Spawn bullet at player center; BulletManager is responsible
        // for playing the shoot sound only when a bullet is actually
        // created (no maxBullets block, valid bulletType, etc.).
        // Use position state directly - it's the most current within useTick
        // Player sprite uses anchor={0.5}, so position is already the center
        bulletManagerRef.current.spawnBullet(
          position.x, // Spawn at exact center X
          position.y, // Spawn at exact center Y (we can adjust later)
          "UP", // Always shoot up
          currentGun.bulletType
        );

        // Inform controls layer that a shot was successfully fired so
        // the UI (mobile shoot button) can show cooldown progress.
        notifyShotFired(currentGun.fireRate);
      }
    }

    // Handle movement
    setPosition((prev) => {
      const { x, y } = prev;
      let dx = 0;

      if (pressedKeys.includes("LEFT")) dx -= 1;
      if (pressedKeys.includes("RIGHT")) dx += 1;
      // No vertical movement for Space Invaders style
      
      const magnitude = Math.sqrt(dx * dx);
      const moving = magnitude > 0;
      setIsWalking(moving);

      if (moving) {
        if (!isAnimating) {
          setIsAnimating(true);
        }
        
        // Check if shift is pressed for speed boost
        const isShiftPressed = pressedKeys.includes("SHIFT");
        const speedMultiplier = isShiftPressed ? SPEED_BOOST_MULTIPLIER : 1;

        // Target velocity based on input; we then ease current velocity
        // toward this target to give a sense of acceleration.
        const targetVelocityX = (dx / magnitude) * MOVEMENT_SPEED * speedMultiplier;
        let vx = velocityXRef.current;
        vx += (targetVelocityX - vx) * ACCELERATION_FACTOR;
        velocityXRef.current = vx;

        // Calculate new position (only horizontal movement)
        const newX = x + vx;
        const newY = y; // Keep Y position fixed (bottom of screen)

        // Check collision with walls
        if (isBlocked(newX, newY)) {
          return prev;
        }

        // Update position ref
        if (positionRef) {
          positionRef.current = { x: newX, y: newY };
        }

        return { x: newX, y: newY };
      } else {
        // No input: ease velocity back toward zero for a soft stop
        let vx = velocityXRef.current;
        vx += (0 - vx) * ACCELERATION_FACTOR;
        velocityXRef.current = vx;

        const newX = x + vx;
        const newY = y;

        if (isBlocked(newX, newY)) {
          return prev;
        }

        if (positionRef) {
          positionRef.current = { x: newX, y: newY };
        }

        return { x: newX, y: newY };
      }
    });

    // Handle animation frame updates
    const shouldAnimate = isWalking || isAnimating || currentSheetName === "idle";
    
    if (shouldAnimate) {
      setFrameAccumulator((prev) => {
        const newAccumulator = prev + currentSheet.speed * delta;
        
        if (newAccumulator >= 1) {
          setCurrentFrame((frame) => {
            const nextFrame = (frame + 1) % currentSheet.frameSequence.length;
            
            if (nextFrame % currentSheet.framesPerStep === 0 && !isWalking && currentSheetName !== "idle") {
              setIsAnimating(false);
              return 0;
            }
            
            return nextFrame;
          });
          return 0;
        }
        
        return newAccumulator;
      });
    } else {
      setCurrentFrame(0);
      setFrameAccumulator(0);
    }
  });


  // Use death position during explosion, otherwise use current position
  const displayPosition = isExploding && deathPosition.current ? deathPosition.current : position;

  // Player visual scale comes from central tuning config.
  const playerScale = PLAYER_SCALE;

  return (
    <Sprite
      texture={currentTexture}
      x={displayPosition.x}
      y={displayPosition.y}
      scale={playerScale}
      anchor={0.5}
    />
  );
};

export default PlayerAnimated;

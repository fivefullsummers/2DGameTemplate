import { Sprite, useTick } from "@pixi/react";
import { useState, useMemo, useRef, useEffect } from "react";
import * as PIXI from "pixi.js";
import { sound } from "@pixi/sound";
import heroWalkAsset from "../assets/hero/walk.png";
import heroRunAsset from "../assets/hero/run.png";
import heroIdleAsset from "../assets/hero/idle.png";
import heroShootAsset from "../assets/hero/shoot.png";
import { TILE_SIZE, COLS, ROWS } from "../consts/game-world";
import { textureCache } from "../utils/textureCache";
import { isBlocked } from "../consts/collision-map";
import { BulletManagerRef } from "./BulletManager";
import { GUN_TYPES, DEFAULT_GUN_TYPE } from "../consts/bullet-config";
import { Direction, IPosition } from "../types/common";

// Sprite sheet configuration - LPC (Liberated Pixel Cup) format
const FRAME_WIDTH = 64;  // LPC sprites are 64x64 pixels per frame
const FRAME_HEIGHT = 64; // LPC sprites are 64x64 pixels per frame

// Animation sheet configuration
// This abstraction allows us to easily add new animation sheets
interface AnimationSheet {
  asset: string;             // Path to the sprite sheet image
  frameSequence: number[];   // The sequence of frames to play (e.g., [0,1,2] or [0,0,0,1,1,1])
  idleFrame: number | null;  // The frame to show when standing still (null if no idle frame in this sheet)
  framesPerStep: number;     // Frames per step cycle (for completing animation when stopping)
  speed: number;             // Animation speed multiplier
}

const ANIMATION_SHEETS: Record<string, AnimationSheet> = {
  idle: {
    asset: heroIdleAsset,
    frameSequence: [0, 0, 1], // Idle breathing animation
    idleFrame: 0,          // Frame 0 is default idle pose
    framesPerStep: 1,      // Complete quickly when transitioning
    speed: 0.08,           // Slow, subtle animation
  },
  walk: {
    asset: heroWalkAsset,
    frameSequence: [1, 2, 3, 4, 5, 6, 7, 8], // Walking cycle frames 1-8
    idleFrame: 0,          // Frame 0 is the standing position
    framesPerStep: 3,
    speed: 0.15,
  },
  run: {
    asset: heroRunAsset,
    frameSequence: [0, 1, 2, 3, 4, 5, 6, 7], // Running cycle frames 0-7 (8 frames, no idle frame)
    idleFrame: null,       // No idle frame in run.png
    framesPerStep: 2,
    speed: 0.25, // Faster animation for running
  },
  shoot: {
    asset: heroShootAsset,
    frameSequence: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], // Shooting animation frames 0-12
    idleFrame: null,       // No idle frame in shoot.png
    framesPerStep: 13,     // Complete full animation (one-shot)
    speed: 0.30,           // Fast shooting animation
  },
};

// Limited LPC sprite sheet - only 4 rows (0-3)
// Your sprite sheet is 832x256 pixels = 13 frames x 4 rows
const ANIMATIONS = {
  UP: 0,     // Row 0: walking up
  LEFT: 1,   // Row 1: walking left
  DOWN: 2,   // Row 2: walking down
  RIGHT: 3,  // Row 3: walking right
  IDLE_UP: 0,     // Use same rows for idle, just frame 0
  IDLE_LEFT: 1,
  IDLE_DOWN: 2,
  IDLE_RIGHT: 3,
};

type PressedKey = Direction | 'SHIFT' | 'SHOOT';

interface HeroAnimatedProps {
  bulletManagerRef?: React.RefObject<BulletManagerRef>;
  gunType?: string;
  getControlsDirection: () => { currentKey: Direction, pressedKeys: PressedKey[] };
  consumeShootPress: () => boolean;
  isShootHeld: () => boolean;
  positionRef?: React.MutableRefObject<IPosition>;
  enemyPositionRef?: React.MutableRefObject<IPosition>;
}

// Helper function to check collision between two positions
// Using a smaller threshold (60% of tile size) to allow entities to get closer
const checkEntityCollision = (pos1: IPosition, pos2: IPosition, threshold: number = TILE_SIZE * 0.6): boolean => {
  const dx = (pos1.x + TILE_SIZE / 2) - (pos2.x + TILE_SIZE / 2);
  const dy = (pos1.y + TILE_SIZE / 2) - (pos2.y + TILE_SIZE / 2);
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < threshold;
};

// Check if movement is away from another entity (allows separation)
const isMovingAway = (currentPos: IPosition, newPos: IPosition, otherPos: IPosition): boolean => {
  const currentDx = (currentPos.x + TILE_SIZE / 2) - (otherPos.x + TILE_SIZE / 2);
  const currentDy = (currentPos.y + TILE_SIZE / 2) - (otherPos.y + TILE_SIZE / 2);
  const currentDist = Math.sqrt(currentDx * currentDx + currentDy * currentDy);
  
  const newDx = (newPos.x + TILE_SIZE / 2) - (otherPos.x + TILE_SIZE / 2);
  const newDy = (newPos.y + TILE_SIZE / 2) - (otherPos.y + TILE_SIZE / 2);
  const newDist = Math.sqrt(newDx * newDx + newDy * newDy);
  
  // If new distance is greater than current distance, we're moving away
  return newDist > currentDist;
};

const HeroAnimated = ({ 
  bulletManagerRef, 
  gunType = DEFAULT_GUN_TYPE,
  getControlsDirection,
  consumeShootPress,
  isShootHeld,
  positionRef,
  enemyPositionRef
}: HeroAnimatedProps) => {
  // Calculate center of map for hero spawn
  // Map is (COLS - 2) tiles wide and (ROWS - 2) tiles tall (accounting for padding)
  // Each tile is TILE_SIZE pixels
  const centerX = ((COLS - 2) * TILE_SIZE) / 2;
  const centerY = ((ROWS - 2) * TILE_SIZE) / 2;
  const [position, setPosition] = useState({ x: centerX, y: centerY });
  
  // Keep position ref in sync with position state
  useEffect(() => {
    if (positionRef) {
      positionRef.current = position;
    }
  }, [position, positionRef]);
  
  const [currentFrame, setCurrentFrame] = useState(0);
  const [currentRow, setCurrentRow] = useState(ANIMATIONS.IDLE_DOWN);
  const [currentSheetName, setCurrentSheetName] = useState<string>("idle");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [frameAccumulator, setFrameAccumulator] = useState(0); // Frame timing accumulator
  const [isWalking, setIsWalking] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false); // Track if animation cycle is in progress
  const [isShooting, setIsShooting] = useState(false); // Track if shooting animation is playing
  const lastShotTime = useRef(0); // Track last shot time for fire rate
  
  // Get current gun configuration
  const currentGun = GUN_TYPES[gunType] || GUN_TYPES[DEFAULT_GUN_TYPE];

  // Get current animation sheet configuration
  const currentSheet = ANIMATION_SHEETS[currentSheetName];

  // Get base texture from cache (shared across all hero instances)
  // Recaches when switching between animation sheets
  const cachedTexture = useMemo(() => {
    return textureCache.getTexture(currentSheet.asset);
  }, [currentSheet.asset]);

  // Create texture for current frame
  const currentTexture = useMemo(() => {
    // Guard against out-of-bounds access during sheet transitions
    const frameIndex = currentFrame % currentSheet.frameSequence.length;
    const actualFrame = currentSheet.frameSequence[frameIndex];
    
    // Guard against undefined frame numbers
    if (actualFrame === undefined) {
      console.warn(`Frame ${frameIndex} not found in sequence:`, currentSheet.frameSequence);
      return cachedTexture; // Return base texture as fallback
    }
    
    // Calculate the position of the current frame in the sprite sheet
    const x = actualFrame * FRAME_WIDTH;
    const y = currentRow * FRAME_HEIGHT;

    // Create a rectangle that defines which part of the sprite sheet to show
    const rectangle = new PIXI.Rectangle(x, y, FRAME_WIDTH, FRAME_HEIGHT);
    
    // Create a new texture from the cached base texture using the rectangle
    const texture = new PIXI.Texture(cachedTexture.baseTexture, rectangle);
    
    return texture;
  }, [cachedTexture, currentFrame, currentRow, currentSheet.frameSequence]);

  useTick((delta) => {
    const { pressedKeys } = getControlsDirection();

    // Handle shooting input
    const canShoot = bulletManagerRef?.current && !isShooting;
    const shootKeyPressed = consumeShootPress();
    const shootKeyHeld = isShootHeld();
    
    // Check fire rate cooldown
    const now = Date.now();
    const canFireAgain = now - lastShotTime.current >= currentGun.fireRate;
    
    // Trigger shooting if conditions are met
    if (canShoot && canFireAgain) {
      // Single shot or automatic
      const shouldShoot = shootKeyPressed || (currentGun.automatic && shootKeyHeld);
      
      if (shouldShoot) {
        setIsShooting(true);
        lastShotTime.current = now;
        
        // Play shooting sound
        const poundSfx = sound.find("pound-sound");
        if (poundSfx) {
          poundSfx.play({ volume: 0.05 });
        }
        
        // Spawn bullet in the direction hero is facing
        const bulletOffsetX = position.x + TILE_SIZE / 2;
        const bulletOffsetY = position.y + TILE_SIZE / 2;
        
        let shootDirection: "UP" | "DOWN" | "LEFT" | "RIGHT" = "DOWN";
        if (currentRow === ANIMATIONS.UP || currentRow === ANIMATIONS.IDLE_UP) shootDirection = "UP";
        else if (currentRow === ANIMATIONS.DOWN || currentRow === ANIMATIONS.IDLE_DOWN) shootDirection = "DOWN";
        else if (currentRow === ANIMATIONS.LEFT || currentRow === ANIMATIONS.IDLE_LEFT) shootDirection = "LEFT";
        else if (currentRow === ANIMATIONS.RIGHT || currentRow === ANIMATIONS.IDLE_RIGHT) shootDirection = "RIGHT";
        
        bulletManagerRef.current.spawnBullet(
          bulletOffsetX,
          bulletOffsetY,
          shootDirection,
          currentGun.bulletType
        );
      }
    }

    // Handle movement
    setPosition((prev) => {
      const { x, y } = prev;
      let dx = 0;
      let dy = 0;

      if (pressedKeys.includes("UP")) dy -= 1;
      if (pressedKeys.includes("DOWN")) dy += 1;
      if (pressedKeys.includes("LEFT")) dx -= 1;
      if (pressedKeys.includes("RIGHT")) dx += 1;

      // Calculate magnitude for normalization
      const magnitude = Math.sqrt(dx * dx + dy * dy);

      // Determine if character is moving
      const moving = magnitude > 0;
      setIsWalking(moving);

      // Determine which animation sheet to use
      let targetSheetName: string;
      if (isShooting) {
        targetSheetName = "shoot";  // Playing shoot animation - override other animations
      } else if (!moving) {
        targetSheetName = "idle";  // Not moving - use idle animation
      } else if (pressedKeys.includes("SHIFT")) {
        targetSheetName = "run";   // Moving + Shift - use run animation
      } else {
        targetSheetName = "walk";  // Moving - use walk animation
      }
      
      // Switch animation sheet if needed, maintaining relative frame position
      if (targetSheetName !== currentSheetName) {
        setCurrentSheetName(targetSheetName);
        
        // Synchronize frame position when transitioning
        // This keeps the animation aligned (e.g., if 50% through walk, start at 50% through run)
        setCurrentFrame((prevFrame) => {
          const oldSheet = ANIMATION_SHEETS[currentSheetName];
          const newSheet = ANIMATION_SHEETS[targetSheetName];
          
          // Calculate relative position in old animation (0 to 1)
          const relativePosition = prevFrame / oldSheet.frameSequence.length;
          
          // Apply to new animation and clamp to valid range
          const newFrame = Math.floor(relativePosition * newSheet.frameSequence.length);
          
          // Ensure frame is within bounds (safety check)
          return Math.min(newFrame, newSheet.frameSequence.length - 1);
        });
      }

      const isRunning = targetSheetName === "run";

      // Set the appropriate animation row based on direction
      if (moving) {
        // Start animating if not already
        if (!isAnimating) {
          setIsAnimating(true);
        }
        
        // Normalize movement vector
        dx = dx / magnitude;
        dy = dy / magnitude;

        // Apply speed multiplier for running
        const speedMultiplier = isRunning ? 1.5 : 1;

        // Determine which direction is dominant and set animation row
        if (Math.abs(dx) > Math.abs(dy)) {
          // Horizontal movement is dominant
          setCurrentRow(dx > 0 ? ANIMATIONS.RIGHT : ANIMATIONS.LEFT);
        } else {
          // Vertical movement is dominant
          setCurrentRow(dy > 0 ? ANIMATIONS.DOWN : ANIMATIONS.UP);
        }

        // Calculate new position
        const newX = x + dx * speedMultiplier;
        const newY = y + dy * speedMultiplier;

        // Check collision with walls - if blocked, don't move
        if (isBlocked(newX, newY)) {
          return prev;
        }

        // Check collision with enemy
        if (enemyPositionRef?.current) {
          const newPos = { x: newX, y: newY };
          const wouldCollide = checkEntityCollision(newPos, enemyPositionRef.current);
          
          if (wouldCollide) {
            // Allow movement if we're moving away from the enemy (prevents getting stuck)
            if (!isMovingAway(prev, newPos, enemyPositionRef.current)) {
              return prev;
            }
          }
        }

        // Update position ref
        if (positionRef) {
          positionRef.current = { x: newX, y: newY };
        }

        return { x: newX, y: newY };
      } else {
        // Not moving - set idle animation based on last direction
        if (currentRow === ANIMATIONS.DOWN) setCurrentRow(ANIMATIONS.IDLE_DOWN);
        else if (currentRow === ANIMATIONS.LEFT) setCurrentRow(ANIMATIONS.IDLE_LEFT);
        else if (currentRow === ANIMATIONS.RIGHT) setCurrentRow(ANIMATIONS.IDLE_RIGHT);
        else if (currentRow === ANIMATIONS.UP) setCurrentRow(ANIMATIONS.IDLE_UP);
        
        return prev;
      }
    });

    // Handle animation frame updates
    // Keep animating if walking OR if animation cycle is in progress OR if idling OR if shooting
    const shouldAnimate = isWalking || isAnimating || currentSheetName === "idle" || isShooting;
    
    if (shouldAnimate) {
      setFrameAccumulator((prev) => {
        const newAccumulator = prev + currentSheet.speed * delta;
        
        // When accumulator reaches 1, advance to next frame
        if (newAccumulator >= 1) {
          setCurrentFrame((frame) => {
            // Cycle through the frame sequence
            const nextFrame = (frame + 1) % currentSheet.frameSequence.length;
            
            // Check if we've completed a step (every N frames based on framesPerStep)
            // A step completes when we reach a frame divisible by framesPerStep
            const isStepComplete = nextFrame % currentSheet.framesPerStep === 0;
            
            // Special handling for shoot animation - complete full animation then stop
            if (currentSheetName === "shoot" && nextFrame === 0) {
              setIsShooting(false);
              setIsAnimating(false);
              return 0; // Reset to first frame
            }
            
            // If step complete and not walking (but not idle), stop animating
            if (isStepComplete && !isWalking && currentSheetName !== "idle" && currentSheetName !== "shoot") {
              setIsAnimating(false);
              return 0; // Reset to first frame
            }
            
            return nextFrame;
          });
          return 0; // Reset accumulator
        }
        
        return newAccumulator;
      });
    } else {
      // Reset to first frame when switching sheets
      setCurrentFrame(0);
      setFrameAccumulator(0);
    }
  });

  return (
    <Sprite
      texture={currentTexture}
      x={position.x + TILE_SIZE / 2} // Center in tile horizontally
      y={position.y + TILE_SIZE / 2} // Center in tile vertically
      scale={0.5} // Scale 64px sprite down to fit 32px tile
      anchor={0.5} // Center the sprite pivot point
    />
  );
};

export default HeroAnimated;

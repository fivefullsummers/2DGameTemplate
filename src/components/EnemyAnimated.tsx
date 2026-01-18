import { Sprite, useTick } from "@pixi/react";
import { useState, useMemo, useRef, useEffect } from "react";
import * as PIXI from "pixi.js";
import enemyWalkAsset from "../assets/enemies/walk.png";
import enemyRunAsset from "../assets/enemies/run.png";
import enemyIdleAsset from "../assets/enemies/idle.png";
import { TILE_SIZE } from "../consts/game-world";
import { textureCache } from "../utils/textureCache";
import { IPosition } from "../types/common";
import { isBlocked } from "../consts/collision-map";

// Sprite sheet configuration - LPC (Liberated Pixel Cup) format
const FRAME_WIDTH = 64;  // LPC sprites are 64x64 pixels per frame
const FRAME_HEIGHT = 64; // LPC sprites are 64x64 pixels per frame

// Animation sheet configuration
interface AnimationSheet {
  asset: string;             // Path to the sprite sheet image
  frameSequence: number[];   // The sequence of frames to play
  idleFrame: number | null;  // The frame to show when standing still
  framesPerStep: number;     // Frames per step cycle
  speed: number;             // Animation speed multiplier
}

const ANIMATION_SHEETS: Record<string, AnimationSheet> = {
  idle: {
    asset: enemyIdleAsset,
    frameSequence: [0, 0, 1], // Idle breathing animation
    idleFrame: 0,
    framesPerStep: 1,
    speed: 0.08,           // Slow, subtle animation
  },
  walk: {
    asset: enemyWalkAsset,
    frameSequence: [1, 2, 3, 4, 5, 6, 7, 8], // Walking cycle frames 1-8
    idleFrame: 0,          // Frame 0 is the standing position
    framesPerStep: 3,
    speed: 0.15,
  },
  run: {
    asset: enemyRunAsset,
    frameSequence: [0, 1, 2, 3, 4, 5, 6, 7], // Running cycle frames 0-7
    idleFrame: null,       // No idle frame in run.png
    framesPerStep: 2,
    speed: 0.25, // Faster animation for running
  },
};

// Animation rows for directions
const ANIMATIONS = {
  UP: 0,
  LEFT: 1,
  DOWN: 2,
  RIGHT: 3,
  IDLE_UP: 0,
  IDLE_LEFT: 1,
  IDLE_DOWN: 2,
  IDLE_RIGHT: 3,
};

interface EnemyAnimatedProps {
  x?: number;
  y?: number;
  initialDirection?: "UP" | "DOWN" | "LEFT" | "RIGHT"; // Currently unused, kept for future use
  positionRef?: React.MutableRefObject<IPosition>;
  heroPositionRef?: React.MutableRefObject<IPosition>;
}

// Helper function to check collision between two positions
// Using a smaller threshold (50% of tile size) to allow entities to get closer
const checkEntityCollision = (pos1: IPosition, pos2: IPosition, threshold: number = TILE_SIZE * 0.5): boolean => {
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

const EnemyAnimated = ({ 
  x = 300,
  y = 300,
  initialDirection = "DOWN", // eslint-disable-line @typescript-eslint/no-unused-vars
  positionRef,
  heroPositionRef
}: EnemyAnimatedProps) => {
  const [position, setPosition] = useState({ x, y });
  
  // Keep position ref in sync with position state
  useEffect(() => {
    if (positionRef) {
      positionRef.current = position;
    }
  }, [position, positionRef]);
  
  const [currentFrame, setCurrentFrame] = useState(0);
  const [currentRow, setCurrentRow] = useState(ANIMATIONS.LEFT);
  const [currentSheetName] = useState<string>("walk");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [frameAccumulator, setFrameAccumulator] = useState(0);
  const [direction, setDirection] = useState<"LEFT" | "RIGHT">("LEFT");
  
  // Store initial starting position (doesn't change after mount)
  const startXRef = useRef(x);
  
  // Patrol distance: 4 tiles
  const PATROL_DISTANCE = TILE_SIZE * 4;

  // Get current animation sheet configuration
  const currentSheet = ANIMATION_SHEETS[currentSheetName];

  // Get base texture from cache
  const cachedTexture = useMemo(() => {
    return textureCache.getTexture(currentSheet.asset);
  }, [currentSheet.asset]);

  // Create texture for current frame
  const currentTexture = useMemo(() => {
    const frameIndex = currentFrame % currentSheet.frameSequence.length;
    const actualFrame = currentSheet.frameSequence[frameIndex];
    
    if (actualFrame === undefined) {
      console.warn(`Frame ${frameIndex} not found in sequence:`, currentSheet.frameSequence);
      return cachedTexture;
    }
    
    const x = actualFrame * FRAME_WIDTH;
    const y = currentRow * FRAME_HEIGHT;

    const rectangle = new PIXI.Rectangle(x, y, FRAME_WIDTH, FRAME_HEIGHT);
    const texture = new PIXI.Texture(cachedTexture.baseTexture, rectangle);
    
    return texture;
  }, [cachedTexture, currentFrame, currentRow, currentSheet.frameSequence]);

  // Handle movement and animation updates
  useTick((delta) => {
    // Update position for patrolling
    setPosition((prev) => {
      const moveSpeed = 1; // Pixels per frame
      let newX = prev.x;
      
      if (direction === "LEFT") {
        newX = prev.x - moveSpeed;
        // Check if we've reached the left boundary
        if (newX <= startXRef.current - PATROL_DISTANCE) {
          setDirection("RIGHT");
          setCurrentRow(ANIMATIONS.RIGHT);
          const newPos = { x: startXRef.current - PATROL_DISTANCE, y: prev.y };
          if (positionRef) {
            positionRef.current = newPos;
          }
          return newPos;
        }
      } else {
        newX = prev.x + moveSpeed;
        // Check if we've reached the right boundary
        if (newX >= startXRef.current + PATROL_DISTANCE) {
          setDirection("LEFT");
          setCurrentRow(ANIMATIONS.LEFT);
          const newPos = { x: startXRef.current + PATROL_DISTANCE, y: prev.y };
          if (positionRef) {
            positionRef.current = newPos;
          }
          return newPos;
        }
      }
      
      // Check collision with walls - if blocked, reverse direction
      const newPos = { x: newX, y: prev.y };
      if (isBlocked(newX, prev.y)) {
        // Hit a wall, reverse direction
        if (direction === "LEFT") {
          setDirection("RIGHT");
          setCurrentRow(ANIMATIONS.RIGHT);
        } else {
          setDirection("LEFT");
          setCurrentRow(ANIMATIONS.LEFT);
        }
        return prev;
      }
      
      // Check collision with hero
      if (heroPositionRef?.current) {
        const wouldCollide = checkEntityCollision(newPos, heroPositionRef.current);
        
        if (wouldCollide) {
          // Allow movement if we're moving away from the hero (prevents getting stuck)
          // Also, if hero is blocking our patrol path, reverse direction early
          if (!isMovingAway(prev, newPos, heroPositionRef.current)) {
            // If we can't move forward due to hero, reverse direction
            if (direction === "LEFT") {
              setDirection("RIGHT");
              setCurrentRow(ANIMATIONS.RIGHT);
            } else {
              setDirection("LEFT");
              setCurrentRow(ANIMATIONS.LEFT);
            }
            return prev;
          }
        }
      }
      
      if (positionRef) {
        positionRef.current = newPos;
      }
      return newPos;
    });

    // Update animation frame
    setFrameAccumulator((prev) => {
      const newAccumulator = prev + currentSheet.speed * delta;
      
      if (newAccumulator >= 1) {
        setCurrentFrame((frame) => {
          const nextFrame = (frame + 1) % currentSheet.frameSequence.length;
          return nextFrame;
        });
        return 0;
      }
      
      return newAccumulator;
    });
  });

  return (
    <Sprite
      texture={currentTexture}
      x={position.x + TILE_SIZE / 2}
      y={position.y + TILE_SIZE / 2}
      scale={0.5}
      anchor={0.5}
    />
  );
};

export default EnemyAnimated;

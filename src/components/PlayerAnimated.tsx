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
  isExiting?: boolean;
  onExitComplete?: () => void;
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
  isExiting = false,
  onExitComplete,
}: PlayerAnimatedProps) => {
  // Calculate bottom center position (Space Invaders style) within the
  // collision-safe playfield. We move the *world* visually via
  // verticalOffset in Experience.tsx instead of pushing the player
  // below the collision map (which breaks movement).
  const startX = ((COLS - 2) * TILE_SIZE) / 2; // Center horizontally
  const defaultStartY = PLAYER_START_Y;
  const startY = initialY !== undefined ? initialY : defaultStartY;
  const [position, setPosition] = useState({ x: startX, y: startY });

  // Single tick state: one setState per frame to trigger re-render (reads from refs)
  const [tick, setTick] = useState(0);

  // Death/respawn state (state so parent/effects see it)
  const [isDead, setIsDead] = useState(false);
  const [isExploding, setIsExploding] = useState(false);
  const deathPosition = useRef<IPosition | null>(null);

  // Display and animation in refs to avoid multiple setState per frame
  const displayPositionRef = useRef({ x: startX, y: startY });
  const currentFrameRef = useRef(0);
  const frameAccumulatorRef = useRef(0);
  const isWalkingRef = useRef(false);
  const isAnimatingRef = useRef(false);

  const [currentSheetName, setCurrentSheetName] = useState<string>("idle");
  const [currentRow] = useState(ANIMATIONS.IDLE);
  const lastShotTime = useRef(0);
  const velocityXRef = useRef(0);

  // Keep parent position ref in sync (updated in useTick; sync ref on position state change e.g. respawn)
  useEffect(() => {
    if (positionRef) {
      positionRef.current = position;
    }
    displayPositionRef.current = { ...position };
  }, [position, positionRef]);
  
  // Death trigger function
  const triggerDeath = useCallback(() => {
    if (isDead || isExploding) return;
    const explosionSfx = sound.find("explosion-sound");
    if (explosionSfx) explosionSfx.play({ volume: 0.5 });
    setIsDead(true);
    setIsExploding(true);
    deathPosition.current = { ...displayPositionRef.current };
    setCurrentSheetName("explosion");
    currentFrameRef.current = 0;
    frameAccumulatorRef.current = 0;
  }, [isDead, isExploding]);

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

  // Create texture for current frame (tick forces re-run to read currentFrameRef.current)
  const currentTexture = useMemo(() => {
    void tick; // dependency: re-run when tick updates so we read fresh currentFrameRef
    const currentFrame = currentFrameRef.current;
    const frameIndex = currentFrame % currentSheet.frameSequence.length;
    const actualFrame = currentSheet.frameSequence[frameIndex];
    if (actualFrame === undefined) return cachedTexture;
    if (!cachedTexture.baseTexture || cachedTexture.baseTexture.width === 0) return cachedTexture;
    const actualFrameHeight = cachedTexture.baseTexture.height;
    const x = actualFrame * FRAME_WIDTH;
    const y = currentRow * actualFrameHeight;
    const rectangle = new PIXI.Rectangle(x, y, FRAME_WIDTH, actualFrameHeight);
    return new PIXI.Texture(cachedTexture.baseTexture, rectangle);
  }, [cachedTexture, currentRow, currentSheet.frameSequence, tick]);

  useTick((delta) => {
    const pos = displayPositionRef.current;

    // Handle level-exit animation: move straight up and ignore input/shooting.
    if (isExiting) {
      const EXIT_SPEED = 10; // pixels per frame
      const newY = pos.y - EXIT_SPEED * delta;
      const newPos = { x: pos.x, y: newY };
      displayPositionRef.current = newPos;
      if (positionRef) positionRef.current = newPos;

      // Once the player is fully above the top of the screen, notify parent.
      if (newY < -TILE_SIZE && onExitComplete) {
        onExitComplete();
      }

      setTick((t) => t + 1);
      return;
    }

    // Handle explosion animation (refs only; state updates only on respawn)
    if (isExploding) {
      frameAccumulatorRef.current += currentSheet.speed * delta;
      if (frameAccumulatorRef.current >= 1) {
        frameAccumulatorRef.current = 0;
        const nextFrame = currentFrameRef.current + 1;
        if (nextFrame >= currentSheet.frameSequence.length) {
          setIsExploding(false);
          setIsDead(false);
          setPosition({ x: startX, y: startY });
          deathPosition.current = null;
          setCurrentSheetName("idle");
          currentFrameRef.current = 0;
          frameAccumulatorRef.current = 0;
          displayPositionRef.current = { x: startX, y: startY };
          if (positionRef) positionRef.current = { x: startX, y: startY };
        } else {
          currentFrameRef.current = nextFrame;
        }
      }
      setTick((t) => t + 1);
      return;
    }

    if (isDead) {
      setTick((t) => t + 1);
      return;
    }

    const { pressedKeys } = getControlsDirection();
    const canShoot = bulletManagerRef?.current;
    const shootKeyPressed = consumeShootPress();
    const shootKeyHeld = isShootHeld();
    const now = Date.now();
    const canFireAgain = now - lastShotTime.current >= currentGun.fireRate;

    if (canShoot && canFireAgain) {
      const shouldShoot = shootKeyPressed || (currentGun.automatic && shootKeyHeld);
      if (shouldShoot) {
        lastShotTime.current = now;
        bulletManagerRef.current.spawnBullet(pos.x, pos.y, "UP", currentGun.bulletType);
        notifyShotFired(currentGun.fireRate);
      }
    }

    // Movement: update refs only
    let dx = 0;
    if (pressedKeys.includes("LEFT")) dx -= 1;
    if (pressedKeys.includes("RIGHT")) dx += 1;
    const magnitude = Math.sqrt(dx * dx);
    const moving = magnitude > 0;
    isWalkingRef.current = moving;
    if (moving && !isAnimatingRef.current) isAnimatingRef.current = true;

    const isShiftPressed = pressedKeys.includes("SHIFT");
    const speedMultiplier = isShiftPressed ? SPEED_BOOST_MULTIPLIER : 1;
    const targetVelocityX = magnitude > 0 ? (dx / magnitude) * MOVEMENT_SPEED * speedMultiplier : 0;
    let vx = velocityXRef.current;
    vx += (targetVelocityX - vx) * ACCELERATION_FACTOR;
    velocityXRef.current = vx;
    const newX = pos.x + vx;
    const newY = pos.y;

    if (!isBlocked(newX, newY)) {
      displayPositionRef.current = { x: newX, y: newY };
      if (positionRef) positionRef.current = { x: newX, y: newY };
    }

    // Animation: update refs only
    const shouldAnimate = isWalkingRef.current || isAnimatingRef.current || currentSheetName === "idle";
    if (shouldAnimate) {
      frameAccumulatorRef.current += currentSheet.speed * delta;
      if (frameAccumulatorRef.current >= 1) {
        frameAccumulatorRef.current = 0;
        const nextFrame = (currentFrameRef.current + 1) % currentSheet.frameSequence.length;
        if (nextFrame % currentSheet.framesPerStep === 0 && !isWalkingRef.current && currentSheetName !== "idle") {
          isAnimatingRef.current = false;
          currentFrameRef.current = 0;
        } else {
          currentFrameRef.current = nextFrame;
        }
      }
    } else {
      currentFrameRef.current = 0;
      frameAccumulatorRef.current = 0;
    }

    setTick((t) => t + 1);
  });


  const displayPosition = isExploding && deathPosition.current ? deathPosition.current : displayPositionRef.current;
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

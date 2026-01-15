import { Sprite, useTick } from "@pixi/react";
import { useState, useMemo } from "react";
import { useControls } from "../hooks/useControls";
import * as PIXI from "pixi.js";
import heroWalkAsset from "../assets/walk.png";
import heroRunAsset from "../assets/run.png";
import { TILE_SIZE } from "../consts/game-world";
import { textureCache } from "../utils/textureCache";

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

const HeroAnimated = () => {
  const { getControlsDirection } = useControls();
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [currentFrame, setCurrentFrame] = useState(0);
  const [currentRow, setCurrentRow] = useState(ANIMATIONS.IDLE_DOWN);
  const [currentSheetName, setCurrentSheetName] = useState<string>("walk");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [frameAccumulator, setFrameAccumulator] = useState(0); // Frame timing accumulator
  const [isWalking, setIsWalking] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false); // Track if animation cycle is in progress

  // Get current animation sheet configuration
  const currentSheet = ANIMATION_SHEETS[currentSheetName];

  // Get base texture from cache (shared across all hero instances)
  // Recaches when switching between animation sheets
  const cachedTexture = useMemo(() => {
    return textureCache.getTexture(currentSheet.asset);
  }, [currentSheet.asset]);

  // Create texture for current frame
  const currentTexture = useMemo(() => {
    // Determine which texture and frame to use
    let textureToUse = cachedTexture;
    let actualFrame: number;
    
    // If not walking and not animating, show the idle frame from walk sheet
    if (!isWalking && !isAnimating) {
      // Always use walk sheet for idle, since run.png doesn't have an idle frame
      textureToUse = textureCache.getTexture(ANIMATION_SHEETS.walk.asset);
      actualFrame = ANIMATION_SHEETS.walk.idleFrame!; // Frame 0 from walk.png
    } else {
      // Use current sheet and get frame from sequence
      actualFrame = currentSheet.frameSequence[currentFrame];
    }
    
    // Calculate the position of the current frame in the sprite sheet
    const x = actualFrame * FRAME_WIDTH;
    const y = currentRow * FRAME_HEIGHT;

    // Create a rectangle that defines which part of the sprite sheet to show
    const rectangle = new PIXI.Rectangle(x, y, FRAME_WIDTH, FRAME_HEIGHT);
    
    // Create a new texture from the base texture using the rectangle
    const texture = new PIXI.Texture(textureToUse.baseTexture, rectangle);
    
    return texture;
  }, [cachedTexture, currentFrame, currentRow, currentSheet, isWalking, isAnimating]);

  useTick((delta) => {
    const { pressedKeys } = getControlsDirection();

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

      // Only run if BOTH moving AND shift is held
      const isRunning = moving && pressedKeys.includes("SHIFT");
      const targetSheetName = isRunning ? "run" : "walk";
      
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
          
          // Apply to new animation
          const newFrame = Math.floor(relativePosition * newSheet.frameSequence.length);
          
          return newFrame;
        });
      }

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

        return { x: x + dx * speedMultiplier, y: y + dy * speedMultiplier };
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
    // Keep animating if walking OR if animation cycle is in progress
    if (isWalking || isAnimating) {
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
            
            // If step complete and not walking, stop animating
            if (isStepComplete && !isWalking) {
              setIsAnimating(false);
              // Switch to walk sheet if currently on a sheet without idle frame
              if (currentSheetName !== "walk") {
                setCurrentSheetName("walk");
              }
              return 0; // Reset to idle frame
            }
            
            return nextFrame;
          });
          return 0; // Reset accumulator
        }
        
        return newAccumulator;
      });
    } else {
      // Reset to first frame when completely idle
      setCurrentFrame(0);
      setFrameAccumulator(0);
      // Make sure we're on walk sheet for idle display
      if (currentSheetName !== "walk") {
        setCurrentSheetName("walk");
      }
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

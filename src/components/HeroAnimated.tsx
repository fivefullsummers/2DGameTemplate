import { Sprite, useTick } from "@pixi/react";
import { useState, useMemo } from "react";
import { useControls } from "../hooks/useControls";
import * as PIXI from "pixi.js";
import heroAnimAsset from "../assets/hero_anim.png";
import { TILE_SIZE } from "../consts/game-world";

// Sprite sheet configuration - LPC (Liberated Pixel Cup) format
const FRAME_WIDTH = 64;  // LPC sprites are 64x64 pixels per frame
const FRAME_HEIGHT = 64; // LPC sprites are 64x64 pixels per frame

// Animation configuration
const ANIMATION_SPEED = 0.15; // How fast to cycle through frames (lower = slower)

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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [frameAccumulator, setFrameAccumulator] = useState(0);
  const [isWalking, setIsWalking] = useState(false);

  // Create base texture from sprite sheet
  const baseTexture = useMemo(() => {
    return PIXI.Texture.from(heroAnimAsset);
  }, []);

  // Create texture for current frame
  const currentTexture = useMemo(() => {
    // Calculate the position of the current frame in the sprite sheet
    const x = currentFrame * FRAME_WIDTH;
    const y = currentRow * FRAME_HEIGHT;

    // Create a rectangle that defines which part of the sprite sheet to show
    const rectangle = new PIXI.Rectangle(x, y, FRAME_WIDTH, FRAME_HEIGHT);
    
    // Create a new texture from the base texture using the rectangle
    const texture = new PIXI.Texture(baseTexture.baseTexture, rectangle);
    
    return texture;
  }, [baseTexture, currentFrame, currentRow]);

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

      // Set the appropriate animation row based on direction
      if (moving) {
        // Normalize movement vector
        dx = dx / magnitude;
        dy = dy / magnitude;

        // Determine which direction is dominant and set animation row
        if (Math.abs(dx) > Math.abs(dy)) {
          // Horizontal movement is dominant
          setCurrentRow(dx > 0 ? ANIMATIONS.RIGHT : ANIMATIONS.LEFT);
        } else {
          // Vertical movement is dominant
          setCurrentRow(dy > 0 ? ANIMATIONS.DOWN : ANIMATIONS.UP);
        }

        return { x: x + dx, y: y + dy };
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
    if (isWalking) {
      setFrameAccumulator((prev) => {
        const newAccumulator = prev + ANIMATION_SPEED * delta;
        
        // When accumulator reaches 1, advance to next frame
        if (newAccumulator >= 1) {
          setCurrentFrame((frame) => {
            // LPC walk animation has 9 frames (0-8)
            return (frame + 1) % 9;
          });
          return 0; // Reset accumulator
        }
        
        return newAccumulator;
      });
    } else {
      // Reset to first frame when idle
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

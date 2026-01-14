import { AnimatedSprite, useTick } from "@pixi/react";
import { useState, useMemo } from "react";
import { useControls } from "../hooks/useControls";
import * as PIXI from "pixi.js";
import heroAnimAsset from "../assets/hero_anim.png";
import { TILE_SIZE } from "../consts/game-world";

// Sprite sheet configuration - LPC (Liberated Pixel Cup) format
const FRAME_WIDTH = 64;  // LPC sprites are 64x64 pixels per frame
const FRAME_HEIGHT = 64; // LPC sprites are 64x64 pixels per frame
const ANIMATION_FPS = 8; // Frames per second for animation

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

const HeroAnimatedSimple = () => {
  const { getControlsDirection } = useControls();
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [currentDirection, setCurrentDirection] = useState("DOWN");
  const [isWalking, setIsWalking] = useState(false);

  // Create base texture from sprite sheet
  const baseTexture = useMemo(() => {
    return PIXI.Texture.from(heroAnimAsset);
  }, []);

  // Create animation textures for each direction
  const animationTextures = useMemo(() => {
    const createFrames = (row: number, frameCount: number) => {
      const frames = [];
      for (let i = 0; i < frameCount; i++) {
        const x = i * FRAME_WIDTH;
        const y = row * FRAME_HEIGHT;
        const rectangle = new PIXI.Rectangle(x, y, FRAME_WIDTH, FRAME_HEIGHT);
        frames.push(new PIXI.Texture(baseTexture.baseTexture, rectangle));
      }
      return frames;
    };

    return {
      walkDown: createFrames(ANIMATIONS.DOWN, 9),    // LPC walk has 9 frames
      walkLeft: createFrames(ANIMATIONS.LEFT, 9),
      walkRight: createFrames(ANIMATIONS.RIGHT, 9),
      walkUp: createFrames(ANIMATIONS.UP, 9),
      idleDown: createFrames(ANIMATIONS.IDLE_DOWN, 1), // Idle uses just frame 0
      idleLeft: createFrames(ANIMATIONS.IDLE_LEFT, 1),
      idleRight: createFrames(ANIMATIONS.IDLE_RIGHT, 1),
      idleUp: createFrames(ANIMATIONS.IDLE_UP, 1),
    };
  }, [baseTexture]);

  // Select current animation textures based on state
  const currentTextures = useMemo(() => {
    const prefix = isWalking ? "walk" : "idle";
    const key = `${prefix}${currentDirection}` as keyof typeof animationTextures;
    return animationTextures[key];
  }, [animationTextures, currentDirection, isWalking]);

  useTick(() => {
    const { pressedKeys } = getControlsDirection();

    setPosition((prev) => {
      const { x, y } = prev;
      let dx = 0;
      let dy = 0;

      if (pressedKeys.includes("UP")) dy -= 1;
      if (pressedKeys.includes("DOWN")) dy += 1;
      if (pressedKeys.includes("LEFT")) dx -= 1;
      if (pressedKeys.includes("RIGHT")) dx += 1;

      const magnitude = Math.sqrt(dx * dx + dy * dy);
      const moving = magnitude > 0;
      
      setIsWalking(moving);

      if (moving) {
        // Normalize
        dx = dx / magnitude;
        dy = dy / magnitude;

        // Determine direction
        if (Math.abs(dx) > Math.abs(dy)) {
          setCurrentDirection(dx > 0 ? "Right" : "Left");
        } else {
          setCurrentDirection(dy > 0 ? "Down" : "Up");
        }

        return { x: x + dx, y: y + dy };
      }

      return prev;
    });
  });

  return (
    <AnimatedSprite
      textures={currentTextures}
      isPlaying={isWalking}
      animationSpeed={ANIMATION_FPS / 60} // Convert FPS to PixiJS speed (0-1 scale)
      x={position.x + TILE_SIZE / 2} // Center in tile horizontally
      y={position.y + TILE_SIZE / 2} // Center in tile vertically
      scale={0.5}  // Scale 64px sprite down to fit 32px tile
      anchor={0.5} // Center the sprite pivot point
    />
  );
};

export default HeroAnimatedSimple;

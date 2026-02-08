import { Sprite } from "@pixi/react";
import { useMemo } from "react";
import * as PIXI from "pixi.js";

const POWERUP_SCALE = 0.2;
/** Frame-by-frame speed: lower = slower (e.g. 0.04 ≈ one frame every ~0.5s). */
const POWERUP_ANIMATION_SPEED = 0.04;

export interface PowerupData {
  id: string;
  x: number;
  y: number;
  /** Current frame index 0..frameCount-1; updated by manager for animation. */
  frameIndex: number;
  createdAt: number;
  /** Visual scale (shrinks as it zips toward player). */
  scale: number;
}

export interface PowerupProps {
  id: string;
  x: number;
  y: number;
  frameIndex: number;
  /** Visual scale; smaller as powerup approaches player. */
  scale?: number;
  /** Sprite asset alias (powerup-guns = guns.png in misc assets). Spritesheet: 5 frames, evenly spaced. */
  spriteAsset?: string;
  /** Number of frames in the spritesheet (default 5). */
  frameCount?: number;
}

/**
 * Renders a single powerup sprite (one frame of the guns.png spritesheet).
 * Animation is driven by the parent updating frameIndex each tick.
 */
const Powerup = ({
  x,
  y,
  frameIndex,
  scale: scaleProp,
  spriteAsset = "powerup-guns",
  frameCount = 5,
}: PowerupProps) => {
  const scale = scaleProp ?? POWERUP_SCALE;
  const cachedTexture = useMemo(
    () => PIXI.Assets.get(spriteAsset),
    [spriteAsset]
  );

  const frameTexture = useMemo(() => {
    if (!cachedTexture?.baseTexture?.width) return cachedTexture;
    const base = cachedTexture.baseTexture;
    const totalWidth = base.width;
    const frameWidth = totalWidth / frameCount;
    const frameHeight = base.height;
    const clampedIndex = Math.max(0, Math.min(frameIndex, frameCount - 1));
    const rectangle = new PIXI.Rectangle(
      clampedIndex * frameWidth,
      0,
      frameWidth,
      frameHeight
    );
    return new PIXI.Texture(base, rectangle);
  }, [cachedTexture, frameIndex, frameCount]);

  if (!frameTexture) return null;

  return (
    <Sprite
      texture={frameTexture}
      x={x}
      y={y}
      scale={scale}
      anchor={0.5}
    />
  );
};

export default Powerup;
export { POWERUP_SCALE, POWERUP_ANIMATION_SPEED };

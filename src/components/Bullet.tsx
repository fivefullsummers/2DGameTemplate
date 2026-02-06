import { Sprite } from "@pixi/react";
import { useMemo } from "react";
import * as PIXI from "pixi.js";
import { BulletConfig } from "../consts/bullet-config";

export interface BulletProps {
  id: string;
  x: number;
  y: number;
  direction: "UP" | "DOWN" | "LEFT" | "RIGHT";
  config: BulletConfig;
}

const Bullet = ({ x, y, direction, config }: BulletProps) => {
  const cachedTexture = useMemo(() => PIXI.Assets.get(config.spriteAsset), [config.spriteAsset]);

  const bulletTexture = useMemo(() => {
    if (!cachedTexture?.baseTexture?.width) return cachedTexture;
    const textureWidth = cachedTexture.baseTexture.width;
    const textureHeight = cachedTexture.baseTexture.height;
    const rectangle = new PIXI.Rectangle(0, 0, textureWidth, textureHeight);
    return new PIXI.Texture(cachedTexture.baseTexture, rectangle);
  }, [cachedTexture]);

  const rotation = useMemo(() => {
    switch (direction) {
      case "UP":
        return 0;
      case "DOWN":
        return Math.PI / 2;
      case "LEFT":
        return Math.PI;
      case "RIGHT":
        return 0;
      default:
        return 0;
    }
  }, [direction]);

  return (
    <Sprite
      texture={bulletTexture}
      x={x}
      y={y}
      scale={config.scale}
      anchor={0.5}
      rotation={rotation}
      tint={0xffff00}
    />
  );
};

export default Bullet;

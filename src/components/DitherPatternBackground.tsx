import { useMemo } from "react";
import * as PIXI from "pixi.js";
import { Container, Sprite } from "@pixi/react";
import { isMobile } from "../consts/game-world";
import backgroundPattern from "../assets/misc/background.png";

/** Dither pattern PNG dimensions - tiles perfectly on X axis. */
export const DITHER_PATTERN_WIDTH = 504;
export const DITHER_PATTERN_HEIGHT = 705;

interface DitherPatternBackgroundProps {
  width: number;
  height: number;
}

/** Dark blue from the dither gradient - fills any gap */
const FILL_COLOR = 0x04003d;

/**
 * GPU-cheap background using the dither pattern.
 * Uses Sprite with image prop (like HeroGrid, EnemyStatic) - loads directly from imported URL.
 */
const DitherPatternBackground = ({ width, height }: DitherPatternBackgroundProps) => {
  const sprites = useMemo(() => {
    const mobile = isMobile();

    if (mobile) {
      // Single tile, scale to cover, anchored to bottom via anchor
      const scaleX = width / DITHER_PATTERN_WIDTH;
      const scaleY = height / DITHER_PATTERN_HEIGHT;
      const scale = Math.max(scaleX, scaleY);
      const scaledW = DITHER_PATTERN_WIDTH * scale;
      const x = (width - scaledW) / 2;
      return [
        {
          key: "0",
          x,
          y: height,
          scaleX: scale,
          scaleY: scale,
          anchor: { x: 0, y: 1 },
        },
      ];
    }

    // Desktop: scale pattern to FULL HEIGHT (no gap), tile horizontally
    const scale = height / DITHER_PATTERN_HEIGHT;
    const scaledTileWidth = DITHER_PATTERN_WIDTH * scale;
    const tileCount = Math.ceil(width / scaledTileWidth);
    const tiles: Array<{
      key: string;
      x: number;
      y: number;
      scaleX: number;
      scaleY: number;
      anchor: { x: number; y: number };
    }> = [];
    for (let i = 0; i < tileCount; i++) {
      tiles.push({
        key: String(i),
        x: i * scaledTileWidth,
        y: height,
        scaleX: scale,
        scaleY: scale,
        anchor: { x: 0, y: 1 },
      });
    }
    return tiles;
  }, [width, height]);

  if (!sprites.length) {
    return (
      <Container>
        <Sprite
          texture={PIXI.Texture.WHITE}
          width={width}
          height={height}
          tint={FILL_COLOR}
        />
      </Container>
    );
  }

  return (
    <Container>
      {/* Solid fill for any gap above the pattern (tall screens) */}
      <Sprite
        texture={PIXI.Texture.WHITE}
        width={width}
        height={height}
        tint={FILL_COLOR}
      />
      {sprites.map(({ key, x, y, scaleX, scaleY, anchor }) => (
        <Sprite
          key={key}
          image={backgroundPattern}
          x={x}
          y={y}
          scale={{ x: scaleX, y: scaleY }}
          anchor={anchor}
        />
      ))}
    </Container>
  );
};

export default DitherPatternBackground;

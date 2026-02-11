import { useMemo } from "react";
import * as PIXI from "pixi.js";
import { Container, Sprite } from "@pixi/react";
import backgroundPattern from "../assets/misc/background.png";
import { isMobile } from "../consts/game-world";

/** Source pattern dimensions. */
const PATTERN_WIDTH = 504;
const PATTERN_HEIGHT = 705;
// Solid background behind the transparent PNG dither.
const FILL_COLOR = 0x002054;

interface TiledDitherBackgroundProps {
  width: number;
  height: number;
}

/**
 * Image-only cheap dither background (no custom shader).
 * - Desktop: tiles horizontally from the bottom; solid blue above if screen is taller.
 * - Mobile: single tile, scaled to cover screen.
 */
const TiledDitherBackground = ({ width, height }: TiledDitherBackgroundProps) => {
  const sprites = useMemo(() => {
    const mobile = isMobile();

    if (mobile) {
      // Single tile, scale to cover. Anchor bottom-center so it hugs the bottom edge.
      const scaleX = width / PATTERN_WIDTH;
      const scaleY = height / PATTERN_HEIGHT;
      const scale = Math.max(scaleX, scaleY);

      return [
        {
          key: "mobile",
          x: width / 2,
          y: height,
          scaleX: scale,
          scaleY: scale,
          anchorX: 0.5,
          anchorY: 1,
        },
      ];
    }

    // Desktop: bottom-aligned strip; space above is just solid blue.
    const scale = 1; // keep original pixel-perfect size vertically
    const tileWidth = PATTERN_WIDTH * scale;
    const tileCount = Math.ceil(width / tileWidth);

    const tiles: Array<{
      key: string;
      x: number;
      y: number;
      scaleX: number;
      scaleY: number;
      anchorX: number;
      anchorY: number;
    }> = [];

    for (let i = 0; i < tileCount; i++) {
      tiles.push({
        key: String(i),
        x: i * tileWidth,
        y: height,
        scaleX: scale,
        scaleY: scale,
        anchorX: 0,
        anchorY: 1, // bottom-left
      });
    }

    return tiles;
  }, [width, height]);

  return (
    <Container>
      {/* Solid fill to cover any area not covered by the pattern (esp. above on tall screens). */}
      <Sprite
        texture={PIXI.Texture.WHITE}
        tint={FILL_COLOR}
        width={width}
        height={height}
      />
      {sprites.map(({ key, x, y, scaleX, scaleY, anchorX, anchorY }) => (
        <Sprite
          key={key}
          image={backgroundPattern}
          x={x}
          y={y}
          scale={{ x: scaleX, y: scaleY }}
          anchor={{ x: anchorX, y: anchorY }}
        />
      ))}
    </Container>
  );
};

export default TiledDitherBackground;


import { Graphics } from "@pixi/react";
import { Graphics as PixiGraphics } from "pixi.js";
import { COLLISION_MAP } from "../consts/collision-map";
import { TILE_SIZE, OFFSET_X, OFFSET_Y } from "../consts/game-world";
import { useCallback } from "react";

const CollisionDebug = () => {
  const draw = useCallback((g: PixiGraphics) => {
    g.clear();
    
    // Draw border on each blocked tile
    COLLISION_MAP.forEach((row, rowIndex) => {
      row.forEach((tile, colIndex) => {
        if (tile === 1) {
          // Draw red border for blocked tiles
          // Offset by -TILE_SIZE to account for 1 tile of padding
          // This makes collision map (0,0) render BEFORE the tilemap
          g.lineStyle(2, 0xff0000, 0.5);
          g.drawRect(
            colIndex * TILE_SIZE + OFFSET_X - TILE_SIZE,
            rowIndex * TILE_SIZE + OFFSET_Y - TILE_SIZE,
            TILE_SIZE,
            TILE_SIZE
          );
        }
      });
    });
  }, []);

  return <Graphics draw={draw} />;
};

export default CollisionDebug;

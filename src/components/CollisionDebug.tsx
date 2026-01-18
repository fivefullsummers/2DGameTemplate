import { Graphics } from "@pixi/react";
import { Graphics as PixiGraphics } from "pixi.js";
import { COLLISION_MAP, COLLISION_SUB_TILE_SIZE } from "../consts/collision-map";
import { TILE_SIZE, OFFSET_X, OFFSET_Y } from "../consts/game-world";
import { useCallback } from "react";

interface CollisionDebugProps {
  isVisible?: boolean;
}

const CollisionDebug = ({ isVisible = false }: CollisionDebugProps) => {
  const draw = useCallback((g: PixiGraphics) => {
    g.clear();
    
    if (!isVisible) {
      return;
    }
    
    // Draw border on each blocked sub-tile (16x16 cells)
    COLLISION_MAP.forEach((row, rowIndex) => {
      row.forEach((tile, colIndex) => {
        if (tile === 1) {
          // Draw red border for blocked sub-tiles
          // Offset by -TILE_SIZE to account for 1 tile of padding
          // This makes collision map (0,0) render BEFORE the tilemap
          // Use COLLISION_SUB_TILE_SIZE (16px) instead of TILE_SIZE (32px)
          g.lineStyle(1, 0xff0000, 0.5);
          g.drawRect(
            colIndex * COLLISION_SUB_TILE_SIZE + OFFSET_X - TILE_SIZE,
            rowIndex * COLLISION_SUB_TILE_SIZE + OFFSET_Y - TILE_SIZE,
            COLLISION_SUB_TILE_SIZE,
            COLLISION_SUB_TILE_SIZE
          );
        }
      });
    });
  }, [isVisible]);

  if (!isVisible) {
    return null;
  }

  return <Graphics draw={draw} />;
};

export default CollisionDebug;

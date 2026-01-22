import { Sprite } from "@pixi/react";
import { useMemo } from "react";
import * as PIXI from "pixi.js";
import { GAME_WIDTH, GAME_HEIGHT, OFFSET_X, OFFSET_Y } from "../consts/game-world";

const Level = () => {
  // Use the preloaded texture from the asset loader instead of importing directly
  const mapTexture = useMemo(() => {
    return PIXI.Assets.get("level-map");
  }, []);

  return (
    <Sprite
      texture={mapTexture}
      width={GAME_WIDTH}
      height={GAME_HEIGHT}
      x={OFFSET_X}
      y={OFFSET_Y}
    />
  );
};

export default Level;

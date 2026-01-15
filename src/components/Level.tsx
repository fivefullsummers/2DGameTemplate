import { Sprite } from "@pixi/react";
import levelAsset from "../assets/map.png";
import { GAME_WIDTH, GAME_HEIGHT, OFFSET_X, OFFSET_Y } from "../consts/game-world";

const Level = () => {
  return (
    <Sprite
      image={levelAsset}
      width={GAME_WIDTH}
      height={GAME_HEIGHT}
      x={OFFSET_X}
      y={OFFSET_Y}
    />
  );
};

export default Level;

import { Container, Sprite, Stage } from "@pixi/react";
import levelAsset from "../assets/map.png";
import { GAME_WIDTH, GAME_HEIGHT, TILE_SIZE } from "../consts/game-world";
import useDimensions from "../hooks/useDimensions";

import HeroMouse from "./HeroMouse";
import { PointerEvent, useRef } from "react";
import { IPosition } from "../types/common";

const Experience = () => {
  const { width, height, scale } = useDimensions();
  const onClickMove = useRef<(target: IPosition)=>void>(null);

  const handleStageClick = (event: PointerEvent) => {
    onClickMove.current?.({
      x: event.nativeEvent.offsetX / scale - TILE_SIZE / 2,
      y: event.nativeEvent.offsetY / scale - TILE_SIZE / 2
    })
  }

  return (
    <Stage width={width} height={height} onPointerDown={handleStageClick}>
      <Container scale={scale}>
        <Sprite
          image={levelAsset}
          width={GAME_WIDTH}
          height={GAME_HEIGHT}
        />
        <HeroMouse onClickMove={onClickMove} />
      </Container>
    </Stage>
  );
};

export default Experience;

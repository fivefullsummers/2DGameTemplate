import { Container, Stage } from "@pixi/react";
import { TILE_SIZE } from "../consts/game-world";
import useDimensions from "../hooks/useDimensions";

// import HeroMouse from "./HeroMouse";
import HeroAnimated from "./HeroAnimated";
import Level from "./Level";
import CollisionDebug from "./CollisionDebug";
import BulletManager, { BulletManagerRef } from "./BulletManager";
import { PointerEvent, useRef } from "react";
import { IPosition } from "../types/common";

const Experience = () => {
  const { width, height, scale } = useDimensions();
  const onClickMove = useRef<(target: IPosition)=>void>(null);
  const bulletManagerRef = useRef<BulletManagerRef>(null);

  const handleStageClick = (event: PointerEvent) => {
    onClickMove.current?.({
      x: event.nativeEvent.offsetX / scale - TILE_SIZE / 2,
      y: event.nativeEvent.offsetY / scale - TILE_SIZE / 2
    })
  }

  return (
    <Stage width={width} height={height} onPointerDown={handleStageClick}>
      <Container scale={scale}>
        <Level />
        <CollisionDebug />
        <BulletManager ref={bulletManagerRef} />
        {/* <HeroMouse onClickMove={onClickMove} /> */}
        <HeroAnimated bulletManagerRef={bulletManagerRef} gunType="pistol" />

      </Container>
    </Stage>
  );
};

export default Experience;

import { Container, Stage } from "@pixi/react";
import { TILE_SIZE } from "../consts/game-world";
import useDimensions from "../hooks/useDimensions";

// import HeroMouse from "./HeroMouse";
import HeroAnimated from "./HeroAnimated";
import Level from "./Level";
import CollisionDebug from "./CollisionDebug";
import BulletManager, { BulletManagerRef } from "./BulletManager";
import { PointerEvent, useRef, useEffect } from "react";
import { IPosition } from "../types/common";
import { ControlsProvider } from "../contexts/ControlsContext";
import MobileJoystick from "./MobileJoystick";
import { useControlsContext } from "../contexts/ControlsContext";
import { sound } from "@pixi/sound";

const ExperienceContent = () => {
  const { width, height, scale } = useDimensions();
  const onClickMove = useRef<(target: IPosition)=>void>(null);
  const bulletManagerRef = useRef<BulletManagerRef>(null);
  const { setJoystickDirection, getControlsDirection, consumeShootPress, isShootHeld } = useControlsContext();

  // Play level music on mount
  useEffect(() => {
    const levelMusic = sound.find("level1-music");
    if (levelMusic) {
      levelMusic.play({ loop: true, volume: 0.3 });
    }

    // Stop music when component unmounts
    return () => {
      if (levelMusic) {
        levelMusic.stop();
      }
    };
  }, []);

  const handleStageClick = (event: PointerEvent) => {
    onClickMove.current?.({
      x: event.nativeEvent.offsetX / scale - TILE_SIZE / 2,
      y: event.nativeEvent.offsetY / scale - TILE_SIZE / 2
    })
  }

  return (
    <>
      <Stage width={width} height={height} onPointerDown={handleStageClick}>
        <Container scale={scale}>
          <Level />
          <CollisionDebug />
          <BulletManager ref={bulletManagerRef} />
          {/* <HeroMouse onClickMove={onClickMove} /> */}
          <HeroAnimated 
            bulletManagerRef={bulletManagerRef} 
            gunType="pistol"
            getControlsDirection={getControlsDirection}
            consumeShootPress={consumeShootPress}
            isShootHeld={isShootHeld}
          />
        </Container>
      </Stage>
      <MobileJoystick onDirectionChange={setJoystickDirection} />
    </>
  );
};

const Experience = () => {
  return (
    <ControlsProvider>
      <ExperienceContent />
    </ControlsProvider>
  );
};

export default Experience;

import { Container, Stage } from "@pixi/react";
import { TILE_SIZE, COLS, ROWS } from "../consts/game-world";
import useDimensions from "../hooks/useDimensions";

// import HeroMouse from "./HeroMouse";
import HeroAnimated from "./HeroAnimated";
import EnemyAnimated from "./EnemyAnimated";
import Level from "./Level";
import CollisionDebug from "./CollisionDebug";
import BulletManager, { BulletManagerRef } from "./BulletManager";
import { PointerEvent, useRef, useEffect } from "react";
import { IPosition } from "../types/common";
import { ControlsProvider } from "../contexts/ControlsContext";
import MobileJoystick from "./MobileJoystick";
import MobileShootButton from "./MobileShootButton";
import { useControlsContext } from "../contexts/ControlsContext";
import { sound } from "@pixi/sound";

const ExperienceContent = () => {
  const { width, height, scale } = useDimensions();
  const onClickMove = useRef<(target: IPosition)=>void>(null);
  const bulletManagerRef = useRef<BulletManagerRef>(null);
  // Calculate center of map for hero spawn
  // Map is (COLS - 2) tiles wide and (ROWS - 2) tiles tall (accounting for padding)
  // Each tile is TILE_SIZE pixels
  const centerX = ((COLS - 2) * TILE_SIZE) / 2;
  const centerY = ((ROWS - 2) * TILE_SIZE) / 2;
  const heroPositionRef = useRef<IPosition>({ x: centerX, y: centerY });
  const enemyPositionRef = useRef<IPosition>({ x: 300, y: 300 });
  const { setJoystickDirection, setJoystickRun, getControlsDirection, consumeShootPress, isShootHeld, triggerMobileShoot } = useControlsContext();

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
            positionRef={heroPositionRef}
            enemyPositionRef={enemyPositionRef}
          />
          <EnemyAnimated 
            x={300} 
            y={300} 
            initialDirection="DOWN"
            positionRef={enemyPositionRef}
            heroPositionRef={heroPositionRef}
          />
        </Container>
      </Stage>
      <MobileJoystick onDirectionChange={setJoystickDirection} onRunChange={setJoystickRun} />
      <MobileShootButton onShoot={triggerMobileShoot} />
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

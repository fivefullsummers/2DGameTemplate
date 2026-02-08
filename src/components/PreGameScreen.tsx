import { Container, Stage, Text, Sprite, useTick } from "@pixi/react";
import { useState, useMemo, useCallback } from "react";
import * as PIXI from "pixi.js";
import useDimensions from "../hooks/useDimensions";
import StartScreenBackground from "./StartScreenBackground";
import { TextStyle } from "pixi.js";
import { sound } from "@pixi/sound";
import { PLAYER_CONFIGS } from "../consts/players";
import {
  getEnemyTypeConfig,
  ENEMY_TYPE_IDS,
  DEFAULT_ENEMY_TYPE_ID,
} from "../consts/enemy-types";

const HERO_FRAME_WIDTH = 512;
const ENEMY_FRAME_WIDTH = 512;
const ENEMY_FRAME_HEIGHT = 288;
const LEVEL_NUMBER = 1;

interface PreGameScreenProps {
  selectedPlayerId: string;
  /** Enemy type id for this level (defaults to first type if not set). */
  enemyTypeId?: string;
  /** Called when user clicks READY to start the game */
  onReady: () => void;
  onBack?: () => void;
}

const titleStyle = new TextStyle({
  fontFamily: "Neopixel",
  fontSize: 18,
  fontWeight: "bold",
  fill: 0xffffff,
  stroke: 0x000000,
  strokeThickness: 6,
});
const levelLabelStyle = new TextStyle({
  fontFamily: "Neopixel",
  fontSize: 12,
  fill: 0xcccccc,
  stroke: 0x000000,
  strokeThickness: 2,
});
const enemyTypeStyle = new TextStyle({
  fontFamily: "Neopixel",
  fontSize: 16,
  fontWeight: "bold",
  fill: 0xffffff,
  stroke: 0x000000,
  strokeThickness: 4,
});
const vsLabelStyle = new TextStyle({
  fontFamily: "Neopixel",
  fontSize: 10,
  fill: 0xaaaaaa,
  stroke: 0x000000,
  strokeThickness: 1,
});
const missionTitleStyle = new TextStyle({
  fontFamily: "Neopixel",
  fontSize: 12,
  fontWeight: "bold",
  fill: 0xffffff,
  stroke: 0x000000,
  strokeThickness: 2,
});
const missionLineStyle = new TextStyle({
  fontFamily: "Neopixel",
  fontSize: 10,
  fill: 0xdddddd,
  stroke: 0x000000,
  strokeThickness: 1,
});

/** Inner content so useTick has Application context */
const PreGameContent = ({
  width,
  height,
  selectedPlayerId,
  enemyTypeId,
  onReady,
  onBack,
}: {
  width: number;
  height: number;
  selectedPlayerId: string;
  enemyTypeId: string;
  onReady: () => void;
  onBack?: () => void;
}) => {
  const [tick, setTick] = useState(0);
  const [hoverReady, setHoverReady] = useState(false);
  useTick(() => setTick((t) => t + 1));

  const playerConfig = PLAYER_CONFIGS[selectedPlayerId];
  const enemyConfig = getEnemyTypeConfig(enemyTypeId);

  const playerTexture = useMemo(() => {
    if (!playerConfig) return null;
    const full = PIXI.Assets.get(playerConfig.heroAsset);
    if (!full?.baseTexture || full.baseTexture.width === 0) return full ?? null;
    const frameIndex = Math.floor(tick / 7) % 2;
    const x = frameIndex * HERO_FRAME_WIDTH;
    const h = full.baseTexture.height;
    const rect = new PIXI.Rectangle(x, 0, HERO_FRAME_WIDTH, h);
    return new PIXI.Texture(full.baseTexture, rect);
  }, [playerConfig?.heroAsset, tick]);

  const enemyTexture = useMemo(() => {
    if (!enemyConfig) return null;
    const full = PIXI.Assets.get(enemyConfig.spriteAsset);
    if (!full?.baseTexture || full.baseTexture.width === 0) return full ?? null;
    const rect = new PIXI.Rectangle(0, 0, ENEMY_FRAME_WIDTH, ENEMY_FRAME_HEIGHT);
    return new PIXI.Texture(full.baseTexture, rect);
  }, [enemyConfig?.spriteAsset]);

  const handleReady = useCallback(() => {
    const clickSfx = sound.find("button-click");
    if (clickSfx) clickSfx.play({ volume: 0.4 });
    onReady();
  }, [onReady]);

  const readyButtonStyle = useMemo(
    () =>
      new TextStyle({
        fontFamily: "Neopixel",
        fontSize: 14,
        fontWeight: "bold",
        fill: hoverReady ? 0x111111 : 0x000000,
        stroke: 0xffffff,
        strokeThickness: 2,
      }),
    [hoverReady]
  );

  if (!enemyConfig) return null;

  const spriteScale = 0.2;
  const vsGap = 24;

  return (
    <>
      <StartScreenBackground width={width} height={height} />

      <Container x={width / 2} y={height * 0.08}>
        <Text text="TAX EVADERS" anchor={0.5} style={titleStyle} />
      </Container>

      <Container x={width / 2} y={height * 0.16}>
        <Text text={`LEVEL ${LEVEL_NUMBER}`} anchor={0.5} style={levelLabelStyle} />
      </Container>
      <Container x={width / 2} y={height * 0.22}>
        <Text text={enemyConfig.name} anchor={0.5} style={enemyTypeStyle} />
      </Container>

      {/* Player vs Enemy */}
      <Container x={width / 2} y={height * 0.38}>
        {playerTexture && (
          <Sprite
            texture={playerTexture}
            x={-80 - vsGap}
            y={0}
            anchor={0.5}
            scale={spriteScale}
            tint={playerConfig?.tint ?? 0xffffff}
          />
        )}
        <Text text="VS" anchor={0.5} x={0} y={0} style={vsLabelStyle} />
        {enemyTexture && (
          <Sprite
            texture={enemyTexture}
            x={80 + vsGap}
            y={0}
            anchor={0.5}
            scale={spriteScale}
            tint={enemyConfig.tint ?? 0xffffff}
          />
        )}
      </Container>

      <Container x={width / 2} y={height * 0.52}>
        <Text text="YOUR MISSION:" anchor={0.5} style={missionTitleStyle} />
      </Container>
      {enemyConfig.missionLines.map((line, i) => (
        <Container
          key={i}
          x={width / 2}
          y={height * 0.56 + i * 20}
        >
          <Text text={line} anchor={0.5} style={missionLineStyle} />
        </Container>
      ))}

      <Container
        x={width / 2}
        y={height - 80}
        eventMode="static"
        cursor="pointer"
        pointerdown={handleReady}
        pointerover={() => setHoverReady(true)}
        pointerout={() => setHoverReady(false)}
      >
        <Sprite
          texture={PIXI.Texture.WHITE}
          width={140}
          height={44}
          anchor={0.5}
          tint={0xffffff}
          scale={{ x: 1, y: 1 }}
        />
        <Text
          text="READY?"
          anchor={0.5}
          style={readyButtonStyle}
          scale={{ x: hoverReady ? 1.05 : 1, y: hoverReady ? 1.05 : 1 }}
        />
      </Container>

      {onBack && (
        <Container
          x={width / 2}
          y={height - 40}
          eventMode="static"
          cursor="pointer"
          pointerdown={() => {
            const clickSfx = sound.find("button-click");
            if (clickSfx) clickSfx.play({ volume: 0.4 });
            onBack();
          }}
        >
          <Text text="BACK" anchor={0.5} style={missionLineStyle} />
        </Container>
      )}
    </>
  );
};

const PreGameScreen = ({
  selectedPlayerId,
  enemyTypeId = DEFAULT_ENEMY_TYPE_ID,
  onReady,
  onBack,
}: PreGameScreenProps) => {
  const { width, height } = useDimensions();
  const effectiveEnemyTypeId = ENEMY_TYPE_IDS.includes(enemyTypeId)
    ? enemyTypeId
    : DEFAULT_ENEMY_TYPE_ID;

  return (
    <Stage width={width} height={height}>
      <PreGameContent
        width={width}
        height={height}
        selectedPlayerId={selectedPlayerId}
        enemyTypeId={effectiveEnemyTypeId}
        onReady={onReady}
        onBack={onBack}
      />
    </Stage>
  );
};

export default PreGameScreen;

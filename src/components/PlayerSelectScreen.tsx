import { Container, Stage, Text, Sprite, Graphics, useTick } from "@pixi/react";
import { useState, useMemo, useCallback } from "react";
import * as PIXI from "pixi.js";
import { Graphics as PixiGraphics } from "pixi.js";
import useDimensions from "../hooks/useDimensions";
import StartScreenBackground from "./StartScreenBackground";
import { TextStyle } from "pixi.js";
import { sound } from "@pixi/sound";
import { PLAYER_CONFIGS, PLAYER_IDS, getWeaponDisplayName, DEFAULT_PLAYER_ID } from "../consts/players";

const CARD_WIDTH = 160;
const MAX_CARD_HEIGHT = 220;
const MIN_CARD_HEIGHT = 140;
const CARD_GAP = 20;
const GRID_COLS = 2;
const FRAME_WIDTH = 512; // hero-cool is 1536/3
/** Match in-game player idle speed (speed 0.15 => ~1/0.15 ticks per frame) */
const CARD_ANIM_TICKS_PER_FRAME = 7;
/** Space reserved at bottom for CONTINUE + BACK buttons */
const BUTTONS_RESERVE = 100;
const TITLE_TOP_RATIO = 0.055;
const TITLE_HEIGHT = 28;
const GAP_AFTER_TITLE = 10;

interface PlayerSelectScreenProps {
  /** Called with the selected player id when user clicks CONTINUE */
  onContinue: (selectedPlayerId: string) => void;
  onBack?: () => void;
}

/** Single card: border + optional check, sprite, name, weapon text. Height is dynamic for responsive layout. */
const PlayerCard = ({
  playerId,
  isSelected,
  onSelect,
  tick,
  cardHeight,
}: {
  playerId: string;
  isSelected: boolean;
  onSelect: () => void;
  tick: number;
  cardHeight: number;
}) => {
  const config = PLAYER_CONFIGS[playerId];
  if (!config) return null;

  const texture = useMemo(() => {
    const full = PIXI.Assets.get(config.heroAsset);
    if (!full?.baseTexture || full.baseTexture.width === 0) return full ?? null;
    const frameIndex = Math.floor(tick / CARD_ANIM_TICKS_PER_FRAME) % 2; // idle frames 0, 1 (slow)
    const x = frameIndex * FRAME_WIDTH;
    const h = full.baseTexture.height;
    const rect = new PIXI.Rectangle(x, 0, FRAME_WIDTH, h);
    return new PIXI.Texture(full.baseTexture, rect);
  }, [config.heroAsset, tick]);

  const drawCard = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      g.lineStyle(isSelected ? 3 : 1, isSelected ? 0x0088ff : 0x444444, 1);
      g.beginFill(0x1a1a1a, 0.9);
      g.drawRoundedRect(0, 0, CARD_WIDTH, cardHeight, 8);
      g.endFill();
    },
    [isSelected, cardHeight]
  );

  // Layout proportional to cardHeight: sprite in upper ~58%, text block in lower ~42%
  const SPRITE_ZONE_TOP = 16;
  const SPRITE_ZONE_BOTTOM = Math.round(cardHeight * 0.58);
  const spriteZoneHeight = SPRITE_ZONE_BOTTOM - SPRITE_ZONE_TOP;
  const scale = Math.min(0.6, spriteZoneHeight / (texture?.height ?? 400));
  const spriteCenterY = SPRITE_ZONE_TOP + spriteZoneHeight / 2;
  const textBlockTop = Math.round(cardHeight * 0.62);
  const nameY = textBlockTop;
  const labelY = textBlockTop + 16;
  const valueY = textBlockTop + 32;

  return (
    <Container eventMode="static" cursor="pointer" pointerdown={onSelect}>
      <Graphics draw={drawCard} />
      {/* Checkbox / checkmark top-right */}
      <Container x={CARD_WIDTH - 22} y={6}>
        {isSelected ? (
          <Text text="✓" style={checkStyle} anchor={0.5} x={12} y={10} />
        ) : (
          <Text text="☐" style={uncheckStyle} anchor={0.5} x={12} y={10} />
        )}
      </Container>
      {/* Animated sprite in fixed top zone */}
      {texture && (
        <Sprite
          texture={texture}
          x={CARD_WIDTH / 2}
          y={spriteCenterY}
          anchor={0.5}
          scale={scale}
          tint={config.tint ?? 0xffffff}
        />
      )}
      {/* Name and weapon: positioned with padding so all text stays inside card */}
      <Text
        text={config.name}
        style={nameStyle}
        anchor={0.5}
        x={CARD_WIDTH / 2}
        y={nameY}
      />
      <Text
        text={`WEAPON OF CHOICE:`}
        style={weaponLabelStyle}
        anchor={0.5}
        x={CARD_WIDTH / 2}
        y={labelY}
      />
      <Text
        text={getWeaponDisplayName(config.weaponOfChoice)}
        style={weaponValueStyle}
        anchor={0.5}
        x={CARD_WIDTH / 2}
        y={valueY}
      />
    </Container>
  );
};

const checkStyle = new TextStyle({
  fontFamily: "Neopixel",
  fontSize: 14,
  fill: 0x00ff88,
  stroke: 0x000000,
  strokeThickness: 2,
});
const uncheckStyle = new TextStyle({
  fontFamily: "Neopixel",
  fontSize: 12,
  fill: 0x666666,
  stroke: 0x000000,
  strokeThickness: 1,
});
const nameStyle = new TextStyle({
  fontFamily: "Neopixel",
  fontSize: 10,
  fontWeight: "bold",
  fill: 0xffffff,
  stroke: 0x000000,
  strokeThickness: 2,
  wordWrap: true,
  wordWrapWidth: CARD_WIDTH - 16,
});
const weaponLabelStyle = new TextStyle({
  fontFamily: "Neopixel",
  fontSize: 8,
  fill: 0xaaaaaa,
  stroke: 0x000000,
  strokeThickness: 1,
});
const weaponValueStyle = new TextStyle({
  fontFamily: "Neopixel",
  fontSize: 9,
  fill: 0xcccccc,
  stroke: 0x000000,
  strokeThickness: 1,
  wordWrap: true,
  wordWrapWidth: CARD_WIDTH - 16,
});

/** Inner content rendered inside Stage so useTick has Application context */
const PlayerSelectContent = ({
  width,
  height,
  onContinue,
  onBack,
}: {
  width: number;
  height: number;
  onContinue: (selectedPlayerId: string) => void;
  onBack?: () => void;
}) => {
  const [selectedId, setSelectedId] = useState<string>(DEFAULT_PLAYER_ID);
  const [hoverContinue, setHoverContinue] = useState(false);
  const [tick, setTick] = useState(0);
  useTick(() => setTick((t) => t + 1));

  const titleStyle = useMemo(
    () =>
      new TextStyle({
        fontFamily: "Neopixel",
        fontSize: 18,
        fontWeight: "bold",
        fill: ["#ffffff", "#00ff88"],
        stroke: "#000000",
        strokeThickness: 6,
        dropShadow: true,
        dropShadowColor: "#000000",
        dropShadowBlur: 8,
        dropShadowAngle: Math.PI / 6,
        dropShadowDistance: 6,
      }),
    []
  );

  const buttonStyle = useMemo(
    () =>
      new TextStyle({
        fontFamily: "Neopixel",
        fontSize: 14,
        fontWeight: "bold",
        fill: hoverContinue ? "#00ff88" : "#ffffff",
        stroke: "#000000",
        strokeThickness: 4,
        dropShadow: true,
        dropShadowColor: "#000000",
        dropShadowBlur: 4,
        dropShadowAngle: Math.PI / 6,
        dropShadowDistance: 3,
      }),
    [hoverContinue]
  );

  const handleContinue = useCallback(() => {
    const clickSfx = sound.find("button-click");
    if (clickSfx) clickSfx.play({ volume: 0.4 });
    onContinue(selectedId);
  }, [onContinue, selectedId]);

  const handleCardSelect = useCallback((playerId: string) => {
    const clickSfx = sound.find("button-click");
    if (clickSfx) clickSfx.play({ volume: 0.4 });
    setSelectedId(playerId);
  }, []);

  // Responsive layout: title high, then cards, then reserved button area
  const titleY = height * TITLE_TOP_RATIO;
  const gridTop = titleY + TITLE_HEIGHT + GAP_AFTER_TITLE;
  const availableForGrid = height - BUTTONS_RESERVE - gridTop;
  const cardHeight = Math.max(
    MIN_CARD_HEIGHT,
    Math.min(MAX_CARD_HEIGHT, Math.floor((availableForGrid - CARD_GAP) / 2))
  );
  const gridWidth = GRID_COLS * CARD_WIDTH + (GRID_COLS - 1) * CARD_GAP;
  const gridHeight = 2 * cardHeight + CARD_GAP;
  const gridX = (width - gridWidth) / 2;
  const buttonsTopY = height - BUTTONS_RESERVE + 20;
  const continueY = buttonsTopY + 24;
  const backY = buttonsTopY + 56;

  return (
    <>
      <StartScreenBackground width={width} height={height} />

      {/* Title: separate container, placed higher */}
      <Container x={width / 2} y={titleY + TITLE_HEIGHT / 2}>
        <Text text="CHOOSE YOUR PLAYER" anchor={0.5} style={titleStyle} />
      </Container>

      {/* Cards: separate container so grid can shrink when height is limited */}
      <Container>
        {PLAYER_IDS.map((playerId, index) => {
          const col = index % GRID_COLS;
          const row = Math.floor(index / GRID_COLS);
          const x = gridX + col * (CARD_WIDTH + CARD_GAP);
          const y = gridTop + row * (cardHeight + CARD_GAP);
          return (
            <Container key={playerId} x={x} y={y}>
              <PlayerCard
                playerId={playerId}
                isSelected={selectedId === playerId}
                onSelect={() => handleCardSelect(playerId)}
                tick={tick}
                cardHeight={cardHeight}
              />
            </Container>
          );
        })}
      </Container>

      {/* Buttons: separate container anchored to bottom so they always fit */}
      <Container x={width / 2} y={continueY} eventMode="static" cursor="pointer" pointerdown={handleContinue} pointerover={() => setHoverContinue(true)} pointerout={() => setHoverContinue(false)}>
        <Text
          text="CONTINUE"
          anchor={0.5}
          style={buttonStyle}
          scale={{ x: hoverContinue ? 1.1 : 1, y: hoverContinue ? 1.1 : 1 }}
        />
      </Container>

      {onBack && (
        <Container
          x={width / 2}
          y={backY}
          eventMode="static"
          cursor="pointer"
          pointerdown={() => {
            const clickSfx = sound.find("button-click");
            if (clickSfx) clickSfx.play({ volume: 0.4 });
            onBack();
          }}
        >
          <Text text="BACK" anchor={0.5} style={buttonStyle} />
        </Container>
      )}
    </>
  );
};

const PlayerSelectScreen = ({ onContinue, onBack }: PlayerSelectScreenProps) => {
  const { width, height } = useDimensions();
  return (
    <Stage width={width} height={height}>
      <PlayerSelectContent
        width={width}
        height={height}
        onContinue={onContinue}
        onBack={onBack}
      />
    </Stage>
  );
};

export default PlayerSelectScreen;

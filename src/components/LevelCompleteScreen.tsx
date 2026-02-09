import { Container, Stage, Text } from "@pixi/react";
import { useState, useMemo } from "react";
import useDimensions from "../hooks/useDimensions";
import StartScreenBackground from "./StartScreenBackground";
import { TextStyle } from "pixi.js";
import { sound } from "@pixi/sound";
import { gameState } from "../utils/GameState";

interface LevelCompleteScreenProps {
  onNextLevel: () => void;
  onReplay: () => void;
  onExit: () => void;
}

const LevelCompleteScreen = ({ onNextLevel, onReplay, onExit }: LevelCompleteScreenProps) => {
  const { width, height } = useDimensions();
  const [hoverButton, setHoverButton] = useState<"next" | "replay" | "exit" | null>(null);

  const state = gameState.getState();

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

  const statsStyle = useMemo(
    () =>
      new TextStyle({
        fontFamily: "Neopixel",
        fontSize: 14,
        fill: "#ffffff",
        stroke: "#000000",
        strokeThickness: 2,
      }),
    []
  );

  const buttonStyle = useMemo(
    () =>
      new TextStyle({
        fontFamily: "Neopixel",
        fontSize: 14,
        fontWeight: "bold",
        fill: "#ffffff",
        stroke: "#000000",
        strokeThickness: 4,
        dropShadow: true,
        dropShadowColor: "#000000",
        dropShadowBlur: 4,
        dropShadowAngle: Math.PI / 6,
        dropShadowDistance: 3,
      }),
    []
  );

  const playClick = () => {
    const clickSfx = sound.find("button-click");
    if (clickSfx) clickSfx.play({ volume: 0.4 });
  };

  return (
    <Stage width={width} height={height}>
      {/* Background */}
      <StartScreenBackground width={width} height={height} />

      {/* Title */}
      <Container x={width / 2} y={height / 4}>
        <Text
          text="LEVEL CLEARED!"
          anchor={0.5}
          style={titleStyle}
        />
      </Container>

      {/* Stats */}
      <Container x={width / 2} y={height / 2 - 30}>
        <Text
          text={`TOTAL SCORE: ${state.score}`}
          anchor={0.5}
          style={statsStyle}
        />
      </Container>

      <Container x={width / 2} y={height / 2}>
        <Text
          text={`LEVEL SCORE: ${state.score - state.waveStartScore}`}
          anchor={0.5}
          style={statsStyle}
        />
      </Container>

      <Container x={width / 2} y={height / 2 + 35}>
        <Text
          text={`WAVE: ${state.wave}`}
          anchor={0.5}
          style={statsStyle}
        />
      </Container>

      {/* Next Level Button */}
      <Container
        x={width / 2}
        y={height / 2 + 80}
        eventMode="static"
        cursor="pointer"
        pointerdown={() => {
          playClick();
          onNextLevel();
        }}
        pointerover={() => setHoverButton("next")}
        pointerout={() => setHoverButton((prev) => (prev === "next" ? null : prev))}
      >
        <Text
          text="NEXT LEVEL"
          anchor={0.5}
          style={buttonStyle}
          scale={{
            x: hoverButton === "next" ? 1.1 : 1,
            y: hoverButton === "next" ? 1.1 : 1,
          }}
        />
      </Container>

      {/* Replay Button */}
      <Container
        x={width / 2}
        y={height / 2 + 130}
        eventMode="static"
        cursor="pointer"
        pointerdown={() => {
          playClick();
          onReplay();
        }}
        pointerover={() => setHoverButton("replay")}
        pointerout={() => setHoverButton((prev) => (prev === "replay" ? null : prev))}
      >
        <Text
          text="REPLAY LEVEL"
          anchor={0.5}
          style={buttonStyle}
          scale={{
            x: hoverButton === "replay" ? 1.1 : 1,
            y: hoverButton === "replay" ? 1.1 : 1,
          }}
        />
      </Container>

      {/* Exit Button */}
      <Container
        x={width / 2}
        y={height / 2 + 180}
        eventMode="static"
        cursor="pointer"
        pointerdown={() => {
          playClick();
          onExit();
        }}
        pointerover={() => setHoverButton("exit")}
        pointerout={() => setHoverButton((prev) => (prev === "exit" ? null : prev))}
      >
        <Text
          text="EXIT GAME"
          anchor={0.5}
          style={buttonStyle}
          scale={{
            x: hoverButton === "exit" ? 1.1 : 1,
            y: hoverButton === "exit" ? 1.1 : 1,
          }}
        />
      </Container>
    </Stage>
  );
};

export default LevelCompleteScreen;


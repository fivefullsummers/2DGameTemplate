import { Container, Stage, Text } from "@pixi/react";
import { useState, useMemo, useEffect } from "react";
import useDimensions from "../hooks/useDimensions";
import ShaderBackground from "./ShaderBackground";
import CRTOverlay from "./CRTOverlay";
import { TextStyle } from "pixi.js";
import { sound } from "@pixi/sound";
import { gameState } from "../utils/GameState";
import { useVisualSettings } from "../contexts/VisualSettingsContext";

interface GameOverScreenProps {
  onPlayAgain: () => void;
  onMainMenu: () => void;
}

const GameOverScreen = ({ onPlayAgain, onMainMenu }: GameOverScreenProps) => {
  const { width, height } = useDimensions();
  const { retroScanlinesEnabled, crtSettings } = useVisualSettings();
  const [isHoveringPlayAgain, setIsHoveringPlayAgain] = useState(false);
  const [isHoveringMainMenu, setIsHoveringMainMenu] = useState(false);
  const [flashOpacity, setFlashOpacity] = useState(1);

  // Get final game stats
  const finalState = gameState.getState();
  const isNewHighScore = finalState.score === finalState.highScore && finalState.score > 0;

  // Flashing "GAME OVER" effect
  useMemo(() => {
    let animationFrame: number;
    let time = 0;

    const animate = () => {
      time += 0.05;
      setFlashOpacity(0.5 + Math.sin(time) * 0.5); // Flash between 0 and 1
      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  const gameOverStyle = useMemo(
    () =>
      new TextStyle({
        fontFamily: "Neopixel",
        fontSize: 20,
        fontWeight: "bold",
        fill: ["#ff0000", "#ff6666"], // red gradient
        stroke: "#000000",
        strokeThickness: 6
      }),
    []
  );

  const highScoreStyle = useMemo(
    () =>
      new TextStyle({
        fontFamily: "Neopixel",
        fontSize: 16,
        fontWeight: "bold",
        fill: ["#ffff00", "#ffaa00"], // gold gradient
        stroke: "#000000",
        strokeThickness: 5
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
    () => (isHovering: boolean) =>
      new TextStyle({
        fontFamily: "Neopixel",
        fontSize: 14,
        fontWeight: "bold",
        fill: isHovering ? "#00ff88" : "#ffffff",
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

  // Play game over sound on mount
  useEffect(() => {
    const gameOverSfx = sound.find("explosion-sound");
    if (gameOverSfx) {
      gameOverSfx.play({ volume: 0.05 });
    }
  }, []);

  return (
    <Stage width={width} height={height}>
      {/* Shader Background */}
      <ShaderBackground width={width} height={height} />

      {/* GAME OVER Title (flashing) */}
      <Container x={width / 2} y={height / 5}>
        <Text
          text="GAME OVER"
          anchor={0.5}
          style={gameOverStyle}
          alpha={flashOpacity}
        />
      </Container>

      {/* New High Score message (if applicable) */}
      {isNewHighScore && (
        <Container x={width / 2} y={height / 5 + 20}>
          <Text
            text="NEW HIGH SCORE!"
            anchor={0.5}
            style={highScoreStyle}
          />
        </Container>
      )}

      {/* Stats Display */}
      <Container x={width / 2} y={height / 2 - 40}>
        <Text
          text={`FINAL SCORE: ${finalState.score}`}
          anchor={0.5}
          style={statsStyle}
        />
      </Container>

      <Container x={width / 2} y={height / 2 - 20}>
        <Text
          text={`HIGH SCORE: ${finalState.highScore}`}
          anchor={0.5}
          style={statsStyle}
        />
      </Container>

      <Container x={width / 2} y={height / 2 + 5}>
        <Text
          text={`WAVE: ${finalState.wave}`}
          anchor={0.5}
          style={statsStyle}
        />
      </Container>

      {/* <Container x={width / 2} y={height / 2 + 60}>
        <Text
          text={`ACCURACY: ${gameState.getAccuracy()}%`}
          anchor={0.5}
          style={statsStyle}
        />
      </Container> */}

      {/* Play Again Button */}
      <Container
        x={width / 2}
        y={height / 2 + 140}
        eventMode="static"
        cursor="pointer"
        pointerdown={() => {
          const clickSfx = sound.find("button-click");
          if (clickSfx) clickSfx.play({ volume: 0.4 });
          onPlayAgain();
        }}
        pointerover={() => setIsHoveringPlayAgain(true)}
        pointerout={() => setIsHoveringPlayAgain(false)}
      >
        <Text
          text="PLAY AGAIN"
          anchor={0.5}
          style={buttonStyle(isHoveringPlayAgain)}
          scale={{ 
            x: isHoveringPlayAgain ? 1.1 : 1, 
            y: isHoveringPlayAgain ? 1.1 : 1 
          }}
        />
      </Container>

      {/* Main Menu Button */}
      <Container
        x={width / 2}
        y={height / 2 + 200}
        eventMode="static"
        cursor="pointer"
        pointerdown={() => {
          const clickSfx = sound.find("button-click");
          if (clickSfx) clickSfx.play({ volume: 0.4 });
          onMainMenu();
        }}
        pointerover={() => setIsHoveringMainMenu(true)}
        pointerout={() => setIsHoveringMainMenu(false)}
      >
        <Text
          text="MAIN MENU"
          anchor={0.5}
          style={buttonStyle(isHoveringMainMenu)}
          scale={{ 
            x: isHoveringMainMenu ? 1.1 : 1, 
            y: isHoveringMainMenu ? 1.1 : 1 
          }}
        />
      </Container>

      {retroScanlinesEnabled && (
        <CRTOverlay
          width={width}
          height={height}
          uScan={crtSettings.uScan}
          uWarp={crtSettings.uWarp}
        />
      )}
    </Stage>
  );
};

export default GameOverScreen;

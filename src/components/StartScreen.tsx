import { Container, Stage, Text } from "@pixi/react";
import { useState, useCallback, useMemo } from "react";
import useDimensions from "../hooks/useDimensions";
import StartScreenBackground from "./StartScreenBackground";
import CRTOverlay from "./CRTOverlay";
import { TextStyle } from "pixi.js";
import { sound } from "@pixi/sound";
import { useVisualSettings } from "../contexts/VisualSettingsContext";

interface StartScreenProps {
  onStartGame: () => void;
  onOpenOptions: () => void;
}

const StartScreen = ({ onStartGame, onOpenOptions }: StartScreenProps) => {
  const { width, height } = useDimensions();
  const { retroScanlinesEnabled, crtSettings } = useVisualSettings();
  const [isHovering, setIsHovering] = useState(false);
  const [isOptionsHovering, setIsOptionsHovering] = useState(false);
  const [titleScale, setTitleScale] = useState(1 / 2);

  // Animate title with a pulsing effect
  useMemo(() => {
    let animationFrame: number;
    let time = 0;

    const animate = () => {
      time += 0.02;
      setTitleScale(1 + Math.sin(time) * 0.05); // Pulse between 0.95 and 1.05
      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  const titleStyle = useMemo(
    () =>
      new TextStyle({
        fontFamily: "Neopixel",
        fontSize: 18,
        fontWeight: "bold",
        fill: ["#ffffff", "#00ff88"], // gradient
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
        fill: isHovering ? "#00ff88" : "#ffffff",
        stroke: "#000000",
        strokeThickness: 4,
        dropShadow: true,
        dropShadowColor: "#000000",
        dropShadowBlur: 4,
        dropShadowAngle: Math.PI / 6,
        dropShadowDistance: 3,
      }),
    [isHovering]
  );

  const optionsButtonStyle = useMemo(
    () =>
      new TextStyle({
        fontFamily: "Neopixel",
        fontSize: 12,
        fontWeight: "bold",
        fill: isOptionsHovering ? "#00ff88" : "#ffffff",
        stroke: "#000000",
        strokeThickness: 3,
        dropShadow: true,
        dropShadowColor: "#000000",
        dropShadowBlur: 3,
        dropShadowAngle: Math.PI / 6,
        dropShadowDistance: 2,
      }),
    [isOptionsHovering]
  );

  const handleButtonClick = useCallback(() => {
    const coinSfx = sound.find("coin");
    if (coinSfx) coinSfx.play({ volume: 0.4 });
    onStartGame();
  }, [onStartGame]);

  const handleOptionsClick = useCallback(() => {
    const clickSfx = sound.find("button-click");
    if (clickSfx) clickSfx.play({ volume: 0.4 });
    onOpenOptions();
  }, [onOpenOptions]);

  return (
    <Stage width={width} height={height}>
      {/* Shader Background Mesh */}
      <StartScreenBackground width={width} height={height} />

      {/* Title */}
      <Container x={width / 2} y={height / 3}>
        <Text
          text="Invaders"
          anchor={0.5}
          style={titleStyle}
          scale={{ x: titleScale, y: titleScale }}
        />
      </Container>

      {/* Start Button */}
      <Container
        x={width / 2}
        y={height / 2 + 50}
        eventMode="static"
        cursor="pointer"
        pointerdown={handleButtonClick}
        pointerover={() => setIsHovering(true)}
        pointerout={() => setIsHovering(false)}
      >
        <Text
          text="START GAME"
          anchor={0.5}
          style={buttonStyle}
          scale={{ x: isHovering ? 1.1 : 1, y: isHovering ? 1.1 : 1 }}
        />
      </Container>

      {/* Options Button */}
      <Container
        x={width / 2}
        y={height / 2 + 120}
        eventMode="static"
        cursor="pointer"
        pointerdown={handleOptionsClick}
        pointerover={() => setIsOptionsHovering(true)}
        pointerout={() => setIsOptionsHovering(false)}
      >
        <Text
          text="OPTIONS"
          anchor={0.5}
          style={optionsButtonStyle}
          scale={{ x: isOptionsHovering ? 1.1 : 1, y: isOptionsHovering ? 1.1 : 1 }}
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

export default StartScreen;

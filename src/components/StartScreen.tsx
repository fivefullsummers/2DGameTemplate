import { Container, Stage, Sprite, Text } from "@pixi/react";
import { useState, useCallback, useMemo } from "react";
import useDimensions from "../hooks/useDimensions";
import ShaderBackground from "./ShaderBackground";
import { TextStyle } from "pixi.js";

interface StartScreenProps {
  onStartGame: () => void;
}

const StartScreen = ({ onStartGame }: StartScreenProps) => {
  const { width, height } = useDimensions();
  const [isHovering, setIsHovering] = useState(false);
  const [titleScale, setTitleScale] = useState(1);

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
        fontFamily: "Arial Black, Arial",
        fontSize: 72,
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
        fontFamily: "Arial Black, Arial",
        fontSize: 36,
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

  const handleButtonClick = useCallback(() => {
    onStartGame();
  }, [onStartGame]);

  return (
    <Stage width={width} height={height}>
      {/* Shader Background */}
      <ShaderBackground width={width} height={height} />

      {/* Title */}
      <Container x={width / 2} y={height / 3}>
        <Text
          text="2D GAME"
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

      {/* Instructions or subtitle (optional) */}
      <Container x={width / 2} y={height - 80}>
        <Text
          text="Click to Start"
          anchor={0.5}
          style={
            new TextStyle({
              fontFamily: "Arial",
              fontSize: 18,
              fill: "#cccccc",
              alpha: 0.7 + Math.sin(Date.now() * 0.003) * 0.3, // Blinking effect
            })
          }
        />
      </Container>
    </Stage>
  );
};

export default StartScreen;


import { Sprite, useTick } from "@pixi/react";
import heroAsset from "../assets/hero.png";
import { useState } from "react";
import { useControls } from "../hooks/useControls";

const HeroFree = () => {
  const { getControlsDirection } = useControls();
  const [position, setPosition] = useState({x: 0, y: 0});

  useTick(() => {
    const {pressedKeys} = getControlsDirection();
    setPosition((prev) => {
      const {x,y} = prev;
      let dx = 0;
      let dy = 0;

      if (pressedKeys.includes('UP')) dy -= 1;
      if (pressedKeys.includes('DOWN')) dy += 1;
      if (pressedKeys.includes('LEFT')) dx -= 1;
      if (pressedKeys.includes('RIGHT')) dx += 1;
      // console.log(pressedKeys);

      const magnitude = Math.sqrt(dx*dy + dy*dy);

      // normalize
      if (magnitude > 0) {
        dx = dx / magnitude;
        dy = dy / magnitude;
      }
      return {x: x + dx, y: y + dy}
    })
  })

  return (
    <Sprite
      image={heroAsset}
      x={position.x}
      y={position.y}
      scale={0.5}
    />
  );
};

export default HeroFree;

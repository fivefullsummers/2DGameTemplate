
import { Sprite, useTick } from "@pixi/react";
import heroAsset from "../assets/hero.png";
import { useState } from "react";
import { useControls } from "../hooks/useControls";
import { SPEED, TILE_SIZE } from "../consts/game-world";

const HeroGrid = () => {
  const { getControlsDirection } = useControls();
  const [position, setPosition] = useState({x: 0, y: 0});
  const [target, setTarget] = useState({x: 0, y: 0});
  const [isMoving, setIsMoving] = useState(false);

  useTick(() => {
    if (isMoving) {
      setPosition((prev) => {
        const {x, y} = prev;
        let dx = target.x - x;
        let dy = target.y - y;

        const distance = Math.sqrt(dx*dx + dy*dy);
        //snap
        if (distance <= SPEED) {
          setIsMoving(false);
          return { x: target.x, y: target.y};
        }

        dx = (dx / distance) * SPEED;
        dy = (dy/ distance) * SPEED;

        return { x: x + dx, y: y + dy};
      })
    } else {
      const {pressedKeys} = getControlsDirection();
      let dx = 0;
      let dy = 0;

      // Check for vertical movement
      if (pressedKeys.includes('UP')) dy -= TILE_SIZE;
      if (pressedKeys.includes('DOWN')) dy += TILE_SIZE;
      
      // Check for horizontal movement
      if (pressedKeys.includes('LEFT')) dx -= TILE_SIZE;
      if (pressedKeys.includes('RIGHT')) dx += TILE_SIZE;

      // If any movement detected, set target (supports diagonal: both dx and dy non-zero)
      if (dx !== 0 || dy !== 0) {
        setTarget((prev) => ({ x: prev.x + dx, y: prev.y + dy}));
        setIsMoving(true);
      }
    }
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

export default HeroGrid;


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
      const {currentKey} = getControlsDirection();
      let dx = 0;
      let dy = 0;

      if (currentKey === 'UP') dy -= TILE_SIZE;
      if (currentKey === 'DOWN') dy += TILE_SIZE;
      if (currentKey === 'LEFT') dx -= TILE_SIZE;
      if (currentKey === 'RIGHT') dx += TILE_SIZE;
      // console.log(pressedKeys);

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

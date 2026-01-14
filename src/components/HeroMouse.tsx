
import { Sprite, useTick, } from "@pixi/react";
import heroAsset from "../assets/hero.png";
import { MutableRefObject, useState } from "react";
import { IPosition } from "../types/common";
import { useControls } from "../hooks/useControls";
import { SPEED } from "../consts/game-world";

interface IHeroProps {
  onClickMove: MutableRefObject<((target: IPosition)=>void) | null>
}


const HeroMouse = ({ onClickMove } : IHeroProps) => {
  const { getControlsDirection } = useControls();
  const [position, setPosition] = useState({x: 0, y: 0});
  const [target, setTarget] = useState({x: 0, y: 0});
  const [isClickMoving, setIsClickMoving] = useState(false);

  useTick(() => {
    const {pressedKeys} = getControlsDirection()
    let dx = 0, dy = 0;

    if (pressedKeys.includes('UP')) dy -= 1;
    if (pressedKeys.includes('DOWN')) dy += 1;
    if (pressedKeys.includes('LEFT')) dx -= 1;
    if (pressedKeys.includes('RIGHT')) dx += 1;

    const isKeyMoving = dx != 0 || dy != 0;

    setPosition((prev) => {
      const {x, y} = prev
      if (isKeyMoving) {
        const magnitude = Math.sqrt(dx*dx + dy*dy);
        dx = (dx / magnitude) * SPEED;
        dy = (dy / magnitude) * SPEED;
        setIsClickMoving(false);
        return {x: x + dx, y: y + dy }
      }

      if (isClickMoving && target) {
        let tx = target.x - x;
        let ty = target.y - y;
        const distance = Math.sqrt(tx * tx + ty * ty);
        if (distance <= SPEED) {
          setIsClickMoving(false);
          return target;
        }

        tx = (tx / distance) * SPEED;
        ty = (ty / distance) * SPEED;
        return {x: x + tx, y: y + ty };
      }

      return prev
    })

  })

  const handleMoveTo = (newTarget: IPosition) => {
    setTarget(newTarget);
    setIsClickMoving(true);
  }

  onClickMove.current = handleMoveTo

  return (
    <Sprite
      image={heroAsset}
      x={position.x}
      y={position.y}
      scale={0.5}
    />
  );
};

export default HeroMouse;

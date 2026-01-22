import { Sprite, useTick } from "@pixi/react";
import { useState, useMemo, useEffect, useRef } from "react";
import enemyRed1 from "../assets/enemies/enemyRed1.png";
import enemyRed2 from "../assets/enemies/enemyRed2.png";
import enemyRed3 from "../assets/enemies/enemyRed3.png";
import enemyRed4 from "../assets/enemies/enemyRed4.png";
import enemyRed5 from "../assets/enemies/enemyRed5.png";
import { ENEMY_SCALE } from "../consts/enemy-config";
import { TILE_SIZE, COLS } from "../consts/game-world";
import { IPosition } from "../types/common";

interface EnemySpaceInvadersProps {
  id: string;
  x: number;
  y: number;
  spriteIndex: number; // 1-5 for enemyRed1.png through enemyRed5.png
  positionRef?: React.MutableRefObject<IPosition>;
}

enum MovementPhase {
  DOWN,
  LEFT,
  CENTER,
  RIGHT,
  DONE
}

const EnemySpaceInvaders = ({ id, x, y, spriteIndex, positionRef }: EnemySpaceInvadersProps) => {
  const [position, setPosition] = useState({ x, y });
  const [phase, setPhase] = useState<MovementPhase>(MovementPhase.DOWN);
  
  // Keep position ref in sync with position state for collision detection
  useEffect(() => {
    if (positionRef) {
      positionRef.current = position;
    }
  }, [position, positionRef]);
  
  // Store starting position for reference
  const startX = useMemo(() => x, []);
  const startY = useMemo(() => y, []);
  
  // Calculate target positions
  const centerX = useMemo(() => ((COLS - 2) * TILE_SIZE) / 2, []);
  const leftTargetX = useMemo(() => startX - (TILE_SIZE * 2), [startX]);
  const rightTargetX = useMemo(() => centerX + (TILE_SIZE * 2), [centerX]);
  const downTargetY = useMemo(() => startY + (TILE_SIZE * 3), [startY]); // Move down 3 tiles

  // Movement speed (Space Invaders style - slow but steady)
  const moveSpeed = 1.5; // pixels per frame

  // Cleanup resources when enemy is destroyed
  useEffect(() => {
    return () => {
      // Resources are automatically cleaned up by React/PIXI when component unmounts
    };
  }, []);

  // Get the appropriate sprite asset based on index
  const getSpriteAsset = () => {
    switch (spriteIndex) {
      case 1:
        return enemyRed1;
      case 2:
        return enemyRed2;
      case 3:
        return enemyRed3;
      case 4:
        return enemyRed4;
      case 5:
        return enemyRed5;
      default:
        return enemyRed1;
    }
  };

  // Update movement each frame
  useTick((delta) => {
    setPosition((prev) => {
      let newX = prev.x;
      let newY = prev.y;
      
      switch (phase) {
        case MovementPhase.DOWN:
          // Move down until reaching target
          newY += moveSpeed * delta;
          if (newY >= downTargetY) {
            newY = downTargetY;
            setPhase(MovementPhase.LEFT);
          }
          break;
          
        case MovementPhase.LEFT:
          // Move left 2 tiles
          newX -= moveSpeed * delta;
          if (newX <= leftTargetX) {
            newX = leftTargetX;
            setPhase(MovementPhase.CENTER);
          }
          break;
          
        case MovementPhase.CENTER:
          // Move to center
          if (newX < centerX) {
            newX += moveSpeed * delta;
            if (newX >= centerX) {
              newX = centerX;
              setPhase(MovementPhase.RIGHT);
            }
          } else if (newX > centerX) {
            newX -= moveSpeed * delta;
            if (newX <= centerX) {
              newX = centerX;
              setPhase(MovementPhase.RIGHT);
            }
          } else {
            setPhase(MovementPhase.RIGHT);
          }
          break;
          
        case MovementPhase.RIGHT:
          // Move right 2 tiles from center
          newX += moveSpeed * delta;
          if (newX >= rightTargetX) {
            newX = rightTargetX;
            setPhase(MovementPhase.DONE);
          }
          break;
          
        case MovementPhase.DONE:
          // Stay in place
          break;
      }
      
      return { x: newX, y: newY };
    });
  });

  return (
    <Sprite
      image={getSpriteAsset()}
      x={position.x}
      y={position.y}
      scale={ENEMY_SCALE}
      anchor={0.5}
    />
  );
};

export default EnemySpaceInvaders;

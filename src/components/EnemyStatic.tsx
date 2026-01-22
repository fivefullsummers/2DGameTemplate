import { Sprite } from "@pixi/react";
import { useEffect } from "react";
import enemyRed1 from "../assets/enemies/enemyRed1.png";
import enemyRed2 from "../assets/enemies/enemyRed2.png";
import enemyRed3 from "../assets/enemies/enemyRed3.png";
import enemyRed4 from "../assets/enemies/enemyRed4.png";
import enemyRed5 from "../assets/enemies/enemyRed5.png";
import { ENEMY_SCALE } from "../consts/enemy-config";

interface EnemyStaticProps {
  id: string;
  x: number;
  y: number;
  spriteIndex: number; // 1-5 for enemyRed1.png through enemyRed5.png
}

const EnemyStatic = ({ id, x, y, spriteIndex }: EnemyStaticProps) => {
  // Cleanup resources when enemy is destroyed
  useEffect(() => {
    return () => {
      // Resources are automatically cleaned up by React/PIXI when component unmounts
      // This is where you could add additional cleanup if needed
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

  return (
    <Sprite
      image={getSpriteAsset()}
      x={x}
      y={y}
      scale={ENEMY_SCALE}
      anchor={0.5}
    />
  );
};

export default EnemyStatic;

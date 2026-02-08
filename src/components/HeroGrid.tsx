
import { Sprite, useTick } from "@pixi/react";
import playerShipAsset from "../assets/hero/playerShip2_blue.png";
import { useState, useRef } from "react";
import { useControls } from "../hooks/useControls";
import { SPEED, TILE_SIZE, COLS, ROWS } from "../consts/game-world";
import { BulletManagerRef } from "./BulletManager";
import { GUN_TYPES, DEFAULT_GUN_TYPE } from "../consts/bullet-config";
import { sound } from "@pixi/sound";

interface HeroGridProps {
  bulletManagerRef?: React.MutableRefObject<BulletManagerRef | null>;
  gunType?: string;
}

const HeroGrid = ({ bulletManagerRef, gunType = DEFAULT_GUN_TYPE }: HeroGridProps) => {
  const { getControlsDirection, consumeShootPress, isShootHeld } = useControls();
  const lastShotTime = useRef(0);
  
  // Calculate bottom center position (Space Invaders style)
  // Map is (COLS - 2) tiles wide and (ROWS - 2) tiles tall (accounting for padding)
  // Position hero at bottom center, with 1 tile offset from bottom
  const startX = ((COLS - 2) * TILE_SIZE) / 2; // Center horizontally
  const startY = ((ROWS - 2) * TILE_SIZE) - TILE_SIZE * 1.5; // Near bottom (1.5 tiles from bottom)
  
  const [position, setPosition] = useState({x: startX, y: startY});
  const [target, setTarget] = useState({x: startX, y: startY});
  const [isMoving, setIsMoving] = useState(false);

  // Get current gun configuration
  const currentGun = GUN_TYPES[gunType] || GUN_TYPES[DEFAULT_GUN_TYPE];

  useTick(() => {
    // Handle shooting
    const canShoot = bulletManagerRef?.current;
    const shootKeyPressed = consumeShootPress();
    const shootKeyHeld = isShootHeld();
    
    // Check fire rate cooldown
    const now = Date.now();
    const canFireAgain = now - lastShotTime.current >= currentGun.fireRate;
    
    // Trigger shooting if conditions are met (always shoot UP)
    if (canShoot && canFireAgain) {
      // Single shot or automatic
      const shouldShoot = shootKeyPressed || (currentGun.automatic && shootKeyHeld);
      
      if (shouldShoot) {
        lastShotTime.current = now;
        
        // Play shooting sound
        const poundSfx = sound.find("pound-sound");
        if (poundSfx) {
          poundSfx.play({ volume: 0.05 });
        }
        
        // Spawn bullet at hero position, always shooting UP
        const bulletOffsetX = position.x;
        const bulletOffsetY = position.y;
        
        bulletManagerRef.current.spawnBullet(
          bulletOffsetX,
          bulletOffsetY,
          "UP", // Always shoot up
          currentGun.bulletType
        );
      }
    }

    // Handle movement
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
      image={playerShipAsset}
      x={position.x}
      y={position.y}
      scale={0.5}
      anchor={0.5}
    />
  );
};

export default HeroGrid;

import { Container, Stage } from "@pixi/react";
import { TILE_SIZE, ENEMY_COLLISION_MULTIPLIER, GAME_WIDTH, isMobile } from "../consts/game-world";
import useDimensions from "../hooks/useDimensions";

// import HeroMouse from "./HeroMouse";
import PlayerAnimated, { PlayerRef } from "./PlayerAnimated";
import EnemyFormation from "./EnemyFormation";
import CollisionDebug from "./CollisionDebug";
import EntityCollisionDebug from "./EntityCollisionDebug";
import CollisionInfo from "./CollisionInfo";
import BulletManager, { BulletManagerRef } from "./BulletManager";
import HUD from "./HUD";
import { PointerEvent, useRef, useEffect, useMemo, useState, useCallback } from "react";
import { IPosition } from "../types/common";
import { ControlsProvider } from "../contexts/ControlsContext";
import { useControlsContext } from "../contexts/ControlsContext";
import { sound } from "@pixi/sound";
import { getEnemyPositions } from "../consts/enemies-map";
import { gameState } from "../utils/GameState";
import { ENEMY_SCALE, PLAYER_SCALE, PLAYER_START_Y } from "../consts/tuning-config";
import PlaneBackground from "./PlaneBackground";
import MobileControlsBar from "./MobileControlsBar";

interface ExperienceContentProps {
  onGameOver: () => void;
}

const ExperienceContent = ({ onGameOver }: ExperienceContentProps) => {
  const { width, height, scale } = useDimensions();
  const onClickMove = useRef<(target: IPosition)=>void>(null);
  const bulletManagerRef = useRef<BulletManagerRef>(null);
  const playerPositionRef = useRef<IPosition>({ x: 0, y: 0 });
  const playerRef = useRef<PlayerRef | null>(null);
  const {
    getControlsDirection,
    consumeShootPress,
    isShootHeld,
    notifyShotFired,
  } = useControlsContext();

  // Collision debug visibility (default ON so it's visible on mobile too)
  const [showCollisionDebug, setShowCollisionDebug] = useState(false);

  // Play level music on mount
  useEffect(() => {
    const levelMusic = sound.find("level1-music");
    if (levelMusic) {
      levelMusic.play({ loop: true, volume: 0.3 });
    }

    // Stop music when component unmounts
    return () => {
      if (levelMusic) {
        levelMusic.stop();
      }
    };
  }, []);

  const handleStageClick = (event: PointerEvent) => {
    onClickMove.current?.({
      x: event.nativeEvent.offsetX / scale - TILE_SIZE / 2,
      y: event.nativeEvent.offsetY / scale - TILE_SIZE / 2,
    });
  };

  // Enemy tracking with unique IDs and position refs
  interface EnemyData {
    id: string;
    x: number;
    y: number;
    spriteIndex: number;
    positionRef: React.MutableRefObject<IPosition>;
    isExploding?: boolean;
  }

  // Initialize enemies from map with position refs
  const initialEnemies = useMemo(() => {
    const positions = getEnemyPositions();
    return positions.map((pos, index) => ({
      id: `enemy-${Date.now()}-${index}-${Math.random()}`,
      x: pos.x,
      y: pos.y,
      spriteIndex: (index % 5) + 1,
      positionRef: { current: { x: pos.x, y: pos.y } },
      isExploding: false,
    }));
  }, []);

  const [enemies, setEnemies] = useState<EnemyData[]>(initialEnemies);

  // Initialize game state on mount
  useEffect(() => {
    gameState.initGame(initialEnemies.length);
  }, [initialEnemies.length]);

  // Check for game over state
  useEffect(() => {
    const unsubscribe = gameState.subscribe((state) => {
      if (state.lives <= 0) {
        // Stop level music
        const levelMusic = sound.find("level1-music");
        if (levelMusic) {
          levelMusic.stop();
        }

        // Delay to show the game over state briefly before transitioning
        const timeout = setTimeout(() => {
          onGameOver();
        }, 1000); // 1 second delay to see the final hit

        return () => clearTimeout(timeout);
      }
    });

    return unsubscribe;
  }, [onGameOver]);

  // Toggle collision debug with 'C' key
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'c' || event.key === 'C') {
        setShowCollisionDebug((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Track enemies removed for score updates
  const enemiesRemovedRef = useRef<string[]>([]);

  // Remove enemy when hit
  const removeEnemy = useCallback((enemyId: string) => {
    // Queue this enemy for score update
    enemiesRemovedRef.current.push(enemyId);
    
    // Update state
    setEnemies((prev) => prev.filter((enemy) => enemy.id !== enemyId));
  }, []);

  // Trigger enemy explosion animation (actual removal happens after animation completes)
  const triggerEnemyExplosion = useCallback((enemyId: string) => {
    // Play explosion sound
    const explosionSfx = sound.find("explosion-sound");
    if (explosionSfx) {
      explosionSfx.play({ volume: 0.5 });
    }

    setEnemies((prev) =>
      prev.map((enemy) => {
        if (enemy.id !== enemyId) return enemy;
        if (enemy.isExploding) return enemy;
        return { ...enemy, isExploding: true };
      })
    );
  }, []);

  // Update scores after enemies are removed (outside of render)
  useEffect(() => {
    if (enemiesRemovedRef.current.length > 0) {
      enemiesRemovedRef.current.forEach((enemyId) => {
        // Find the index from the current enemies list
        const enemyIndex = initialEnemies.findIndex((enemy) => enemy.id === enemyId);
        if (enemyIndex !== -1) {
          // Calculate row index from initial position (for score calculation)
          const rowIndex = Math.floor(enemyIndex / 11); // 11 columns per row
          gameState.addEnemyKillScore(rowIndex);
        }
      });
      // Clear the queue
      enemiesRemovedRef.current = [];
    }
  }, [enemies, initialEnemies]);

  // Vertical offset for rendering the entire game world (PIXI Container).
  // This does NOT change collision/world coordinates; it only shifts where
  // the world appears on screen.
  const [verticalOffset, setVerticalOffset] = useState(0);

  // Compute a vertical offset so that the player's ship sits within
  // ~50px of the top of the mobile controls bar.
  useEffect(() => {
    if (!isMobile()) {
      setVerticalOffset(0);
      return;
    }

    const TARGET_GAP = 50; // px between player bottom and controls top

    const recomputeOffset = () => {
      if (typeof window === "undefined") return;

      const controlsBar = document.getElementById("mobile-controls-bar");
      if (!controlsBar) return;

      const rect = controlsBar.getBoundingClientRect();
      const controlsTop = rect.top;

      // Player center Y in world space and approximate half-height of
      // the sprite in screen pixels.
      const playerCenterWorldY = PLAYER_START_Y;
      const playerHalfHeightScreen = (TILE_SIZE * PLAYER_SCALE * scale) / 2;
      const playerCenterScreenNoOffset = playerCenterWorldY * scale;
      const playerBottomScreenNoOffset =
        playerCenterScreenNoOffset + playerHalfHeightScreen;

      // Solve for verticalOffset so that:
      //   controlsTop - (playerBottomScreenNoOffset + verticalOffset) = TARGET_GAP
      const newOffset = controlsTop - TARGET_GAP - playerBottomScreenNoOffset;

      setVerticalOffset(newOffset);

      // eslint-disable-next-line no-console
      console.log("[layout] verticalOffset computed", {
        controlsTop,
        playerCenterWorldY,
        playerBottomScreenNoOffset,
        TARGET_GAP,
        verticalOffset: newOffset,
      });
    };

    // Run once after mount/layout
    recomputeOffset();

    window.addEventListener("resize", recomputeOffset);
    return () => window.removeEventListener("resize", recomputeOffset);
  }, [scale]);

  // Handle player being hit by enemy bullet
  const handlePlayerHit = useCallback(() => {
    // Lose a life
    gameState.loseLife();
    // Trigger player death animation
    if (playerRef.current) {
      playerRef.current.triggerDeath();
    }
  }, []);

  // Pass enemy positions to BulletManager (refs are updated by enemies themselves)
  const enemyPositionsRef = useRef<Map<string, IPosition>>(new Map());
  
  useEffect(() => {
    // Create map of enemy ID to position ref
    const positionsMap = new Map<string, IPosition>();
    enemies
      .filter((enemy) => !enemy.isExploding)
      .forEach((enemy) => {
        positionsMap.set(enemy.id, enemy.positionRef.current);
      });
    enemyPositionsRef.current = positionsMap;
  }, [enemies]);

  // Calculate collision radii for display
  const PLAYER_RADIUS = TILE_SIZE / 2;
  const ENEMY_RADIUS = (TILE_SIZE * ENEMY_SCALE * ENEMY_COLLISION_MULTIPLIER) / 2;

  // For desktop, horizontally center the scaled game world within the
  // full-screen Stage without changing any in-world coordinates.
  const worldWidth = GAME_WIDTH * scale;
  const horizontalOffset = isMobile() ? 0 : (width - worldWidth) / 2;

  // Reserve vertical space for the mobile controls bar at the bottom of
  // the screen so that the PIXI Stage does not cover the full viewport
  // height (which would push the controls off-screen).
  // On mobile we want roughly a 100px tall controls area.
  const mobileControlsHeight = isMobile() ? 100 : 0;
  const stageHeight = height - mobileControlsHeight;

  // Debug logging: enemy formation vs top and vs player on mobile.
  useEffect(() => {
    if (!isMobile()) return;
    if (enemies.length === 0) return;

    // Use the current enemy refs for most up-to-date world Y positions.
    const enemyWorldYs = enemies.map((enemy) => enemy.positionRef.current.y);
    const topEnemyWorldY = Math.min(...enemyWorldYs);

    const playerWorldY = playerPositionRef.current.y;

    const topEnemyScreenY = verticalOffset + topEnemyWorldY * scale;
    const playerScreenY = verticalOffset + playerWorldY * scale;

    const distanceEnemyToTopScreen = topEnemyScreenY; // from top of game area
    const distancePlayerToEnemyScreen = playerScreenY - topEnemyScreenY;

    // eslint-disable-next-line no-console
    console.log("[layout] Enemies", {
      topEnemyWorldY,
      playerWorldY,
      topEnemyScreenY,
      playerScreenY,
      distanceEnemyToTopScreen,
      distancePlayerToEnemyScreen,
      scale,
      verticalOffset,
    });
  }, [enemies, scale, verticalOffset]);

  return (
    <div
      data-vertical-offset={verticalOffset}
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'center',
        overflow: 'hidden',
      }}
    >
      <HUD showDebugInfo={false} />
      <CollisionInfo
        isVisible={showCollisionDebug}
        playerRadius={PLAYER_RADIUS}
        enemyRadius={ENEMY_RADIUS}
      />
      <Stage width={width} height={stageHeight} onPointerDown={handleStageClick}>
        {/* Full-screen plane mesh background */}
        <PlaneBackground width={width} height={height} />
        <Container scale={scale} x={horizontalOffset} y={verticalOffset}>
          <CollisionDebug isVisible={showCollisionDebug} />
          <BulletManager
            ref={bulletManagerRef}
            enemyPositionsRef={enemyPositionsRef}
            onEnemyHit={triggerEnemyExplosion}
            maxBullets={3}
          />
          {/* <HeroMouse onClickMove={onClickMove} /> */}
          <PlayerAnimated
            bulletManagerRef={bulletManagerRef}
            gunType="instantShot"
            getControlsDirection={getControlsDirection}
            consumeShootPress={consumeShootPress}
            isShootHeld={isShootHeld}
            positionRef={playerPositionRef}
            playerRef={playerRef}
            notifyShotFired={notifyShotFired}
          />
          {/* Enemies in Space Invaders formation (all move together) */}
          <EnemyFormation
            enemies={enemies}
            onEnemyRemove={removeEnemy}
            playerPositionRef={playerPositionRef}
            onPlayerHit={handlePlayerHit}
          />
          {/* Entity collision boundaries visualization */}
          <EntityCollisionDebug
            isVisible={showCollisionDebug}
            playerPositionRef={playerPositionRef}
            enemies={enemies}
          />
        </Container>
      </Stage>
      {/* Mobile-only movement and shoot controls in a separate bottom bar. */}
      <div
        style={{
          marginTop: 'auto',
          width: '100%',
          height: mobileControlsHeight,
        }}
      >
        <MobileControlsBar />
      </div>
    </div>
  );
};

interface ExperienceProps {
  onGameOver: () => void;
}

const Experience = ({ onGameOver }: ExperienceProps) => {
  return (
    <ControlsProvider>
      <ExperienceContent onGameOver={onGameOver} />
    </ControlsProvider>
  );
};

export default Experience;

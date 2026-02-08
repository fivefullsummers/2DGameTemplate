import { Container, Stage, useTick } from "@pixi/react";
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
import { DEFAULT_ENEMY_TYPE_ID } from "../consts/enemy-types";
import { BULLET_TYPES, SPREADER_SPREAD_RADIUS, SPREADER_WAVE_DELAY_MS } from "../consts/bullet-config";
import { ENEMY_SCALE, PLAYER_COLLISION_RADIUS, PLAYER_SCALE, PLAYER_START_Y } from "../consts/tuning-config";
import PlaneBackground from "./PlaneBackground";
import MobileControlsBar from "./MobileControlsBar";

const SHAKE_AMPLITUDE_PX = 3;
const SHAKE_SPREADER_AMPLITUDE_PX = 7;
const SHAKE_DURATION_MS = 100;

type ShakeParams = { start: number; duration: number; amplitude: number };

/** Runs inside Stage; drives screen-shake by updating the wrapper div each tick (no separate rAF). */
const ScreenShakeUpdater = ({
  wrapperRef,
  shakeParamsRef,
}: {
  wrapperRef: React.RefObject<HTMLDivElement | null>;
  shakeParamsRef: React.MutableRefObject<ShakeParams | null>;
}) => {
  useTick(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const params = shakeParamsRef.current;
    const now = performance.now();
    if (params && now < params.start + params.duration) {
      const t = now - params.start;
      const decay = 1 - t / params.duration;
      const amp = params.amplitude;
      const dx = (Math.random() * 2 - 1) * amp * decay;
      const dy = (Math.random() * 2 - 1) * amp * decay;
      wrapper.style.transform = `translate(${dx}px, ${dy}px)`;
    } else {
      wrapper.style.transform = "translate(0, 0)";
    }
  });
  return <Container />;
};

interface ExperienceContentProps {
  onGameOver: () => void;
  onLevelComplete: () => void;
}

const ExperienceContent = ({ onGameOver, onLevelComplete }: ExperienceContentProps) => {
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

  // Big Red Button (Executive Order) visibility
  const [bigRedButtonEnabled, setBigRedButtonEnabled] = useState(
    gameState.getBigRedButtonEnabled()
  );
  useEffect(() => {
    return gameState.subscribe((state) => {
      setBigRedButtonEnabled(state.bigRedButtonEnabled);
    });
  }, []);

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

  // Enemy tracking with unique IDs and position refs (gridRow/gridCol for spreader)
  interface EnemyData {
    id: string;
    x: number;
    y: number;
    spriteIndex: number;
    positionRef: React.MutableRefObject<IPosition>;
    isExploding?: boolean;
    gridRow: number;
    gridCol: number;
  }

  // Initialize enemies from map with position refs and grid positions
  const initialEnemies = useMemo(() => {
    const positions = getEnemyPositions();
    return positions.map((pos, index) => ({
      id: `enemy-${Date.now()}-${index}-${Math.random()}`,
      x: pos.x,
      y: pos.y,
      spriteIndex: (index % 5) + 1,
      positionRef: { current: { x: pos.x, y: pos.y } },
      isExploding: false,
      gridRow: pos.row,
      gridCol: pos.col,
    }));
  }, []);

  // Lookup enemy id -> row index for score (avoids findIndex per removal)
  const enemyIdToRowIndex = useMemo(() => {
    const map = new Map<string, number>();
    const colsPerRow = 9; // from enemies map layout
    initialEnemies.forEach((e, index) => map.set(e.id, Math.floor(index / colsPerRow)));
    return map;
  }, [initialEnemies]);

  const [enemies, setEnemies] = useState<EnemyData[]>(initialEnemies);
  const [hasWaveCompleted, setHasWaveCompleted] = useState(false);
  const [isPlayerExiting, setIsPlayerExiting] = useState(false);

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

  // Numpad 1–9, 0: switch bullet type mid-game (1 = first type, 2 = second, … 0 = 10th)
  // Use event.code (e.g. "Numpad1") not event.key (often "1") so numpad is detected reliably
  useEffect(() => {
    const bulletTypeKeys = Object.keys(BULLET_TYPES);
    const numpadCodeToIndex: Record<string, number> = {
      Numpad1: 0,
      Numpad2: 1,
      Numpad3: 2,
      Numpad4: 3,
      Numpad5: 4,
      Numpad6: 5,
      Numpad7: 6,
      Numpad8: 7,
      Numpad9: 8,
      Numpad0: 9,
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const index = numpadCodeToIndex[event.code];
      if (index === undefined) return;
      event.preventDefault();
      const key = bulletTypeKeys[index];
      if (key) gameState.setSelectedBulletType(key);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Track enemies removed for score updates
  const enemiesRemovedRef = useRef<string[]>([]);
  // Current enemies ref for spreader (read at hit time)
  const enemiesRef = useRef<EnemyData[]>([]);
  enemiesRef.current = enemies;
  // Spreader wave timeouts (clear on unmount)
  const spreaderTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Screen shake when shooting an enemy: useTick (same as game loop, no separate rAF)
  const stageWrapperRef = useRef<HTMLDivElement>(null);
  const shakeParamsRef = useRef<ShakeParams | null>(null);

  const triggerScreenShake = useCallback((amplitude = SHAKE_AMPLITUDE_PX) => {
    shakeParamsRef.current = {
      start: performance.now(),
      duration: SHAKE_DURATION_MS,
      amplitude,
    };
  }, []);

  // Remove enemy when hit
  const removeEnemy = useCallback((enemyId: string) => {
    // Queue this enemy for score update
    enemiesRemovedRef.current.push(enemyId);
    
    // Update state
    setEnemies((prev) => prev.filter((enemy) => enemy.id !== enemyId));
  }, []);

  // Trigger explosion for one enemy (single bullet hit)
  const triggerEnemyExplosion = useCallback((enemyId: string) => {
    const explosionSfx = sound.find("explosion-sound");
    if (explosionSfx) explosionSfx.play({ volume: 0.5 });
    triggerScreenShake();

    setEnemies((prev) =>
      prev.map((enemy) => {
        if (enemy.id !== enemyId) return enemy;
        if (enemy.isExploding) return enemy;
        return { ...enemy, isExploding: true };
      })
    );
  }, []);

  // Batch: mark multiple enemies exploding in one state update (spreader waves)
  const triggerEnemyExplosionBatch = useCallback((enemyIds: string[]) => {
    if (enemyIds.length === 0) return;
    const explosionSfx = sound.find("explosion-sound");
    if (explosionSfx) explosionSfx.play({ volume: 0.5 });
    triggerScreenShake(SHAKE_SPREADER_AMPLITUDE_PX);

    const idSet = new Set(enemyIds);
    setEnemies((prev) =>
      prev.map((enemy) => {
        if (!idSet.has(enemy.id) || enemy.isExploding) return enemy;
        return { ...enemy, isExploding: true };
      })
    );
  }, []);

  // Handle bullet hit: normal single kill or spreader wave (by radius)
  const handleEnemyHit = useCallback(
    (enemyId: string, bulletType: string) => {
      if (bulletType !== "spreader") {
        triggerEnemyExplosion(enemyId);
        return;
      }

      const currentEnemies = enemiesRef.current;
      const center = currentEnemies.find((e) => e.id === enemyId);
      if (!center) return;

      const row0 = center.gridRow;
      const col0 = center.gridCol;
      const byRadius = new Map<number, string[]>();
      for (const e of currentEnemies) {
        if (e.isExploding) continue;
        const r = Math.max(Math.abs(e.gridRow - row0), Math.abs(e.gridCol - col0));
        if (r > SPREADER_SPREAD_RADIUS) continue;
        if (!byRadius.has(r)) byRadius.set(r, []);
        byRadius.get(r)!.push(e.id);
      }

      // Wave 0 now, wave 1 after delay, wave 2 after 2*delay, ... (radii 0..SPREADER_SPREAD_RADIUS)
      for (let r = 0; r <= SPREADER_SPREAD_RADIUS; r++) {
        const ids = byRadius.get(r);
        if (!ids?.length) continue;
        const delay = r * SPREADER_WAVE_DELAY_MS;
        const run = () => triggerEnemyExplosionBatch(ids);
        if (delay === 0) run();
        else spreaderTimeoutsRef.current.push(setTimeout(run, delay));
      }
    },
    [triggerEnemyExplosion, triggerEnemyExplosionBatch]
  );

  // Big Red Button: kill all enemies in spreader-style waves (by Chebyshev radius from center)
  const handleBigRedButton = useCallback(() => {
    const currentEnemies = enemiesRef.current.filter((e) => !e.isExploding);
    if (currentEnemies.length === 0) return;

    const rows = currentEnemies.map((e) => e.gridRow);
    const cols = currentEnemies.map((e) => e.gridCol);
    const centerRow = (Math.min(...rows) + Math.max(...rows)) / 2;
    const centerCol = (Math.min(...cols) + Math.max(...cols)) / 2;

    const byRadius = new Map<number, string[]>();
    for (const e of currentEnemies) {
      const r = Math.max(
        Math.abs(e.gridRow - centerRow),
        Math.abs(e.gridCol - centerCol)
      );
      const radiusKey = Math.round(r);
      if (!byRadius.has(radiusKey)) byRadius.set(radiusKey, []);
      byRadius.get(radiusKey)!.push(e.id);
    }

    const maxR = Math.max(...byRadius.keys());
    for (let r = 0; r <= maxR; r++) {
      const ids = byRadius.get(r);
      if (!ids?.length) continue;
      const delay = r * SPREADER_WAVE_DELAY_MS;
      const run = () => triggerEnemyExplosionBatch(ids);
      if (delay === 0) run();
      else spreaderTimeoutsRef.current.push(setTimeout(run, delay));
    }
  }, [triggerEnemyExplosionBatch]);

  // Clear spreader timeouts on unmount
  useEffect(() => {
    return () => {
      spreaderTimeoutsRef.current.forEach(clearTimeout);
      spreaderTimeoutsRef.current = [];
    };
  }, []);

  // Update scores after enemies are removed (outside of render)
  useEffect(() => {
    if (enemiesRemovedRef.current.length > 0) {
      enemiesRemovedRef.current.forEach((enemyId) => {
        const rowIndex = enemyIdToRowIndex.get(enemyId);
        if (rowIndex !== undefined) gameState.addEnemyKillScore(rowIndex);
      });
      enemiesRemovedRef.current = [];
    }
  }, [enemies, enemyIdToRowIndex]);

  // Detect wave completion and start player exit animation
  useEffect(() => {
    if (!hasWaveCompleted && enemies.length === 0) {
      setHasWaveCompleted(true);
      setIsPlayerExiting(true);

      // Stop level music when wave is cleared
      const levelMusic = sound.find("level1-music");
      if (levelMusic) {
        levelMusic.stop();
      }
    }
  }, [enemies.length, hasWaveCompleted]);

  const handlePlayerExitComplete = useCallback(() => {
    setIsPlayerExiting(false);
    onLevelComplete();
  }, [onLevelComplete]);

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

    const TARGET_GAP = 100; // px between player bottom and controls top

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
    };

    // Run once after mount/layout
    recomputeOffset();

    window.addEventListener("resize", recomputeOffset);
    return () => window.removeEventListener("resize", recomputeOffset);
  }, [scale]);

  // Handle player being hit by enemy bullet
  const handlePlayerHit = useCallback(() => {
    // King's Mode (Executive Order): god mode — no damage
    if (gameState.getKingsMode()) return;
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

  return (
    <div
      data-vertical-offset={verticalOffset}
      style={{
        position: 'relative',
        width: '100vw',
        // Use the measured window.innerHeight from useDimensions()
        // instead of CSS 100vh to avoid iOS Safari's "tall" viewport
        // bug that leaves extra space between the game and controls.
        height: `${height}px`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'center',
        overflow: 'hidden',
        // Match the dark blue game background so any residual gaps
        // (e.g., due to browser UI chrome) blend seamlessly.
        backgroundColor: '#050b30',
      }}
    >
      <HUD showDebugInfo={false} />
      <CollisionInfo
        isVisible={showCollisionDebug}
        playerRadius={PLAYER_COLLISION_RADIUS}
        enemyRadius={ENEMY_RADIUS}
      />
      <div
        ref={stageWrapperRef}
        style={{ width, height: stageHeight, overflow: 'hidden' }}
      >
      <Stage width={width} height={stageHeight} onPointerDown={handleStageClick}>
        {/* Full-screen plane mesh background */}
        <PlaneBackground width={width} height={height} />
        <Container scale={scale} x={horizontalOffset} y={verticalOffset}>
          <ScreenShakeUpdater wrapperRef={stageWrapperRef} shakeParamsRef={shakeParamsRef} />
          <CollisionDebug isVisible={showCollisionDebug} />
          <BulletManager
            ref={bulletManagerRef}
            enemyPositionsRef={enemyPositionsRef}
            onEnemyHit={handleEnemyHit}
          />
          {/* <HeroMouse onClickMove={onClickMove} /> */}
          <PlayerAnimated
            bulletManagerRef={bulletManagerRef}
            gunType="spreader"
            getControlsDirection={getControlsDirection}
            consumeShootPress={consumeShootPress}
            isShootHeld={isShootHeld}
            positionRef={playerPositionRef}
            playerRef={playerRef}
            notifyShotFired={notifyShotFired}
            isExiting={isPlayerExiting}
            onExitComplete={handlePlayerExitComplete}
          />
          {/* Enemies in Space Invaders formation (all move together) */}
          <EnemyFormation
            enemies={enemies}
            enemyTypeId={gameState.getSelectedEnemyTypeId() || DEFAULT_ENEMY_TYPE_ID}
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
      </div>
      {/* Mobile-only movement and shoot controls in a separate bottom bar. */}
      <div
        style={{
          marginTop: 'auto',
          width: '100%',
          height: mobileControlsHeight,
        }}
      >
        <MobileControlsBar
          onBigRedButtonPress={handleBigRedButton}
          bigRedButtonEnabled={bigRedButtonEnabled}
        />
      </div>
    </div>
  );
};

interface ExperienceProps {
  onGameOver: () => void;
  onLevelComplete: () => void;
}

const Experience = ({ onGameOver, onLevelComplete }: ExperienceProps) => {
  return (
    <ControlsProvider>
      <ExperienceContent onGameOver={onGameOver} onLevelComplete={onLevelComplete} />
    </ControlsProvider>
  );
};

export default Experience;

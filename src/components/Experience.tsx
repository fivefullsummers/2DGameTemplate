import { Container, Stage, useTick } from "@pixi/react";
import * as PIXI from "pixi.js";
import {
  TILE_SIZE,
  ENEMY_BULLET_HIT_RADIUS,
  BULLET_VS_BULLET_HIT_RADIUS,
  BULLET_ATTRACTION_RADIUS,
  GAME_WIDTH,
  isMobile,
} from "../consts/game-world";
import useDimensions from "../hooks/useDimensions";

// import HeroMouse from "./HeroMouse";
import PlayerAnimated, { PlayerRef } from "./PlayerAnimated";
import EnemyFormation, { EnemyFormationRef } from "./EnemyFormation";
import CollisionDebug from "./CollisionDebug";
import EntityCollisionDebug from "./EntityCollisionDebug";
import CollisionInfo from "./CollisionInfo";
import BulletManager, { BulletManagerRef } from "./BulletManager";
import Powerup, { PowerupData, POWERUP_ANIMATION_SPEED } from "./Powerup";
import HUD from "./HUD";
import { gsap } from "gsap";
import { PointerEvent, useRef, useEffect, useMemo, useState, useCallback } from "react";
import { IPosition } from "../types/common";
import { ControlsProvider } from "../contexts/ControlsContext";
import { useControlsContext } from "../contexts/ControlsContext";
import { sound } from "@pixi/sound";
import { getEnemyPositions } from "../consts/enemies-map";
import { gameState } from "../utils/GameState";
import { DEFAULT_ENEMY_TYPE_ID } from "../consts/enemy-types";
import {
  BULLET_TYPES,
  SPREADER_SPREAD_RADIUS,
  SPREADER_WAVE_DELAY_MS,
  POWERUP_GUN_BULLET_TYPES,
  POWERUP_FRAME_COUNT,
  POWERUP_SPRITE_FRAME_OFFSET,
} from "../consts/bullet-config";
import { PLAYER_COLLISION_RADIUS, PLAYER_SCALE, PLAYER_START_Y } from "../consts/tuning-config";
import { BACKGROUND_TILE_SIZE } from "../consts/background-tile";
import backgroundPattern from "../assets/misc/background.png";
import CRTOverlay from "./CRTOverlay";
import MobileControlsBar from "./MobileControlsBar";
import {
  createColorSmearFilter,
  updateColorSmearTime,
  updateColorSmearMovement,
  updateColorSmearDirection,
  type ColorSmearFilterOptions,
} from "../filters/ColorSmearFilter";
import { useVisualSettings } from "../contexts/VisualSettingsContext";

const SHAKE_AMPLITUDE_PX = 3;
const SHAKE_SPREADER_AMPLITUDE_PX = 7;
const SHAKE_DURATION_MS = 100;
/** Powerup weapon override lasts 2 seconds. */
const POWERUP_DURATION_MS = 2000;
/** Collect when powerup is within this distance of player (snap = meets player). */
const POWERUP_COLLECT_RADIUS = 20;
/** Zip-to-player: base lerp when far; adds more as we get close (exponential zip). Bias: faster. */
const POWERUP_ZIP_BASE_LERP = 0.06;
const POWERUP_ZIP_NEAR_LERP = 0.55;
const POWERUP_ZIP_DIST_REF = 100;
const POWERUP_ZIP_EXPONENT = 1.8;
/** GSAP ramp: speed factor 0→1 with expo.in (brief slow then exponential zip). Start higher = faster. */
const POWERUP_ZIP_RAMP_START = 0.4;
const POWERUP_ZIP_RAMP_DURATION_S = 0.08;
/** Scale: max when far, min when at player. */
const POWERUP_SCALE_MAX = 0.2;
const POWERUP_SCALE_MIN = 0.06;
const POWERUP_SCALE_DIST_REF = 90;

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

/** Runs inside Stage; zips powerups toward player (tracks player). Speed ramp 0→1 is driven by GSAP (smooth slow-then-zip curve). */
const PowerupUpdater = ({
  powerups,
  setPowerups,
  playerPositionRef,
  powerupPositionsRef,
  powerupZipFactorRef,
}: {
  powerups: PowerupData[];
  setPowerups: React.Dispatch<React.SetStateAction<PowerupData[]>>;
  playerPositionRef: React.RefObject<IPosition>;
  powerupPositionsRef: React.MutableRefObject<Map<string, { x: number; y: number }>>;
  powerupZipFactorRef: React.MutableRefObject<Map<string, { value: number }>>;
}) => {
  const accumulatorRef = useRef(0);
  useTick((delta) => {
    if (powerups.length === 0) return;
    const player = playerPositionRef.current;
    const normDelta = Math.min(delta / 2, 2);

    accumulatorRef.current += POWERUP_ANIMATION_SPEED * normDelta;
    const advanceFrame = accumulatorRef.current >= 1;
    if (advanceFrame) accumulatorRef.current = 0;

    const next: PowerupData[] = [];
    const toRemove: string[] = [];

    for (const p of powerups) {
      const newFrameIndex = advanceFrame
        ? (p.frameIndex + 1) % POWERUP_FRAME_COUNT
        : p.frameIndex;

      if (!player) {
        next.push({ ...p, frameIndex: newFrameIndex, scale: p.scale ?? POWERUP_SCALE_MAX });
        continue;
      }

      const dx = player.x - p.x;
      const dy = player.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < POWERUP_COLLECT_RADIUS) {
        toRemove.push(p.id);
        const bulletType = POWERUP_GUN_BULLET_TYPES[p.frameIndex];
        if (bulletType) gameState.setPowerupBulletType(bulletType, POWERUP_DURATION_MS);
        continue;
      }

      const invDist = dist > 0 ? 1 / dist : 0;
      const t = Math.min(1, dist / POWERUP_ZIP_DIST_REF);
      const zipFactor = 1 - Math.pow(t, POWERUP_ZIP_EXPONENT);
      let lerp = (POWERUP_ZIP_BASE_LERP + POWERUP_ZIP_NEAR_LERP * zipFactor) * normDelta;
      const ramp = powerupZipFactorRef.current.get(p.id)?.value ?? POWERUP_ZIP_RAMP_START;
      lerp *= ramp;
      const move = Math.min(lerp, 1) * dist;
      const newX = p.x + dx * invDist * move;
      const newY = p.y + dy * invDist * move;

      const newDist = Math.sqrt((player.x - newX) ** 2 + (player.y - newY) ** 2);
      if (newDist < POWERUP_COLLECT_RADIUS) {
        toRemove.push(p.id);
        const bulletType = POWERUP_GUN_BULLET_TYPES[newFrameIndex];
        if (bulletType) gameState.setPowerupBulletType(bulletType, POWERUP_DURATION_MS);
        continue;
      }

      const scaleT = Math.min(1, newDist / POWERUP_SCALE_DIST_REF);
      const scale = POWERUP_SCALE_MIN + (POWERUP_SCALE_MAX - POWERUP_SCALE_MIN) * scaleT;

      next.push({
        ...p,
        x: newX,
        y: newY,
        frameIndex: newFrameIndex,
        scale,
      });
    }

    for (const id of toRemove) {
      const obj = powerupZipFactorRef.current.get(id);
      if (obj) {
        gsap.killTweensOf(obj);
        powerupZipFactorRef.current.delete(id);
      }
    }

    powerupPositionsRef.current.clear();
    next.forEach((p) => powerupPositionsRef.current.set(p.id, { x: p.x, y: p.y }));
    setPowerups(next);
  });
  return <Container />;
};

interface ExperienceContentProps {
  onGameOver: () => void;
  onLevelComplete: () => void;
}

// Tuning: smear only when player is moving; decay when stopped.
const COLOR_SMEAR_MOVEMENT_SCALE = 1;   // world units per frame → movement 1
const COLOR_SMEAR_DECAY_SPEED = 1.0;   // how fast smear fades when you stop
const COLOR_SMEAR_RAMP_SPEED = 0.03;    // how fast smear appears when you move

// Helper child that runs inside the PIXI Stage tree so useTick has context.
const ColorSmearUpdater = ({
  filterRef,
  playerPositionRef,
  prevPlayerPosRef,
  movementSmoothedRef,
}: {
  filterRef: React.RefObject<PIXI.Filter | null>;
  playerPositionRef: React.RefObject<IPosition>;
  prevPlayerPosRef: React.MutableRefObject<IPosition>;
  movementSmoothedRef: React.MutableRefObject<number>;
}) => {
  const lastDirectionXRef = useRef(1);
  const lastDirectionYRef = useRef(0);
  useTick((delta) => {
    const filter = filterRef.current;
    if (filter) {
      updateColorSmearTime(filter, delta);
      const prev = prevPlayerPosRef.current;
      const curr = playerPositionRef.current;
      const dx = curr.x - prev.x;
      const dy = curr.y - prev.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      prevPlayerPosRef.current = { ...curr };
      if (dist > 0.001) {
        const movingX = Math.abs(dx) > 0.001;
        const movingY = Math.abs(dy) > 0.001;
        if (movingX) {
          lastDirectionXRef.current = dx < 0 ? 1 : -1;
          if (!movingY) lastDirectionYRef.current = 0;
        }
        if (movingY) {
          lastDirectionYRef.current = dy < 0 ? 1 : -1;
          if (!movingX) lastDirectionXRef.current = 0;
        }
      }
      updateColorSmearDirection(filter, lastDirectionXRef.current, lastDirectionYRef.current);
      const rawMovement = Math.min(dist / COLOR_SMEAR_MOVEMENT_SCALE, 1);
      const smoothed = movementSmoothedRef.current;
      const blend = rawMovement > smoothed ? COLOR_SMEAR_RAMP_SPEED : COLOR_SMEAR_DECAY_SPEED;
      movementSmoothedRef.current = smoothed + (rawMovement - smoothed) * blend;
      updateColorSmearMovement(filter, movementSmoothedRef.current);
    }
  });
  return <Container />;
};

const LEVEL_TIMER_MIN_SECONDS = 0;

/** Runs inside Stage; decrements the level countdown timer and triggers Game Over when it expires. */
const LevelTimerUpdater = ({ timerEnabled }: { timerEnabled: boolean }) => {
  const lastTimestampRef = useRef<number | null>(null);

  useTick(() => {
    // Only tick timer when mechanic is enabled and the game is in an active wave.
    if (!timerEnabled) {
      lastTimestampRef.current = null;
      return;
    }
    if (gameState.isGameOver() || gameState.isWaveComplete()) {
      lastTimestampRef.current = null;
      return;
    }

    const now = performance.now();
    const last = lastTimestampRef.current;
    lastTimestampRef.current = now;
    if (last == null) return;

    const deltaSeconds = (now - last) / 1000;
    if (deltaSeconds <= 0) return;

    const remaining = gameState.getTimerSecondsRemaining();
    if (remaining <= LEVEL_TIMER_MIN_SECONDS) return;

    const next = Math.max(LEVEL_TIMER_MIN_SECONDS, remaining - deltaSeconds);
    gameState.setTimerSecondsRemaining(next);

    if (next <= LEVEL_TIMER_MIN_SECONDS && !gameState.isGameOver()) {
      // Timer expired: trigger standard game over flow.
      gameState.triggerGameOver();
    }
  });

  return <Container />;
};

const ExperienceContent = ({ onGameOver, onLevelComplete }: ExperienceContentProps) => {
  const { width, height, scale } = useDimensions();
  const {
    motionBlurEnabled,
    motionBlurSettings,
    retroScanlinesEnabled,
    crtSettings,
    shadersSupported,
  } = useVisualSettings();
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
  // Level countdown timer enabled flag (Executive Order).
  const [timerEnabled, setTimerEnabled] = useState(gameState.getTimerEnabled());
  useEffect(() => {
    return gameState.subscribe((state) => {
      setBigRedButtonEnabled(state.bigRedButtonEnabled);
      setTimerEnabled(state.timerEnabled);
    });
  }, []);

  // Play level music on mount
  useEffect(() => {
    const levelMusic = sound.find("level1-music");
    if (levelMusic) {
      levelMusic.play({ loop: true, volume: 0.5, start: 2 }); // skip first 2 seconds of ymcabit.mp3
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
        // Cancel level-won exit animation if it was started (e.g. mutual kill on last enemy)
        setIsPlayerExiting(false);

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
    const alienSfx = sound.find("alien-death");
    if (alienSfx) alienSfx.play({ volume: 0.25 });
    const explosionSfx = sound.find("sfx-exp-short-hard2");
    if (explosionSfx) explosionSfx.play({ volume: 0.25 });
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
    const alienSfx = sound.find("alien-death");
    if (alienSfx) alienSfx.play({ volume: 0.25 });
    const explosionSfx = sound.find("sfx-exp-short-hard2");
    if (explosionSfx) explosionSfx.play({ volume: 0.25 });
    triggerScreenShake(SHAKE_SPREADER_AMPLITUDE_PX);

    const idSet = new Set(enemyIds);
    setEnemies((prev) =>
      prev.map((enemy) => {
        if (!idSet.has(enemy.id) || enemy.isExploding) return enemy;
        return { ...enemy, isExploding: true };
      })
    );
  }, []);

  // Handle bullet hit: normal single kill, spreader wave (by radius), or line gun (domino in one row)
  const handleEnemyHit = useCallback(
    (enemyId: string, bulletType: string) => {
      if (bulletType === "lineGun") {
        const currentEnemies = enemiesRef.current;
        const hitEnemy = currentEnemies.find((e) => e.id === enemyId);
        if (!hitEnemy) return;

        // Line gun: kill a vertical line of enemies straight up (same column, decreasing row).
        const col0 = hitEnemy.gridCol;
        const inColumnAbove = currentEnemies
          .filter((e) => !e.isExploding && e.gridCol === col0 && e.gridRow <= hitEnemy.gridRow)
          .sort((a, b) => b.gridRow - a.gridRow); // start from hit enemy, then move upward

        const LINE_GUN_MAX_ENEMIES = 3;
        const toKill = inColumnAbove.slice(0, LINE_GUN_MAX_ENEMIES);

        toKill.forEach((e) => {
          const rowDelta = hitEnemy.gridRow - e.gridRow; // 0 for hit enemy, 1 for next up, etc.
          const delay = rowDelta * SPREADER_WAVE_DELAY_MS;
          const run = () => triggerEnemyExplosionBatch([e.id]);
          if (delay === 0) run();
          else spreaderTimeoutsRef.current.push(setTimeout(run, delay));
        });
        return;
      }

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

  // Detect wave completion and start player exit animation (only if player is still alive)
  useEffect(() => {
    if (!hasWaveCompleted && enemies.length === 0) {
      // If player died on the same frame as killing the last enemy, don't trigger level won
      if (gameState.isGameOver()) {
        return;
      }
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

  const handlePlayerBulletHitEnemyBullet = useCallback((x: number, y: number, enemyBulletId: string, isPowerupBullet: boolean) => {
    enemyFormationRef.current?.removeEnemyBullet(enemyBulletId);
    // Both bullets are destroyed (player bullet already skipped in BulletManager). Spawn powerup only for green bullets.
    if (!isPowerupBullet || gameState.isPowerupActive()) return;
    const id = `powerup-${Date.now()}-${Math.random()}`;
    const factorObj = { value: POWERUP_ZIP_RAMP_START };
    powerupZipFactorRef.current.set(id, factorObj);
    gsap.to(factorObj, {
      value: 1,
      duration: POWERUP_ZIP_RAMP_DURATION_S,
      ease: "expo.in",
    });
    setPowerups((prev) => [
      ...prev,
      {
        id,
        x,
        y,
        frameIndex: 0,
        createdAt: Date.now(),
        scale: POWERUP_SCALE_MAX,
      },
    ]);
  }, []);

  const handlePlayerBulletHitPowerup = useCallback((powerupId: string) => {
    const obj = powerupZipFactorRef.current.get(powerupId);
    if (obj) {
      gsap.killTweensOf(obj);
      powerupZipFactorRef.current.delete(powerupId);
    }
    setPowerups((prev) => {
      const p = prev.find((x) => x.id === powerupId);
      if (p) {
        const bulletType = POWERUP_GUN_BULLET_TYPES[p.frameIndex];
        if (bulletType) gameState.setPowerupBulletType(bulletType, POWERUP_DURATION_MS);
        return prev.filter((x) => x.id !== powerupId);
      }
      return prev;
    });
  }, []);

  // Handle player being hit by enemy bullet
  const handlePlayerHit = useCallback(() => {
    // King's Mode (Executive Order): god mode — no damage
    if (gameState.getKingsMode()) return;
    // Powerup active: immune to damage for the duration of the powerup
    if (gameState.isPowerupActive()) return;

    // Tax Reimbursement (Executive Order):
    // Enemy bullets never kill the player; instead they deduct score.
    if (gameState.getTaxReimbursementEnabled()) {
      gameState.applyTaxReimbursementPenalty(10);
      return;
    }

    // Extra Life (Executive Order):
    // - When OFF (default): 1 hit = immediate GAME OVER.
    // - When ON: hits consume a life as usual and extra lives can be earned via score.
    if (!gameState.getExtraLifeEnabled()) {
      gameState.triggerGameOver();
      if (playerRef.current) {
        playerRef.current.triggerDeath();
      }
      return;
    }

    // Default behavior with Extra Life enabled: lose a life
    gameState.loseLife();
    // Trigger player death animation
    if (playerRef.current) {
      playerRef.current.triggerDeath();
    }
  }, []);

  // Pass enemy positions to BulletManager (refs are updated by enemies themselves)
  const enemyPositionsRef = useRef<Map<string, IPosition>>(new Map());
  const enemyBulletPositionsRef = useRef<Map<string, { x: number; y: number; isPowerupBullet?: boolean }>>(new Map());
  const enemyFormationRef = useRef<EnemyFormationRef>(null);

  // Powerups spawned when player bullet hits enemy bullet
  const [powerups, setPowerups] = useState<PowerupData[]>([]);
  const powerupPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  /** GSAP-driven speed ramp per powerup: value 0.2→1 over 0.25s (smooth slow-then-zip curve). */
  const powerupZipFactorRef = useRef<Map<string, { value: number }>>(new Map());

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

  // Enemy radius for player-bullet hit (and debug UI when pressing C)
  const enemyBulletHitRadius = ENEMY_BULLET_HIT_RADIUS;

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

  // Color smear: created only when motion blur is enabled (lazy, no preload). Disposed when disabled or unmount.
  const colorSmearFilterRef = useRef<PIXI.Filter | null>(null);
  const prevPlayerPosRef = useRef<IPosition>({ x: 0, y: 0 });
  const movementSmoothedRef = useRef(0);
  const colorSmearOptions: ColorSmearFilterOptions = useMemo(
    () => ({
      strength: motionBlurSettings.strength,
      decaySpeed: motionBlurSettings.decaySpeed,
      rampSpeed: motionBlurSettings.rampSpeed,
      movementScale: motionBlurSettings.movementScale,
    }),
    [
      motionBlurSettings.strength,
      motionBlurSettings.decaySpeed,
      motionBlurSettings.rampSpeed,
      motionBlurSettings.movementScale,
    ]
  );

  const colorSmearFilter = useMemo(() => {
    if (!motionBlurEnabled || !shadersSupported) return null;
    const filter = createColorSmearFilter(width, stageHeight, colorSmearOptions);
    colorSmearFilterRef.current = filter;
    return filter;
  }, [motionBlurEnabled, shadersSupported, width, stageHeight, colorSmearOptions]);

  // Dispose motion blur filter when disabled or on unmount
  useEffect(() => {
    return () => {
      if (colorSmearFilterRef.current) {
        colorSmearFilterRef.current.destroy();
        colorSmearFilterRef.current = null;
      }
    };
  }, [motionBlurEnabled]);

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
        // Match twinkle shader / mobile controls bar so gaps blend (rgb(3, 3, 15)).
        backgroundColor: 'rgb(3, 3, 15)',
      }}
    >
      {/* Full-height tiled background so it extends under the game area and mobile bar. */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
          backgroundImage: `url(${backgroundPattern})`,
          backgroundRepeat: "repeat",
          backgroundSize: `${BACKGROUND_TILE_SIZE}px ${BACKGROUND_TILE_SIZE}px`,
          backgroundColor: "rgb(3, 3, 15)",
        }}
      />
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", flex: 1, minHeight: 0, width: "100%" }}>
        <HUD showDebugInfo={false} />
        <CollisionInfo
          isVisible={showCollisionDebug}
          playerRadius={PLAYER_COLLISION_RADIUS}
          enemyRadius={enemyBulletHitRadius}
          bulletVsBulletHitRadius={BULLET_VS_BULLET_HIT_RADIUS}
          bulletAttractionRadius={BULLET_ATTRACTION_RADIUS}
        />
        <div
          ref={stageWrapperRef}
          style={{ width, height: stageHeight, overflow: "hidden" }}
        >
        <Stage
          width={width}
          height={stageHeight}
          options={{ backgroundAlpha: 0 }}
          onPointerDown={handleStageClick}
        >
          <Container
            scale={scale}
            x={horizontalOffset}
            y={verticalOffset}
          >
            <ScreenShakeUpdater wrapperRef={stageWrapperRef} shakeParamsRef={shakeParamsRef} />
            <CollisionDebug isVisible={showCollisionDebug} />
            <BulletManager
              ref={bulletManagerRef}
              enemyPositionsRef={enemyPositionsRef}
              onEnemyHit={handleEnemyHit}
              enemyBulletPositionsRef={enemyBulletPositionsRef}
              onPlayerBulletHitEnemyBullet={handlePlayerBulletHitEnemyBullet}
              powerupPositionsRef={powerupPositionsRef}
              onPlayerBulletHitPowerup={handlePlayerBulletHitPowerup}
            />
            <Container
              filters={
                motionBlurEnabled && colorSmearFilter ? [colorSmearFilter] : undefined
              }
            >
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
            </Container>
            <EnemyFormation
              ref={enemyFormationRef}
              enemies={enemies}
              enemyTypeId={gameState.getSelectedEnemyTypeId() || DEFAULT_ENEMY_TYPE_ID}
              onEnemyRemove={removeEnemy}
              playerPositionRef={playerPositionRef}
              onPlayerHit={handlePlayerHit}
              enemyBulletPositionsRef={enemyBulletPositionsRef}
            />
            <LevelTimerUpdater timerEnabled={timerEnabled} />
            <PowerupUpdater
              powerups={powerups}
              setPowerups={setPowerups}
              playerPositionRef={playerPositionRef}
              powerupPositionsRef={powerupPositionsRef}
              powerupZipFactorRef={powerupZipFactorRef}
            />
            {powerups.map((p) => (
              <Powerup
                key={p.id}
                id={p.id}
                x={p.x}
                y={p.y}
                frameIndex={p.frameIndex + POWERUP_SPRITE_FRAME_OFFSET}
                scale={p.scale ?? POWERUP_SCALE_MAX}
                frameCount={5}
              />
            ))}
            {/* Entity collision boundaries visualization */}
            <EntityCollisionDebug
              isVisible={showCollisionDebug}
              playerPositionRef={playerPositionRef}
              enemies={enemies}
              enemyRadius={enemyBulletHitRadius}
            />
            <ColorSmearUpdater
              filterRef={colorSmearFilterRef}
              playerPositionRef={playerPositionRef}
              prevPlayerPosRef={prevPlayerPosRef}
              movementSmoothedRef={movementSmoothedRef}
            />
          </Container>
        </Stage>
      </div>
        {/* Mobile-only movement and shoot controls in a separate bottom bar. */}
        <div
          style={{
            marginTop: "auto",
            width: "100%",
            height: mobileControlsHeight,
          }}
        >
          <MobileControlsBar
            onBigRedButtonPress={handleBigRedButton}
            bigRedButtonEnabled={bigRedButtonEnabled}
          />
        </div>
      </div>
      {/* Full-screen CRT overlay (only when GPU supports shaders). */}
      {shadersSupported && retroScanlinesEnabled && (
        <Stage
          width={width}
          height={height}
          options={{ backgroundAlpha: 0 }}
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
          }}
        >
          <CRTOverlay
            width={width}
            height={height}
            uScan={crtSettings.uScan}
            uWarp={crtSettings.uWarp}
          />
        </Stage>
      )}
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

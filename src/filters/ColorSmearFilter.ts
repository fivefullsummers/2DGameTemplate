import * as PIXI from "pixi.js";
import fragmentSrc from "../shaders/colorSmear/fragment.glsl?raw";

/** Options you can tweak when creating or updating the filter. */
export interface ColorSmearFilterOptions {
  /** Max smear length in pixels when uMovement is 1. Default 12. */
  strength?: number;
  /** How fast movement value decays when player stops (0–1). Default 0.12. */
  decaySpeed?: number;
  /** How fast movement value ramps when player moves (0–1). Default 0.35. */
  rampSpeed?: number;
  /** World distance per frame that maps to movement=1. Default 8. */
  movementScale?: number;
}

const DEFAULTS: Required<ColorSmearFilterOptions> = {
  strength: 12,
  decaySpeed: 0.12,
  rampSpeed: 0.35,
  movementScale: 8,
};

export function createColorSmearFilter(
  width: number,
  height: number,
  options: ColorSmearFilterOptions = {}
) {
  const opts = { ...DEFAULTS, ...options };
  const uniforms = {
    uResolution: new PIXI.Point(width, height),
    uTime: 0,
    uStrength: opts.strength,
    uMovement: 0,
    uDirection: 1,
    uDirectionY: 0,
  };

  const filter = new PIXI.Filter(undefined, fragmentSrc, uniforms);
  return filter;
}

/** Advance time (optional jitter). Call from useTick if you want animated phase. */
export function updateColorSmearTime(filter: PIXI.Filter | null, delta: number) {
  if (!filter) return;
  const uniforms = filter.uniforms as Record<string, unknown>;
  uniforms.uTime = (uniforms.uTime as number ?? 0) + delta / 60;
}

/** Set movement amount 0–1. Smear is off at 0, full at 1. Call from useTick with smoothed value. */
export function updateColorSmearMovement(filter: PIXI.Filter | null, movement: number) {
  if (!filter) return;
  const uniforms = filter.uniforms as Record<string, unknown>;
  uniforms.uMovement = Math.max(0, Math.min(1, movement));
}

/** Set smear direction (opposite to movement). directionX: 1 = smear right, -1 = smear left, 0 = no horizontal. directionY: 1 = smear down, -1 = smear up, 0 = no vertical. Omit directionY for horizontal-only (e.g. enemies). */
export function updateColorSmearDirection(
  filter: PIXI.Filter | null,
  directionX: number,
  directionY?: number
) {
  if (!filter) return;
  const u = filter.uniforms as Record<string, number>;
  u.uDirection = directionX > 0 ? 1 : directionX < 0 ? -1 : 0;
  u.uDirectionY =
    directionY === undefined ? 0 : directionY > 0 ? 1 : directionY < 0 ? -1 : 0;
}

/** Update filter strength at runtime (e.g. from options). */
export function setColorSmearStrength(filter: PIXI.Filter | null, strength: number) {
  if (!filter) return;
  const uniforms = filter.uniforms as Record<string, unknown>;
  uniforms.uStrength = Math.max(0, strength);
}


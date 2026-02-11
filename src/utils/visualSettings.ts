/**
 * Visual effect settings: Retro scanlines (CRT) and Motion blur.
 * Persisted to localStorage so they apply across the whole game.
 */

const KEY_RETRO_ENABLED = "game-retro-scanlines-enabled";
const KEY_RETRO_SCAN = "game-retro-scanlines-intensity";
const KEY_RETRO_WARP = "game-retro-scanlines-warp";
const KEY_MOTION_BLUR_ENABLED = "game-motion-blur-enabled";
const KEY_MOTION_BLUR_STRENGTH = "game-motion-blur-strength";
const KEY_MOTION_BLUR_DECAY = "game-motion-blur-decay";
const KEY_MOTION_BLUR_RAMP = "game-motion-blur-ramp";
const KEY_MOTION_BLUR_SCALE = "game-motion-blur-movement-scale";
const KEY_DITHER_ENABLED = "game-dither-enabled";

const DEFAULT_RETRO_ENABLED = false;
const DEFAULT_RETRO_SCAN = 0.3;
const DEFAULT_RETRO_WARP = 0;
const DEFAULT_MOTION_BLUR_ENABLED = false;
const DEFAULT_DITHER_ENABLED = false;
const DEFAULT_MOTION_BLUR_STRENGTH = 14;
const DEFAULT_MOTION_BLUR_DECAY = 1.0;
const DEFAULT_MOTION_BLUR_RAMP = 0.9;
const DEFAULT_MOTION_BLUR_SCALE = 3;

function getBool(key: string, defaultValue: boolean): boolean {
  if (typeof window === "undefined") return defaultValue;
  const v = localStorage.getItem(key);
  if (v === "true") return true;
  if (v === "false") return false;
  return defaultValue;
}

function getNum(key: string, defaultValue: number, min: number, max: number): number {
  if (typeof window === "undefined") return defaultValue;
  const v = localStorage.getItem(key);
  if (v == null || v === "") return defaultValue;
  const n = Number(v);
  if (Number.isNaN(n)) return defaultValue;
  return Math.min(max, Math.max(min, n));
}

function setBool(key: string, value: boolean): void {
  if (typeof window !== "undefined") localStorage.setItem(key, String(value));
}

function setNum(key: string, value: number): void {
  if (typeof window !== "undefined") localStorage.setItem(key, String(value));
}

export interface CRTSettings {
  uScan: number;
  uWarp: number;
}

export interface MotionBlurSettings {
  strength: number;
  decaySpeed: number;
  rampSpeed: number;
  movementScale: number;
}

export function getRetroScanlinesEnabled(): boolean {
  return getBool(KEY_RETRO_ENABLED, DEFAULT_RETRO_ENABLED);
}

export function setRetroScanlinesEnabled(enabled: boolean): void {
  setBool(KEY_RETRO_ENABLED, enabled);
}

export function getCRTSettings(): CRTSettings {
  return {
    uScan: getNum(KEY_RETRO_SCAN, DEFAULT_RETRO_SCAN, 0, 2),
    uWarp: getNum(KEY_RETRO_WARP, DEFAULT_RETRO_WARP, 0, 1),
  };
}

export function setCRTSettings(settings: Partial<CRTSettings>): void {
  if (settings.uScan !== undefined) setNum(KEY_RETRO_SCAN, settings.uScan);
  if (settings.uWarp !== undefined) setNum(KEY_RETRO_WARP, settings.uWarp);
}

export function getMotionBlurEnabled(): boolean {
  return getBool(KEY_MOTION_BLUR_ENABLED, DEFAULT_MOTION_BLUR_ENABLED);
}

export function setMotionBlurEnabled(enabled: boolean): void {
  setBool(KEY_MOTION_BLUR_ENABLED, enabled);
}

export function getMotionBlurSettings(): MotionBlurSettings {
  return {
    strength: getNum(KEY_MOTION_BLUR_STRENGTH, DEFAULT_MOTION_BLUR_STRENGTH, 1, 40),
    decaySpeed: getNum(KEY_MOTION_BLUR_DECAY, DEFAULT_MOTION_BLUR_DECAY, 0.01, 1),
    rampSpeed: getNum(KEY_MOTION_BLUR_RAMP, DEFAULT_MOTION_BLUR_RAMP, 0.01, 1),
    movementScale: getNum(KEY_MOTION_BLUR_SCALE, DEFAULT_MOTION_BLUR_SCALE, 1, 30),
  };
}

export function setMotionBlurSettings(settings: Partial<MotionBlurSettings>): void {
  if (settings.strength !== undefined) setNum(KEY_MOTION_BLUR_STRENGTH, settings.strength);
  if (settings.decaySpeed !== undefined) setNum(KEY_MOTION_BLUR_DECAY, settings.decaySpeed);
  if (settings.rampSpeed !== undefined) setNum(KEY_MOTION_BLUR_RAMP, settings.rampSpeed);
  if (settings.movementScale !== undefined) setNum(KEY_MOTION_BLUR_SCALE, settings.movementScale);
}

export function getDefaultCRTSettings(): CRTSettings {
  return { uScan: DEFAULT_RETRO_SCAN, uWarp: DEFAULT_RETRO_WARP };
}

export function getDefaultMotionBlurSettings(): MotionBlurSettings {
  return {
    strength: DEFAULT_MOTION_BLUR_STRENGTH,
    decaySpeed: DEFAULT_MOTION_BLUR_DECAY,
    rampSpeed: DEFAULT_MOTION_BLUR_RAMP,
    movementScale: DEFAULT_MOTION_BLUR_SCALE,
  };
}

export function getDitherEnabled(): boolean {
  return getBool(KEY_DITHER_ENABLED, DEFAULT_DITHER_ENABLED);
}

export function setDitherEnabled(enabled: boolean): void {
  setBool(KEY_DITHER_ENABLED, enabled);
}

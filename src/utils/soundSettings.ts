import { sound } from "@pixi/sound";

const STORAGE_KEY = "game-sound-enabled";

function readStored(): boolean {
  if (typeof window === "undefined") return true;
  const v = localStorage.getItem(STORAGE_KEY);
  if (v === "false") return false;
  if (v === "true") return true;
  return true; // default: sound on
}

/**
 * Get whether sound is enabled (from localStorage).
 * Default is true if never set.
 */
export function getSoundEnabled(): boolean {
  return readStored();
}

/**
 * Set sound on/off: persist to localStorage and apply to PIXI sound.
 */
export function setSoundEnabled(enabled: boolean): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, String(enabled));
  }
  try {
    sound.context.muted = !enabled;
  } catch {
    // context may not be ready yet
  }
}

/**
 * Apply the stored sound preference to PIXI sound.
 * Call once after assets (and sound) are ready.
 */
export function applyStoredSoundPreference(): void {
  const enabled = readStored();
  try {
    sound.context.muted = !enabled;
  } catch {
    // ignore if context not ready
  }
}

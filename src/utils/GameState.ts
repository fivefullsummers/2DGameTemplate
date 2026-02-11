/**
 * GameState - Score and Game State Manager
 * Based on classic Space Invaders mechanics
 */

import { PLAYER_CONFIGS, DEFAULT_PLAYER_ID } from "../consts/players";
import { DEFAULT_ENEMY_TYPE_ID } from "../consts/enemy-types";

// Score values from Space Invaders mechanics
export const SCORE_VALUES = {
  ENEMY_TOP: 30,      // Top row aliens (Row 0)
  ENEMY_MIDDLE: 20,   // Middle rows (Rows 1-2)
  ENEMY_BOTTOM: 10,   // Bottom rows (Rows 3-4)
  UFO_MIN: 50,
  UFO_MAX: 300,
} as const;

// Game constants from Space Invaders mechanics
export const GAME_CONSTANTS = {
  STARTING_LIVES: 3,
  EXTRA_LIFE_THRESHOLD: 1500,  // Award extra life every this many points (1500, 3000, 4500...)
  STARTING_WAVE: 1,
  TOTAL_ENEMIES: 55,  // 11 columns × 5 rows in classic Space Invaders
} as const;

/** Default level countdown timer duration (in seconds). */
export const LEVEL_TIMER_DEFAULT_SECONDS = 45;

// Interface for game state data
export interface IGameStateData {
  score: number;
  /** Score at the start of the current wave/level (used for per-level scoring & replays). */
  waveStartScore: number;
  highScore: number;
  lives: number;
  wave: number;
  enemiesRemaining: number;
  totalEnemies: number;
  extraLifeAwarded: boolean;
  showExtraLifeMessage: boolean; // true only briefly after awarding, so message doesn't reappear next wave
  /** True briefly after granting a weapon powerup so HUD can show a toast. */
  showPowerupMessage: boolean;
  /** Bullet type key for the most recently granted powerup (for HUD display). */
  powerupBulletTypeToast: string | null;
  shotsfired: number;
  hits: number;
  kingsModeEnabled: boolean; // Executive Order: god mode (no damage)
  bigRedButtonEnabled: boolean; // Executive Order: show Big Red Button (clear wave)
  selectedBulletType: string; // Current weapon (key in BULLET_TYPES)
  /** Current effective weapon (powerup override or selected); use for UI e.g. shoot button gun icon. */
  effectiveBulletType: string;
  selectedPlayerId: string; // Current player (key in PLAYER_CONFIGS)
  selectedEnemyTypeId: string; // Current enemy type for the level (key in ENEMY_TYPE_CONFIGS)
  difficulty: GameDifficulty; // Executive Order: enemy shooting aggression (easy / medium / hard)
  /** Level countdown timer (seconds remaining). Clamped at 0. */
  timerSecondsRemaining: number;
  /** Executive Order: enable / disable level countdown timer mechanic. */
  timerEnabled: boolean;
  /** Executive Order: Tax Reimbursement; enemy bullets deduct score instead of lives. */
  taxReimbursementEnabled: boolean;
  /** Executive Order: HUD stats visibility – high score section. */
  hudShowHighScore: boolean;
  /** Executive Order: HUD stats visibility – lives counter. */
  hudShowLives: boolean;
  /** Executive Order: HUD stats visibility – weapon label. */
  hudShowWeapon: boolean;
  /** Executive Order: Extra Life feature – multi-life + score-based extra lives. */
  extraLifeEnabled: boolean;
}

/** Difficulty level for enemy aggression (shoot rate, bullet count, bullet speed). */
export type GameDifficulty = 'easy' | 'medium' | 'hard';

/**
 * GameState singleton class
 * Manages all game state including score, lives, waves, and statistics
 */
export class GameState {
  private static instance: GameState | null = null;
  
  // Core game state
  private score: number = 0;
  /** Score snapshot taken at the start of the current wave/level. */
  private waveStartScore: number = 0;
  private highScore: number = 0;
  private lives: number = GAME_CONSTANTS.STARTING_LIVES;
  private wave: number = GAME_CONSTANTS.STARTING_WAVE;
  private enemiesRemaining: number = 0;
  private totalEnemies: number = 0;
  
  // Tracking for extra life
  private extraLifeAwarded: boolean = false;
  private showExtraLifeMessage: boolean = false;
  private extraLifeMessageTimeoutId: ReturnType<typeof setTimeout> | null = null;

  // Tracking for weapon powerup toast
  private showPowerupMessage: boolean = false;
  private powerupBulletTypeToast: string | null = null;
  private powerupMessageTimeoutId: ReturnType<typeof setTimeout> | null = null;

  // Tracking for shot-limited powerups (e.g. heavyMachineGun)
  private powerupShotsRemaining: number | null = null;

  // Statistics
  private shotsfired: number = 0;
  private hits: number = 0;

  // Executive Orders (persisted to localStorage)
  private kingsModeEnabled: boolean = false;
  private bigRedButtonEnabled: boolean = false;
  private difficulty: GameDifficulty = 'medium';
  // Tax Reimbursement OFF by default; bullets deal damage unless explicitly enabled.
  private taxReimbursementEnabled: boolean = false;
  // HUD stats: by default only LIVES is shown; others can be enabled via Executive Orders.
  private hudShowHighScore: boolean = false;
  private hudShowLives: boolean = true;
  private hudShowWeapon: boolean = false;
  // Extra Life is ON by default; hits consume lives and extra lives can be earned.
  private extraLifeEnabled: boolean = true;

  // Countdown timer (per-level, used for optional timer-based Game Over).
  private timerSecondsRemaining: number = LEVEL_TIMER_DEFAULT_SECONDS;
  private timerEnabled: boolean = true;

  // Callbacks for state changes
  private onStateChangeCallbacks: Array<(state: IGameStateData) => void> = [];

  private constructor() {
    this.loadHighScore();
    this.loadExecutiveOrders();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): GameState {
    if (!GameState.instance) {
      GameState.instance = new GameState();
    }
    return GameState.instance;
  }

  /**
   * Reset singleton (useful for testing or full reset)
   */
  public static reset(): void {
    GameState.instance = null;
  }

  private clearPowerupExpiryTimeout(): void {
    if (this.powerupExpiryTimeoutId != null) {
      clearTimeout(this.powerupExpiryTimeoutId);
      this.powerupExpiryTimeoutId = null;
    }
    this.powerupBulletTypeOverride = null;
  }

  /**
   * Initialize game state for a new game
   */
  public initGame(totalEnemies: number): void {
    this.clearExtraLifeMessageTimeout();
    this.clearPowerupMessageTimeout();
    this.clearPowerupExpiryTimeout();
    this.score = 0;
    this.waveStartScore = 0;
    this.lives = GAME_CONSTANTS.STARTING_LIVES;
    this.wave = GAME_CONSTANTS.STARTING_WAVE;
    this.enemiesRemaining = totalEnemies;
    this.totalEnemies = totalEnemies;
    this.extraLifeAwarded = false;
    this.showExtraLifeMessage = false;
    this.showPowerupMessage = false;
    this.powerupBulletTypeToast = null;
    this.powerupShotsRemaining = null;
    this.shotsfired = 0;
    this.hits = 0;
    this.timerSecondsRemaining = LEVEL_TIMER_DEFAULT_SECONDS;
    this.notifyStateChange();
  }

  /**
   * Initialize a new wave
   */
  public initWave(totalEnemies: number): void {
    this.clearExtraLifeMessageTimeout();
    this.showExtraLifeMessage = false;
    this.clearPowerupMessageTimeout();
    this.showPowerupMessage = false;
    this.powerupBulletTypeToast = null;
    this.wave++;
    // New wave starts from whatever total score we have now.
    this.waveStartScore = this.score;
    this.enemiesRemaining = totalEnemies;
    this.totalEnemies = totalEnemies;
    this.timerSecondsRemaining = LEVEL_TIMER_DEFAULT_SECONDS;
    this.notifyStateChange();
  }

  /**
   * Reset the current wave (used for "replay level" without changing wave,
   * score, or lives).
   */
  public resetCurrentWave(totalEnemies: number): void {
    this.clearExtraLifeMessageTimeout();
    this.showExtraLifeMessage = false;
    this.clearPowerupMessageTimeout();
    this.showPowerupMessage = false;
    this.powerupBulletTypeToast = null;
    this.powerupShotsRemaining = null;
    // When replaying a level, restore score to what it was when this wave began
    // so the player does not gain/lose points from failed attempts.
    this.score = this.waveStartScore;
    this.enemiesRemaining = totalEnemies;
    this.totalEnemies = totalEnemies;
    this.timerSecondsRemaining = LEVEL_TIMER_DEFAULT_SECONDS;
    this.notifyStateChange();
  }

  /**
   * Add points to score
   */
  public addScore(points: number): void {
    const previousScore = this.score;
    this.score += points;

    // Extra Life Executive Order: when disabled, score still increases but
    // we do NOT award extra lives at score thresholds or show the toast.
    if (this.extraLifeEnabled) {
      // Award extra life every EXTRA_LIFE_THRESHOLD points (1500, 3000, 4500...)
      const prevMultiple = Math.floor(previousScore / GAME_CONSTANTS.EXTRA_LIFE_THRESHOLD);
      const currMultiple = Math.floor(this.score / GAME_CONSTANTS.EXTRA_LIFE_THRESHOLD);
      if (currMultiple > prevMultiple) {
        const livesToAdd = currMultiple - prevMultiple;
        for (let i = 0; i < livesToAdd; i++) {
          this.addLife();
        }
        this.extraLifeAwarded = true;
        this.showExtraLifeMessage = true;
        this.clearExtraLifeMessageTimeout();
        this.extraLifeMessageTimeoutId = setTimeout(() => {
          this.extraLifeMessageTimeoutId = null;
          this.showExtraLifeMessage = false;
          this.notifyStateChange();
        }, 2500); // Match HUD animation duration
      }
    }
    
    // Update high score if needed
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.saveHighScore();
    }
    
    this.notifyStateChange();
  }

  /**
   * Calculate and add score for enemy kill based on row
   */
  public addEnemyKillScore(rowIndex: number): void {
    let points: number = SCORE_VALUES.ENEMY_BOTTOM;
    
    // Determine points based on row (top rows are worth more)
    if (rowIndex === 0) {
      points = SCORE_VALUES.ENEMY_TOP;
    } else if (rowIndex === 1 || rowIndex === 2) {
      points = SCORE_VALUES.ENEMY_MIDDLE;
    } else {
      points = SCORE_VALUES.ENEMY_BOTTOM;
    }
    
    this.addScore(points);
    this.hits++;
    this.enemiesRemaining = Math.max(0, this.enemiesRemaining - 1);
  }

  /**
   * Add life (capped at maximum)
   */
  public addLife(): void {
    this.lives = Math.min(this.lives + 1, 9); // Cap at 9 lives for display
    this.notifyStateChange();
  }

  /**
   * Apply a flat score penalty (for Tax Reimbursement bullet hits) without affecting
   * extra-life thresholds or powerup messaging. Score is clamped at 0.
   */
  public applyTaxReimbursementPenalty(pointsToSubtract: number): void {
    if (pointsToSubtract <= 0) return;
    if (this.score <= 0) return;
    const previousScore = this.score;
    this.score = Math.max(0, this.score - pointsToSubtract);

    // If penalty lowered score below current waveStartScore, keep waveStartScore
    // as-is; it's only used for per-wave score and replay reset.
    if (this.score < 0) {
      this.score = 0;
    }

    if (this.score !== previousScore) {
      this.notifyStateChange();
    }
  }

  /**
   * Lose a life
   */
  public loseLife(): void {
    this.lives = Math.max(0, this.lives - 1);
    this.notifyStateChange();
  }

  /**
   * Increment shot counter
   */
  public registerShot(): void {
    this.shotsfired++;
    this.notifyStateChange();
  }

  /**
   * Get current accuracy percentage
   */
  public getAccuracy(): number {
    if (this.shotsfired === 0) return 0;
    return Math.round((this.hits / this.shotsfired) * 100);
  }

  /**
   * Check if game is over
   */
  public isGameOver(): boolean {
    return this.lives <= 0;
  }

  /**
   * Force game over (e.g. when enemies reach the player line).
   * Sets lives to 0 and notifies subscribers.
   */
  public triggerGameOver(): void {
    this.lives = 0;
    this.notifyStateChange();
  }

  /**
   * Check if wave is complete
   */
  public isWaveComplete(): boolean {
    return this.enemiesRemaining <= 0;
  }

  /**
   * Get current game state
   */
  public getState(): IGameStateData {
    return {
      score: this.score,
      waveStartScore: this.waveStartScore,
      highScore: this.highScore,
      lives: this.lives,
      wave: this.wave,
      enemiesRemaining: this.enemiesRemaining,
      totalEnemies: this.totalEnemies,
      extraLifeAwarded: this.extraLifeAwarded,
      showExtraLifeMessage: this.showExtraLifeMessage,
      showPowerupMessage: this.showPowerupMessage,
      powerupBulletTypeToast: this.powerupBulletTypeToast,
      shotsfired: this.shotsfired,
      hits: this.hits,
      kingsModeEnabled: this.kingsModeEnabled,
      bigRedButtonEnabled: this.bigRedButtonEnabled,
      selectedBulletType: this.selectedBulletType,
      effectiveBulletType: this.getSelectedBulletType(),
      selectedPlayerId: this.selectedPlayerId,
      selectedEnemyTypeId: this.selectedEnemyTypeId,
      difficulty: this.difficulty,
      timerSecondsRemaining: this.timerSecondsRemaining,
      timerEnabled: this.timerEnabled,
      taxReimbursementEnabled: this.taxReimbursementEnabled,
      hudShowHighScore: this.hudShowHighScore,
      hudShowLives: this.hudShowLives,
      hudShowWeapon: this.hudShowWeapon,
      extraLifeEnabled: this.extraLifeEnabled,
    };
  }

  private clearExtraLifeMessageTimeout(): void {
    if (this.extraLifeMessageTimeoutId !== null) {
      clearTimeout(this.extraLifeMessageTimeoutId);
      this.extraLifeMessageTimeoutId = null;
    }
  }

  private clearPowerupMessageTimeout(): void {
    if (this.powerupMessageTimeoutId !== null) {
      clearTimeout(this.powerupMessageTimeoutId);
      this.powerupMessageTimeoutId = null;
    }
  }

  /**
   * Subscribe to state changes
   */
  public subscribe(callback: (state: IGameStateData) => void): () => void {
    this.onStateChangeCallbacks.push(callback);
    // Return unsubscribe function
    return () => {
      this.onStateChangeCallbacks = this.onStateChangeCallbacks.filter(
        (cb) => cb !== callback
      );
    };
  }

  /**
   * Notify all subscribers of state change
   */
  private notifyStateChange(): void {
    const state = this.getState();
    this.onStateChangeCallbacks.forEach((callback) => callback(state));
  }

  private static readonly STORAGE_KEY_HIGH_SCORE = 'spaceInvaders_highScore';
  private static readonly STORAGE_KEY_KINGS_MODE = 'spaceInvaders_kingsMode';
  private static readonly STORAGE_KEY_BIG_RED_BUTTON = 'spaceInvaders_bigRedButton';
  private static readonly STORAGE_KEY_SELECTED_BULLET = 'spaceInvaders_selectedBulletType';
  private static readonly STORAGE_KEY_DIFFICULTY = 'spaceInvaders_difficulty';
  private static readonly STORAGE_KEY_TIMER_ENABLED = 'spaceInvaders_timerEnabled';
  private static readonly STORAGE_KEY_TAX_REIMBURSEMENT = 'spaceInvaders_taxReimbursement';
  private static readonly STORAGE_KEY_HUD_SHOW_HIGH_SCORE = 'spaceInvaders_hudShowHighScore';
  private static readonly STORAGE_KEY_HUD_SHOW_LIVES = 'spaceInvaders_hudShowLives';
  private static readonly STORAGE_KEY_HUD_SHOW_WEAPON = 'spaceInvaders_hudShowWeapon';
  private static readonly STORAGE_KEY_EXTRA_LIFE_ENABLED = 'spaceInvaders_extraLifeEnabled';

  /** Selected weapon (bullet type key) for Executive Orders dropdown; persists. */
  private selectedBulletType: string = 'basic';

  /** Temporary bullet type from powerup; overrides selectedBulletType until expiry. */
  private powerupBulletTypeOverride: string | null = null;
  private powerupOverrideExpiry: number = 0;
  private powerupExpiryTimeoutId: ReturnType<typeof setTimeout> | null = null;

  /** Selected player id (in-memory; set from player select screen). */
  private selectedPlayerId: string = DEFAULT_PLAYER_ID;

  /** Selected enemy type id for the current level (in-memory; set from pre-game/level). */
  private selectedEnemyTypeId: string = DEFAULT_ENEMY_TYPE_ID;

  /**
   * Load Executive Orders flags from localStorage
   */
  private loadExecutiveOrders(): void {
    try {
      const savedKings = localStorage.getItem(GameState.STORAGE_KEY_KINGS_MODE);
      if (savedKings !== null) {
        this.kingsModeEnabled = savedKings === 'true';
      }
      const savedBigRed = localStorage.getItem(GameState.STORAGE_KEY_BIG_RED_BUTTON);
      if (savedBigRed !== null) {
        this.bigRedButtonEnabled = savedBigRed === 'true';
      }
      const savedBullet = localStorage.getItem(GameState.STORAGE_KEY_SELECTED_BULLET);
      if (savedBullet !== null) {
        this.selectedBulletType = savedBullet;
      }
      const savedDifficulty = localStorage.getItem(GameState.STORAGE_KEY_DIFFICULTY);
      if (savedDifficulty === 'easy' || savedDifficulty === 'medium' || savedDifficulty === 'hard') {
        this.difficulty = savedDifficulty;
      }
      const savedTimerEnabled = localStorage.getItem(GameState.STORAGE_KEY_TIMER_ENABLED);
      if (savedTimerEnabled !== null) {
        this.timerEnabled = savedTimerEnabled === 'true';
      }
      const savedTax = localStorage.getItem(GameState.STORAGE_KEY_TAX_REIMBURSEMENT);
      if (savedTax !== null) {
        this.taxReimbursementEnabled = savedTax === 'true';
      }
      const savedHudHigh = localStorage.getItem(GameState.STORAGE_KEY_HUD_SHOW_HIGH_SCORE);
      if (savedHudHigh !== null) {
        this.hudShowHighScore = savedHudHigh === 'true';
      }
      const savedHudLives = localStorage.getItem(GameState.STORAGE_KEY_HUD_SHOW_LIVES);
      if (savedHudLives !== null) {
        this.hudShowLives = savedHudLives === 'true';
      }
      const savedHudWeapon = localStorage.getItem(GameState.STORAGE_KEY_HUD_SHOW_WEAPON);
      if (savedHudWeapon !== null) {
        this.hudShowWeapon = savedHudWeapon === 'true';
      }
      const savedExtraLife = localStorage.getItem(GameState.STORAGE_KEY_EXTRA_LIFE_ENABLED);
      if (savedExtraLife !== null) {
        this.extraLifeEnabled = savedExtraLife === 'true';
      }
    } catch (error) {
      console.warn('Failed to load Executive Orders:', error);
    }
  }

  /**
   * Save King's Mode to localStorage
   */
  private saveKingsMode(): void {
    try {
      localStorage.setItem(GameState.STORAGE_KEY_KINGS_MODE, this.kingsModeEnabled.toString());
    } catch (error) {
      console.warn('Failed to save King\'s Mode:', error);
    }
  }

  private saveSelectedBulletType(): void {
    try {
      localStorage.setItem(GameState.STORAGE_KEY_SELECTED_BULLET, this.selectedBulletType);
    } catch (error) {
      console.warn('Failed to save selected bullet type:', error);
    }
  }

  /**
   * Get whether King's Mode (god mode) is enabled.
   */
  public getKingsMode(): boolean {
    return this.kingsModeEnabled;
  }

  /**
   * Set King's Mode (god mode). Persists to localStorage.
   */
  public setKingsMode(enabled: boolean): void {
    if (this.kingsModeEnabled === enabled) return;
    this.kingsModeEnabled = enabled;
    this.saveKingsMode();
    this.notifyStateChange();
  }

  public getBigRedButtonEnabled(): boolean {
    return this.bigRedButtonEnabled;
  }

  public setBigRedButtonEnabled(enabled: boolean): void {
    if (this.bigRedButtonEnabled === enabled) return;
    this.bigRedButtonEnabled = enabled;
    try {
      localStorage.setItem(GameState.STORAGE_KEY_BIG_RED_BUTTON, enabled.toString());
    } catch (error) {
      console.warn('Failed to save Big Red Button:', error);
    }
    this.notifyStateChange();
  }

  /**
   * Get difficulty (enemy shooting aggression). Used by EnemyFormation.
   */
  public getDifficulty(): GameDifficulty {
    return this.difficulty;
  }

  /**
   * Set difficulty. Persists to localStorage.
   */
  public setDifficulty(level: GameDifficulty): void {
    if (this.difficulty === level) return;
    this.difficulty = level;
    try {
      localStorage.setItem(GameState.STORAGE_KEY_DIFFICULTY, level);
    } catch (error) {
      console.warn('Failed to save difficulty:', error);
    }
    this.notifyStateChange();
  }

  /**
   * Get whether Tax Reimbursement is enabled (enemy bullets deduct score instead of lives).
   */
  public getTaxReimbursementEnabled(): boolean {
    return this.taxReimbursementEnabled;
  }

  /**
   * Enable / disable Tax Reimbursement. Persists to localStorage.
   */
  public setTaxReimbursementEnabled(enabled: boolean): void {
    if (this.taxReimbursementEnabled === enabled) return;
    this.taxReimbursementEnabled = enabled;
    try {
      localStorage.setItem(
        GameState.STORAGE_KEY_TAX_REIMBURSEMENT,
        enabled.toString()
      );
    } catch (error) {
      console.warn('Failed to save Tax Reimbursement flag:', error);
    }
    this.notifyStateChange();
  }

  /**
   * Get HUD stats visibility flags.
   */
  public getHudShowHighScore(): boolean {
    return this.hudShowHighScore;
  }

  public getHudShowLives(): boolean {
    return this.hudShowLives;
  }

  public getHudShowWeapon(): boolean {
    return this.hudShowWeapon;
  }

  /**
   * Set HUD stats visibility flags. Each persists independently.
   */
  public setHudShowHighScore(enabled: boolean): void {
    if (this.hudShowHighScore === enabled) return;
    this.hudShowHighScore = enabled;
    try {
      localStorage.setItem(
        GameState.STORAGE_KEY_HUD_SHOW_HIGH_SCORE,
        enabled.toString()
      );
    } catch (error) {
      console.warn('Failed to save HUD high score flag:', error);
    }
    this.notifyStateChange();
  }

  public setHudShowLives(enabled: boolean): void {
    if (this.hudShowLives === enabled) return;
    this.hudShowLives = enabled;
    try {
      localStorage.setItem(
        GameState.STORAGE_KEY_HUD_SHOW_LIVES,
        enabled.toString()
      );
    } catch (error) {
      console.warn('Failed to save HUD lives flag:', error);
    }
    this.notifyStateChange();
  }

  public setHudShowWeapon(enabled: boolean): void {
    if (this.hudShowWeapon === enabled) return;
    this.hudShowWeapon = enabled;
    try {
      localStorage.setItem(
        GameState.STORAGE_KEY_HUD_SHOW_WEAPON,
        enabled.toString()
      );
    } catch (error) {
      console.warn('Failed to save HUD weapon flag:', error);
    }
    this.notifyStateChange();
  }

  /**
   * Extra Life Executive Order – when enabled, the player has multiple
   * lives and earns extra lives every few points. When disabled, hits
   * trigger immediate game over instead of consuming a life.
   */
  public getExtraLifeEnabled(): boolean {
    return this.extraLifeEnabled;
  }

  public setExtraLifeEnabled(enabled: boolean): void {
    if (this.extraLifeEnabled === enabled) return;
    this.extraLifeEnabled = enabled;
    try {
      localStorage.setItem(
        GameState.STORAGE_KEY_EXTRA_LIFE_ENABLED,
        enabled.toString()
      );
    } catch (error) {
      console.warn('Failed to save Extra Life flag:', error);
    }
    this.notifyStateChange();
  }

  /**
   * Get whether the level countdown timer mechanic is enabled.
   */
  public getTimerEnabled(): boolean {
    return this.timerEnabled;
  }

  /**
   * Enable / disable the level countdown timer mechanic. Persists to localStorage.
   * When enabling, the timer is reset to its default duration for the next level start.
   */
  public setTimerEnabled(enabled: boolean): void {
    if (this.timerEnabled === enabled) return;
    this.timerEnabled = enabled;
    // Reset timer to default when (re-)enabling so the player always starts fresh.
    if (enabled) {
      this.timerSecondsRemaining = LEVEL_TIMER_DEFAULT_SECONDS;
    }
    try {
      localStorage.setItem(GameState.STORAGE_KEY_TIMER_ENABLED, enabled.toString());
    } catch (error) {
      console.warn('Failed to save timer enabled flag:', error);
    }
    this.notifyStateChange();
  }

  /**
   * Get remaining time on the level countdown timer in seconds.
   */
  public getTimerSecondsRemaining(): number {
    return this.timerSecondsRemaining;
  }

  /**
   * Set remaining time on the level countdown timer in seconds.
   * Value is clamped to be non-negative.
   */
  public setTimerSecondsRemaining(seconds: number): void {
    const clamped = Math.max(0, seconds);
    if (this.timerSecondsRemaining === clamped) return;
    this.timerSecondsRemaining = clamped;
    this.notifyStateChange();
  }

  /**
   * Get selected weapon (bullet type key from BULLET_TYPES).
   * If a powerup override is active (time- or shot-based), that type is returned instead.
   */
  public getSelectedBulletType(): string {
    const now = Date.now();
    if (this.powerupBulletTypeOverride != null) {
      // Shot-limited powerups (e.g. heavyMachineGun)
      if (this.powerupShotsRemaining != null) {
        if (this.powerupShotsRemaining > 0) {
          return this.powerupBulletTypeOverride;
        }
        // Shots exhausted: clear override
        this.powerupBulletTypeOverride = null;
        this.powerupShotsRemaining = null;
      } else {
        // Time-limited powerups (e.g. spreader)
        if (now < this.powerupOverrideExpiry) {
          return this.powerupBulletTypeOverride;
        }
        if (now >= this.powerupOverrideExpiry) {
          this.powerupBulletTypeOverride = null;
        }
      }
    }
    return this.selectedBulletType;
  }

  /**
   * Clear powerup weapon override (e.g. when player shoots, for testing: powerup lasts until first shot).
   */
  public clearPowerupOverride(): void {
    if (this.powerupExpiryTimeoutId != null) {
      clearTimeout(this.powerupExpiryTimeoutId);
      this.powerupExpiryTimeoutId = null;
    }
    if (this.powerupBulletTypeOverride != null) {
      this.powerupBulletTypeOverride = null;
      this.powerupShotsRemaining = null;
      this.notifyStateChange();
    }
  }

  /**
   * Set temporary bullet type from powerup.
   * - For most powerups (e.g. spreader) this is time-based (durationMs).
   * - For heavyMachineGun this is shot-based (50 shots).
   */
  public setPowerupBulletType(bulletType: string, durationMs: number): void {
    if (this.powerupExpiryTimeoutId != null) {
      clearTimeout(this.powerupExpiryTimeoutId);
      this.powerupExpiryTimeoutId = null;
    }
    // Powerup weapon override
    this.powerupBulletTypeOverride = bulletType;

    if (bulletType === 'heavyMachineGun') {
      // Shot-limited powerup: 50 shots, no time limit.
      this.powerupShotsRemaining = 50;
      this.powerupOverrideExpiry = 0;
    } else {
      // Time-limited powerup (e.g. spreader)
      this.powerupShotsRemaining = null;
      this.powerupOverrideExpiry = Date.now() + durationMs;
      this.powerupExpiryTimeoutId = setTimeout(() => {
        this.powerupExpiryTimeoutId = null;
        this.powerupBulletTypeOverride = null;
        this.notifyStateChange();
      }, durationMs);
    }

    // Powerup toast (HUD)
    this.clearPowerupMessageTimeout();
    this.powerupBulletTypeToast = bulletType;
    this.showPowerupMessage = true;
    this.powerupMessageTimeoutId = setTimeout(() => {
      this.powerupMessageTimeoutId = null;
      this.showPowerupMessage = false;
      this.notifyStateChange();
    }, 2200); // Slightly longer than HUD animation

    this.notifyStateChange();
  }

  /**
   * True while the powerup weapon override is active (player is immune to damage during this time).
   */
  public isPowerupActive(): boolean {
    const now = Date.now();
    if (this.powerupBulletTypeOverride == null) return false;
    if (this.powerupShotsRemaining != null) {
      return this.powerupShotsRemaining > 0;
    }
    return now < this.powerupOverrideExpiry;
  }

  /**
   * Notify GameState that the player has fired a shot.
   * Used to decrement shot-limited powerups like heavyMachineGun.
   */
  public handlePlayerShotFired(): void {
    if (this.powerupBulletTypeOverride === 'heavyMachineGun' && this.powerupShotsRemaining != null) {
      this.powerupShotsRemaining = Math.max(0, this.powerupShotsRemaining - 1);
      if (this.powerupShotsRemaining === 0) {
        this.powerupBulletTypeOverride = null;
      }
      this.notifyStateChange();
    }
  }

  /**
   * Set selected weapon. Persists to localStorage.
   */
  public setSelectedBulletType(bulletType: string): void {
    if (this.selectedBulletType === bulletType) return;
    this.selectedBulletType = bulletType;
    this.saveSelectedBulletType();
    this.notifyStateChange();
  }

  /**
   * Get selected player id (from player select screen).
   */
  public getSelectedPlayerId(): string {
    return this.selectedPlayerId;
  }

  /**
   * Set selected player. Also sets selectedBulletType to this player's weapon of choice.
   */
  public setSelectedPlayerId(playerId: string): void {
    const config = PLAYER_CONFIGS[playerId];
    if (!config) return;
    this.selectedPlayerId = playerId;
    this.selectedBulletType = config.weaponOfChoice;
    this.saveSelectedBulletType();
    this.notifyStateChange();
  }

  /**
   * Get selected enemy type id (for the current level).
   */
  public getSelectedEnemyTypeId(): string {
    return this.selectedEnemyTypeId;
  }

  /**
   * Set selected enemy type id (e.g. when entering pre-game or starting a level).
   */
  public setSelectedEnemyTypeId(enemyTypeId: string): void {
    this.selectedEnemyTypeId = enemyTypeId;
    this.notifyStateChange();
  }

  /**
   * Load high score from localStorage
   */
  private loadHighScore(): void {
    try {
      const saved = localStorage.getItem(GameState.STORAGE_KEY_HIGH_SCORE);
      if (saved) {
        this.highScore = parseInt(saved, 10);
      }
    } catch (error) {
      console.warn('Failed to load high score:', error);
    }
  }

  /**
   * Save high score to localStorage
   */
  private saveHighScore(): void {
    try {
      localStorage.setItem(GameState.STORAGE_KEY_HIGH_SCORE, this.highScore.toString());
    } catch (error) {
      console.warn('Failed to save high score:', error);
    }
  }

  /**
   * Reset high score (for testing or player request)
   */
  public resetHighScore(): void {
    this.highScore = 0;
    try {
      localStorage.removeItem(GameState.STORAGE_KEY_HIGH_SCORE);
    } catch (error) {
      console.warn('Failed to reset high score:', error);
    }
    this.notifyStateChange();
  }

  // Getters for individual values
  public getScore(): number { return this.score; }
  /** Score earned during the current wave/level only. */
  public getCurrentWaveScore(): number { return this.score - this.waveStartScore; }
  public getHighScore(): number { return this.highScore; }
  public getLives(): number { return this.lives; }
  public getWave(): number { return this.wave; }
  public getEnemiesRemaining(): number { return this.enemiesRemaining; }
  public getTotalEnemies(): number { return this.totalEnemies; }
  public getShotsFired(): number { return this.shotsfired; }
  public getHits(): number { return this.hits; }
}

// Export singleton instance
export const gameState = GameState.getInstance();

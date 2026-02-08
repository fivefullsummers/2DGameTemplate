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

// Interface for game state data
export interface IGameStateData {
  score: number;
  highScore: number;
  lives: number;
  wave: number;
  enemiesRemaining: number;
  totalEnemies: number;
  extraLifeAwarded: boolean;
  showExtraLifeMessage: boolean; // true only briefly after awarding, so message doesn't reappear next wave
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
  private highScore: number = 0;
  private lives: number = GAME_CONSTANTS.STARTING_LIVES;
  private wave: number = GAME_CONSTANTS.STARTING_WAVE;
  private enemiesRemaining: number = 0;
  private totalEnemies: number = 0;
  
  // Tracking for extra life
  private extraLifeAwarded: boolean = false;
  private showExtraLifeMessage: boolean = false;
  private extraLifeMessageTimeoutId: ReturnType<typeof setTimeout> | null = null;

  // Statistics
  private shotsfired: number = 0;
  private hits: number = 0;

  // Executive Orders (persisted to localStorage)
  private kingsModeEnabled: boolean = false;
  private bigRedButtonEnabled: boolean = false;
  private difficulty: GameDifficulty = 'medium';

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
    this.clearPowerupExpiryTimeout();
    this.score = 0;
    this.lives = GAME_CONSTANTS.STARTING_LIVES;
    this.wave = GAME_CONSTANTS.STARTING_WAVE;
    this.enemiesRemaining = totalEnemies;
    this.totalEnemies = totalEnemies;
    this.extraLifeAwarded = false;
    this.showExtraLifeMessage = false;
    this.shotsfired = 0;
    this.hits = 0;
    this.notifyStateChange();
  }

  /**
   * Initialize a new wave
   */
  public initWave(totalEnemies: number): void {
    this.clearExtraLifeMessageTimeout();
    this.showExtraLifeMessage = false;
    this.wave++;
    this.enemiesRemaining = totalEnemies;
    this.totalEnemies = totalEnemies;
    this.notifyStateChange();
  }

  /**
   * Reset the current wave (used for "replay level" without changing wave,
   * score, or lives).
   */
  public resetCurrentWave(totalEnemies: number): void {
    this.clearExtraLifeMessageTimeout();
    this.showExtraLifeMessage = false;
    this.enemiesRemaining = totalEnemies;
    this.totalEnemies = totalEnemies;
    this.notifyStateChange();
  }

  /**
   * Add points to score
   */
  public addScore(points: number): void {
    const previousScore = this.score;
    this.score += points;
    
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
      highScore: this.highScore,
      lives: this.lives,
      wave: this.wave,
      enemiesRemaining: this.enemiesRemaining,
      totalEnemies: this.totalEnemies,
      extraLifeAwarded: this.extraLifeAwarded,
      showExtraLifeMessage: this.showExtraLifeMessage,
      shotsfired: this.shotsfired,
      hits: this.hits,
      kingsModeEnabled: this.kingsModeEnabled,
      bigRedButtonEnabled: this.bigRedButtonEnabled,
      selectedBulletType: this.selectedBulletType,
      effectiveBulletType: this.getSelectedBulletType(),
      selectedPlayerId: this.selectedPlayerId,
      selectedEnemyTypeId: this.selectedEnemyTypeId,
      difficulty: this.difficulty,
    };
  }

  private clearExtraLifeMessageTimeout(): void {
    if (this.extraLifeMessageTimeoutId !== null) {
      clearTimeout(this.extraLifeMessageTimeoutId);
      this.extraLifeMessageTimeoutId = null;
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
   * Get selected weapon (bullet type key from BULLET_TYPES).
   * If a powerup override is active (within duration), that type is returned instead.
   */
  public getSelectedBulletType(): string {
    const now = Date.now();
    if (
      this.powerupBulletTypeOverride != null &&
      now < this.powerupOverrideExpiry
    ) {
      return this.powerupBulletTypeOverride;
    }
    if (now >= this.powerupOverrideExpiry && this.powerupBulletTypeOverride != null) {
      this.powerupBulletTypeOverride = null;
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
      this.notifyStateChange();
    }
  }

  /**
   * Set temporary bullet type from powerup (e.g. for 3 seconds).
   */
  public setPowerupBulletType(bulletType: string, durationMs: number): void {
    if (this.powerupExpiryTimeoutId != null) {
      clearTimeout(this.powerupExpiryTimeoutId);
      this.powerupExpiryTimeoutId = null;
    }
    this.powerupBulletTypeOverride = bulletType;
    this.powerupOverrideExpiry = Date.now() + durationMs;
    this.powerupExpiryTimeoutId = setTimeout(() => {
      this.powerupExpiryTimeoutId = null;
      this.powerupBulletTypeOverride = null;
      this.notifyStateChange();
    }, durationMs);
    this.notifyStateChange();
  }

  /**
   * True while the powerup weapon override is active (player is immune to damage during this time).
   */
  public isPowerupActive(): boolean {
    const now = Date.now();
    return (
      this.powerupBulletTypeOverride != null && now < this.powerupOverrideExpiry
    );
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

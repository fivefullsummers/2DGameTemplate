/**
 * GameState - Score and Game State Manager
 * Based on classic Space Invaders mechanics
 */

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
  EXTRA_LIFE_THRESHOLD: 1500,  // Award extra life at this score
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
  shotsfired: number;
  hits: number;
}

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
  
  // Statistics
  private shotsfired: number = 0;
  private hits: number = 0;
  
  // Callbacks for state changes
  private onStateChangeCallbacks: Array<(state: IGameStateData) => void> = [];

  private constructor() {
    this.loadHighScore();
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

  /**
   * Initialize game state for a new game
   */
  public initGame(totalEnemies: number): void {
    this.score = 0;
    this.lives = GAME_CONSTANTS.STARTING_LIVES;
    this.wave = GAME_CONSTANTS.STARTING_WAVE;
    this.enemiesRemaining = totalEnemies;
    this.totalEnemies = totalEnemies;
    this.extraLifeAwarded = false;
    this.shotsfired = 0;
    this.hits = 0;
    this.notifyStateChange();
  }

  /**
   * Initialize a new wave
   */
  public initWave(totalEnemies: number): void {
    this.wave++;
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
    
    // Check for extra life threshold
    if (!this.extraLifeAwarded && 
        previousScore < GAME_CONSTANTS.EXTRA_LIFE_THRESHOLD && 
        this.score >= GAME_CONSTANTS.EXTRA_LIFE_THRESHOLD) {
      this.addLife();
      this.extraLifeAwarded = true;
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
      shotsfired: this.shotsfired,
      hits: this.hits,
    };
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

  /**
   * Load high score from localStorage
   */
  private loadHighScore(): void {
    try {
      const saved = localStorage.getItem('spaceInvaders_highScore');
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
      localStorage.setItem('spaceInvaders_highScore', this.highScore.toString());
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
      localStorage.removeItem('spaceInvaders_highScore');
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

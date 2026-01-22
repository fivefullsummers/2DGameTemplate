/**
 * HUD Component - Heads-Up Display
 * Displays score, lives, wave, and other game information
 * Based on classic Space Invaders HUD design
 */

import { useEffect, useState } from 'react';
import { gameState, IGameStateData } from '../utils/GameState';
import './HUD.css';

interface HUDProps {
  showDebugInfo?: boolean;
}

const HUD = ({ showDebugInfo = false }: HUDProps) => {
  const [state, setState] = useState<IGameStateData>(gameState.getState());

  useEffect(() => {
    // Subscribe to game state changes
    const unsubscribe = gameState.subscribe((newState) => {
      setState(newState);
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  // Format score with leading zeros (classic arcade style)
  const formatScore = (score: number): string => {
    return score.toString().padStart(6, '0');
  };

  // Calculate progress percentage for wave
  const getWaveProgress = (): number => {
    if (state.totalEnemies === 0) return 0;
    const destroyed = state.totalEnemies - state.enemiesRemaining;
    return Math.round((destroyed / state.totalEnemies) * 100);
  };

  return (
    <div className="hud-container">
      {/* Top HUD Bar - Main Game Info */}
      <div className="hud-top">
        {/* Score Section */}
        <div className="hud-section hud-score">
          <div className="hud-label">SCORE</div>
          <div className="hud-value score-value">{formatScore(state.score)}</div>
        </div>

        {/* High Score Section */}
        <div className="hud-section hud-high-score">
          <div className="hud-label">HI-SCORE</div>
          <div className="hud-value high-score-value">{formatScore(state.highScore)}</div>
        </div>

        {/* Wave Section */}
        <div className="hud-section hud-wave">
          <div className="hud-label">WAVE</div>
          <div className="hud-value wave-value">{state.wave}</div>
        </div>

        {/* Lives Section */}
        <div className="hud-section hud-lives">
          <div className="hud-label">LIVES</div>
          <div className="hud-lives-display">
            {Array.from({ length: state.lives }).map((_, index) => (
              <div key={index} className="life-icon">▲</div>
            ))}
            {state.lives === 0 && <div className="game-over-indicator">GAME OVER</div>}
          </div>
        </div>
      </div>

      {/* Enemy Counter */}
      {/* <div className="hud-enemy-counter">
        <div className="enemy-counter-bar">
          <div className="enemy-counter-label">
            ENEMIES: {state.enemiesRemaining} / {state.totalEnemies}
          </div>
          <div className="enemy-progress-bar">
            <div 
              className="enemy-progress-fill"
              style={{ width: `${getWaveProgress()}%` }}
            />
          </div>
        </div>
      </div> */}

      {/* Debug Info (optional) */}
      {showDebugInfo && (
        <div className="hud-debug">
          <div className="debug-section">
            <span className="debug-label">Accuracy:</span>
            <span className="debug-value">{gameState.getAccuracy()}%</span>
          </div>
          <div className="debug-section">
            <span className="debug-label">Shots:</span>
            <span className="debug-value">{state.shotsfired}</span>
          </div>
          <div className="debug-section">
            <span className="debug-label">Hits:</span>
            <span className="debug-value">{state.hits}</span>
          </div>
        </div>
      )}

      {/* Wave Complete Message */}
      {state.enemiesRemaining === 0 && state.totalEnemies > 0 && (
        <div className="hud-message wave-complete">
          <div className="message-text">WAVE {state.wave} COMPLETE!</div>
          <div className="message-subtext">Get Ready...</div>
        </div>
      )}

      {/* Extra Life Message (shows briefly when awarded) */}
      {state.score >= 1500 && state.extraLifeAwarded && (
        <div className="hud-message extra-life-message">
          <div className="message-text">EXTRA LIFE!</div>
        </div>
      )}
    </div>
  );
};

export default HUD;

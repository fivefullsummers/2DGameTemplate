/**
 * HUD Component - Heads-Up Display
 * Displays score, lives, wave, and other game information
 * Based on classic Space Invaders HUD design
 */

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { gameState, IGameStateData } from '../utils/GameState';
import { BULLET_TYPES } from '../consts/bullet-config';
import './HUD.css';

interface HUDProps {
  showDebugInfo?: boolean;
}

const HUD = ({ showDebugInfo = false }: HUDProps) => {
  const [state, setState] = useState<IGameStateData>(gameState.getState());
  const extraLifeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Subscribe to game state changes
    const unsubscribe = gameState.subscribe((newState) => {
      setState(newState);
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  // Extra life toast: small in left corner, float up + fade out with GSAP
  useEffect(() => {
    if (!state.showExtraLifeMessage) return;
    const el = extraLifeRef.current;
    if (!el) return;

    gsap.killTweensOf(el);
    gsap.set(el, { y: 0, opacity: 1 });

    const tween = gsap.to(el, {
      y: -72,
      opacity: 0,
      duration: 2,
      ease: 'power2.out',
      overwrite: true,
    });

    return () => {
      tween.kill();
    };
  }, [state.showExtraLifeMessage]);

  // Format score with leading zeros (classic arcade style)
  const formatScore = (score: number): string => {
    return score.toString().padStart(6, '0');
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

        {/* Current weapon (bullet name) */}
        <div className="hud-section hud-weapon">
          <div className="hud-label">WEAPON</div>
          <div className="hud-value hud-weapon-name">
            {BULLET_TYPES[state.selectedBulletType]?.name ?? state.selectedBulletType ?? 'Basic Bullet'}
          </div>
        </div>

        {/* Executive Order: King's Mode indicator */}
        {state.kingsModeEnabled && (
          <div className="hud-section hud-executive-order">
            <div className="hud-executive-order-badge">KING'S MODE</div>
          </div>
        )}
      </div>

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

      {/* Extra Life toast: small, left corner, floats up and fades (GSAP) */}
      {state.showExtraLifeMessage && (
        <div ref={extraLifeRef} className="extra-life-toast">
          <span className="extra-life-toast-text">+1 LIFE</span>
        </div>
      )}
    </div>
  );
};

export default HUD;

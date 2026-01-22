/**
 * CollisionInfo - Display collision size information as HTML overlay
 */

import './CollisionInfo.css';

interface CollisionInfoProps {
  isVisible?: boolean;
  playerRadius: number;
  enemyRadius: number;
}

const CollisionInfo = ({ isVisible = true, playerRadius, enemyRadius }: CollisionInfoProps) => {
  if (!isVisible) return null;

  // Effective collision includes bullet radius
  const bulletRadius = 8;
  const effectivePlayerRadius = playerRadius + bulletRadius;

  return (
    <div className="collision-info-overlay">
      <div className="collision-info-box">
        <div className="collision-info-title">COLLISION BOUNDARIES</div>
        
        <div className="collision-info-item player">
          <div className="collision-indicator player-indicator"></div>
          <div className="collision-details">
            <div className="collision-label">Player Hitbox</div>
            <div className="collision-value">Base: {playerRadius.toFixed(1)}px</div>
            <div className="collision-value">+Bullet: {bulletRadius}px</div>
            <div className="collision-value effective">Effective: {effectivePlayerRadius.toFixed(1)}px</div>
          </div>
        </div>

        <div className="collision-info-item enemy">
          <div className="collision-indicator enemy-indicator"></div>
          <div className="collision-details">
            <div className="collision-label">Enemy</div>
            <div className="collision-value">Radius: {enemyRadius.toFixed(1)}px</div>
            <div className="collision-value">Diameter: {(enemyRadius * 2).toFixed(1)}px</div>
          </div>
        </div>

        <div className="collision-info-note">
          Thick green = Actual hit zone ({effectivePlayerRadius}px)<br/>
          Thin green = Player only ({playerRadius}px)<br/>
          Green dot = Center point<br/>
          Press 'C' to toggle
        </div>
      </div>
    </div>
  );
};

export default CollisionInfo;

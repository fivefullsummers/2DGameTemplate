/**
 * CollisionInfo - Display collision size information as HTML overlay
 */

import './CollisionInfo.css';

interface CollisionInfoProps {
  isVisible?: boolean;
  playerRadius: number;
  enemyRadius: number;
  /** Player bullet vs enemy bullet: hit when within this (px). */
  bulletVsBulletHitRadius?: number;
  /** When player bullet is within this (px) of enemy bullet, it's pulled toward it. */
  bulletAttractionRadius?: number;
}

const CollisionInfo = ({
  isVisible = true,
  playerRadius,
  enemyRadius,
  bulletVsBulletHitRadius,
  bulletAttractionRadius,
}: CollisionInfoProps) => {
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
            <div className="collision-label">Enemy (player bullet hit)</div>
            <div className="collision-value">Radius: {enemyRadius.toFixed(1)}px</div>
            <div className="collision-value">Diameter: {(enemyRadius * 2).toFixed(1)}px</div>
          </div>
        </div>

        {(bulletVsBulletHitRadius != null || bulletAttractionRadius != null) && (
          <div className="collision-info-item enemy">
            <div className="collision-details">
              <div className="collision-label">Player bullet vs enemy bullet</div>
              {bulletVsBulletHitRadius != null && (
                <div className="collision-value">Hit radius: {bulletVsBulletHitRadius}px</div>
              )}
              {bulletAttractionRadius != null && (
                <div className="collision-value">Attraction zone: {bulletAttractionRadius}px</div>
              )}
            </div>
          </div>
        )}

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

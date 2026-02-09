import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { powerupGunsUrl } from '../utils/assetLoader';
import {
  MOBILE_SHOOT_BUTTON_BOTTOM,
  MOBILE_SHOOT_BUTTON_SIZE,
} from '../consts/mobile-controls-config';
import { BULLET_TYPE_TO_GUN_FRAME, DEFAULT_GUN_FRAME } from '../consts/bullet-config';

interface MobileShootButtonProps {
  onShootStart: () => void;
  onShootEnd: () => void;
  shotCooldownInfo: { lastShotTime: number; fireRate: number } | null;
  /** Current effective bullet type (powerup or selected); used to pick gun sprite frame. */
  effectiveBulletType: string;
}

/** 5-frame spritesheet (guns.png); we show one frame via CSS. */
const GUN_FRAME_COUNT = 5;

const MobileShootButton = ({ onShootStart, onShootEnd, shotCooldownInfo, effectiveBulletType }: MobileShootButtonProps) => {
  const buttonRef = useRef<HTMLDivElement | null>(null);
  const [isPressed, setIsPressed] = useState(false);
  const frameIndex = Math.max(0, Math.min(BULLET_TYPE_TO_GUN_FRAME[effectiveBulletType] ?? DEFAULT_GUN_FRAME, GUN_FRAME_COUNT - 1));
  // Show one frame: img at 500% width, shifted by -frameIndex * (100/5)%
  const frameOffsetPercent = (frameIndex / GUN_FRAME_COUNT) * 100;

  // Animate background color from red (just fired) to green (ready)
  useEffect(() => {
    const el = buttonRef.current;
    if (!el) return;

    // If we don't have cooldown info or fireRate is 0, just set to ready (green).
    if (!shotCooldownInfo || shotCooldownInfo.fireRate <= 0) {
      gsap.set(el, { backgroundColor: 'rgba(0, 255, 102, 0.6)' }); // green
      return;
    }

    const { fireRate } = shotCooldownInfo;

    // Kill any existing tween on this element
    gsap.killTweensOf(el);

    // Start from red and ease to green over fireRate duration
    gsap.fromTo(
      el,
      { backgroundColor: 'rgba(255, 51, 51, 0.6)' },  // red
      {
        backgroundColor: 'rgba(0, 255, 102, 0.6)',    // green
        duration: fireRate / 1000,
        ease: 'power2.out',
      }
    );
  }, [shotCooldownInfo]);

  const handleStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    setIsPressed(true);
    onShootStart();
  };

  const handleEnd = () => {
    setIsPressed(false);
    onShootEnd();
  };

  // Raised 3D look: highlight top-left, shadow bottom; pressed = translate down + inset shadow
  const raisedShadow = '0 4px 0 rgba(0,40,0,0.6), 0 6px 8px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.25)';
  const pressedShadow = '0 1px 0 rgba(0,40,0,0.5), inset 0 2px 4px rgba(0,0,0,0.3), inset 0 -1px 0 rgba(255,255,255,0.1)';

  return (
    <div
      ref={buttonRef}
      onTouchStart={handleStart}
      onTouchEnd={handleEnd}
      onMouseDown={handleStart}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      style={{
        position: 'absolute',
        bottom: `${MOBILE_SHOOT_BUTTON_BOTTOM}px`,
        right: '20px',
        width: `${MOBILE_SHOOT_BUTTON_SIZE}px`,
        height: `${MOBILE_SHOOT_BUTTON_SIZE}px`,
        borderRadius: '50%',
        border: '3px solid rgba(255, 255, 255, 0.7)',
        boxShadow: isPressed ? pressedShadow : raisedShadow,
        transform: isPressed ? 'translateY(3px)' : 'translateY(0)',
        transition: 'box-shadow 0.08s ease, transform 0.08s ease',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        touchAction: 'none',
        userSelect: 'none',
        zIndex: 1000,
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          pointerEvents: 'none',
          overflow: 'hidden',
          borderRadius: '50%',
        }}
      >
        {powerupGunsUrl && (
          <img
            src={powerupGunsUrl}
            alt=""
            aria-hidden
            style={{
              height: '88%',
              width: '500%',
              maxWidth: 'none',
              objectFit: 'none',
              objectPosition: `left center`,
              transform: `translateX(-${frameOffsetPercent}%)`,
            }}
          />
        )}
      </div>
    </div>
  );
};

export default MobileShootButton;

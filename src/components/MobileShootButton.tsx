import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import gunImage from '../assets/hero/gun_image.png';
import {
  MOBILE_SHOOT_BUTTON_BOTTOM,
  MOBILE_SHOOT_BUTTON_SIZE,
} from '../consts/mobile-controls-config';

interface MobileShootButtonProps {
  onShoot: () => void;
  shotCooldownInfo: { lastShotTime: number; fireRate: number } | null;
}

const MobileShootButton = ({ onShoot, shotCooldownInfo }: MobileShootButtonProps) => {
  const buttonRef = useRef<HTMLDivElement | null>(null);
  const [isPressed, setIsPressed] = useState(false);

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

  // Debug logging: shoot button position vs screen on mobile.
  useEffect(() => {
    const logLayout = () => {
      if (typeof window === 'undefined') return;
      if (!buttonRef.current) return;

      const rect = buttonRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const windowWidth = window.innerWidth;

      // eslint-disable-next-line no-console
      console.log('[layout] MobileShootButton', {
        windowHeight,
        windowWidth,
        rectTop: rect.top,
        rectBottom: rect.bottom,
        rectHeight: rect.height,
        distanceFromBottom: windowHeight - rect.top,
        MOBILE_SHOOT_BUTTON_BOTTOM,
        MOBILE_SHOOT_BUTTON_SIZE,
      });
    };

    logLayout();
    window.addEventListener('resize', logLayout);
    return () => window.removeEventListener('resize', logLayout);
  }, []);

  const handleStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    setIsPressed(true);
    onShoot();
  };

  const handleEnd = () => {
    setIsPressed(false);
  };

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
        right: '30px',
        width: `${MOBILE_SHOOT_BUTTON_SIZE}px`,
        height: `${MOBILE_SHOOT_BUTTON_SIZE}px`,
        borderRadius: '50%',
        border: '3px solid rgba(255, 255, 255, 0.7)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        touchAction: 'none',
        userSelect: 'none',
        zIndex: 1000,
        cursor: 'pointer',
      }}
    >
      <img 
        src={gunImage} 
        alt="Shoot" 
        style={{ 
          width: '40px', 
          height: '40px',
          pointerEvents: 'none'
        }} 
      />
    </div>
  );
};

export default MobileShootButton;

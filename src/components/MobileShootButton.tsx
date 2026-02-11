import { useRef, useState } from 'react';
import {
  MOBILE_SHOOT_BUTTON_BOTTOM,
  MOBILE_SHOOT_BUTTON_SIZE,
} from '../consts/mobile-controls-config';

interface MobileShootButtonProps {
  onShootStart: () => void;
  onShootEnd: () => void;
  shotCooldownInfo: { lastShotTime: number; fireRate: number } | null;
  /** Current effective bullet type (powerup or selected); used to pick gun sprite frame. */
  effectiveBulletType: string;
}

const MobileShootButton = ({ onShootStart, onShootEnd }: MobileShootButtonProps) => {
  const buttonRef = useRef<HTMLDivElement | null>(null);
  const [isPressed, setIsPressed] = useState(false);

  const handleStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    setIsPressed(true);
    onShootStart();
  };

  const handleEnd = () => {
    setIsPressed(false);
    onShootEnd();
  };

  const opacity = isPressed ? 0.2 : 0.1;

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
        backgroundColor: `rgba(255, 0, 0, ${opacity})`,
        border: 'none',
        boxShadow: 'none',
        transform: isPressed ? 'scale(0.96)' : 'scale(1)',
        transition: 'transform 0.08s ease',
        touchAction: 'none',
        userSelect: 'none',
        zIndex: 1000,
        cursor: 'pointer',
      }}
    />
  );
};

export default MobileShootButton;

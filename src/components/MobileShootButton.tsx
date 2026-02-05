import { useState } from 'react';
import gunImage from '../assets/hero/gun_image.png';

interface MobileShootButtonProps {
  onShoot: () => void;
}

const MobileShootButton = ({ onShoot }: MobileShootButtonProps) => {
  const [isPressed, setIsPressed] = useState(false);

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
      onTouchStart={handleStart}
      onTouchEnd={handleEnd}
      onMouseDown={handleStart}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      style={{
        position: 'fixed',
        bottom: '30px',
        right: '30px',
        width: '60px',
        height: '60px',
        backgroundColor: isPressed 
          ? 'rgba(255, 100, 100, 0.6)' 
          : 'rgba(255, 50, 50, 0.4)',
        borderRadius: '50%',
        border: '3px solid rgba(255, 255, 255, 0.7)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        touchAction: 'none',
        userSelect: 'none',
        zIndex: 1000,
        cursor: 'pointer',
        transition: 'background-color 0.1s ease',
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

import { useEffect, useRef, useState } from 'react';
import { Direction } from '../types/common';

interface MobileJoystickProps {
  onDirectionChange: (direction: Direction | null) => void;
}

const MobileJoystick = ({ onDirectionChange }: MobileJoystickProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [currentDirection, setCurrentDirection] = useState<Direction | null>(null);
  const joystickRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef<HTMLDivElement>(null);

  const calculateDirection = (centerX: number, centerY: number, touchX: number, touchY: number): Direction | null => {
    const deltaX = touchX - centerX;
    const deltaY = touchY - centerY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Dead zone threshold
    if (distance < 10) {
      return null;
    }

    // Calculate angle in degrees
    const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

    // Determine direction based on angle (4 directions)
    if (angle >= -45 && angle < 45) {
      return 'RIGHT';
    } else if (angle >= 45 && angle < 135) {
      return 'DOWN';
    } else if (angle >= -135 && angle < -45) {
      return 'UP';
    } else {
      return 'LEFT';
    }
  };

  const handleStart = (clientX: number, clientY: number) => {
    setIsDragging(true);
    handleMove(clientX, clientY);
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!joystickRef.current || !stickRef.current) return;

    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const direction = calculateDirection(centerX, centerY, clientX, clientY);
    
    if (direction !== currentDirection) {
      setCurrentDirection(direction);
      onDirectionChange(direction);
    }

    // Update stick position visually
    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const maxDistance = 40; // Maximum distance the stick can move

    if (distance > maxDistance) {
      const angle = Math.atan2(deltaY, deltaX);
      stickRef.current.style.transform = `translate(${Math.cos(angle) * maxDistance}px, ${Math.sin(angle) * maxDistance}px)`;
    } else {
      stickRef.current.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    }
  };

  const handleEnd = () => {
    setIsDragging(false);
    setCurrentDirection(null);
    onDirectionChange(null);
    
    // Reset stick position
    if (stickRef.current) {
      stickRef.current.style.transform = 'translate(0px, 0px)';
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (!isDragging) return;
    const touch = e.touches[0];
    handleMove(touch.clientX, touch.clientY);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX, e.clientY);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      handleMove(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
      if (isDragging) {
        handleEnd();
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div
      ref={joystickRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleEnd}
      onMouseDown={handleMouseDown}
      style={{
        position: 'fixed',
        bottom: '80px',
        left: '80px',
        width: '120px',
        height: '120px',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '50%',
        border: '3px solid rgba(255, 255, 255, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        touchAction: 'none',
        userSelect: 'none',
        zIndex: 1000,
      }}
    >
      <div
        ref={stickRef}
        style={{
          width: '50px',
          height: '50px',
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          borderRadius: '50%',
          border: '2px solid rgba(255, 255, 255, 0.9)',
          transition: isDragging ? 'none' : 'transform 0.2s ease-out',
          pointerEvents: 'none',
        }}
      />
      
      {/* Direction indicators */}
      <div style={{
        position: 'absolute',
        top: '5px',
        fontSize: '20px',
        color: 'rgba(255, 255, 255, 0.6)',
        pointerEvents: 'none',
      }}>▲</div>
      <div style={{
        position: 'absolute',
        bottom: '5px',
        fontSize: '20px',
        color: 'rgba(255, 255, 255, 0.6)',
        pointerEvents: 'none',
      }}>▼</div>
      <div style={{
        position: 'absolute',
        left: '5px',
        fontSize: '20px',
        color: 'rgba(255, 255, 255, 0.6)',
        pointerEvents: 'none',
      }}>◄</div>
      <div style={{
        position: 'absolute',
        right: '5px',
        fontSize: '20px',
        color: 'rgba(255, 255, 255, 0.6)',
        pointerEvents: 'none',
      }}>►</div>
    </div>
  );
};

export default MobileJoystick;

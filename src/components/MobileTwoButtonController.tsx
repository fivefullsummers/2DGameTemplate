import { useCallback, useEffect, useState } from 'react';
import { Direction } from '../types/common';

interface MobileTwoButtonControllerProps {
  onDirectionChange: (direction: Direction | null) => void;
  onRunChange?: (isRunning: boolean) => void;
}

const MobileTwoButtonController = ({ onDirectionChange, onRunChange }: MobileTwoButtonControllerProps) => {
  const [leftPressed, setLeftPressed] = useState(false);
  const [rightPressed, setRightPressed] = useState(false);

  const calculateDirection = useCallback(
    (left: boolean, right: boolean): Direction | null => {
      if (left && !right) return 'LEFT';
      if (right && !left) return 'RIGHT';
      return null;
    },
    []
  );

  const updateDirection = useCallback(
    (left: boolean, right: boolean) => {
      const direction = calculateDirection(left, right);
      onDirectionChange(direction);
    },
    [calculateDirection, onDirectionChange]
  );

  useEffect(() => {
    updateDirection(leftPressed, rightPressed);
  }, [leftPressed, rightPressed, updateDirection]);

  // This controller doesn't handle running – always report walking.
  useEffect(() => {
    onRunChange?.(false);
  }, [onRunChange]);

  const handleLeftDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setLeftPressed(true);
  };

  const handleLeftUp = (e?: React.MouseEvent | React.TouchEvent) => {
    e?.preventDefault();
    setLeftPressed(false);
  };

  const handleRightDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setRightPressed(true);
  };

  const handleRightUp = (e?: React.MouseEvent | React.TouchEvent) => {
    e?.preventDefault();
    setRightPressed(false);
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '30px',
        left: '30px',
        width: '150px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 1000,
        pointerEvents: 'none',
      }}
    >
      {/* Left button */}
      <div
        onTouchStart={handleLeftDown}
        onTouchEnd={handleLeftUp}
        onMouseDown={handleLeftDown}
        onMouseUp={handleLeftUp}
        style={{
          pointerEvents: 'auto',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: leftPressed
            ? 'rgba(255, 255, 255, 0.9)'
            : 'rgba(255, 255, 255, 0.6)',
          border: '3px solid rgba(0, 0, 0, 0.4)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          boxShadow: leftPressed ? '0 0 15px rgba(255, 255, 255, 0.8)' : '0 4px 10px rgba(0, 0, 0, 0.4)',
          userSelect: 'none',
          touchAction: 'none',
        }}
      >
        <span
          style={{
            fontSize: '32px',
            color: 'rgba(0, 0, 0, 0.8)',
          }}
        >
          ◄
        </span>
      </div>

      {/* Right button */}
      <div
        onTouchStart={handleRightDown}
        onTouchEnd={handleRightUp}
        onMouseDown={handleRightDown}
        onMouseUp={handleRightUp}
        style={{
          pointerEvents: 'auto',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: rightPressed
            ? 'rgba(255, 255, 255, 0.9)'
            : 'rgba(255, 255, 255, 0.6)',
          border: '3px solid rgba(0, 0, 0, 0.4)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          boxShadow: rightPressed ? '0 0 15px rgba(255, 255, 255, 0.8)' : '0 4px 10px rgba(0, 0, 0, 0.4)',
          userSelect: 'none',
          touchAction: 'none',
        }}
      >
        <span
          style={{
            fontSize: '32px',
            color: 'rgba(0, 0, 0, 0.8)',
          }}
        >
          ►
        </span>
      </div>
    </div>
  );
};

export default MobileTwoButtonController;


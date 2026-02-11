import { useCallback, useEffect, useRef, useState } from 'react';
import { Direction } from '../types/common';
import {
  MOBILE_MOVE_BUTTON_BOTTOM,
  MOBILE_MOVE_BUTTON_SIZE,
} from '../consts/mobile-controls-config';

interface MobileTwoButtonControllerProps {
  onDirectionChange: (direction: Direction | null) => void;
  onRunChange?: (isRunning: boolean) => void;
}

const MobileTwoButtonController = ({ onDirectionChange, onRunChange }: MobileTwoButtonControllerProps) => {
  const [leftPressed, setLeftPressed] = useState(false);
  const [rightPressed, setRightPressed] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

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
      ref={containerRef}
      style={{
        position: 'absolute',
        bottom: `${MOBILE_MOVE_BUTTON_BOTTOM}px`,
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
          width: `${MOBILE_MOVE_BUTTON_SIZE}px`,
          height: `${MOBILE_MOVE_BUTTON_SIZE}px`,
          borderRadius: '50%',
          backgroundColor: leftPressed ? 'rgba(160, 160, 160, 0.2)' : 'rgba(160, 160, 160, 0.1)',
          border: 'none',
          boxShadow: 'none',
          userSelect: 'none',
          touchAction: 'none',
        }}
      />

      {/* Right button */}
      <div
        onTouchStart={handleRightDown}
        onTouchEnd={handleRightUp}
        onMouseDown={handleRightDown}
        onMouseUp={handleRightUp}
        style={{
          pointerEvents: 'auto',
          width: `${MOBILE_MOVE_BUTTON_SIZE}px`,
          height: `${MOBILE_MOVE_BUTTON_SIZE}px`,
          borderRadius: '50%',
          backgroundColor: rightPressed ? 'rgba(160, 160, 160, 0.2)' : 'rgba(160, 160, 160, 0.1)',
          border: 'none',
          boxShadow: 'none',
          userSelect: 'none',
          touchAction: 'none',
        }}
      />
    </div>
  );
};

export default MobileTwoButtonController;


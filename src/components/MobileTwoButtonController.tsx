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

  // Debug logging: button positions vs screen on mobile.
  useEffect(() => {
    const logLayout = () => {
      if (typeof window === 'undefined') return;
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const windowWidth = window.innerWidth;

      // eslint-disable-next-line no-console
      console.log('[layout] MobileTwoButtonController', {
        windowHeight,
        windowWidth,
        rectTop: rect.top,
        rectBottom: rect.bottom,
        rectHeight: rect.height,
        distanceFromBottom: windowHeight - rect.top,
        MOBILE_MOVE_BUTTON_BOTTOM,
        MOBILE_MOVE_BUTTON_SIZE,
      });
    };

    logLayout();
    window.addEventListener('resize', logLayout);
    return () => window.removeEventListener('resize', logLayout);
  }, []);

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
            lineHeight: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '1em',
            height: '1em',
            transform: 'translateX(-1px)',
          }}
          aria-hidden
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
          width: `${MOBILE_MOVE_BUTTON_SIZE}px`,
          height: `${MOBILE_MOVE_BUTTON_SIZE}px`,
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
            lineHeight: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '1em',
            height: '1em',
            transform: 'translateX(1px)',
          }}
          aria-hidden
        >
          ►
        </span>
      </div>
    </div>
  );
};

export default MobileTwoButtonController;


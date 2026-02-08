import {
  MOBILE_BIG_RED_BUTTON_BOTTOM,
  MOBILE_BIG_RED_BUTTON_SIZE,
  MOBILE_BIG_RED_BUTTON_RIGHT,
} from "../consts/mobile-controls-config";

interface BigRedButtonProps {
  onPress: () => void;
}

const BigRedButton = ({ onPress }: BigRedButtonProps) => {
  const handleStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    onPress();
  };

  const handleEnd = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
  };

  return (
    <div
      role="button"
      aria-label="Big Red Button – clear all enemies"
      onTouchStart={handleStart}
      onTouchEnd={handleEnd}
      onMouseDown={handleStart}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      style={{
        position: "absolute",
        bottom: `${MOBILE_BIG_RED_BUTTON_BOTTOM}px`,
        right: `${MOBILE_BIG_RED_BUTTON_RIGHT}px`,
        width: `${MOBILE_BIG_RED_BUTTON_SIZE}px`,
        height: `${MOBILE_BIG_RED_BUTTON_SIZE}px`,
        borderRadius: "50%",
        background: "linear-gradient(180deg, #e53935 0%, #b71c1c 50%, #8b0000 100%)",
        border: "3px solid rgba(255, 255, 255, 0.6)",
        boxShadow: "inset 0 2px 4px rgba(255,255,255,0.3), 0 2px 8px rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        touchAction: "none",
        userSelect: "none",
        zIndex: 1000,
        cursor: "pointer",
      }}
    >
      <span
        style={{
          color: "rgba(255,255,255,0.9)",
          fontSize: "10px",
          fontWeight: "bold",
          textAlign: "center",
          lineHeight: 1.1,
          pointerEvents: "none",
        }}
      >
        BIG RED
      </span>
    </div>
  );
};

export default BigRedButton;

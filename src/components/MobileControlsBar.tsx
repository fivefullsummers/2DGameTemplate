import { useEffect, useState } from "react";
import MobileTwoButtonController from "./MobileTwoButtonController";
import MobileShootButton from "./MobileShootButton";
import BigRedButton from "./BigRedButton";
import { useControlsContext } from "../contexts/ControlsContext";
import { isMobile } from "../consts/game-world";
import { gameState } from "../utils/GameState";

interface MobileControlsBarProps {
  onBigRedButtonPress?: () => void;
  bigRedButtonEnabled?: boolean;
}

const MobileControlsBar = ({
  onBigRedButtonPress,
  bigRedButtonEnabled = false,
}: MobileControlsBarProps) => {
  const {
    setJoystickDirection,
    setJoystickRun,
    triggerMobileShoot,
    shotCooldownInfo,
  } = useControlsContext();
  const [effectiveBulletType, setEffectiveBulletType] = useState(gameState.getState().effectiveBulletType);

  useEffect(() => {
    const unsubscribe = gameState.subscribe((state) => {
      setEffectiveBulletType(state.effectiveBulletType);
    });
    return unsubscribe;
  }, []);

  if (!isMobile()) {
    return null;
  }

  // This bar lives at the bottom of the screen (via marginTop: 'auto'
  // on its parent container in Experience.tsx). The individual
  // controls are absolutely positioned within this bar, anchored to
  // the bottom of the bar (not the viewport).
  return (
    <div
      id="mobile-controls-bar"
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        backgroundColor: "#050b30",
      }}
    >
      <MobileTwoButtonController
        onDirectionChange={setJoystickDirection}
        onRunChange={setJoystickRun}
      />
      {bigRedButtonEnabled && onBigRedButtonPress && (
        <BigRedButton onPress={onBigRedButtonPress} />
      )}
      <MobileShootButton
        onShoot={triggerMobileShoot}
        shotCooldownInfo={shotCooldownInfo}
        effectiveBulletType={effectiveBulletType}
      />
    </div>
  );
};

export default MobileControlsBar;


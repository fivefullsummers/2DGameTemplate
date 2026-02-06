import MobileTwoButtonController from "./MobileTwoButtonController";
import MobileShootButton from "./MobileShootButton";
import { useControlsContext } from "../contexts/ControlsContext";
import { isMobile } from "../consts/game-world";

const MobileControlsBar = () => {
  const {
    setJoystickDirection,
    setJoystickRun,
    triggerMobileShoot,
    shotCooldownInfo,
  } = useControlsContext();

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
      <MobileShootButton
        onShoot={triggerMobileShoot}
        shotCooldownInfo={shotCooldownInfo}
      />
    </div>
  );
};

export default MobileControlsBar;


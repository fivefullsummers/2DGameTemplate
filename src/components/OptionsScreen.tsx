import { Container, Stage, Text } from "@pixi/react";
import { useState, useMemo, useEffect, useRef } from "react";
import useDimensions from "../hooks/useDimensions";
import StartScreenBackground from "./StartScreenBackground";
import CRTOverlay from "./CRTOverlay";
import { TextStyle } from "pixi.js";
import { sound } from "@pixi/sound";
import { getSoundEnabled, setSoundEnabled } from "../utils/soundSettings";
import { useVisualSettings } from "../contexts/VisualSettingsContext";

const EXECUTIVE_ORDERS_PASSKEY = "MAGA";

const popupOverlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.85)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 10000,
  fontFamily: "Neopixel, sans-serif",
};
const popupFormStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
  border: "3px solid #00ff88",
  borderRadius: 12,
  padding: 24,
  minWidth: 280,
  maxWidth: 360,
  boxShadow: "0 0 30px rgba(0,255,136,0.3)",
};
const popupInputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  marginTop: 4,
  marginBottom: 12,
  fontSize: 14,
  fontFamily: "Neopixel, sans-serif",
  border: "2px solid #00ff88",
  borderRadius: 6,
  background: "#0d0d0d",
  color: "#fff",
  boxSizing: "border-box",
};
const popupButtonRowStyle: React.CSSProperties = {
  display: "flex",
  gap: 12,
  marginTop: 16,
  justifyContent: "center",
};
const popupBtnStyle: React.CSSProperties = {
  padding: "10px 20px",
  fontFamily: "Neopixel, sans-serif",
  fontSize: 14,
  fontWeight: "bold",
  border: "2px solid #00ff88",
  borderRadius: 6,
  background: "#0d0d0d",
  color: "#00ff88",
  cursor: "pointer",
};

function RetroScanlinesPopup({
  enabled,
  uScan,
  uWarp,
  onEnabledChange,
  onSettingsChange,
  onClose,
  playClick,
}: {
  enabled: boolean;
  uScan: number;
  uWarp: number;
  onEnabledChange: (v: boolean) => void;
  onSettingsChange: (s: { uScan?: number; uWarp?: number }) => void;
  onClose: () => void;
  playClick: () => void;
}) {
  const [scan, setScan] = useState(uScan);
  const [warp, setWarp] = useState(uWarp);
  useEffect(() => {
    setScan(uScan);
    setWarp(uWarp);
  }, [uScan, uWarp]);
  const handleDone = () => {
    playClick();
    onSettingsChange({ uScan: scan, uWarp: warp });
    onClose();
  };
  return (
    <div
      style={popupOverlayStyle}
      onClick={(e) => e.target === e.currentTarget && (playClick(), onClose())}
    >
      <div style={popupFormStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ color: "#00ff88", fontSize: 16, fontWeight: "bold", marginBottom: 12 }}>
          Retro scanlines
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <input
            type="checkbox"
            checked={enabled}
            onChange={() => onEnabledChange(!enabled)}
          />
          <span style={{ color: "#fff" }}>Enable</span>
        </label>
        <label style={{ display: "block", color: "#ccc", fontSize: 12, marginTop: 8 }}>
          Scanline intensity: {scan.toFixed(2)}
        </label>
        <input
          type="range"
          min={0}
          max={2}
          step={0.05}
          value={scan}
          onChange={(e) => setScan(Number(e.target.value))}
          style={{ ...popupInputStyle, marginBottom: 4 }}
        />
        <label style={{ display: "block", color: "#ccc", fontSize: 12, marginTop: 4 }}>
          Warp (curvature): {warp.toFixed(2)}
        </label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={warp}
          onChange={(e) => setWarp(Number(e.target.value))}
          style={{ ...popupInputStyle, marginBottom: 4 }}
        />
        <div style={popupButtonRowStyle}>
          <button type="button" style={popupBtnStyle} onClick={handleDone}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function MotionBlurPopup({
  enabled,
  settings,
  onEnabledChange,
  onSettingsChange,
  onClose,
  playClick,
}: {
  enabled: boolean;
  settings: { strength: number; decaySpeed: number; rampSpeed: number; movementScale: number };
  onEnabledChange: (v: boolean) => void;
  onSettingsChange: (s: Partial<typeof settings>) => void;
  onClose: () => void;
  playClick: () => void;
}) {
  const [strength, setStrength] = useState(settings.strength);
  const [decaySpeed, setDecaySpeed] = useState(settings.decaySpeed);
  const [rampSpeed, setRampSpeed] = useState(settings.rampSpeed);
  const [movementScale, setMovementScale] = useState(settings.movementScale);
  useEffect(() => {
    setStrength(settings.strength);
    setDecaySpeed(settings.decaySpeed);
    setRampSpeed(settings.rampSpeed);
    setMovementScale(settings.movementScale);
  }, [settings.strength, settings.decaySpeed, settings.rampSpeed, settings.movementScale]);
  const handleDone = () => {
    playClick();
    onSettingsChange({ strength, decaySpeed: decaySpeed, rampSpeed, movementScale });
    onClose();
  };
  return (
    <div
      style={popupOverlayStyle}
      onClick={(e) => e.target === e.currentTarget && (playClick(), onClose())}
    >
      <div style={popupFormStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ color: "#00ff88", fontSize: 16, fontWeight: "bold", marginBottom: 12 }}>
          Motion blur
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <input
            type="checkbox"
            checked={enabled}
            onChange={() => onEnabledChange(!enabled)}
          />
          <span style={{ color: "#fff" }}>Enable</span>
        </label>
        <label style={{ display: "block", color: "#ccc", fontSize: 12, marginTop: 8 }}>
          Strength: {Math.round(strength)}
        </label>
        <input
          type="range"
          min={1}
          max={40}
          step={1}
          value={strength}
          onChange={(e) => setStrength(Number(e.target.value))}
          style={{ ...popupInputStyle, marginBottom: 4 }}
        />
        <label style={{ display: "block", color: "#ccc", fontSize: 12, marginTop: 4 }}>
          Decay speed: {decaySpeed.toFixed(2)}
        </label>
        <input
          type="range"
          min={0.01}
          max={1}
          step={0.01}
          value={decaySpeed}
          onChange={(e) => setDecaySpeed(Number(e.target.value))}
          style={{ ...popupInputStyle, marginBottom: 4 }}
        />
        <label style={{ display: "block", color: "#ccc", fontSize: 12, marginTop: 4 }}>
          Ramp speed: {rampSpeed.toFixed(2)}
        </label>
        <input
          type="range"
          min={0.01}
          max={1}
          step={0.01}
          value={rampSpeed}
          onChange={(e) => setRampSpeed(Number(e.target.value))}
          style={{ ...popupInputStyle, marginBottom: 4 }}
        />
        <label style={{ display: "block", color: "#ccc", fontSize: 12, marginTop: 4 }}>
          Movement scale: {Math.round(movementScale)}
        </label>
        <input
          type="range"
          min={1}
          max={30}
          step={1}
          value={movementScale}
          onChange={(e) => setMovementScale(Number(e.target.value))}
          style={{ ...popupInputStyle, marginBottom: 4 }}
        />
        <div style={popupButtonRowStyle}>
          <button type="button" style={popupBtnStyle} onClick={handleDone}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

interface OptionsScreenProps {
  onBack: () => void;
  onOpenExecutiveOrders?: () => void;
}

const OptionsScreen = ({ onBack, onOpenExecutiveOrders }: OptionsScreenProps) => {
  const { width, height } = useDimensions();
  const {
    retroScanlinesEnabled,
    motionBlurEnabled,
    crtSettings,
    motionBlurSettings,
    setRetroScanlinesEnabled,
    setMotionBlurEnabled,
    setCRTSettings,
    setMotionBlurSettings,
  } = useVisualSettings();
  const [soundOn, setSoundOn] = useState(getSoundEnabled);
  const [hoverButton, setHoverButton] = useState<
    "sound" | "retro" | "motion" | "executive" | "back" | null
  >(null);
  const [showPasskeyPopup, setShowPasskeyPopup] = useState(false);
  const [passkeyInput, setPasskeyInput] = useState("");
  const [passkeyError, setPasskeyError] = useState("");
  const passkeyInputRef = useRef<HTMLInputElement>(null);
  const [settingsPopup, setSettingsPopup] = useState<"retro" | "motion" | null>(null);

  useEffect(() => {
    setSoundEnabled(soundOn);
  }, [soundOn]);

  const titleStyle = useMemo(
    () =>
      new TextStyle({
        fontFamily: "Neopixel",
        fontSize: 18,
        fontWeight: "bold",
        fill: ["#ffffff", "#00ff88"],
        stroke: "#000000",
        strokeThickness: 6,
        dropShadow: true,
        dropShadowColor: "#000000",
        dropShadowBlur: 8,
        dropShadowAngle: Math.PI / 6,
        dropShadowDistance: 6,
      }),
    []
  );

  const labelStyle = useMemo(
    () =>
      new TextStyle({
        fontFamily: "Neopixel",
        fontSize: 14,
        fill: "#ffffff",
        stroke: "#000000",
        strokeThickness: 2,
      }),
    []
  );

  const buttonStyle = useMemo(
    () =>
      new TextStyle({
        fontFamily: "Neopixel",
        fontSize: 14,
        fontWeight: "bold",
        fill: "#ffffff",
        stroke: "#000000",
        strokeThickness: 4,
        dropShadow: true,
        dropShadowColor: "#000000",
        dropShadowBlur: 4,
        dropShadowAngle: Math.PI / 6,
        dropShadowDistance: 3,
      }),
    []
  );

  const playClick = () => {
    if (!getSoundEnabled()) return;
    const clickSfx = sound.find("button-click");
    if (clickSfx) clickSfx.play({ volume: 0.4 });
  };

  const handleToggleSound = () => {
    setSoundOn((prev) => !prev);
  };

  const handleBack = () => {
    playClick();
    onBack();
  };

  const handleExecutiveOrdersClick = () => {
    playClick();
    if (onOpenExecutiveOrders) {
      setShowPasskeyPopup(true);
      setPasskeyInput("");
      setPasskeyError("");
      setTimeout(() => passkeyInputRef.current?.focus(), 100);
    }
  };

  const handlePasskeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passkeyInput.trim().toUpperCase() === EXECUTIVE_ORDERS_PASSKEY) {
      setShowPasskeyPopup(false);
      setPasskeyInput("");
      setPasskeyError("");
      onOpenExecutiveOrders?.();
    } else {
      setPasskeyError("Invalid PassKey");
    }
  };

  const handlePasskeyCancel = () => {
    setShowPasskeyPopup(false);
    setPasskeyInput("");
    setPasskeyError("");
  };

  const popupStyles: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.85)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10000,
    fontFamily: "Neopixel, sans-serif",
  };
  const formStyles: React.CSSProperties = {
    background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
    border: "3px solid #00ff88",
    borderRadius: 12,
    padding: 24,
    minWidth: 280,
    boxShadow: "0 0 30px rgba(0,255,136,0.3)",
  };
  const inputStyles: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    marginTop: 8,
    marginBottom: 8,
    fontSize: 16,
    fontFamily: "Neopixel, sans-serif",
    border: "2px solid #00ff88",
    borderRadius: 6,
    background: "#0d0d0d",
    color: "#fff",
    boxSizing: "border-box",
  };
  const buttonRowStyles: React.CSSProperties = {
    display: "flex",
    gap: 12,
    marginTop: 16,
    justifyContent: "center",
  };
  const btnStyles: React.CSSProperties = {
    padding: "10px 20px",
    fontFamily: "Neopixel, sans-serif",
    fontSize: 14,
    fontWeight: "bold",
    border: "2px solid #00ff88",
    borderRadius: 6,
    background: "#0d0d0d",
    color: "#00ff88",
    cursor: "pointer",
  };

  return (
    <>
    <Stage width={width} height={height}>
      <StartScreenBackground width={width} height={height} />

      <Container x={width / 2} y={height / 4}>
        <Text text="OPTIONS" anchor={0.5} style={titleStyle} />
      </Container>

      {/* Sound toggle */}
      <Container
        x={width / 2}
        y={height / 2 - 100}
        eventMode="static"
        cursor="pointer"
        pointerdown={handleToggleSound}
        pointerover={() => setHoverButton("sound")}
        pointerout={() => setHoverButton((prev) => (prev === "sound" ? null : prev))}
      >
        <Text
          text={`Sound: ${soundOn ? "On" : "Off"}`}
          anchor={0.5}
          style={labelStyle}
          scale={{
            x: hoverButton === "sound" ? 1.05 : 1,
            y: hoverButton === "sound" ? 1.05 : 1,
          }}
        />
      </Container>

      {/* Retro scanlines - click opens settings popup */}
      <Container
        x={width / 2}
        y={height / 2 - 50}
        eventMode="static"
        cursor="pointer"
        pointerdown={() => {
          playClick();
          setSettingsPopup("retro");
        }}
        pointerover={() => setHoverButton("retro")}
        pointerout={() => setHoverButton((prev) => (prev === "retro" ? null : prev))}
      >
        <Text
          text={`Retro scanlines: ${retroScanlinesEnabled ? "On" : "Off"}`}
          anchor={0.5}
          style={labelStyle}
          scale={{
            x: hoverButton === "retro" ? 1.05 : 1,
            y: hoverButton === "retro" ? 1.05 : 1,
          }}
        />
      </Container>

      {/* Motion blur - click opens settings popup */}
      <Container
        x={width / 2}
        y={height / 2}
        eventMode="static"
        cursor="pointer"
        pointerdown={() => {
          playClick();
          setSettingsPopup("motion");
        }}
        pointerover={() => setHoverButton("motion")}
        pointerout={() => setHoverButton((prev) => (prev === "motion" ? null : prev))}
      >
        <Text
          text={`Motion blur: ${motionBlurEnabled ? "On" : "Off"}`}
          anchor={0.5}
          style={labelStyle}
          scale={{
            x: hoverButton === "motion" ? 1.05 : 1,
            y: hoverButton === "motion" ? 1.05 : 1,
          }}
        />
      </Container>

      {/* Executive Orders */}
      {onOpenExecutiveOrders && (
        <Container
          x={width / 2}
          y={height / 2 + 50}
          eventMode="static"
          cursor="pointer"
          pointerdown={handleExecutiveOrdersClick}
          pointerover={() => setHoverButton("executive")}
          pointerout={() => setHoverButton((prev) => (prev === "executive" ? null : prev))}
        >
          <Text
            text="EXECUTIVE ORDERS"
            anchor={0.5}
            style={buttonStyle}
            scale={{
              x: hoverButton === "executive" ? 1.1 : 1,
              y: hoverButton === "executive" ? 1.1 : 1,
            }}
          />
        </Container>
      )}

      {/* Back button */}
      <Container
        x={width / 2}
        y={height / 2 + 140}
        eventMode="static"
        cursor="pointer"
        pointerdown={handleBack}
        pointerover={() => setHoverButton("back")}
        pointerout={() => setHoverButton((prev) => (prev === "back" ? null : prev))}
      >
        <Text
          text="BACK"
          anchor={0.5}
          style={buttonStyle}
          scale={{
            x: hoverButton === "back" ? 1.1 : 1,
            y: hoverButton === "back" ? 1.1 : 1,
          }}
        />
      </Container>

      {retroScanlinesEnabled && (
        <CRTOverlay
          width={width}
          height={height}
          uScan={crtSettings.uScan}
          uWarp={crtSettings.uWarp}
        />
      )}
    </Stage>

      {/* Retro scanlines settings popup */}
      {settingsPopup === "retro" && (
        <RetroScanlinesPopup
          enabled={retroScanlinesEnabled}
          uScan={crtSettings.uScan}
          uWarp={crtSettings.uWarp}
          onEnabledChange={setRetroScanlinesEnabled}
          onSettingsChange={setCRTSettings}
          onClose={() => setSettingsPopup(null)}
          playClick={playClick}
        />
      )}

      {/* Motion blur settings popup */}
      {settingsPopup === "motion" && (
        <MotionBlurPopup
          enabled={motionBlurEnabled}
          settings={motionBlurSettings}
          onEnabledChange={setMotionBlurEnabled}
          onSettingsChange={setMotionBlurSettings}
          onClose={() => setSettingsPopup(null)}
          playClick={playClick}
        />
      )}

      {showPasskeyPopup && (
        <div style={popupStyles} onClick={(e) => e.target === e.currentTarget && handlePasskeyCancel()}>
          <form style={formStyles} onSubmit={handlePasskeySubmit} onClick={(e) => e.stopPropagation()}>
            <div style={{ color: "#00ff88", fontSize: 16, fontWeight: "bold", marginBottom: 8 }}>
              Enter the Presidential PassKey
            </div>
            <input
              ref={passkeyInputRef}
              type="password"
              value={passkeyInput}
              onChange={(e) => setPasskeyInput(e.target.value)}
              placeholder="PassKey"
              style={inputStyles}
              autoComplete="off"
            />
            {passkeyError && (
              <div style={{ color: "#ff4444", fontSize: 12, marginBottom: 8 }}>{passkeyError}</div>
            )}
            <div style={buttonRowStyles}>
              <button type="button" style={btnStyles} onClick={handlePasskeyCancel}>
                Cancel
              </button>
              <button type="submit" style={btnStyles}>
                Submit
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default OptionsScreen;

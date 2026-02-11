import { Container, Stage, Text } from "@pixi/react";
import { useState, useMemo, useEffect, useRef } from "react";
import useDimensions from "../hooks/useDimensions";
import StartScreenBackground from "./StartScreenBackground";
import TiledDitherBackground from "./TiledDitherBackground";
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

/** Gate popup: warns that FX settings are for good GPUs, then continues to FX popup. */
function FxSettingsGatePopup({
  onContinue,
  onCancel,
  playClick,
}: {
  onContinue: () => void;
  onCancel: () => void;
  playClick: () => void;
}) {
  return (
    <div
      style={popupOverlayStyle}
      onClick={(e) => e.target === e.currentTarget && (playClick(), onCancel())}
    >
      <div style={{ ...popupFormStyle, maxWidth: 340 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ color: "#00ff88", fontSize: 16, fontWeight: "bold", marginBottom: 12 }}>
          FX Settings
        </div>
        <p style={{ color: "#ccc", fontSize: 13, lineHeight: 1.5, marginBottom: 16 }}>
          These settings are for devices with good GPUs. Scanlines, motion blur, and dither
          backgrounds may affect performance on some phones.
        </p>
        <p style={{ color: "#aaa", fontSize: 12, marginBottom: 16 }}>Continue to edit these settings?</p>
        <div style={popupButtonRowStyle}>
          <button type="button" style={popupBtnStyle} onClick={() => { playClick(); onCancel(); }}>
            Cancel
          </button>
          <button type="button" style={popupBtnStyle} onClick={() => { playClick(); onContinue(); }}>
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

const shaderUnavailableNoteStyle: React.CSSProperties = {
  color: "#ffaa00",
  fontSize: 12,
  lineHeight: 1.4,
  marginBottom: 14,
  padding: "8px 10px",
  background: "rgba(255,170,0,0.12)",
  borderRadius: 6,
  border: "1px solid rgba(255,170,0,0.4)",
};

/** Combined FX popup: scanlines, motion blur, dither. When shadersSupported is false, scanlines and motion blur are disabled. */
function FxSettingsPopup({
  shadersSupported,
  retroEnabled,
  uScan,
  uWarp,
  motionEnabled,
  motionSettings,
  ditherEnabled,
  onRetroChange,
  onCRTSettingsChange,
  onMotionChange,
  onMotionSettingsChange,
  onDitherChange,
  onClose,
  playClick,
}: {
  shadersSupported: boolean;
  retroEnabled: boolean;
  uScan: number;
  uWarp: number;
  motionEnabled: boolean;
  motionSettings: { strength: number; decaySpeed: number; rampSpeed: number; movementScale: number };
  ditherEnabled: boolean;
  onRetroChange: (v: boolean) => void;
  onCRTSettingsChange: (s: { uScan?: number; uWarp?: number }) => void;
  onMotionChange: (v: boolean) => void;
  onMotionSettingsChange: (s: Partial<typeof motionSettings>) => void;
  onDitherChange: (v: boolean) => void;
  onClose: () => void;
  playClick: () => void;
}) {
  const [scan, setScan] = useState(uScan);
  const [warp, setWarp] = useState(uWarp);
  const [strength, setStrength] = useState(motionSettings.strength);
  const [decaySpeed, setDecaySpeed] = useState(motionSettings.decaySpeed);
  const [rampSpeed, setRampSpeed] = useState(motionSettings.rampSpeed);
  const [movementScale, setMovementScale] = useState(motionSettings.movementScale);
  useEffect(() => {
    setScan(uScan);
    setWarp(uWarp);
    setStrength(motionSettings.strength);
    setDecaySpeed(motionSettings.decaySpeed);
    setRampSpeed(motionSettings.rampSpeed);
    setMovementScale(motionSettings.movementScale);
  }, [uScan, uWarp, motionSettings.strength, motionSettings.decaySpeed, motionSettings.rampSpeed, motionSettings.movementScale]);

  const handleDone = () => {
    playClick();
    onClose();
    requestAnimationFrame(() => {
      onCRTSettingsChange({ uScan: scan, uWarp: warp });
      onMotionSettingsChange({ strength, decaySpeed: decaySpeed, rampSpeed, movementScale });
    });
  };

  return (
    <div
      style={popupOverlayStyle}
      onClick={(e) => e.target === e.currentTarget && (playClick(), onClose())}
    >
      <div style={{ ...popupFormStyle, maxWidth: 320, maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ color: "#00ff88", fontSize: 16, fontWeight: "bold", marginBottom: 14 }}>
          FX Settings
        </div>

        {!shadersSupported && (
          <p style={shaderUnavailableNoteStyle}>
            Shader effects (scanlines, motion blur) are unavailable on this device. You can still use the dither background below.
          </p>
        )}

        <div style={{ marginBottom: 14, opacity: shadersSupported ? 1 : 0.5, pointerEvents: shadersSupported ? "auto" : "none" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <input type="checkbox" checked={retroEnabled} onChange={() => onRetroChange(!retroEnabled)} disabled={!shadersSupported} />
            <span style={{ color: "#fff" }}>Retro scanlines</span>
          </label>
          <label style={{ display: "block", color: "#ccc", fontSize: 11 }}>Intensity: {scan.toFixed(2)}</label>
          <input type="range" min={0} max={2} step={0.05} value={scan} onChange={(e) => setScan(Number(e.target.value))} style={{ ...popupInputStyle, marginBottom: 2 }} disabled={!shadersSupported} />
          <label style={{ display: "block", color: "#ccc", fontSize: 11 }}>Warp: {warp.toFixed(2)}</label>
          <input type="range" min={0} max={1} step={0.05} value={warp} onChange={(e) => setWarp(Number(e.target.value))} style={{ ...popupInputStyle, marginBottom: 0 }} disabled={!shadersSupported} />
        </div>

        <div style={{ marginBottom: 14, opacity: shadersSupported ? 1 : 0.5, pointerEvents: shadersSupported ? "auto" : "none" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <input type="checkbox" checked={motionEnabled} onChange={() => onMotionChange(!motionEnabled)} disabled={!shadersSupported} />
            <span style={{ color: "#fff" }}>Motion blur</span>
          </label>
          <label style={{ display: "block", color: "#ccc", fontSize: 11 }}>Strength: {Math.round(strength)}</label>
          <input type="range" min={1} max={40} step={1} value={strength} onChange={(e) => setStrength(Number(e.target.value))} style={{ ...popupInputStyle, marginBottom: 2 }} disabled={!shadersSupported} />
          <label style={{ display: "block", color: "#ccc", fontSize: 11 }}>Decay: {decaySpeed.toFixed(2)}</label>
          <input type="range" min={0.01} max={1} step={0.01} value={decaySpeed} onChange={(e) => setDecaySpeed(Number(e.target.value))} style={{ ...popupInputStyle, marginBottom: 0 }} disabled={!shadersSupported} />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input type="checkbox" checked={ditherEnabled} onChange={() => onDitherChange(!ditherEnabled)} />
            <span style={{ color: "#fff" }}>Dither background</span>
          </label>
        </div>

        <p style={{ color: "#888", fontSize: 11, marginBottom: 12 }}>
          Changes apply immediately. If the game feels slow, turn effects off or restart.
        </p>
        <div style={{ ...popupButtonRowStyle, flexWrap: "wrap" }}>
          <button type="button" style={popupBtnStyle} onClick={() => { window.location.reload(); }}>
            Restart game
          </button>
          <button type="button" style={popupBtnStyle} onClick={handleDone}>Done</button>
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
    ditherEnabled,
    crtSettings,
    motionBlurSettings,
    shadersSupported,
    setRetroScanlinesEnabled,
    setMotionBlurEnabled,
    setDitherEnabled,
    setCRTSettings,
    setMotionBlurSettings,
  } = useVisualSettings();
  const [soundOn, setSoundOn] = useState(getSoundEnabled);
  const [hoverButton, setHoverButton] = useState<
    "sound" | "fx" | "executive" | "back" | null
  >(null);
  const [showPasskeyPopup, setShowPasskeyPopup] = useState(false);
  const [passkeyInput, setPasskeyInput] = useState("");
  const [passkeyError, setPasskeyError] = useState("");
  const passkeyInputRef = useRef<HTMLInputElement>(null);
  const [fxGateOpen, setFxGateOpen] = useState(false);
  const [fxPopupOpen, setFxPopupOpen] = useState(false);

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
      {!ditherEnabled && (
        <TiledDitherBackground width={width} height={height} />
      )}
      {ditherEnabled && (
        <StartScreenBackground width={width} height={height} ditherEnabled={true} />
      )}

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

      {/* FX Settings: gate popup only when shaders supported; otherwise open FX popup directly */}
      <Container
        x={width / 2}
        y={height / 2 - 50}
        eventMode="static"
        cursor="pointer"
        pointerdown={() => {
          playClick();
          if (shadersSupported) {
            setFxGateOpen(true);
          } else {
            setFxPopupOpen(true);
          }
        }}
        pointerover={() => setHoverButton("fx")}
        pointerout={() => setHoverButton((prev) => (prev === "fx" ? null : prev))}
      >
        <Text
          text="FX SETTINGS"
          anchor={0.5}
          style={labelStyle}
          scale={{
            x: hoverButton === "fx" ? 1.05 : 1,
            y: hoverButton === "fx" ? 1.05 : 1,
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

      {shadersSupported && retroScanlinesEnabled && (
        <CRTOverlay
          width={width}
          height={height}
          uScan={crtSettings.uScan}
          uWarp={crtSettings.uWarp}
        />
      )}
    </Stage>

      {fxGateOpen && (
        <FxSettingsGatePopup
          onContinue={() => { setFxGateOpen(false); setFxPopupOpen(true); }}
          onCancel={() => setFxGateOpen(false)}
          playClick={playClick}
        />
      )}

      {fxPopupOpen && (
        <FxSettingsPopup
          shadersSupported={shadersSupported}
          retroEnabled={retroScanlinesEnabled}
          uScan={crtSettings.uScan}
          uWarp={crtSettings.uWarp}
          motionEnabled={motionBlurEnabled}
          motionSettings={motionBlurSettings}
          ditherEnabled={ditherEnabled}
          onRetroChange={setRetroScanlinesEnabled}
          onCRTSettingsChange={setCRTSettings}
          onMotionChange={setMotionBlurEnabled}
          onMotionSettingsChange={setMotionBlurSettings}
          onDitherChange={setDitherEnabled}
          onClose={() => setFxPopupOpen(false)}
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

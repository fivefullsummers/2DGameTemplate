import { Container, Stage, Text } from "@pixi/react";
import { useState, useMemo, useEffect, useRef } from "react";
import useDimensions from "../hooks/useDimensions";
import StartScreenBackground from "./StartScreenBackground";
import { TextStyle } from "pixi.js";
import { sound } from "@pixi/sound";
import { getSoundEnabled, setSoundEnabled } from "../utils/soundSettings";

const EXECUTIVE_ORDERS_PASSKEY = "MAGA";

interface OptionsScreenProps {
  onBack: () => void;
  onOpenExecutiveOrders?: () => void;
}

const OptionsScreen = ({ onBack, onOpenExecutiveOrders }: OptionsScreenProps) => {
  const { width, height } = useDimensions();
  const [soundOn, setSoundOn] = useState(getSoundEnabled);
  const [hoverButton, setHoverButton] = useState<"sound" | "executive" | "back" | null>(null);
  const [showPasskeyPopup, setShowPasskeyPopup] = useState(false);
  const [passkeyInput, setPasskeyInput] = useState("");
  const [passkeyError, setPasskeyError] = useState("");
  const passkeyInputRef = useRef<HTMLInputElement>(null);

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
    const clickSfx = sound.find("explosion-sound");
    if (clickSfx) {
      clickSfx.play({ volume: 0.3 });
    }
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
        y={height / 2 - 60}
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

      {/* Executive Orders */}
      {onOpenExecutiveOrders && (
        <Container
          x={width / 2}
          y={height / 2}
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
        y={height / 2 + 90}
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
    </Stage>

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

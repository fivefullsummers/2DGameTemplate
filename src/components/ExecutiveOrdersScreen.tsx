import { Container, Stage, Text } from "@pixi/react";
import { useState, useMemo, useEffect, useRef } from "react";
import useDimensions from "../hooks/useDimensions";
import StartScreenBackground from "./StartScreenBackground";
import { TextStyle } from "pixi.js";
import { sound } from "@pixi/sound";
import { gameState } from "../utils/GameState";
import { BULLET_TYPES } from "../consts/bullet-config";
import "./ExecutiveOrdersScreen.css";

interface ExecutiveOrdersScreenProps {
  onBack: () => void;
}

const BULLET_TYPE_KEYS = Object.keys(BULLET_TYPES) as string[];

const ExecutiveOrdersScreen = ({ onBack }: ExecutiveOrdersScreenProps) => {
  const { width, height } = useDimensions();
  const [hoverButton, setHoverButton] = useState<"back" | "kings" | "bigred" | null>(null);
  const [kingsMode, setKingsMode] = useState(gameState.getKingsMode());
  const [bigRedButtonEnabled, setBigRedButtonEnabled] = useState(gameState.getBigRedButtonEnabled());
  const [selectedBulletType, setSelectedBulletType] = useState(gameState.getSelectedBulletType());
  const [weaponDropdownOpen, setWeaponDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = gameState.subscribe((state) => {
      setKingsMode(state.kingsModeEnabled);
      setBigRedButtonEnabled(state.bigRedButtonEnabled);
      setSelectedBulletType(state.selectedBulletType);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!weaponDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setWeaponDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [weaponDropdownOpen]);

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

  const optionTitleStyle = useMemo(
    () =>
      new TextStyle({
        fontFamily: "Neopixel",
        fontSize: 14,
        fontWeight: "bold",
        fill: "#ffffff",
        stroke: "#000000",
        strokeThickness: 3,
      }),
    []
  );

  const optionDescStyle = useMemo(
    () =>
      new TextStyle({
        fontFamily: "Neopixel",
        fontSize: 11,
        fill: "#aaaaaa",
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
    const clickSfx = sound.find("explosion-sound");
    if (clickSfx) {
      clickSfx.play({ volume: 0.3 });
    }
  };

  const handleBack = () => {
    playClick();
    onBack();
  };

  const handleKingsModeToggle = () => {
    playClick();
    gameState.setKingsMode(!gameState.getKingsMode());
  };

  const handleBigRedButtonToggle = () => {
    playClick();
    gameState.setBigRedButtonEnabled(!gameState.getBigRedButtonEnabled());
  };

  const playBulletSound = (bulletType: string) => {
    const config = BULLET_TYPES[bulletType];
    const soundId = config?.soundId ?? "pound-sound";
    const s = sound.find(soundId);
    if (s) s.play({ volume: 0.5 });
  };

  const handleWeaponSelect = (bulletType: string) => {
    playBulletSound(bulletType);
    gameState.setSelectedBulletType(bulletType);
    setSelectedBulletType(bulletType);
    setWeaponDropdownOpen(false);
  };

  const currentBulletConfig = BULLET_TYPES[selectedBulletType] ?? BULLET_TYPES.basic;

  return (
    <div className="executive-orders-wrap" style={{ width, height }}>
      <Stage width={width} height={height}>
        <StartScreenBackground width={width} height={height} />

        <Container x={width / 2} y={height / 6}>
          <Text text="EXECUTIVE ORDERS" anchor={0.5} style={titleStyle} />
        </Container>

        {/* King's Mode - GOD MODE (toggle) */}
      <Container
        x={width / 2}
        y={height / 2 - 40}
        eventMode="static"
        cursor="pointer"
        pointerdown={handleKingsModeToggle}
        pointerover={() => setHoverButton("kings")}
        pointerout={() => setHoverButton(null)}
      >
        <Text
          text="King's Mode"
          anchor={0.5}
          style={optionTitleStyle}
          scale={{
            x: hoverButton === "kings" ? 1.05 : 1,
            y: hoverButton === "kings" ? 1.05 : 1,
          }}
        />
        <Text text="(GOD MODE)" anchor={0.5} style={optionDescStyle} y={20} />
        <Text
          text={kingsMode ? "[ ON ]" : "[ OFF ]"}
          anchor={0.5}
          style={optionDescStyle}
          y={38}
          tint={kingsMode ? 0x00ff88 : 0x888888}
        />
      </Container>

      {/* Big Red Button: red button on screen; when pressed, all enemies die in spreader-style wave */}
      <Container
        x={width / 2}
        y={height / 2 + 10}
        eventMode="static"
        cursor="pointer"
        pointerdown={handleBigRedButtonToggle}
        pointerover={() => setHoverButton("bigred")}
        pointerout={() => setHoverButton(null)}
      >
        <Text
          text="Big Red Button"
          anchor={0.5}
          style={optionTitleStyle}
          scale={{
            x: hoverButton === "bigred" ? 1.05 : 1,
            y: hoverButton === "bigred" ? 1.05 : 1,
          }}
        />
        <Text text="Red button next to shoot; clears wave in a wave of explosions" anchor={0.5} style={optionDescStyle} y={20} />
        <Text
          text={bigRedButtonEnabled ? "[ ON ]" : "[ OFF ]"}
          anchor={0.5}
          style={optionDescStyle}
          y={38}
          tint={bigRedButtonEnabled ? 0xff4444 : 0x888888}
        />
      </Container>

      <Container
        x={width / 2}
        y={height / 2 + 100}
        eventMode="static"
        cursor="pointer"
        pointerdown={handleBack}
        pointerover={() => setHoverButton("back")}
        pointerout={() => setHoverButton(null)}
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

      {/* Weapon dropdown: HTML overlay outside Stage so Pixi reconciler doesn't touch DOM */}
      <div className="executive-orders-overlay">
        <div className="weapon-dropdown-wrap" ref={dropdownRef}>
          <div className="weapon-dropdown-label">WEAPON</div>
          <button
            type="button"
            className="weapon-dropdown-trigger"
            onClick={() => setWeaponDropdownOpen((o) => !o)}
            aria-haspopup="listbox"
            aria-expanded={weaponDropdownOpen}
          >
            <div className="weapon-sprite-placeholder" aria-hidden />
            <span>{currentBulletConfig.name}</span>
          </button>
          {weaponDropdownOpen && (
            <ul className="weapon-dropdown-list" role="listbox">
              {BULLET_TYPE_KEYS.map((key) => {
                const config = BULLET_TYPES[key];
                return (
                  <li key={key} role="option" aria-selected={selectedBulletType === key}>
                    <button
                      type="button"
                      className={`weapon-dropdown-option ${selectedBulletType === key ? "selected" : ""}`}
                      onClick={() => handleWeaponSelect(key)}
                    >
                      <div className="weapon-sprite-placeholder" aria-hidden />
                      <span>{config.name}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExecutiveOrdersScreen;

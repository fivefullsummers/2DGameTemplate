import { Container, Stage, Text } from "@pixi/react";
import { useState, useMemo, useEffect } from "react";
import useDimensions from "../hooks/useDimensions";
import StartScreenBackground from "./StartScreenBackground";
import TiledDitherBackground from "./TiledDitherBackground";
import CRTOverlay from "./CRTOverlay";
import { TextStyle } from "pixi.js";
import { sound } from "@pixi/sound";
import { gameState, type GameDifficulty } from "../utils/GameState";
import { useVisualSettings } from "../contexts/VisualSettingsContext";
import "./ExecutiveOrdersScreen.css";

interface ExecutiveOrdersScreenProps {
  onBack: () => void;
}

const ExecutiveOrdersScreen = ({ onBack }: ExecutiveOrdersScreenProps) => {
  const { width, height: logicalHeight } = useDimensions();
  // For Executive Orders, stretch the shader to the full viewport height so
  // the dithered background cleanly fills 100vh on mobile as well as desktop.
  const height =
    typeof window !== "undefined" && window.innerHeight
      ? window.innerHeight
      : logicalHeight;
  const { retroScanlinesEnabled, ditherEnabled, crtSettings } = useVisualSettings();
  const [hoverButton, setHoverButton] = useState<
    | "back"
    | "kings"
    | "bigred"
    | "tax"
    | "timer"
    | "hud"
    | "diff-i"
    | "diff-o"
    | "diff-u"
    | null
  >(null);
  const [kingsMode, setKingsMode] = useState(gameState.getKingsMode());
  const [bigRedButtonEnabled, setBigRedButtonEnabled] = useState(gameState.getBigRedButtonEnabled());
  const [taxReimbursementEnabled, setTaxReimbursementEnabled] = useState(
    gameState.getTaxReimbursementEnabled()
  );
  const [timerEnabled, setTimerEnabled] = useState(gameState.getTimerEnabled());
  const [hudShowHighScore, setHudShowHighScore] = useState(gameState.getHudShowHighScore());
  const [hudShowLives, setHudShowLives] = useState(gameState.getHudShowLives());
  const [hudShowWeapon, setHudShowWeapon] = useState(gameState.getHudShowWeapon());
  const [extraLifeEnabled, setExtraLifeEnabled] = useState(gameState.getExtraLifeEnabled());
  const [showHudStatsPopup, setShowHudStatsPopup] = useState(false);
  const [difficulty, setDifficulty] = useState<GameDifficulty>(gameState.getDifficulty());

  useEffect(() => {
    const unsub = gameState.subscribe((state) => {
      setKingsMode(state.kingsModeEnabled);
      setBigRedButtonEnabled(state.bigRedButtonEnabled);
      setTaxReimbursementEnabled(state.taxReimbursementEnabled);
      setDifficulty(state.difficulty);
      setTimerEnabled(state.timerEnabled);
      setHudShowHighScore(state.hudShowHighScore);
      setHudShowLives(state.hudShowLives);
      setHudShowWeapon(state.hudShowWeapon);
      setExtraLifeEnabled(state.extraLifeEnabled);
    });
    return unsub;
  }, []);

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
    const clickSfx = sound.find("button-click");
    if (clickSfx) clickSfx.play({ volume: 0.4 });
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

  const handleTaxReimbursementToggle = () => {
    playClick();
    gameState.setTaxReimbursementEnabled(!gameState.getTaxReimbursementEnabled());
  };

  const handleTimerToggle = () => {
    playClick();
    gameState.setTimerEnabled(!gameState.getTimerEnabled());
  };

  const handleExtraLifeToggle = () => {
    playClick();
    gameState.setExtraLifeEnabled(!gameState.getExtraLifeEnabled());
  };

  const handleOpenHudStats = () => {
    playClick();
    setShowHudStatsPopup(true);
  };

  const handleCloseHudStats = () => {
    playClick();
    setShowHudStatsPopup(false);
  };

  const handleDifficultySelect = (level: GameDifficulty) => {
    playClick();
    gameState.setDifficulty(level);
    setDifficulty(level);
  };

  // Vertical layout: spread options down the screen so text never overlaps.
  // Slightly larger row spacing so each option block has more breathing room,
  // especially on tall mobile.
  const titleY = height * 0.16;
  const firstRowY = height * 0.32;
  const rowSpacing = height * 0.11;

  return (
    <div className="executive-orders-wrap">
      <Stage width={width} height={height}>
        {!ditherEnabled && (
          <TiledDitherBackground width={width} height={height} />
        )}
        {ditherEnabled && (
          <StartScreenBackground width={width} height={height} ditherEnabled={true} />
        )}

        <Container x={width / 2} y={titleY}>
          <Text text="EXECUTIVE ORDERS" anchor={0.5} style={titleStyle} />
        </Container>

        {/* King's Mode - GOD MODE (toggle) */}
      <Container
        x={width / 2}
        y={firstRowY}
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
        y={firstRowY + rowSpacing}
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

      {/* Tax Reimbursement: enemy bullets deduct score instead of lives */}
      <Container
        x={width / 2}
        y={firstRowY + rowSpacing * 2}
        eventMode="static"
        cursor="pointer"
        pointerdown={handleTaxReimbursementToggle}
        pointerover={() => setHoverButton("tax")}
        pointerout={() => setHoverButton(null)}
      >
        <Text
          text="Tax Reimbursement"
          anchor={0.5}
          style={optionTitleStyle}
          scale={{
            x: hoverButton === "tax" ? 1.05 : 1,
            y: hoverButton === "tax" ? 1.05 : 1,
          }}
        />
        <Text
          text="Enemy bullets -10 SCORE instead of damage (min 0)"
          anchor={0.5}
          style={optionDescStyle}
          y={20}
        />
        <Text
          text={taxReimbursementEnabled ? "[ ON ]" : "[ OFF ]"}
          anchor={0.5}
          style={optionDescStyle}
          y={38}
          tint={taxReimbursementEnabled ? 0x00ff88 : 0x888888}
        />
      </Container>

      {/* Countdown Timer: level timer that causes GAME OVER when it hits 0 */}
      <Container
        x={width / 2}
        y={firstRowY + rowSpacing * 3}
        eventMode="static"
        cursor="pointer"
        pointerdown={handleTimerToggle}
        pointerover={() => setHoverButton("timer")}
        pointerout={() => setHoverButton(null)}
      >
        <Text
          text="Level Timer"
          anchor={0.5}
          style={optionTitleStyle}
          scale={{
            x: hoverButton === "timer" ? 1.05 : 1,
            y: hoverButton === "timer" ? 1.05 : 1,
          }}
        />
        <Text
          text="45s countdown; reaching 0 = GAME OVER"
          anchor={0.5}
          style={optionDescStyle}
          y={20}
        />
        <Text
          text={timerEnabled ? "[ ON ]" : "[ OFF ]"}
          anchor={0.5}
          style={optionDescStyle}
          y={38}
          tint={timerEnabled ? 0x00ff88 : 0x888888}
        />
      </Container>

      {/* HUD Stats: toggle visibility of specific HUD sections via popup */}
      <Container
        x={width / 2}
        y={firstRowY + rowSpacing * 4}
        eventMode="static"
        cursor="pointer"
        pointerdown={handleOpenHudStats}
        pointerover={() => setHoverButton("hud")}
        pointerout={() => setHoverButton(null)}
      >
        <Text
          text="HUD Stats"
          anchor={0.5}
          style={optionTitleStyle}
          scale={{
            x: hoverButton === "hud" ? 1.05 : 1,
            y: hoverButton === "hud" ? 1.05 : 1,
          }}
        />
        <Text
          text="Show/Hide HI-SCORE, LIVES, WEAPON on HUD"
          anchor={0.5}
          style={optionDescStyle}
          y={20}
        />
        <Text
          text={`HI:${hudShowHighScore ? "ON" : "OFF"}  LV:${hudShowLives ? "ON" : "OFF"}  WP:${hudShowWeapon ? "ON" : "OFF"}`}
          anchor={0.5}
          style={optionDescStyle}
          y={38}
          tint={0x00ff88}
        />
      </Container>

      {/* Extra Life: enable multi-life + score-based extra lives, or 1-hit game over */}
      <Container
        x={width / 2}
        y={firstRowY + rowSpacing * 5}
        eventMode="static"
        cursor="pointer"
        pointerdown={handleExtraLifeToggle}
        pointerover={() => setHoverButton("diff-i")}
        pointerout={() => setHoverButton(null)}
      >
        <Text
          text="Extra Life"
          anchor={0.5}
          style={optionTitleStyle}
          scale={{
            x: hoverButton === "diff-i" ? 1.05 : 1,
            y: hoverButton === "diff-i" ? 1.05 : 1,
          }}
        />
        <Text
          text="OFF: 1 hit = GAME OVER. ON: lives + score-based extra lives."
          anchor={0.5}
          style={optionDescStyle}
          y={20}
        />
        <Text
          text={extraLifeEnabled ? "[ ON ]" : "[ OFF ]"}
          anchor={0.5}
          style={optionDescStyle}
          y={38}
          tint={extraLifeEnabled ? 0x00ff88 : 0x888888}
        />
      </Container>

      {/* Difficulty: enemy shooting aggression — I = easy, O = medium, U = hard */}
      <Container x={width / 2} y={firstRowY + rowSpacing * 6}>
        <Text text="Difficulty" anchor={0.5} style={optionTitleStyle} />
        <Text text="Enemy shooting aggression" anchor={0.5} style={optionDescStyle} y={18} />
        <Container x={-52} y={38}>
          <Container
            x={0}
            y={0}
            eventMode="static"
            cursor="pointer"
            pointerdown={() => handleDifficultySelect('easy')}
            pointerover={() => setHoverButton("diff-i")}
            pointerout={() => setHoverButton(null)}
          >
            <Text
              text="I"
              anchor={0.5}
              style={buttonStyle}
              tint={difficulty === 'easy' ? 0x00ff88 : hoverButton === "diff-i" ? 0xccccff : 0xffffff}
              scale={{ x: hoverButton === "diff-i" ? 1.15 : 1, y: hoverButton === "diff-i" ? 1.15 : 1 }}
            />
          </Container>
          <Text text="Easy" anchor={0.5} style={optionDescStyle} x={0} y={22} />
        </Container>
        <Container x={0} y={38}>
          <Container
            x={0}
            y={0}
            eventMode="static"
            cursor="pointer"
            pointerdown={() => handleDifficultySelect('medium')}
            pointerover={() => setHoverButton("diff-o")}
            pointerout={() => setHoverButton(null)}
          >
            <Text
              text="O"
              anchor={0.5}
              style={buttonStyle}
              tint={difficulty === 'medium' ? 0x00ff88 : hoverButton === "diff-o" ? 0xccccff : 0xffffff}
              scale={{ x: hoverButton === "diff-o" ? 1.15 : 1, y: hoverButton === "diff-o" ? 1.15 : 1 }}
            />
          </Container>
          <Text text="Medium" anchor={0.5} style={optionDescStyle} x={0} y={22} />
        </Container>
        <Container x={52} y={38}>
          <Container
            x={0}
            y={0}
            eventMode="static"
            cursor="pointer"
            pointerdown={() => handleDifficultySelect('hard')}
            pointerover={() => setHoverButton("diff-u")}
            pointerout={() => setHoverButton(null)}
          >
            <Text
              text="U"
              anchor={0.5}
              style={buttonStyle}
              tint={difficulty === 'hard' ? 0x00ff88 : hoverButton === "diff-u" ? 0xccccff : 0xffffff}
              scale={{ x: hoverButton === "diff-u" ? 1.15 : 1, y: hoverButton === "diff-u" ? 1.15 : 1 }}
            />
          </Container>
          <Text text="Hard" anchor={0.5} style={optionDescStyle} x={0} y={22} />
        </Container>
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

      {/* HUD Stats popup: HTML overlay with toggles for HUD sections */}
      {showHudStatsPopup && (
        <div className="executive-orders-overlay">
          <div
            className="hud-stats-popup-backdrop"
            onClick={handleCloseHudStats}
          >
            <div
              className="hud-stats-popup"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="hud-stats-title">HUD STATS</div>
              <div className="hud-stats-row">
                <label>
                  <input
                    type="checkbox"
                    checked={hudShowHighScore}
                    onChange={() =>
                      gameState.setHudShowHighScore(!gameState.getHudShowHighScore())
                    }
                  />
                  <span>Show HI-SCORE</span>
                </label>
              </div>
              <div className="hud-stats-row">
                <label>
                  <input
                    type="checkbox"
                    checked={hudShowLives}
                    onChange={() =>
                      gameState.setHudShowLives(!gameState.getHudShowLives())
                    }
                  />
                  <span>Show LIVES counter</span>
                </label>
              </div>
              <div className="hud-stats-row">
                <label>
                  <input
                    type="checkbox"
                    checked={hudShowWeapon}
                    onChange={() =>
                      gameState.setHudShowWeapon(!gameState.getHudShowWeapon())
                    }
                  />
                  <span>Show WEAPON label</span>
                </label>
              </div>
              <button
                type="button"
                className="hud-stats-close-button"
                onClick={handleCloseHudStats}
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fixed bottom back bar so the BACK button always aligns with the screen bottom */}
      <div className="executive-orders-back-bar">
        <button
          type="button"
          className="executive-orders-back-button"
          onClick={handleBack}
        >
          BACK
        </button>
      </div>
    </div>
  );
};

export default ExecutiveOrdersScreen;

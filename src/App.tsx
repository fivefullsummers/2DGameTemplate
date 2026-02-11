import { useState, useEffect } from "react";
import Experience from "./components/Experience"
import LoadingScreen from "./components/LoadingScreen"
import StartScreen from "./components/StartScreen"
import OptionsScreen from "./components/OptionsScreen"
import ExecutiveOrdersScreen from "./components/ExecutiveOrdersScreen"
import GameOverScreen from "./components/GameOverScreen"
import LevelCompleteScreen from "./components/LevelCompleteScreen.tsx"
import PlayerSelectScreen from "./components/PlayerSelectScreen"
import PreGameScreen from "./components/PreGameScreen"
import { useAssetLoader } from "./hooks/useAssetLoader"
import { GAME_CONSTANTS, gameState } from "./utils/GameState"
import { ENEMY_TYPE_IDS } from "./consts/enemy-types"
import { applyStoredSoundPreference } from "./utils/soundSettings"
import { VisualSettingsProvider } from "./contexts/VisualSettingsContext"

type GameState = 'menu' | 'options' | 'executiveOrders' | 'playerSelect' | 'preGame' | 'playing' | 'gameOver' | 'levelComplete';

export const App = () => {
  const { isLoading, progress, currentAsset, error, gpuCapability } = useAssetLoader();
  const [currentGameState, setCurrentGameState] = useState<GameState>('menu');
  
  const handleStartGame = () => {
    setCurrentGameState('playerSelect');
  };

  const handlePlayerSelectContinue = (selectedPlayerId: string) => {
    gameState.setSelectedPlayerId(selectedPlayerId);
    // Level 1 = first enemy type; later can map wave/level to enemy type
    const levelEnemyTypeId = ENEMY_TYPE_IDS[0] ?? gameState.getSelectedEnemyTypeId();
    gameState.setSelectedEnemyTypeId(levelEnemyTypeId);
    setCurrentGameState('preGame');
  };

  const handleBackFromPlayerSelect = () => {
    setCurrentGameState('menu');
  };

  const handlePreGameReady = () => {
    gameState.initGame(GAME_CONSTANTS.TOTAL_ENEMIES);
    setCurrentGameState('playing');
  };

  const handleBackFromPreGame = () => {
    setCurrentGameState('playerSelect');
  };

  const handleGameOver = () => {
    setCurrentGameState('gameOver');
  };

  const handleLevelComplete = () => {
    setCurrentGameState('levelComplete');
  };

  const handlePlayAgain = () => {
    // Reset game state
    gameState.initGame(GAME_CONSTANTS.TOTAL_ENEMIES); // Reset with default enemy count
    setCurrentGameState('playing');
  };

  const handleMainMenu = () => {
    // Reset game state
    gameState.initGame(GAME_CONSTANTS.TOTAL_ENEMIES); // Reset with default enemy count
    setCurrentGameState('menu');
  };

  const handleNextLevel = () => {
    // Advance to the next wave but keep score and lives
    gameState.initWave(GAME_CONSTANTS.TOTAL_ENEMIES);
    setCurrentGameState('playing');
  };

  const handleReplayLevel = () => {
    // Replay the wave we just completed, keeping current wave and lives.
    // Score is reset by GameState back to the value at the start of this wave.
    gameState.resetCurrentWave(GAME_CONSTANTS.TOTAL_ENEMIES);
    setCurrentGameState('playing');
  };

  const handleExitFromLevelComplete = () => {
    // Return to main menu
    gameState.initGame(GAME_CONSTANTS.TOTAL_ENEMIES);
    setCurrentGameState('menu');
  };

  const handleOpenOptions = () => {
    setCurrentGameState('options');
  };

  const handleOptionsBack = () => {
    setCurrentGameState('menu');
  };

  const handleOpenExecutiveOrders = () => {
    setCurrentGameState('executiveOrders');
  };

  const handleExecutiveOrdersBack = () => {
    setCurrentGameState('options');
  };

  // Apply stored sound preference once assets (and sound) are ready
  useEffect(() => {
    if (!isLoading) {
      applyStoredSoundPreference();
    }
  }, [isLoading]);

  if (isLoading) {
    return <LoadingScreen progress={progress} currentAsset={currentAsset} error={error} />;
  }

  return (
    <VisualSettingsProvider gpuCapability={gpuCapability}>
      {currentGameState === "menu" && (
        <StartScreen onStartGame={handleStartGame} onOpenOptions={handleOpenOptions} />
      )}
      {currentGameState === "playerSelect" && (
        <PlayerSelectScreen
          onContinue={handlePlayerSelectContinue}
          onBack={handleBackFromPlayerSelect}
        />
      )}
      {currentGameState === "preGame" && (
        <PreGameScreen
          selectedPlayerId={gameState.getSelectedPlayerId()}
          enemyTypeId={gameState.getSelectedEnemyTypeId()}
          onReady={handlePreGameReady}
          onBack={handleBackFromPreGame}
        />
      )}
      {currentGameState === "options" && (
        <OptionsScreen
          onBack={handleOptionsBack}
          onOpenExecutiveOrders={handleOpenExecutiveOrders}
        />
      )}
      {currentGameState === "executiveOrders" && (
        <ExecutiveOrdersScreen onBack={handleExecutiveOrdersBack} />
      )}
      {currentGameState === "gameOver" && (
        <GameOverScreen onPlayAgain={handlePlayAgain} onMainMenu={handleMainMenu} />
      )}
      {currentGameState === "levelComplete" && (
        <LevelCompleteScreen
          onNextLevel={handleNextLevel}
          onReplay={handleReplayLevel}
          onExit={handleExitFromLevelComplete}
        />
      )}
      {currentGameState === "playing" && (
        <Experience onGameOver={handleGameOver} onLevelComplete={handleLevelComplete} />
      )}
    </VisualSettingsProvider>
  );
}

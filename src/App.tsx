import { useState } from "react";
import Experience from "./components/Experience"
import LoadingScreen from "./components/LoadingScreen"
import StartScreen from "./components/StartScreen"
import GameOverScreen from "./components/GameOverScreen"
import LevelCompleteScreen from "./components/LevelCompleteScreen.tsx"
import { useAssetLoader } from "./hooks/useAssetLoader"
import { GAME_CONSTANTS, gameState } from "./utils/GameState"

type GameState = 'menu' | 'playing' | 'gameOver' | 'levelComplete';

export const App = () => {
  const { isLoading, progress, currentAsset, error } = useAssetLoader();
  const [currentGameState, setCurrentGameState] = useState<GameState>('menu');
  
  const handleStartGame = () => {
    // Initialize a fresh game for wave 1
    gameState.initGame(GAME_CONSTANTS.TOTAL_ENEMIES);
    setCurrentGameState('playing');
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
    // Replay the wave we just completed, keeping current wave, score, and lives
    gameState.resetCurrentWave(GAME_CONSTANTS.TOTAL_ENEMIES);
    setCurrentGameState('playing');
  };

  const handleExitFromLevelComplete = () => {
    // Return to main menu
    gameState.initGame(GAME_CONSTANTS.TOTAL_ENEMIES);
    setCurrentGameState('menu');
  };
  
  // const isLoadingTest = true;
  if (isLoading) {
    return <LoadingScreen progress={progress} currentAsset={currentAsset} error={error} />;
  }

  if (currentGameState === 'menu') {
    return <StartScreen onStartGame={handleStartGame} />;
  }

  if (currentGameState === 'gameOver') {
    return <GameOverScreen onPlayAgain={handlePlayAgain} onMainMenu={handleMainMenu} />;
  }

  if (currentGameState === 'levelComplete') {
    return (
      <LevelCompleteScreen
        onNextLevel={handleNextLevel}
        onReplay={handleReplayLevel}
        onExit={handleExitFromLevelComplete}
      />
    );
  }

  return <>
    <Experience onGameOver={handleGameOver} onLevelComplete={handleLevelComplete} />
  </>
}

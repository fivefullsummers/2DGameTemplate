import { useState } from "react";
import Experience from "./components/Experience"
import LoadingScreen from "./components/LoadingScreen"
import StartScreen from "./components/StartScreen"
import GameOverScreen from "./components/GameOverScreen"
import { useAssetLoader } from "./hooks/useAssetLoader"
import { gameState } from "./utils/GameState"

type GameState = 'menu' | 'playing' | 'gameOver';

export const App = () => {
  const { isLoading, progress, currentAsset, error } = useAssetLoader();
  const [currentGameState, setCurrentGameState] = useState<GameState>('menu');
  
  const handleStartGame = () => {
    setCurrentGameState('playing');
  };

  const handleGameOver = () => {
    setCurrentGameState('gameOver');
  };

  const handlePlayAgain = () => {
    // Reset game state
    gameState.initGame(55); // Reset with default enemy count
    setCurrentGameState('playing');
  };

  const handleMainMenu = () => {
    // Reset game state
    gameState.initGame(55); // Reset with default enemy count
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

  return <>
    <Experience onGameOver={handleGameOver} />
  </>
}

import { useState } from "react";
import Experience from "./components/Experience"
import LoadingScreen from "./components/LoadingScreen"
import StartScreen from "./components/StartScreen"
import { useAssetLoader } from "./hooks/useAssetLoader"

export const App = () => {
  const { isLoading, progress, currentAsset, error } = useAssetLoader();
  const [gameStarted, setGameStarted] = useState(false);
  
  // const isLoadingTest = true;
  if (isLoading) {
    return <LoadingScreen progress={progress} currentAsset={currentAsset} error={error} />;
  }

  if (!gameStarted) {
    return <StartScreen onStartGame={() => setGameStarted(true)} />;
  }

  return <>
    <Experience />
  </>
}

import Experience from "./components/Experience"
import LoadingScreen from "./components/LoadingScreen"
import { useAssetLoader } from "./hooks/useAssetLoader"

export const App = () => {
  const { isLoading, progress, currentAsset, error } = useAssetLoader();
  // const isLoadingTest = true;
  if (isLoading) {
    return <LoadingScreen progress={progress} currentAsset={currentAsset} error={error} />;
  }

  return <>
    <Experience />
  </>
}

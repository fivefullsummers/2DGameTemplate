import { useState, useEffect } from "react";
import { assetLoader } from "../utils/assetLoader";

interface UseAssetLoaderResult {
  isLoading: boolean;
  progress: number;
  currentAsset: string;
  error: Error | null;
}

/**
 * Hook to load all game assets with progress tracking
 */
export const useAssetLoader = (): UseAssetLoaderResult => {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentAsset, setCurrentAsset] = useState("Initializing...");
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadAssets = async () => {
      try {
        await assetLoader.loadAll((progress, asset) => {
          setProgress(progress);
          setCurrentAsset(asset);
        });
        
        // Small delay to show completion
        setTimeout(() => {
          setIsLoading(false);
        }, 300);
      } catch (err) {
        setError(err as Error);
        setIsLoading(false);
      }
    };

    loadAssets();
  }, []);

  return {
    isLoading,
    progress,
    currentAsset,
    error,
  };
};

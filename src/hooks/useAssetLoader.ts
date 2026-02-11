import { useState, useEffect } from "react";
import { assetLoader } from "../utils/assetLoader";
import { checkGpuCapability, type GpuCapabilityResult } from "../utils/gpuCapability";

interface UseAssetLoaderResult {
  isLoading: boolean;
  progress: number;
  currentAsset: string;
  error: Error | null;
  /** Set after loading finishes; use to decide shader vs fallback visuals before entering the game */
  gpuCapability: GpuCapabilityResult | null;
}

/**
 * Hook to load all game assets with progress tracking.
 * Also runs a GPU capability check in parallel so shader support is known before the user enters the game.
 */
export const useAssetLoader = (): UseAssetLoaderResult => {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentAsset, setCurrentAsset] = useState("Initializing...");
  const [error, setError] = useState<Error | null>(null);
  const [gpuCapability, setGpuCapability] = useState<GpuCapabilityResult | null>(null);

  useEffect(() => {
    const loadAssets = async () => {
      try {
        const gpuPromise = checkGpuCapability();

        await assetLoader.loadAll((progress, asset) => {
          setProgress(progress);
          setCurrentAsset(asset);
        });

        const gpu = await gpuPromise;
        setGpuCapability(gpu);

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
    gpuCapability,
  };
};

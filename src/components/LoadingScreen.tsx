import { useEffect, useState } from "react";
import "./LoadingScreen.css";

interface LoadingScreenProps {
  progress: number;
  currentAsset: string;
  error?: Error | null;
}

const LoadingScreen = ({ progress, currentAsset, error }: LoadingScreenProps) => {
  const [dots, setDots] = useState(".");

  // Animate loading dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev === "...") return ".";
        return prev + ".";
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const percentage = Math.floor(progress * 100);

  return (
    <div className="loading-screen">
      <div className="loading-container">
        <h1 className="loading-title">Loading Assets</h1>
        
        {error ? (
          <div className="loading-error">
            <p className="error-message">Failed to load assets</p>
            <p className="error-details">{error.message}</p>
          </div>
        ) : (
          <>
            <div className="loading-bar-container">
              <div 
                className="loading-bar-fill" 
                style={{ width: `${percentage}%` }}
              />
            </div>
            
            <div className="loading-info">
              <p className="loading-percentage">{percentage}%</p>
              <p className="loading-asset">{currentAsset}{dots}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LoadingScreen;

import "./LoadingScreen.css";
import backgroundPattern from "../assets/misc/background.png";
import loadingElephants from "../assets/misc/loading-elephants.png";

/** Single elephant image (149×111); shown scaled to 16×16 in each filled bar. */
const LOADING_BAR_IMAGE: string = loadingElephants as string;

interface LoadingScreenProps {
  progress: number;
  currentAsset: string;
  error?: Error | null;
}

const BAR_COUNT = 5;

const LoadingScreen = ({ progress, error }: LoadingScreenProps) => {
  const filledCount = progress >= 1 ? BAR_COUNT : Math.min(BAR_COUNT, Math.ceil(progress * BAR_COUNT));

  return (
    <div className="loading-screen">
      <div
        className="loading-screen-bg"
        style={{ backgroundImage: `url(${backgroundPattern})` }}
        aria-hidden
      />
      <div className="loading-content">
        {error ? (
          <div className="loading-error">
            <p className="error-message">Failed to load</p>
            <p className="error-details">{error.message}</p>
          </div>
        ) : (
          <>
            <p className="loading-text">Loading</p>
            <div className="loading-bars" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
              {Array.from({ length: BAR_COUNT }, (_, i) => {
                const filled = i < filledCount;
                return (
                  <div
                    key={i}
                    className={`loading-bar ${filled ? "filled" : ""}`}
                    style={
                      filled
                        ? {
                            backgroundImage: `url(${LOADING_BAR_IMAGE})`,
                            backgroundSize: "16px 16px",
                            backgroundPosition: "center",
                            backgroundRepeat: "no-repeat",
                          }
                        : undefined
                    }
                  />
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LoadingScreen;

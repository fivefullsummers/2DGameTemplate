import { GAME_HEIGHT, GAME_WIDTH } from "../consts/game-world";

export const calculateDimensions = () => {
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  // Use full screen dimensions
  const width = windowWidth;
  const height = windowHeight;
  
  // Calculate scale for game world (used by Experience component)
  const scale = Math.min(windowWidth / GAME_WIDTH, windowHeight / GAME_HEIGHT);

  return { width, height, scale };
};

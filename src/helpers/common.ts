import { GAME_HEIGHT, GAME_WIDTH } from "../consts/game-world";

export const calculateDimensions = () => {
  const windowWidth = window.innerWidth * 0.97;
  const windowHeight = window.innerHeight * 0.97;

  const scale = Math.min(windowWidth / GAME_WIDTH, windowHeight / GAME_HEIGHT);
  const width = GAME_WIDTH * scale;
  const height = GAME_HEIGHT * scale;

  return { width, height, scale };
};

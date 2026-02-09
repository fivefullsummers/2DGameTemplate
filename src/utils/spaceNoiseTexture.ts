import * as PIXI from "pixi.js";

const NOISE_SIZE = 256;

let cachedSpaceNoiseTexture: PIXI.Texture | null = null;

function createSpaceNoiseTextureUncached(): PIXI.Texture {
  const canvas = document.createElement("canvas");
  canvas.width = NOISE_SIZE;
  canvas.height = NOISE_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return PIXI.Texture.WHITE;
  const imageData = ctx.createImageData(NOISE_SIZE, NOISE_SIZE);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const v = Math.random() * 255;
    data[i] = v;
    data[i + 1] = v;
    data[i + 2] = v;
    data[i + 3] = 255;
  }
  ctx.putImageData(imageData, 0, 0);
  const texture = PIXI.Texture.from(canvas);
  const base = texture.baseTexture;
  if (base && typeof (base as { wrapMode?: number }).wrapMode !== "undefined") {
    (base as { wrapMode: number }).wrapMode = PIXI.WRAP_MODES.REPEAT;
  }
  return texture;
}

/** Creates a noise texture, or returns the same cached one. Use for menu space shader to avoid re-creating on every screen. */
export function getCachedSpaceNoiseTexture(): PIXI.Texture {
  if (!cachedSpaceNoiseTexture) {
    cachedSpaceNoiseTexture = createSpaceNoiseTextureUncached();
  }
  return cachedSpaceNoiseTexture;
}

/** Creates a new noise texture each time (e.g. for game background). */
export function createSpaceNoiseTexture(): PIXI.Texture {
  return createSpaceNoiseTextureUncached();
}

/**
 * GPU capability check for shader support.
 * Run before entering the game (e.g. during loading) to decide whether
 * to use shader-based effects or fallbacks.
 */

export interface GpuCapabilityResult {
  /** Whether custom shaders compile and run (use SpaceGameBackground, CRT, etc.) */
  shadersSupported: boolean;
  /** WebGL version: 2, 1, or 0 if unavailable */
  webGLVersion: 0 | 1 | 2;
  /** If check failed, a short reason (e.g. "WebGL not available") */
  error?: string;
}

const MINIMAL_VERTEX = `
attribute vec2 aPosition;
attribute vec2 aUV;
varying vec2 vUV;
void main() {
  vUV = aUV;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const MINIMAL_FRAGMENT = `
precision mediump float;
varying vec2 vUV;
uniform vec2 uResolution;
void main() {
  gl_FragColor = vec4(0.0, 0.0, 0.1, 1.0);
}
`;

function getWebGLContext(
  canvas: HTMLCanvasElement,
  version: 2 | 1
): WebGLRenderingContext | WebGL2RenderingContext | null {
  const attrs = { alpha: false, antialias: false, failIfMajorPerformanceCaveat: true };
  if (version === 2) {
    return (
      canvas.getContext("webgl2", attrs) ||
      canvas.getContext("experimental-webgl2", attrs) ||
      null
    );
  }
  return (
    canvas.getContext("webgl", attrs) ||
    canvas.getContext("experimental-webgl", attrs) ||
    null
  );
}

function compileShader(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  type: number,
  source: string
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function testShaders(gl: WebGLRenderingContext | WebGL2RenderingContext): boolean {
  const vert = compileShader(gl, gl.VERTEX_SHADER, MINIMAL_VERTEX);
  const frag = compileShader(gl, gl.FRAGMENT_SHADER, MINIMAL_FRAGMENT);
  if (!vert || !frag) return false;

  const program = gl.createProgram();
  if (!program) {
    gl.deleteShader(vert);
    gl.deleteShader(frag);
    return false;
  }
  gl.attachShader(program, vert);
  gl.attachShader(program, frag);
  gl.linkProgram(program);

  const ok = gl.getProgramParameter(program, gl.LINK_STATUS);
  gl.deleteShader(vert);
  gl.deleteShader(frag);
  gl.deleteProgram(program);
  return !!ok;
}

let cachedResult: GpuCapabilityResult | null = null;

/**
 * Runs the GPU capability check (WebGL + shader compile/link).
 * Safe to call multiple times; result is cached after the first run.
 * Call this during loading, before the user enters the game.
 */
export function checkGpuCapability(): Promise<GpuCapabilityResult> {
  if (cachedResult !== null) {
    return Promise.resolve(cachedResult);
  }

  return new Promise((resolve) => {
    const result: GpuCapabilityResult = {
      shadersSupported: false,
      webGLVersion: 0,
    };

    if (typeof document === "undefined" || !document.createElement) {
      result.error = "No document";
      cachedResult = result;
      resolve(result);
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;

    // Prefer WebGL2 (Pixi 7 uses it when available)
    const gl2 = getWebGLContext(canvas, 2);
    if (gl2) {
      result.webGLVersion = 2;
      result.shadersSupported = testShaders(gl2);
      if (!result.shadersSupported) {
        result.error = "WebGL2 shaders failed to compile";
      }
      cachedResult = result;
      resolve(result);
      return;
    }

    const gl1 = getWebGLContext(canvas, 1);
    if (gl1) {
      result.webGLVersion = 1;
      result.shadersSupported = testShaders(gl1);
      if (!result.shadersSupported) {
        result.error = "WebGL shaders failed to compile";
      }
      cachedResult = result;
      resolve(result);
      return;
    }

    result.error = "WebGL not available";
    cachedResult = result;
    resolve(result);
  });
}

/**
 * Returns the cached result of the last check, or null if check has not run yet.
 */
export function getGpuCapability(): GpuCapabilityResult | null {
  return cachedResult;
}

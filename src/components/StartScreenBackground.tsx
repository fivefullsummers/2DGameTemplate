import { useRef, useEffect, useMemo } from "react";
import * as PIXI from "pixi.js";
import { Container, useTick } from "@pixi/react";
import vertexShader from "../shaders/dither/vertex.glsl?raw";
import fragmentShader from "../shaders/dither/fragment.glsl?raw";
import { getCachedSpaceNoiseTexture } from "../utils/spaceNoiseTexture";

// Cache the compiled program so we don't recompile the shader on every menu screen mount
let cachedDitherProgram: PIXI.Program | null = null;
function getDitherProgram(): PIXI.Program {
  if (!cachedDitherProgram) {
    cachedDitherProgram = PIXI.Program.from(
      vertexShader,
      fragmentShader,
      "ditherShader"
    );
  }
  return cachedDitherProgram;
}

interface StartScreenBackgroundProps {
  width: number;
  height: number;
  // Dither ramp exponent r; 1.0 = linear.
  r?: number;
  // Number of brightness levels for dithering.
  levels?: number;
  // Visual size of each Bayer tile in pixels.
  ditherScale?: number;
  // Height of the dithered gradient band as a fraction of screen height (0..1).
  bandHeight?: number;
}

const StartScreenBackground = ({
  width,
  height,
  r = 5.8,
  levels = 12,
  ditherScale = 14.5,
  bandHeight = 0.55,
}: StartScreenBackgroundProps) => {
  const containerRef = useRef<PIXI.Container>(null);
  const meshRef = useRef<PIXI.Mesh | null>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5, active: 0 });

  const noiseTexture = getCachedSpaceNoiseTexture();

  const onPointerDown = () => {
    mouseRef.current.active = 1;
  };
  const onPointerUp = () => {
    mouseRef.current.active = 0;
  };
  const onPointerMove = (e: PIXI.FederatedPointerEvent) => {
    mouseRef.current.x = Math.max(0, Math.min(1, e.global.x / width));
    mouseRef.current.y = Math.max(0, Math.min(1, e.global.y / height));
  };
  const onPointerOut = () => {
    mouseRef.current.active = 0;
  };

  const geometry = useMemo(() => {
    const positions = [
      0, height,
      width, height,
      width, 0,
      0, 0,
    ];

    const uvs = [
      0, 1,
      1, 1,
      1, 0,
      0, 0,
    ];

    const indices = [
      0, 1, 2,
      0, 2, 3,
    ];

    const geom = new PIXI.Geometry();
    geom.addAttribute("aPosition", positions, 2);
    geom.addAttribute("aVertexPosition", positions, 2);
    geom.addAttribute("aUV", uvs, 2);
    geom.addIndex(indices);
    return geom;
  }, [width, height]);

  const shader = useMemo(() => {
    return new PIXI.MeshMaterial(PIXI.Texture.WHITE, {
      program: getDitherProgram(),
      uniforms: {
        uResolution: new Float32Array([width, height]),
        uTime: 0,
        uMouse: [0.5, 0.5],
        uMouseActive: 0,
        uNoise: noiseTexture,
        // r parameter for the dither shader's ramp curve.
        // 1.0 = linear, >1 darkens bottom / compresses top,
        // <1 brightens bottom / stretches top.
        uR: r,
        uLevels: levels,
        uDitherScale: ditherScale,
        uBandHeight: bandHeight,
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- uResolution updated in useTick
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (!meshRef.current) {
      const mesh = new PIXI.Mesh(geometry, shader);
      mesh.x = 0;
      mesh.y = 0;
      meshRef.current = mesh;
      container.addChild(mesh);
    } else {
      meshRef.current.geometry = geometry;
    }

    return () => {
      const mesh = meshRef.current;
      if (mesh && container) {
        container.removeChild(mesh);
        const geom = mesh.geometry;
        mesh.destroy();
        if (geom && typeof geom.destroy === "function" && !(geom as { _destroyed?: boolean })._destroyed) {
          geom.destroy();
        }
        meshRef.current = null;
      }
    };
  }, [geometry, shader]);

  useTick((_delta, ticker) => {
    const mesh = meshRef.current;
    if (mesh?.shader) {
      const material = mesh.shader as PIXI.MeshMaterial;
      const u = material.uniforms as {
        uTime?: number;
        uResolution?: Float32Array | number[];
        uMouse?: number[];
        uMouseActive?: number;
        uR?: number;
        uLevels?: number;
        uDitherScale?: number;
        uBandHeight?: number;
      };
      if (u) {
        u.uTime = ticker.lastTime / 1000;
        u.uResolution = [width, height];
        u.uMouse = [mouseRef.current.x, mouseRef.current.y];
        u.uMouseActive = mouseRef.current.active;
        u.uR = r;
        u.uLevels = levels;
        u.uDitherScale = ditherScale;
        u.uBandHeight = bandHeight;
      }
    }
  });

  return (
    <Container
      ref={containerRef}
      eventMode="static"
      onpointerdown={onPointerDown}
      onpointerup={onPointerUp}
      onpointerupoutside={onPointerUp}
      onpointermove={onPointerMove}
      onpointerout={onPointerOut}
    />
  );
};

export default StartScreenBackground;

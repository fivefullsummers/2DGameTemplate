import { useRef, useEffect, useMemo } from "react";
import * as PIXI from "pixi.js";
import { Container, useTick } from "@pixi/react";
import vertexShader from "../shaders/dither/vertex.glsl?raw";
import fragmentShader from "../shaders/dither/fragment.glsl?raw";
import { getCachedSpaceNoiseTexture } from "../utils/spaceNoiseTexture";
import DitherPatternBackground from "./DitherPatternBackground";

interface GameSpaceBackgroundProps {
  width: number;
  height: number;
  /** When false, PNG dither pattern (GPU-cheap default). When true, dither gradient + stars. */
  ditherEnabled?: boolean;
}

/**
 * Gameplay background: when dither off, solid dark blue; when on, dither gradient + stars.
 */
const GameSpaceBackground = ({ width, height, ditherEnabled = false }: GameSpaceBackgroundProps) => {
  const containerRef = useRef<PIXI.Container>(null);
  const meshRef = useRef<PIXI.Mesh | null>(null);
  const noiseTexture = getCachedSpaceNoiseTexture();

  const geometry = useMemo(() => {
    const positions = [0, height, width, height, width, 0, 0, 0];
    const uvs = [0, 1, 1, 1, 1, 0, 0, 0];
    const indices = [0, 1, 2, 0, 2, 3];
    const geom = new PIXI.Geometry();
    geom.addAttribute("aPosition", positions, 2);
    geom.addAttribute("aVertexPosition", positions, 2);
    geom.addAttribute("aUV", uvs, 2);
    geom.addIndex(indices);
    return geom;
  }, [width, height]);

  const shader = useMemo(() => {
    if (!ditherEnabled) return null;
    const program = PIXI.Program.from(vertexShader, fragmentShader, "ditherShaderGameplay");
    return new PIXI.MeshMaterial(PIXI.Texture.WHITE, {
      program,
      uniforms: {
        uResolution: new Float32Array([width, height]),
        uTime: 0,
        uMouse: [0.5, 0.5],
        uMouseActive: 0,
        uNoise: noiseTexture,
        uR: 5.8,
        uLevels: 12,
        uDitherScale: 14.5,
        uBandHeight: 0.55,
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- uResolution updated in useTick
  }, [ditherEnabled]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !ditherEnabled || !shader) return;

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
        const mat = mesh.shader as PIXI.MeshMaterial | undefined;
        if (mat && typeof mat.destroy === "function") mat.destroy();
        mesh.destroy();
        if (geom && typeof geom.destroy === "function" && !(geom as { _destroyed?: boolean })._destroyed) {
          geom.destroy();
        }
        meshRef.current = null;
      }
    };
  }, [geometry, shader, ditherEnabled]);

  useTick((_delta, ticker) => {
    if (!ditherEnabled) return;
    const mesh = meshRef.current;
    if (mesh?.shader) {
      const u = (mesh.shader as PIXI.MeshMaterial).uniforms as {
        uTime?: number;
        uResolution?: number[];
      };
      if (u) {
        u.uTime = ticker.lastTime / 1000;
        u.uResolution = [width, height];
      }
    }
  });

  return (
    <Container ref={containerRef}>
      {!ditherEnabled && (
        <DitherPatternBackground width={width} height={height} />
      )}
    </Container>
  );
};

export default GameSpaceBackground;

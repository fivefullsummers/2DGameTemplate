import { useRef, useEffect, useMemo } from "react";
import * as PIXI from "pixi.js";
import { Container, useTick } from "@pixi/react";
import vertexShader from "../shaders/space/vertex.glsl?raw";
import fragmentShader from "../shaders/twinkleStars/fragment.glsl?raw";

interface SpaceGameBackgroundProps {
  width: number;
  height: number;
}

/**
 * Full-screen background using the lightweight twinkleStars shader:
 * dark blue space with a grid of independently twinkling stars.
 * Uses a cached noise texture so we don't recreate it every render.
 */
const SpaceGameBackground = ({ width, height }: SpaceGameBackgroundProps) => {
  const containerRef = useRef<PIXI.Container>(null);
  const meshRef = useRef<PIXI.Mesh | null>(null);

  const geometry = useMemo(() => {
    const positions = [0, height, width, height, width, 0, 0, 0];
    const uvs = [0, 1, 1, 1, 1, 0, 0, 0];
    const indices = [0, 1, 2, 0, 2, 3];
    const geom = new PIXI.Geometry();
    geom.addAttribute("aPosition", positions, 2);
    geom.addAttribute("aUV", uvs, 2);
    geom.addIndex(indices);
    return geom;
  }, [width, height]);

  const material = useMemo(() => {
    const program = PIXI.Program.from(vertexShader, fragmentShader, "spaceShader");
    return new PIXI.MeshMaterial(PIXI.Texture.WHITE, {
      program,
      uniforms: {
        uResolution: new Float32Array([width, height]),
        uTime: 0,
      },
    });
  }, [width, height]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (!meshRef.current) {
      const mesh = new PIXI.Mesh(geometry, material);
      mesh.x = 0;
      mesh.y = 0;
      meshRef.current = mesh;
      container.addChild(mesh);
    } else {
      meshRef.current.geometry = geometry;
      meshRef.current.shader = material;
    }

    return () => {
      const mesh = meshRef.current;
      if (mesh && container) {
        container.removeChild(mesh);
        const geom = mesh.geometry;
        const mat = mesh.shader as PIXI.MeshMaterial | undefined;
        if (mat && typeof mat.destroy === "function") mat.destroy();
        mesh.destroy();
        if (geom && typeof geom.destroy === "function") {
          (geom as any)._destroyed = true;
          geom.destroy();
        }
        meshRef.current = null;
      }
    };
  }, [geometry, material]);

  useTick((_delta, ticker) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const mat = mesh.shader as PIXI.MeshMaterial;
    if (!mat.uniforms) return;
    (mat.uniforms as any).uTime = ticker.lastTime / 1000;
    (mat.uniforms as any).uResolution = new Float32Array([width, height]);
  });

  return <Container ref={containerRef} />;
};

export default SpaceGameBackground;


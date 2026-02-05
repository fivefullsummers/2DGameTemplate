import { useRef, useEffect, useMemo } from "react";
import * as PIXI from "pixi.js";
import { Container } from "@pixi/react";
import vertexShader from "../shaders/startScreen/vertex.glsl?raw";
import fragmentShader from "../shaders/startScreen/fragment.glsl?raw";

interface StartScreenBackgroundProps {
  width: number;
  height: number;
}

const StartScreenBackground = ({ width, height }: StartScreenBackgroundProps) => {
  const containerRef = useRef<PIXI.Container>(null);
  const meshRef = useRef<PIXI.Mesh | null>(null);

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
    const program = PIXI.Program.from(
      vertexShader,
      fragmentShader,
      "startScreenShader"
    );
    return new PIXI.MeshMaterial(PIXI.Texture.WHITE, {
      program,
    });
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
        mesh.destroy();
        meshRef.current = null;
      }
    };
  }, [geometry, shader]);

  return <Container ref={containerRef} />;
};

export default StartScreenBackground;

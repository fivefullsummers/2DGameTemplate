import { useRef, useEffect, useMemo } from "react";
import * as PIXI from "pixi.js";
import { Container, useTick } from "@pixi/react";
import vertexShader from "../shaders/BoxShader/vertex.glsl?raw";
import fragmentShader from "../shaders/BoxShader/fragment.glsl?raw";

interface BoxShaderBackgroundProps {
  width: number;
  height: number;
}

const BoxShaderBackground = ({ width, height }: BoxShaderBackgroundProps) => {
  const containerRef = useRef<PIXI.Container>(null);
  const meshRef = useRef<PIXI.Mesh | null>(null);

  // Create geometry - a simple quad (plane) covering the full screen
  const geometry = useMemo(() => {
    const positions = [
      0, height,      // bottom-left
      width, height,  // bottom-right
      width, 0,       // top-right
      0, 0,           // top-left
    ];

    const uvs = [
      0, 1,  // bottom-left
      1, 1,  // bottom-right
      1, 0,  // top-right
      0, 0,  // top-left
    ];

    const indices = [
      0, 1, 2,
      0, 2, 3,
    ];

    const geom = new PIXI.Geometry();
    geom.addAttribute('aPosition', positions, 2);
    geom.addAttribute('aVertexPosition', positions, 2);
    geom.addAttribute('aUV', uvs, 2);
    geom.addIndex(indices);
    return geom;
  }, [width, height]);

  const shader = useMemo(() => {
    const program = PIXI.Program.from(
      vertexShader,
      fragmentShader,
      "boxShader"
    );
    return new PIXI.MeshMaterial(PIXI.Texture.WHITE, {
      program,
      uniforms: {
        uTime: 0,
        uResolution: [width, height],
      },
    });
  }, []);

  // Create and setup the mesh
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

  // Update uniforms over time
  useTick((_delta, ticker) => {
    const elapsedSeconds = ticker.lastTime / 1000;
    const mesh = meshRef.current;
    if (mesh) {
      const material = mesh.shader as PIXI.MeshMaterial;
      material.uniforms.uTime = elapsedSeconds;
      material.uniforms.uResolution = [width, height];
    }
  });

  return <Container ref={containerRef} />;
};

export default BoxShaderBackground;

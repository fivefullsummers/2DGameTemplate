import { useRef, useEffect, useMemo } from "react";
import * as PIXI from "pixi.js";
import { Container, useTick } from "@pixi/react";
import vertexShader from "../shaders/space/vertex.glsl?raw";
import fragmentShader from "../shaders/space/fragment.glsl?raw";
import { getCachedSpaceNoiseTexture } from "../utils/spaceNoiseTexture";

// Cache the compiled program so we don't recompile the heavy shader on every menu screen mount
let cachedSpaceProgram: PIXI.Program | null = null;
function getSpaceProgram(): PIXI.Program {
  if (!cachedSpaceProgram) {
    cachedSpaceProgram = PIXI.Program.from(
      vertexShader,
      fragmentShader,
      "spaceShader"
    );
  }
  return cachedSpaceProgram;
}

interface StartScreenBackgroundProps {
  width: number;
  height: number;
}

const StartScreenBackground = ({ width, height }: StartScreenBackgroundProps) => {
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
      program: getSpaceProgram(),
      uniforms: {
        uResolution: new Float32Array([width, height]),
        uTime: 0,
        uMouse: [0.5, 0.5],
        uMouseActive: 0,
        uNoise: noiseTexture,
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
      };
      if (u) {
        u.uTime = ticker.lastTime / 1000;
        u.uResolution = [width, height];
        u.uMouse = [mouseRef.current.x, mouseRef.current.y];
        u.uMouseActive = mouseRef.current.active;
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

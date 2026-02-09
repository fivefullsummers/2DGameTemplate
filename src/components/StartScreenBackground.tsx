import { useRef, useEffect, useMemo } from "react";
import * as PIXI from "pixi.js";
import { Container, useTick } from "@pixi/react";
import vertexShader from "../shaders/space/vertex.glsl?raw";
import fragmentShader from "../shaders/space/fragment.glsl?raw";

interface StartScreenBackgroundProps {
  width: number;
  height: number;
}

const NOISE_SIZE = 256;

function createNoiseTexture(): PIXI.Texture {
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

const StartScreenBackground = ({ width, height }: StartScreenBackgroundProps) => {
  const containerRef = useRef<PIXI.Container>(null);
  const meshRef = useRef<PIXI.Mesh | null>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5, active: 0 });

  const noiseTexture = useMemo(() => createNoiseTexture(), []);

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
    const program = PIXI.Program.from(
      vertexShader,
      fragmentShader,
      "spaceShader"
    );
    return new PIXI.MeshMaterial(PIXI.Texture.WHITE, {
      program,
      uniforms: {
        uResolution: new Float32Array([width, height]),
        uTime: 0,
        uMouse: [0.5, 0.5],
        uMouseActive: 0,
        uNoise: noiseTexture,
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- uResolution updated in useTick
  }, [noiseTexture]);

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

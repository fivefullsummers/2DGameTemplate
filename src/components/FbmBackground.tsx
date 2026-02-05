import { useRef, useEffect, useMemo } from "react";
import * as PIXI from "pixi.js";
import { Container, useTick } from "@pixi/react";
import vertexShader from "../shaders/fbm/vertex.glsl?raw";
import fragmentShader from "../shaders/fbm/fragment.glsl?raw";
import gsap from "gsap";

interface FbmBackgroundProps {
  width: number;
  height: number;
}

const FbmBackground = ({ width, height }: FbmBackgroundProps) => {
  const containerRef = useRef<PIXI.Container>(null);
  const meshRef = useRef<PIXI.Mesh | null>(null);
  const smoothedMouseRef = useRef({ x: 0.5, y: 0.5 });
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  const CENTER_SIZE = 200;
  const half = CENTER_SIZE / 2;
  const centerX = width / 2;
  const centerY = height / 2;

  const onPointerMove = (e: PIXI.FederatedPointerEvent) => {
    const x = e.global.x;
    const y = e.global.y;
    const inCenter =
      x >= centerX - half && x <= centerX + half &&
      y >= centerY - half && y <= centerY + half;

    const rawX = e.global.x / width;
    const rawY = e.global.y / height;

    if (inCenter) {
      tweenRef.current?.kill();
      tweenRef.current = gsap.to(smoothedMouseRef.current, {
        x: rawX,
        y: rawY,
        duration: 0.25,
        ease: "power2.out",
        overwrite: true,
      });
    } else {
      tweenRef.current?.kill();
      tweenRef.current = gsap.to(smoothedMouseRef.current, {
        x: 0.5,
        y: 0.5,
        duration: 1.0,
        ease: "power2.out",
        overwrite: true,
      });
    }
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
      "fbmShader"
    );
    return new PIXI.MeshMaterial(PIXI.Texture.WHITE, {
      program,
      uniforms: {
        uTime: 0,
        uMouse: [0, 0],
      },
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

  useTick((_delta, ticker) => {
    const elapsedSeconds = ticker.lastTime / 1000;
    const mesh = meshRef.current;
    if (mesh) {
      const material = mesh.shader as PIXI.MeshMaterial;
      material.uniforms.uTime = elapsedSeconds;
      material.uniforms.uMouse = [smoothedMouseRef.current.x, smoothedMouseRef.current.y];
    }
  });

  return (
    <Container
      ref={containerRef}
      eventMode="static"
      onpointermove={onPointerMove}
    />
  );
};

export default FbmBackground;

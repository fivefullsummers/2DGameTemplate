import { useRef, useEffect, useMemo } from "react";
import * as PIXI from "pixi.js";
import { Container, useTick } from "@pixi/react";
import vertexShader from "../shaders/startScreen/vertex.glsl?raw";
import fragmentShader from "../shaders/startScreen/fragment.glsl?raw";
// import noiseChunk from "../shaders/noise/simplex2d.glsl?raw";
import gsap from "gsap";

interface StartScreenBackgroundProps {
  width: number;
  height: number;
}

const StartScreenBackground = ({ width, height }: StartScreenBackgroundProps) => {
  const containerRef = useRef<PIXI.Container>(null);
  const meshRef = useRef<PIXI.Mesh | null>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
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
      mouseRef.current.x = rawX;
      mouseRef.current.y = rawY;
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

  // Create geometry - a simple quad (plane) covering the full screen
  const geometry = useMemo(() => {
    // Create a quad with 4 vertices covering the full screen
    // Positions: bottom-left, bottom-right, top-right, top-left
    const positions = [
      0, height,      // bottom-left
      width, height,  // bottom-right
      width, 0,       // top-right
      0, 0,           // top-left
    ];

    // UV coordinates (0,0 to 1,1)
    const uvs = [
      0, 1,  // bottom-left
      1, 1,  // bottom-right
      1, 0,  // top-right
      0, 0,  // top-left
    ];

    // Indices to form two triangles: [0,1,2] and [0,2,3]
    const indices = [
      0, 1, 2,  // first triangle
      0, 2, 3,  // second triangle
    ];

    // Create geometry using Geometry class with attributes (PixiJS 7 API)
    // Mesh.containsPoint() expects getBuffer('aVertexPosition'); use same position data for hit-testing
    const geom = new PIXI.Geometry();
    geom.addAttribute('aPosition', positions, 2);
    geom.addAttribute('aVertexPosition', positions, 2);
    geom.addAttribute('aUV', uvs, 2);
    geom.addIndex(indices);
    return geom;
  }, [width, height]);

  const shader = useMemo(() => {
    // Create a Program from the vertex and fragment shader code
    const program = PIXI.Program.from(
      vertexShader,
      fragmentShader,
      "startScreenShader"
    );
    // Create a MeshMaterial with the program and initial uniforms
    return new PIXI.MeshMaterial(PIXI.Texture.WHITE, {
      program,
      uniforms: {
        uTime: 0,
        uMouse: [0, 0],
      },
    });
  }, []);

  // Create and setup the mesh
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Create the mesh if it doesn't exist
    if (!meshRef.current) {
      // Mesh constructor: geometry, shader (MeshMaterial), state (optional), drawMode (optional)
      const mesh = new PIXI.Mesh(geometry, shader);
      
      // Position the mesh at the origin (0, 0)
      mesh.x = 0;
      mesh.y = 0;
      
      meshRef.current = mesh;
      container.addChild(mesh);
    } else {
      // Update geometry if dimensions changed
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
  useTick((delta, ticker) => {
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

export default StartScreenBackground;

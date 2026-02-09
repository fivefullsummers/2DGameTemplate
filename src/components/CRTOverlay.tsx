import { useMemo, useRef, useEffect } from "react";
import { Container } from "@pixi/react";
import * as PIXI from "pixi.js";
import vertexShader from "../shaders/crt/vertex.glsl?raw";
import fragmentShader from "../shaders/crt/fragment.glsl?raw";

interface CRTOverlayProps {
  width: number;
  height: number;
  /** Scanline darkness (0–2). Default 0.75. */
  uScan?: number;
  /** Barrel warp/curvature (0–1). Default 0. */
  uWarp?: number;
}

/**
 * Lightweight full-screen CRT-style overlay.
 * Renders black scanlines, grille, curvature vignette, and subtle noise
 * on top of the existing scene without re-rendering the game into a texture.
 */
const CRTOverlay = ({ width, height, uScan = 0.30, uWarp = 0 }: CRTOverlayProps) => {
  const containerRef = useRef<PIXI.Container>(null);
  const meshRef = useRef<PIXI.Mesh | null>(null);

  // Full-screen quad geometry
  const geometry = useMemo(() => {
    const positions = [
      0, height,      // bottom-left
      width, height,  // bottom-right
      width, 0,       // top-right
      0, 0,           // top-left
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

  // Shader material with uniforms for basic CRT effect (warp + scanlines)
  const material = useMemo(() => {
    const program = PIXI.Program.from(vertexShader, fragmentShader, "crtShader");

    const meshMaterial = new PIXI.MeshMaterial(PIXI.Texture.WHITE, {
      program,
      uniforms: {
        uResolution: new Float32Array([width, height]),
        uWarp,
        uScan,
      },
    });

    return meshMaterial;
  }, [width, height, uScan, uWarp]);

  // Attach mesh to container and keep geometry in sync with viewport size
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (!meshRef.current) {
      const mesh = new PIXI.Mesh(geometry, material);
      mesh.x = 0;
      mesh.y = 0;
      // Normal blend: we rely on fragment alpha to darken underlying scene.
      mesh.blendMode = PIXI.BLEND_MODES.NORMAL;
      meshRef.current = mesh;
      container.addChild(mesh);
    } else {
      const mesh = meshRef.current;
      const oldGeometry = mesh.geometry;
      if (oldGeometry && oldGeometry !== geometry) {
        oldGeometry.destroy();
      }
      mesh.geometry = geometry;
    }

    return () => {
      const mesh = meshRef.current;
      if (mesh && container) {
        container.removeChild(mesh);
        if (mesh.geometry) mesh.geometry.destroy();
        mesh.destroy();
        meshRef.current = null;
      }
    };
  }, [geometry, material]);

  return <Container ref={containerRef} />;
};

export default CRTOverlay;


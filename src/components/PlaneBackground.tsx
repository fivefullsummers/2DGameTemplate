import { useMemo, useRef, useEffect } from "react";
import { Container } from "@pixi/react";
import * as PIXI from "pixi.js";

interface PlaneBackgroundProps {
  width: number;
  height: number;
}

// Full-screen plane mesh background.
// For now this is just a solid dark blue color; later
// we can swap the material for a custom shader.
const PlaneBackground = ({ width, height }: PlaneBackgroundProps) => {
  const containerRef = useRef<PIXI.Container>(null);
  const meshRef = useRef<PIXI.Mesh | null>(null);

  // Simple quad geometry covering the full screen
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

  const material = useMemo(() => {
    const mat = new PIXI.MeshMaterial(PIXI.Texture.WHITE);
    // Solid dark blue so we can see the background
    mat.tint = 0x050b30;
    mat.alpha = 1.0;
    return mat;
  }, []);

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

export default PlaneBackground;


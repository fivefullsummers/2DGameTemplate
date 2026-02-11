import { useMemo, useRef, useEffect } from "react";
import * as PIXI from "pixi.js";
import { Container } from "@pixi/react";
import cheapVertex from "../shaders/cheapBackground/vertex.glsl?raw";
import cheapFragment from "../shaders/cheapBackground/fragment.glsl?raw";
import backgroundPattern from "../assets/misc/background.png";

interface CheapBackgroundProps {
  width: number;
  height: number;
}

// Original pattern dimensions
const PATTERN_WIDTH = 504;
const PATTERN_HEIGHT = 705;

const CheapBackground = ({ width, height }: CheapBackgroundProps) => {
  const containerRef = useRef<PIXI.Container | null>(null);
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
    const program = PIXI.Program.from(cheapVertex, cheapFragment, "cheapBackground");
    const texture = PIXI.Texture.from(backgroundPattern);

    // Match crisp pixel-art look & avoid interpolation seams
    texture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
    texture.baseTexture.wrapMode = PIXI.WRAP_MODES.REPEAT;

    return new PIXI.MeshMaterial(texture, {
      program,
      uniforms: {
        uPattern: texture,
        uResolution: new Float32Array([width, height]),
        uTexSize: new Float32Array([PATTERN_WIDTH, PATTERN_HEIGHT]),
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
        mesh.destroy(true);
        meshRef.current = null;
      }
    };
  }, [geometry, material]);

  // Keep uResolution in sync with resizes
  useEffect(() => {
    const mesh = meshRef.current;
    if (mesh?.shader) {
      const uniforms = (mesh.shader as PIXI.MeshMaterial).uniforms as {
        uResolution?: Float32Array;
      };
      if (uniforms.uResolution) {
        uniforms.uResolution[0] = width;
        uniforms.uResolution[1] = height;
      }
    }
  }, [width, height]);

  return <Container ref={containerRef} />;
};

export default CheapBackground;


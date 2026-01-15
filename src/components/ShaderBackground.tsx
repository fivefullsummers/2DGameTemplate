import { useRef, useEffect, useCallback } from "react";
import { Graphics as PixiGraphics } from "pixi.js";
import { Graphics } from "@pixi/react";

interface ShaderBackgroundProps {
  width: number;
  height: number;
}

const ShaderBackground = ({ width, height }: ShaderBackgroundProps) => {
  const timeRef = useRef(0);
  const starsRef = useRef<Array<{ x: number; y: number; size: number; twinkleSpeed: number; twinkleOffset: number }>>([]);
  
  // Initialize stars once
  useEffect(() => {
    if (starsRef.current.length === 0) {
      const stars = [];
      const numStars = 150;
      
      for (let i = 0; i < numStars; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 2 + 0.5,
          twinkleSpeed: Math.random() * 2 + 1,
          twinkleOffset: Math.random() * Math.PI * 2,
        });
      }
      
      starsRef.current = stars;
    }
  }, [width, height]);
  
  // Starry night sky background
  const draw = useCallback((g: PixiGraphics) => {
    g.clear();
    
    const time = timeRef.current;
    
    // Draw dark blue/black gradient background
    g.beginFill(0x0a0e27, 1);
    g.drawRect(0, 0, width, height);
    g.endFill();
    
    // Add subtle nebula-like clouds
    for (let i = 0; i < 3; i++) {
      const x = (width / 3) * i + Math.sin(time * 0.2 + i) * 100;
      const y = height / 3 + Math.cos(time * 0.15 + i * 2) * 80;
      const radius = 150 + Math.sin(time * 0.3 + i) * 30;
      
      // Purple/blue nebula colors
      const nebulaColors = [0x1a1a4a, 0x2d1b4e, 0x1e2852];
      g.beginFill(nebulaColors[i % 3], 0.15);
      g.drawCircle(x, y, radius);
      g.endFill();
    }
    
    // Draw twinkling stars
    starsRef.current.forEach((star) => {
      // Calculate twinkle effect
      const twinkle = Math.abs(Math.sin(time * star.twinkleSpeed + star.twinkleOffset));
      const alpha = 0.3 + twinkle * 0.7;
      const currentSize = star.size * (0.8 + twinkle * 0.4);
      
      // Star color (mostly white, some slightly blue or yellow)
      const colorVariation = Math.sin(star.twinkleOffset);
      let starColor;
      if (colorVariation > 0.7) {
        starColor = 0xffffdd; // Slightly yellow
      } else if (colorVariation < -0.7) {
        starColor = 0xddddff; // Slightly blue
      } else {
        starColor = 0xffffff; // White
      }
      
      g.beginFill(starColor, alpha);
      g.drawCircle(star.x, star.y, currentSize);
      g.endFill();
    });
    
    // Add a few larger "bright" stars with glow
    for (let i = 0; i < 5; i++) {
      const x = (width / 6) * (i + 1) + Math.sin(time * 0.5 + i * 2) * 20;
      const y = (height / 4) * (i % 2 + 1) + Math.cos(time * 0.3 + i) * 15;
      const twinkle = Math.abs(Math.sin(time * (1 + i * 0.3) + i));
      const radius = 3 + twinkle * 2;
      
      // Glow effect
      g.beginFill(0xffffff, 0.1 * twinkle);
      g.drawCircle(x, y, radius * 2.5);
      g.endFill();
      
      // Bright core
      g.beginFill(0xffffff, 0.8 + twinkle * 0.2);
      g.drawCircle(x, y, radius);
      g.endFill();
    }
  }, [width, height]);

  // Animation loop
  useEffect(() => {
    let animationFrameId: number;

    const animate = () => {
      timeRef.current += 0.016; // Approximately 60fps
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <Graphics draw={draw} />;
};

export default ShaderBackground;

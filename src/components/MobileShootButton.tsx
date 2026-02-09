import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { powerupGunsUrl } from '../utils/assetLoader';
import {
  MOBILE_SHOOT_BUTTON_BOTTOM,
  MOBILE_SHOOT_BUTTON_SIZE,
} from '../consts/mobile-controls-config';
import { BULLET_TYPE_TO_GUN_FRAME, DEFAULT_GUN_FRAME } from '../consts/bullet-config';

interface MobileShootButtonProps {
  onShootStart: () => void;
  onShootEnd: () => void;
  shotCooldownInfo: { lastShotTime: number; fireRate: number } | null;
  /** Current effective bullet type (powerup or selected); used to pick gun sprite frame. */
  effectiveBulletType: string;
}

/** Same 5-frame spritesheet and crop logic as Powerup (guns.png). */
const GUN_FRAME_COUNT = 5;

const MobileShootButton = ({ onShootStart, onShootEnd, shotCooldownInfo, effectiveBulletType }: MobileShootButtonProps) => {
  const buttonRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [imageReady, setImageReady] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const frameIndex = BULLET_TYPE_TO_GUN_FRAME[effectiveBulletType] ?? DEFAULT_GUN_FRAME;
  const buttonSize = MOBILE_SHOOT_BUTTON_SIZE;

  // Load spritesheet once (same source as Powerup)
  useEffect(() => {
    if (!powerupGunsUrl) return;
    const img = new Image();
    imgRef.current = img;
    img.onload = () => setImageReady(true);
    img.onerror = () => setImageReady(false);
    img.src = powerupGunsUrl;
    return () => {
      imgRef.current = null;
    };
  }, []);

  // Crop one frame (integer pixels to avoid adjacent-frame bleed) and draw to fill the circle (cover); circle clips
  useEffect(() => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!imageReady || !img || !canvas || img.naturalWidth === 0) return;

    const totalWidth = img.naturalWidth;
    const totalHeight = img.naturalHeight;
    // Match Powerup exactly: 5 frames evenly spaced, frameWidth = totalWidth/5 (no rounding)
    const frameWidth = totalWidth / GUN_FRAME_COUNT;
    const frameHeight = totalHeight;
    const clampedIndex = Math.max(0, Math.min(frameIndex, GUN_FRAME_COUNT - 1));
    const sx = clampedIndex * frameWidth;
    const sy = 0;

    // Scale to fit inside circle with margin so powerup (bigger) sprites aren't cut off; basic stays centered
    const coverScale = Math.max(buttonSize / frameWidth, buttonSize / frameHeight);
    const scale = coverScale * 0.88;
    const destW = Math.ceil(frameWidth * scale);
    const destH = Math.ceil(frameHeight * scale);

    canvas.width = destW;
    canvas.height = destH;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(
      img,
      sx, sy, frameWidth, frameHeight,
      0, 0, destW, destH
    );
    // Radial mask so gun edge tapers in opacity instead of hard cut-off
    const cx = destW / 2;
    const cy = destH / 2;
    const r = Math.min(destW, destH) / 2;
    const gradient = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.65, 'rgba(255,255,255,1)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.globalCompositeOperation = 'destination-in';
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, destW, destH);
  }, [imageReady, frameIndex, buttonSize]);

  // Animate background color from red (just fired) to green (ready)
  useEffect(() => {
    const el = buttonRef.current;
    if (!el) return;

    // If we don't have cooldown info or fireRate is 0, just set to ready (green).
    if (!shotCooldownInfo || shotCooldownInfo.fireRate <= 0) {
      gsap.set(el, { backgroundColor: 'rgba(0, 255, 102, 0.6)' }); // green
      return;
    }

    const { fireRate } = shotCooldownInfo;

    // Kill any existing tween on this element
    gsap.killTweensOf(el);

    // Start from red and ease to green over fireRate duration
    gsap.fromTo(
      el,
      { backgroundColor: 'rgba(255, 51, 51, 0.6)' },  // red
      {
        backgroundColor: 'rgba(0, 255, 102, 0.6)',    // green
        duration: fireRate / 1000,
        ease: 'power2.out',
      }
    );
  }, [shotCooldownInfo]);

  const handleStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    setIsPressed(true);
    onShootStart();
  };

  const handleEnd = () => {
    setIsPressed(false);
    onShootEnd();
  };

  // Raised 3D look: highlight top-left, shadow bottom; pressed = translate down + inset shadow
  const raisedShadow = '0 4px 0 rgba(0,40,0,0.6), 0 6px 8px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.25)';
  const pressedShadow = '0 1px 0 rgba(0,40,0,0.5), inset 0 2px 4px rgba(0,0,0,0.3), inset 0 -1px 0 rgba(255,255,255,0.1)';

  return (
    <div
      ref={buttonRef}
      onTouchStart={handleStart}
      onTouchEnd={handleEnd}
      onMouseDown={handleStart}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      style={{
        position: 'absolute',
        bottom: `${MOBILE_SHOOT_BUTTON_BOTTOM}px`,
        right: '20px',
        width: `${MOBILE_SHOOT_BUTTON_SIZE}px`,
        height: `${MOBILE_SHOOT_BUTTON_SIZE}px`,
        borderRadius: '50%',
        border: '3px solid rgba(255, 255, 255, 0.7)',
        boxShadow: isPressed ? pressedShadow : raisedShadow,
        transform: isPressed ? 'translateY(3px)' : 'translateY(0)',
        transition: 'box-shadow 0.08s ease, transform 0.08s ease',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        touchAction: 'none',
        userSelect: 'none',
        zIndex: 1000,
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          pointerEvents: 'none',
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            display: 'block',
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(calc(-50% + 6px), -50%)',
          }}
          aria-hidden
        />
      </div>
    </div>
  );
};

export default MobileShootButton;

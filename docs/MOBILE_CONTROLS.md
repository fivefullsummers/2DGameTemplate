# Mobile Controls Documentation

## Overview

This document explains how the mobile controls system works and provides step-by-step instructions for adding new mobile control buttons (like shoot and run buttons) to complement the existing joystick.

## Current Architecture

### Components

1. **MobileJoystick** (`src/components/MobileJoystick.tsx`)
   - A visual joystick for 4-directional movement (UP, DOWN, LEFT, RIGHT)
   - Located in the bottom-left corner of the screen
   - Supports both touch and mouse input for testing

2. **ControlsContext** (`src/contexts/ControlsContext.tsx`)
   - Provides a centralized control state management
   - Shares controls between components outside the Pixi canvas

3. **useControls Hook** (`src/hooks/useControls.ts`)
   - Manages all input states (keyboard + mobile)
   - Tracks directions, modifiers (SHIFT), and actions (SHOOT)
   - Prioritizes mobile input over keyboard when both are active

### Data Flow

```
Mobile Button → Controls Context → useControls Hook → HeroAnimated Component
     ↓                                    ↑
Keyboard Input ──────────────────────────┘
```

## How It Works

The joystick communicates with the game through the `setJoystickDirection` callback:

```typescript
<MobileJoystick onDirectionChange={setJoystickDirection} />
```

This callback updates the control state in `useControls`, which is then read by `HeroAnimated` through props passed from the Experience component.

---

## Adding a Shoot Button

Follow these steps to add a mobile shoot button:

### Step 1: Create the MobileShootButton Component

Create a new file `src/components/MobileShootButton.tsx`:

```typescript
import { useState } from 'react';

interface MobileShootButtonProps {
  onShoot: () => void;
}

const MobileShootButton = ({ onShoot }: MobileShootButtonProps) => {
  const [isPressed, setIsPressed] = useState(false);

  const handleStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    setIsPressed(true);
    onShoot();
  };

  const handleEnd = () => {
    setIsPressed(false);
  };

  return (
    <div
      onTouchStart={handleStart}
      onTouchEnd={handleEnd}
      onMouseDown={handleStart}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      style={{
        position: 'fixed',
        bottom: '80px',
        right: '80px',
        width: '80px',
        height: '80px',
        backgroundColor: isPressed 
          ? 'rgba(255, 100, 100, 0.6)' 
          : 'rgba(255, 50, 50, 0.4)',
        borderRadius: '50%',
        border: '3px solid rgba(255, 255, 255, 0.7)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        touchAction: 'none',
        userSelect: 'none',
        zIndex: 1000,
        cursor: 'pointer',
        fontSize: '32px',
        transition: 'background-color 0.1s ease',
      }}
    >
      🔫
    </div>
  );
};

export default MobileShootButton;
```

### Step 2: Update useControls Hook

Add a method to handle mobile shoot action in `src/hooks/useControls.ts`:

```typescript
// Add to state variables
const [mobileShoot, setMobileShoot] = useState(false);

// Add after setJoystickDirection
const triggerMobileShoot = useCallback(() => {
  setShootPressed(true);
  setHeldActions((prev) => {
    return prev.includes('SHOOT') ? prev : ['SHOOT', ...prev];
  });
  
  // Auto-release after a short delay
  setTimeout(() => {
    setHeldActions((prev) => prev.filter((action) => action !== 'SHOOT'));
  }, 100);
}, []);

// Update return statement
return { 
  getControlsDirection, 
  consumeShootPress, 
  isShootHeld, 
  setJoystickDirection,
  triggerMobileShoot  // Add this
};
```

### Step 3: Update ControlsContext

Update `src/contexts/ControlsContext.tsx` to include the new method:

```typescript
interface ControlsContextType {
  getControlsDirection: ReturnType<typeof useControls>['getControlsDirection'];
  consumeShootPress: ReturnType<typeof useControls>['consumeShootPress'];
  isShootHeld: ReturnType<typeof useControls>['isShootHeld'];
  setJoystickDirection: ReturnType<typeof useControls>['setJoystickDirection'];
  triggerMobileShoot: ReturnType<typeof useControls>['triggerMobileShoot'];  // Add this
}
```

### Step 4: Add to Experience Component

Update `src/components/Experience.tsx`:

```typescript
import MobileShootButton from "./MobileShootButton";

const ExperienceContent = () => {
  // ... existing code ...
  const { 
    setJoystickDirection, 
    getControlsDirection, 
    consumeShootPress, 
    isShootHeld,
    triggerMobileShoot  // Add this
  } = useControlsContext();

  return (
    <>
      <Stage width={width} height={height} onPointerDown={handleStageClick}>
        {/* ... existing Stage content ... */}
      </Stage>
      <MobileJoystick onDirectionChange={setJoystickDirection} />
      <MobileShootButton onShoot={triggerMobileShoot} />  {/* Add this */}
    </>
  );
};
```

---

## Adding a Run Button

The run button will function as a toggle or hold button for the SHIFT modifier.

### Step 1: Create the MobileRunButton Component

Create `src/components/MobileRunButton.tsx`:

```typescript
import { useState } from 'react';

interface MobileRunButtonProps {
  onRunChange: (isRunning: boolean) => void;
}

const MobileRunButton = ({ onRunChange }: MobileRunButtonProps) => {
  const [isPressed, setIsPressed] = useState(false);

  const handleStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    setIsPressed(true);
    onRunChange(true);
  };

  const handleEnd = () => {
    setIsPressed(false);
    onRunChange(false);
  };

  return (
    <div
      onTouchStart={handleStart}
      onTouchEnd={handleEnd}
      onMouseDown={handleStart}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      style={{
        position: 'fixed',
        bottom: '180px',  // Above the shoot button
        right: '80px',
        width: '80px',
        height: '80px',
        backgroundColor: isPressed 
          ? 'rgba(100, 255, 100, 0.6)' 
          : 'rgba(50, 255, 50, 0.4)',
        borderRadius: '50%',
        border: '3px solid rgba(255, 255, 255, 0.7)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        touchAction: 'none',
        userSelect: 'none',
        zIndex: 1000,
        cursor: 'pointer',
        fontSize: '28px',
        transition: 'background-color 0.1s ease',
      }}
    >
      ⚡
    </div>
  );
};

export default MobileRunButton;
```

### Step 2: Update useControls Hook

Add mobile run support to `src/hooks/useControls.ts`:

```typescript
// Add to state variables
const [mobileRun, setMobileRun] = useState(false);

// Update getControlsDirection to include mobile run
const getControlsDirection = useCallback(
  (): { currentKey: Direction, pressedKeys: PressedKey[] } => {
    const currentKey = mobileDirection || heldDirections[0];
    const directions = mobileDirection ? [mobileDirection] : heldDirections;
    
    // Include mobile run in modifiers
    const modifiers = mobileRun ? ['SHIFT', ...heldModifiers] : heldModifiers;
    
    return {
      currentKey,
      pressedKeys: [...directions, ...modifiers, ...heldActions] as PressedKey[]
    };
  },
  [heldDirections, heldModifiers, heldActions, mobileDirection, mobileRun]
);

// Add method to set mobile run
const setMobileRun = useCallback((isRunning: boolean) => {
  setMobileRun(isRunning);
}, []);

// Update return statement
return { 
  getControlsDirection, 
  consumeShootPress, 
  isShootHeld, 
  setJoystickDirection,
  triggerMobileShoot,
  setMobileRun  // Add this
};
```

### Step 3: Update ControlsContext

Update `src/contexts/ControlsContext.tsx`:

```typescript
interface ControlsContextType {
  getControlsDirection: ReturnType<typeof useControls>['getControlsDirection'];
  consumeShootPress: ReturnType<typeof useControls>['consumeShootPress'];
  isShootHeld: ReturnType<typeof useControls>['isShootHeld'];
  setJoystickDirection: ReturnType<typeof useControls>['setJoystickDirection'];
  triggerMobileShoot: ReturnType<typeof useControls>['triggerMobileShoot'];
  setMobileRun: ReturnType<typeof useControls>['setMobileRun'];  // Add this
}
```

### Step 4: Add to Experience Component

Update `src/components/Experience.tsx`:

```typescript
import MobileRunButton from "./MobileRunButton";

const ExperienceContent = () => {
  // ... existing code ...
  const { 
    setJoystickDirection, 
    getControlsDirection, 
    consumeShootPress, 
    isShootHeld,
    triggerMobileShoot,
    setMobileRun  // Add this
  } = useControlsContext();

  return (
    <>
      <Stage width={width} height={height} onPointerDown={handleStageClick}>
        {/* ... existing Stage content ... */}
      </Stage>
      <MobileJoystick onDirectionChange={setJoystickDirection} />
      <MobileShootButton onShoot={triggerMobileShoot} />
      <MobileRunButton onRunChange={setMobileRun} />  {/* Add this */}
    </>
  );
};
```

---

## Alternative: Toggle Run Button

If you prefer a toggle button (tap to toggle run on/off) instead of hold:

```typescript
const MobileRunButton = ({ onRunChange }: MobileRunButtonProps) => {
  const [isRunning, setIsRunning] = useState(false);

  const handleToggle = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    const newState = !isRunning;
    setIsRunning(newState);
    onRunChange(newState);
  };

  return (
    <div
      onClick={handleToggle}
      onTouchStart={handleToggle}
      style={{
        // ... same styles ...
        backgroundColor: isRunning 
          ? 'rgba(100, 255, 100, 0.8)'  // Brighter when active
          : 'rgba(50, 255, 50, 0.4)',
        // Add indicator for toggle state
        boxShadow: isRunning 
          ? '0 0 20px rgba(100, 255, 100, 0.8)' 
          : 'none',
      }}
    >
      ⚡
    </div>
  );
};
```

---

## Customization Options

### Button Positioning

Create a layout configuration:

```typescript
const MOBILE_CONTROLS_LAYOUT = {
  joystick: {
    bottom: '80px',
    left: '80px',
    size: '120px',
  },
  shootButton: {
    bottom: '80px',
    right: '80px',
    size: '80px',
  },
  runButton: {
    bottom: '180px',
    right: '80px',
    size: '80px',
  },
};
```

### Styling Themes

```typescript
const BUTTON_THEMES = {
  shoot: {
    normal: 'rgba(255, 50, 50, 0.4)',
    pressed: 'rgba(255, 100, 100, 0.6)',
    icon: '🔫',
  },
  run: {
    normal: 'rgba(50, 255, 50, 0.4)',
    pressed: 'rgba(100, 255, 100, 0.6)',
    icon: '⚡',
  },
  jump: {
    normal: 'rgba(50, 150, 255, 0.4)',
    pressed: 'rgba(100, 180, 255, 0.6)',
    icon: '⬆',
  },
};
```

### Responsive Design

Add media queries to hide mobile controls on desktop:

```typescript
style={{
  // ... existing styles ...
  display: window.innerWidth > 768 ? 'none' : 'flex',
}}
```

Or create a hook:

```typescript
const useMobileDetect = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return isMobile;
};
```

Then in Experience:

```typescript
const isMobile = useMobileDetect();

return (
  <>
    {/* ... Stage content ... */}
    {isMobile && (
      <>
        <MobileJoystick onDirectionChange={setJoystickDirection} />
        <MobileShootButton onShoot={triggerMobileShoot} />
        <MobileRunButton onRunChange={setMobileRun} />
      </>
    )}
  </>
);
```

---

## Best Practices

1. **Touch Action**: Always use `touchAction: 'none'` to prevent default browser gestures
2. **Z-Index**: Keep mobile controls at z-index 1000+ to ensure they're above game canvas
3. **User Select**: Use `userSelect: 'none'` to prevent text selection during interaction
4. **Prevent Default**: Call `e.preventDefault()` in touch/mouse handlers
5. **Visual Feedback**: Provide clear visual feedback when buttons are pressed
6. **Dead Zones**: For joystick, maintain a small dead zone to prevent accidental inputs
7. **Button Size**: Make buttons at least 60-80px for comfortable touch targets

## Testing

Test mobile controls on:
- Physical mobile devices (iOS and Android)
- Browser dev tools device emulation
- Desktop with mouse (for development)

## Troubleshooting

### Controls Not Working
- Check that ControlsProvider wraps the Experience component
- Verify callbacks are properly passed through the context
- Check browser console for errors

### Poor Touch Response
- Ensure `touchAction: 'none'` is set
- Verify `preventDefault()` is called in event handlers
- Check for conflicting CSS that might capture touch events

### Buttons Hidden or Overlapping
- Verify z-index values
- Check position and bottom/left/right values
- Test on different screen sizes

---

## Future Enhancements

Consider adding:
- **Haptic Feedback**: Use Vibration API for touch feedback
- **Button Customization**: Allow users to resize/reposition buttons
- **Gesture Support**: Swipe gestures for special actions
- **Multi-touch**: Support simultaneous button presses
- **Visual Effects**: Particle effects or animations on button press

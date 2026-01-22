import { useCallback, useEffect, useState } from 'react'
import { Direction } from '../types/common'

const DIRECTION_KEYS: Record<string, Direction> = {
  ArrowUp: 'UP',
  ArrowDown: 'DOWN',
  ArrowLeft: 'LEFT',
  ArrowRight: 'RIGHT',
}

// Additional modifier keys that aren't directions
type ModifierKey = 'SHIFT'
type ActionKey = 'SHOOT'
type PressedKey = Direction | ModifierKey | ActionKey

export const useControls = () => {
  const [heldDirections, setHeldDirections] = useState<Direction[]>([])
  const [heldModifiers, setHeldModifiers] = useState<ModifierKey[]>([])
  const [heldActions, setHeldActions] = useState<ActionKey[]>([])
  const [shootPressed, setShootPressed] = useState(false) // Track shoot key press events
  const [mobileDirection, setMobileDirection] = useState<Direction | null>(null) // Track mobile joystick input
  const [mobileRun, setMobileRun] = useState(false) // Track mobile joystick run state

  const handleKey = useCallback((e: KeyboardEvent, isKeyDown: boolean) => {
    const direction = DIRECTION_KEYS[e.code]
    
    // Handle direction keys
    if (direction) {
      e.preventDefault() // Prevent default arrow key behavior (page scroll)
      setHeldDirections((prev) => {
        if (isKeyDown) {
          return prev.includes(direction) ? prev : [direction, ...prev]
        }
        return prev.filter((dir) => dir !== direction)
      })
      return
    }

    // Handle modifier keys (Shift)
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
      setHeldModifiers((prev) => {
        if (isKeyDown) {
          return prev.includes('SHIFT') ? prev : ['SHIFT', ...prev]
        }
        return prev.filter((mod) => mod !== 'SHIFT')
      })
      return
    }

    // Handle action keys (Space for shooting)
    if (e.code === 'Space') {
      e.preventDefault() // Prevent default spacebar behavior (page scroll)
      if (isKeyDown) {
        setShootPressed(true) // Signal a shoot event
        setHeldActions((prev) => {
          return prev.includes('SHOOT') ? prev : ['SHOOT', ...prev]
        })
      } else {
        setHeldActions((prev) => prev.filter((action) => action !== 'SHOOT'))
      }
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => handleKey(e, true)
    const handleKeyUp = (e: KeyboardEvent) => handleKey(e, false)

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [handleKey])

  const getControlsDirection = useCallback(
    (): { currentKey: Direction, pressedKeys: PressedKey[] } => {
      // Prioritize mobile direction if set, otherwise use keyboard
      const currentKey = mobileDirection || heldDirections[0];
      const directions = mobileDirection ? [mobileDirection] : heldDirections;
      
      // Include mobile run state in modifiers
      const modifiers = mobileRun ? ['SHIFT' as ModifierKey, ...heldModifiers] : heldModifiers;
      
      return {
        currentKey,
        pressedKeys: [...directions, ...modifiers, ...heldActions] as PressedKey[]
      };
    },
    [heldDirections, heldModifiers, heldActions, mobileDirection, mobileRun]
  )

  // Method to set direction from mobile joystick
  const setJoystickDirection = useCallback((direction: Direction | null) => {
    setMobileDirection(direction);
  }, [])

  // Method to set mobile run state from joystick
  const setJoystickRun = useCallback((isRunning: boolean) => {
    setMobileRun(isRunning);
  }, [])

  // Method to trigger shoot from mobile button
  const triggerMobileShoot = useCallback(() => {
    setShootPressed(true);
    setHeldActions((prev) => {
      return prev.includes('SHOOT') ? prev : ['SHOOT', ...prev];
    });
    
    // Auto-release after a short delay
    setTimeout(() => {
      setHeldActions((prev) => prev.filter((action) => action !== 'SHOOT'));
    }, 100);
  }, [])

  // Check if shoot was pressed and consume the event
  const consumeShootPress = useCallback(() => {
    if (shootPressed) {
      setShootPressed(false)
      return true
    }
    return false
  }, [shootPressed])

  // Check if shoot key is currently held
  const isShootHeld = useCallback(() => {
    return heldActions.includes('SHOOT')
  }, [heldActions])

  return { getControlsDirection, consumeShootPress, isShootHeld, setJoystickDirection, setJoystickRun, triggerMobileShoot }
}

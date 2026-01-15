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
type PressedKey = Direction | ModifierKey

export const useControls = () => {
  const [heldDirections, setHeldDirections] = useState<Direction[]>([])
  const [heldModifiers, setHeldModifiers] = useState<ModifierKey[]>([])

  const handleKey = useCallback((e: KeyboardEvent, isKeyDown: boolean) => {
    const direction = DIRECTION_KEYS[e.code]
    
    // Handle direction keys
    if (direction) {
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
    (): { currentKey: Direction, pressedKeys: PressedKey[] } => ({ 
      currentKey: heldDirections[0], 
      pressedKeys: [...heldDirections, ...heldModifiers] as PressedKey[]
    }),
    [heldDirections, heldModifiers]
  )

  return { getControlsDirection }
}

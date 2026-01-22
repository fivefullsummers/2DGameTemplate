# Scorekeeping System Documentation

## Overview
The scorekeeping system implements classic Space Invaders scoring mechanics with a modern React/TypeScript architecture. It consists of a **GameState** manager class and a **HUD** display component.

---

## Architecture

### 1. GameState Manager (`src/utils/GameState.ts`)
Singleton class that manages all game state and score tracking.

#### Key Features:
- **Score Tracking**: Current score, high score with localStorage persistence
- **Lives System**: 3 starting lives, extra life at 1,500 points
- **Wave Management**: Track current wave number
- **Enemy Tracking**: Count remaining and total enemies
- **Statistics**: Track shots fired, hits, and accuracy
- **Observable Pattern**: Subscribe to state changes for reactive updates

#### Score Values (from Space Invaders):
```typescript
ENEMY_TOP: 30 points     // Row 0 (top row)
ENEMY_MIDDLE: 20 points  // Rows 1-2 (middle rows)
ENEMY_BOTTOM: 10 points  // Rows 3-4 (bottom rows)
```

#### Core Methods:

**Initialization:**
- `initGame(totalEnemies)` - Start new game
- `initWave(totalEnemies)` - Start new wave

**Score Management:**
- `addScore(points)` - Add points to score
- `addEnemyKillScore(rowIndex)` - Auto-calculate score based on enemy row
- `registerShot()` - Track shot fired
- `getAccuracy()` - Calculate hit percentage

**Lives Management:**
- `addLife()` - Add extra life (max 9)
- `loseLife()` - Lose a life
- `isGameOver()` - Check if lives are depleted

**State Access:**
- `getState()` - Get complete game state object
- `subscribe(callback)` - Subscribe to state changes (returns unsubscribe function)
- Individual getters: `getScore()`, `getLives()`, `getWave()`, etc.

**Persistence:**
- `resetHighScore()` - Clear saved high score
- Auto-saves high score to localStorage

#### Usage Example:
```typescript
import { gameState } from '../utils/GameState';

// Initialize game
gameState.initGame(55); // 55 enemies in classic Space Invaders

// Add score when enemy destroyed
gameState.addEnemyKillScore(0); // Top row = 30 points
gameState.addEnemyKillScore(2); // Middle row = 20 points
gameState.addEnemyKillScore(4); // Bottom row = 10 points

// Track shooting
gameState.registerShot();

// Lose life when player hit
gameState.loseLife();

// Subscribe to state changes
const unsubscribe = gameState.subscribe((state) => {
  console.log('Score:', state.score);
  console.log('Lives:', state.lives);
  console.log('Wave:', state.wave);
});

// Don't forget to unsubscribe when component unmounts
unsubscribe();
```

---

### 2. HUD Component (`src/components/HUD.tsx`)
React component that displays game information in classic arcade style.

#### Display Elements:

**Main HUD Bar (Top):**
- **Score**: Current score (6-digit format with leading zeros)
- **Hi-Score**: Highest score (yellow, persisted)
- **Wave**: Current wave number (cyan)
- **Lives**: Visual display of remaining lives (green triangles)

**Enemy Counter:**
- Progress bar showing enemies remaining vs total
- Text: "ENEMIES: X / Y"
- Animated fill bar

**Messages:**
- **Wave Complete**: Shown when all enemies destroyed
- **Extra Life**: Brief flash when extra life awarded at 1,500 points
- **Game Over**: Flashing indicator when lives depleted

**Debug Info (Optional):**
- Accuracy percentage
- Shots fired count
- Hits count

#### Props:
```typescript
interface HUDProps {
  showDebugInfo?: boolean; // Show accuracy/stats (default: false)
}
```

#### Usage:
```tsx
import HUD from './components/HUD';

// Basic usage
<HUD />

// With debug info
<HUD showDebugInfo={true} />
```

---

### 3. Styling (`src/components/HUD.css`)
Classic arcade aesthetic with modern CSS.

#### Visual Features:
- **Color Scheme**: Retro green monochrome with accent colors
  - Score: Green (#00ff00)
  - High Score: Yellow (#ffff00)
  - Wave: Cyan (#00ffff)
- **CRT Effects**: 
  - Scanline overlay
  - Glow text shadows
  - Pulsing animations
- **Responsive Design**: Mobile-friendly breakpoints
- **Animations**:
  - Score glow pulse
  - Life icon pulse
  - Progress bar animation
  - Message appear/fade effects

---

## Integration

### In Experience.tsx:
```typescript
import HUD from "./HUD";
import { gameState } from "../utils/GameState";

// Initialize game state on mount
useEffect(() => {
  gameState.initGame(initialEnemies.length);
}, [initialEnemies.length]);

// Update score when enemy destroyed
const removeEnemy = useCallback((enemyId: string) => {
  setEnemies((prev) => {
    const enemyIndex = prev.findIndex((enemy) => enemy.id === enemyId);
    if (enemyIndex !== -1) {
      const rowIndex = Math.floor(enemyIndex / 11); // 11 columns per row
      gameState.addEnemyKillScore(rowIndex);
    }
    return prev.filter((enemy) => enemy.id !== enemyId);
  });
}, []);

// Lose life when player hit
const handlePlayerHit = useCallback(() => {
  gameState.loseLife();
  // ... trigger death animation
}, []);

// Render HUD
return (
  <>
    <HUD showDebugInfo={false} />
    <Stage>
      {/* ... game content */}
    </Stage>
  </>
);
```

---

## Future Enhancements

### Planned Features:
1. **Wave Progression System**
   - Auto-spawn new wave when current wave complete
   - Increase difficulty per wave
   - Wave transition screen

2. **Combo System**
   - Multiplier for rapid kills
   - Combo counter display
   - Bonus points for maintaining combo

3. **UFO/Mystery Ship**
   - Random appearance
   - 50-300 point value
   - Special sound effect

4. **Statistics Screen**
   - End-game summary
   - Total accuracy
   - Waves completed
   - Time survived

5. **Leaderboard**
   - Top 10 scores
   - Player names/initials
   - Date achieved

6. **Power-ups** (optional)
   - Rapid fire
   - Shield
   - Double points

7. **Sound Integration**
   - Score increase sound
   - Life lost sound
   - Extra life sound
   - Wave complete sound

---

## Testing Checklist

### Core Functionality:
- [x] Score increases when enemy destroyed
- [x] Correct points awarded based on enemy row (10/20/30)
- [x] High score saves to localStorage
- [x] High score persists between sessions
- [x] Lives decrease when player hit
- [x] Extra life awarded at 1,500 points
- [x] Extra life awarded only once
- [x] HUD displays all information correctly
- [x] HUD updates in real-time

### Visual:
- [x] Score displays with leading zeros
- [x] Lives show as triangles
- [x] Enemy progress bar updates
- [x] Wave complete message appears
- [x] Extra life message appears briefly
- [x] Game over indicator flashes when lives = 0
- [x] Responsive on mobile devices

### Edge Cases:
- [ ] Score doesn't overflow at high values
- [ ] Lives capped at maximum (9)
- [ ] Wave number increments correctly
- [ ] Game state resets properly for new game
- [ ] Multiple enemy kills in rapid succession
- [ ] Player death and respawn

---

## File Structure

```
src/
├── utils/
│   └── GameState.ts          # Score and game state manager
├── components/
│   ├── HUD.tsx               # HUD display component
│   ├── HUD.css               # HUD styling
│   └── Experience.tsx        # Game integration
└── docs/
    └── SCOREKEEPING_SYSTEM.md # This documentation
```

---

## API Reference

### GameState Class

#### Properties (Private):
```typescript
score: number
highScore: number
lives: number
wave: number
enemiesRemaining: number
totalEnemies: number
extraLifeAwarded: boolean
shotsfired: number
hits: number
```

#### Public Methods:
```typescript
// Singleton
static getInstance(): GameState
static reset(): void

// Initialization
initGame(totalEnemies: number): void
initWave(totalEnemies: number): void

// Score
addScore(points: number): void
addEnemyKillScore(rowIndex: number): void

// Lives
addLife(): void
loseLife(): void

// Stats
registerShot(): void
getAccuracy(): number

// State
getState(): IGameStateData
subscribe(callback: Function): Function (unsubscribe)
isGameOver(): boolean
isWaveComplete(): boolean

// Getters
getScore(): number
getHighScore(): number
getLives(): number
getWave(): number
getEnemiesRemaining(): number
getTotalEnemies(): number
getShotsFired(): number
getHits(): number

// Persistence
resetHighScore(): void
```

#### IGameStateData Interface:
```typescript
interface IGameStateData {
  score: number;
  highScore: number;
  lives: number;
  wave: number;
  enemiesRemaining: number;
  totalEnemies: number;
  extraLifeAwarded: boolean;
  shotsfired: number;
  hits: number;
}
```

---

## Constants

### Score Values (`SCORE_VALUES`):
```typescript
ENEMY_TOP: 30
ENEMY_MIDDLE: 20
ENEMY_BOTTOM: 10
UFO_MIN: 50
UFO_MAX: 300
```

### Game Constants (`GAME_CONSTANTS`):
```typescript
STARTING_LIVES: 3
EXTRA_LIFE_THRESHOLD: 1500
STARTING_WAVE: 1
TOTAL_ENEMIES: 55
```

---

## Notes

### Design Decisions:
1. **Singleton Pattern**: Ensures one source of truth for game state across all components
2. **Observable Pattern**: Components automatically update when state changes
3. **LocalStorage**: High score persists between browser sessions
4. **Row-Based Scoring**: Enemy score calculated from row index (0-4)
5. **Extra Life Once**: Classic Space Invaders only awards one extra life at 1,500 points

### Performance Considerations:
- HUD uses CSS animations instead of JS for smooth performance
- State updates are batched to minimize re-renders
- Subscription pattern prevents unnecessary prop drilling

### Browser Compatibility:
- Requires localStorage support
- CSS animations require modern browser
- Tested on Chrome, Firefox, Safari, Edge

---

*Last Updated: January 18, 2026*

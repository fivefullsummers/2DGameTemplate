# Game Over System

## Overview
The Game Over system handles the end-game state when the player loses all their lives, providing options to play again or return to the main menu.

---

## Components

### 1. GameOverScreen (`src/components/GameOverScreen.tsx`)
A full-screen overlay that displays:
- **Flashing "GAME OVER" title** - Red gradient with pulsing animation
- **New High Score message** - Shows if player achieved a new high score
- **Game Statistics**:
  - Final Score
  - High Score
  - Wave reached
  - Accuracy percentage
- **Action Buttons**:
  - **PLAY AGAIN** - Restart the game with fresh state
  - **MAIN MENU** - Return to start screen

### 2. App State Management (`src/App.tsx`)
The main app now manages three game states:
- `'menu'` - Start screen
- `'playing'` - Active gameplay
- `'gameOver'` - Game over screen

**State Transitions:**
```
menu → [Start Game] → playing
playing → [Lives = 0] → gameOver
gameOver → [Play Again] → playing
gameOver → [Main Menu] → menu
```

### 3. Experience Component Updates (`src/components/Experience.tsx`)
Added game over detection:
- Subscribes to `GameState` changes
- Monitors player lives
- Triggers game over transition when lives ≤ 0
- Stops level music on game over
- 2-second delay before showing Game Over screen (allows player to see final death animation)

---

## Game Flow

### 1. Player Loses Life
```typescript
// In Experience.tsx or PlayerAnimated.tsx
gameState.loseLife();
```

### 2. Game Over Detected
```typescript
// Experience subscribes to game state
gameState.subscribe((state) => {
  if (state.lives <= 0) {
    // Stop music
    levelMusic.stop();
    
    // Delay transition for death animation
    setTimeout(() => {
      onGameOver();
    }, 2000);
  }
});
```

### 3. Show Game Over Screen
- Displays final statistics
- Shows "NEW HIGH SCORE!" if applicable
- Presents action buttons

### 4. User Actions

#### Play Again
```typescript
handlePlayAgain() {
  gameState.initGame(55); // Reset game state
  setCurrentGameState('playing'); // Return to game
}
```

#### Main Menu
```typescript
handleMainMenu() {
  gameState.initGame(55); // Reset game state
  setCurrentGameState('menu'); // Return to menu
}
```

---

## Features

### Visual Design
- **Shader Background**: Same animated background as start screen
- **Flashing Title**: "GAME OVER" pulses with red gradient
- **Gold Highlight**: "NEW HIGH SCORE!" in gold gradient (when applicable)
- **Clean Stats Display**: Shows all relevant game statistics
- **Interactive Buttons**: Hover effects with scale animation

### Audio
- **Game Over Sound**: Plays explosion sound on screen mount
- **Button Clicks**: Sound feedback for button interactions
- **Music Management**: Level music stops before game over screen

### Statistics Displayed
- **Final Score**: Player's score for this game
- **High Score**: Best score ever achieved (persisted in localStorage)
- **Wave**: Which wave the player reached
- **Accuracy**: Hit/miss ratio percentage

---

## Technical Details

### GameState Integration
The system uses the existing `GameState` singleton:
- `gameState.isGameOver()` - Check if lives depleted
- `gameState.getState()` - Get complete game stats
- `gameState.initGame(totalEnemies)` - Reset for new game
- `gameState.subscribe(callback)` - Listen for state changes

### High Score Detection
```typescript
const isNewHighScore = finalState.score === finalState.highScore && finalState.score > 0;
```
Shows "NEW HIGH SCORE!" banner when:
- Current score equals high score
- Score is greater than 0

### Delay Before Transition
```typescript
setTimeout(() => {
  onGameOver();
}, 2000); // 2 seconds
```
Allows player to:
- See the final death animation
- Hear the death sound effect
- Process the game over moment

---

## Testing

### Manual Testing
1. **Lose all lives** - Let enemies hit you 3 times
2. **Verify display**:
   - Game Over screen appears after 2-second delay
   - Statistics show correctly
   - High score updates if beaten
3. **Test Play Again** - Should restart game with 3 lives
4. **Test Main Menu** - Should return to start screen

### Edge Cases
- ✅ First game (no previous high score)
- ✅ New high score achieved
- ✅ Music stops properly
- ✅ Game state resets correctly
- ✅ Multiple play again cycles

---

## Future Enhancements

### Potential Additions
- [ ] **Leaderboard**: Show top 10 scores
- [ ] **Share Score**: Social media integration
- [ ] **Game Stats History**: Track games played, total kills, etc.
- [ ] **Achievements**: Unlock special badges
- [ ] **Continue Option**: Use credits to continue from current wave
- [ ] **Name Entry**: Enter initials for high score (classic arcade style)

### Visual Polish
- [ ] **Screen Shake**: On game over transition
- [ ] **Particles**: Explosion effects
- [ ] **Score Count-Up**: Animate final score display
- [ ] **Trophy Icon**: For new high score

---

## Related Files

### Core Files
- `src/components/GameOverScreen.tsx` - Game over UI component
- `src/App.tsx` - Main app state management
- `src/components/Experience.tsx` - Game loop and game over detection
- `src/utils/GameState.ts` - Score and lives management

### Related Documentation
- `SPACE_INVADERS_MECHANICS.md` - Game rules and mechanics
- `SCOREKEEPING_SYSTEM.md` - Score tracking details
- `IMPLEMENTATION_SUMMARY.md` - Overall game structure

---

## Implementation Checklist

- ✅ GameOverScreen component created
- ✅ App state management updated
- ✅ Experience component monitors game over
- ✅ Music stops on game over
- ✅ Delay before transition (2 seconds)
- ✅ Play Again functionality
- ✅ Main Menu functionality
- ✅ Statistics display (score, wave, accuracy)
- ✅ High score detection and display
- ✅ Sound effects for interactions

---

*The Game Over system completes the core game loop, allowing players to restart or exit gracefully when they lose all lives.*

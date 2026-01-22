# Classic Space Invaders Game Mechanics

## Overview
Space Invaders is a fixed shooter arcade game where the player controls a laser cannon that moves horizontally across the bottom of the screen. The goal is to defeat waves of descending aliens while avoiding their projectiles.

---

## 📊 Scoring System

### Enemy Point Values
In classic Space Invaders, different enemies award different points based on their row position:

| Enemy Type | Row Position | Points | Notes |
|------------|-------------|--------|-------|
| **Top Row (Squid)** | Row 1 | **30 points** | Highest value aliens |
| **Middle Rows (Crab)** | Rows 2-3 | **20 points** | Medium value aliens |
| **Bottom Rows (Octopus)** | Rows 4-5 | **10 points** | Lowest value aliens |
| **Mystery Ship (UFO)** | Top of screen | **50-300 points** | Appears randomly, moves horizontally |

### Mystery Ship Scoring Pattern
The mystery ship (UFO) follows a predictable scoring pattern based on the number of shots fired:
- Can award: 50, 100, 150, or 300 points
- The 300-point shot typically occurs every 23rd shot (in original game)

### Bonus Points
- **Wave Clear Bonus**: No official bonus in original, but modern versions often add this
- **Accuracy Bonus**: Not in original, but can be added for modern versions

---

## 👾 Enemy Mechanics

### Formation & Layout
- **Grid Formation**: 11 columns × 5 rows = 55 aliens total
- **Spacing**: Consistent horizontal and vertical spacing between aliens
- **Types by Row**:
  - Row 1 (top): Squid aliens (30 pts each)
  - Rows 2-3: Crab aliens (20 pts each)
  - Rows 4-5: Octopus aliens (10 pts each)

### Movement Pattern
1. **Horizontal Movement**:
   - Move as a group left or right
   - Initial speed: relatively slow
   - Move a fixed distance per step
   
2. **Descent**:
   - When reaching screen edge, entire formation:
     - Drops down one row (8-16 pixels)
     - Reverses horizontal direction
   
3. **Speed Acceleration**:
   - Movement speed increases as aliens are destroyed
   - Formula (approximate): `speed = baseSpeed * (1 + (destroyed/total))`
   - Faster with fewer aliens remaining
   - Can become extremely fast with only 1-2 aliens left

4. **Audio Cue**:
   - 4-note sound loop plays with each step
   - Tempo increases with speed

### Shooting Behavior
- **Active Shooters**: Only aliens in the bottom-most position of each column can shoot
- **Shot Frequency**:
  - Random interval between shots
  - Increases as player progresses
  - Maximum of 3 alien bullets on screen at once (in original)
- **Bullet Speed**: Constant downward velocity
- **Targeting**: Generally random, not aimed at player

### Win Condition
- **Defeat All Aliens**: Destroy all 55 aliens to complete the wave
- **Next Wave**: Formation reappears closer to bottom, slightly faster

### Lose Conditions
1. **Alien Reaches Bottom**: If any alien reaches the player's row level = Game Over
2. **Lives Depleted**: Player loses all lives = Game Over

---

## 🚀 Player Mechanics

### Movement
- **Horizontal Only**: Left and right movement along bottom of screen
- **Speed**: Constant movement speed
- **Boundaries**: Cannot move beyond left/right screen edges
- **Controls**: 
  - Keyboard: Arrow keys or A/D
  - Touch: Virtual joystick for mobile

### Shooting
- **Fire Rate**: One bullet on screen at a time (in original)
  - Must wait for bullet to hit target or reach top of screen
  - Modern versions often allow 2-3 bullets
- **Bullet Speed**: Fast upward velocity (faster than enemy bullets)
- **Reload**: Instant once bullet is cleared

### Lives System
- **Starting Lives**: 3 lives (classic) or 5 lives (some versions)
- **Extra Life**: Award extra life at certain point thresholds:
  - Classic: 1,500 points (one time only)
  - Modern: Every 10,000 or 15,000 points
- **Lose Life When**:
  - Hit by enemy bullet
  - Enemy reaches player level
- **Respawn**: Brief invincibility period (optional in modern versions)

### Shields/Bunkers
- **Quantity**: 4 bunkers between player and aliens
- **Position**: Evenly spaced across screen
- **Durability**: 
  - Destructible by both player and enemy bullets
  - Gradual erosion (pixel-by-pixel in original)
  - Can be destroyed by aliens moving through them
- **Protection**: Blocks bullets but deteriorates over time

---

## 🎮 Wave Progression

### Wave System
1. **Wave 1**: 
   - Normal speed
   - Standard formation starts at top
   
2. **Wave 2+**:
   - Formation starts slightly lower each wave
   - Aliens may move slightly faster initially
   - Shot frequency may increase

3. **Difficulty Scaling**:
   - Each wave increases enemy aggression
   - Faster base movement speed
   - More frequent shots
   - Formation starts closer to player

### Progressive Difficulty
- **Speed**: +5-10% base speed per wave
- **Starting Position**: Formation moves ~8 pixels lower per wave
- **Shot Frequency**: +10-15% more aggressive per wave
- **Maximum Difficulty**: Eventually plateaus at very high waves

---

## 🎯 Game States

### 1. Start Screen
- Display title
- High score
- Instructions
- "Press any key to start"

### 2. Playing
- Active gameplay
- Display: Score, Lives, Wave Number, High Score

### 3. Wave Complete
- Brief pause
- Optional "Wave Clear" message
- Load next wave (possibly with animation)

### 4. Player Death
- Brief explosion animation
- Pause (1-2 seconds)
- Respawn or game over

### 5. Game Over
- Display final score
- Check if new high score
- Show "Game Over" message
- Option to restart

---

## 📈 High Score System

### Persistence
- **Storage**: LocalStorage or database
- **Display**: Always visible during gameplay
- **Update**: Real-time when player beats it
- **Reset**: Only manual or on clear data

### Leaderboard (Optional)
- Top 10 scores
- Player initials/names
- Date achieved

---

## 🎵 Audio & Feedback

### Sound Effects
1. **Player Shoot**: Sharp laser sound
2. **Enemy Death**: Explosion/pop sound
3. **Player Death**: Larger explosion sound
4. **UFO Appearance**: Unique siren/warble sound
5. **UFO Destroyed**: Special high-value sound
6. **Movement Beat**: 4-note descending bass loop (speeds up)

### Visual Feedback
1. **Explosions**: 
   - Small for aliens
   - Larger for player
   - Unique for UFO
2. **Screen Flash**: On player death (optional)
3. **Score Popup**: Show points earned above destroyed enemy

---

## 🎪 Special Features

### Mystery Ship (UFO)
- **Appearance**: Random intervals (every 20-30 seconds)
- **Movement**: Crosses top of screen horizontally (left-to-right or right-to-left)
- **Sound**: Distinct warbling sound while active
- **Value**: 50-300 points (see scoring section)
- **Frequency**: Appears less often at higher waves

### Shields/Bunkers Erosion
- **Gradual Destruction**: Each bullet removes a chunk
- **Strategic Value**: Early game protection, less useful later
- **Regeneration**: Do not regenerate between waves (classic behavior)

---

## 🔧 Technical Constants

### Suggested Values for Implementation

```typescript
// Score Values
ENEMY_SCORE_TOP = 30      // Top row aliens
ENEMY_SCORE_MIDDLE = 20   // Middle rows
ENEMY_SCORE_BOTTOM = 10   // Bottom rows
UFO_SCORE_MIN = 50
UFO_SCORE_MAX = 300

// Lives
STARTING_LIVES = 3
EXTRA_LIFE_THRESHOLD = 1500

// Formation
COLUMNS = 11
ROWS = 5
TOTAL_ENEMIES = 55

// Speed Scaling
BASE_SPEED = 1.0
SPEED_MULTIPLIER_PER_WAVE = 1.1
SPEED_MULTIPLIER_PER_KILL = 1.02

// Shooting
MAX_PLAYER_BULLETS = 1    // Classic: 1, Modern: 2-3
MAX_ENEMY_BULLETS = 3
ENEMY_SHOOT_CHANCE = 0.005  // Per frame, per eligible alien

// Movement
PLAYER_MOVE_SPEED = 5
BULLET_SPEED_PLAYER = 8
BULLET_SPEED_ENEMY = 4
ALIEN_STEP_SIZE = 8
ALIEN_DROP_DISTANCE = 16

// Timing
PLAYER_RESPAWN_DELAY = 2000    // milliseconds
WAVE_COMPLETE_DELAY = 3000     // milliseconds
UFO_SPAWN_INTERVAL = 25000     // milliseconds (random ±5000)
```

---

## 🎯 Implementation Checklist

### Core Systems
- [ ] Score tracking and display
- [ ] Lives system
- [ ] Wave progression
- [ ] High score persistence
- [ ] Enemy formation management
- [ ] Speed scaling as enemies are destroyed
- [ ] Collision detection (bullets vs enemies, bullets vs player)

### Enemy Behavior
- [ ] Horizontal movement with edge detection
- [ ] Descent on direction change
- [ ] Speed increases with fewer enemies
- [ ] Bottom-row aliens can shoot
- [ ] Max 3 enemy bullets on screen

### Player Features
- [ ] Horizontal movement with boundaries
- [ ] Shooting with cooldown/limit
- [ ] Death and respawn
- [ ] Lives tracking
- [ ] Extra life at threshold

### Polish
- [ ] Sound effects for all actions
- [ ] Explosion animations
- [ ] Score popups
- [ ] UFO/Mystery ship
- [ ] Shields/bunkers
- [ ] Wave complete screen
- [ ] Game over screen
- [ ] Background music/ambient sound

---

## 🎨 Modern Variations (Optional Enhancements)

### Quality of Life
- Multiple bullets allowed
- Shield regeneration between waves
- Power-ups (rapid fire, shields, etc.)
- Difficulty selection
- Pause functionality

### Scoring Enhancements
- Combo multipliers for rapid kills
- Accuracy bonus
- Wave completion bonus
- Perfect wave bonus (no hits taken)
- Speed bonus (complete wave quickly)

### Visual Enhancements
- Particle effects
- Screen shake on events
- Color variations per wave
- Background parallax
- Animated sprites

---

*This document serves as the specification for implementing authentic Space Invaders gameplay with scoring mechanics.*

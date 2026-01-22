# Loading Screen System

## Overview

A comprehensive loading screen system that tracks all game assets (textures, maps, animations) and displays a beautiful progress indicator while loading.

## Features

- **Progress Tracking**: Real-time loading progress (0-100%)
- **Asset Names**: Shows which asset is currently loading
- **Error Handling**: Displays error messages if loading fails
- **Beautiful UI**: Modern gradient background with animated progress bar
- **Responsive**: Works on all screen sizes

## Architecture

### 1. Asset Loader (`src/utils/assetLoader.ts`)

Core utility that manages asset loading using PIXI.js Assets API.

**Key Components:**
- `ASSET_MANIFEST`: Array defining all assets to load
  - Hero animations: walk, run, idle, shoot
  - Level map
  - Bullet sprites
- `AssetLoader` class: Handles loading with progress callbacks
- Singleton instance: `assetLoader`

**Usage:**
```typescript
import { assetLoader } from './utils/assetLoader';

await assetLoader.loadAll((progress, assetName) => {
  console.log(`Loading: ${assetName} (${progress * 100}%)`);
});
```

### 2. Loading Hook (`src/hooks/useAssetLoader.ts`)

React hook that provides loading state management.

**Returns:**
- `isLoading`: boolean - Whether assets are still loading
- `progress`: number (0-1) - Loading progress
- `currentAsset`: string - Name of current asset
- `error`: Error | null - Any loading errors

**Usage:**
```typescript
const { isLoading, progress, currentAsset, error } = useAssetLoader();
```

### 3. Loading Screen Component (`src/components/LoadingScreen.tsx`)

Beautiful UI component that displays loading progress.

**Features:**
- Animated gradient background
- Progress bar with shimmer effect
- Percentage display
- Current asset name with animated dots
- Error display (if loading fails)

**Props:**
```typescript
interface LoadingScreenProps {
  progress: number;        // 0-1
  currentAsset: string;    // "Hero walking animation"
  error?: Error | null;    // Optional error
}
```

### 4. App Integration (`src/App.tsx`)

The main app now waits for all assets to load before showing the game.

```typescript
const { isLoading, progress, currentAsset, error } = useAssetLoader();

if (isLoading) {
  return <LoadingScreen progress={progress} currentAsset={currentAsset} error={error} />;
}

return <Experience />;
```

## Adding New Assets

To add a new asset to the loading system:

1. **Import the asset** in `assetLoader.ts`:
   ```typescript
   import newAsset from "../assets/new-asset.png";
   ```

2. **Add to ASSET_MANIFEST**:
   ```typescript
   {
     alias: "new-asset",
     src: newAsset,
     description: "Description of new asset",
   }
   ```

3. The asset will now be:
   - Loaded automatically on app start
   - Tracked in the progress bar
   - Displayed in the loading screen

## Technical Details

### PIXI.js Assets Integration

The system uses PIXI's built-in asset loader which provides:
- Automatic texture caching
- Progress callbacks
- Error handling
- Parallel loading

### Loading Flow

1. App mounts → `useAssetLoader` hook initializes
2. Hook calls `assetLoader.loadAll()` with progress callback
3. Progress updates trigger React state changes
4. `LoadingScreen` re-renders with new progress
5. When complete (100%), loading screen fades out
6. Game (`Experience`) component renders

### Performance

- All assets load in parallel (not sequential)
- Textures are cached in PIXI's texture cache
- No duplicate loads (handled by `textureCache.ts`)
- Minimal re-renders using React state optimization

## Styling

The loading screen uses modern CSS with:
- CSS gradients for background
- Backdrop blur effect
- CSS animations (shimmer, fade-in)
- Responsive design for mobile/tablet
- Custom animations for progress bar

Customize in `LoadingScreen.css`:
- Colors: `.loading-screen`, `.loading-bar-fill`
- Animation speed: `@keyframes shimmer`
- Layout: `.loading-container`

## Error Handling

If an asset fails to load:
1. Error is caught in `useAssetLoader`
2. Loading screen shows error state
3. Error message and details displayed
4. User can refresh to retry

## Testing

To test the loading screen:
1. Open browser DevTools
2. Throttle network to "Slow 3G"
3. Refresh the page
4. Watch the loading progress

## Future Enhancements

Potential improvements:
- Skip button (load critical assets first)
- Retry button on error
- Background music during loading
- Animated logo or characters
- Loading tips/hints display
- Per-asset progress (not just overall)

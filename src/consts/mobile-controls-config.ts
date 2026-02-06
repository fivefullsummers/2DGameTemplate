// Central configuration for mobile on-screen controls so that
// layout-sensitive gameplay tuning (like player start height)
// can stay in sync with the actual DOM button positions/sizes.
//
// If you tweak the mobile button layout, update these values and
// the calculation in `tuning-config.ts` will automatically respect it.

// Horizontal movement buttons (left/right) container
export const MOBILE_MOVE_BUTTON_BOTTOM = 30; // px from bottom of viewport
export const MOBILE_MOVE_BUTTON_SIZE = 60;   // px diameter of each circle

// Shoot button
export const MOBILE_SHOOT_BUTTON_BOTTOM = 30; // px from bottom of viewport
export const MOBILE_SHOOT_BUTTON_SIZE = 60;   // px diameter of the circle

// Extra vertical clearance between the TOP of the buttons area
// and the player's Y position (in screen space).
export const MOBILE_PLAYER_SAFE_BUFFER = 20; // px


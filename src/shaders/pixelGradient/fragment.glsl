precision lowp float;

varying vec2 vUV;

uniform vec2 uResolution;
uniform float uTime;
uniform vec2 uMouse;
uniform float uMouseActive;
uniform sampler2D uNoise;

// Fixed square block grid (same size everywhere so lines don't skew)
// Higher value = smaller, finer squares.
const float PIXEL_GRID = 50.0;

// Simple hash for twinkling variation per star cell
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

// Twinkling star pattern that operates directly on the pixel-grid indices.
// Each star occupies exactly one pixel-block so no neighbouring squares are affected.
// Rows are laid out in a "brick" pattern: every other row is horizontally offset.
float starPattern(vec2 blockIndex, float time, float vPos01) {
    // Coarse star grid in block space. Tune these for spacing.
    const float STAR_STEP_X = 10.0;
    const float STAR_STEP_Y = 8.0;

    // Determine which coarse row group this block is in
    float rowGroup = floor(blockIndex.y / STAR_STEP_Y);
    // Apply a half-cell horizontal offset on odd rows for the brick layout
    float xOffset = mod(rowGroup, 2.0) * (STAR_STEP_X * 0.5);

    // Work with an offset X so odd rows are shifted between the stars below
    float shiftedX = blockIndex.x + xOffset;

    // Identify which coarse star cell this block belongs to, in the offset space
    vec2 cell = floor(vec2(shiftedX, blockIndex.y) / vec2(STAR_STEP_X, STAR_STEP_Y));
    vec2 local = mod(vec2(shiftedX, blockIndex.y), vec2(STAR_STEP_X, STAR_STEP_Y));

    // Only one block per cell is the "core" star block (top-left of the cell in offset space)
    float isCore = step(local.x, 0.5) * step(local.y, 0.5);

    // Per-star randomization for twinkle speed/phase
    float h1 = hash(cell);
    float h2 = hash(cell + 13.37);
    float speed = mix(1.2, 3.0, h1);
    float phase = h2 * 6.2831853;

    // Twinkle between off and bright over time
    float twinkle = 0.5 + 0.5 * sin(time * speed + phase);

    // Bottom gets stronger stars than the top
    float verticalAmp = mix(0.05, 1.4, vPos01);

    return isCore * twinkle * verticalAmp;
}

void main() {
    // Convert to pixel coordinates
    vec2 fragCoord = vUV * uResolution;

    // Screen-space Y goes 0 at top -> 1 at bottom in Pixi.
    // We want "upwards" (toward the top) to be lighter in the gradient
    // but keep pixel blocks perfectly square and constant size.
    float upT = 1.0 - vUV.y;

    // Constant square blocks in screen space
    float blockSizePixels = min(uResolution.x, uResolution.y) / PIXEL_GRID;
    vec2 blockSize = vec2(blockSizePixels);

    // i_pos / f_pos style pixelation: sample once per block so each block shares a color
    vec2 i_pos = floor(fragCoord / blockSize);
    vec2 sampleCoord = (i_pos + 0.5) * blockSize;

    // Use the sampled Y position to drive a vertical gradient that gets lighter upward.
    float gradientT = 1.0 - (sampleCoord.y / uResolution.y);
    // Ease the gradient a bit so the mid-section is smoother.
    gradientT = pow(gradientT, 1.1);

    // Deep blue at the bottom, lighter/cyan-ish toward the top.
    vec3 bottomColor = vec3(0.01, 0.02, 0.12);
    vec3 topColor = vec3(0.20, 0.55, 0.95);
    vec3 color = mix(bottomColor, topColor, gradientT);

    // Twinkling star pattern underneath the gradient. We evaluate it per
    // pixel-grid block so a lit star only affects exactly one square.
    float star = starPattern(i_pos, uTime, vUV.y);
    vec3 starColor = vec3(0.70, 0.90, 1.0);
    // Stronger contribution so colour change is more visible, but still subtle.
    color += starColor * star * 0.55;

    // Checker pattern that tapers off as we go upward. This gives us a
    // subtle, fine checker like the "star pattern with checkerboard layout"
    // reference, but with squares instead of stars and no large grid lines.
    float checker = mod(i_pos.x + i_pos.y, 2.0);
    float checkerStrength = pow(vUV.y, 1.1); // strong at bottom, fades upward
    float checkerFactor = mix(1.0, 0.8 + 0.2 * checker, checkerStrength);
    color *= checkerFactor;

    // Very subtle noise-based dithering to break up visible banding.
    float dither = texture2D(uNoise, sampleCoord / uResolution * 6.0).r - 0.5;
    color += dither * 0.03;
    color = clamp(color, 0.0, 1.0);

    gl_FragColor = vec4(color, 1.0);
}


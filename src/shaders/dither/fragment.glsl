precision lowp float;

varying vec2 vUV;

uniform vec2 uResolution;
uniform float uTime;
uniform vec2 uMouse;
uniform float uMouseActive;
uniform sampler2D uNoise;
// Controls how quickly the gradient ramps; larger r makes the
// top portion compress and the bottom darker, matching the
// 'r' concept from the dithered shading tutorial.
uniform float uR;
// Number of brightness steps (levels) for quantization.
uniform float uLevels;
// Visual size of each Bayer tile in screen pixels.
uniform float uDitherScale;
// Height of the dithered gradient band as a fraction of screen height (0..1).
// 1.0 = full height, smaller values focus the effect around the vertical center.
uniform float uBandHeight;

// Bayer ordered dithering helpers based on the "Dithered Shading Tutorial":
// https://medium.com/the-bkpt/dithered-shading-tutorial-29f57d06ac39

// 2x2 Bayer
float bayer2(vec2 a) {
    a = floor(a);
    return fract(a.x / 2.0 + a.y * a.y * 0.75);
}

// 4x4 Bayer
float bayer4(vec2 a) {
    vec2 q = floor(a / 2.0);
    return (bayer2(a) + 0.25 * bayer2(q));
}

// 8x8 Bayer
float bayer8(vec2 a) {
    vec2 q = floor(a / 4.0);
    return (bayer4(a) + 0.25 * bayer4(q));
}

void main() {
    // Pixel coordinates
    vec2 fragCoord = vUV * uResolution;

    // Normalized Y (0 at top, 1 at bottom)
    float y = fragCoord.y / uResolution.y;

    // Ordered dither value in the 0..1 range using an 8x8 Bayer matrix.
    // Use integer "dither pixels" so the pattern forms a clean, non-wonky grid.
    // DITHER_SCALE controls how big each Bayer tile appears on screen.
    float DITHER_SCALE = max(uDitherScale, 1.0);
    vec2 ditherCoord = floor(fragCoord / DITHER_SCALE);
    // Constrain into the 0..7 range so we always address a single 8x8 Bayer tile,
    // which avoids larger-scale "slice" artifacts when zoomed.
    vec2 bayerCoord = mod(ditherCoord, 8.0);
    float threshold = bayer8(bayerCoord); // 0..1

    // Compute the vertical band where dithering/gradient is active.
    // Centered at 0.5 with adjustable height.
    float bandH = clamp(uBandHeight, 0.01, 1.0);
    float bandCenter = 0.5;
    float bandStart = clamp(bandCenter - bandH * 0.5, 0.0, 1.0);
    float bandEnd = clamp(bandCenter + bandH * 0.5, 0.0, 1.0);

    float q;
    if (y < bandStart) {
        // Top region: solid light shade (no dithering)
        q = 1.0;
    } else if (y > bandEnd) {
        // Bottom region: solid dark shade (no dithering)
        q = 0.0;
    } else {
        // Middle band: apply ramp + ordered dithering.
        // Map y within band to [0,1], where 1.0 is the top of the band.
        float local = (bandEnd - y) / max(bandEnd - bandStart, 0.0001);
        float t = pow(clamp(local, 0.0, 1.0), uR);

        // Ordered dithering for multi-level shading, following the formulation:
        // q = floor( T(x,y) + (LEVELS-1) * value ) / (LEVELS-1)
        // where T is the Bayer threshold in [0,1).
        float levelsMinusOne = max(uLevels - 1.0, 1.0);
        float level = floor(threshold + t * levelsMinusOne);
        q = level / levelsMinusOne;
    }

    // Map quantized brightness to shades of the target blue.
    // Base colour: #04003d (4, 0, 61)
    vec3 bottomColor = vec3(4.0 / 255.0, 0.0, 61.0 / 255.0);
    // Lighter shade derived from the same base colour.
    vec3 topColor = clamp(bottomColor * 2.0, 0.0, 1.0);
    vec3 color = mix(bottomColor, topColor, q);

    gl_FragColor = vec4(color, 1.0);
}


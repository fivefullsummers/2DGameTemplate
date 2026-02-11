precision lowp float;

varying vec2 vUV;

uniform sampler2D uPattern;
uniform vec2 uResolution;
uniform vec2 uTexSize;

void main() {
    // Screen-space coordinate (0,0) bottom-left
    vec2 coord = gl_FragCoord.xy;

    // Tile horizontally based on texture width
    float tileX = fract(coord.x / uTexSize.x);

    // Match the loading screen orientation, but avoid sampling past
    // the actual texture height (that was causing the faint vertical bands).
    float yNorm = coord.y / uTexSize.y;
    float v;
    if (yNorm >= 1.0) {
        // Above the pattern: just sample the very top row once
        // so the area is perfectly uniform (no seams).
        v = 0.0;
    } else {
        // Inside the pattern: invert Y so dense dither is at the top.
        v = 1.0 - yNorm;
    }

    vec2 uv = vec2(tileX, v);

    gl_FragColor = texture2D(uPattern, uv);
}



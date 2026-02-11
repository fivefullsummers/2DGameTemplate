precision lowp float;

varying vec2 vUV;

uniform sampler2D uPattern;
uniform vec2 uResolution;
uniform vec2 uTexSize;

void main() {
    // Screen-space coordinate (0,0) bottom-left. Tile in both directions
    // so the pattern fills the entire screen on any aspect ratio (e.g. mobile).
    vec2 coord = gl_FragCoord.xy;

    float tileX = fract(coord.x / uTexSize.x);
    // Tile vertically as well; invert Y so dense dither stays at top of each tile.
    float tileY = fract(coord.y / uTexSize.y);
    float v = 1.0 - tileY;

    vec2 uv = vec2(tileX, v);

    gl_FragColor = texture2D(uPattern, uv);
}



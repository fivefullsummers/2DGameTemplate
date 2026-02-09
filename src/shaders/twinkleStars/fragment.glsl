precision lowp float;

varying vec2 vUV;

uniform vec2 uResolution;
uniform float uTime;

// Same hash as space shader for deterministic star positions
float rand(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
    vec2 uv = vUV;

    // Midnight black background (dark with a hint of blue)
    vec3 color = vec3(0.01, 0.01, 0.06);

    // Grid of star cells (~10x fewer than before: 15x15 = 225 stars)
    const float gridSize = 15.0;
    vec2 cell = floor(uv * gridSize);
    vec2 cellUV = fract(uv * gridSize);

    // Star position within cell (deterministic from cell id)
    vec2 starPos = vec2(
        rand(cell + 0.1),
        rand(cell + 0.7)
    );

    float dist = length(cellUV - starPos);
    // Tiny points: small radius and tight falloff so stars stay pin-sized
    const float starRadius = 0.018;
    const float soft = 0.006;

    if (dist < starRadius + soft) {
        float star = 1.0 - smoothstep(starRadius - soft, starRadius + soft, dist);
        // Per-star twinkle: offset time by unique seed so each star pulses at different times
        // (see e.g. clockworkchilli.com space shaders - sin(time + offset) with clamp for brightness)
        float phase = uTime * 4.0 + rand(cell + 0.33) * 6.28318;
        float twinkle = clamp(sin(phase), 0.15, 1.0);
        float bright = star * twinkle;
        color = mix(color, vec3(1.0, 1.0, 1.0), bright);
    }

    gl_FragColor = vec4(color, 1.0);
}

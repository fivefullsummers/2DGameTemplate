precision lowp float;

varying vec2 vUV;

uniform vec2 uResolution;
uniform float uWarp;
uniform float uScan;

void main() {
    vec2 uv = vUV;
    vec2 dc = abs(uv - 0.5);
    dc *= dc;

    uv.x = (uv.x - 0.5) * (1.0 + dc.y * (0.3 * uWarp)) + 0.5;
    uv.y = (uv.y - 0.5) * (1.0 + dc.x * (0.4 * uWarp)) + 0.5;

    // Branchless: bezel = 1 when out of bounds, 0 when in bounds
    float outX = step(uv.x, 0.0) + step(1.0, uv.x);
    float outY = step(uv.y, 0.0) + step(1.0, uv.y);
    float bezel = min(1.0, outX + outY);

    float fragY = vUV.y * uResolution.y;
    float alpha = clamp(abs(sin(fragY)) * 0.5 * uScan, 0.0, 1.0);

    gl_FragColor = mix(
        vec4(0.0, 0.0, 0.0, alpha),
        vec4(0.0, 0.0, 0.0, 1.0),
        bezel
    );
}


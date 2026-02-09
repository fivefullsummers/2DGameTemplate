precision mediump float;

varying vec2 vUV;

// Resolution in pixels (width, height), analogous to iResolution.xy
uniform vec2 uResolution;

// Controls from the reference shader
uniform float uWarp; // simulate curvature of CRT monitor
uniform float uScan; // simulate darkness between scanlines

void main() {
    // Normalized coordinates 0..1, like in the reference
    vec2 uv = vUV;

    // squared distance from center
    vec2 dc = abs(0.5 - uv);
    dc *= dc;

    // warp the fragment coordinates (barrel distortion)
    uv.x -= 0.5;
    uv.x *= 1.0 + (dc.y * (0.3 * uWarp));
    uv.x += 0.5;
    uv.y -= 0.5;
    uv.y *= 1.0 + (dc.x * (0.4 * uWarp));
    uv.y += 0.5;

    // sample inside boundaries, otherwise set to a dark bezel
    if (uv.y > 1.0 || uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    } else {
        // Simple scanline darkness based on pixel row
        float fragY = vUV.y * uResolution.y;
        float apply = abs(sin(fragY) * 0.5 * uScan);
        float alpha = clamp(apply, 0.0, 1.0);

        // Black overlay: underlying scene shows through via alpha
        gl_FragColor = vec4(0.0, 0.0, 0.0, alpha);
    }
}


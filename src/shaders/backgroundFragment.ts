// Fragment Shader for Background
// You can add your custom shader code here

export const fragmentShader = `
precision mediump float;

varying vec2 vUV;

uniform float uTime;
uniform vec2 uResolution;

// Example animated background shader
// Replace this with your own shader code
void main() {
    vec2 uv = vUV;
    
    // Create animated waves
    float wave1 = sin(uv.x * 10.0 + uTime * 2.0) * 0.5 + 0.5;
    float wave2 = cos(uv.y * 10.0 + uTime * 1.5) * 0.5 + 0.5;
    float wave3 = sin((uv.x + uv.y) * 5.0 + uTime) * 0.5 + 0.5;
    
    // Combine waves to create color
    vec3 color = vec3(
        wave1 * 0.3 + 0.1,
        wave2 * 0.4 + 0.2,
        wave3 * 0.5 + 0.3
    );
    
    // Add some glow effect
    float glow = sin(uTime) * 0.2 + 0.8;
    color *= glow;
    
    gl_FragColor = vec4(color, 1.0);
}
`;

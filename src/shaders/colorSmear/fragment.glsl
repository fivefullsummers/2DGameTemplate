precision mediump float;

varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform vec2 uResolution;
uniform float uTime;
uniform float uStrength;
// 0 = no smear (sharp), 1 = full smear. Driven by player movement.
uniform float uMovement;
// Smear direction X: 1 = smear right (moving left), -1 = smear left (moving right).
uniform float uDirection;
// Smear direction Y: 1 = smear down (moving up / exit), -1 = smear up (moving down).
uniform float uDirectionY;

void main(void) {
  vec2 uv = vTextureCoord;

  float px = 1.0 / uResolution.x;
  float py = 1.0 / uResolution.y;
  vec2 stepVec = vec2(uDirection * px, uDirectionY * py) * uStrength * uMovement;

  if (uMovement <= 0.001) {
    gl_FragColor = texture2D(uSampler, uv);
    return;
  }

  // Per-channel offsets (chromatic split) along smear direction.
  float baseOffset = 0.025 * uStrength * uMovement * 4.0;
  vec2 offsetVec = vec2(baseOffset * uDirection * px, baseOffset * uDirectionY * py);
  vec4 base = texture2D(uSampler, uv);
  vec4 rSample = texture2D(uSampler, uv - stepVec * 2.0 - offsetVec);
  vec4 gSample = texture2D(uSampler, uv - stepVec * 1.0);
  vec4 bSample = texture2D(uSampler, uv - stepVec * 2.0 + offsetVec);

  float r = 0.5 * base.r + 0.4 * rSample.r + 0.1 * gSample.r;
  float g = 0.6 * base.g + 0.3 * gSample.g + 0.1 * bSample.g;
  float b = 0.5 * base.b + 0.4 * bSample.b + 0.1 * gSample.b;

  gl_FragColor = vec4(r, g, b, base.a);
}


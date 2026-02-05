attribute vec2 aPosition;
attribute vec2 aUV;

uniform mat3 projectionMatrix;
uniform mat3 translationMatrix;


varying vec2 vUV;

void main() {
    vUV = aUV;
    vec3 position = projectionMatrix * translationMatrix * vec3(aPosition, 1.0);
    gl_Position = vec4(position.xy, 0.0, 1.0);
}

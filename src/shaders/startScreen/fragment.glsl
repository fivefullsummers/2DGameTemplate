#define PI 3.14159265358979323846
#define TWO_PI 6.28318530718

varying vec2 vUV;
uniform float uTime;
uniform vec2 uMouse;

float shape(vec2 st, int N){
    st = st*2.-1.;
    float a = atan(st.x,st.y)+PI;
    float r = TWO_PI/float(N);
    return cos(floor(.5+a/r)*r-a)*length(st);
}

float box(vec2 st, vec2 size){
    return shape(st*size,4);
}

float random(vec2 uv) {
    return fract(
        sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453123);
}

vec2 random2( vec2 p ) {
    return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);
}

vec2 rotate2D(vec2 uv, float angle) {
    uv -= 0.5;
    uv = mat2(cos(angle), -sin(angle),
            sin(angle), cos(angle)) * uv;

    uv += 0.5;
    return uv;
}

float parabola(float x, float k) {
    return pow(4.0 * x * (1.0 - x), k);
}

vec2 pattern(vec2 uv, float scale) {
    uv *= scale;
    uv = mod(uv, 1.0);
    return uv;
}

float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) +
            (c - a) * u.y * (1.0 - u.x) + 
            (d - b) * u.x * u.y;
}

#define NUM_OCTAVES 5

float fbm(vec2 st) {
    float v = 0.0;
    float a = 0.5;
    vec2 shift = vec2(100.0);
    mat2 rot = mat2(cos(0.5), sin(0.5),
                    -sin(0.5), cos(0.5));
    for (int i = 0; i < NUM_OCTAVES; ++i) {
        v += a * noise(st);
        st = rot * st * 2.0 + shift;
        a *= 0.5;
    }
    return v;
}

void main() {
    vec2 uv = vUV;
    // Flow: displace UV toward mouse so the noise "streams" toward the cursor
    vec2 toMouse = uMouse - vUV;
    float dist = length(toMouse);
    float pull = 0.1 * (dist * 5.);  // stronger pull when cursor is close
    uv += toMouse * pull * 2.0;        // flow direction and strength
    uv *= 10.0;

    vec2 mouseOffset = (uMouse - 0.01) * 2.0;  // extra domain shift from mouse

    vec3 color = vec3(0.0);

    vec2 q = vec2(0.);
    q.x = fbm(uv + 1.00*uTime + uMouse.x);
    q.y = fbm(uv + vec2(1.0) + uMouse.y * 0.7);

    vec2 r = vec2(0.);
    r.x = fbm(uv + 1.0 * q + vec2(1.7,9.2) + uTime + mouseOffset);
    r.y = fbm(uv + 1.0 * q + vec2(8.3,2.8) + uTime + mouseOffset);

    float f = fbm(uv + r + mouseOffset * 0.5);

    color = mix(vec3(0.101961,0.619608,0.666667),
                vec3(0.666667,0.666667,0.498039),
                clamp((f*f)*4.0,0.0,1.0));

    color = mix(color,
                vec3(0,0,0.164706),
                clamp(length(q),0.0,1.0));

    color = mix(color,
                vec3(0.666667,1,1),
                clamp(length(r.x),0.0,1.0));

    // vec2 i_st = floor(uv);
    // vec2 f_st = fract(uv);

    // vec2 point = random2(i_st);
    // vec2 diff = point - f_st;

    // float m_dist = 1.0;
    // vec2 m_point;

    // for (int y = -1; y <= 1; y++) {
    //     for (int x = -1; x <= 1; x++) {
    //         vec2 neighbour = vec2(float(x), float(y));

    //         vec2 point = random2(i_st + neighbour);

    //         point = 0.5 + 0.2 * sin(uTime + 6.2831 * point);

    //         vec2 diff = neighbour + point - f_st;

    //         float dist = length(diff);

    //         if (dist < m_dist) {
    //             m_dist = dist;
    //             m_point = point;
    //         }
    //     }
    // }

    // color = vec3(step(0.5, dot(m_point, vec2(1.0, .2))), dot(m_point, vec2(0.2, 0.4)), dot(m_point, vec2(0.1, 0.8)));
    // color.g += dot(m_point, vec2(.1, .9));
    // color.b += dot(m_point, vec2(.1, .9));
    // color = vec3(random2(i_p));

    // Basic pattern / shape
    // float boxShape = box(uv, vec2(1.0, 1.0));

    // Sample simplex noise (from shared noise module)
    // Scroll noise over time on X and Y
    // float n = snoise(uv * 4.0 + vec2(uTime * 0.1, uTime * 0.15));

    // Use noise to modulate intensity of the box
    // float intensity = 0.5 + 0.5 * n;

    gl_FragColor = vec4((f*f*f*f+.9*f*f+.6*f)*color,1.);
}

varying vec3 vWorldPosition;
uniform float uTime;
uniform float uAudio;
uniform vec3 uBaseColor1;
uniform vec3 uBaseColor2;
uniform vec3 uPulseTint1;
uniform vec3 uPulseTint2;
uniform vec3 uToneShift;

float hash(vec3 p) {
  p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

void main() {
  vec3 dir = normalize(vWorldPosition);
  float t = uTime * 0.05;

  // Enhanced visibility for grid
  float stripes = abs(sin(dir.y * 100.0 + t * 30.0)) * 0.18;
  float grid = abs(sin(dir.x * 50.0 + t * 40.0) * sin(dir.z * 50.0 - t * 40.0)) * 0.18;
  float n = hash(dir * 100.0 + t * 10.0) * 0.03;

  // Base darker gradient (using uniforms)
  vec3 baseColor = mix(uBaseColor1, uBaseColor2, dir.y * 0.5 + 0.5);

  // Punchier pulse with palette tones
  float pulse = smoothstep(0.0, 1.0, uAudio) * 0.5;
  vec3 pulseTint = mix(uPulseTint1, uPulseTint2, pulse);
  baseColor += pulseTint * pulse;

  // Beat glow around grid lines
  float glow = pow(stripes + grid, 2.0) * (0.4 + pulse * 1.6);
  vec3 color = baseColor + vec3(glow + n) * 1.1;

  // Add subtle tone-shift to make pulse visible (using uniform)
  color = mix(color, color * uToneShift, pulse * 0.6);

  gl_FragColor = vec4(color, 1.0);
}

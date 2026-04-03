uniform vec3 uColorA;
uniform vec3 uColorB;
uniform float uMorphProgress;
uniform float uOpacity;
uniform float uCoreBoost;

varying float vMorphProgress;

void main() {
  // Circular mask — discard corners of gl_PointCoord square
  vec2 uv = gl_PointCoord - vec2(0.5);
  float dist = length(uv);
  if (dist > 0.5) discard;

  // Bright core with soft radial falloff
  float strength = 1.0 - (dist * 2.0);
  strength = pow(strength, 2.5);

  // Color transitions from XR cyan to AI violet as morphProgress increases
  vec3 colorA = uColorA; // #00E5FF cyan
  vec3 colorB = uColorB; // #8B5CF6 violet
  vec3 color = mix(colorA, colorB, uMorphProgress);

  // Slight brightness boost on the core
  color += vec3(strength * uCoreBoost);

  gl_FragColor = vec4(color, strength * uOpacity);
}

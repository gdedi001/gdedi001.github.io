uniform float uTime;
uniform float uMorphProgress;
uniform float uSize;
uniform float uPixelRatio;

attribute vec3 aTargetPosition;
attribute float aRandom;

varying float vMorphProgress;
varying float aRandomOut;

void main() {
  // Staggered morph — each particle has a unique delay based on its random value
  float delay = aRandom * 0.3;
  float localProgress = clamp((uMorphProgress - delay) / (1.0 - delay), 0.0, 1.0);
  // Smooth step for organic feel
  localProgress = localProgress * localProgress * (3.0 - 2.0 * localProgress);

  vec3 morphed = mix(position, aTargetPosition, localProgress);

  // Subtle continuous drift — keeps particles feeling alive
  float driftX = sin(uTime * 0.4 + aRandom * 6.2831) * 0.018;
  float driftY = cos(uTime * 0.35 + aRandom * 6.2831) * 0.018;
  morphed.x += driftX;
  morphed.y += driftY;

  vec4 mvPosition = modelViewMatrix * vec4(morphed, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  // Size attenuation with perspective
  gl_PointSize = uSize * uPixelRatio * (180.0 / -mvPosition.z);
  gl_PointSize = clamp(gl_PointSize, 1.0, 12.0);

  vMorphProgress = localProgress;
}

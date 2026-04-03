uniform float uTime;
uniform vec3 uColor;
uniform float uOpacity;

varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUv;

void main() {
  // Scanlines — horizontal bands that animate over time
  float scanline = sin(vUv.y * 120.0 + uTime * 1.5) * 0.05 + 0.95;

  // Fresnel rim glow — bright at grazing angles
  vec3 viewDir = normalize(cameraPosition - vPosition);
  float fresnel = pow(1.0 - abs(dot(viewDir, normalize(vNormal))), 2.0);

  // Edge flicker
  float flicker = sin(uTime * 3.0 + vUv.y * 10.0) * 0.02 + 0.98;

  float alpha = uOpacity * (0.25 + fresnel * 0.75) * scanline * flicker;

  vec3 finalColor = uColor + fresnel * 0.25;

  gl_FragColor = vec4(finalColor, alpha);
}

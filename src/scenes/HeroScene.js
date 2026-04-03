import * as THREE from 'three';
import { EffectComposer }  from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass }      from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { gsap }            from 'gsap';
import vertShader from '../shaders/particles.vert';
import fragShader from '../shaders/particles.frag';

const PARTICLE_COUNT = window.innerWidth < 768 ? 7000 : 16000;
const GLOBE_RADIUS   = 2.6;

// ─── Procedural position generators ────────────────────────────────────────

function generateGlobePositions(count) {
  const positions = new Float32Array(count * 3);
  const R = GLOBE_RADIUS;

  // Distribution: 45% latitude lines, 35% longitude lines, 20% surface scatter
  const latCount  = Math.floor(count * 0.45);
  const lonCount  = Math.floor(count * 0.35);
  const surfCount = count - latCount - lonCount;

  const LAT_LINES = 18;  // horizontal rings
  const LON_LINES = 28;  // vertical great-circle arcs

  let idx = 0;

  // ── Latitude rings ──────────────────────────────────────────────────────
  for (let i = 0; i < latCount; i++) {
    // Pick a latitude line index, skipping the exact poles
    const lineIdx = Math.floor(Math.random() * LAT_LINES);
    // phi from just above south pole to just below north pole
    const phi = -Math.PI / 2 + (Math.PI / (LAT_LINES + 1)) * (lineIdx + 1);
    const theta = Math.random() * Math.PI * 2;
    const jitter = (Math.random() - 0.5) * 0.04;
    positions[idx++] = (R + jitter) * Math.cos(phi) * Math.cos(theta);
    positions[idx++] = (R + jitter) * Math.sin(phi);
    positions[idx++] = (R + jitter) * Math.cos(phi) * Math.sin(theta);
  }

  // ── Longitude arcs ──────────────────────────────────────────────────────
  for (let i = 0; i < lonCount; i++) {
    const lineIdx = Math.floor(Math.random() * LON_LINES);
    const theta = (Math.PI * 2 / LON_LINES) * lineIdx;
    const phi   = -Math.PI / 2 + Math.random() * Math.PI; // full arc pole to pole
    const jitter = (Math.random() - 0.5) * 0.04;
    positions[idx++] = (R + jitter) * Math.cos(phi) * Math.cos(theta);
    positions[idx++] = (R + jitter) * Math.sin(phi);
    positions[idx++] = (R + jitter) * Math.cos(phi) * Math.sin(theta);
  }

  // ── Surface scatter — creates "continent" density clusters ──────────────
  // Seed a handful of hotspot centres on the globe surface
  const hotspots = Array.from({ length: 12 }, () => {
    const phi   = -Math.PI / 2 + Math.random() * Math.PI;
    const theta = Math.random() * Math.PI * 2;
    return { phi, theta };
  });

  for (let i = 0; i < surfCount; i++) {
    const hs    = hotspots[Math.floor(Math.random() * hotspots.length)];
    const spread = 0.35 + Math.random() * 0.35;
    const phi   = hs.phi   + (Math.random() - 0.5) * spread;
    const theta = hs.theta + (Math.random() - 0.5) * spread;
    const r     = R + (Math.random() - 0.5) * 0.06;
    positions[idx++] = r * Math.cos(phi) * Math.cos(theta);
    positions[idx++] = r * Math.sin(phi);
    positions[idx++] = r * Math.cos(phi) * Math.sin(theta);
  }

  return positions;
}

function generateNeuralPositions(count) {
  const neuronCount = 50;
  const neurons = Array.from({ length: neuronCount }, () => new THREE.Vector3(
    (Math.random() - 0.5) * 7,
    (Math.random() - 0.5) * 4.5,
    (Math.random() - 0.5) * 2.5
  ));

  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    if (Math.random() < 0.35) {
      // Cluster on a neuron node
      const n = neurons[Math.floor(Math.random() * neuronCount)];
      const r = Math.random() * 0.2;
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.random() * Math.PI;
      positions[i * 3 + 0] = n.x + r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = n.y + r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = n.z + r * Math.cos(phi);
    } else {
      // Along an axon between two neurons
      const a = neurons[Math.floor(Math.random() * neuronCount)];
      const b = neurons[Math.floor(Math.random() * neuronCount)];
      const t = Math.random();
      positions[i * 3 + 0] = a.x + (b.x - a.x) * t + (Math.random() - 0.5) * 0.06;
      positions[i * 3 + 1] = a.y + (b.y - a.y) * t + (Math.random() - 0.5) * 0.06;
      positions[i * 3 + 2] = a.z + (b.z - a.z) * t;
    }
  }
  return positions;
}

function generateScatterPositions(count) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = 8 + Math.random() * 12;
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.random() * Math.PI;
    positions[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }
  return positions;
}

// ─── HeroScene class ────────────────────────────────────────────────────────

export class HeroScene {
  constructor(scrollManager) {
    this.canvas    = document.getElementById('hero-canvas');
    this.isVisible = true;

    this._mouse      = { x: 0, y: 0 };
    this._targetRot  = { x: 0, y: 0 };
    this._autoRotY   = 0;
    this._morphProgress = 0;

    this._initRenderer();
    this._initScene();
    this._initParticles();
    this._initPostProcessing();
    this._initMouseParallax();
    this._initResize();

    // Subscribe to journey section scroll for morph
    scrollManager.onSection('journey', (progress) => {
      // Morph starts at 40% into the journey scroll
      this._morphProgress = Math.max(0, Math.min(1, (progress - 0.35) / 0.55));
      this._particleMaterial.uniforms.uMorphProgress.value = this._morphProgress;
    });

    // Run intro animation after a short delay
    setTimeout(() => this._runIntroAnimation(), 400);
  }

  _initRenderer() {
    this._renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: false,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this._renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this._renderer.setSize(window.innerWidth, window.innerHeight);
    this._renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this._renderer.toneMappingExposure = 1.0;
  }

  _initScene() {
    this._scene  = new THREE.Scene();
    this._camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    this._camera.position.z = 8;
    // Position globe to right half of screen, text overlays the left
    this._camera.position.x = -1.2;
  }

  _initParticles() {
    const count = PARTICLE_COUNT;

    this._gdPositions      = generateGlobePositions(count);
    this._neuralPositions  = generateNeuralPositions(count);
    this._scatterPositions = generateScatterPositions(count);

    const randoms = new Float32Array(count);
    for (let i = 0; i < count; i++) randoms[i] = Math.random();

    // Start at scatter — will animate to GD in intro
    const initPositions = new Float32Array(this._scatterPositions);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position',        new THREE.BufferAttribute(initPositions, 3));
    geometry.setAttribute('aTargetPosition', new THREE.BufferAttribute(this._neuralPositions, 3));
    geometry.setAttribute('aRandom',         new THREE.BufferAttribute(randoms, 1));

    this._geometry = geometry;

    this._particleMaterial = new THREE.ShaderMaterial({
      vertexShader:   vertShader,
      fragmentShader: fragShader,
      uniforms: {
        uTime:          { value: 0 },
        uMorphProgress: { value: 0 },
        uSize:          { value: 4.5 },
        uPixelRatio:    { value: Math.min(window.devicePixelRatio, 1.5) },
        uColorA:        { value: new THREE.Color('#00E5FF') },
        uColorB:        { value: new THREE.Color('#8B5CF6') },
        uOpacity:       { value: 1.0 }
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this._particles = new THREE.Points(geometry, this._particleMaterial);
    this._scene.add(this._particles);
  }

  _initPostProcessing() {
    this._composer = new EffectComposer(this._renderer);
    this._composer.addPass(new RenderPass(this._scene, this._camera));

    const bloom = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.035, // strength
      0.5,   // radius
      0.22   // threshold
    );
    this._composer.addPass(bloom);
    this._bloom = bloom;
  }

  _runIntroAnimation() {
    const posAttr = this._geometry.attributes.position;
    const arr     = posAttr.array;
    const scatter = this._scatterPositions;
    const target  = this._gdPositions;
    const proxy   = { t: 0 };

    gsap.to(proxy, {
      t: 1,
      duration: 2.8,
      ease: 'power2.out',
      onUpdate: () => {
        const p = proxy.t;
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          const i3 = i * 3;
          arr[i3]     = scatter[i3]     + (target[i3]     - scatter[i3])     * p;
          arr[i3 + 1] = scatter[i3 + 1] + (target[i3 + 1] - scatter[i3 + 1]) * p;
          arr[i3 + 2] = scatter[i3 + 2] + (target[i3 + 2] - scatter[i3 + 2]) * p;
        }
        posAttr.needsUpdate = true;
      },
      onComplete: () => {
        // After intro, lock the position buffer to the globe as the stable base
        posAttr.array.set(this._gdPositions);
        posAttr.needsUpdate = true;
      }
    });
  }

  _initMouseParallax() {
    window.addEventListener('mousemove', (e) => {
      this._mouse.x =  (e.clientX / window.innerWidth  - 0.5) * 2;
      this._mouse.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    });
  }

  _initResize() {
    window.addEventListener('resize', () => {
      const w = window.innerWidth, h = window.innerHeight;
      this._renderer.setSize(w, h);
      this._composer.setSize(w, h);
      this._camera.aspect = w / h;
      this._camera.updateProjectionMatrix();
      this._particleMaterial.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 1.5);
    });
  }

  render(elapsed) {
    if (!this.isVisible) return;

    // Slow auto-rotation of the globe
    this._autoRotY += 0.0015;

    // Smooth mouse parallax layered on top of auto-rotation
    this._targetRot.y += (this._mouse.x * 0.25 - this._targetRot.y) * 0.04;
    this._targetRot.x += (this._mouse.y * 0.12 - this._targetRot.x) * 0.04;
    this._particles.rotation.y = this._autoRotY + this._targetRot.y;
    this._particles.rotation.x = this._targetRot.x;

    this._particleMaterial.uniforms.uTime.value = elapsed;

    this._composer.render();
  }
}

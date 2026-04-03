import * as THREE from 'three';

export class JourneyScene {
  constructor(scrollManager) {
    this.canvas    = document.getElementById('journey-canvas');
    this.isVisible = false;
    this._scrollProgress = 0;

    this._initRenderer();
    this._initScene();
    this._initXREnvironment();
    this._initAIEnvironment();
    this._initResize();

    scrollManager.onSection('journey', (progress) => {
      this._scrollProgress = progress;
      this._updateScroll(progress);
    });
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
  }

  _initScene() {
    this._scene  = new THREE.Scene();
    this._camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 100);
    this._camera.position.set(0, 2, 8);
    this._camera.lookAt(0, 0, 0);

    // Ambient light
    this._scene.add(new THREE.AmbientLight(0x111122, 2));

    // XR point light (cyan)
    this._xrLight = new THREE.PointLight(0x00E5FF, 3, 20);
    this._xrLight.position.set(0, 4, 2);
    this._scene.add(this._xrLight);

    // AI point light (violet)
    this._aiLight = new THREE.PointLight(0x8B5CF6, 3, 20);
    this._aiLight.position.set(0, -8, 2);
    this._scene.add(this._aiLight);
  }

  _initXREnvironment() {
    this._xrGroup = new THREE.Group();

    // Neon grid floor
    const gridHelper = new THREE.GridHelper(24, 30, 0x00E5FF, 0x003344);
    gridHelper.material.opacity = 0.45;
    gridHelper.material.transparent = true;
    gridHelper.position.y = -2;
    this._xrGroup.add(gridHelper);

    // Floating VR ring / portal visual
    const ringGeo = new THREE.TorusGeometry(1.8, 0.03, 8, 60);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00E5FF, transparent: true, opacity: 0.7 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.set(-3, 1, -2);
    ring.rotation.y = 0.4;
    this._xrGroup.add(ring);
    this._xrRing = ring;

    // Second smaller ring
    const ring2Geo = new THREE.TorusGeometry(1.1, 0.02, 8, 48);
    const ring2 = new THREE.Mesh(ring2Geo, ringMat.clone());
    ring2.position.set(3.5, 0.5, -3);
    ring2.rotation.x = 0.5;
    this._xrGroup.add(ring2);
    this._xrRing2 = ring2;

    // XR era floating particles (small, static)
    const xrPartCount = 600;
    const xrGeo = new THREE.BufferGeometry();
    const xrPos = new Float32Array(xrPartCount * 3);
    for (let i = 0; i < xrPartCount; i++) {
      xrPos[i * 3]     = (Math.random() - 0.5) * 20;
      xrPos[i * 3 + 1] = Math.random() * 8 - 1;
      xrPos[i * 3 + 2] = (Math.random() - 0.5) * 12;
    }
    xrGeo.setAttribute('position', new THREE.BufferAttribute(xrPos, 3));
    const xrPartMat = new THREE.PointsMaterial({ color: 0x00E5FF, size: 0.04, transparent: true, opacity: 0.5 });
    this._xrGroup.add(new THREE.Points(xrGeo, xrPartMat));

    this._scene.add(this._xrGroup);
  }

  _initAIEnvironment() {
    this._aiGroup = new THREE.Group();
    this._aiGroup.position.y = -12; // Below XR group, revealed by camera scroll

    // Neural network lines
    const neuronCount = 30;
    const neurons = Array.from({ length: neuronCount }, () => new THREE.Vector3(
      (Math.random() - 0.5) * 16,
      (Math.random() - 0.5) * 8,
      (Math.random() - 0.5) * 6
    ));

    const linePositions = [];
    for (let i = 0; i < neuronCount; i++) {
      for (let j = i + 1; j < neuronCount; j++) {
        if (neurons[i].distanceTo(neurons[j]) < 5.5 && Math.random() > 0.55) {
          linePositions.push(neurons[i].x, neurons[i].y, neurons[i].z);
          linePositions.push(neurons[j].x, neurons[j].y, neurons[j].z);
        }
      }
    }

    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(linePositions), 3));
    const lineMat = new THREE.LineBasicMaterial({ color: 0x8B5CF6, transparent: true, opacity: 0.35 });
    this._aiGroup.add(new THREE.LineSegments(lineGeo, lineMat));

    // Neuron node spheres
    neurons.forEach(pos => {
      const r = 0.06 + Math.random() * 0.12;
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(r, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xA78BFA, transparent: true, opacity: 0.8 })
      );
      sphere.position.copy(pos);
      this._aiGroup.add(sphere);
    });

    // AI ambient particles
    const aiPartCount = 800;
    const aiGeo = new THREE.BufferGeometry();
    const aiPos = new Float32Array(aiPartCount * 3);
    for (let i = 0; i < aiPartCount; i++) {
      aiPos[i * 3]     = (Math.random() - 0.5) * 22;
      aiPos[i * 3 + 1] = (Math.random() - 0.5) * 12;
      aiPos[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    aiGeo.setAttribute('position', new THREE.BufferAttribute(aiPos, 3));
    const aiPartMat = new THREE.PointsMaterial({ color: 0xA78BFA, size: 0.05, transparent: true, opacity: 0.4 });
    this._aiGroup.add(new THREE.Points(aiGeo, aiPartMat));

    this._scene.add(this._aiGroup);
  }

  _updateScroll(progress) {
    // Camera drifts down through the scene as user scrolls
    const targetY = -progress * 13;
    this._camera.position.y = 2 + targetY;
    this._camera.lookAt(0, this._camera.position.y - 2, 0);

    // Cross-fade lights: XR fades out, AI fades in
    const aiBlend = Math.max(0, Math.min(1, (progress - 0.4) / 0.5));
    this._xrLight.intensity = 3 * (1 - aiBlend);
    this._aiLight.intensity = 3 * aiBlend;

    // Fade XR group as AI enters
    this._xrGroup.traverse(obj => {
      if (obj.material) obj.material.opacity = Math.max(0, (1 - aiBlend * 1.6)) * (obj.material._baseOpacity ?? obj.material.opacity);
    });
  }

  _initResize() {
    window.addEventListener('resize', () => {
      const w = window.innerWidth, h = window.innerHeight;
      this._renderer.setSize(w, h);
      this._camera.aspect = w / h;
      this._camera.updateProjectionMatrix();
    });
  }

  render(elapsed) {
    if (!this.isVisible) return;

    // Animate XR rings
    if (this._xrRing)  this._xrRing.rotation.z  = elapsed * 0.25;
    if (this._xrRing2) this._xrRing2.rotation.z = -elapsed * 0.18;

    this._renderer.render(this._scene, this._camera);
  }
}

import * as THREE from 'three';
import { gsap } from 'gsap';
import { SKILLS } from '../data/content.js';

class OrbitRing {
  constructor({ category, items, color, radius, tiltAngle, position }) {
    this.group    = new THREE.Group();
    this.angle    = Math.random() * Math.PI * 2;
    this.radius   = radius;
    this.items    = items;
    this.category = category;
    this.color    = color;
    this.satellites = [];

    const colorHex = new THREE.Color(color);

    // Central sphere (category label)
    const centralGeo = new THREE.SphereGeometry(0.32, 24, 24);
    const centralMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      emissive: colorHex,
      emissiveIntensity: 0.7,
      roughness: 0.15,
      metalness: 0.9
    });
    this.central = new THREE.Mesh(centralGeo, centralMat);
    this.group.add(this.central);

    // Point light at center for glow
    const light = new THREE.PointLight(color, 1.2, 5);
    this.group.add(light);

    // Orbit path ring (visual guide)
    const orbitGeo = new THREE.TorusGeometry(radius, 0.008, 6, 80);
    const orbitMat = new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.18 });
    this.group.add(new THREE.Mesh(orbitGeo, orbitMat));

    // Satellite skill spheres
    items.forEach((item, i) => {
      const baseAngle = (i / items.length) * Math.PI * 2;
      const r = 0.1 + Math.random() * 0.06;
      const satGeo = new THREE.SphereGeometry(r, 10, 10);
      const satMat = new THREE.MeshStandardMaterial({
        color: colorHex,
        emissive: colorHex,
        emissiveIntensity: 0.5,
        roughness: 0.2,
        metalness: 0.8
      });
      const sat = new THREE.Mesh(satGeo, satMat);
      sat.position.x = Math.cos(baseAngle) * radius;
      sat.position.z = Math.sin(baseAngle) * radius;
      sat.userData.label    = item;
      sat.userData.baseAngle = baseAngle;
      sat.userData.category = category;
      sat.userData.color    = color;
      this.group.add(sat);
      this.satellites.push(sat);
    });

    // Tilt and position the whole ring
    this.group.rotation.x = tiltAngle;
    this.group.position.set(...position);
  }

  tick(delta) {
    this.angle += delta * 0.28;
    this.satellites.forEach((sat, i) => {
      const base = sat.userData.baseAngle;
      sat.position.x = Math.cos(base + this.angle) * this.radius;
      sat.position.z = Math.sin(base + this.angle) * this.radius;
    });
    // Gentle central sphere pulse
    const pulse = 1 + Math.sin(Date.now() * 0.001 * 1.5) * 0.06;
    this.central.scale.setScalar(pulse);
  }

  getAllSatellites() {
    return this.satellites;
  }
}

export class SkillsScene {
  constructor(scrollManager) {
    this.canvas    = document.getElementById('skills-canvas');
    this.isVisible = false;
    this._lastTime = 0;
    this._tooltip  = document.getElementById('skill-tooltip');
    this._hoveredMesh = null;

    this._initRenderer();
    this._initScene();
    this._initRings();
    this._initRaycaster();
    this._initResize();

    scrollManager.onSection('skills', (progress) => {
      // Gentle camera orbit based on scroll
      this._camera.position.x = Math.sin(progress * Math.PI * 0.5) * 2;
      this._camera.lookAt(0, 0, 0);
    });
  }

  _initRenderer() {
    this._renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this._renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this._renderer.setSize(window.innerWidth, window.innerHeight);
    this._renderer.shadowMap.enabled = false;
  }

  _initScene() {
    this._scene  = new THREE.Scene();
    this._camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
    this._camera.position.set(0, 1.5, 9);
    this._camera.lookAt(0, 0, 0);

    this._scene.add(new THREE.AmbientLight(0x111130, 3));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
    dirLight.position.set(5, 10, 5);
    this._scene.add(dirLight);
  }

  _initRings() {
    this._rings      = [];
    this._allSats    = [];

    SKILLS.forEach(skillDef => {
      const ring = new OrbitRing(skillDef);
      this._rings.push(ring);
      this._scene.add(ring.group);
      this._allSats.push(...ring.getAllSatellites());
    });
  }

  _initRaycaster() {
    this._raycaster = new THREE.Raycaster();
    this._mouse     = new THREE.Vector2(-9999, -9999);

    window.addEventListener('mousemove', (e) => {
      this._mouse.x =  (e.clientX / window.innerWidth)  * 2 - 1;
      this._mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      this._mouseClientX = e.clientX;
      this._mouseClientY = e.clientY;
    });

    window.addEventListener('mouseleave', () => {
      this._mouse.set(-9999, -9999);
      this._hideTooltip();
    });
  }

  _checkHover() {
    this._raycaster.setFromCamera(this._mouse, this._camera);
    const hits = this._raycaster.intersectObjects(this._allSats);

    if (hits.length > 0) {
      const mesh = hits[0].object;
      if (mesh !== this._hoveredMesh) {
        // Un-hover previous
        if (this._hoveredMesh) {
          gsap.to(this._hoveredMesh.scale, { x: 1, y: 1, z: 1, duration: 0.25, ease: 'power2.out' });
        }
        // Hover new
        this._hoveredMesh = mesh;
        gsap.to(mesh.scale, { x: 2.2, y: 2.2, z: 2.2, duration: 0.3, ease: 'back.out(1.7)' });
        this._showTooltip(mesh.userData.label, mesh.userData.color);
      }
      // Update tooltip position
      if (this._tooltip) {
        this._tooltip.style.left = this._mouseClientX + 'px';
        this._tooltip.style.top  = this._mouseClientY + 'px';
      }
      document.body.style.cursor = 'pointer';
    } else {
      if (this._hoveredMesh) {
        gsap.to(this._hoveredMesh.scale, { x: 1, y: 1, z: 1, duration: 0.25, ease: 'power2.out' });
        this._hoveredMesh = null;
        this._hideTooltip();
      }
      document.body.style.cursor = '';
    }
  }

  _showTooltip(label, color) {
    if (!this._tooltip) return;
    this._tooltip.textContent = label;
    this._tooltip.style.color = color;
    this._tooltip.style.borderColor = color + '66';
    this._tooltip.classList.remove('hidden');
    this._tooltip.style.left = (this._mouseClientX || 0) + 'px';
    this._tooltip.style.top  = (this._mouseClientY || 0) + 'px';
  }

  _hideTooltip() {
    if (!this._tooltip) return;
    this._tooltip.classList.add('hidden');
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

    const delta = elapsed - this._lastTime;
    this._lastTime = elapsed;

    // Tick all orbit rings
    this._rings.forEach(ring => ring.tick(delta));

    // Check hover (only when skills canvas is visible)
    this._checkHover();

    this._renderer.render(this._scene, this._camera);
  }
}

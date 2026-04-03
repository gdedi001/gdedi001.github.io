import './style.css';
import { ScrollManager } from './components/ScrollManager.js';
import { Navigation }    from './components/Navigation.js';
import { HeroScene }     from './scenes/HeroScene.js';
import { JourneyScene }  from './scenes/JourneyScene.js';
import { SkillsScene }   from './scenes/SkillsScene.js';

// ─── Boot sequence ──────────────────────────────────────────────────────────
const scrollManager = new ScrollManager();
const navigation    = new Navigation();
const heroScene     = new HeroScene(scrollManager);
const journeyScene  = new JourneyScene(scrollManager);
const skillsScene   = new SkillsScene(scrollManager);

// ─── Canvas visibility via IntersectionObserver ─────────────────────────────
// Pause rendering entirely when a canvas is off-screen
function observeCanvas(canvas, scene) {
  const observer = new IntersectionObserver(
    ([entry]) => { scene.isVisible = entry.isIntersecting; },
    { threshold: 0.01 }
  );
  observer.observe(canvas);
}

observeCanvas(document.getElementById('hero-canvas'),    heroScene);
observeCanvas(document.getElementById('journey-canvas'), journeyScene);
observeCanvas(document.getElementById('skills-canvas'),  skillsScene);

// ─── ScrollTrigger canvas fades ─────────────────────────────────────────────
scrollManager.setupCanvasVisibility({
  'hero-canvas':    ['hero', 'about'],
  'journey-canvas': ['journey'],
  'skills-canvas':  ['skills', 'contact']
});

// ─── Unified render loop — ONE rAF drives ALL scenes ────────────────────────
const startTime = performance.now();

function tick() {
  requestAnimationFrame(tick);
  const elapsed = (performance.now() - startTime) / 1000;
  heroScene.render(elapsed);
  journeyScene.render(elapsed);
  skillsScene.render(elapsed);
}

tick();

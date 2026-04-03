import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export class ScrollManager {
  constructor() {
    this._handlers = {};
    this._resizeTimer = null;
    this._setupTriggers();
    this._setupResize();
  }

  // Scenes call this to receive scroll progress updates for a section
  onSection(sectionId, callback) {
    if (!this._handlers[sectionId]) this._handlers[sectionId] = [];
    this._handlers[sectionId].push(callback);
  }

  _setupTriggers() {
    document.querySelectorAll('section[data-scene]').forEach(section => {
      const id = section.id;
      ScrollTrigger.create({
        trigger: section,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
        onUpdate: (st) => {
          const handlers = this._handlers[id];
          if (handlers) {
            handlers.forEach(fn => fn(st.progress, st.direction));
          }
        }
      });
    });
  }

  // Control canvas opacity transitions as sections enter/leave
  setupCanvasVisibility(canvasMap) {
    // canvasMap: { 'canvas-id': ['section-id', ...] }
    Object.entries(canvasMap).forEach(([canvasId, sections]) => {
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;

      sections.forEach(sectionId => {
        ScrollTrigger.create({
          trigger: `#${sectionId}`,
          start: 'top 85%',
          end: 'bottom 15%',
          onEnter:     () => { canvas.style.opacity = '1'; },
          onLeave:     () => { canvas.style.opacity = '0'; },
          onEnterBack: () => { canvas.style.opacity = '1'; },
          onLeaveBack: () => { canvas.style.opacity = '0'; }
        });
      });
    });
  }

  _setupResize() {
    window.addEventListener('resize', () => {
      clearTimeout(this._resizeTimer);
      this._resizeTimer = setTimeout(() => {
        ScrollTrigger.refresh();
      }, 200);
    });
  }

  refresh() {
    ScrollTrigger.refresh();
  }
}

import { gsap } from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollToPlugin, ScrollTrigger);

export class Navigation {
  constructor() {
    this._dots = document.querySelectorAll('.nav-dot');
    this._sections = ['hero', 'about', 'journey', 'skills', 'contact'];
    this._setupClicks();
    this._setupActiveDots();
  }

  _setupClicks() {
    this._dots.forEach(dot => {
      dot.addEventListener('click', () => {
        const target = dot.dataset.target;
        gsap.to(window, {
          scrollTo: { y: `#${target}`, offsetY: 0 },
          duration: 1.4,
          ease: 'power3.inOut'
        });
      });
    });
  }

  _setupActiveDots() {
    this._sections.forEach((id, i) => {
      ScrollTrigger.create({
        trigger: `#${id}`,
        start: 'top center',
        end: 'bottom center',
        onEnter:     () => this._setActive(i),
        onEnterBack: () => this._setActive(i)
      });
    });
  }

  _setActive(index) {
    this._dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
    });
  }
}

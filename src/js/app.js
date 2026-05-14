import '../scss/app.scss';
import { AdvancedSlider } from './slider';

class Marquee {
  constructor(root) {
    this.root = root;
    this.speed = parseFloat(root.dataset.speed) || 50;

    this.track = root.querySelector('.marquee__track');

    if (!this.track) return;

    this.position = 0;

    this.init();

    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  init() {
    const contentWidth = this.track.scrollWidth;
    const containerWidth = this.root.offsetWidth;

    const copies = Math.ceil(containerWidth / contentWidth) + 2;

    const wrapper = document.createElement('div');
    wrapper.className = 'marquee__wrapper';

    for (let i = 0; i < copies; i++) {
      wrapper.appendChild(this.track.cloneNode(true));
    }

    this.root.innerHTML = '';
    this.root.appendChild(wrapper);

    this.wrapper = wrapper;
    this.trackWidth = contentWidth;
  }

  animate() {
    this.position -= this.speed / 60;

    if (Math.abs(this.position) >= this.trackWidth) {
      this.position = 0;
    }

    this.wrapper.style.transform = `translate3d(${this.position}px,0,0)`;

    requestAnimationFrame(this.animate);
  }
}

window.addEventListener('load', () => {
  document.querySelectorAll('.marquee').forEach((el) => new Marquee(el));

  const slider = document.querySelector('[data-slider]');
  const slider1 = document.querySelector('[data-slider-steps]');

  new AdvancedSlider(slider, {
    loop: true,
    autoplay: true,
    autoplayDelay: 4000,
    draggable: true,
    swipe: true,
    vertical: false,
    centerMode: false,
    counterCurrent: '.slider-current',
    counterTotal: '.slider-total',
    paginationType: 'dots',
    slidesToScroll: 1,
    prevBtn: '.slider-prev',
    nextBtn: '.slider-next',
    breakpoints: {
      0: 1,
      768: 2,
      1200: 3,
    },
  });

  new AdvancedSlider(slider1, {
    swipe: true,
    vertical: false,
    centerMode: false,
    slideSelector: '.group-slide',
    loop: false,
    autoplay: false,
    // enabledFrom: 0,
    paginationType: 'dots',
    draggable: true,
    disabledFrom: 992,
    slidesToScroll: 1,
    prevBtn: '.steps-slider-prev',
    nextBtn: '.steps-slider-next',
    paginationEl: '.steps-slider-pagination',
    breakpoints: {
      0: 1,
    },
  });
});

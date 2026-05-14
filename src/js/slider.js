export class AdvancedSlider {
  constructor(element, options = {}) {
    this.slider = element;
    this.track = element.querySelector('.slider-track');
    if (!this.track) {
      console.error('Slider track not found');
      return;
    }

    this.options = {
      loop: false,
      autoplay: false,
      autoplayDelay: 3000,
      draggable: true,
      swipe: true,
      vertical: false,
      disabledFrom: null,
      centerMode: false,
      paginationType: 'dots',
      gap: 0,
      enabledFrom: 0,
      slidesToScroll: 1,
      breakpoints: {
        0: 1,
        768: 2,
        1024: 3,
      },
      ...options,
    };

    this.originalSlides = [...element.querySelectorAll(this.options?.slideSelector || '.slide')];
    this.slides = [...this.originalSlides];

    this.prevBtn =
      typeof options.prevBtn === 'string'
        ? document.querySelector(options.prevBtn)
        : options.prevBtn || element.querySelector('.prev');

    this.nextBtn =
      typeof options.nextBtn === 'string'
        ? document.querySelector(options.nextBtn)
        : options.nextBtn || element.querySelector('.next');

    this.counterCurrent =
      typeof options.counterCurrent === 'string'
        ? document.querySelector(options.counterCurrent)
        : options.counterCurrent || element.querySelector('.current');

    this.counterTotal =
      typeof options.counterTotal === 'string'
        ? document.querySelector(options.counterTotal)
        : options.counterTotal || element.querySelector('.total');
    this.pagination =
      typeof options.paginationEl === 'string'
        ? document.querySelector(options.paginationEl)
        : options.paginationEl || element.querySelector('.slider-pagination');

    if (!this.originalSlides.length) {
      console.error('No slides found');
      return;
    }

    this.currentIndex = 0;
    this.isDragging = false;
    this.isAnimating = false;
    this.startPos = 0;
    this.eventsBound = false;
    this.loopCreated = false;
    this.initialized = false;
    this.auto = null;

    this.init();
  }

  init() {
    this.bindEvents();

    this.handleMode();

    window.addEventListener('resize', () => {
      const wasInitialized = this.initialized;

      this.handleMode();

      if (!this.initialized) return;

      if (wasInitialized) {
        this.updateSlidesPerView();
        this.createPagination();
        this.update();
      }
    });
  }

  checkEnabled() {
    const width = window.innerWidth;

    if (this.options.disabledFrom !== null) {
      return width < this.options.disabledFrom;
    }

    return width >= this.options.enabledFrom;
  }

  handleMode() {
    const enabled = this.checkEnabled();

    if (enabled && !this.initialized) {
      this.enable();
    } else if (!enabled && this.initialized) {
      this.disable();
    }
  }

  updateNavigation() {
    if (this.options.loop) {
      this.prevBtn?.removeAttribute('disabled');
      this.nextBtn?.removeAttribute('disabled');

      this.prevBtn?.classList.remove('disabled');
      this.nextBtn?.classList.remove('disabled');

      return;
    }

    const isBeginning = this.currentIndex <= 0;
    const isEnd = this.currentIndex >= this.maxIndex;

    this.prevBtn?.toggleAttribute('disabled', isBeginning);
    this.nextBtn?.toggleAttribute('disabled', isEnd);

    this.prevBtn?.classList.toggle('disabled', isBeginning);
    this.nextBtn?.classList.toggle('disabled', isEnd);
  }

  createLoop() {
    if (!this.options.loop || this.loopCreated || !this.originalSlides.length) return;

    this.loopCreated = true;

    const clonesBefore = this.originalSlides.slice(-this.slidesPerView).map((slide) => slide.cloneNode(true));

    const clonesAfter = this.originalSlides.slice(0, this.slidesPerView).map((slide) => slide.cloneNode(true));

    clonesBefore.forEach((clone) => {
      this.track.prepend(clone);
    });

    clonesAfter.forEach((clone) => {
      this.track.append(clone);
    });

    this.slides = [...this.track.children];

    this.currentIndex = this.slidesPerView;
  }

  enable() {
    this.initialized = true;

    this.slider.classList.add('is-slider');

    if (this.options.loop && !this.loopCreated) {
      this.createLoop();
    }

    this.updateSlidesPerView();
    this.createPagination();
    this.update();

    if (this.options.autoplay) {
      this.startAutoplay();
    }
  }

  disable() {
    this.initialized = false;

    this.slider.classList.remove('is-slider');

    this.stopAutoplay();

    if (this.track) {
      this.track.style.transform = '';
      this.track.style.transition = '';
    }

    this.slides.forEach((slide) => {
      slide.style.width = '';
      slide.style.minWidth = '';
      slide.style.height = '';
      slide.style.transform = '';
      slide.style.flex = '';
    });

    if (this.pagination) {
      this.pagination.innerHTML = '';
    }
  }

  createLoop() {
    if (!this.options.loop || this.loopCreated || !this.originalSlides.length) return;
    this.loopCreated = true;
    const first = this.originalSlides[0].cloneNode(true);
    const last = this.originalSlides[this.originalSlides.length - 1].cloneNode(true);
    if (this.track) {
      this.track.append(first);
      this.track.prepend(last);
    }
    this.slides = [...this.track.children];
    this.currentIndex = 1;
  }

  updateSlidesPerView() {
    if (!this.originalSlides.length) return;

    let slidesPerView = 1;
    const breakpoints = Object.entries(this.options.breakpoints).sort((a, b) => +b[0] - +a[0]);

    for (const [bp, value] of breakpoints) {
      if (window.innerWidth >= +bp) {
        slidesPerView = value;
        break;
      }
    }

    this.slidesPerView = slidesPerView;
    this.maxIndex = this.slides.length - this.slidesPerView;

    const size = this.options.vertical ? this.slider.clientHeight : this.slider.clientWidth;

    this.slideSize = size / this.slidesPerView;

    this.slides.forEach((slide) => {
      if (this.options.vertical) {
        slide.style.height = `${this.slideSize}px`;
      } else {
        // slide.style.width = `${this.slideSize}px`;
        slide.style.width = `${this.slideSize}px`;
        slide.style.minWidth = `${this.slideSize}px`;
      }
    });
  }

  createPagination() {
    if (!this.pagination || this.options.paginationType !== 'dots') {
      if (this.pagination) this.pagination.style.display = 'none';
      return;
    }

    this.pagination.innerHTML = '';

    const totalDots = this.options.loop
      ? this.originalSlides.length
      : this.originalSlides.length - this.slidesPerView + 1;

    for (let i = 0; i < totalDots; i++) {
      const dot = document.createElement('div');

      dot.className = 'slider-dot';

      dot.addEventListener('click', () => this.goTo(i));

      this.pagination.append(dot);
    }
  }
  updatePagination() {
    if (!this.pagination && !this.counterCurrent && !this.counterTotal) return;

    const realIndex = this.getRealIndex();
    const dots = this.pagination ? [...this.pagination.children] : [];

    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === realIndex);
    });

    const totalPages = this.options.loop
      ? this.originalSlides.length
      : this.originalSlides.length - this.slidesPerView + 1;

    if (this.counterCurrent) {
      this.counterCurrent.textContent = realIndex + 1;
    }

    if (this.counterTotal) {
      this.counterTotal.textContent = totalPages;
    }
  }

  getRealIndex() {
    if (!this.options.loop) return this.currentIndex;

    let index = this.currentIndex - this.slidesPerView;

    if (index < 0) {
      index = this.originalSlides.length + index;
    }

    if (index >= this.originalSlides.length) {
      index = index - this.originalSlides.length;
    }

    return index;
  }

  clampIndex() {
    if (!this.slides.length) return;

    const maxIndex = this.slides.length - this.slidesPerView;
    if (this.currentIndex > maxIndex) {
      this.currentIndex = maxIndex;
    }
    if (this.currentIndex < 0) {
      this.currentIndex = 0;
    }
  }

  update() {
    this.clampIndex();

    if (!this.track) return;

    const move = -this.currentIndex * this.slideSize;

    this.track.style.transform = this.options.vertical ? `translateY(${move}px)` : `translateX(${move}px)`;

    this.updatePagination();
    this.updateNavigation(); // <- добавить

    if (this.options.centerMode) {
      this.updateCenterMode();
    }
  }

  updateCenterMode() {
    this.slides.forEach((s) => s.classList.remove('active'));
    if (this.slides[this.currentIndex]) {
      this.slides[this.currentIndex].classList.add('active');
    }
  }

  next() {
    if (this.isAnimating || !this.initialized) return;

    this.isAnimating = true;

    this.track.style.transition = 'transform .35s ease';

    this.currentIndex += this.options.slidesToScroll;

    this.update();

    if (this.options.loop) {
      const maxIndex = this.slides.length - this.slidesPerView;

      if (this.currentIndex >= maxIndex) {
        setTimeout(() => {
          this.track.style.transition = 'none';

          this.currentIndex = 1;

          this.update();

          this.isAnimating = false;
        }, 350);

        return;
      }
    } else {
      const maxIndex = this.slides.length - this.slidesPerView;

      this.currentIndex = Math.min(this.currentIndex, maxIndex);
    }

    setTimeout(() => {
      this.isAnimating = false;
    }, 350);
  }

  prev() {
    if (this.isAnimating || !this.initialized) return;

    this.isAnimating = true;

    this.track.style.transition = 'transform .35s ease';

    this.currentIndex -= this.options.slidesToScroll;

    this.update();

    if (this.options.loop) {
      if (this.currentIndex <= 0) {
        setTimeout(() => {
          this.track.style.transition = 'none';

          this.currentIndex = this.slides.length - this.slidesPerView - 1;

          this.update();

          this.isAnimating = false;
        }, 350);

        return;
      }
    } else {
      this.currentIndex = Math.max(this.currentIndex, 0);
    }

    setTimeout(() => {
      this.isAnimating = false;
    }, 350);
  }

  goTo(index) {
    if (!this.initialized) return;
    this.currentIndex = this.options.loop ? index + 1 : index;
    this.update();
  }

  startAutoplay() {
    this.stopAutoplay();
    this.auto = setInterval(() => {
      this.next();
    }, this.options.autoplayDelay);
  }

  stopAutoplay() {
    if (this.auto) {
      clearInterval(this.auto);
      this.auto = null;
    }
  }

  bindEvents() {
    if (this.eventsBound) return;
    this.eventsBound = true;

    this.nextBtn?.addEventListener('click', () => this.next());
    this.prevBtn?.addEventListener('click', () => this.prev());

    if (this.slider) {
      this.slider.addEventListener('mouseenter', () => this.stopAutoplay());
      this.slider.addEventListener('mouseleave', () => {
        if (this.options.autoplay && this.initialized) {
          this.startAutoplay();
        }
      });
    }

    if ((this.options.swipe || this.options.draggable) && this.slider) {
      this.initDrag();
    }
  }

  initDrag() {
    const getX = (e) => (this.options.vertical ? e.clientY : e.clientX);

    const start = (e) => {
      if (!this.initialized) return;
      this.isDragging = true;
      this.startPos = getX(e);
      if (this.track) this.track.style.transition = 'none';
    };

    const move = (e) => {
      if (!this.isDragging || !this.track) return;
      const diff = getX(e) - this.startPos;
      const base = -this.currentIndex * this.slideSize;
      const axis = this.options.vertical ? 'Y' : 'X';
      this.track.style.transform = `translate${axis}(${base + diff}px)`;
    };

    const end = (e) => {
      if (!this.isDragging || !this.track) return;
      this.isDragging = false;
      const diff = getX(e) - this.startPos;
      this.track.style.transition = 'transform .35s ease';

      if (Math.abs(diff) > 80) {
        diff < 0 ? this.next() : this.prev();
      } else {
        this.update();
      }
    };

    if (this.slider) {
      this.slider.addEventListener('mousedown', start);
      window.addEventListener('mousemove', move);
      window.addEventListener('mouseup', end);

      this.slider.addEventListener('touchstart', (e) => start(e.touches[0]));
      window.addEventListener('touchmove', (e) => move(e.touches[0]));
      window.addEventListener('touchend', (e) => end(e.changedTouches[0]));
    }
  }
}

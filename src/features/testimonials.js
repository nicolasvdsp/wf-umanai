function initTestimonials(container) {
  container = container || document;

  const components = container.querySelectorAll('[data-testimonials]');
  if (!components.length) return;

  components.forEach(setupTestimonial);
}

function setupTestimonial(component) {
  const gsap = window.gsap;
  if (!gsap) return;

  const source = component.querySelector('[data-testimonials-source]');
  if (!source) return;

  const cmsItems = source.querySelectorAll('.w-dyn-item');
  if (!cmsItems.length) return;

  const data = extractCMSData(cmsItems);
  if (!data.length) return;

  const tabsContent = component.querySelector('[data-testimonials-content]');
  const tabsNav = component.querySelector('[data-testimonials-nav]');
  if (!tabsContent || !tabsNav) return;

  const templatePane = tabsContent.querySelector('.testimonial35_tab-pane');
  const templateLink = tabsNav.querySelector('.testimonial35_tab-link');
  if (!templatePane || !templateLink) return;

  const paneClone = templatePane.cloneNode(true);
  const linkClone = templateLink.cloneNode(true);

  tabsContent.innerHTML = '';
  tabsNav.innerHTML = '';

  const links = [];
  const panes = [];

  data.forEach((item) => {
    const link = linkClone.cloneNode(true);
    populateElement(link, item);
    tabsNav.appendChild(link);
    links.push(link);

    const pane = paneClone.cloneNode(true);
    populateElement(pane, item);
    tabsContent.appendChild(pane);
    panes.push(pane);
  });

  // --- State & animation ---
  ``
  let activeIndex = 0;
  let isAnimating = false;
  let autoplayTimer = null;
  const interval = parseInt(component.getAttribute('data-testimonials-interval'), 10) || 8000;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const transition = prefersReducedMotion ? 'none' : (component.getAttribute('data-transition') || 'cross-fade');
  const duration = 0.4;
  const ease = 'power2.inOut';

  gsap.set(panes, { autoAlpha: 0, position: 'absolute', top: 0, left: 0, width: '100%' });
  gsap.set(panes[0], { autoAlpha: 1, position: 'relative' });
  links[0].classList.add('is-active');

  const transitions = {
    'none'(outgoing, incoming) {
      gsap.set(outgoing, { autoAlpha: 0, position: 'absolute' });
      gsap.set(incoming, { autoAlpha: 1, position: 'relative' });
      isAnimating = false;
    },

    'cross-fade'(outgoing, incoming) {
      gsap.set(outgoing, { position: 'absolute' });
      gsap.set(incoming, { position: 'relative' });

      gsap.to(outgoing, { autoAlpha: 0, duration, ease });
      gsap.to(incoming, {
        autoAlpha: 1, duration, ease, onComplete: () => { isAnimating = false; },
      });
    },

    'slide'(outgoing, incoming, direction) {
      const xOut = direction > 0 ? -100 : 100;
      const xIn = direction > 0 ? 100 : -100;

      gsap.set(outgoing, { position: 'absolute' });
      gsap.set(incoming, { position: 'relative', xPercent: xIn });

      gsap.to(outgoing, { autoAlpha: 0, xPercent: xOut, duration, ease });
      gsap.to(incoming, {
        autoAlpha: 1, xPercent: 0, duration, ease, onComplete: () => { isAnimating = false; },
      });
    },

    'stagger'(outgoing, incoming) {
      const tl = gsap.timeline();

      const outHero = outgoing.querySelector('.testimonial35_client-image-wrapper');
      const inHero = incoming.querySelector('.testimonial35_client-image-wrapper');

      const outLogos = getImageTargets(outgoing, '.testimonial35_client-image-wrapper');
      const inLogos = getImageTargets(incoming, '.testimonial35_client-image-wrapper');

      const outTexts = outgoing.querySelectorAll('[data-text]');
      const inTexts = incoming.querySelectorAll('[data-text]');

      gsap.set(incoming, { position: 'relative', autoAlpha: 1 });
      gsap.set(outgoing, { position: 'absolute', zIndex: 1 });

      // Hero image/video: simple crossfade
      if (inHero) gsap.set(inHero, { autoAlpha: 0 });
      if (outHero) tl.to(outHero, { autoAlpha: 0, duration: 0.5, ease }, 0);
      if (inHero) tl.to(inHero, { autoAlpha: 1, duration: 0.5, ease }, 0.1);

      // Logos: always push up
      inLogos.forEach(({ el }) => gsap.set(el, { yPercent: 100 }));
      outLogos.forEach(({ el }) => {
        tl.to(el, { yPercent: -100, duration: 0.6, ease: 'power3.inOut' }, 0);
      });
      inLogos.forEach(({ el }) => {
        tl.to(el, { yPercent: 0, duration: 0.6, ease: 'power3.inOut' }, 0);
      });

      // Text: always stagger up
      if (inTexts.length) gsap.set(inTexts, { y: 30, autoAlpha: 0 });
      if (outTexts.length) tl.to(outTexts, { y: -20, autoAlpha: 0, duration: 0.3, stagger: 0.04, ease: 'power2.in' }, 0);
      if (inTexts.length) tl.to(inTexts, { y: 0, autoAlpha: 1, duration: 0.35, stagger: 0.06, ease: 'power2.out' }, 0.25);

      tl.call(() => {
        gsap.set(outgoing, { autoAlpha: 0, zIndex: '' });
        gsap.set(incoming, { zIndex: '' });
        if (outHero) gsap.set(outHero, { autoAlpha: 1 });
        outLogos.forEach(({ el }) => gsap.set(el, { yPercent: 0 }));
        if (outTexts.length) gsap.set(outTexts, { y: 0, autoAlpha: 1 });
        isAnimating = false;
      });
    },
  };

  function switchToTab(index) {
    if (index === activeIndex || isAnimating) return;
    isAnimating = true;

    const outgoing = panes[activeIndex];
    const incoming = panes[index];
    const direction = index > activeIndex ? 1 : -1;

    const animate = transitions[transition] || transitions['cross-fade'];
    animate(outgoing, incoming, direction);

    links[activeIndex].classList.remove('is-active');
    links[index].classList.add('is-active');

    activeIndex = index;
  }

  links.forEach((link, i) => {
    link.addEventListener('click', () => {
      switchToTab(i);
      resetAutoplay();
    });
  });

  // --- Auto-rotation ---

  function startAutoplay() {
    stopAutoplay();
    if (panes.length <= 1) return;
    autoplayTimer = setInterval(() => {
      switchToTab((activeIndex + 1) % panes.length);
    }, interval);
  }

  function stopAutoplay() {
    if (autoplayTimer) {
      clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
  }

  function resetAutoplay() {
    stopAutoplay();
    startAutoplay();
  }

  component.addEventListener('mouseenter', stopAutoplay);
  component.addEventListener('mouseleave', startAutoplay);

  startAutoplay();
}

// --- Image target helper (for stagger push animation) ---

function getImageTargets(pane, excludeParent) {
  return [...pane.querySelectorAll('[data-image]')].map((node) => {
    if (excludeParent && node.closest(excludeParent)) return null;
    if (node.tagName === 'IMG') {
      node.parentElement.style.overflow = 'hidden';
      return { mask: node.parentElement, el: node };
    }
    const img = node.querySelector('img');
    if (!img) return null;
    node.style.overflow = 'hidden';
    return { mask: node, el: img };
  }).filter(Boolean);
}

// --- Generic data helpers ---

function extractCMSData(items) {
  const data = [];

  items.forEach((item) => {
    const entry = {};

    item.querySelectorAll('[data-text]').forEach((el) => {
      entry[el.getAttribute('data-text')] = el.textContent.trim();
    });

    item.querySelectorAll('[data-image]').forEach((el) => {
      const img = el.tagName === 'IMG' ? el : el.querySelector('img');
      entry[el.getAttribute('data-image')] = img?.src || '';
    });

    data.push(entry);
  });

  return data;
}

function populateElement(container, data) {
  container.querySelectorAll('[data-text]').forEach((el) => {
    const value = data[el.getAttribute('data-text')];
    if (value != null) el.textContent = value;
  });

  container.querySelectorAll('[data-image]').forEach((el) => {
    const value = data[el.getAttribute('data-image')];
    if (!value) return;
    if (el.tagName === 'IMG') {
      el.src = value;
    } else {
      const img = el.querySelector('img');
      if (img) img.src = value;
    }
  });
}

function testimonials() {
  document.addEventListener('barba:afterEnter', (e) => {
    initTestimonials(e.detail.container);
  });
}

export default testimonials;

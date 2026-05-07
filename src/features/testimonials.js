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

  // Capture insertion anchors so cloned items go in the original position,
  // preserving any siblings in the nav (e.g. data-testimonials-prev/next chevrons).
  const paneInsertBefore = templatePane.nextSibling;
  const linkInsertBefore = templateLink.nextSibling;

  const paneClone = templatePane.cloneNode(true);
  const linkClone = templateLink.cloneNode(true);

  tabsContent.querySelectorAll('.testimonial35_tab-pane').forEach((el) => el.remove());
  tabsNav.querySelectorAll('.testimonial35_tab-link').forEach((el) => el.remove());

  const links = [];
  const panes = [];

  data.forEach((item) => {
    const link = linkClone.cloneNode(true);
    populateElement(link, item);
    tabsNav.insertBefore(link, linkInsertBefore);
    links.push(link);

    const pane = paneClone.cloneNode(true);
    populateElement(pane, item);
    tabsContent.insertBefore(pane, paneInsertBefore);
    panes.push(pane);
  });

  // --- State & animation ---

  let activeIndex = 0;
  let isAnimating = false;
  let imagesReady = false;
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

  // The pane element often stretches to match its parent (flex/grid) so its
  // offsetHeight isn't useful. Measure the inner card if present.
  function getContentHeight(pane) {
    const inner = pane.querySelector('.testimonial35_card') || pane.firstElementChild;
    return (inner || pane).offsetHeight;
  }

  function animateHeight(outgoing, incoming) {
    if (transition === 'none' || !imagesReady) return;
    const fromHeight = getContentHeight(outgoing);
    const toHeight = getContentHeight(incoming);
    if (Math.abs(fromHeight - toHeight) < 2) return;

    // When shrinking, delay the height tween so the outgoing content has time
    // to fade/move out before the container collapses (otherwise it clips).
    const isShrinking = toHeight < fromHeight;
    const delay = isShrinking ? duration * 0.1 : 0;

    gsap.killTweensOf(tabsContent);
    gsap.fromTo(tabsContent,
      { height: fromHeight },
      {
        height: toHeight,
        duration,
        ease,
        delay,
        onComplete: () => {
          gsap.set(tabsContent, { clearProps: 'height' });
        },
      });
  }

  // Wait for all populated images to load before allowing height animation.
  // Prevents flicker on the first transition when image dimensions are still unknown.
  const allImages = [...tabsContent.querySelectorAll('img'), ...tabsNav.querySelectorAll('img')];
  Promise.all(allImages.map((img) => {
    if (img.complete && img.naturalHeight !== 0) return Promise.resolve();
    return new Promise((resolve) => {
      img.addEventListener('load', resolve, { once: true });
      img.addEventListener('error', resolve, { once: true });
    });
  })).then(() => { imagesReady = true; });

  function switchToTab(index, explicitDirection) {
    if (index === activeIndex || isAnimating) return;
    isAnimating = true;

    const outgoing = panes[activeIndex];
    const incoming = panes[index];
    const direction = explicitDirection ?? (index > activeIndex ? 1 : -1);

    animateHeight(outgoing, incoming);

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

  // --- Prev / Next controls (chevrons + swipe) ---

  function goToPrev() {
    switchToTab((activeIndex - 1 + panes.length) % panes.length, -1);
    resetAutoplay();
  }

  function goToNext() {
    switchToTab((activeIndex + 1) % panes.length, 1);
    resetAutoplay();
  }

  // Delegate prev/next clicks on the component in CAPTURE phase so we
  // intercept before the inner <a class="link-block"> triggers navigation
  // and before Barba's document-level listener sees the event.
  component.addEventListener('click', (e) => {
    const target = e.target.closest('[data-testimonials-prev], [data-testimonials-next]');
    if (!target || !component.contains(target)) return;
    e.preventDefault();
    e.stopPropagation();
    if (target.matches('[data-testimonials-prev]')) goToPrev();
    else goToNext();
  }, true);

  // Swipe: horizontal drag past threshold on the content or nav area
  let touchStartX = 0;
  let touchStartY = 0;
  const SWIPE_THRESHOLD = 50;

  function onTouchStart(e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }

  function onTouchEnd(e) {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0) goToNext();
    else goToPrev();
  }

  [tabsContent, tabsNav].forEach((el) => {
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
  });

  // --- Auto-rotation ---

  function startAutoplay() {
    stopAutoplay();
    if (panes.length <= 1) return;
    autoplayTimer = setInterval(() => {
      switchToTab((activeIndex + 1) % panes.length, 1);
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
    const img = el.tagName === 'IMG' ? el : el.querySelector('img');
    if (!img) return;
    // Force eager loading so all panes' images are ready before the first
    // transition — prevents height-measurement glitches when lazy-loaded
    // images inside hidden panes haven't loaded yet.
    img.loading = 'eager';
    img.src = value;
  });
}

function testimonials() {
  document.addEventListener('barba:afterEnter', (e) => {
    initTestimonials(e.detail.container);
  });
}

export default testimonials;

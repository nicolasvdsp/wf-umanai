/*
  LUCIDE ICONS — CMS-friendly, gradient-ready

  Replaces [data-lucide="icon-name"] placeholders with inline Lucide SVGs.
  Wrapper mode: if the element has a child <svg>, only that child is swapped;
  the wrapper (classes, CMS bindings, data-gradient-fill) stays intact.
  When data-gradient-fill is present, a local <defs> gradient is embedded
  directly inside the SVG so the stroke renders with the gradient.
*/

const CDN = 'https://unpkg.com/lucide@latest/dist/umd/lucide.min.js';
const NS = 'http://www.w3.org/2000/svg';
const VIEWBOX = 24;
const SHAPES = 'path, circle, rect, line, polyline, polygon, ellipse';
const STRIP = new Set(['viewbox', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'xmlns']);

let loadPromise = null;
let uid = 0;

function loadLucide() {
  if (window.lucide?.createIcons) return Promise.resolve(window.lucide);
  if (loadPromise) return loadPromise;
  loadPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = CDN;
    s.async = true;
    s.onload = () => (window.lucide?.createIcons ? resolve(window.lucide) : reject());
    s.onerror = reject;
    document.head.appendChild(s);
  });
  return loadPromise;
}

function prepareTargets(wrappers) {
  let count = 0;
  wrappers.forEach((w) => {
    const name = w.getAttribute('data-lucide');
    if (!name) return;
    const target = w.querySelector('svg') || w;
    if (target !== w) {
      [...target.attributes].forEach((a) => STRIP.has(a.name.toLowerCase()) && target.removeAttribute(a.name));
      target.replaceChildren();
    }
    target.setAttribute('data-lucide-render', name);
    w.setAttribute('data-lucide-rendered', '');
    count++;
  });
  return count;
}

function applyGradients(wrappers) {
  wrappers.forEach((w) => {
    const gradientName = w.getAttribute('data-gradient-fill');
    if (!gradientName) return;

    const svg = w.querySelector('svg');
    if (!svg) return;

    const src = document.getElementById(`tab-icon-gradient-${gradientName}`);
    if (!src) {
      console.warn(`[lucide-icons] #tab-icon-gradient-${gradientName} not found in DOM`);
      return;
    }

    const localId = `_li${uid++}`;
    const grad = src.cloneNode(true);
    grad.id = localId;
    grad.setAttribute('gradientUnits', 'userSpaceOnUse');
    ['x1', 'y1', 'x2', 'y2'].forEach((a) => {
      const v = parseFloat(grad.getAttribute(a));
      if (!Number.isNaN(v)) grad.setAttribute(a, v * VIEWBOX);
    });

    const defs = document.createElementNS(NS, 'defs');
    defs.appendChild(grad);
    svg.prepend(defs);

    svg.querySelectorAll(SHAPES).forEach((el) => {
      el.style.stroke = `url(#${localId})`;
      el.style.fill = 'none';
    });
  });
}

function renderIconsIn(container) {
  const wrappers = (container || document).querySelectorAll('[data-lucide]:not([data-lucide-rendered])');
  if (!wrappers.length) return;

  loadLucide()
    .then((lucide) => {
      if (!prepareTargets(wrappers)) return;
      lucide.createIcons({ nameAttr: 'data-lucide-render' });
      applyGradients(wrappers);
    })
    .catch((err) => console.warn('[lucide-icons]', err));
}

function lucideIcons() {
  document.addEventListener('barba:pageVisible', (e) => {
    renderIconsIn(e.detail.container);
  });
}

export default lucideIcons;

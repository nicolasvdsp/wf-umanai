// ============================================
// Feature Rows (data-feature-wrap)
// ============================================
function initFeatureWrap(container) {
  container = container || document;
  const richtexts = container.querySelectorAll('[data-feature-wrap]');
  if (!richtexts.length) return;

  richtexts.forEach(processFeatureWrap);
}

function processFeatureWrap(richtext) {
  if (richtext.dataset.processed) return;
  richtext.dataset.processed = 'true';

  const groups = groupByHeading(richtext);
  richtext.innerHTML = '';

  groups.forEach((group) => {
    const item = document.createElement('div');
    item.className = 'feature-rtb_item';

    const content = document.createElement('div');
    content.className = 'feature-rtb_content';

    group.forEach((child) => {
      if (child.tagName === 'FIGURE') {
        item.appendChild(child);
      } else {
        content.appendChild(child);
      }
    });

    item.insertBefore(content, item.firstChild);
    richtext.appendChild(item);
  });
}

// ============================================
// Feature Cards (data-feature-cards)
// ============================================
function initFeatureCards(container) {
  container = container || document;
  const cardRichtexts = container.querySelectorAll('[data-feature-cards]');
  if (!cardRichtexts.length) return;

  const iconEl = document.querySelector('[data-card-icon]');
  const iconSrc = iconEl?.src || iconEl?.querySelector('img')?.src || '';

  cardRichtexts.forEach((rt) => processFeatureCards(rt, iconSrc));
}

function processFeatureCards(richtext, iconSrc) {
  if (richtext.dataset.processed) return;
  richtext.dataset.processed = 'true';

  const groups = groupByHeading(richtext);
  richtext.classList.add('cards-list', '_2-col');
  richtext.innerHTML = '';

  groups.forEach((group) => {
    const card = document.createElement('div');
    card.className = 'cards-list_item type-2';

    // Row 1: Icon
    if (iconSrc) {
      const iconWrap = document.createElement('div');
      iconWrap.className = 'icon-badge-integration';
      const img = document.createElement('img');
      img.className = 'image';
      img.src = iconSrc;
      img.alt = '';
      img.loading = 'lazy';
      iconWrap.appendChild(img);
      card.appendChild(iconWrap);
    }

    // Row 2: Title + Description
    const textWrap = document.createElement('div');
    textWrap.className = 'margin-vertical margin-medium';
    const checkmarks = [];

    group.forEach((child) => {
      if (child.tagName === 'UL') {
        checkmarks.push(child);
      } else {
        textWrap.appendChild(child);
      }
    });
    card.appendChild(textWrap);

    // Row 3: Checkmarks
    checkmarks.forEach((ul) => card.appendChild(ul));

    richtext.appendChild(card);
  });
}

// ============================================
// Shared: group flat Rich Text children by H2
// ============================================
function groupByHeading(richtext) {
  const children = Array.from(richtext.children);
  const groups = [];
  let current = [];

  children.forEach((child) => {
    if (child.tagName === 'H2' && current.length > 0) {
      groups.push(current);
      current = [];
    }
    current.push(child);
  });
  if (current.length > 0) {
    groups.push(current);
  }

  return groups.filter((g) => {
    const text = g.map((el) => el.textContent).join('').trim();
    return text.length > 0;
  });
}

// ============================================
// Export
// ============================================
export default function richtextFeatures() {
  initFeatureWrap();
  initFeatureCards();
  document.addEventListener('barba:afterEnter', (e) => {
    initFeatureWrap(e.detail.container);
    initFeatureCards(e.detail.container);
  });
}

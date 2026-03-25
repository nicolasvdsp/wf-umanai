function initDynamicCurrentYear(container) {
  container = container || document;

  const currentYear = new Date().getFullYear();
  const currentYearElements = container.querySelectorAll('[data-current-year]');
  currentYearElements.forEach(currentYearElement => {
    currentYearElement.textContent = currentYear;
  });
}


// Initialize Dynamic Current Year
function utilities() {
  document.addEventListener('barba:pageVisible', (e) => {
    initDynamicCurrentYear(e.detail.container);
  });
}

export default utilities;
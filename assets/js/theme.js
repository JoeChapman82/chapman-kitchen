// Apply saved theme on load
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
  document.documentElement.setAttribute('data-theme', savedTheme);
}

function setTheme(theme) {
  if (theme === 'default') {
    document.documentElement.removeAttribute('data-theme');
    localStorage.removeItem('theme');
  } else {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }
  updateThemeButtons();
}

function updateThemeButtons() {
  const current = document.documentElement.getAttribute('data-theme') || 'default';
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('theme-btn--active', btn.dataset.theme === current);
  });
}

// Set footer year
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.footer-year').forEach(el => {
    el.textContent = new Date().getFullYear();
  });
});

//Register service worker for PWA support
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/chapman-kitchen/sw.js');
}
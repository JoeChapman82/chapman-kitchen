// Shared overlay open/close behaviour with focus trapping
function setupOverlay(overlayId, closeId, onClose) {
  const overlay = document.getElementById(overlayId);
  const closeBtn = document.getElementById(closeId);
  let previousFocus = null;

  function open() {
    previousFocus = document.activeElement;
    overlay.classList.add('active');
    closeBtn.focus();
  }

  function close() {
    overlay.classList.remove('active');
    if (onClose) onClose();
    if (previousFocus) previousFocus.focus();
  }

  closeBtn.addEventListener('click', close);

  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) close();
  });

  overlay.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') close();

    // Trap focus within the overlay
    if (e.key === 'Tab') {
      const focusable = overlay.querySelectorAll('a, button, [tabindex]:not([tabindex="-1"])');
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  return { open, close, element: overlay };
}
/**
 * Toast Notification System
 * Usage:
 *   Toast.success('Book saved successfully.')
 *   Toast.error('Something went wrong.')
 *   Toast.warning('Available copies exceeds total copies.')
 *   Toast.info('3 books are due today.')
 */

const Toast = (() => {

  let container = null;

  function getContainer() {
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    return container;
  }

  function show(message, type = 'info', duration = 3500) {
    const c = getContainer();

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;

    const icons = {
      success: `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5"/><path d="M8 12.5L10.5 15L16 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
      error:   `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5"/><path d="M12 8V13M12 16V16.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
      warning: `<svg viewBox="0 0 24 24" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 9V13M12 17H12.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
      info:    `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5"/><path d="M12 11V16M12 8V8.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
    };

    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || icons.info}</span>
      <span class="toast-message">${message}</span>
      <button class="toast-close" aria-label="Dismiss">
        <svg viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      </button>
      <div class="toast-progress"></div>
    `;

    // Close on button click
    toast.querySelector('.toast-close').addEventListener('click', () => dismiss(toast));

    c.appendChild(toast);

    // Trigger enter animation
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        toast.classList.add('toast--visible');
      });
    });

    // Progress bar animation
    const progress = toast.querySelector('.toast-progress');
    progress.style.transitionDuration = `${duration}ms`;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        progress.style.width = '0%';
      });
    });

    // Auto dismiss
    const timer = setTimeout(() => dismiss(toast), duration);

    // Pause progress on hover
    toast.addEventListener('mouseenter', () => {
      clearTimeout(timer);
      progress.style.transitionDuration = '0ms';
      const computed = parseFloat(getComputedStyle(progress).width);
      const total = parseFloat(getComputedStyle(progress.parentElement).width);
      progress.style.width = ((computed / total) * 100) + '%';
    });

    toast.addEventListener('mouseleave', () => {
      const computed = parseFloat(getComputedStyle(progress).width);
      const total = parseFloat(getComputedStyle(progress.parentElement).width);
      const remaining = (computed / total) * duration;
      progress.style.transitionDuration = `${remaining}ms`;
      progress.style.width = '0%';
      setTimeout(() => dismiss(toast), remaining);
    });
  }

  function dismiss(toast) {
    toast.classList.remove('toast--visible');
    toast.classList.add('toast--hide');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  }

  return {
    success: (msg, duration) => show(msg, 'success', duration),
    error:   (msg, duration) => show(msg, 'error',   duration),
    warning: (msg, duration) => show(msg, 'warning', duration),
    info:    (msg, duration) => show(msg, 'info',    duration),
  };

})();
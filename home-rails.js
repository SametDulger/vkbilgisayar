(() => {
  'use strict';

  const marquee = document.querySelector('.homepage .brands-marquee');
  const status = document.getElementById('home-brands-motion');
  if (marquee && status) {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let touchStart;

    function describeMotion() {
      if (motion.matches) {
        status.textContent = 'Hareket azaltma tercihiniz nedeniyle marka şeridi sabit.';
      } else if (marquee.classList.contains('is-paused')) {
        status.textContent = 'Marka şeridi duraklatıldı. Sürdürmek için Boşluk veya Enter tuşuna basın.';
      } else {
        status.textContent = 'Marka şeridi odak dışında hareket eder. Duraklatmak için Boşluk veya Enter tuşuna basın.';
      }
    }

    function toggleMotion() {
      marquee.classList.toggle('is-paused');
      describeMotion();
    }

    marquee.addEventListener('pointerdown', (event) => {
      if (event.pointerType !== 'touch') return;
      touchStart = null;
      if (!event.isPrimary || motion.matches || event.target.closest('a[href], button, input, select, textarea, [role="button"]')) return;
      touchStart = { id: event.pointerId, x: event.clientX, y: event.clientY, time: event.timeStamp };
    });
    marquee.addEventListener('pointermove', (event) => {
      if (touchStart?.id !== event.pointerId) return;
      if (Math.hypot(event.clientX - touchStart.x, event.clientY - touchStart.y) > 10) touchStart = null;
    });
    marquee.addEventListener('pointercancel', (event) => {
      if (event.pointerId === touchStart?.id) touchStart = null;
    });
    marquee.addEventListener('pointerup', (event) => {
      if (event.pointerId !== touchStart?.id) return;
      const isTap = Math.hypot(event.clientX - touchStart.x, event.clientY - touchStart.y) <= 10 &&
        event.timeStamp - touchStart.time < 500;
      touchStart = null;
      if (isTap && !motion.matches) toggleMotion();
    });
    marquee.addEventListener('keydown', (event) => {
      if (event.target !== marquee || motion.matches || (event.key !== ' ' && event.key !== 'Enter')) return;
      event.preventDefault();
      if (!event.repeat) toggleMotion();
    });

    describeMotion();
    motion.addEventListener('change', describeMotion);
  }

  const toggle = document.querySelector('.homepage #home-popular-toggle');
  const groups = document.getElementById('home-popular-groups');
  if (!toggle || !groups) return;

  const label = toggle.querySelector('.home-popular-toggle-label');
  const arrow = toggle.querySelector('.home-popular-toggle-arrow');

  function setOpen(open) {
    groups.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    label.textContent = open ? 'Alt kategorileri kapat' : 'Tüm alt kategorileri gör';
    arrow.textContent = open ? '↑' : '→';
  }

  toggle.addEventListener('click', () => setOpen(groups.hidden));
  toggle.closest('.home-popular').addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || groups.hidden) return;
    event.preventDefault();
    event.stopPropagation();
    setOpen(false);
    toggle.focus();
  });
})();

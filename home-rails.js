(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('[data-card-rail]').forEach((rail) => {
    const track = rail.querySelector('.card-rail-track');
    if (!track) return;

    const originalCards = Array.from(track.children).filter((card) => !card.dataset.railClone);
    if (originalCards.length < 2) return;

    const makeClones = () => {
      const fragment = document.createDocumentFragment();
      const clones = originalCards.map((card) => {
        const clone = card.cloneNode(true);
        clone.dataset.railClone = 'true';
        clone.setAttribute('aria-hidden', 'true');
        clone.querySelectorAll('a,button,[tabindex]').forEach((node) => node.setAttribute('tabindex', '-1'));
        fragment.appendChild(clone);
        return clone;
      });
      return { fragment, clones };
    };

    const before = makeClones();
    const after = makeClones();
    track.insertBefore(before.fragment, track.firstChild);
    track.appendChild(after.fragment);

    let period = 0;
    let initialized = false;
    let pauseUntil = 0;
    let pointerId = null;
    let startX = 0;
    let startScroll = 0;
    let dragged = false;
    let previousFrame = 0;
    const speed = Math.max(10, Number.parseFloat(rail.dataset.speed) || 30);

    const getStepSize = () => {
      const first = originalCards[0];
      const styles = window.getComputedStyle(track);
      const gap = Number.parseFloat(styles.columnGap || styles.gap) || 0;
      return first.getBoundingClientRect().width + gap;
    };

    const measure = () => {
      const originalStart = originalCards[0].getBoundingClientRect().left;
      const afterStart = after.clones[0].getBoundingClientRect().left;
      const nextPeriod = afterStart - originalStart;
      if (nextPeriod > 0) {
        period = nextPeriod;
        if (!initialized) {
          rail.scrollLeft = period;
          initialized = true;
        } else {
          const offset = ((rail.scrollLeft - period) % period + period) % period;
          rail.scrollLeft = period + offset;
        }
      }
    };

    const normalize = () => {
      if (!period) return;
      if (rail.scrollLeft < period) rail.scrollLeft += period;
      else if (rail.scrollLeft >= period * 2) rail.scrollLeft -= period;
    };

    const pauseFor = (duration = 1200) => {
      pauseUntil = Math.max(pauseUntil, performance.now() + duration);
    };

    const move = (direction) => {
      pauseFor(1500);
      rail.scrollBy({ left: getStepSize() * direction * 2, behavior: reduceMotion ? 'auto' : 'smooth' });
      window.setTimeout(normalize, 900);
    };

    document.querySelectorAll(`[data-rail-prev="${rail.id}"]`).forEach((button) => button.addEventListener('click', () => move(-1)));
    document.querySelectorAll(`[data-rail-next="${rail.id}"]`).forEach((button) => button.addEventListener('click', () => move(1)));

    const isPaused = () => reduceMotion
      || document.hidden
      || rail.matches(':hover')
      || rail.contains(document.activeElement)
      || pointerId !== null
      || performance.now() < pauseUntil;

    const tick = (timestamp) => {
      if (!previousFrame) previousFrame = timestamp;
      const elapsed = Math.min((timestamp - previousFrame) / 1000, 0.05);
      previousFrame = timestamp;
      if (!isPaused() && period > 0) {
        rail.scrollLeft += speed * elapsed;
        normalize();
      }
      window.requestAnimationFrame(tick);
    };

    rail.addEventListener('pointerenter', () => pauseFor(300));
    rail.addEventListener('pointerleave', () => pauseFor(300));
    rail.addEventListener('focusin', () => pauseFor(300));
    rail.addEventListener('focusout', () => pauseFor(300));
    rail.addEventListener('wheel', () => { pauseFor(1800); window.setTimeout(normalize, 700); }, { passive: true });
    rail.addEventListener('touchstart', () => pauseFor(5000), { passive: true });
    rail.addEventListener('touchend', () => { pauseFor(900); window.setTimeout(normalize, 1100); }, { passive: true });
    rail.addEventListener('scrollend', normalize);

    rail.addEventListener('pointerdown', (event) => {
      if (event.pointerType !== 'mouse' || event.button !== 0) return;
      pointerId = event.pointerId;
      startX = event.clientX;
      startScroll = rail.scrollLeft;
      dragged = false;
      pauseFor(5000);
    });

    rail.addEventListener('pointermove', (event) => {
      if (pointerId === null || event.pointerId !== pointerId) return;
      const delta = event.clientX - startX;
      if (!dragged && Math.abs(delta) > 6) {
        dragged = true;
        rail.classList.add('is-dragging');
        rail.setPointerCapture(pointerId);
      }
      if (dragged) {
        rail.scrollLeft = startScroll - delta;
      }
    });

    const finishDrag = (event) => {
      if (pointerId === null || (event && event.pointerId !== pointerId)) return;
      const wasDragged = dragged;
      if (rail.hasPointerCapture(pointerId)) rail.releasePointerCapture(pointerId);
      pointerId = null;
      dragged = false;
      rail.classList.remove('is-dragging');
      normalize();
      pauseFor(900);
      if (wasDragged) {
        rail.dataset.suppressClick = 'true';
        window.setTimeout(() => { delete rail.dataset.suppressClick; }, 100);
      }
    };

    rail.addEventListener('pointerup', finishDrag);
    rail.addEventListener('pointercancel', finishDrag);
    rail.addEventListener('lostpointercapture', finishDrag);
    rail.addEventListener('click', (event) => {
      if (rail.dataset.suppressClick === 'true') {
        event.preventDefault();
        event.stopPropagation();
        delete rail.dataset.suppressClick;
      }
    }, true);

    document.addEventListener('visibilitychange', () => { previousFrame = 0; });
    window.addEventListener('resize', () => window.requestAnimationFrame(measure), { passive: true });
    if ('ResizeObserver' in window) {
      const observer = new ResizeObserver(() => window.requestAnimationFrame(measure));
      observer.observe(rail);
      observer.observe(track);
    }

    window.requestAnimationFrame(() => {
      measure();
      if (!reduceMotion && rail.dataset.autoplay === 'true') window.requestAnimationFrame(tick);
    });
  });
})();

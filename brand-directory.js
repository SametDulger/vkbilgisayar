(() => {
  'use strict';
  const directory = document.querySelector('[data-brand-directory]');
  if (!directory) return;

  const search = directory.querySelector('#brandSearch');
  const empty = directory.querySelector('#brandEmptyState');
  const reset = directory.querySelector('#brandReset');
  const pageSize = 18;
  const normalize = (value) => String(value || '').toLocaleLowerCase('tr-TR')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ı/g, 'i');

  const groups = Array.from(directory.querySelectorAll('[data-brand-section]')).map((section) => {
    const cards = Array.from(section.querySelectorAll('[data-brand-tile]'));
    const pager = section.querySelector('[data-brand-pagination]');
    return {
      section,
      cards,
      pager,
      previous: pager?.querySelector('[data-brand-prev]'),
      next: pager?.querySelector('[data-brand-next]'),
      label: pager?.querySelector('[data-brand-page]'),
      page: 1,
      matches: cards
    };
  });

  function renderGroup(group, term) {
    group.matches = group.cards.filter((card) => !term || normalize(card.dataset.brandName).includes(term));
    const pageCount = Math.max(1, Math.ceil(group.matches.length / pageSize));
    group.page = Math.min(Math.max(1, group.page), pageCount);
    const start = (group.page - 1) * pageSize;
    const visible = new Set(group.matches.slice(start, start + pageSize));

    group.cards.forEach((card) => { card.hidden = !visible.has(card); });
    group.section.hidden = group.matches.length === 0;
    if (group.pager) group.pager.hidden = group.matches.length <= pageSize;
    if (group.label) group.label.textContent = `Sayfa ${group.page} / ${pageCount}`;
    if (group.previous) group.previous.disabled = group.page <= 1;
    if (group.next) group.next.disabled = group.page >= pageCount;
  }

  function render() {
    const term = normalize(search?.value).trim();
    let totalMatches = 0;
    groups.forEach((group) => {
      renderGroup(group, term);
      totalMatches += group.matches.length;
    });
    if (empty) empty.hidden = totalMatches !== 0;
  }

  groups.forEach((group) => {
    group.previous?.addEventListener('click', () => { group.page -= 1; render(); });
    group.next?.addEventListener('click', () => { group.page += 1; render(); });
  });
  search?.addEventListener('input', () => {
    groups.forEach((group) => { group.page = 1; });
    render();
  });
  reset?.addEventListener('click', () => {
    if (search) search.value = '';
    groups.forEach((group) => { group.page = 1; });
    render();
    search?.focus();
  });
  render();
})();

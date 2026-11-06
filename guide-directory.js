(() => {
  "use strict";

  const controls = document.querySelector("[data-guide-directory-controls]");
  if (!controls) return;

  const search = controls.querySelector("[data-guide-search]");
  const categorySections = Array.from(document.querySelectorAll("[data-guide-section]"));
  const empty = document.querySelector("[data-guide-empty]");
  const pageSize = 6;

  const normalize = (value) => String(value || "")
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const groups = categorySections.map((section) => {
    const cards = Array.from(section.querySelectorAll(".principle-card"));
    const pager = section.querySelector("[data-guide-pagination]");
    return {
      section,
      name: section.dataset.guideName || "Rehber kategorisi",
      cards,
      pager,
      previous: pager?.querySelector("[data-guide-prev]"),
      next: pager?.querySelector("[data-guide-next]"),
      label: pager?.querySelector("[data-guide-page]"),
      page: 1,
      matches: cards
    };
  });

  function renderGroup(group, term) {
    group.matches = group.cards.filter((card) => !term || normalize(card.textContent).includes(term));
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
    group.previous?.addEventListener("click", () => {
      group.page -= 1;
      render();
    });
    group.next?.addEventListener("click", () => {
      group.page += 1;
      render();
    });
  });

  search?.addEventListener("input", () => {
    groups.forEach((group) => { group.page = 1; });
    render();
  });

  render();
})();

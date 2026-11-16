(() => {
  'use strict';

  const requestTimeout = 15000;

  function validPhone(value) {
    const trimmed = value.trim();
    if (!trimmed) return true;
    const phone = trimmed.replace(/[\s().-]/g, '');
    if (phone.startsWith('+') || phone.startsWith('00')) {
      return /^(\+|00)[1-9][0-9]{6,14}$/.test(phone);
    }
    return /^[0-9]{7,15}$/.test(phone);
  }

  function addOfferContext(form) {
    const topic = form.elements.namedItem('topic');
    const hint = form.querySelector('#contact-product-context');
    const catalogue = document.getElementById('contact-context-data');
    const sources = new URLSearchParams(location.search).getAll('kaynak');
    if (!topic || !hint || !catalogue || sources.length !== 1) return;

    const [source] = sources;
    const { categories, guides } = JSON.parse(catalogue.textContent);
    const category = Object.hasOwn(categories, source) ? categories[source] : '';
    const guideGroup = Object.entries(guides).find(([, slugs]) => slugs.includes(source))?.[0];
    const context = category || guideGroup;
    if (!context) return;

    const option = new Option(category ? 'Bu kategori için fiyat teklifi' : 'Bu ürün grubu için fiyat teklifi', 'Teklif talebi');
    topic.add(option);
    option.selected = true;

    function updateHint() {
      const selected = option.selected;
      hint.textContent = selected ? (category ? 'İlgili kategori: ' : 'İlgili ürün grubu: ') + context : '';
      hint.hidden = !selected;
    }

    updateHint();
    topic.addEventListener('change', updateHint);
    form.addEventListener('reset', () => queueMicrotask(updateHint));
    form.addEventListener('formdata', (event) => {
      if (option.selected) event.formData.set('product_context', context);
    });
  }

  function showStatus(status, kind, message) {
    if (!status) return;
    status.textContent = message;
    status.classList.add(kind);
    status.focus();
  }

  document.querySelectorAll('form[data-formspree-contact]').forEach((form) => {
    const status = form.querySelector('.contact-form-status');
    const submitButton = form.querySelector('button[type="submit"]');
    const submitLabel = form.querySelector('.contact-submit-label');
    const originalLabel = submitLabel?.textContent;
    const message = form.elements.namedItem('message');
    const phone = form.elements.namedItem('phone');

    function validateFields() {
      const min = message.minLength;
      const feedback = message.value.trim().length < min
        ? `Ürün ihtiyacınızı en az ${min} karakterle açıklayın.` : '';
      message.setCustomValidity(feedback);
      phone.setCustomValidity(validPhone(phone.value) ? '' :
        'Telefon numaranızı rakamlarla yazın. Uluslararası numarada ülke kodunu ekleyebilirsiniz.');
    }

    addOfferContext(form);
    form.addEventListener('input', validateFields);
    form.addEventListener('change', validateFields);
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (form.getAttribute('aria-busy') === 'true') return;
      validateFields();
      if (!form.reportValidity()) return;
      if (status) {
        status.textContent = '';
        status.className = 'contact-form-status';
      }
      const originallyDisabled = submitButton?.disabled;
      if (submitButton) submitButton.disabled = true;
      if (submitLabel) submitLabel.textContent = 'Gönderiliyor…';
      form.setAttribute('aria-busy', 'true');

      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), requestTimeout);
      try {
        const response = await fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
          headers: { Accept: 'application/json' },
          signal: controller.signal
        });
        if (!response.ok) {
          showStatus(status, 'is-error',
            'Talebiniz gönderilemedi. Girdileriniz formda duruyor. Daha sonra tekrar deneyebilir veya bize telefon ya da e-posta ile ulaşabilirsiniz.');
          return;
        }

        form.reset();
        showStatus(status, 'is-success',
          'Mesajınız başarıyla gönderildi. Bizimle iletişime geçtiğiniz için teşekkür ederiz.');
      } catch {
        const feedback = controller.signal.aborted
          ? 'Yanıt zamanında gelmedi. Talebinizin ulaşıp ulaşmadığını telefon veya e-posta ile teyit edebilirsiniz. Girdileriniz formda duruyor.'
          : 'Bağlantı kurulamadı veya kesildi. Girdileriniz formda duruyor. Bağlantınızı kontrol edin veya bize telefon ya da e-posta ile ulaşın.';
        showStatus(status, 'is-error', feedback);
      } finally {
        window.clearTimeout(timer);
        if (submitButton) submitButton.disabled = originallyDisabled;
        if (submitLabel) submitLabel.textContent = originalLabel;
        form.removeAttribute('aria-busy');
      }
    });
  });
})();

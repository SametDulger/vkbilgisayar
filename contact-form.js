(()=>{
  'use strict';
  const form = document.querySelector('#contact-form');
  if (!form) return;
  const status = document.querySelector('#contact-form-status');
  const submitButton = form.querySelector('button[type="submit"]');
  const submitLabel = form.querySelector('.contact-submit-label');
  const originalLabel = submitLabel ? submitLabel.textContent : 'Mesajı gönder';

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    if (status) {
      status.textContent = '';
      status.className = 'contact-form-status';
    }
    if (submitButton) submitButton.disabled = true;
    if (submitLabel) submitLabel.textContent = 'Gönderiliyor…';

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      });
      let result = {};
      try { result = await response.json(); } catch (_) { /* Some error responses may not contain JSON. */ }

      if (!response.ok) {
        const detail = Array.isArray(result.errors) ? result.errors.map((item) => item.message).filter(Boolean).join(' ') : '';
        throw new Error(detail || 'Mesajınız gönderilemedi. Lütfen tekrar deneyin veya telefon ya da e-posta ile bize ulaşın.');
      }

      form.reset();
      if (status) {
        status.textContent = 'Mesajınız başarıyla gönderildi. Bizimle iletişime geçtiğiniz için teşekkür ederiz.';
        status.classList.add('is-success');
        status.focus();
      }
    } catch (error) {
      if (status) {
        status.textContent = error && error.message ? error.message : 'Bağlantı sırasında bir sorun oluştu. Lütfen tekrar deneyin.';
        status.classList.add('is-error');
        status.focus();
      }
    } finally {
      if (submitButton) submitButton.disabled = false;
      if (submitLabel) submitLabel.textContent = originalLabel;
    }
  });
})();

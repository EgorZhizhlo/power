import { showErrorModal, parseErrorMessage } from '/static/company/_utils/modal.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('act-series-form');
  const submitButton = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const method = window.isCreate ? 'POST' : 'PUT';
    const actionUrl = form.getAttribute('action');

    const jsonData = {
      name: formData.get('name')
    };

    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = '⏳ Сохранение...';

    try {
      const response = await fetch(actionUrl, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jsonData)
      });

      if (response.status === 204) {
        window.location.href = `/companies/act-series?company_id=${window.companyId}`;
      } else if (response.status === 403) {
        showErrorModal('Недостаточно прав для выполнения действия.');
      } else if (response.status >= 400) {
        const errorMessage = await parseErrorMessage(response, `Ошибка: ${response.status}`);
        showErrorModal(errorMessage);
      }
    } catch (err) {
      showErrorModal('Ошибка соединения: ' + err.message);
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = originalText;
    }
  });
});

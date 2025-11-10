import { showErrorModal, parseErrorMessage } from '/static/company/_utils/modal.js';

document.addEventListener('DOMContentLoaded', () => {
  IMask(document.getElementById('client_phone'), { mask: '+{7} (000) 000-00-00' });

  const form = document.getElementById('act-number-form');
  const submitButton = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const method = window.isCreate ? 'POST' : 'PUT';
    const actionUrl = form.getAttribute('action');

    const actNumberValue = formData.get('act_number');
    const cityIdValue = formData.get('city_id');
    const seriesIdValue = formData.get('series_id');

    const jsonData = {
      act_number: (actNumberValue && actNumberValue.trim() !== '') ? parseInt(actNumberValue) : null,
      legal_entity: formData.get('legal_entity'),
      client_full_name: formData.get('client_full_name'),
      client_phone: formData.get('client_phone'),
      address: formData.get('address'),
      city_id: (cityIdValue && cityIdValue.trim() !== '') ? parseInt(cityIdValue) : null,
      series_id: (seriesIdValue && seriesIdValue.trim() !== '') ? parseInt(seriesIdValue) : null,
      verification_date: formData.get('verification_date')
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
        window.location.href = `/companies/act-numbers?company_id=${window.companyId}`;
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

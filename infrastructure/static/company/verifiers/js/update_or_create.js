import { showErrorModal, parseErrorMessage } from '/static/company/_utils/modal.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('verifier-form');
  const submitButton = form.querySelector('button[type="submit"]');
  
  const equipmentsSelect = document.getElementById('equipments');
  if (equipmentsSelect) {
    new Choices(equipmentsSelect, {
      removeItemButton: true,
      searchEnabled: true,
      placeholderValue: 'Выберите оборудование',
      noResultsText: 'Ничего не найдено',
      itemSelectText: 'Нажмите для выбора'
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const method = window.isCreate ? 'POST' : 'PUT';
    const actionUrl = form.getAttribute('action');

    const equipmentsValues = formData.getAll('equipments')
      .filter(v => v && v.trim() !== '')
      .map(v => parseInt(v));

    const jsonData = {
      last_name: formData.get('last_name'),
      name: formData.get('name'),
      patronymic: formData.get('patronymic'),
      snils: formData.get('snils'),
      equipments: equipmentsValues
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
        window.location.href = `/companies/verifiers?company_id=${window.companyId}`;
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

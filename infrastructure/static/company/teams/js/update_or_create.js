import { showErrorModal, parseErrorMessage } from '/static/company/_utils/modal.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('team-form');
  const submitButton = form.querySelector('button[type="submit"]');
  
  const verifiersSelect = document.getElementById('verifiers');
  if (verifiersSelect) {
    new Choices(verifiersSelect, {
      removeItemButton: true,
      searchEnabled: true,
      placeholderValue: 'Выберите поверителей',
      noResultsText: 'Ничего не найдено',
      itemSelectText: 'Нажмите для выбора'
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const method = window.isCreate ? 'POST' : 'PUT';
    const actionUrl = form.getAttribute('action');

    const verifiersValues = formData.getAll('verifiers')
      .filter(v => v && v.trim() !== '')
      .map(v => parseInt(v));

    const jsonData = {
      name: formData.get('name'),
      verifiers: verifiersValues
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
        window.location.href = `/companies/teams?company_id=${window.companyId}`;
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

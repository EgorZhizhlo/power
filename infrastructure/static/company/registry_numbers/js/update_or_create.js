import { showErrorModal, parseErrorMessage } from '/static/company/_utils/modal.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('registry-number-form');
  const submitButton = form.querySelector('button[type="submit"]');
  
  const modificationsSelect = document.getElementById('modifications');
  if (modificationsSelect) {
    new Choices(modificationsSelect, {
      removeItemButton: true,
      searchEnabled: true,
      placeholderValue: 'Выберите модификации',
      noResultsText: 'Ничего не найдено',
      itemSelectText: 'Нажмите для выбора'
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const method = window.isCreate ? 'POST' : 'PUT';
    const actionUrl = form.getAttribute('action');

    const modificationsValues = formData.getAll('modifications')
      .filter(v => v && v.trim() !== '')
      .map(v => parseInt(v));

    const mpiHotValue = formData.get('mpi_hot');
    const mpiColdValue = formData.get('mpi_cold');
    const methodIdValue = formData.get('method_id');

    const jsonData = {
      registry_number: formData.get('registry_number'),
      si_type: formData.get('si_type'),
      mpi_hot: (mpiHotValue && mpiHotValue.trim() !== '') ? parseInt(mpiHotValue) : null,
      mpi_cold: (mpiColdValue && mpiColdValue.trim() !== '') ? parseInt(mpiColdValue) : null,
      method_id: (methodIdValue && methodIdValue.trim() !== '') ? parseInt(methodIdValue) : null,
      modifications: modificationsValues
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
        window.location.href = `/companies/registry-numbers?company_id=${window.companyId}`;
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

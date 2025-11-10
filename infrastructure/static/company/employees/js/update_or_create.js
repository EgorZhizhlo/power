import { showErrorModal, parseErrorMessage } from '/static/company/_utils/modal.js';

document.addEventListener('DOMContentLoaded', () => {
  const choicesInstances = {};
  document.querySelectorAll('select.choices').forEach(el => {
    const isMultiple = el.multiple;
    const inst = new Choices(el, {
      removeItemButton: isMultiple,
      placeholder: true,
      placeholderValue: el.dataset.placeholder || '',
      searchPlaceholderValue: 'Поиск…',
      shouldSort: false
    });
    choicesInstances[el.id] = inst;
  });

  const statusEl = document.getElementById('status');
  const trustBlock = document.getElementById('trust-fields');

  function toggleTrustFields() {
    const isAuditor = statusEl.value === 'auditor';
    trustBlock.style.display = isAuditor ? '' : 'none';
    if (!isAuditor) {
      choicesInstances['trust_equipment']?.setChoiceByValue('false');
      choicesInstances['trust_verifier']?.setChoiceByValue('false');
    }
  }
  toggleTrustFields();
  statusEl.addEventListener('change', toggleTrustFields);

  const form = document.getElementById('employee-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const isCreate = window.isCreate;
    const companyId = window.companyId;
    const method = isCreate ? 'POST' : 'PUT';
    const actionUrl = form.getAttribute('action');

    try {
      const formData = new FormData(form);
      const data = {};
      
      for (const [key, value] of formData.entries()) {
        if (key === 'image') continue;
        if (key === 'city_ids' || key === 'route_ids') {
          if (!data[key]) data[key] = [];
          if (value && value.trim() !== '') data[key].push(parseInt(value));
        } else if (key === 'is_active') {
          data[key] = value === 'true';
        } else if (key === 'trust_verifier' || key === 'trust_equipment') {
          data[key] = value === 'true';
        } else if (['default_verifier_id', 'default_city_id', 'series_id'].includes(key)) {
          data[key] = (value && value.trim() !== '') ? parseInt(value) : null;
        } else {
          data[key] = value;
        }
      }

      const imageInput = document.getElementById('image');
      if (imageInput.files && imageInput.files[0]) {
        const file = imageInput.files[0];
        
        if (file.size > 5 * 1024 * 1024) {
          showErrorModal('Размер файла не должен превышать 5 МБ');
          return;
        }
        
        if (!file.type.startsWith('image/')) {
          showErrorModal('Можно загружать только изображения');
          return;
        }
        
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        
        data.image = base64;
      } else {
        data.image = null;
      }

      const response = await fetch(actionUrl, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (response.status === 204) {
        window.location.href = `/companies/employees?company_id=${companyId}`;
      } else if (response.status === 403 || response.status >= 400) {
        const errorMsg = await parseErrorMessage(response, 'Ошибка при сохранении сотрудника');
        showErrorModal(errorMsg);
      }
    } catch (err) {
      showErrorModal('Ошибка соединения: ' + err.message);
    }
  });
});

import { showErrorModal, parseErrorMessage } from '/static/company/_utils/modal.js';

document.addEventListener('DOMContentLoaded', function () {
  const el = document.getElementById('employee_ids');
  if (el) {
    new Choices(el, {
      removeItemButton: true,
      searchResultLimit: 50,
      shouldSort: false,
      placeholder: true,
      placeholderValue: 'Выберите сотрудников',
      noResultsText: 'Ничего не найдено',
      noChoicesText: 'Нет доступных сотрудников'
    });
  }

  const form = document.getElementById("company-form");
  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const formData = new FormData(form);
    const isCreate = window.isCreate;
    const method = isCreate ? 'POST' : 'PUT';
    const actionUrl = form.getAttribute('action');
    const userStatus = window.userStatus;

    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = '⏳ Сохранение...';

    try {
      const payload = {};
      
      for (const [key, value] of formData.entries()) {
        if (key.endsWith('_visible') || key.endsWith('_required') || 
            key === 'auto_manufacture_year' || key === 'auto_teams' || key === 'auto_metrolog') {
          if (!payload[key]) payload[key] = false;
          if (value === 'true') payload[key] = true;
        } 
        else if (key === 'employee_ids') {
          if (!payload.employee_ids) payload.employee_ids = [];
          if (value && value.trim() !== '') payload.employee_ids.push(parseInt(value));
        }
        else if (['daily_verifier_verif_limit', 'default_pressure'].includes(key)) {
          payload[key] = (value && value.trim() !== '') ? parseInt(value) : null;
        }
        else if (['longitude', 'latitude'].includes(key)) {
          payload[key] = (value && value.trim() !== '') ? parseFloat(value) : null;
        }
        else {
          payload[key] = value;
        }
      }

      let body;
      if (isCreate) {
        body = JSON.stringify({ admin_form: payload });
      } else {
        if (userStatus === 'admin') {
          body = JSON.stringify({ admin_form: payload });
        } else {
          body = JSON.stringify({ director_form: payload });
        }
      }

      const response = await fetch(actionUrl, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body
      });

      if (response.status === 204) {
        window.location.href = "/companies";
      } else if (response.status === 403 || response.status >= 400) {
        const errorMsg = await parseErrorMessage(response, 'Ошибка при сохранении компании');
        showErrorModal(errorMsg);
      }
    } catch (err) {
      showErrorModal("Ошибка соединения: " + err.message);
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = originalText;
    }
  });
});

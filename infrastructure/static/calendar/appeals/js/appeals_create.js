import { createAppeal } from './api_requests.js';
import { preparePhoneMasks } from '/static/calendar/_utils/utils.js';

export function initCreateModal() {
  const modalEl = document.getElementById('modal-create');
  const modal   = new bootstrap.Modal(modalEl);
  const form    = document.getElementById('form-create');

  document.getElementById('btn-create').addEventListener('click', () => {
    form.reset();
    preparePhoneMasks();
    modal.show();
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();

    // Проверяем, есть ли поле клиента
    const clientEl = document.getElementById('create-client');

    const payload = {
      client_full_name: clientEl
        ? clientEl.value.trim()
        : null,
      address:          document.getElementById('create-address').value.trim(),
      phone_number:     document.getElementById('create-phone').value.trim(),
      additional_info:  document.getElementById('create-info').value.trim(),
      status:           parseInt(document.getElementById('create-status').value, 10)
    };

    try {
      await createAppeal(payload);
      modal.hide();
      await window.loadAppeals();
    } catch (err) {
      alert('Ошибка создания: ' + err.message);
    }
  });
}

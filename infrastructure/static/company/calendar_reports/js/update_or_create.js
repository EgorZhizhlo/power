const AVAILABLE_FIELDS = [
  ['dispatcher', 'Создатель заявки'],
  ['route', 'Маршрут'],
  ['date', 'Дата'],
  ['address', 'Адрес'],
  ['phone_number', 'Телефон'],
  ['sec_phone_number', 'Доп. телефон'],
  ['client_full_name', 'ФИО клиента'],
  ['legal_entity', 'Юр. статус'],
  ['counter_number', '№ счётчика'],
  ['water_type', 'Тип воды'],
  ['price', 'Цена'],
  ['status', 'Статус заявки(для заявок без даты)'],
  ['additional_info', 'Доп. информация'],
  ['deleted_at', 'Время удаления заявки(для неактивных заявок)'],
];

function createFieldItem(fieldKey, fieldLabel, isEnabled = false) {
  const item = document.createElement('div');
  item.className = 'list-group-item d-flex justify-content-between align-items-center';
  item.style.cursor = 'move';
  item.dataset.fieldKey = fieldKey;

  item.innerHTML = `
    <span class="label-text fw-bold">
      <i class="bi bi-grip-vertical me-2"></i>
      ${fieldLabel}
    </span>
    <select class="form-select input-text field-toggle" style="width: 120px;" data-field="${fieldKey}">
      <option value="false" ${!isEnabled ? 'selected' : ''}>Нет</option>
      <option value="true" ${isEnabled ? 'selected' : ''}>Да</option>
    </select>
  `;

  return item;
}

async function initializeFieldsList() {
  const fieldsList = document.getElementById('fields-list');
  fieldsList.innerHTML = '';

  let fieldsOrder = [];
  let fieldsState = {};

  if (!window.isCreate && window.calendarReportId) {
    try {
      const response = await fetch(
        `/companies/api/calendar-reports/report?company_id=${window.companyId}&calendar_report_id=${window.calendarReportId}`
      );
      
      if (!response.ok) {
        throw new Error('Не удалось загрузить данные отчёта');
      }
      
      const reportData = await response.json();
      
      document.getElementById('name').value = reportData.name || '';
      document.getElementById('for_auditor').value = reportData.for_auditor ? 'true' : 'false';
      document.getElementById('for_dispatcher1').value = reportData.for_dispatcher1 ? 'true' : 'false';
      document.getElementById('for_dispatcher2').value = reportData.for_dispatcher2 ? 'true' : 'false';
      document.getElementById('no_date').value = reportData.no_date ? 'true' : 'false';
      
      const orderStr = reportData.fields_order || '';
      fieldsOrder = orderStr ? orderStr.split(',').filter(f => f) : [];
      
      AVAILABLE_FIELDS.forEach(([key]) => {
        fieldsState[key] = reportData[key] === true;
      });
      
    } catch (error) {
      console.error('Ошибка загрузки отчёта:', error);
      showErrorModal('Не удалось загрузить данные отчёта: ' + error.message);
      return;
    }
  }

  if (fieldsOrder.length === 0) {
    fieldsOrder = AVAILABLE_FIELDS.map(([key]) => key);
  }

  fieldsOrder.forEach(key => {
    const field = AVAILABLE_FIELDS.find(([k]) => k === key);
    if (field) {
      const [fieldKey, fieldLabel] = field;
      const isEnabled = fieldsState[fieldKey] || false;
      fieldsList.appendChild(createFieldItem(fieldKey, fieldLabel, isEnabled));
    }
  });

  AVAILABLE_FIELDS.forEach(([key, label]) => {
    if (!fieldsOrder.includes(key)) {
      const isEnabled = fieldsState[key] || false;
      fieldsList.appendChild(createFieldItem(key, label, isEnabled));
    }
  });

  new Sortable(fieldsList, {
    animation: 150,
    handle: '.list-group-item',
    ghostClass: 'sortable-ghost',
  });
}

function showErrorModal(message) {
  const modalHtml = `
    <div class="modal fade" id="errorModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header bg-danger text-white">
            <h5 class="modal-title">Ошибка</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <p>${message}</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Закрыть</button>
          </div>
        </div>
      </div>
    </div>`;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  const modal = new bootstrap.Modal(document.getElementById('errorModal'));
  modal.show();
  document.getElementById('errorModal').addEventListener('hidden.bs.modal', () => {
    document.getElementById('errorModal').remove();
  });
}

document.addEventListener('DOMContentLoaded', async function () {
  await initializeFieldsList();

  const form = document.getElementById('calendar-report-form');

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    if (!name) {
      showErrorModal('Пожалуйста, введите название отчёта.');
      return;
    }

    const fieldsList = document.getElementById('fields-list');
    const fieldsOrder = Array.from(fieldsList.children).map(
      item => item.dataset.fieldKey
    );

    const fieldsState = {};
    document.querySelectorAll('.field-toggle').forEach(select => {
      const fieldKey = select.dataset.field;
      fieldsState[fieldKey] = select.value === 'true';
    });

    const forAuditor = document.getElementById('for_auditor').value === 'true';
    const forDispatcher1 = document.getElementById('for_dispatcher1').value === 'true';
    const forDispatcher2 = document.getElementById('for_dispatcher2').value === 'true';
    const noDate = document.getElementById('no_date').value === 'true';

    const data = {
      name,
      fields_order: fieldsOrder,
      fields_state: fieldsState,
      for_auditor: forAuditor,
      for_dispatcher1: forDispatcher1,
      for_dispatcher2: forDispatcher2,
      no_date: noDate,
    };

    const isCreate = window.isCreate;
    const method = isCreate ? 'POST' : 'PUT';
    let url = `/companies/api/calendar-reports/${isCreate ? 'create' : 'update'}?company_id=${window.companyId}`;
    if (!isCreate && window.calendarReportId) {
      url += `&calendar_report_id=${window.calendarReportId}`;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = '⏳ Сохранение...';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.status === 204) {
        window.location.href = `/companies/calendar-reports/?company_id=${window.companyId}`;
      } else if (response.status === 403) {
        showErrorModal('Недостаточно прав для выполнения действия.');
      } else if (response.status >= 400) {
        const text = await response.text();
        let errorMsg = 'Ошибка: ' + response.status;
        try {
          const json = JSON.parse(text);
          errorMsg = json.detail || errorMsg;
        } catch {
          errorMsg = text || errorMsg;
        }
        showErrorModal(errorMsg);
      }
    } catch (err) {
      showErrorModal('Ошибка соединения: ' + err.message);
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = originalText;
    }
  });
});

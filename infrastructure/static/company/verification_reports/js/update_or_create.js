const BASE_FIELDS = [
  ['employee_name', 'ФИО сотрудника'],
  ['verification_date', 'Дата'],
  ['city', 'Город'],
  ['address', 'Адрес'],
  ['client_name', 'ФИО клиента'],
  ['si_type', 'Тип СИ'],
  ['registry_number', '№ гос.реестра'],
  ['factory_number', 'Заводской №'],
  ['location_name', 'Место СИ'],
  ['meter_info', 'Показания'],
  ['end_verification_date', 'Окончание поверки'],
  ['series_name', 'Серия акта'],
  ['act_number', '№ акта'],
  ['verification_result', 'Результат поверки'],
  ['verification_number', '№ св-ва'],
  ['qh', 'Qн'],
  ['modification_name', 'Модификация'],
  ['water_type', 'Тип воды'],
  ['method_name', 'Методика'],
  ['reference', 'Эталон'],
  ['seal', 'Пломба'],
  ['phone_number', 'Телефон'],
  ['verifier_name', 'ФИО поверителя'],
  ['manufacture_year', 'Год произв. СИ'],
  ['reason_name', 'Причина непригодности'],
  ['interval', 'МПИ'],
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

  let availableFields = [...BASE_FIELDS];

  if (window.additionalCheckboxFields && window.additionalCheckboxFields.length) {
    window.additionalCheckboxFields.forEach(([idx, label]) => {
      availableFields.push([`additional_checkbox_${idx}`, label]);
    });
  }

  if (window.additionalInputFields && window.additionalInputFields.length) {
    window.additionalInputFields.forEach(([idx, label]) => {
      availableFields.push([`additional_input_${idx}`, label]);
    });
  }

  let fieldsOrder = [];
  let fieldsState = {};

  if (!window.isCreate && window.verificationReportId) {
    try {
      const response = await fetch(
        `/companies/api/verification-reports/report?company_id=${window.companyId}&verification_report_id=${window.verificationReportId}`
      );

      if (!response.ok) {
        throw new Error('Не удалось загрузить данные отчёта');
      }

      const reportData = await response.json();

      document.getElementById('name').value = reportData.name || '';
      document.getElementById('for_verifier').value = reportData.for_verifier ? 'true' : 'false';
      document.getElementById('for_auditor').value = reportData.for_auditor ? 'true' : 'false';

      const orderStr = reportData.fields_order || '';
      fieldsOrder = orderStr ? orderStr.split(',').filter(f => f) : [];

      availableFields.forEach(([key]) => {
        fieldsState[key] = reportData[key] === true;
      });

    } catch (error) {
      console.error('Ошибка загрузки отчёта:', error);
      showErrorModal('Не удалось загрузить данные отчёта: ' + error.message);
      return;
    }
  }

  if (fieldsOrder.length === 0) {
    fieldsOrder = availableFields.map(([key]) => key);
  }

  fieldsOrder.forEach(key => {
    const field = availableFields.find(([k]) => k === key);
    if (field) {
      const [fieldKey, fieldLabel] = field;
      const isEnabled = fieldsState[fieldKey] || false;
      fieldsList.appendChild(createFieldItem(fieldKey, fieldLabel, isEnabled));
    }
  });

  availableFields.forEach(([key, label]) => {
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

  const form = document.getElementById('verification-report-form');

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

    const forVerifier = document.getElementById('for_verifier').value === 'true';
    const forAuditor = document.getElementById('for_auditor').value === 'true';

    const data = {
      name,
      fields_order: fieldsOrder,
      fields_state: fieldsState,
      for_verifier: forVerifier,
      for_auditor: forAuditor,
    };

    const isCreate = window.isCreate;
    const method = isCreate ? 'POST' : 'PUT';
    let url = `/companies/api/verification-reports/${isCreate ? 'create' : 'update'}?company_id=${window.companyId}`;
    if (!isCreate && window.verificationReportId) {
      url += `&verification_report_id=${window.verificationReportId}`;
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
        window.location.href = `/companies/verification-reports/?company_id=${window.companyId}`;
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

import { showErrorModal, parseErrorMessage } from '/static/company/_utils/modal.js';

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('ranges-container');
  const addBtn = document.getElementById('add-range');
  const hiddenRange = document.getElementById('measurement_range');
  const hiddenError = document.getElementById('error_or_uncertainty');
  const form = document.getElementById('equipment-form');
  const rangesWrapper = document.getElementById('rangesWrapper');

  function updateHidden() {
    const ranges = Array.from(container.querySelectorAll('input[name="measurement_range_item"]'))
      .map(inp => inp.value.trim()).filter(Boolean);
    const errors = Array.from(container.querySelectorAll('input[name="error_or_uncertainty_item"]'))
      .map(inp => inp.value.trim()).filter(Boolean);
    hiddenRange.value = ranges.join('|');
    hiddenError.value = errors.join('|');
  }

  addBtn.addEventListener('click', () => {
    const row = document.createElement('div');
    row.className = 'd-flex mb-2 range-row';
    row.innerHTML = `
      <input type="text" name="measurement_range_item" class="form-control input-text text-center me-2"
             placeholder="Диапазон (например: 0,1...10)">
      <input type="text" name="error_or_uncertainty_item" class="form-control input-text text-center me-2"
             placeholder="Погрешность (например: 1)">
      <button type="button" class="btn btn-outline-danger fw-bold remove-range" style="border-width: 3px;">✖</button>
    `;
    container.appendChild(row);
  });

  container.addEventListener('click', e => {
    if (e.target.classList.contains('remove-range')) {
      e.target.closest('.range-row').remove();
    }
  });

  function toggleFields() {
    const typeVal = document.getElementById('type').value;

    const listWrap = document.getElementById('listNumberWrapper');
    const listInput = document.getElementById('list_number');
    const needList = (typeVal === 'standard');
    listWrap.style.display = needList ? 'block' : 'none';
    listInput.required = needList;

    const regWrap = document.getElementById('registerNumberWrapper');
    const regInput = document.getElementById('register_number');
    const needReg = (typeVal === 'standard' || typeVal === 'measurement');
    regWrap.style.display = needReg ? 'block' : 'none';
    regInput.required = needReg;

    const optWrap = document.getElementById('isOptWrapper');
    optWrap.style.display = (typeVal === 'auxiliary') ? 'block' : 'none';

    if (rangesWrapper) {
      const needRanges = (typeVal === 'standard' || typeVal === 'measurement');
      rangesWrapper.style.display = needRanges ? 'block' : 'none';
      rangesWrapper.dataset.required = needRanges ? '1' : '0';
    }
  }

  document.getElementById('type').addEventListener('change', toggleFields);
  toggleFields();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    updateHidden();

    const isCreate = window.isCreate;
    const companyId = window.companyId;
    const method = isCreate ? 'POST' : 'PUT';
    const actionUrl = form.getAttribute('action');

    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = '⏳ Сохранение...';

    try {
      const formData = new FormData(form);
      const data = {};

      for (const [key, value] of formData.entries()) {
        if (key === 'image' || key === 'image2' || key === 'document_pdf' ||
            key === 'measurement_range_item' || key === 'error_or_uncertainty_item') {
          continue;
        }
        
        // Boolean поля
        if (key === 'is_optoschityvatel' || key === 'is_opt') {
          data[key] = value === 'true' || value === 'on';
        }
        // Integer поля - если пусто, отправляем null
        else if (['inventory_number', 'year_of_issue', 'commissioning_year', 'activity_id', 'si_type_id'].includes(key)) {
          data[key] = value && value.trim() !== '' ? parseInt(value) : null;
        }
        // Строковые поля - если пусто, отправляем пустую строку
        else {
          data[key] = value || '';
        }
      }

      async function fileToBase64(inputId) {
        const input = document.getElementById(inputId);
        if (!input || !input.files || !input.files[0]) {
          return null;
        }
        
        const file = input.files[0];
        
        const maxSize = inputId === 'document_pdf' ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
        if (file.size > maxSize) {
          throw new Error(`Размер файла ${inputId} не должен превышать ${maxSize / 1024 / 1024} МБ`);
        }
        
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      const [imageBase64, image2Base64, pdfBase64] = await Promise.all([
        fileToBase64('image'),
        fileToBase64('image2'),
        fileToBase64('document_pdf')
      ]);

      data.image = imageBase64;
      data.image2 = image2Base64;
      data.document_pdf = pdfBase64;

      const response = await fetch(actionUrl, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (response.status === 204) {
        window.location.href = `/companies/equipments?company_id=${companyId}`;
      } else if (response.status === 403) {
        showErrorModal('Недостаточно прав для выполнения действия.');
      } else if (response.status >= 400) {
        const errorMsg = await parseErrorMessage(response, 'Ошибка при сохранении оборудования');
        showErrorModal(errorMsg);
      }
    } catch (err) {
      showErrorModal('Ошибка: ' + err.message);
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = originalText;
    }
  });
});

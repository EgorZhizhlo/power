import { safeFetch } from '/static/company/_utils/safe_fetch.js';

const apiSiTypesList = `/companies/api/equipments/si-types?company_id=${window.companyId}`;
const apiSiTypesCreate = `/companies/api/equipments/si-types/si-type?company_id=${window.companyId}`;
const apiSiTypesUpdate = `/companies/api/equipments/si-types/si-type?company_id=${window.companyId}&si_type_id=:id`;
const apiSiTypesDelete = `/companies/api/equipments/si-types/si-type?company_id=${window.companyId}&si_type_id=:id`;

function highlightRow(selector) {
  setTimeout(() => {
    const row = document.querySelector(selector);
    if (row) {
      row.classList.add('bg-success-subtle');
      setTimeout(() => row.classList.remove('bg-success-subtle'), 2000);
    }
  }, 300);
}

async function loadSiTypes() {
  const res = await safeFetch(apiSiTypesList, {}, 'si_types_list');
  if (!res) return;

  const data = await res.json();
  const ul = document.getElementById('si-types-list');
  ul.innerHTML = '';

  data.forEach(t => {
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex justify-content-between align-items-center';
    li.dataset.id = t.id;
    li.innerHTML = `
      <span class="item-name flex-grow-1">${t.name}</span>
      <div class="btn-group">
        <button class="btn btn-sm btn-warning me-1" onclick="editSiType(${t.id}, '${t.name}')">✏️</button>
        <button class="btn btn-sm btn-danger" onclick="deleteSiType(${t.id})">🗑️</button>
      </div>`;
    ul.appendChild(li);
  });
}

async function createSiType() {
  const name = document.getElementById('new-si-type-name').value.trim();
  if (!name) return;

  const res = await safeFetch(apiSiTypesCreate, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  }, 'si_type_create');

  if (res?.ok) {
    document.getElementById('new-si-type-name').value = '';
    await loadSiTypes();
    highlightRow('#si-types-list li:last-child');
  } else {
    alert('Ошибка при создании типа СИ');
  }
}

window.editSiType = function (id, oldName) {
  const li = document.querySelector(`#si-types-list li[data-id="${id}"]`);
  const span = li.querySelector('.item-name');
  const btns = li.querySelector('.btn-group');

  span.outerHTML = `<input type="text" class="form-control form-control-sm edit-input" value="${oldName}">`;
  btns.innerHTML = `
    <button class="btn btn-sm btn-success me-1" onclick="saveSiType(${id})">✅</button>
    <button class="btn btn-sm btn-secondary" onclick="cancelEditSiType(${id}, '${oldName}')">❌</button>`;

  const input = li.querySelector('.edit-input');
  input.focus();
  input.setSelectionRange(input.value.length, input.value.length);

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') saveSiType(id);
    if (e.key === 'Escape') cancelEditSiType(id, oldName);
  });
};

window.saveSiType = async function (id) {
  const li = document.querySelector(`#si-types-list li[data-id="${id}"]`);
  const input = li.querySelector('.edit-input');
  const newName = input.value.trim();
  if (!newName) return alert('Название не может быть пустым');

  const res = await safeFetch(apiSiTypesUpdate.replace(':id', id), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: newName })
  }, 'si_type_update');

  if (res?.ok) {
    await loadSiTypes();
    highlightRow(`#si-types-list li[data-id="${id}"]`);
  } else {
    alert('Ошибка при сохранении');
  }
};

window.cancelEditSiType = function (id, oldName) {
  const li = document.querySelector(`#si-types-list li[data-id="${id}"]`);
  li.querySelector('.edit-input').outerHTML = `<span class="item-name flex-grow-1">${oldName}</span>`;
  li.querySelector('.btn-group').innerHTML = `
    <button class="btn btn-sm btn-warning me-1" onclick="editSiType(${id}, '${oldName}')">✏️</button>
    <button class="btn btn-sm btn-danger" onclick="deleteSiType(${id})">🗑️</button>`;
};

window.deleteSiType = async function (id) {
  if (!confirm('Удалить тип СИ?')) return;

  const res = await safeFetch(apiSiTypesDelete.replace(':id', id), { method: 'DELETE' }, 'si_type_delete');
  if (res?.ok) {
    await loadSiTypes();
  } else {
    alert('Ошибка при удалении');
  }
};

document.getElementById('siTypesModal').addEventListener('shown.bs.modal', loadSiTypes);
window.createSiType = createSiType;

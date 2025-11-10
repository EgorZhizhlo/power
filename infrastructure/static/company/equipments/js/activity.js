import { safeFetch } from '/static/company/_utils/safe_fetch.js';

const apiActivitiesList = `/companies/api/equipments/activities?company_id=${window.companyId}`;
const apiActivitiesCreate = `/companies/api/equipments/activities/activity?company_id=${window.companyId}`;
const apiActivitiesUpdate = `/companies/api/equipments/activities/activity?company_id=${window.companyId}&activity_id=:id`;
const apiActivitiesDelete = `/companies/api/equipments/activities/activity?company_id=${window.companyId}&activity_id=:id`;

function highlightRow(selector) {
  setTimeout(() => {
    const row = document.querySelector(selector);
    if (row) {
      row.classList.add('bg-success-subtle');
      setTimeout(() => row.classList.remove('bg-success-subtle'), 2000);
    }
  }, 300);
}

async function loadActivities() {
  const res = await safeFetch(apiActivitiesList, {}, 'activities_list');
  if (!res) return;

  const data = await res.json();
  const ul = document.getElementById('activities-list');
  ul.innerHTML = '';

  data.forEach(a => {
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex justify-content-between align-items-center';
    li.dataset.id = a.id;
    li.innerHTML = `
      <span class="item-name flex-grow-1">${a.name}</span>
      <div class="btn-group">
        <button class="btn btn-sm btn-warning me-1" onclick="editActivity(${a.id}, '${a.name}')">✏️</button>
        <button class="btn btn-sm btn-danger" onclick="deleteActivity(${a.id})">🗑️</button>
      </div>`;
    ul.appendChild(li);
  });
}

async function createActivity() {
  const name = document.getElementById('new-activity-name').value.trim();
  if (!name) return;

  const res = await safeFetch(apiActivitiesCreate, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  }, 'activity_create');

  if (res?.ok) {
    document.getElementById('new-activity-name').value = '';
    await loadActivities();
    highlightRow('#activities-list li:last-child');
  } else {
    alert('Ошибка при создании');
  }
}

window.editActivity = function (id, oldName) {
  const li = document.querySelector(`#activities-list li[data-id="${id}"]`);
  const span = li.querySelector('.item-name');
  const btns = li.querySelector('.btn-group');

  span.outerHTML = `<input type="text" class="form-control form-control-sm edit-input" value="${oldName}">`;
  btns.innerHTML = `
    <button class="btn btn-sm btn-success me-1" onclick="saveActivity(${id})">✅</button>
    <button class="btn btn-sm btn-secondary" onclick="cancelEditActivity(${id}, '${oldName}')">❌</button>`;

  const input = li.querySelector('.edit-input');
  input.focus();
  input.setSelectionRange(input.value.length, input.value.length);

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') saveActivity(id);
    if (e.key === 'Escape') cancelEditActivity(id, oldName);
  });
};

window.saveActivity = async function (id) {
  const li = document.querySelector(`#activities-list li[data-id="${id}"]`);
  const input = li.querySelector('.edit-input');
  const newName = input.value.trim();
  if (!newName) return alert('Название не может быть пустым');

  const res = await safeFetch(apiActivitiesUpdate.replace(':id', id), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: newName })
  }, 'activity_update');

  if (res?.ok) {
    await loadActivities();
    highlightRow(`#activities-list li[data-id="${id}"]`);
  } else {
    alert('Ошибка при сохранении');
  }
};

window.cancelEditActivity = function (id, oldName) {
  const li = document.querySelector(`#activities-list li[data-id="${id}"]`);
  li.querySelector('.edit-input').outerHTML = `<span class="item-name flex-grow-1">${oldName}</span>`;
  li.querySelector('.btn-group').innerHTML = `
    <button class="btn btn-sm btn-warning me-1" onclick="editActivity(${id}, '${oldName}')">✏️</button>
    <button class="btn btn-sm btn-danger" onclick="deleteActivity(${id})">🗑️</button>`;
};

window.deleteActivity = async function (id) {
  if (!confirm('Удалить вид измерений?')) return;

  const res = await safeFetch(apiActivitiesDelete.replace(':id', id), { method: 'DELETE' }, 'activity_delete');
  if (res?.ok) {
    await loadActivities();
  } else {
    alert('Ошибка при удалении');
  }
};

document.getElementById('activitiesModal').addEventListener('shown.bs.modal', loadActivities);
window.createActivity = createActivity;

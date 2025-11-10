import { safeFetch } from '/static/company/_utils/safe_fetch.js';

const apiUrl = `/companies/api/locations?company_id=${window.companyId}`;
const deleteUrlApi = `/companies/api/locations/delete?company_id=${window.companyId}&location_id=:id`;
const restoreUrlApi = `/companies/api/locations/restore?company_id=${window.companyId}&location_id=:id`;
const updateUrlTemplate = `/companies/locations/update?company_id=${window.companyId}&location_id=:id`;

let currentPage = 1, totalPages = 1;
const searchEl = document.getElementById('search-input');
const listEl = document.getElementById('locations-list');
const pagEl = document.getElementById('pagination');

searchEl.addEventListener('input', () => loadLocations(1));
document.addEventListener('DOMContentLoaded', () => loadLocations(1));

async function loadLocations(page = 1) {
  const search = (searchEl.value || '').trim();
  const url = `${apiUrl}&page=${page}&search=${encodeURIComponent(search)}`;

  const res = await safeFetch(url, {}, 'locations');
  if (!res) return;

  const text = await res.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch {}

  const { items = [], page: p = 1, total_pages = 1 } = data;
  currentPage = p;
  totalPages = total_pages;

  renderLocations(items);
  renderPaginationLocations();
}

function renderLocations(items) {
  listEl.innerHTML = '';
  if (!items.length) {
    const empty = document.createElement('div');
    empty.className = 'col-12';
    empty.innerHTML = '<div class="card p-4 text-center fw-bold">Нет данных</div>';
    listEl.append(empty);
    return;
  }
  items.forEach(l => listEl.append(cardLocations(l)));
}

function cardLocations(l) {
  const del = !!l.is_deleted;

  const col = document.createElement('div');
  col.className = 'col-xl-6 col-12 mb-4';

  const div = document.createElement('div');
  div.className = `card location-item p-4 h-100 d-flex flex-column${del ? ' deleted' : ''}`;

  const name = (l.name || '').charAt(0).toUpperCase() + (l.name || '').slice(1);

  const createdAt = l.created_at_strftime_full || '';
  const updatedAt = l.updated_at_strftime_full || '';

  const btns = del
    ? `<button class="btn btn-outline-success label-text fw-bold" style="border-width: 3px;"
                   onclick="restoreLocations(${l.id})">♻️ Восстановить</button>`
    : `<a class="btn btn-outline-warning label-text fw-bold" style="border-width: 3px;"
              href="${updateUrlTemplate.replace(':id', l.id)}">🔄 Редактировать</a>
           <button class="btn btn-outline-danger label-text fw-bold" style="border-width: 3px;"
                   onclick="deleteLocations(${l.id})">🗑️ Удалить</button>`;

  div.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h3 class="fs-lg m-0">${name}${del ? ' (удалено)' : ''}</h3>
    </div>
    <hr>
    <div class="fs-base flex-grow-1 location-text">
      ${createdAt ? `<p class="mb-2"><strong>Создано:</strong> ${createdAt}</p>` : ''}
      ${updatedAt ? `<p class="mb-0"><strong>Обновлено:</strong> ${updatedAt}</p>` : ''}
    </div>
    <div class="location-actions mt-3">${btns}</div>
  `;

  col.append(div);
  return col;
}

function renderPaginationLocations() {
  pagEl.innerHTML = '';
  const add = (text, page, disabled = false, active = false) => {
    const li = document.createElement('li');
    li.className = `page-item${disabled ? ' disabled' : ''}${active ? ' active' : ''}`;
    li.innerHTML = `<a class="page-link" href="#">${text}</a>`;
    if (!disabled)
      li.querySelector('a').addEventListener('click', e => {
        e.preventDefault();
        loadLocations(page);
      });
    return li;
  };

  if (currentPage > 1) {
    pagEl.append(add('««', 1));
    pagEl.append(add('«', currentPage - 1));
  }

  pagEl.append(add('1', 1, false, currentPage === 1));

  const s = Math.max(2, currentPage - 2),
        e = Math.min(totalPages - 1, currentPage + 2);

  if (s > 2) pagEl.append(ellipsisLocations());
  for (let p = s; p <= e; p++)
    pagEl.append(add(String(p), p, false, currentPage === p));
  if (e < totalPages - 1) pagEl.append(ellipsisLocations());
  if (totalPages > 1)
    pagEl.append(add(String(totalPages), totalPages, false, currentPage === totalPages));

  if (currentPage < totalPages) {
    pagEl.append(add('»', currentPage + 1));
    pagEl.append(add('»»', totalPages));
  }
}

function ellipsisLocations() {
  const li = document.createElement('li');
  li.className = 'page-item disabled';
  li.innerHTML = '<span class="page-link">…</span>';
  return li;
}

async function deleteLocations(id) {
  if (!confirm('Удалить расположение?')) return;
  const res = await safeFetch(deleteUrlApi.replace(':id', id), { method: 'DELETE' }, 'locations_action');
  if (!res) return;
  if (res.ok) loadLocations(currentPage);
  else alert(await msgLocations(res, 'Ошибка при удалении'));
}

async function restoreLocations(id) {
  if (!confirm('Восстановить расположение?')) return;
  const res = await safeFetch(restoreUrlApi.replace(':id', id), { method: 'POST' }, 'locations_action');
  if (!res) return;
  if (res.ok) loadLocations(currentPage);
  else alert(await msgLocations(res, 'Ошибка при восстановлении'));
}

async function msgLocations(res, fallback) {
  try {
    const text = await res.text();
    if (!text) return fallback;
    try {
      const j = JSON.parse(text);
      return j?.detail || fallback;
    } catch {
      return text;
    }
  } catch {
    return fallback;
  }
}

window.deleteLocations = deleteLocations;
window.restoreLocations = restoreLocations;

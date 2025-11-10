import { safeFetch } from '/static/company/_utils/safe_fetch.js';

const apiUrl = `/companies/api/cities?company_id=${window.companyId}`;
const deleteUrlApi = `/companies/api/cities/delete?company_id=${window.companyId}&city_id=:id`;
const restoreUrlApi = `/companies/api/cities/restore?company_id=${window.companyId}&city_id=:id`;
const updateUrlTemplate = `/companies/cities/update?company_id=${window.companyId}&city_id=:id`;

let currentPage = 1, totalPages = 1;
const searchInput = document.getElementById('search-input');
const listEl = document.getElementById('cities-list');
const pagEl = document.getElementById('pagination');

searchInput.addEventListener('input', () => loadCities(1, searchInput.value.trim()));
document.addEventListener('DOMContentLoaded', () => loadCities());

async function loadCities(page = 1, search = '') {
  const url = `${apiUrl}&page=${page}&search=${encodeURIComponent(search)}`;
  const res = await safeFetch(url, {}, 'cities');
  if (!res) return;

  let data = {};
  try { data = await res.json(); } catch {}

  const { items = [], page: p = 1, total_pages = 1 } = data;
  currentPage = p;
  totalPages = total_pages;

  renderCities(items);
  renderPagination();
}

function renderCities(items) {
  listEl.innerHTML = '';
  if (!items.length) {
    listEl.innerHTML = `
      <div class="col-12">
        <div class="card p-4 text-center fw-bold">Нет данных</div>
      </div>`;
    return;
  }
  items.forEach(c => listEl.append(card(c)));
}

function card(c) {
  const deleted = !!c.is_deleted;

  const col = document.createElement('div');
  col.className = 'col-xl-6 col-12 mb-4';

  const div = document.createElement('div');
  div.className = `card city-item p-4 h-100 d-flex flex-column${deleted ? ' deleted' : ''}`;
  div.dataset.name = (c.name || '').toLowerCase();

  const buttons = deleted
    ? `<div class="city-actions">
         <button class="btn btn-outline-success fw-bold" style="border-width: 3px;"
                 onclick="restoreCity(${c.id})">♻️ Восстановить</button>
       </div>`
    : `<div class="city-actions">
         <a class="btn btn-outline-warning fw-bold" style="border-width: 3px;"
            href="${updateUrlTemplate.replace(':id', c.id)}">🔄 Редактировать</a>
         <button class="btn btn-outline-danger fw-bold" style="border-width: 3px;"
                 onclick="deleteCity(${c.id})">🗑️ Удалить</button>
       </div>`;

  const createdAt = c.created_at_strftime_full || '';
  const updatedAt = c.updated_at_strftime_full || '';

  div.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h3 class="fs-lg m-0">${c.name || ''}${deleted ? ' (удалён)' : ''}</h3>
    </div>
    <hr>
    <div class="fs-base flex-grow-1 city-text">
      ${createdAt ? `<p><strong>Создан:</strong> ${createdAt}</p>` : ''}
      ${updatedAt ? `<p><strong>Обновлён:</strong> ${updatedAt}</p>` : ''}
    </div>
    ${buttons}
  `;

  col.append(div);
  return col;
}

function renderPagination() {
  pagEl.innerHTML = '';
  if (currentPage > 1) {
    pagEl.append(pageBtn('««', 1));
    pagEl.append(pageBtn('«', currentPage - 1));
  }
  pagEl.append(pageBtn('1', 1));

  const start = Math.max(2, currentPage - 2);
  const end = Math.min(totalPages - 1, currentPage + 2);

  if (start > 2) pagEl.append(ellipsis());
  for (let p = start; p <= end; p++) pagEl.append(pageBtn(p, p));
  if (end < totalPages - 1) pagEl.append(ellipsis());

  if (totalPages > 1) pagEl.append(pageBtn(totalPages, totalPages));
  if (currentPage < totalPages) {
    pagEl.append(pageBtn('»', currentPage + 1));
    pagEl.append(pageBtn('»»', totalPages));
  }
}

function pageBtn(text, page) {
  const li = document.createElement('li');
  li.className = `page-item${page === currentPage ? ' active' : ''}`;
  li.innerHTML = `<a class="page-link" href="#">${text}</a>`;
  li.querySelector('a').addEventListener('click', e => {
    e.preventDefault();
    loadCities(page, searchInput.value.trim());
  });
  return li;
}

const ellipsis = () => {
  const li = document.createElement('li');
  li.className = 'page-item disabled';
  li.innerHTML = '<span class="page-link">…</span>';
  return li;
};

async function deleteCity(id) {
  if (!confirm('Удалить населённый пункт?')) return;
  const res = await safeFetch(deleteUrlApi.replace(':id', id), { method: 'DELETE' }, 'city_action');
  if (!res) return;
  if (res.ok) loadCities(currentPage, searchInput.value.trim());
  else alert(await safeMsg(res, 'Ошибка при удалении'));
}

async function restoreCity(id) {
  if (!confirm('Восстановить населённый пункт?')) return;
  const res = await safeFetch(restoreUrlApi.replace(':id', id), { method: 'POST' }, 'city_action');
  if (!res) return;
  if (res.ok) loadCities(currentPage, searchInput.value.trim());
  else alert(await safeMsg(res, 'Ошибка при восстановлении'));
}

async function safeMsg(res, fallback) {
  try {
    const t = await res.text();
    if (!t) return fallback;
    try {
      const j = JSON.parse(t);
      return j?.detail || fallback;
    } catch {
      return t;
    }
  } catch {
    return fallback;
  }
}

window.deleteCity = deleteCity;
window.restoreCity = restoreCity;

import { safeFetch } from '/static/company/_utils/safe_fetch.js';

const apiUrl = `/companies/api/act-series?company_id=${window.companyId}`;
const deleteUrlApi = `/companies/api/act-series/delete?company_id=${window.companyId}&act_series_id=:id`;
const restoreUrlApi = `/companies/api/act-series/restore?company_id=${window.companyId}&act_series_id=:id`;
const updateUrlTemplate = `/companies/act-series/update?company_id=${window.companyId}&act_series_id=:id`;
const createUrlTemplate = `/companies/act-series/create?company_id=${window.companyId}`;

let currentPage = 1, totalPages = 1;
const searchInput = document.getElementById('search-input');
const listEl = document.getElementById('series-list');
const pagEl = document.getElementById('pagination');
const createBtn = document.getElementById('create-btn');

createBtn.href = createUrlTemplate;
searchInput.addEventListener('input', () => loadSeries(1, searchInput.value.trim()));
document.addEventListener('DOMContentLoaded', () => loadSeries());

async function loadSeries(page = 1, search = '') {
  const url = `${apiUrl}&page=${page}&search=${encodeURIComponent(search)}`;
  const res = await safeFetch(url, {}, 'act_series');
  if (!res) return;

  const text = await res.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch {}

  const { items = [], page: p = 1, total_pages = 1 } = data;
  currentPage = p;
  totalPages = total_pages;

  renderSeries(items);
  renderPagination();
}

function renderSeries(items) {
  listEl.innerHTML = '';
  if (!items.length) {
    const empty = document.createElement('div');
    empty.className = 'col-12';
    empty.innerHTML = '<div class="card p-4 text-center">Нет данных</div>';
    listEl.append(empty);
    return;
  }
  items.forEach(s => listEl.append(card(s)));
}

function card(s) {
  const col = document.createElement('div');
  col.className = 'col-xl-6 col-12 mb-4';

  const del = !!s.is_deleted;
  const div = document.createElement('div');
  div.className = `card series-item p-4 h-100 d-flex flex-column${del ? ' deleted' : ''}`;
  div.dataset.name = (s.name || '').toLowerCase();

  const buttons = del
    ? `<div class="series-actions">
        <button class="btn btn-outline-success fw-bold" style="border-width:3px;"
                onclick="restoreSeries(${s.id})">♻️ Восстановить</button>
      </div>`
    : `<div class="series-actions">
        <a class="btn btn-outline-warning fw-bold" style="border-width:3px;"
           href="${updateUrlTemplate.replace(':id', s.id)}">🔄 Редактировать</a>
        <button class="btn btn-outline-danger fw-bold" style="border-width:3px;"
                onclick="deleteSeries(${s.id})">🗑️ Удалить</button>
      </div>`;

  const createdAt = s.created_at_strftime_full || '';
  const updatedAt = s.updated_at_strftime_full || '';

  div.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h3 class="fs-lg m-0">${escapeHtml(s.name || '')}${del ? ' (удалена)' : ''}</h3>
    </div>
    <hr>
    <div class="fs-base flex-grow-1 series-text">
      ${createdAt ? `<p><strong>Создана:</strong> ${createdAt}</p>` : ''}
      ${updatedAt ? `<p><strong>Обновлена:</strong> ${updatedAt}</p>` : ''}
    </div>
    ${buttons}
  `;

  col.append(div);
  return col;
}

function renderPagination() {
  pagEl.innerHTML = '';
  if (currentPage > 1) {
    pagEl.append(pageItem('««', 1));
    pagEl.append(pageItem('«', currentPage - 1));
  }
  pagEl.append(pageItem('1', 1, currentPage === 1));

  const start = Math.max(2, currentPage - 2);
  const end = Math.min(totalPages - 1, currentPage + 2);
  if (start > 2) pagEl.append(ellipsisItem());
  for (let p = start; p <= end; p++) pagEl.append(pageItem(p, p, currentPage === p));
  if (end < totalPages - 1) pagEl.append(ellipsisItem());
  if (totalPages > 1) pagEl.append(pageItem(totalPages, totalPages, currentPage === totalPages));

  if (currentPage < totalPages) {
    pagEl.append(pageItem('»', currentPage + 1));
    pagEl.append(pageItem('»»', totalPages));
  }
}

function pageItem(text, page, active = false) {
  const li = document.createElement('li');
  li.className = `page-item${active ? ' active' : ''}`;
  const a = document.createElement('a');
  a.className = 'page-link';
  a.href = '#';
  a.textContent = text;
  a.addEventListener('click', e => {
    e.preventDefault();
    loadSeries(page, searchInput.value.trim());
  });
  li.append(a);
  return li;
}

function ellipsisItem() {
  const li = document.createElement('li');
  li.className = 'page-item disabled';
  li.innerHTML = '<span class="page-link">…</span>';
  return li;
}

async function deleteSeries(id) {
  if (!confirm('Удалить серию акта?')) return;
  const res = await safeFetch(deleteUrlApi.replace(':id', id), { method: 'DELETE' }, 'act_series_action');
  if (!res) return;
  if (res.ok) loadSeries(currentPage, searchInput.value.trim());
  else alert(await safeErrorMessage(res, 'Ошибка при удалении'));
}

async function restoreSeries(id) {
  if (!confirm('Восстановить серию акта?')) return;
  const res = await safeFetch(restoreUrlApi.replace(':id', id), { method: 'POST' }, 'act_series_action');
  if (!res) return;
  if (res.ok) loadSeries(currentPage, searchInput.value.trim());
  else alert(await safeErrorMessage(res, 'Ошибка при восстановлении'));
}

async function safeErrorMessage(res, fallback) {
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

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

window.deleteSeries = deleteSeries;
window.restoreSeries = restoreSeries;

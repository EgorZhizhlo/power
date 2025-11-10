import { safeFetch } from '/static/company/_utils/safe_fetch.js';

const apiUrl = `/companies/api/methods?company_id=${window.companyId}`;
const deleteUrlApi = `/companies/api/methods/delete?company_id=${window.companyId}&method_id=:id`;
const restoreUrlApi = `/companies/api/methods/restore?company_id=${window.companyId}&method_id=:id`;
const updateUrlTemplate = `/companies/methods/update?company_id=${window.companyId}&method_id=:id`;

let currentPage = 1, totalPages = 1;
const searchEl = document.getElementById('search-input');
const listEl = document.getElementById('methods-list');
const pagEl = document.getElementById('pagination');

searchEl.addEventListener('input', () => loadMethods(1));
document.addEventListener('DOMContentLoaded', () => loadMethods(1));

async function loadMethods(page = 1) {
  const search = (searchEl.value || '').trim();
  const url = `${apiUrl}&page=${page}&search=${encodeURIComponent(search)}`;

  const res = await safeFetch(url, {}, 'methods');
  if (!res) return;

  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {}

  const { items = [], page: p = 1, total_pages = 1 } = data;
  currentPage = p;
  totalPages = total_pages;

  renderMethods(items);
  renderPaginationMethods();
}

function renderMethods(items) {
  listEl.innerHTML = '';
  if (!items.length) {
    const empty = document.createElement('div');
    empty.className = 'col-12';
    empty.innerHTML = '<div class="card p-4 text-center fw-bold">Нет данных</div>';
    listEl.append(empty);
    return;
  }
  items.forEach(m => listEl.append(cardMethods(m)));
}

function safeText(v) {
  return (v ?? '').toString().trim();
}

function cardMethods(m) {
  const del = !!m.is_deleted;

  const col = document.createElement('div');
  col.className = 'col-xl-6 col-12 mb-4';

  const div = document.createElement('div');
  div.className = `card method-item p-4 h-100 d-flex flex-column${del ? ' deleted' : ''}`;

  const name = safeText(m.name) || '(без названия)';
  const createdAt = m.created_at_strftime_full || '';
  const updatedAt = m.updated_at_strftime_full || '';

  const btns = del
    ? `<button class="btn btn-outline-success label-text fw-bold" style="border-width: 3px;"
                   onclick="restoreMethods(${m.id})">♻️ Восстановить</button>`
    : `<a class="btn btn-outline-warning label-text fw-bold" style="border-width: 3px;"
              href="${updateUrlTemplate.replace(':id', m.id)}">🔄 Редактировать</a>
           <button class="btn btn-outline-danger label-text fw-bold" style="border-width: 3px;"
                   onclick="deleteMethods(${m.id})">🗑️ Удалить</button>`;

  div.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h3 class="fs-lg m-0">${name}${del ? ' (удалена)' : ''}</h3>
    </div>
    <hr>
    <div class="fs-base flex-grow-1 method-text">
      ${createdAt ? `<p><strong>Создана:</strong> ${createdAt}</p>` : ''}
      ${updatedAt ? `<p><strong>Обновлена:</strong> ${updatedAt}</p>` : ''}
    </div>
    <div class="method-actions mt-3">${btns}</div>
  `;

  col.append(div);
  return col;
}

function renderPaginationMethods() {
  pagEl.innerHTML = '';
  const add = (text, page, disabled = false, active = false) => {
    const li = document.createElement('li');
    li.className = `page-item${disabled ? ' disabled' : ''}${active ? ' active' : ''}`;
    li.innerHTML = `<a class="page-link" href="#">${text}</a>`;
    if (!disabled)
      li.querySelector('a').addEventListener('click', e => {
        e.preventDefault();
        loadMethods(page);
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

  if (s > 2) pagEl.append(ellipsisMethods());
  for (let p = s; p <= e; p++)
    pagEl.append(add(String(p), p, false, currentPage === p));
  if (e < totalPages - 1) pagEl.append(ellipsisMethods());
  if (totalPages > 1)
    pagEl.append(add(String(totalPages), totalPages, false, currentPage === totalPages));

  if (currentPage < totalPages) {
    pagEl.append(add('»', currentPage + 1));
    pagEl.append(add('»»', totalPages));
  }
}

function ellipsisMethods() {
  const li = document.createElement('li');
  li.className = 'page-item disabled';
  li.innerHTML = '<span class="page-link">…</span>';
  return li;
}

async function deleteMethods(id) {
  if (!confirm('Удалить методику?')) return;
  const res = await safeFetch(deleteUrlApi.replace(':id', id), { method: 'DELETE' }, 'method_action');
  if (!res) return;
  if (res.ok) loadMethods(currentPage);
  else alert(await msgMethods(res, 'Ошибка при удалении'));
}

async function restoreMethods(id) {
  if (!confirm('Восстановить методику?')) return;
  const res = await safeFetch(restoreUrlApi.replace(':id', id), { method: 'POST' }, 'method_action');
  if (!res) return;
  if (res.ok) loadMethods(currentPage);
  else alert(await msgMethods(res, 'Ошибка при восстановлении'));
}

async function msgMethods(res, fallback) {
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

window.deleteMethods = deleteMethods;
window.restoreMethods = restoreMethods;

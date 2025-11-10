import { safeFetch } from '/static/company/_utils/safe_fetch.js';

const apiUrl = `/companies/api/reasons?company_id=${window.companyId}`;
const deleteUrlApi = `/companies/api/reasons/delete?company_id=${window.companyId}&reason_id=:id`;
const restoreUrlApi = `/companies/api/reasons/restore?company_id=${window.companyId}&reason_id=:id`;
const updateUrlTemplate = `/companies/reasons/update?company_id=${window.companyId}&reason_id=:id`;

let currentPage = 1, totalPages = 1;
const searchEl = document.getElementById('search-input');
const listEl = document.getElementById('reasons-list');
const pagEl = document.getElementById('pagination');

searchEl.addEventListener('input', () => loadReasons(1));
document.addEventListener('DOMContentLoaded', () => loadReasons(1));

async function loadReasons(page = 1) {
  const search = (searchEl.value || '').trim();
  const url = `${apiUrl}&page=${page}&search=${encodeURIComponent(search)}`;

  const res = await safeFetch(url, {}, 'reasons');
  if (!res) return;

  const text = await res.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch {}

  const { items = [], page: p = 1, total_pages = 1 } = data;
  currentPage = p;
  totalPages = total_pages;

  renderReasons(items);
  renderPaginationReasons();
}

function renderReasons(items) {
  listEl.innerHTML = '';
  if (!items.length) {
    const empty = document.createElement('div');
    empty.className = 'col-12';
    empty.innerHTML = '<div class="card p-4 text-center fw-bold">Нет данных</div>';
    listEl.append(empty);
    return;
  }
  items.forEach(r => listEl.append(cardReasons(r)));
}

function safe(v) { return (v ?? '').toString().trim(); }

function cardReasons(r) {
  const del = !!r.is_deleted;
  const typeMap = {
    'p_2_7_1': 'П 2.7.1',
    'p_2_7_2': 'П 2.7.2',
    'p_2_7_3': 'П 2.7.3'
  };

  const col = document.createElement('div');
  col.className = 'col-xl-6 col-12 mb-4';

  const div = document.createElement('div');
  div.className = `card reason-item p-4 h-100 d-flex flex-column${del ? ' deleted' : ''}`;

  const name = safe(r.name) || '(без названия)';
  const fullName = safe(r.full_name);
  const typeName = typeMap[r.type];
  const createdAt = r.created_at_strftime_full || '';
  const updatedAt = r.updated_at_strftime_full || '';

  const btns = del
    ? `<button class="btn btn-outline-success label-text fw-bold" style="border-width: 3px;"
                   onclick="restoreReasons(${r.id})">♻️ Восстановить</button>`
    : `<a class="btn btn-outline-warning label-text fw-bold" style="border-width: 3px;"
              href="${updateUrlTemplate.replace(':id', r.id)}">🔄 Редактировать</a>
           <button class="btn btn-outline-danger label-text fw-bold" style="border-width: 3px;"
                   onclick="deleteReasons(${r.id})">🗑️ Удалить</button>`;

  div.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h3 class="fs-lg m-0">${name}${del ? ' (удалена)' : ''}</h3>
    </div>
    <hr>
    <div class="fs-base flex-grow-1 reason-text">
      ${createdAt ? `<p><strong>Создана:</strong> ${createdAt}</p>` : ''}
      ${updatedAt ? `<p><strong>Обновлена:</strong> ${updatedAt}</p>` : ''}
      ${typeName ? `<p><strong>Тип:</strong> ${typeName}</p>` : ''}
      ${fullName ? `<p><strong>Полное название:</strong> ${fullName}</p>` : ''}
    </div>
    <div class="reason-actions mt-3">${btns}</div>
  `;

  col.append(div);
  return col;
}

function renderPaginationReasons() {
  pagEl.innerHTML = '';
  const add = (text, page, disabled = false, active = false) => {
    const li = document.createElement('li');
    li.className = `page-item${disabled ? ' disabled' : ''}${active ? ' active' : ''}`;
    li.innerHTML = `<a class="page-link" href="#">${text}</a>`;
    if (!disabled)
      li.querySelector('a').addEventListener('click', e => {
        e.preventDefault();
        loadReasons(page);
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
  if (s > 2) pagEl.append(ellipsisReasons());
  for (let p = s; p <= e; p++)
    pagEl.append(add(String(p), p, false, currentPage === p));
  if (e < totalPages - 1) pagEl.append(ellipsisReasons());
  if (totalPages > 1)
    pagEl.append(add(String(totalPages), totalPages, false, currentPage === totalPages));
  if (currentPage < totalPages) {
    pagEl.append(add('»', currentPage + 1));
    pagEl.append(add('»»', totalPages));
  }
}

function ellipsisReasons() {
  const li = document.createElement('li');
  li.className = 'page-item disabled';
  li.innerHTML = '<span class="page-link">…</span>';
  return li;
}

async function deleteReasons(id) {
  if (!confirm('Удалить причину?')) return;
  const res = await safeFetch(deleteUrlApi.replace(':id', id), { method: 'DELETE' }, 'reasons_action');
  if (!res) return;
  if (res.ok) loadReasons(currentPage);
  else alert(await msgReasons(res, 'Ошибка при удалении'));
}

async function restoreReasons(id) {
  if (!confirm('Восстановить причину?')) return;
  const res = await safeFetch(restoreUrlApi.replace(':id', id), { method: 'POST' }, 'reasons_action');
  if (!res) return;
  if (res.ok) loadReasons(currentPage);
  else alert(await msgReasons(res, 'Ошибка при восстановлении'));
}

async function msgReasons(res, fallback) {
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

window.deleteReasons = deleteReasons;
window.restoreReasons = restoreReasons;

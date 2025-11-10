import { safeFetch } from '/static/company/_utils/safe_fetch.js';

const apiUrl = `/companies/api/registry-numbers?company_id=${window.companyId}`;
const deleteUrlApi = `/companies/api/registry-numbers/delete?company_id=${window.companyId}&registry_number_id=:id`;
const restoreUrlApi = `/companies/api/registry-numbers/restore?company_id=${window.companyId}&registry_number_id=:id`;
const updateUrlTemplate = `/companies/registry-numbers/update?company_id=${window.companyId}&registry_number_id=:id`;

let currentPage = 1, totalPages = 1;
const searchEl = document.getElementById('search-input');
const listEl = document.getElementById('registry-list');
const pagEl = document.getElementById('pagination');

const debounce = (fn, d = 350) => {
  let t;
  return (...a) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...a), d);
  };
};

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getFirst(...vals) {
  for (const v of vals) if (v !== undefined && v !== null && v !== '') return v;
  return '';
}

async function msgRegistryNumbers(res, fallback) {
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

async function loadRegistryNumbers(page = 1) {
  const q = (searchEl.value || '').trim();
  const qs = new URLSearchParams({ page, ...(q ? { search: q } : {}) }).toString();

  const res = await safeFetch(`${apiUrl}&${qs}`, {}, 'registry_numbers');
  if (!res) return;

  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {}

  const { items = [], page: p = 1, total_pages = 1 } = data;
  currentPage = p;
  totalPages = total_pages;

  renderRegistryNumbers(items);
  renderPaginationRegistryNumbers();
}

function renderRegistryNumbers(items) {
  listEl.innerHTML = '';
  if (!items.length) {
    const empty = document.createElement('div');
    empty.className = 'col-12';
    empty.innerHTML = '<div class="card p-4 text-center fw-bold">Нет данных</div>';
    listEl.append(empty);
    return;
  }
  items.forEach(r => listEl.append(cardRegistryNumbers(r)));
}

function cardRegistryNumbers(r) {
  const del = !!r.is_deleted;

  const col = document.createElement('div');
  col.className = 'col-xl-6 col-12 mb-4';

  const wrap = document.createElement('div');
  wrap.className = `card registry-item p-4 h-100 d-flex flex-column${del ? ' deleted' : ''}`;

  const btns = del
    ? `<button class="btn btn-outline-success label-text fw-bold" style="border-width: 3px;"
                   onclick="restoreRegistryNumbers(${r.id})">♻️ Восстановить</button>`
    : `<a class="btn btn-outline-warning label-text fw-bold" style="border-width: 3px;"
              href="${updateUrlTemplate.replace(':id', r.id)}">🔄 Редактировать</a>
           <button class="btn btn-outline-danger label-text fw-bold" style="border-width: 3px;"
                   onclick="deleteRegistryNumbers(${r.id})">🗑️ Удалить</button>`;

  const mods = (r.modifications || [])
    .map(m => escapeHtml(m.modification_name))
    .join(', ') || '—';

  const createdAt = r.created_at_strftime_full || '';
  const updatedAt = r.updated_at_strftime_full || '';

  wrap.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h3 class="fs-lg m-0">${escapeHtml(r.registry_number)}${del ? ' (удалён)' : ''}</h3>
    </div>
    <hr>
    <div class="fs-base flex-grow-1 registry-text">
      ${createdAt ? `<p><strong>Создан:</strong> ${createdAt}</p>` : ''}
      ${updatedAt ? `<p><strong>Обновлён:</strong> ${updatedAt}</p>` : ''}
      <p class="mb-1"><strong>Тип СИ:</strong> ${escapeHtml(getFirst(r.si_type, '—'))}</p>
      <p class="mb-1"><strong>МПИ:</strong> горячий — ${escapeHtml(getFirst(r.mpi_hot, '—'))}, холодный — ${escapeHtml(getFirst(r.mpi_cold, '—'))}</p>
      <p class="mb-1"><strong>Методика:</strong> ${escapeHtml(getFirst(r.method?.name, '—'))}</p>
      <p class="mb-0"><strong>Модификации:</strong> ${mods}</p>
    </div>
    <div class="registry-actions mt-3">${btns}</div>
  `;

  col.append(wrap);
  return col;
}

function renderPaginationRegistryNumbers() {
  pagEl.innerHTML = '';
  const add = (text, page, disabled = false, active = false) => {
    const li = document.createElement('li');
    li.className = `page-item${disabled ? ' disabled' : ''}${active ? ' active' : ''}`;
    li.innerHTML = `<a class="page-link" href="#">${text}</a>`;
    if (!disabled)
      li.querySelector('a').addEventListener('click', e => {
        e.preventDefault();
        loadRegistryNumbers(page);
      });
    return li;
  };
  if (currentPage > 1) {
    pagEl.append(add('««', 1));
    pagEl.append(add('«', currentPage - 1));
  }
  pagEl.append(add('1', 1, false, currentPage === 1));
  const s = Math.max(2, currentPage - 2), e = Math.min(totalPages - 1, currentPage + 2);
  if (s > 2) pagEl.append(ellipsisRegistryNumbers());
  for (let p = s; p <= e; p++) pagEl.append(add(String(p), p, false, currentPage === p));
  if (e < totalPages - 1) pagEl.append(ellipsisRegistryNumbers());
  if (totalPages > 1)
    pagEl.append(add(String(totalPages), totalPages, false, currentPage === totalPages));
  if (currentPage < totalPages) {
    pagEl.append(add('»', currentPage + 1));
    pagEl.append(add('»»', totalPages));
  }
}

function ellipsisRegistryNumbers() {
  const li = document.createElement('li');
  li.className = 'page-item disabled';
  li.innerHTML = '<span class="page-link">…</span>';
  return li;
}

async function deleteRegistryNumbers(id) {
  if (!confirm('Удалить номер?')) return;
  const res = await safeFetch(deleteUrlApi.replace(':id', id), { method: 'DELETE' }, 'registry_action');
  if (!res) return;
  if (res.ok) loadRegistryNumbers(currentPage);
  else alert(await msgRegistryNumbers(res, 'Ошибка при удалении'));
}

async function restoreRegistryNumbers(id) {
  if (!confirm('Восстановить номер?')) return;
  const res = await safeFetch(restoreUrlApi.replace(':id', id), { method: 'POST' }, 'registry_action');
  if (!res) return;
  if (res.ok) loadRegistryNumbers(currentPage);
  else alert(await msgRegistryNumbers(res, 'Ошибка при восстановлении'));
}

const doSearch = debounce(() => loadRegistryNumbers(1), 350);
searchEl.addEventListener('input', doSearch);
document.addEventListener('DOMContentLoaded', () => loadRegistryNumbers(1));

window.deleteRegistryNumbers = deleteRegistryNumbers;
window.restoreRegistryNumbers = restoreRegistryNumbers;

import { safeFetch } from '/static/company/_utils/safe_fetch.js';

const apiUrl = `/companies/api/routes?company_id=${window.companyId}`;
const deleteUrlApi = `/companies/api/routes/delete?company_id=${window.companyId}&route_id=:id`;
const restoreUrlApi = `/companies/api/routes/restore?company_id=${window.companyId}&route_id=:id`;
const updateUrlTemplate = `/companies/routes/update?company_id=${window.companyId}&route_id=:id`;

const listEl = document.getElementById('routes-list');
const pagEl = document.getElementById('pagination');
const searchEl = document.getElementById('search-input');

let currentPage = 1, totalPages = 1;

const debounce = (fn, d = 350) => {
  let t;
  return (...a) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...a), d);
  };
};

function getParams(page = 1) {
  const p = { page };
  const q = (searchEl.value || '').trim();
  if (q) p.search = q;
  return p;
}

async function loadRoutes(page = 1) {
  const qs = new URLSearchParams(getParams(page)).toString();

  const res = await safeFetch(`${apiUrl}&${qs}`, {}, 'routes');
  if (!res) return;

  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {}

  const { items = [], page: p = 1, total_pages = 1 } = data;
  currentPage = p;
  totalPages = total_pages;

  renderRoutes(items);
  renderPaginationRoutes();
}

function renderRoutes(items) {
  listEl.innerHTML = '';
  if (!items.length) {
    const empty = document.createElement('div');
    empty.className = 'col-12';
    empty.innerHTML = '<div class="card p-4 text-center fw-bold">Нет данных</div>';
    listEl.append(empty);
    return;
  }
  items.forEach(r => listEl.append(cardRoutes(r)));
}

function cardRoutes(r) {
  const del = !!r.is_deleted;

  const col = document.createElement('div');
  col.className = 'col-xl-6 col-12 mb-4';

  const el = document.createElement('div');
  el.className = `card route-item p-4 h-100 d-flex flex-column${del ? ' deleted' : ''}`;

  const btns = del
    ? `<button class="btn btn-outline-success label-text fw-bold" style="border-width: 3px;"
                   onclick="restoreRoutes(${r.id}, '${escapeHtml(r.name)}')">♻️ Восстановить</button>`
    : `<a class="btn btn-outline-warning label-text fw-bold" style="border-width: 3px;"
              href="${updateUrlTemplate.replace(':id', r.id)}">🔄 Редактировать</a>
           <button class="btn btn-outline-danger label-text fw-bold" style="border-width: 3px;"
                   onclick="deleteRoutes(${r.id}, '${escapeHtml(r.name)}')">🗑️ Удалить</button>`;

  const color = (r.color || '').replace(/^#/, '');
  const createdAt = r.created_at_strftime_full || '';
  const updatedAt = r.updated_at_strftime_full || '';

  el.innerHTML = `
    <div class="container-fluid px-0 fs-base mb-3">
      <div class="row">
        <div class="col-md-6 mb-2">
          ${createdAt ? `<p class="mb-2"><strong>Создан:</strong> ${createdAt}</p>` : ''}
          ${updatedAt ? `<p class="mb-0"><strong>Обновлён:</strong> ${updatedAt}</p>` : ''}
        </div>
        <div class="col-md-6 mb-2 d-flex flex-column align-items-md-end align-items-start gap-2">
          <p class="mb-0"><strong>Лимит в день:</strong> ${r.day_limit}</p>
          <div class="color-dot" style="background:#${color};"></div>
        </div>
      </div>
    </div>
    <div class="route-actions mt-auto">${btns}</div>
  `;

  col.append(el);
  return col;
}

function renderPaginationRoutes() {
  pagEl.innerHTML = '';
  const add = (text, page, disabled = false, active = false) => {
    const li = document.createElement('li');
    li.className = `page-item${disabled ? ' disabled' : ''}${active ? ' active' : ''}`;
    li.innerHTML = `<a class="page-link" href="#">${text}</a>`;
    if (!disabled) li.querySelector('a').addEventListener('click', e => {
      e.preventDefault();
      loadRoutes(page);
    });
    return li;
  };
  if (currentPage > 1) {
    pagEl.append(add('««', 1));
    pagEl.append(add('«', currentPage - 1));
  }
  pagEl.append(add('1', 1, false, currentPage === 1));
  const s = Math.max(2, currentPage - 2), e = Math.min(totalPages - 1, currentPage + 2);
  if (s > 2) pagEl.append(ellipsisRoutes());
  for (let p = s; p <= e; p++) pagEl.append(add(String(p), p, false, currentPage === p));
  if (e < totalPages - 1) pagEl.append(ellipsisRoutes());
  if (totalPages > 1) pagEl.append(add(String(totalPages), totalPages, false, currentPage === totalPages));
  if (currentPage < totalPages) {
    pagEl.append(add('»', currentPage + 1));
    pagEl.append(add('»»', totalPages));
  }
}

function ellipsisRoutes() {
  const li = document.createElement('li');
  li.className = 'page-item disabled';
  li.innerHTML = '<span class="page-link">…</span>';
  return li;
}

async function deleteRoutes(id, name) {
  if (!confirm(`Удалить маршрут "${name}"?`)) return;
  const res = await safeFetch(deleteUrlApi.replace(':id', id), { method: 'DELETE' }, 'route_action');
  if (!res) return;
  if (res.ok) loadRoutes(currentPage);
  else alert(await msgRoutes(res, 'Ошибка при удалении маршрута'));
}

async function restoreRoutes(id, name) {
  if (!confirm(`Восстановить маршрут "${name}"?`)) return;
  const res = await safeFetch(restoreUrlApi.replace(':id', id), { method: 'POST' }, 'route_action');
  if (!res) return;
  if (res.ok) loadRoutes(currentPage);
  else alert(await msgRoutes(res, 'Ошибка при восстановлении маршрута'));
}

async function msgRoutes(res, fallback) {
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
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const doSearch = debounce(() => loadRoutes(1), 350);
searchEl.addEventListener('input', doSearch);
document.addEventListener('DOMContentLoaded', () => loadRoutes(1));

window.deleteRoutes = deleteRoutes;
window.restoreRoutes = restoreRoutes;

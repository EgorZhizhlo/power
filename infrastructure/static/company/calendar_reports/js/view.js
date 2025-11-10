import { safeFetch } from '/static/company/_utils/safe_fetch.js';

const apiUrl = `/companies/api/calendar-reports?company_id=${window.companyId}`;
const deleteUrlApi = `/companies/api/calendar-reports/delete?company_id=${window.companyId}&calendar_report_id=:id`;
const updateUrlTemplate = `/companies/calendar-reports/update?company_id=${window.companyId}&calendar_report_id=:id`;

const listEl = document.getElementById('reports-list');
const pagEl = document.getElementById('pagination');
const searchEl = document.getElementById('search-input');

let currentPage = 1, totalPages = 1;
const debounce = (fn, d = 350) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), d); }; };

async function loadReports(page = 1) {
  const q = (searchEl.value || '').trim();
  const url = `${apiUrl}&page=${page}${q ? `&search=${encodeURIComponent(q)}` : ''}`;

  const res = await safeFetch(url, {}, 'calendar_reports');
  if (!res) return;

  const text = await res.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch {}

  const { items = [], page: p = 1, total_pages = 1 } = data;
  currentPage = p;
  totalPages = total_pages;

  renderList(items);
  renderPagination();
}

function renderList(items) {
  listEl.innerHTML = '';
  if (!items.length) {
    const emptyCol = document.createElement('div');
    emptyCol.className = 'col-12';
    emptyCol.innerHTML = `
      <div class="card p-4 text-center">
        <h2 class="fs-lg">Ничего не найдено</h2>
        <p class="fs-base">Измените запрос поиска.</p>
      </div>`;
    listEl.append(emptyCol);
    return;
  }
  items.forEach(r => listEl.append(card(r)));
}

function card(r) {
  const col = document.createElement('div');
  col.className = 'col-xl-6 col-12 mb-4';

  const wrap = document.createElement('div');
  wrap.className = 'card report-item p-4 h-100 d-flex flex-column';

  const yesNo = v => v ? 'Да' : 'Нет';
  const escapeHtml = s => String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const val = v => {
    if (typeof v === 'boolean') return yesNo(v);
    if (v === null || v === undefined || (typeof v === 'string' && v.trim() === '')) return '—';
    return escapeHtml(v);
  };

  const btns = `
    <a class="btn btn-outline-warning fw-bold label-text" style="border-width: 3px;"
       href="${updateUrlTemplate.replace(':id', r.id)}">🔄 Редактировать</a>
    <button class="btn btn-outline-danger fw-bold label-text" style="border-width: 3px;"
            onclick="deleteReport(${r.id}, '${escapeHtml(r.name || '')}')">🗑️ Удалить</button>`;

  const createdAt = r.created_at_strftime_full || '';
  const updatedAt = r.updated_at_strftime_full || '';

  const FIELD_LABELS = {
    'dispatcher': 'Создатель заявки',
    'route': 'Маршрут',
    'date': 'Дата',
    'address': 'Адрес',
    'phone_number': 'Телефон',
    'sec_phone_number': 'Доп. телефон',
    'client_full_name': 'ФИО клиента',
    'legal_entity': 'Юр. статус',
    'counter_number': '№ счётчика',
    'water_type': 'Тип воды',
    'price': 'Цена',
    'status': 'Статус заявки',
    'additional_info': 'Доп. информация',
    'deleted_at': 'Время удаления',
  };

  const additionalParams = [
    ['for_auditor', 'Доступен ревизору'],
    ['for_dispatcher1', 'Доступен диспетчеру 1'],
    ['for_dispatcher2', 'Доступен диспетчеру 2'],
    ['no_date', 'Отображать заявки без даты'],
  ];

  const additionalBlock = additionalParams.map(([k, label]) =>
    `<p><strong>${label}:</strong> ${val(r[k])}</p>`
  ).join('');

  const fieldsOrder = (r.fields_order || '').split(',').filter(f => f.trim());
  const fieldsLabels = fieldsOrder.map(key => FIELD_LABELS[key] || key).join(', ');

  const fieldsBlock = fieldsLabels
    ? `<p><strong>Поля в отчёте:</strong> ${fieldsLabels}</p>`
    : '<p><strong>Поля в отчёте:</strong> —</p>';

  wrap.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h3 class="fs-lg m-0">${escapeHtml(r.name || '')}</h3>
    </div>
    <hr>
    <div class="fs-base flex-grow-1 report-text">
      ${additionalBlock}
      ${createdAt ? `<p><strong>Создан:</strong> ${createdAt}</p>` : ''}
      ${updatedAt ? `<p><strong>Обновлён:</strong> ${updatedAt}</p>` : ''}
      ${fieldsBlock}
    </div>
    <div class="text-end mt-3">${btns}</div>
  `;

  col.append(wrap);
  return col;
}

function renderPagination() {
  pagEl.innerHTML = '';
  const add = (text, page, disabled = false, active = false) => {
    const li = document.createElement('li');
    li.className = `page-item${disabled ? ' disabled' : ''}${active ? ' active' : ''}`;
    li.innerHTML = `<a class="page-link" href="#">${text}</a>`;
    if (!disabled)
      li.querySelector('a').addEventListener('click', e => {
        e.preventDefault();
        loadReports(page);
      });
    return li;
  };

  if (currentPage > 1) { pagEl.append(add('««', 1)); pagEl.append(add('«', currentPage - 1)); }
  pagEl.append(add('1', 1, false, currentPage === 1));

  const s = Math.max(2, currentPage - 2);
  const e = Math.min(totalPages - 1, currentPage + 2);

  if (s > 2) pagEl.append(ellipsis());
  for (let p = s; p <= e; p++) pagEl.append(add(String(p), p, false, currentPage === p));
  if (e < totalPages - 1) pagEl.append(ellipsis());
  if (totalPages > 1) pagEl.append(add(String(totalPages), totalPages, false, currentPage === totalPages));
  if (currentPage < totalPages) { pagEl.append(add('»', currentPage + 1)); pagEl.append(add('»»', totalPages)); }
}

function ellipsis() {
  const li = document.createElement('li');
  li.className = 'page-item disabled';
  li.innerHTML = '<span class="page-link">…</span>';
  return li;
}

async function deleteReport(id, name) {
  if (!confirm(`Удалить отчёт "${name}"?`)) return;
  const res = await safeFetch(deleteUrlApi.replace(':id', id), { method: 'DELETE' }, 'calendar_reports_action');
  if (!res) return;
  if (res.ok) loadReports(currentPage);
  else alert(await safeMsg(res, 'Ошибка при удалении отчёта'));
}

async function safeMsg(res, fallback) {
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

const doSearch = debounce(() => loadReports(1), 350);
searchEl.addEventListener('input', doSearch);

document.addEventListener('DOMContentLoaded', () => loadReports(1));
window.deleteReport = deleteReport;

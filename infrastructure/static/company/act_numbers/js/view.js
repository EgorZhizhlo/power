import { safeFetch } from '/static/company/_utils/safe_fetch.js';

const apiUrl = `/companies/api/act-numbers?company_id=${window.companyId}`;
const deleteUrlApi = `/companies/api/act-numbers/delete?company_id=${window.companyId}&act_number_id=:id`;
const restoreUrlApi = `/companies/api/act-numbers/restore?company_id=${window.companyId}&act_number_id=:id`;
const updateUrlTemplate = `/companies/act-numbers/update?company_id=${window.companyId}&act_number_id=:id`;

let currentPage = 1, totalPages = 1;
const searchEl = document.getElementById('search-input');
const listEl = document.getElementById('act-numbers-list');
const pagEl = document.getElementById('pagination');

searchEl.addEventListener('input', () => loadActNumbers(1, searchEl.value.trim()));
document.addEventListener('DOMContentLoaded', () => loadActNumbers());

async function loadActNumbers(page = 1, search = '') {
  const url = `${apiUrl}&page=${page}&search=${encodeURIComponent(search)}`;
  const res = await safeFetch(url, {}, 'act_numbers');
  if (!res) return;

  const text = await res.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch {}

  const { items = [], page: p = 1, total_pages = 1 } = data;
  currentPage = p;
  totalPages = total_pages;

  renderActNumbers(items);
  renderPaginationActNumbers();
}

function renderActNumbers(items) {
  listEl.innerHTML = '';
  if (!items.length) {
    listEl.innerHTML = `
      <div class="col-12">
        <div class="card p-4 text-center fw-bold">Нет данных</div>
      </div>`;
    return;
  }
  items.forEach(a => listEl.append(cardActNumber(a)));
}

function cardActNumber(a) {
  const col = document.createElement('div');
  col.className = 'col-xl-6 col-12 mb-4';

  const del = !!a.is_deleted;
  const div = document.createElement('div');
  div.className = `card act-number-item p-4 h-100 d-flex flex-column${del ? ' deleted' : ''}`;

  const seriesName = a.series?.name || '';
  const cityName = a.city?.name || '';
  const createdAt = a.created_at_strftime_full || '';
  const updatedAt = a.updated_at_strftime_full || '';
  const verifDate = a.verification_date_strftime || '';

  const buttons = del
    ? `<button class="btn btn-outline-success fw-bold" style="border-width: 3px;"
                onclick="restoreActNumber(${a.id})">♻️ Восстановить</button>`
    : `<a class="btn btn-outline-warning fw-bold" style="border-width: 3px;"
           href="${updateUrlTemplate.replace(':id', a.id)}">🔄 Редактировать</a>
       <button class="btn btn-outline-danger fw-bold" style="border-width: 3px;"
               onclick="deleteActNumber(${a.id})">🗑️ Удалить</button>`;

  div.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h3 class="fs-lg m-0">Акт № ${a.act_number ?? ''}${del ? ' (удалён)' : ''}</h3>
    </div>
    <hr>
    <div class="fs-base flex-grow-1 act-number-text">
      ${createdAt ? `<p><strong>Создан:</strong> ${createdAt}</p>` : ''}
      ${updatedAt ? `<p><strong>Обновлён:</strong> ${updatedAt}</p>` : ''}
      <p><strong>ФИО клиента:</strong> ${a.client_full_name ?? ''}</p>
      <p><strong>Телефон:</strong> ${a.client_phone ?? ''}</p>
      <p><strong>Адрес:</strong> ${a.address ?? ''}</p>
      ${verifDate ? `<p><strong>Дата поверки:</strong> ${verifDate}</p>` : ''}
      <p><strong>${
        a.legal_entity === "legal" ? 'Юр. лицо' : a.legal_entity === "individual" ? 'Физ. лицо' : ''
      }</strong></p>
      <p><strong>Кол-во заявок поверок:</strong> ${a.count != null ? 4 - a.count : ''}</p>
      <p><strong>Город:</strong> ${cityName}</p>
      <p><strong>Серия:</strong> ${seriesName}</p>
    </div>
    <div class="act-number-actions mt-3">${buttons}</div>
  `;

  col.append(div);
  return col;
}

function renderPaginationActNumbers() {
  pagEl.innerHTML = '';
  if (currentPage > 1) {
    pagEl.append(pgActNumbers('««', 1));
    pagEl.append(pgActNumbers('«', currentPage - 1));
  }
  pagEl.append(pgActNumbers('1', 1, currentPage === 1));

  const s = Math.max(2, currentPage - 2);
  const e = Math.min(totalPages - 1, currentPage + 2);

  if (s > 2) pagEl.append(ellipsisActNumbers());
  for (let p = s; p <= e; p++) pagEl.append(pgActNumbers(p, p, currentPage === p));
  if (e < totalPages - 1) pagEl.append(ellipsisActNumbers());
  if (totalPages > 1) pagEl.append(pgActNumbers(totalPages, totalPages, currentPage === totalPages));

  if (currentPage < totalPages) {
    pagEl.append(pgActNumbers('»', currentPage + 1));
    pagEl.append(pgActNumbers('»»', totalPages));
  }
}

function pgActNumbers(text, page, active = false) {
  const li = document.createElement('li');
  li.className = `page-item${active ? ' active' : ''}`;
  const a = document.createElement('a');
  a.className = 'page-link';
  a.href = '#';
  a.textContent = text;
  a.addEventListener('click', e => {
    e.preventDefault();
    loadActNumbers(page, searchEl.value.trim());
  });
  li.append(a);
  return li;
}

function ellipsisActNumbers() {
  const li = document.createElement('li');
  li.className = 'page-item disabled';
  li.innerHTML = '<span class="page-link">…</span>';
  return li;
}

async function deleteActNumber(id) {
  if (!confirm('Удалить номер акта?')) return;
  const res = await safeFetch(deleteUrlApi.replace(':id', id), { method: 'DELETE' }, 'act_numbers_action');
  if (!res) return;
  if (res.ok) loadActNumbers(currentPage, searchEl.value.trim());
  else alert(await safeErrorMessage(res, 'Ошибка при удалении'));
}

async function restoreActNumber(id) {
  if (!confirm('Восстановить номер акта?')) return;
  const res = await safeFetch(restoreUrlApi.replace(':id', id), { method: 'POST' }, 'act_numbers_action');
  if (!res) return;
  if (res.ok) loadActNumbers(currentPage, searchEl.value.trim());
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

window.deleteActNumber = deleteActNumber;
window.restoreActNumber = restoreActNumber;

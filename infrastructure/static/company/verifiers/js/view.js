import { safeFetch } from '/static/company/_utils/safe_fetch.js';

const apiUrl = `/companies/api/verifiers?company_id=${window.companyId}`;
const deleteUrlApi = `/companies/api/verifiers/delete?company_id=${window.companyId}&verifier_id=:id`;
const restoreUrlApi = `/companies/api/verifiers/restore?company_id=${window.companyId}&verifier_id=:id`;
const updateUrlTemplate = `/companies/verifiers/update?company_id=${window.companyId}&verifier_id=:id`;

let currentPage = 1, totalPages = 1;
const searchInput = document.getElementById('search-input');
const listEl = document.getElementById('verifiers-list');
const pagEl = document.getElementById('pagination');

const debounce = (fn, d = 350) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), d); }; };

searchInput.addEventListener('input', debounce(() =>
    loadVerifiers(1, searchInput.value.trim()), 300)
);
document.addEventListener('DOMContentLoaded', () => loadVerifiers());

async function loadVerifiers(page = 1, search = '') {
    const url = `${apiUrl}&page=${page}&search=${encodeURIComponent(search)}`;
    const res = await safeFetch(url, {}, 'verifiers');
    if (!res) return;

    const { items = [], page: p = 1, total_pages = 1 } = await res.json();
    currentPage = p;
    totalPages = total_pages;
    renderVerifiers(items);
    renderPagination();
}

function renderVerifiers(items) {
    listEl.innerHTML = '';
    if (!items.length) {
        const empty = document.createElement('div');
        empty.className = 'col-12';
        empty.innerHTML = '<div class="card p-4 text-center fw-bold">Нет данных</div>';
        listEl.append(empty);
        return;
    }
    items.forEach(v => listEl.append(card(v)));
}

function card(v) {
    const del = !!v.is_deleted;

    const col = document.createElement('div');
    col.className = 'col-xl-6 col-12 mb-4';

    const wrap = document.createElement('div');
    wrap.className = `card verifier-item p-4 h-100 d-flex flex-column${del ? ' deleted' : ''}`;

    const fio = [v.last_name, v.name, v.patronymic]
        .filter(Boolean).map(cap).join(' ');

    let btns = '';
    if (window.statusU !== "auditor") {
        btns = del
            ? `<button class="btn btn-outline-success label-text fw-bold" style="border-width: 3px;"
                     onclick="restoreVerifier(${v.id})">♻️ Восстановить</button>`
            : `<a class="btn btn-outline-warning label-text fw-bold" style="border-width: 3px;"
                href="${updateUrlTemplate.replace(':id', v.id)}">🔄 Редактировать</a>
             <button class="btn btn-outline-danger  label-text fw-bold" style="border-width: 3px;"
                     onclick="deleteVerifier(${v.id})">🗑️ Удалить</button>`;
    } else {
        btns = `<a class="btn btn-outline-warning label-text fw-bold" style="border-width: 3px;"
                  href="${updateUrlTemplate.replace(':id', v.id)}">🔄 Редактировать</a>`;
    }

    const eqList = Array.isArray(v.equipments) && v.equipments.length
        ? v.equipments.map(e => {
            const nm = e?.name ? escapeHtml(e.name) : '';
            const fn = e?.factory_number ?? '';
            const inum = e?.inventory_number ?? '';
            return `${nm}${fn ? `, Зав. №: ${escapeHtml(fn)}` : ''}${inum ? `, Инв. №: ${escapeHtml(inum)}` : ''}`;
        }).join('<br>')
        : 'Не назначено';

    const createdAt = v.created_at_strftime_full || '';
    const updatedAt = v.updated_at_strftime_full || '';

    wrap.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h3 class="fs-lg m-0">${escapeHtml(fio)}${del ? ' (удалён)' : ''}</h3>
        </div>
        <hr>
        <div class="fs-base flex-grow-1 verifier-text">
          ${createdAt ? `<p><strong>Создан:</strong> ${createdAt}</p>` : ''}
          ${updatedAt ? `<p><strong>Обновлён:</strong> ${updatedAt}</p>` : ''}
          <p><strong>СНИЛС:</strong> ${escapeHtml(v.snils || '')}</p>
          <p><strong>Оборудование:</strong><br>${eqList}</p>
        </div>
        <div class="verifier-actions mt-3">
          ${btns}
        </div>
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
        if (!disabled) li.querySelector('a').addEventListener('click', e => {
            e.preventDefault();
            loadVerifiers(page, searchInput.value.trim());
        });
        return li;
    };
    if (currentPage > 1) { pagEl.append(add('««', 1)); pagEl.append(add('«', currentPage - 1)); }
    pagEl.append(add('1', 1, false, currentPage === 1));
    const s = Math.max(2, currentPage - 2), e = Math.min(totalPages - 1, currentPage + 2);
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

async function deleteVerifier(id) {
    if (!confirm('Удалить поверителя?')) return;

    const url = deleteUrlApi.replace(':id', id);
    const res = await safeFetch(url, { method: 'DELETE' }, 'verifier_action');

    if (!res) return; // если запрос отменён или ошибка

    if (res.ok) {
        loadVerifiers(currentPage, searchInput.value.trim());
    } else {
        alert(await safeMsg(res, 'Ошибка при удалении'));
    }
}

async function restoreVerifier(id) {
    if (!confirm('Восстановить поверителя?')) return;

    const url = restoreUrlApi.replace(':id', id);
    const res = await safeFetch(url, { method: 'POST' }, 'verifier_action');

    if (!res) return; // если запрос отменён или ошибка

    if (res.ok) {
        loadVerifiers(currentPage, searchInput.value.trim());
    } else {
        alert(await safeMsg(res, 'Ошибка при восстановлении'));
    }
}

function cap(s) { if (!s) return ''; s = String(s); return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase(); }
function escapeHtml(s) {
    return String(s ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
async function safeMsg(res, fb) {
    try {
        const t = await res.text(); if (!t) return fb;
        try { const j = JSON.parse(t); return j?.detail || fb; } catch { return t; }
    }
    catch { return fb; }
}
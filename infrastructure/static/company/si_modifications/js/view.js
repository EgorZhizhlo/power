import { safeFetch } from '/static/company/_utils/safe_fetch.js';

const apiUrl = `/companies/api/si-modifications?company_id=${window.companyId}`;
const deleteUrlApi = `/companies/api/si-modifications/delete?company_id=${window.companyId}&modification_id=:id`;
const restoreUrlApi = `/companies/api/si-modifications/restore?company_id=${window.companyId}&modification_id=:id`;
const updateUrlTemplate = `/companies/si-modifications/update?company_id=${window.companyId}&modification_id=:id`;

let currentPage = 1, totalPages = 1;
const qEl = document.getElementById('search-input');
const listEl = document.getElementById('mods-list');
const pagEl = document.getElementById('pagination');

const debounce = (fn, d = 350) => {
    let t;
    return (...a) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...a), d);
    };
};

async function loadSiModifications(page = 1) {
    const search = (qEl.value || '').trim();
    const url = `${apiUrl}&page=${page}&search=${encodeURIComponent(search)}`;

    const res = await safeFetch(url, {}, 'mods');
    if (!res) return; // запрос отменён или ошибка

    const text = await res.text();
    let data = {};
    try {
        data = text ? JSON.parse(text) : {};
    } catch {}

    const { items = [], page: p = 1, total_pages = 1 } = data;
    currentPage = p;
    totalPages = total_pages;

    renderSiModifications(items);
    renderPaginationSiModifications();
}

function renderSiModifications(items) {
    listEl.innerHTML = '';
    if (!items.length) {
        const empty = document.createElement('div');
        empty.className = 'col-12';
        empty.innerHTML = '<div class="card p-4 text-center fw-bold">Нет данных</div>';
        listEl.append(empty);
        return;
    }
    items.forEach(m => listEl.append(cardSiModification(m)));
}

function safe(v) {
    return (v ?? '').toString().trim();
}

function cardSiModification(m) {
    const del = !!m.is_deleted;

    const col = document.createElement('div');
    col.className = 'col-xl-6 col-12 mb-4';

    const div = document.createElement('div');
    div.className = `card mod-item p-4 h-100 d-flex flex-column${del ? ' deleted' : ''}`;

    const name = escapeHtml(safe(m.modification_name) || '(без названия)');
    const createdAt = m.created_at_strftime_full || '';
    const updatedAt = m.updated_at_strftime_full || '';

    const btns = del
        ? `<button class="btn btn-outline-success label-text fw-bold" style="border-width: 3px;"
                   onclick="restoreSiModification(${m.id})">♻️ Восстановить</button>`
        : `<a class="btn btn-outline-warning label-text fw-bold" style="border-width: 3px;"
              href="${updateUrlTemplate.replace(':id', m.id)}">🔄 Редактировать</a>
           <button class="btn btn-outline-danger label-text fw-bold" style="border-width: 3px;"
                   onclick="deleteSiModification(${m.id})">🗑️ Удалить</button>`;

    div.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h3 class="fs-lg m-0">${name}${del ? ' (удалена)' : ''}</h3>
        </div>
        <hr>
        <div class="fs-base flex-grow-1 mod-text">
          ${createdAt ? `<p><strong>Создана:</strong> ${createdAt}</p>` : ''}
          ${updatedAt ? `<p><strong>Обновлена:</strong> ${updatedAt}</p>` : ''}
        </div>
        <div class="mod-actions mt-3">
          ${btns}
        </div>
      `;

    col.append(div);
    return col;
}

function renderPaginationSiModifications() {
    pagEl.innerHTML = '';
    if (currentPage > 1) {
        pagEl.append(pageButtonSiModifications('««', 1));
        pagEl.append(pageButtonSiModifications('«', currentPage - 1));
    }
    pagEl.append(pageButtonSiModifications('1', 1));
    const s = Math.max(2, currentPage - 2),
          e = Math.min(totalPages - 1, currentPage + 2);
    if (s > 2) pagEl.append(ellipsisSiModifications());
    for (let p = s; p <= e; p++) pagEl.append(pageButtonSiModifications(p, p));
    if (e < totalPages - 1) pagEl.append(ellipsisSiModifications());
    if (totalPages > 1) pagEl.append(pageButtonSiModifications(totalPages, totalPages));
    if (currentPage < totalPages) {
        pagEl.append(pageButtonSiModifications('»', currentPage + 1));
        pagEl.append(pageButtonSiModifications('»»', totalPages));
    }
}

function pageButtonSiModifications(text, page) {
    const li = document.createElement('li');
    li.className = `page-item${page === currentPage ? ' active' : ''}`;
    li.innerHTML = `<a class="page-link" href="#">${text}</a>`;
    li.querySelector('a').addEventListener('click', e => {
        e.preventDefault();
        loadSiModifications(page);
    });
    return li;
}

function ellipsisSiModifications() {
    const li = document.createElement('li');
    li.className = 'page-item disabled';
    li.innerHTML = '<span class="page-link">…</span>';
    return li;
}

async function deleteSiModification(id) {
    if (!confirm('Удалить модификацию?')) return;

    const res = await safeFetch(deleteUrlApi.replace(':id', id), { method: 'DELETE' }, 'mod_action');
    if (!res) return;

    if (res.ok) loadSiModifications(currentPage);
    else alert(await msgSiModifications(res, 'Ошибка при удалении'));
}

async function restoreSiModification(id) {
    if (!confirm('Восстановить модификацию?')) return;

    const res = await safeFetch(restoreUrlApi.replace(':id', id), { method: 'POST' }, 'mod_action');
    if (!res) return;

    if (res.ok) loadSiModifications(currentPage);
    else alert(await msgSiModifications(res, 'Ошибка при восстановлении'));
}

async function msgSiModifications(res, fallback) {
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

const doSearch = debounce(() => loadSiModifications(1), 350);
qEl.addEventListener('input', doSearch);
document.addEventListener('DOMContentLoaded', () => loadSiModifications());

window.deleteSiModification = deleteSiModification;
window.restoreSiModification = restoreSiModification;

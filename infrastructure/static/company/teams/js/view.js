import { safeFetch } from '/static/company/_utils/safe_fetch.js';

const apiUrl = `/companies/api/teams?company_id=${window.companyId}`;
const deleteUrlApi = `/companies/api/teams/delete?company_id=${window.companyId}&team_id=:id`;
const restoreUrlApi = `/companies/api/teams/restore?company_id=${window.companyId}&team_id=:id`;
const updateUrlTemplate = `/companies/teams/update?company_id=${window.companyId}&team_id=:id`;

let currentPage = 1, totalPages = 1;
const listEl = document.getElementById('teams-list');
const pagEl = document.getElementById('pagination');
const searchEl = document.getElementById('search-input');

const debounce = (fn, d = 350) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), d); }; };

function getParams(page = 1) {
    const params = { page, status: 'all' };
    const q = (searchEl.value || '').trim();
    if (q) params.search = q;
    return params;
}

async function loadTeams(page = 1) {
    const params = getParams(page);
    const qs = new URLSearchParams(params).toString();

    const res = await safeFetch(`${apiUrl}&${qs}`, {}, 'teams');
    if (!res) return;

    const text = await res.text();
    let data = {};
    try { data = text ? JSON.parse(text) : {}; } catch (_) {}

    const { items = [], page: p = 1, total_pages = 1 } = data;
    currentPage = p;
    totalPages = total_pages;

    renderList(items);
    renderPagination();
}

function renderList(items) {
    listEl.innerHTML = '';
    if (!items.length) {
        const empty = document.createElement('div');
        empty.className = 'col-12';
        empty.innerHTML = '<div class="card p-4 text-center fw-bold">Нет данных</div>';
        listEl.append(empty);
        return;
    }
    items.forEach(t => listEl.append(card(t)));
}

function card(t) {
    const col = document.createElement('div');
    col.className = 'col-xl-6 col-12 mb-4';

    const wrap = document.createElement('div');
    wrap.className = `card team-item p-4 h-100 d-flex flex-column${t.is_deleted ? ' deleted' : ''}`;

    const btns = t.is_deleted
        ? `<button class="btn btn-outline-success label-text fw-bold" style="border-width: 3px;"
                   onclick="restoreTeam(${t.id}, '${escapeHtml(t.name)}')">♻️ Восстановить</button>`
        : `<a class="btn btn-outline-warning label-text fw-bold" style="border-width: 3px;"
              href="${updateUrlTemplate.replace(':id', t.id)}">🔄 Редактировать</a>
           <button class="btn btn-outline-danger label-text fw-bold" style="border-width: 3px;"
                   onclick="deleteTeam(${t.id}, '${escapeHtml(t.name)}')">🗑️ Удалить</button>`;

    const verList = (t.verifiers || []).map(v => {
        const fio = [v.last_name, v.name, v.patronymic].filter(Boolean).join(' ');
        const sn = v.snils ? `, СНИЛС: ${v.snils}` : '';
        return `${escapeHtml(fio)}${escapeHtml(sn)}`;
    }).join('<br>') || 'Нет сотрудников в команде';

    const createdAt = t.created_at_strftime_full || '';
    const updatedAt = t.updated_at_strftime_full || '';

    wrap.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h3 class="fs-lg m-0">${escapeHtml(t.name)}${t.is_deleted ? ' (удалена)' : ''}</h3>
        </div>
        <hr>
        <div class="fs-base flex-grow-1 team-text">
          ${createdAt ? `<p><strong>Создана:</strong> ${createdAt}</p>` : ''}
          ${updatedAt ? `<p><strong>Обновлёна:</strong> ${updatedAt}</p>` : ''}
          <p class="mb-1"><strong>Поверители:</strong></p>
          <div class="label-text">${verList}</div>
        </div>
        <div class="team-actions mt-3">
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
            e.preventDefault(); loadTeams(page);
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

async function deleteTeam(id, name) {
    if (!confirm(`Удалить команду "${name}"?`)) return;

    const res = await safeFetch(deleteUrlApi.replace(':id', id), { method: 'DELETE' }, 'team_action');
    if (!res) return; // отменён или ошибка

    const text = await res.text();
    if (res.ok) loadTeams(currentPage);
    else alert(await safeMsg(res, text || 'Ошибка при удалении'));
}

async function restoreTeam(id, name) {
    if (!confirm(`Восстановить команду "${name}"?`)) return;

    const res = await safeFetch(restoreUrlApi.replace(':id', id), { method: 'POST' }, 'team_action');
    if (!res) return; // отменён или ошибка

    const text = await res.text();
    if (res.ok) loadTeams(currentPage);
    else alert(await safeMsg(res, text || 'Ошибка при восстановлении'));
}

async function safeMsg(res, fb) {
    try {
        const text = await res.text();
        if (!text) return fb;
        try { const j = JSON.parse(text); return j?.detail || fb; } catch { return text; }
    } catch { return fb; }
}

function escapeHtml(s) {
    return String(s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

const doSearch = debounce(() => loadTeams(1), 350);
document.addEventListener('DOMContentLoaded', () => loadTeams(1));
searchEl.addEventListener('input', doSearch);

// глобально для onclick
window.deleteTeam = deleteTeam;
window.restoreTeam = restoreTeam;
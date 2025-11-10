import { safeFetch } from '/static/company/_utils/safe_fetch.js';

const apiUrl = `/companies/api/employees?company_id=${window.companyId}`;
const imgUrlApi = `/companies/api/employees/image?company_id=${window.companyId}&employee_id=:id`;
const deleteUrlApi = `/companies/api/employees/delete?company_id=${window.companyId}&employee_id=:id`;
const restoreUrlApi = `/companies/api/employees/restore?company_id=${window.companyId}&employee_id=:id`;
const updateUrlTemplate = `/companies/employees/update?company_id=${window.companyId}&employee_id=:id`;

let currentPage = 1, totalPages = 1;
const searchInput = document.getElementById('search-input');
const listEl = document.getElementById('employees-list');
const pagEl = document.getElementById('pagination');

searchInput.addEventListener('input', () => loadEmployees(1, searchInput.value.trim()));
document.addEventListener('DOMContentLoaded', () => loadEmployees());

async function getJsonSafe(res) {
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    if (ct.includes('application/json')) {
        try { return await res.json(); } catch { }
    }
    const raw = await res.text();
    const cleaned = (raw || '').replace(/^\uFEFF/, '').trim().replace(/;+\s*$/, '');
    try { return cleaned ? JSON.parse(cleaned) : null; } catch { return null; }
}

function mapRoleCodeToLabel(code) {
    if (!code) return null;
    const c = String(code).trim().toLowerCase();
    switch (c) {
        case 'admin': return 'Администратор';
        case 'director': return 'Руководитель компании';
        case 'verifier': return 'Поверитель';
        case 'auditor': return 'Ревизор';
        case 'dispatcher1': return 'Диспетчер 1';
        case 'dispatcher2': return 'Диспетчер 2';
        default: return code;
    }
}

async function loadEmployees(page = 1, search = '') {
  const url = `${apiUrl}&page=${page}&search=${encodeURIComponent(search)}`;
  const res = await safeFetch(url, {}, 'employees');
  if (!res) return;

  const data = await getJsonSafe(res);
  const { items = [], page: p = 1, total_pages = 1 } = data || {};

  currentPage = p;
  totalPages = total_pages;

  listEl.innerHTML = '';
  if (!items.length) {
    const empty = document.createElement('div');
    empty.className = 'col-12';
    empty.innerHTML = '<div class="card p-4 text-center"><h2 class="fs-lg">Ничего не найдено</h2><p class="fs-base">Измените запрос поиска.</p></div>';
    listEl.append(empty);
  } else {
    items.forEach(emp => listEl.append(card(emp)));
  }

  renderPag();

  // отложенная загрузка фото
  setTimeout(() => loadEmployeeImages(), 200);
}

function card(emp) {
    const del = !!emp.is_deleted;
    const roleCode = String(emp.status || '').trim().toLowerCase();
    const isAuditor = roleCode === 'auditor';

    const col = document.createElement('div');
    col.className = 'col-xl-6 col-12 mb-4';
    col.dataset.empId = emp.id;
    col._empData = emp;

    const div = document.createElement('div');
    div.className = `card employee-item p-4 h-100 d-flex flex-column${del ? ' deleted' : ''}`;

    const btns = del
        ? `<div class="employee-actions">
          <button class="btn btn-outline-success fw-bold"
                  style="border-width: 3px;"
                  onclick="restoreE(${emp.id})">♻️ Восстановить</button>
        </div>`
        : `<div class="employee-actions">
          <a class="btn btn-outline-warning fw-bold"
              style="border-width: 3px;"
              href="${updateUrlTemplate.replace(':id', emp.id)}">🔄 Редактировать</a>
          <button class="btn btn-outline-danger fw-bold"
                  style="border-width: 3px;"
                  onclick="deleteE(${emp.id})">🗑️ Удалить</button>
        </div>`;

    const fio = [emp.last_name, emp.name, emp.patronymic].filter(Boolean).join(' ').trim();

    const photo = `
      <div id="photo-${emp.id}" class="emp-photo text-muted small d-flex align-items-center justify-content-center">
        Загрузка фото...
      </div>`;

    const createdAt = emp.created_at_strftime_full || '';
    const updatedAt = emp.updated_at_strftime_full || '';
    const lastLogin = emp.last_login_strftime_full || '';
    const defaultCity = emp.default_city_name || '';
    const defaultVerifier = emp.default_verifier_fullname || '';
    const seriesName = emp.series_name || '';

    div.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h3 class="fs-lg m-0">${escapeHtml(fio || 'Без имени')}${del ? ' (удалён)' : ''}</h3>
      </div>
      <hr>
      <div class="d-flex align-items-start">
        <div class="flex-shrink-0">${photo}</div>
        <div class="ms-3 flex-grow-1 fs-base employee-text">
          ${createdAt ? `<p><strong>Создан:</strong> ${createdAt}</p>` : ''}
          ${updatedAt ? `<p><strong>Обновлён:</strong> ${updatedAt}</p>` : ''}
          ${lastLogin ? `<p><strong>Последний вход:</strong> ${lastLogin}</p>` : ''}
          <p><strong>Email:</strong> ${escapeHtml(emp.email || '—')}</p>
          <p><strong>Роль:</strong> ${escapeHtml(mapRoleCodeToLabel(emp.status) || '—')}</p>
          ${emp.position ? `<p><strong>Должность:</strong> ${escapeHtml(emp.position)}</p>` : ''}
          <p><strong>Активность:</strong> ${emp.is_active ? 'Да' : 'Нет'}</p>
          ${isAuditor && typeof emp.trust_verifier === 'boolean'
            ? `<p><strong>Доступ к разделу "Поверители":</strong> ${emp.trust_verifier ? 'Да' : 'Нет'}</p>` : ''}
          ${isAuditor && typeof emp.trust_equipment === 'boolean'
            ? `<p><strong>Доступ к разделу "Карточки оборудования":</strong> ${emp.trust_equipment ? 'Да' : 'Нет'}</p>` : ''}
          ${defaultCity ? `<p><strong>Город по умолчанию:</strong> ${escapeHtml(defaultCity)}</p>` : ''}
          ${defaultVerifier ? `<p><strong>Поверитель по умолчанию:</strong> ${escapeHtml(defaultVerifier)}</p>` : ''}
          ${seriesName ? `<p><strong>Серия актов по умолчанию:</strong> ${escapeHtml(seriesName)}</p>` : ''}
        </div>
      </div>
      ${btns}
    `;

    col.append(div);
    return col;
}

async function loadEmployeeImages() {
    const elements = document.querySelectorAll('[data-emp-id]');
    for (const el of elements) {
        const id = el.dataset.empId;
        const photoBox = document.getElementById(`photo-${id}`);
        if (!photoBox) continue;

        // 🔹 Считываем объект сотрудника из текущего списка
        const emp = Array.from(listEl.querySelectorAll('[data-emp-id]'))
            .map(e => e.dataset.empId == id ? e._empData : null)
            .find(Boolean);

        // 🔹 Если у сотрудника нет изображения — не делаем fetch вообще
        if (emp && !emp.has_image) {
            photoBox.innerHTML = `
          <div class="text-muted small d-flex flex-column align-items-center justify-content-center">
            <div style="font-size:2rem;">👤</div>
            <div>Нет фото</div>
          </div>`;
            continue;
        }

        try {
            const resp = await fetch(imgUrlApi.replace(':id', id), { credentials: 'same-origin' });

            if (resp.ok) {
                const blob = await resp.blob();
                const url = URL.createObjectURL(blob);
                photoBox.innerHTML = `
            <a href="${url}" class="emp-gallery" data-sub-html="<b>ID: ${id}</b>">
              <img src="${url}" alt="Фото сотрудника">
            </a>`;
            } else if (resp.status === 404) {
                photoBox.innerHTML = `
            <div class="text-muted small d-flex flex-column align-items-center justify-content-center">
              <div style="font-size:2rem;">👤</div>
              <div>Нет фото</div>
            </div>`;
            } else {
                photoBox.innerHTML = `
            <div class="text-danger small d-flex align-items-center justify-content-center">
              ⚠️ Ошибка загрузки
            </div>`;
            }
        } catch (err) {
            console.error('Ошибка при загрузке фото:', err);
            photoBox.innerHTML = `
          <div class="text-danger small d-flex align-items-center justify-content-center">
            ⚠️ Ошибка сети
          </div>`;
        }
    }

    initLightbox();
}

function renderPag() {
    pagEl.innerHTML = '';
    if (currentPage > 1) { pagEl.append(pg('««', 1)); pagEl.append(pg('«', currentPage - 1)); }
    pagEl.append(pg('1', 1));
    const s = Math.max(2, currentPage - 2), e = Math.min(totalPages - 1, currentPage + 2);
    if (s > 2) pagEl.append(ellipsis());
    for (let p = s; p <= e; p++) pagEl.append(pg(p, p));
    if (e < totalPages - 1) pagEl.append(ellipsis());
    if (totalPages > 1) pagEl.append(pg(totalPages, totalPages));
    if (currentPage < totalPages) { pagEl.append(pg('»', currentPage + 1)); pagEl.append(pg('»»', totalPages)); }
}

function pg(text, page) {
    const li = document.createElement('li');
    li.className = `page-item${page === currentPage ? ' active' : ''}`;
    li.innerHTML = `<a class="page-link" href="#">${text}</a>`;
    li.querySelector('a').addEventListener('click', e => {
        e.preventDefault(); loadEmployees(page, searchInput.value.trim());
    });
    return li;
}

const ellipsis = () => {
    const li = document.createElement('li');
    li.className = 'page-item disabled';
    li.innerHTML = '<span class="page-link">…</span>';
    return li;
};

async function deleteE(id) {
    if (!confirm('Удалить сотрудника?')) return;
    const r = await fetch(deleteUrlApi.replace(':id', id), { method: 'DELETE', credentials: 'same-origin' });
    if (r.ok) loadEmployees(currentPage, searchInput.value.trim());
    else alert(await safeMsg(r, 'Ошибка при удалении'));
}

async function restoreE(id) {
    if (!confirm('Восстановить сотрудника?')) return;
    const r = await fetch(restoreUrlApi.replace(':id', id), { method: 'POST', credentials: 'same-origin' });
    if (r.ok) loadEmployees(currentPage, searchInput.value.trim());
    else alert(await safeMsg(r, 'Ошибка при восстановлении'));
}

async function safeMsg(res, fb) {
    try {
        const ct = (res.headers.get('content-type') || '').toLowerCase();
        if (ct.includes('application/json')) {
            try { const j = await res.json(); return j?.detail || fb; } catch { }
        }
        const t = await res.text();
        const cleaned = (t || '').replace(/^\uFEFF/, '').trim().replace(/;+\s*$/, '');
        try { const j = cleaned ? JSON.parse(cleaned) : null; return j?.detail || cleaned || fb; }
        catch { return cleaned || fb; }
    } catch { return fb; }
}

function initLightbox() {
    document.querySelectorAll('.emp-gallery').forEach(el => {
        if (!el.dataset.lgInit) {
            lightGallery(el, {
                selector: 'this',
                plugins: [lgZoom],
                download: false,
                actualSize: true,
                zoomFromOrigin: true
            });
            el.dataset.lgInit = '1';
        }
    });
}

function escapeHtml(s) {
    return String(s || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
import { safeFetch } from '/static/company/_utils/safe_fetch.js';

const apiUrl = `/companies/api/verification-reports?company_id=${window.companyId}`;
const deleteUrlApi = `/companies/api/verification-reports/delete?company_id=${window.companyId}&verification_report_id=:id`;
const updateUrlTemplate = `/companies/verification-reports/update?company_id=${window.companyId}&verification_report_id=:id`;

const listEl = document.getElementById('reports-list');
const pagEl = document.getElementById('pagination');
const searchEl = document.getElementById('search-input');

let currentPage = 1, totalPages = 1;

const debounce = (fn, d = 350) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), d); }; };

async function loadReports(page = 1) {
    const params = { page };
    const q = (searchEl.value || '').trim();
    if (q) params.search = q;
    const qs = new URLSearchParams(params).toString();

    const res = await safeFetch(`${apiUrl}&${qs}`, {}, 'reports');
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
        const emptyCol = document.createElement('div');
        emptyCol.className = 'col-12';
        emptyCol.innerHTML = '<div class="card p-4 text-center"><h2 class="fs-lg">Ничего не найдено</h2><p class="fs-base">Измените запрос поиска.</p></div>';
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
    const escapeHtml = s => String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    const btns = `
        <a class="btn btn-outline-warning fw-bold label-text" style="border-width: 3px;"
          href="${updateUrlTemplate.replace(':id', r.id)}">🔄 Редактировать</a>
        <button class="btn btn-outline-danger fw-bold label-text" style="border-width: 3px;"
                onclick="deleteReport(${r.id}, '${escapeHtml(r.name || '')}')">🗑️ Удалить</button>`;

    const FIELD_LABELS = {
        employee_name: 'ФИО сотрудника',
        verification_date: 'Дата',
        city: 'Город',
        address: 'Адрес',
        client_name: 'ФИО клиента',
        si_type: 'Тип СИ',
        registry_number: '№ гос.реестра',
        factory_number: 'Заводской №',
        location_name: 'Место СИ',
        meter_info: 'Показания',
        end_verification_date: 'Окончание поверки',
        series_name: 'Серия акта',
        act_number: '№ акта',
        verification_result: 'Результат поверки',
        verification_number: '№ св-ва',
        qh: 'Qн',
        modification_name: 'Модификация',
        water_type: 'Тип воды',
        method_name: 'Методика',
        reference: 'Эталон',
        seal: 'Пломба',
        phone_number: 'Телефон',
        verifier_name: 'ФИО поверителя',
        manufacture_year: 'Год произв. СИ',
        reason_name: 'Причина непригодности',
        interval: 'МПИ',
    };

    // Добавляем дополнительные поля из window
    window.addLabels.forEach((lbl, i) => {
        if (lbl) FIELD_LABELS[`additional_checkbox_${i + 1}`] = lbl;
    });
    window.inputLabels.forEach((lbl, i) => {
        if (lbl) FIELD_LABELS[`additional_input_${i + 1}`] = lbl;
    });

    const fieldsOrderStr = r.fields_order || '';
    const fieldsOrderArr = fieldsOrderStr.split(',').filter(f => f.trim());
    const fieldsDisplay = fieldsOrderArr.length > 0
        ? fieldsOrderArr.map(key => FIELD_LABELS[key] || key).join(', ')
        : 'Нет полей';

    const createdAt = r.created_at_strftime_full || '';
    const updatedAt = r.updated_at_strftime_full || '';

    wrap.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h3 class="fs-lg m-0">${escapeHtml(r.name || '')}</h3>
        </div>
        <hr>
        <div class="fs-base flex-grow-1 report-text">
          ${createdAt ? `<p><strong>Создан:</strong> ${createdAt}</p>` : ''}
          ${updatedAt ? `<p><strong>Обновлён:</strong> ${updatedAt}</p>` : ''}
          <p><strong>Доступен поверителю:</strong> ${yesNo(r.for_verifier)}</p>
          <p><strong>Доступен ревизору:</strong> ${yesNo(r.for_auditor)}</p>
          ${fieldsDisplay ? `<p><strong>Поля отчёта:</strong> ${fieldsDisplay}</p>` : ''}
        </div>
        <div class="text-end mt-3">
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
        if (!disabled) {
            li.querySelector('a').addEventListener('click', e => {
                e.preventDefault(); loadReports(page);
            });
        }
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

async function deleteReport(id, name) {
    if (!confirm(`Удалить отчёт "${name}"?`)) return;

    const res = await safeFetch(deleteUrlApi.replace(':id', id), { method: 'DELETE' }, 'report_action');
    if (!res) return;

    if (res.ok) loadReports(currentPage);
    else alert(await safeMsg(res, 'Ошибка при удалении отчёта'));
}

async function safeMsg(res, fb) {
    try {
        const text = await res.text();
        if (!text) return fb;
        try { const j = JSON.parse(text); return j?.detail || fb; } catch { return text; }
    } catch { return fb; }
}

const doSearch = debounce(() => loadReports(1), 350);
searchEl.addEventListener('input', doSearch);

document.addEventListener('DOMContentLoaded', () => loadReports(1));

window.deleteReport = deleteReport;

import { safeFetch } from '/static/company/_utils/safe_fetch.js';

const apiUrl = `/companies/api/equipments?company_id=${window.companyId}`;
const deleteUrlApi = `/companies/api/equipments/delete?company_id=${window.companyId}&equipment_id=:id`;
const restoreUrlApi = `/companies/api/equipments/restore?company_id=${window.companyId}&equipment_id=:id`;
const updateUrlTemplate = `/companies/equipments/update?company_id=${window.companyId}&equipment_id=:id`;
const copyUrlTemplate = `/companies/equipments/copy?company_id=${window.companyId}&equipment_id=:id`;
const infoUrlTemplate = `/companies/equipment-informations?company_id=${window.companyId}&equipment_id=:id`;
const pdfdoc = `/companies/api/equipments/file?company_id=${window.companyId}&equipment_id=:id&field=document_pdf`;

let currentPage = 1, totalPages = 1;

const typeMap = {
  standard: 'Средство измерений, используемое в качестве эталона',
  measurement: 'Средство измерений',
  auxiliary: 'Вспомогательное оборудование',
  other: 'Другое'
};

const nameInp = document.getElementById('flt-name');
const factInp = document.getElementById('flt-factory');
const invInp = document.getElementById('flt-inventory');
const regInp = document.getElementById('flt-register');
const vfFromInp = document.getElementById('flt-verif-from');
const vfToInp = document.getElementById('flt-verif-to');
const statusSel = document.getElementById('flt-status');
const btnReset = document.getElementById('btn-reset');
const listEl = document.getElementById('equipment-list');
const pagEl = document.getElementById('pagination');

let lgInstances = [];
function destroyAllGalleries() {
  lgInstances.forEach(inst => { try { inst.destroy(true); } catch {} });
  lgInstances = [];
}
function initGalleryFor(el) {
  if (!window.lightGallery) return;
  const inst = lightGallery(el, {
    selector: 'a.eq-gallery',
    plugins: [lgZoom],
    speed: 300,
    download: false,
    actualSize: true,
    zoomFromOrigin: true,
    mobileSettings: { controls: true, showCloseIcon: true, download: false }
  });
  lgInstances.push(inst);
}

const debounce = (fn, d = 300) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), d); } };

function getParams(page = 1) {
  const params = { page, status: statusSel.value || 'all' };
  const v = (el) => (el.value || '').trim();
  if (v(nameInp)) params.name = v(nameInp);
  if (v(factInp)) params.factory_number = v(factInp);
  if (v(invInp)) params.inventory_number = v(invInp);
  if (v(regInp)) params.register_number = v(regInp);
  if (vfFromInp.value) params.verif_date_from = vfFromInp.value;
  if (vfToInp.value) params.verif_date_to = vfToInp.value;
  return params;
}

async function loadEquipments(page = 1) {
  const qs = new URLSearchParams(getParams(page)).toString();
  const res = await safeFetch(`${apiUrl}&${qs}`, { credentials: 'same-origin' }, 'equipments_list');
  if (!res) return;
  const text = await res.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch {}
  if (!res.ok) {
    alert(data?.detail || text || 'Ошибка загрузки оборудования');
    return;
  }
  const { items = [], page: p = 1, total_pages = 1 } = data;
  currentPage = p;
  totalPages = total_pages;
  renderEquipments(items);
  renderPaginationEquipments();
}

const autoApply = debounce(() => loadEquipments(1), 400);
[nameInp, factInp, invInp, regInp].forEach(el => el.addEventListener('input', autoApply));
[vfFromInp, vfToInp, statusSel].forEach(el => el.addEventListener('change', () => loadEquipments(1)));

btnReset.addEventListener('click', () => {
  [nameInp, factInp, invInp, regInp].forEach(el => el.value = '');
  vfFromInp.value = ''; vfToInp.value = '';
  statusSel.value = 'all';
  loadEquipments(1);
});

document.addEventListener('DOMContentLoaded', () => loadEquipments());

function renderEquipments(items) {
  destroyAllGalleries();
  listEl.innerHTML = '';
  if (!items.length) {
    const empty = document.createElement('div');
    empty.className = 'card p-4 text-center';
    empty.innerHTML = '<h2 class="fs-lg">Ничего не найдено</h2><p class="fs-base">Измените фильтры или сбросьте их.</p>';
    listEl.append(empty);
    return;
  }
  items.forEach(e => {
    const el = cardEquipments(e);
    listEl.append(el);
    initGalleryFor(el);
  });
}

function cardEquipments(e) {
  const del = e.is_deleted;
  const col = document.createElement('div');
  col.className = 'col-xl-6 col-12 mb-4 d-flex';
  const div = document.createElement('div');
  div.className = `card equipment-item p-3 h-100 flex-grow-1${del ? ' deleted' : ''}`;

  const caption = [
    e.name ? `Наименование: ${e.name}` : '',
    e.factory_number ? `Зав. №: ${e.factory_number}` : '',
    e.inventory_number ? `Инв. №: ${e.inventory_number}` : ''
  ].filter(Boolean).join(' • ').replace(/"/g, '&quot;');

  const img1 = e.image_url
    ? `<a class="eq-gallery" href="${e.image_url}" data-sub-html="${caption}">
         <div class="eq-photo"><img src="${e.image_url}" alt="equipment" width="230" height="270"></div>
       </a>`
    : `<div class="eq-photo text-muted small text-center">Фото отсутствует</div>`;
  const img2 = e.image2_url ? `<a class="eq-gallery d-none" href="${e.image2_url}" data-sub-html="${caption}"></a>` : '';

  const measurementBlock = e.measurement_range
    ? `<p>Диапазон: ${e.measurement_range}<br>${e.error_or_uncertainty ? 'Погрешность: ' + e.error_or_uncertainty : ''}</p>`
    : '';

  const pdfBtn = e.has_document
    ? `<a class="btn btn-outline-primary mt-2" href="${pdfdoc.replace(':id', e.id)}" target="_blank">📄 Документ</a>`
    : '';

  const createdAt = e.created_at_strftime_full || '';
  const updatedAt = e.updated_at_strftime_full || '';

  const actions = del
    ? `<button class="btn btn-outline-success fw-bold" onclick="restoreEquipments(${e.id})">♻️ Восстановить</button>`
    : `
      <a class="btn btn-outline-success fw-bold" href="${infoUrlTemplate.replace(':id', e.id)}">ТО${e.type !== 'auxiliary' ? ' и Поверки' : ''}</a>
      <a class="btn btn-outline-info fw-bold" href="${copyUrlTemplate.replace(':id', e.id)}">📑 Скопировать</a>
      <a class="btn btn-outline-warning fw-bold" href="${updateUrlTemplate.replace(':id', e.id)}">🔄 Редактировать</a>
      <button class="btn btn-outline-danger fw-bold" onclick="deleteEquipments(${e.id}, '${(e.name || '').replace(/"/g, '&quot;')}')">🗑️ Удалить</button>`;

  div.innerHTML = `
    <div class="d-flex justify-content-between align-items-center">
      <h3 class="fs-lg m-0">${e.name || ''}</h3>
      ${del ? '<span class="badge text-bg-secondary">удалено</span>' : ''}
      ${pdfBtn}
    </div>
    <hr>
    <div class="d-flex align-items-start">
      <div class="me-4">${img1}${img2}</div>
      <div class="flex-grow-1 fs-base">
        ${createdAt ? `<p><strong>Создано:</strong> ${createdAt}</p>` : ''}
        ${updatedAt ? `<p><strong>Обновлено:</strong> ${updatedAt}</p>` : ''}
        ${e.type ? `<p>Тип: <b>${typeMap[e.type]}</b></p>` : ''}
        ${e.factory_number ? `<p>Заводской №: <b>${e.factory_number}</b></p>` : ''}
        ${e.inventory_number ? `<p>Инвентарный №: <b>${e.inventory_number}</b></p>` : ''}
        ${measurementBlock}
      </div>
    </div>
    <div class="mt-3">${actions}</div>`;
  col.append(div);
  return col;
}

function renderPaginationEquipments() {
  pagEl.innerHTML = '';
  const add = (text, page, disabled = false, active = false) => {
    const li = document.createElement('li');
    li.className = `page-item${disabled ? ' disabled' : ''}${active ? ' active' : ''}`;
    li.innerHTML = `<a class="page-link" href="#">${text}</a>`;
    if (!disabled) li.querySelector('a').addEventListener('click', e => {
      e.preventDefault();
      loadEquipments(page);
    });
    return li;
  };
  if (currentPage > 1) { pagEl.append(add('««', 1)); pagEl.append(add('«', currentPage - 1)); }
  pagEl.append(add('1', 1, false, currentPage === 1));
  const s = Math.max(2, currentPage - 2), e = Math.min(totalPages - 1, currentPage + 2);
  if (s > 2) pagEl.append(ellipsisEquipments());
  for (let p = s; p <= e; p++) pagEl.append(add(String(p), p, false, currentPage === p));
  if (e < totalPages - 1) pagEl.append(ellipsisEquipments());
  if (totalPages > 1) pagEl.append(add(String(totalPages), totalPages, false, currentPage === totalPages));
  if (currentPage < totalPages) { pagEl.append(add('»', currentPage + 1)); pagEl.append(add('»»', totalPages)); }
}

function ellipsisEquipments() {
  const li = document.createElement('li');
  li.className = 'page-item disabled';
  li.innerHTML = '<span class="page-link">…</span>';
  return li;
}

async function deleteEquipments(id, name) {
  if (!confirm(`Удалить оборудование "${name}"?`)) return;
  const res = await safeFetch(deleteUrlApi.replace(':id', id), { method: 'DELETE' }, 'equipments_delete');
  if (res?.ok) loadEquipments(currentPage);
  else alert('Ошибка при удалении');
}

async function restoreEquipments(id) {
  if (!confirm('Восстановить оборудование?')) return;
  const res = await safeFetch(restoreUrlApi.replace(':id', id), { method: 'POST' }, 'equipments_restore');
  if (res?.ok) loadEquipments(currentPage);
  else alert('Ошибка при восстановлении');
}

window.deleteEquipments = deleteEquipments;
window.restoreEquipments = restoreEquipments;

document.addEventListener("DOMContentLoaded", () => {
  const journalBtn = document.querySelector('.btn.btn-outline-danger.label-text');
  const modalEl = document.getElementById("equipmentHistoryModal");
  const modal = new bootstrap.Modal(modalEl);
  const downloadBtn = document.getElementById("downloadReportBtn");

  if (journalBtn) {
    journalBtn.addEventListener("click", e => {
      e.preventDefault();
      modal.show();
    });
  }

  downloadBtn.addEventListener("click", () => {
    const from = document.getElementById("dateFrom").value;
    const to = document.getElementById("dateTo").value;
    const force = document.getElementById("forceSignature").checked;

    if (!from || !to) return alert("Укажите обе даты: от и до");
    if (new Date(from) >= new Date(to)) return alert("Дата начала должна быть раньше даты окончания");

    const url = `/companies/api/equipments/equipment-history/export?company_id=${window.companyId}&date_from=${from}&date_to=${to}&force_signature=${force}`;
    window.location.href = url;
    modal.hide();
  });
});

import { fetchOrderDetail } from '/static/calendar/orders_calendar/js/api_requests.js';
import { openDetailModal } from '/static/calendar/orders_calendar/js/orders_calendar_detail.js';
import { openEditModal } from '/static/calendar/orders_calendar/js/orders_calendar_edit.js';
import { openDeleteModal } from '/static/calendar/orders_calendar/js/orders_calendar_delete.js';

let currentPage = 1;
const routeSelect = document.getElementById('route-filter');
const statusSelect = document.getElementById('status-filter');
const pageSizeSelect = document.getElementById('page-size');
const tableBody = document.getElementById('table-body');
const paginationUl = document.getElementById('pagination-ul');
const spinner = document.getElementById('spinner');
const refreshBtn = document.getElementById('refresh-btn');

const BASE_URL = `/calendar/api/orders/without-date`;

const showSpinner = () => spinner.classList.remove('d-none');
const hideSpinner = () => spinner.classList.add('d-none');

async function fetchRoutes() {
    const url = `${BASE_URL}/routes?company_id=${window.currentCompanyId}`;
    const res = await fetch(url, {
        credentials: 'include',
        mode: "cors",
    });
    if (!res.ok) {
        console.error("Ошибка загрузки маршрутов:", res.status);
        return;
    }
    const routes = await res.json();
    routes.forEach(r => {
        const opt = document.createElement('option');
        opt.value = r.id;
        opt.textContent = r.name;
        routeSelect.append(opt);
    });
}

async function fetchOrders() {
    showSpinner();
    const params = new URLSearchParams({
        company_id: window.currentCompanyId,
        page: currentPage,
        page_size: pageSizeSelect.value
    });
    if (routeSelect.value) params.append('route_id', routeSelect.value);
    if (statusSelect.value) params.append('status', statusSelect.value);

    const url = `${BASE_URL}/?${params}`;
    const res = await fetch(url, {
        credentials: 'include',
        mode: "cors",
    });
    if (!res.ok) {
        console.error("Ошибка загрузки заявок:", res.status);
        hideSpinner();
        return;
    }
    const data = await res.json();
    renderTable(data.items);
    renderPagination(data);
    hideSpinner();
}

function renderTable(items) {
    tableBody.innerHTML = '';
    if (!items.length) {
        tableBody.innerHTML = `
        <tr><td colspan="6" class="text-center py-4 text-muted">
          Нет доступных записей
        </td></tr>`;
        return;
    }
    items.forEach(o => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
        <td>
          <a href="#" class="address-link" data-id="${o.id}">
            ${o.address || ''}
          </a>
        </td>
        <td>${o.city?.name || ''}</td>
        <td>${o.phone_number || ''}</td>
        <td>${o.additional_info || ''}</td>
        <td>${o.date_of_get
                ? new Date(o.date_of_get).toLocaleString('ru-RU', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                })
                : ''
            }</td>
        <td>
          <select class="form-select form-select-sm status-select" data-id="${o.id}">
            <option value="false" ${o.status == 'approved' ? 'selected' : ''}>Согласовано ожидание</option>
            <option value="true"  ${o.status == 'pending' ? 'selected' : ''}>Принято</option>
          </select>
        </td>`;
        tableBody.append(tr);
    });

    // клик по адресу → открытие деталей
    tableBody.querySelectorAll('.address-link').forEach(link => {
        link.addEventListener('click', async e => {
            e.preventDefault();
            const id = link.dataset.id;
            await openDetailModal(parseInt(id, 10), null);
        });
    });

    tableBody.querySelectorAll('.status-select').forEach(sel => {
        sel.addEventListener('change', async () => {
            const orderId = sel.dataset.id;
            const newStatus = sel.value === 'true';

            const url = `${BASE_URL}/status?company_id=${window.currentCompanyId}&order_id=${orderId}`;
            const res = await fetch(url, {
                method: 'PATCH',
                credentials: 'include',
                mode: "cors",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (!res.ok) {
                alert('Не удалось обновить статус');
            }
        });
    });
}

function makeLi(inner, page, disabled = false, active = false) {
    const li = document.createElement('li');
    li.className = 'page-item' +
        (disabled ? ' disabled' : '') +
        (active ? ' active' : '');
    const a = document.createElement('a');
    a.className = 'page-link';
    a.href = '#';
    a.innerHTML = inner;
    a.addEventListener('click', async e => {
        e.preventDefault();
        if (!disabled && page !== currentPage) {
            currentPage = page;
            await fetchOrders();
        }
    });
    li.append(a);
    return li;
}

function renderPagination({ total_pages }) {
    paginationUl.innerHTML = '';
    paginationUl.append(makeLi('<i class="bi bi-skip-start"></i>', 1, currentPage <= 1));
    paginationUl.append(makeLi('<i class="bi bi-arrow-left-circle"></i>', currentPage - 1, currentPage <= 1));
    for (let p = 1; p <= total_pages; p++) {
        if (p === 1 || p === total_pages || Math.abs(p - currentPage) <= 2) {
            paginationUl.append(makeLi(p, p, false, p === currentPage));
        } else if (Math.abs(p - currentPage) === 3) {
            const ell = document.createElement('li');
            ell.className = 'page-item disabled';
            ell.innerHTML = '<span class="page-link">…</span>';
            paginationUl.append(ell);
        }
    }
    paginationUl.append(makeLi('<i class="bi bi-arrow-right-circle"></i>', currentPage + 1, currentPage >= total_pages));
    paginationUl.append(makeLi('<i class="bi bi-skip-end"></i>', total_pages, currentPage >= total_pages));
}

async function init() {
    await Promise.all([fetchRoutes(), fetchOrders()]);
    [routeSelect, statusSelect, pageSizeSelect].forEach(el =>
        el.addEventListener('change', async () => {
            currentPage = 1;
            await fetchOrders();
        })
    );
    refreshBtn.addEventListener('click', async () => {
        await fetchOrders();
    });
}

window.refreshCalendar = async (isoDate = null) => {
    currentPage = 1;
    await fetchOrders();
};

init();
import { openDetailModal } from '/static/calendar/orders_calendar/js/orders_calendar_detail.js';

const input = document.getElementById('searchInput');
const tbody = document.querySelector('#ordersTable tbody');
const paginationUl = document.getElementById('pagination-ul');
const spinner = document.getElementById('spinner');
let currentPage = 1;
const pageSize = 30;

const showSpinner = () => spinner.classList.remove('d-none');
const hideSpinner = () => spinner.classList.add('d-none');

async function loadData() {
    const query = input.value.trim();
    if (!query) {
        tbody.innerHTML = `
        <tr><td colspan="6" class="text-center text-muted py-4">
          Введите текст для поиска
        </td></tr>`;
        paginationUl.innerHTML = '';
        return;
    }

    showSpinner();
    try {
        const params = new URLSearchParams({
            company_id: window.currentCompanyId,
            search_query: query,
            page: currentPage,
            page_size: pageSize
        });
        const res = await fetch(`/calendar/api/orders/search/?${params}`,
            { credentials: 'include' }
        );
        if (!res.ok) throw new Error(`Ошибка загрузки: ${res.status}`);
        const data = await res.json();
        renderTable(data.items);
        renderPagination(data);
    } catch (err) {
        console.error(err);
    } finally {
        hideSpinner();
    }
}

function renderTable(items) {
    if (!items.length) {
        tbody.innerHTML = `
        <tr><td colspan="6" class="text-center text-muted py-4">
          Ничего не найдено
        </td></tr>`;
    } else {
        tbody.innerHTML = items.map(o => `
        <tr>
          <td><a href="#" class="id-link" data-id="${o.id}">${o.id}</a></td>
          <td>${o.address || ''}</td>
          <td>${o.city?.name || ''}</td>
          <td>${o.phone_number || ''}</td>
          <td>${o.additional_info || ''}</td>
          <td>${o.date || ''}</td>
        </tr>`).join('');
    }
    attachRowListeners();
}

function attachRowListeners() {
    tbody.querySelectorAll('.id-link').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            const id = Number(link.dataset.id);
            openDetailModal(id);
        });
    });
}

function renderPagination({ page, total_pages }) {
    currentPage = page;
    paginationUl.innerHTML = '';

    function makeLi(inner, target, disabled = false, active = false) {
        const li = document.createElement('li');
        li.className = 'page-item' + (disabled ? ' disabled' : '') + (active ? ' active' : '');
        const a = document.createElement('a');
        a.className = 'page-link';
        a.href = '#';
        a.innerHTML = inner;
        a.addEventListener('click', async e => {
            e.preventDefault();
            if (!disabled && currentPage !== target) {
                currentPage = target;
                await loadData();
            }
        });
        li.append(a);
        return li;
    }

    paginationUl.append(makeLi('<i class="bi bi-skip-start"></i>', 1, page <= 1));
    paginationUl.append(makeLi('<i class="bi bi-arrow-left-circle"></i>', page - 1, page <= 1));
    for (let p = 1; p <= total_pages; p++) {
        if (p === 1 || p === total_pages || Math.abs(p - page) <= 2) {
            paginationUl.append(makeLi(p, p, false, p === page));
        } else if (Math.abs(p - page) === 3) {
            const ell = document.createElement('li');
            ell.className = 'page-item disabled';
            ell.innerHTML = '<span class="page-link">…</span>';
            paginationUl.append(ell);
        }
    }
    paginationUl.append(makeLi('<i class="bi bi-arrow-right-circle"></i>', page + 1, page >= total_pages));
    paginationUl.append(makeLi('<i class="bi bi-skip-end"></i>', total_pages, page >= total_pages));
}

function debounce(fn, ms) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), ms);
    };
}

document.addEventListener('DOMContentLoaded', () => {
    input.addEventListener('input', debounce(async () => {
        currentPage = 1;
        await loadData();
    }, 300));
});

window.refreshCalendar = async function (isoDate = null) {
    currentPage = 1;
    await loadData();
};
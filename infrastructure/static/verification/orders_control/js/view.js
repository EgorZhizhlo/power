document.addEventListener('DOMContentLoaded', () => {
  const companyId = window.companyId;
  
  const apiListUrl    = '/verification/api/orders-control/';
  const apiCreateUrl  = '/verification/api/orders-control/counter-assignment';
  const apiDeleteBase = '/verification/api/orders-control/counter-assignment';

  const dateInput     = document.getElementById('date-input');
  const limitSelect   = document.getElementById('limit-select');
  const filterForm    = document.getElementById('filter-form');
  const resetBtn      = document.getElementById('reset-button');
  const totalEl       = document.getElementById('total-count');
  const pageEl        = document.getElementById('current-page');
  const tbody         = document.getElementById('orders-tbody');
  const paginationUl  = document.getElementById('pagination-ul');

  let toDeleteId = null;
  const deleteModal = new bootstrap.Modal(document.getElementById('deleteReasonModal'));
  const reasonForm  = document.getElementById('delete-reason-form');
  const reasonInput = document.getElementById('delete-reason-input');

  const LS_KEY = 'ordersSelectedDate';

  const defaultLimit = 30;

  const now  = new Date();
  const yyyy = now.getFullYear();
  const mm   = String(now.getMonth() + 1).padStart(2, '0');
  const dd   = String(now.getDate()).padStart(2, '0');
  const today = `${yyyy}-${mm}-${dd}`;

  const savedDate = localStorage.getItem(LS_KEY);
  dateInput.value = savedDate || today;
  limitSelect.value = defaultLimit;

  dateInput.addEventListener('change', () => {
    localStorage.setItem(LS_KEY, dateInput.value);
  });
  
  let currentPage  = 1;
  let currentDate  = today;
  let currentLimit = defaultLimit;

  async function addCounter(orderId) {
    const params = new URLSearchParams({
      company_id: companyId
    });
    const resp = await fetch(`${apiCreateUrl}?${params.toString()}`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ order_id: orderId })
    });
    if (!resp.ok) console.error('add error', resp.statusText);
    await loadOrders(currentPage);
  }

  tbody.addEventListener('click', e => {
    if (e.target.matches('.btn-rem')) {
      e.stopPropagation();
      toDeleteId = Number(e.target.closest('tr').dataset.counterAssignmentId);
      reasonInput.value = '';
      deleteModal.show();
    }
  });

  const downloadBtn = document.getElementById('download-button');

  downloadBtn.addEventListener('click', () => {
    const selectedDate = dateInput.value;
    if (!selectedDate) {
      alert("Сначала выберите дату!");
      return;
    }
    const params = new URLSearchParams({
        order_date: selectedDate,
        company_id: companyId,
    });
    window.location.href = `/verification/api/reports/orders-sheet/?${params.toString()}`;
  });

  reasonForm.addEventListener('submit', async ev => {
    ev.preventDefault();
    const additional = reasonInput.value.trim();
    if (!additional) return;
    deleteModal.hide();

    const params = new URLSearchParams({
      company_id: companyId,
      counter_assignment_id: toDeleteId
    });
    const resp = await fetch(`${apiDeleteBase}?${params.toString()}`, {
      method: 'DELETE',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ additional })
    });
    if (!resp.ok) console.error('remove error', resp.statusText);
    await loadOrders(currentPage);
  });

  async function loadOrders(page = 1) {
    currentPage  = page;
    currentDate  = dateInput.value;
    currentLimit = +limitSelect.value;

    const params = new URLSearchParams({ 
      company_id: companyId,
      date: currentDate, 
      page: currentPage, 
      limit: currentLimit 
    });
    const resp = await fetch(`${apiListUrl}?${params.toString()}`, { headers: {Accept: 'application/json'} });
    if (!resp.ok) { console.error('load error', resp.status); return; }
    const data = await resp.json();
    renderTable(data);
    renderPagination(data);
  }

  function renderTable({ orders, page, limit, total_count }) {
    totalEl.textContent = `Всего заявок: ${total_count}`;
    pageEl.textContent  = `Страница: ${page}`;

    tbody.innerHTML = '';
    if (!orders.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4">Нет заявок</td></tr>';
      return;
    }

    orders.forEach((o, idx) => {
      const tr = document.createElement('tr');
      tr.dataset.counterAssignmentId = o.counter_assignment_id;
      tr.style.cursor = 'pointer';

      tr.addEventListener('click', () => {
        const params = new URLSearchParams({
          company_id: companyId,
          order_id: o.id
        });
        window.location.href = `/verification/orders-control/create/?${params.toString()}`;
      });

      const rawName = o.client_full_name;
      const name = (!rawName || !rawName.trim() || rawName === 'None')
        ? 'Не указано'
        : rawName;

      const cityName = o.city && o.city.name ? o.city.name : '';
      const address  = o.address || '';
      const addressCell = cityName ? `${cityName}, ${address}` : address;

      tr.innerHTML = `
        <td class="text-center">${(page - 1)*limit + idx + 1}</td>
        <td>${addressCell}</td>
        <td>${name}</td>
        <td>${o.phone_number || ''}</td>
        <td class="text-center">
          <button class="btn btn-success btn-sm btn-add">+</button>
          <button class="btn btn-danger btn-sm btn-rem">−</button>
        </td>`;
      
      tr.querySelector('.btn-rem').addEventListener('click', e => {
        e.stopPropagation();
        toDeleteId = o.counter_assignment_id;
        reasonInput.value = '';
        deleteModal.show();
      });

      tr.querySelector('.btn-add').addEventListener('click', async e => {
        e.stopPropagation();
        await addCounter(o.id);
      });

      tbody.append(tr);
    });
  }

  function makeLi(label, tgt, disabled=false, active=false) {
    const li = document.createElement('li');
    li.className = 'page-item' + (disabled ? ' disabled' : '') + (active ? ' active' : '');
    if (disabled || active) {
      li.innerHTML = `<span class="page-link">${label}</span>`;
    } else {
      li.innerHTML = `<a class="page-link" href="#">${label}</a>`;
      li.firstChild.addEventListener('click', e => {
        e.preventDefault();
        loadOrders(tgt);
      });
    }
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

  filterForm.addEventListener('submit', async e => {
    e.preventDefault();
    await loadOrders(1);
  });
  
  resetBtn.addEventListener('click', async () => {
    localStorage.removeItem(LS_KEY);
    dateInput.value   = today;
    limitSelect.value = defaultLimit;
    await loadOrders(1);
  });

  loadOrders();
});

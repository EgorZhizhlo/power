import { fetchOrderDetail } from './api_requests.js';
import { openEditModal }   from './orders_calendar_edit.js';
import { openDeleteModal } from './orders_calendar_delete.js';

const modalEl   = document.getElementById('modalRequest');
const modal     = new bootstrap.Modal(modalEl);
const titleEl   = document.getElementById('modalRequestLabel');
const bodyEl    = document.getElementById('modalRequestBody');
const btnEdit   = document.getElementById('editRequest');
const btnDelete = document.getElementById('deleteRequest');

const btnPrev = document.getElementById('prevRequest');
const btnNext = document.getElementById('nextRequest');

// Храним текущие данные для слайдера
let orderIds       = [];
let currentIndex   = 0;
let currentDateISO = null;

function closeModal() {
  modal.hide();
  document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
  document.body.classList.remove('modal-open');
}

/**
 * Собирает id видимых карточек на странице,
 * фильтруя по .request-card и style.display !== 'none'
 */
function collectVisibleOrderIds() {
  orderIds = Array.from(document.querySelectorAll('.request-card'))
    .filter(card => card.style.display !== 'none')
    .map(card => Number(card.dataset.requestId));
}

/**
 * Открывает модалку с деталями заявки
 * @param {number} orderId
 * @param {string|null} initialDate — для обновления календаря в формате 'YYYY-MM-DD'
 */
export async function openDetailModal(orderId, initialDate = null) {
  collectVisibleOrderIds();
  currentIndex   = orderIds.indexOf(orderId);
  currentDateISO = initialDate;
  window.currentDate = initialDate;

  titleEl.textContent = 'Загрузка...';
  bodyEl.innerHTML = '<div class="text-center p-3"><div class="spinner-border"></div></div>';
  modal.show();

  btnPrev.disabled = orderIds.length === 0;
  btnNext.disabled = orderIds.length === 0;
  btnPrev.onclick = async () => {
    if (orderIds.length === 0) return;
    currentIndex = (currentIndex - 1 + orderIds.length) % orderIds.length;
    await openDetailModal(orderIds[currentIndex], currentDateISO);
  };
  btnNext.onclick = async () => {
    if (orderIds.length === 0) return;
    currentIndex = (currentIndex + 1) % orderIds.length;
    await openDetailModal(orderIds[currentIndex], currentDateISO);
  };

  const companyId = window.currentCompanyId;
  try {
    const { order } = await fetchOrderDetail(companyId, orderId);
    const p = window.companyCalendarParams;

    const employeeLine = order.employee
      ? `<div class="verifier-name text-truncate">
           ${order.employee.last_name} ${order.employee.name} ${order.employee.patronymic || ''}
         </div>`
      : '';

    let cityName = order.city?.name || '—';
    let addr     = order.address   || '—';

    titleEl.textContent = `Заявка №${order.id}`;
    let html = '<dl class="row">';
    html += `<dt class="col-sm-4">Дата</dt><dd class="col-sm-8">${order.no_date ? 'Без даты' : order.date}</dd>`;
    html += `<dt class="col-sm-4">Маршрут</dt><dd class="col-sm-8">${order.route?.name || 'Без маршрута'}</dd>`;
    html += `<dt class="col-sm-4">Город</dt><dd class="col-sm-8">${order.city?.name || '—'}</dd>`;
    html += `
      <dt class="col-sm-4">Адрес</dt>
      <dd class="col-sm-8">
        <button
          type="button"
          id="copyAddressBtn"
          class="btn p-0 text-start text-body"
          data-city="${cityName}"
          data-addr="${addr}"
        >
          ${addr}
        </button>
      </dd>
    `;
    if (p.customer_field) {
      html += `<dt class="col-sm-4">Заказчик</dt><dd class="col-sm-8">${order.client_full_name || '—'}</dd>`;
    }
    html += `<dt class="col-sm-4">Телефон</dt><dd class="col-sm-8">${order.phone_number || '—'}</dd>`;
    if (order.sec_phone_number) {
      html += `<dt class="col-sm-4">Доп. телефон</dt><dd class="col-sm-8">${order.sec_phone_number}</dd>`;
    }
    if (order.weight != null) {
      html += `<dt class="col-sm-4">Порядок исполнения</dt><dd class="col-sm-8">${order.weight}</dd>`;
    }
    if (p.customer_field) {
      html += `<dt class="col-sm-4">Юр. статус</dt><dd class="col-sm-8">${order.legal_entity === "legal" ? 'Юр. лицо' : 'Физ. лицо'}</dd>`;
    }
    if (order.counter_number != null) {
      html += `<dt class="col-sm-4">Кол-во счётчиков</dt><dd class="col-sm-8">${order.counter_number}</dd>`;
    }
    if (p.water_field) {
      const waterLabels = {
        cold: 'Холодная',
        hot: 'Горячая',
        cold_hot: 'Холодная и Горячая',
        unnamed: 'Неизвестно'
      };

      const waterText = waterLabels[order.water_type] || '—';
      html += `<dt class="col-sm-4">Тип воды</dt><dd class="col-sm-8">${waterText}</dd>`;
    }
    if (p.price_field) {
      html += `<dt class="col-sm-4">Цена</dt><dd class="col-sm-8">${order.price != null ? order.price : '—'}</dd>`;
    }
    if (order.additional_info) {
      const infoHtml = `<div style="white-space: pre-wrap; margin:0;">${order.additional_info}</div>`;
      html += `<dt class="col-sm-4">Доп. информация</dt><dd class="col-sm-8">${infoHtml}</dd>`;
    }
    html += '</dl>';

    bodyEl.innerHTML = `
      ${employeeLine}
      <div class="order-details">
        ${html}
      </div>
    `;

    btnEdit.onclick = async () => {
      closeModal();
      await openEditModal(orderId, initialDate || order.date);
    };
    const copyBtn = bodyEl.querySelector('#copyAddressBtn');
    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        // Берём данные из data-атрибутов
        const city    = copyBtn.dataset.city;
        const address = copyBtn.dataset.addr;
        const text    = `${city}, ${address}`;
        try {
          await navigator.clipboard.writeText(text);
          // Короткий фидбек пользователю
          copyBtn.textContent = '✅ Скопировано';
          setTimeout(() => {
            copyBtn.textContent = address;
          }, 1500);
        } catch (err) {
          console.error('Не удалось скопировать адрес:', err);
          // можно показывать пользователю alert или тултип
        }
      });
    }
    btnDelete.onclick = async () => {
      closeModal();
      await openDeleteModal(orderId, initialDate || order.date);
    };
    modal.show();
  } catch (err) {
    titleEl.textContent = 'Ошибка';
    bodyEl.innerHTML = `<div class="alert alert-danger">Не удалось загрузить заявку: ${err.message}</div>`;
  }
}

import {
  fetchOrderDetail,
  loadRoutesCities,
  updateOrder
} from './api_requests.js';
import {
  preparePhoneMasks,
  formatPhone,
  formatDateToISO
} from '/static/calendar/_utils/utils.js';

const modalEl        = document.getElementById('modalEditRequest');
const modal          = new bootstrap.Modal(modalEl);
const form           = document.getElementById('formEditRequest');

const routeSelect    = document.getElementById('editRoute');
const citySelect     = document.getElementById('editCity');
const addressInput   = document.getElementById('editAddress');
const phoneInput     = document.getElementById('editPhone');
const secPhoneInput  = document.getElementById('editSecPhone');
const clientInput    = document.getElementById('editClient');
const legalCheckbox  = document.getElementById('editLegal');
const counterInput   = document.getElementById('editCounter');
const waterSelect    = document.getElementById('editWater');
const priceInput     = document.getElementById('editPrice');
const infoInput      = document.getElementById('editInfo');
const dateInput      = document.getElementById('editDate');
const noDateCheckbox = document.getElementById('editNoDate');

function closeModal() {
  modal.hide();
  document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
  document.body.classList.remove('modal-open');
}

async function loadRoutes(date) {
  const prevRoute = routeSelect.value;
  const { routes } = await loadRoutesCities(window.currentCompanyId, date);
  routeSelect.innerHTML = '';
  routeSelect.append(new Option('Без маршрута', ''));
  routes.forEach(r => {
    const label = date === null 
      ? r.name 
      : `${r.name} (${r.busy ?? 0}/${r.day_limit})`;
    routeSelect.append(new Option(label, r.id));
  });
  if (prevRoute && [...routeSelect.options].some(opt => opt.value === prevRoute)) {
    routeSelect.value = prevRoute;
  }
}

export async function openEditModal(orderId, initialDate = null) {
  const companyId = window.currentCompanyId;
  const { order } = await fetchOrderDetail(companyId, orderId);
  const p = window.companyCalendarParams;

  const dateStr = order.no_date
    ? null
    : (initialDate || order.date || formatDateToISO(new Date()));

  const { cities } = await loadRoutesCities(companyId, dateStr);
  citySelect.innerHTML = '';
  cities.forEach(c => citySelect.append(new Option(c.name, c.id)));
  citySelect.value = order.city?.id ?? '';

  await loadRoutes(dateStr);
  routeSelect.value = order.route?.id ?? '';

  addressInput.value   = order.address || '';
  phoneInput.value     = order.phone_number ? formatPhone(order.phone_number) : '';
  secPhoneInput.value  = order.sec_phone_number ? formatPhone(order.sec_phone_number) : '';
  clientInput.value    = order.client_full_name || '';
  legalCheckbox.checked   = !!order.legal_entity;
  counterInput.value   = order.counter_number ?? '';
  waterSelect.value    = order.water_type;
  priceInput.value     = order.price != null ? order.price : '';
  infoInput.value      = order.additional_info || '';

  if (order.no_date) {
    noDateCheckbox.checked = true;
    dateInput.value        = '';
    dateInput.disabled     = true;
  } else {
    noDateCheckbox.checked = false;
    dateInput.disabled     = false;
    dateInput.value        = order.date || dateStr;
  }

  noDateCheckbox.onchange = async () => {
    if (noDateCheckbox.checked) {
      dateInput.value    = '';
      dateInput.disabled = true;
      await loadRoutes(null);
    } else {
      dateInput.disabled = false;
      dateInput.value    = formatDateToISO(new Date());
      await loadRoutes(dateInput.value);
    }
  };

  const clientGroup = clientInput.closest('.form-group');
  if (p.customer_field) {
    clientGroup.style.display    = '';
    clientInput.required         = p.customer_field_required;
  } else {
    clientGroup.style.display    = 'none';
    clientInput.required         = false;
    clientInput.value            = '';
  }

  const legalGroup = legalCheckbox.closest('.form-group');
  if (p.customer_field) {
    legalGroup.classList.remove('d-none');
  } else {
    legalGroup.classList.add('d-none');
  }

  const priceGroup = priceInput.closest('.form-group');
  if (p.price_field) {
    priceGroup.style.display    = '';
    priceInput.required         = p.price_field_required;
  } else {
    priceGroup.style.display    = 'none';
    priceInput.required         = false;
    priceInput.value            = '';
  }

  const waterGroup = waterSelect.closest('.form-group');
  if (p.water_field) {
    waterGroup.style.display    = '';
    waterSelect.required        = p.water_field_required;
  } else {
    waterGroup.style.display    = 'none';
    waterSelect.required        = false;
    waterSelect.value           = '';
  }

  preparePhoneMasks();
  form.dataset.orderId = orderId;
  modal.show();
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const orderId = Number(form.dataset.orderId);
  const p       = window.companyCalendarParams;

  const phoneVal  = phoneInput.value.trim();
  const phoneRegex = /^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/;
  if (!phoneRegex.test(phoneVal)) {
    alert('Номер телефона должен быть в формате +7 (XXX) XXX-XX-XX');
    phoneInput.focus();
    return;
  }

  if (!citySelect.value) {
    alert('Выберите город');
    return;
  }

  const clientName = p.customer_field
    ? clientInput.value.trim()
    : '';
  
  const waterType = p.water_field && waterSelect.value
    ? waterSelect.value
    : 'unnamed';
  
  const priceValue = p.price_field
    ? Number(priceInput.value)
    : 0;

  const payload = {
    route_id:           routeSelect.value || null,
    city_id:            citySelect.value,
    address:            addressInput.value.trim(),
    phone_number:       phoneVal,
    sec_phone_number:   secPhoneInput.value.trim() || null,
    client_full_name:   clientName,
    legal_entity:       legalCheckbox.checked ? 'legal' : 'individual',
    counter_number:     counterInput.value ? Number(counterInput.value) : null,
    water_type:         waterType,
    price:              priceValue,
    additional_info:    infoInput.value.trim() || null,
    no_date:            noDateCheckbox.checked,
    date:               noDateCheckbox.checked ? null : dateInput.value
  };  try {
    await updateOrder(window.currentCompanyId, orderId, payload);
    if (!payload.no_date && payload.date) {
      window.currentDate = payload.date;
    }
    await window.refreshCalendar(window.currentDate);
    closeModal();
  } catch (err) {
    console.error('Ошибка редактирования заявки:', err);
    alert(err.message || 'Неизвестная ошибка!');
  }
});

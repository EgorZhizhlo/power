import { fetchRoutes, fetchCities, createOrder } from './api_requests.js';
import { preparePhoneMasks, formatDateToISO } from '/static/calendar/_utils/utils.js';

const modalEl        = document.getElementById('modalCreateRequest');
const modal          = new bootstrap.Modal(modalEl);
const form           = document.getElementById('formCreateRequest');
const dateInput      = form.querySelector('#createDate');
const noDateCheckbox = form.querySelector('#createNoDate');
const routeSelect    = form.querySelector('#createRoute');
const citySelect     = form.querySelector('#createCity');
const addressInput   = form.querySelector('#createAddress');
const clientInput    = form.querySelector('#createClient');
const phoneInput     = form.querySelector('#createPhone');
const secPhoneInput  = form.querySelector('#createSecPhone');
const legalCheckbox  = form.querySelector('#createLegal');
const counterInput   = form.querySelector('#createCounter');
const waterSelect    = form.querySelector('#createWater');
const priceInput     = form.querySelector('#createPrice');
const infoInput      = form.querySelector('#createInfo');

function closeModal() {
  modal.hide();
  document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
  document.body.classList.remove('modal-open');
}

async function loadRouteStats(date) {
  const prevRoute = routeSelect.value;
  const routes = await fetchRoutes(window.currentCompanyId, date);
  routeSelect.innerHTML = `<option value="">Без маршрута</option>`;
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

export async function openCreateModal(initialDate = null) {
  const companyId      = window.currentCompanyId;
  const p              = window.companyCalendarParams;
  const todayStr       = formatDateToISO(new Date());
  const initialDateStr = initialDate || todayStr;
  window.currentDate = initialDateStr;

  const cities = await fetchCities(companyId);
  citySelect.innerHTML = '';
  cities.forEach(c => citySelect.append(new Option(c.name, c.id)));

  preparePhoneMasks();
  form.reset();
  noDateCheckbox.checked = false;
  dateInput.disabled     = false;
  dateInput.value        = initialDateStr;
  await loadRouteStats(initialDateStr);

  dateInput.onchange = async () => {
    if (!noDateCheckbox.checked && dateInput.value) {
      await loadRouteStats(dateInput.value);
    }
  };
  noDateCheckbox.onchange = async () => {
    if (noDateCheckbox.checked) {
      dateInput.value    = '';
      dateInput.disabled = true;
      await loadRouteStats(null);
    } else {
      dateInput.disabled = false;
      dateInput.value    = formatDateToISO(new Date());
      await loadRouteStats(dateInput.value);
    }
  };

  const clientGroup = clientInput.closest('.form-group');
  if (p.customer_field) {
    clientGroup.style.display = '';
    clientInput.required = p.customer_field_required;
  } else {
    clientGroup.style.display = 'none';
    clientInput.required    = false;
    clientInput.value       = '';
  }

  const legalGroup = legalCheckbox.closest('.form-group');
  if (p.customer_field) {
    legalGroup.classList.remove('d-none');
  } else {
    legalGroup.classList.add('d-none');
  }

  const priceGroup = priceInput.closest('.form-group');
  if (p.price_field) {
    priceGroup.style.display = '';
    priceInput.required      = p.price_field_required;
  } else {
    priceGroup.style.display = 'none';
    priceInput.required      = false;
    priceInput.value         = '';
  }

  const waterGroup = waterSelect.closest('.form-group');
  if (p.water_field) {
    waterGroup.style.display = '';
    waterSelect.required     = p.water_field_required;
  } else {
    waterGroup.style.display = 'none';
    waterSelect.required     = false;
    waterSelect.value        = '';
  }

  modal.show();
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const p = window.companyCalendarParams;

  const phoneVal   = phoneInput.value.trim();
  const phoneRegex = /^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/;
  if (!phoneRegex.test(phoneVal)) {
    alert('Номер телефона должен быть в формате +7 (XXX) XXX-XX-XX');
    phoneInput.focus();
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
    route_id:            routeSelect.value || null,
    city_id:             Number(citySelect.value),
    address:             addressInput.value.trim(),
    client_full_name:    clientName,
    phone_number:        phoneVal,
    sec_phone_number:    secPhoneInput.value.trim() || null,
    legal_entity:        legalCheckbox.checked ? 'legal' : 'individual',
    counter_number:      Number(counterInput.value) || 0,
    water_type:          waterType,
    price:               priceValue,
    additional_info:     infoInput.value.trim() || null,
    date:                noDateCheckbox.checked ? null : dateInput.value,
    no_date:             noDateCheckbox.checked,
  };

  try {
    await createOrder(window.currentCompanyId, payload);
    window.currentDate = payload.no_date ? null : payload.date;
    window.refreshCalendar(window.currentDate);
    closeModal();
  } catch (err) {
    console.error('Ошибка создания заявки:', err);
    alert(err.message); // показываем именно detail из JSON
  }
});

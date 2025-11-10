import {
  fetchCalendarOrders,
  fetchCalendarDayInfo,
  fetchDayComment,
  saveDayComment,
  patchReorderOrder,
  patchMoveOrder,
  fetchRoutes
} from './api_requests.js';
import { openCreateModal } from './orders_calendar_create.js';
import { openDetailModal } from './orders_calendar_detail.js';
import { formatDateToISO } from '/static/calendar/_utils/utils.js';

const userStatus = window.currentUserStatus;
const showDayInfo = userStatus !== 'dispatcher2';
const calendarModalEl = document.getElementById('modalCalendar');
const calendarModal = new bootstrap.Modal(calendarModalEl);
const commentModalEl = document.getElementById('modalDayComment');
const commentModal = new bootstrap.Modal(commentModalEl);

const today = new Date();
const months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const calendarGrid = document.getElementById('calendarGrid');
const monthLabel = document.getElementById('current-month-year');
const prevBtn = document.getElementById('prev-month');
const nextBtn = document.getElementById('next-month');
const createMainBtn = document.getElementById('btn-calendar-create');
const viewMonthBtn = document.getElementById('view-month');
const viewWeekBtn = document.getElementById('view-week');

let viewType = 'month';
let currentMonth = today.getMonth();
let currentYear = today.getFullYear();
let routeChoices = null;
let isRendering = false;

// понедельник недели
let currentWeekStart = (() => {
  const d = new Date();
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
})();

// --- КЭШ ---
let routesCache = {};
let ordersCache = {};

function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

async function getRoutes(date) {
  if (!routesCache[date]) {
    routesCache[date] = fetchRoutes(window.currentCompanyId, date);
  }
  return routesCache[date];
}
async function getOrders(date) {
  if (!ordersCache[date]) {
    ordersCache[date] = fetchCalendarOrders(window.currentCompanyId, date);
  }
  return ordersCache[date];
}

async function refreshWeekColumn(date) {
  const [routes, dayInfo, groups] = await Promise.all([
    getRoutes(date),
    showDayInfo
      ? fetchCalendarDayInfo(window.currentCompanyId, date, date)
      : Promise.resolve({}),
    getOrders(date)
  ]);

  // 2) find the column & wrapper
  const col = calendarGrid.querySelector(`.day-column[data-date="${date}"]`);
  const wrapper = col && col.querySelector('.weekly-day-group');
  if (!wrapper) return;

  // 3) clear out old cards
  wrapper.innerHTML = '';

  // 4) flatten, sort & re-append just like in renderWeek()
  const flat = [];
  (groups.orders || []).forEach(g =>
    g.orders.forEach(o =>
      flat.push({
        id: o.id,
        address: o.address,
        weight: o.weight,
        route_id: g.route_id,
        route_color: g.route_color,
        employee: g.employee
      })
    )
  );
  const routeOrder = routes.map(r => r.id);
  flat.sort((a, b) => {
    const ra = routeOrder.indexOf(a.route_id);
    const rb = routeOrder.indexOf(b.route_id);
    if (ra !== rb) return ra - rb;
    return a.weight - b.weight;
  });

  flat.forEach(o => {
    const card = document.createElement('div');
    card.className = 'card request-card mb-1 p-1';
    card.style.backgroundColor = `#${o.route_color}`;
    card.dataset.requestId = String(o.id);
    card.dataset.routeId = String(o.route_id);

    if (o.employee) {
      card.classList.add('has-employee');
      card.setAttribute('draggable', 'false');
      card.style.cursor = 'not-allowed';
    } else {
      card.setAttribute('draggable', 'true');
      card.style.cursor = 'pointer';
      card.addEventListener('dragstart', e => {
        e.dataTransfer.setData('application/json',
          JSON.stringify({ orderId: o.id, fromDate: date }));
      });
    }

    const initials = o.employee
      ? [o.employee.last_name, o.employee.name, o.employee.patronymic]
        .filter(Boolean)
        .map(n => n.charAt(0).toUpperCase() + '.')
        .join('')
      : '';
    card.innerHTML = `
      <div class="info text-truncate" style="font-size:calc(9px + 0.5vw)">
        ${initials}
      </div>
      <div style="font-size:calc(7px + 0.5vw)">${o.address}</div>
    `;
    card.addEventListener('click', () => openDetailModal(o.id, date));

    wrapper.appendChild(card);
  });
}


// Инициализация
document.addEventListener('DOMContentLoaded', async () => {
  const searchInput = document.getElementById('orderSearch');
  const routeFilterSelect = document.getElementById('routeFilter');

  if (searchInput) {
    const debounced = debounce(filterCards, 200);
    searchInput.addEventListener('input', debounced);
  }
  if (routeFilterSelect && window.Choices) {
    routeChoices = new Choices(routeFilterSelect, {
      removeItemButton: true,
      placeholderValue: 'Выберите маршруты',
      searchPlaceholderValue: 'Поиск маршрутов',
      shouldSort: false,
      itemSelectText: ''
    });
    routeFilterSelect.addEventListener('change', debounce(filterCards, 200));
  }

  // делегируем клик для детализации
  calendarGrid.addEventListener('click', async e => {
    const card = e.target.closest('.request-card');
    if (card) {
      const orderId = Number(card.dataset.requestId);
      const date = card.closest('.day-column').dataset.date;
      await openDetailModal(orderId, date);
    }
  });

  const prevCalBtn = document.getElementById('prevCalendarDay');
  const nextCalBtn = document.getElementById('nextCalendarDay');
  if (prevCalBtn) prevCalBtn.addEventListener('click', () => loadDayOffset(-1));
  if (nextCalBtn) nextCalBtn.addEventListener('click', () => loadDayOffset(1));

  const btnComm = document.getElementById('btn-day-comment');
  if (btnComm) {
    if (!showDayInfo) {
      btnComm.style.display = 'none';
    } else {
      btnComm.addEventListener('click', async () =>
        await openCommentModal(window.currentDate)
      );
    }
  }

  const btnSaveComm = document.getElementById('save-day-comment');
  if (btnSaveComm) btnSaveComm.addEventListener('click', async () => {
    const day = document.getElementById('comment-date').textContent;
    const text = document.getElementById('day-comment-text').value;
    try {
      await saveDayComment(window.currentCompanyId, day, text);
      commentModal.hide();
      calendarModal.hide();
      await renderCurrent();
    } catch (err) {
      console.error(err);
      alert('Не удалось сохранить комментарий: ' + err.message);
    }
  });
  await renderCurrent();
});

function loadDayOffset(offset) {
  const cur = window.currentDate ? new Date(window.currentDate) : new Date();
  cur.setDate(cur.getDate() + offset);
  loadDay(formatDateToISO(cur));
}

viewMonthBtn.addEventListener('click', async () => {
  if (viewType !== 'month') {
    viewType = 'month';
    viewWeekBtn.classList.remove('active');
    viewMonthBtn.classList.add('active');
    document.querySelector('.calendar-weekdays').style.display = '';
    await renderCurrent();
  }
});
viewWeekBtn.addEventListener('click', async () => {
  if (viewType !== 'week') {
    viewType = 'week';
    viewMonthBtn.classList.remove('active');
    viewWeekBtn.classList.add('active');
    document.querySelector('.calendar-weekdays').style.display = 'none';
    await renderCurrent();
  }
});

prevBtn.addEventListener('click', async () => {
  if (isRendering) return;
  isRendering = true;
  if (viewType === 'month') {
    currentMonth = (currentMonth + 11) % 12;
    if (currentMonth === 11) currentYear--;
    await renderCurrent();
  } else {
    currentWeekStart.setDate(currentWeekStart.getDate() - 7);
    await renderCurrent();
  }
  isRendering = false;
});
nextBtn.addEventListener('click', async () => {
  if (isRendering) return;
  isRendering = true;
  if (viewType === 'month') {
    currentMonth = (currentMonth + 1) % 12;
    if (currentMonth === 0) currentYear++;
    await renderCurrent();
  } else {
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    await renderCurrent();
  }
  isRendering = false;
});

createMainBtn.addEventListener('click', async () => {
  const date = window.currentDate || formatDateToISO(new Date());
  await openCreateModal(date);
});

async function refreshRouteStatsInModal(date) {
  // тянем свежие маршруты с busy/limit
  delete routesCache[date];
  const routes = await getRoutes(date);
  const byId = new Map(routes.map(r => [String(r.id), r]));

  // обновляем заголовки групп в модалке
  document.querySelectorAll('#modalContent .group-wrapper').forEach(g => {
    const rid = g.dataset.routeId;
    const r = byId.get(String(rid));
    if (!r) return;
    const h = g.querySelector('h6');
    if (!h) return;
    const capText = ` (${r.busy ?? 0}/${r.day_limit})`;
    h.textContent = `${g.dataset.routeName}${capText}`;
  });
}

async function refreshModalIfOpenFor(date) {
  if (!calendarModalEl.classList.contains('show')) return;
  const modalDate = document.getElementById('modalDate')?.textContent;
  if (modalDate === date) {
    await refreshRouteStatsInModal(modalDate);
  }
}

let renderVersion = 0;

async function renderCurrent() {
  const myVersion = ++renderVersion;

  routesCache = {};
  ordersCache = {};

  if (viewType === 'week') {
    return await renderWeek(myVersion);
  } else {
    return await renderMonth(myVersion);
  }
}

// --- Месячный вид ---
async function renderMonth(myVersion) {
  if (myVersion !== renderVersion) return;

  calendarGrid.style.display = 'none';
  calendarGrid.style.gridTemplateColumns = '';
  calendarGrid.innerHTML = '';
  document.querySelector('.calendar-weekdays').style.display = '';

  monthLabel.textContent = `${months[currentMonth]} ${currentYear}`;
  const firstIndex = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7;
  const daysCount = new Date(currentYear, currentMonth + 1, 0).getDate();
  const monthFrom = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
  const monthTo = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(daysCount).padStart(2, '0')}`;
  const rawDayInfo = showDayInfo
    ? await fetchCalendarDayInfo(window.currentCompanyId, monthFrom, monthTo)
    : {};
  if (myVersion !== renderVersion) return;

  const dayInfoMap = rawDayInfo || {};

  const frag = document.createDocumentFragment();
  for (let i = 0; i < firstIndex; i++) {
    frag.appendChild(document.createElement('div'));
  }
  for (let d = 1; d <= daysCount; d++) {
    const btn = document.createElement('button');
    btn.className = 'btn-date';
    const iso = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    btn.dataset.date = iso;
    btn.innerHTML = `
      <div class="day-number">${d}</div>
      ${showDayInfo ? `<div class="day-info">${dayInfoMap[iso] || ''}</div>` : ''}
    `;
    if (
      currentYear === today.getFullYear() &&
      currentMonth === today.getMonth() &&
      d === today.getDate()
    ) {
      btn.classList.add('active-day');
    }
    btn.addEventListener('click', () => loadDay(iso));
    frag.appendChild(btn);
  }
  calendarGrid.appendChild(frag);
  calendarGrid.style.display = '';
}

// --- Недельный вид с единым контейнером для заявок, сгруппированным и сортированным по маршрутам и весу ---
async function renderWeek(myVersion) {
  if (myVersion !== renderVersion) return;

  // 1. Диапазон недели
  const start = new Date(currentWeekStart);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  monthLabel.textContent = `${formatDateToISO(start)} — ${formatDateToISO(end)}`;

  // 2. Настройка CSS Grid
  calendarGrid.innerHTML = '';
  calendarGrid.style.display = 'grid';
  calendarGrid.style.gridTemplateColumns = 'repeat(7, 1fr)';
  calendarGrid.style.gridAutoRows = 'auto'; // строки под контент

  // 3. Массив ISO-дат недели
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return formatDateToISO(d);
  });

  // 4. Подгружаем за неделю: маршруты, инфо по дню, заявки
  const [allRoutes, dayInfoMapRaw, ordersList] = await Promise.all([
    Promise.all(days.map(d => getRoutes(d))),
    showDayInfo
      ? fetchCalendarDayInfo(window.currentCompanyId, days[0], days[6])
      : Promise.resolve({}),
    Promise.all(days.map(d => getOrders(d))),
  ]);

  // если отменили хотя бы один запрос — выходим
  if (
    allRoutes.some(r => r == null) ||
    ordersList.some(o => o == null)
  ) {
    return;
  }

  if (myVersion !== renderVersion) return;

  const dayInfoMap = dayInfoMapRaw || {};

  const frag = document.createDocumentFragment();

  days.forEach((date, idx) => {
    const col = document.createElement('div');
    col.className = 'day-column p-2';
    col.dataset.date = date;

    col.addEventListener('click', async e => {
      if (e.target.closest('.request-card')) return;
      await loadDay(date);
    });

    // заголовок дня
    const hdr = document.createElement('div');
    hdr.className = 'fw-bold mb-2 text-center';
    hdr.style.fontSize = 'calc(12px + 0.5vw)';
    const wd = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    const dt = new Date(date);
    hdr.textContent = `${wd[(dt.getDay() + 6) % 7]} ` +
      `${String(dt.getDate()).padStart(2, '0')}.` +
      `${String(dt.getMonth() + 1).padStart(2, '0')}`;
    col.appendChild(hdr);

    // инфокарточка дня
    if (showDayInfo && dayInfoMap[date]) {
      const info = document.createElement('div');
      info.className = 'card day-info-card mb-1 text-center';
      info.style.fontSize = 'calc(7px + 0.5vw)';
      info.textContent = dayInfoMap[date];
      col.appendChild(info);
    }

    // единый контейнер заявок
    const wrapper = document.createElement('div');
    wrapper.className = 'weekly-day-group mb-2';
    wrapper.dataset.date = date;
    wrapper.style.border = '1px dashed #ccc';
    wrapper.style.padding = '4px';


    // drag & drop
    Sortable.create(wrapper, {
      group: 'all-day',
      animation: 150,
      draggable: '.request-card:not(.has-employee)',
      preventOnFilter: true,
      onEnd: async evt => {
        const fromDate = evt.from.closest('.day-column').dataset.date;
        const toDate = evt.to.closest('.day-column').dataset.date;
        const oldIndex = evt.oldIndex;
        const newIndex = evt.newIndex;
        const orderId = Number(evt.item.dataset.requestId);
        const orderRoute = Number(evt.item.dataset.routeId);

        try {
          // перенос между днями
          if (fromDate !== toDate) {
            await patchMoveOrder(window.currentCompanyId, orderId, toDate);
          }

          // переупорядочивание внутри дня (или после переноса)
          if (fromDate !== toDate || oldIndex !== newIndex) {
            const cards = Array.from(evt.to.querySelectorAll('.request-card'));
            const newOrder = cards
              .filter(c => Number(c.dataset.routeId) === orderRoute)
              .map(c => Number(c.dataset.requestId));
            if (newOrder.length) {
              await patchReorderOrder(window.currentCompanyId, newOrder);
            }
          }

          // сброс кэша заявок для пересчёта порядка
          delete ordersCache[toDate];
          if (fromDate !== toDate) {
            delete ordersCache[fromDate];
          }

          // перерисуем неделю с актуальными данными
          await refreshWeekColumn(fromDate);
          if (fromDate !== toDate) {
            await refreshWeekColumn(toDate);
          }

          await refreshModalIfOpenFor(fromDate);
          if (fromDate !== toDate) {
            await refreshModalIfOpenFor(toDate);
          }
        } catch (err) {
          console.error('Ошибка при сохранении заявки:', err);

          // 1. Попробуем взять detail из err.response.data (axios/fetch)
          let detailMsg = '';
          if (err.response?.data?.detail) {
            detailMsg = err.response.data.detail;
          } else {
            // 2. Фолбэк: из err.message вытянем JSON и его поле detail
            const msg = err.message;
            const i = msg.indexOf('{');
            if (i !== -1) {
              try {
                const body = JSON.parse(msg.slice(i));
                detailMsg = body.detail || msg;
              } catch (_) {
                detailMsg = msg;
              }
            } else {
              detailMsg = msg;
            }
          }

          // 3. Показываем только содержимое detail
          alert(`Не удалось сохранить изменения:\n${detailMsg}`);

          // 4. Откатываем UI
          await refreshWeekColumn(fromDate);
          if (fromDate !== toDate) {
            await refreshWeekColumn(toDate);
          }
        }
      }
    });

    col.appendChild(wrapper);

    // ——— Формируем плоский массив заявок для рендера ———
    const rawGroups = ordersList[idx].orders || [];
    const flat = [];
    rawGroups.forEach(g => {
      g.orders.forEach(o => {
        flat.push({
          id: o.id,
          address: o.address,
          weight: o.weight,
          route_id: g.route_id,
          route_color: g.route_color,
          employee: g.employee
        });
      });
    });

    // порядок маршрутов, как в API
    const routeOrder = allRoutes[idx].map(r => r.id);

    // сортируем сначала по маршруту, потом по weight
    flat.sort((a, b) => {
      const ra = routeOrder.indexOf(a.route_id);
      const rb = routeOrder.indexOf(b.route_id);
      if (ra !== rb) return ra - rb;
      return a.weight - b.weight;
    });

    // рендерим все заявки
    flat.forEach(o => {
      const card = document.createElement('div');
      card.className = 'card request-card mb-1 p-1';
      card.style.backgroundColor = `#${o.route_color}`;
      card.dataset.requestId = String(o.id);
      card.dataset.routeId = String(o.route_id);

      if (o.employee) {
        card.classList.add('has-employee');
        card.setAttribute('draggable', 'false');
        card.style.cursor = 'not-allowed';
      } else {
        card.setAttribute('draggable', 'true');
        card.style.cursor = 'pointer';
        card.addEventListener('dragstart', e => {
          e.dataTransfer.setData('application/json',
            JSON.stringify({ orderId: o.id, fromDate: date }));
        });
      }

      card.innerHTML = `
        <div class="info text-truncate" style="font-size:calc(9px + 0.5vw)">
          ${o.employee
          ? [o.employee.last_name, o.employee.name, o.employee.patronymic]
            .filter(Boolean)
            .map(n => n.charAt(0).toUpperCase() + '.')
            .join('')
          : ''}
        </div>
        <div style="font-size:calc(7px + 0.5vw)">${o.address}</div>
      `;
      card.addEventListener('click', () => openDetailModal(o.id, date));
      wrapper.appendChild(card);
    });

    frag.appendChild(col);
  });

  calendarGrid.appendChild(frag);

  requestAnimationFrame(() => {
    // Соберём данные по всем колонкам
    const cols = Array.from(document.querySelectorAll('.day-column'));
    let maxTotal = 0;
    const info = cols.map(col => {
      const commentEl = col.querySelector('.day-info-card');
      const wrapper = col.querySelector('.weekly-day-group');
      const commentH = commentEl
        ? commentEl.getBoundingClientRect().height
        : 0;
      const wrapH = wrapper.getBoundingClientRect().height;
      const total = commentH + wrapH;
      if (total > maxTotal) maxTotal = total;
      return { wrapper, commentH };
    });

    // Теперь для каждой колонки подгоняем .weekly-day-group так,
    // чтобы commentH + wrapperH == maxTotal
    info.forEach(({ wrapper, commentH }) => {
      const needed = maxTotal - commentH;
      wrapper.style.minHeight = `${needed}px`;
    });
  });
}

// ----- Модалка дня -----
async function loadDay(iso) {
  window.currentDate = iso;
  await openCalendarInfo(iso);
}

async function openCalendarInfo(isoDate) {
  const data = await fetchCalendarOrders(window.currentCompanyId, isoDate);
  const dayDate = isoDate;
  const routes = await getRoutes(isoDate);
  const routeCapMap = new Map(
    (routes || []).map(r => [r.id, { busy: (r.busy ?? 0), total: r.day_limit }])
  );

  document.getElementById('modalDate').textContent = isoDate;
  document.getElementById('createRequest').onclick = async () => await openCreateModal(isoDate);
  const btn = document.getElementById('btn-day-comment');
  if (btn) btn.style.display = (isoDate && showDayInfo) ? '' : 'none';

  const container = document.getElementById('modalContent');
  const searchInput = document.getElementById('orderSearch');
  const routeFilterSelect = document.getElementById('routeFilter');

  if (container) container.innerHTML = '';
  if (searchInput) searchInput.value = '';

  if (routeChoices && routeFilterSelect) {
    routeChoices.clearStore();
    const uniqueRoutes = Array.from(
      new Map(
        data.orders.map(g => [g.route_id, g])
      ).values()
    );

    routeChoices.setChoices(
      uniqueRoutes.map(g => ({ value: g.route_name, label: g.route_name })),
      'value', 'label', true
    );
    routeChoices.removeActiveItems();
  }

  data.orders.forEach(group => {
    let groupDiv = container.querySelector(`.group-wrapper[data-route-id="${group.route_id}"]`);
    let cardsWrapper;

    if (!groupDiv) {
      groupDiv = document.createElement('div');
      groupDiv.className = 'group-wrapper';
      groupDiv.style.marginBottom = '1rem';
      groupDiv.dataset.routeName = group.route_name;
      groupDiv.dataset.routeId = group.route_id;

      const header = document.createElement('h6');
      let capText = '';
      if (group.route_id != null && routeCapMap.has(group.route_id)) {
        const cap = routeCapMap.get(group.route_id);
        capText = ` (${cap.busy}/${cap.total})`;
      }
      header.textContent = `${group.route_name}${capText}`;
      header.style.color = '#000';
      groupDiv.appendChild(header);

      cardsWrapper = document.createElement('div');
      cardsWrapper.className = 'd-flex flex-column gap-2';
      cardsWrapper.dataset.routeId = group.route_id;
      groupDiv.appendChild(cardsWrapper);

      container.appendChild(groupDiv);

      if (!group.employee) {
        // Инициализируем Sortable на этом списке
        Sortable.create(cardsWrapper, {
          group: {
            name: `route-${group.route_id}`,
            pull: false,
            put: false
          },
          animation: 150,
          handle: '.request-card',
          onEnd: async () => {
            const orderedIds = Array.from(
              cardsWrapper.querySelectorAll('.request-card')
            ).map(card => Number(card.dataset.requestId));
            try {
              await patchReorderOrder(
                window.currentCompanyId,
                orderedIds
              );
            } catch (err) {
              console.error(err);
              alert(err.message);
            }
          }
        });
      }
    } else {
      cardsWrapper = groupDiv.querySelector('.d-flex.flex-column');
    }

    group.orders.forEach(o => {
      const card = document.createElement('div');
      card.className = 'card request-card p-2';
      card.style.backgroundColor = `#${group.route_color}`;
      card.dataset.address = (o.address || '').toLowerCase();
      card.dataset.client = (o.client_full_name || '').toLowerCase();
      card.dataset.phone = (o.phone_number || '').toLowerCase();
      card.dataset.requestId = String(o.id);

      const employeeLine = group.employee
        ? [group.employee.last_name, group.employee.name, group.employee.patronymic]
          .filter(Boolean)
          .map(n => n.charAt(0).toUpperCase() + '.')
          .join('')
        + ' '
        : '';

      card.innerHTML = `
        <div class="info text-truncate">${employeeLine}</div>
        <div class="info text-truncate">${o.address}</div>
      `;

      card.style.cursor = 'pointer';
      card.addEventListener('click', () => {
        openDetailModal(o.id, isoDate);
      });

      if (group.employee) {
        card.setAttribute('draggable', 'false');
      } else {
        card.setAttribute('draggable', 'true');
        card.addEventListener('dragstart', e => {
          e.dataTransfer.setData(
            'application/json',
            JSON.stringify({
              orderId: o.id,
              fromDate: dayDate
            })
          );
        });
      }
      cardsWrapper.appendChild(card);
    });
  });

  if (!calendarModalEl.classList.contains('show')) {
    calendarModal.show();
  }
  filterCards();
  await refreshRouteStatsInModal(isoDate);
}

/**
 * Открывает модалку редактирования комментария на указанный день
 * @param {string} day — ISO-дата "YYYY-MM-DD"
 */
async function openCommentModal(day) {
  document.getElementById('comment-date').textContent = day;
  // загрузить существующий комментарий
  // 2) подгружаем уже существующий комментарий
  let existing = '';
  try {
    existing = await fetchDayComment(window.currentCompanyId, day);
  } catch (err) {
    console.error('Не удалось загрузить комментарий', err);
  }
  document.getElementById('day-comment-text').value = existing;
  // 3) открываем модалку
  commentModal.show();
}


// ----- Фильтрация -----
function filterCards() {
  const term = (document.getElementById('orderSearch')?.value || '').trim().toLowerCase();
  const selected = routeChoices ? routeChoices.getValue(true) : [];

  document.querySelectorAll('.group-wrapper').forEach(group => {
    const name = group.dataset.routeName;
    const matchRoute = !selected.length || selected.includes(name);
    let anyVisible = false;

    group.querySelectorAll('.request-card').forEach(card => {
      const textMatch = !term
        || card.dataset.address.includes(term)
        || card.dataset.client.includes(term)
        || card.dataset.phone.includes(term);
      const vis = matchRoute && textMatch;
      card.style.display = vis ? '' : 'none';
      if (vis) anyVisible = true;
    });

    group.style.display = anyVisible ? '' : 'none';
  });
}

window.refreshCalendar = async (isoDate = null) => {
  if (isoDate === window.currentDate) {
    await openCalendarInfo(isoDate);      // перерендер модалки
  }
  await renderCurrent();                   // перерендер сетки (месяц/неделя)

  // если модалка открыта — подтянем свежую статистику
  const modalDate = document.getElementById('modalDate')?.textContent;
  if (calendarModalEl.classList.contains('show') && modalDate) {
    await refreshRouteStatsInModal(modalDate);
  }
};

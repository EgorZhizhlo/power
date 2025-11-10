const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

const controllers = new Map();

function abortableFetch(key, url, options = {}) {
  if (controllers.has(key)) {
    controllers.get(key).abort();
  }
  const controller = new AbortController();
  controllers.set(key, controller);

  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => {
      controllers.delete(key);
    });
}

async function handleErrors(res) {
  if (!res.ok) {
    let detail = `Ошибка HTTP: ${res.status}`;
    try {
      const data = await res.clone().json();
      if (data && data.detail) {
        detail = data.detail;
      }
    } catch {
      try {
        const text = await res.clone().text();
        if (text) {
          detail = text;
        }
      } catch {}
    }
    throw new Error(detail);
  }
  return res;
}

export async function patchReorderOrder(companyId, orderedIds) {
  const url = new URL(`/calendar/api/orders/calendar/actions/reweight`, window.location.origin);
  url.searchParams.set('company_id', companyId);

  const res = await fetch(url, {
    method: 'PATCH',
    headers: JSON_HEADERS,
    body: JSON.stringify({ ordered_ids: orderedIds }),
  });
  await handleErrors(res);
}

export async function patchMoveOrder(companyId, orderId, newDate) {
  const url = new URL(`/calendar/api/orders/calendar/actions/move`, window.location.origin);
  url.searchParams.set('company_id', companyId);
  url.searchParams.set('order_id', orderId);
  url.searchParams.set('new_date', newDate);

  const res = await fetch(url, { method: 'PATCH', headers: JSON_HEADERS });
  await handleErrors(res);
}

// ========================
// Routes & Cities
// ========================

export async function fetchRoutes(companyId, targetDate = null) {
  const url = new URL(`/calendar/api/orders/calendar/routes`, window.location.origin);
  url.searchParams.set('company_id', companyId);
  if (targetDate) url.searchParams.set('target_date', targetDate);

  try {
    const res = await abortableFetch(`routes:${companyId}:${targetDate || 'null'}`, url, { headers: JSON_HEADERS });
    await handleErrors(res);
    return res.json();
  } catch (err) {
    if (err.name === 'AbortError') {
      return null;
    }
    throw err;
  }
}

export async function fetchCities(companyId) {
  const url = new URL(`/calendar/api/orders/calendar/cities`, window.location.origin);
  url.searchParams.set('company_id', companyId);

  const res = await fetch(url, { headers: JSON_HEADERS });
  await handleErrors(res);
  return res.json();
}

export async function loadRoutesCities(companyId, targetDate = null) {
  const [routes, cities] = await Promise.all([
    fetchRoutes(companyId, targetDate),
    fetchCities(companyId),
  ]);
  return { routes, cities };
}

// ========================
// Calendar Orders
// ========================
export async function fetchCalendarOrders(companyId, targetDate) {
  if (!targetDate) throw new Error('targetDate is required');
  const url = new URL(`/calendar/api/orders/calendar/`, window.location.origin);
  url.searchParams.set('company_id', companyId);
  url.searchParams.set('target_date', targetDate);
  try {
    const res = await abortableFetch(`calendarOrders:${companyId}:${targetDate}`, url, { headers: JSON_HEADERS });
    await handleErrors(res);
    return res.json();
  } catch (err) {
    if (err.name === 'AbortError') {
      return null; // просто молча выходим
    }
    throw err;
  }
}

export async function fetchDayComment(companyId, day) {
  if (window.currentUserStatus === 'dispatcher2') return '';
  const url = new URL(`/calendar/api/day-info/`, window.location.origin);
  url.searchParams.set('company_id', companyId);
  url.searchParams.set('date_info', day);

  const res = await fetch(url, { headers: JSON_HEADERS });
  await handleErrors(res);
  const data = await res.json();
  return data?.day_info ?? "";
}

export async function saveDayComment(companyId, day, comment) {
  if (window.currentUserStatus === 'dispatcher2') return;
  const url = new URL(`/calendar/api/day-info/upsert`, window.location.origin);
  url.searchParams.set('company_id', companyId);
  url.searchParams.set('date_info', day);

  const res = await fetch(url, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ day_info: comment }),
  });
  await handleErrors(res);
}

export async function fetchCalendarDayInfo(companyId, dateFrom, dateTo) {
  if (window.currentUserStatus === 'dispatcher2') return {};
  const url = new URL(`/calendar/api/day-info/period`, window.location.origin);
  url.searchParams.set('company_id', companyId);
  url.searchParams.set('date_for', dateFrom);
  url.searchParams.set('date_to', dateTo);
  
  try {
    const res = await abortableFetch(
      `dayInfo:${companyId}:${dateFrom}:${dateTo}`,
      url,
      { headers: JSON_HEADERS }
    );
    await handleErrors(res);
    return res.json();
  } catch (err) {
    if (err.name === 'AbortError') {
      return {}; // молча игнорим
    }
    throw err;
  }
}

export async function fetchOrderDetail(companyId, orderId) {
  const url = new URL(`/calendar/api/orders/calendar/order`, window.location.origin);
  url.searchParams.set('company_id', companyId);
  url.searchParams.set('order_id', orderId);

  const res = await fetch(url, { headers: JSON_HEADERS });
  await handleErrors(res);
  return res.json();
}

export async function createOrder(companyId, payload) {
  const url = new URL(`/calendar/api/orders/calendar/order/create`, window.location.origin);
  url.searchParams.set('company_id', companyId);

  const res = await fetch(url, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  });
  await handleErrors(res);
  return res.json();
}

export async function updateOrder(companyId, orderId, payload) {
  const url = new URL(`/calendar/api/orders/calendar/order/update`, window.location.origin);
  url.searchParams.set('company_id', companyId);
  url.searchParams.set('order_id', orderId);

  const res = await fetch(url, {
    method: 'PUT',
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  });
  await handleErrors(res);
  return res.json();
}

export async function deleteOrder(companyId, orderId) {
  const url = new URL(`/calendar/api/orders/calendar/order/delete`, window.location.origin);
  url.searchParams.set('company_id', companyId);
  url.searchParams.set('order_id', orderId);

  const res = await fetch(url, { method: 'DELETE', headers: JSON_HEADERS });
  await handleErrors(res);
  return res.json();
}

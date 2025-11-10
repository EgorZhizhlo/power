const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

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

export async function fetchRoutes(companyId, targetDate = null) {
  const url = new URL(`/calendar/api/orders/calendar/routes`, window.location.origin);
  url.searchParams.set('company_id', companyId);
  if (targetDate) url.searchParams.set('target_date', targetDate);

  const res = await fetch(url, { headers: JSON_HEADERS });
  await handleErrors(res);
  return res.json();
}

export async function fetchOrderingRoutes(companyId, routes, targetDate) {
  const url = new URL(`/calendar/api/orders/planning/routes`, window.location.origin);
  url.searchParams.set('company_id', companyId);
  routes.forEach(r => url.searchParams.append('routes', r));
  url.searchParams.set('target_date', targetDate);

  const res = await fetch(url, { headers: JSON_HEADERS });
  await handleErrors(res);
  return res.json();
}

export async function fetchOrderingOrders(companyId, routes, targetDate) {
  const url = new URL(`/calendar/api/orders/planning/`, window.location.origin);
  url.searchParams.set('company_id', companyId);
  routes.forEach(r => url.searchParams.append('routes', r));
  url.searchParams.set('target_date', targetDate);

  const res = await fetch(url, { headers: JSON_HEADERS });
  await handleErrors(res);
  return res.json();
}

export async function fetchOrderingEmployees(companyId, date) {
  const url = new URL(`/calendar/api/orders/planning/employees`, window.location.origin);
  url.searchParams.set('company_id', companyId);
  url.searchParams.set('date', date);

  const res = await fetch(url, { headers: JSON_HEADERS });
  await handleErrors(res);
  return res.json();
}

export async function fetchAssignments(companyId, routes, targetDate) {
  const url = new URL(`/calendar/api/orders/planning/employees-with-assignment`, window.location.origin);
  url.searchParams.set('company_id', companyId);
  routes.forEach(r => url.searchParams.append('routes', r));
  url.searchParams.set('target_date', targetDate);

  const res = await fetch(url, { headers: JSON_HEADERS });
  await handleErrors(res);
  return res.json();
}

export async function upsertAssignment(companyId, payload) {
  const url = new URL(`/calendar/api/orders/planning/employee-assignment`, window.location.origin);
  url.searchParams.set('company_id', companyId);

  const res = await fetch(url, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  });
  await handleErrors(res);
  return res.json();
}

export async function reorderOrder(companyId, payload) {
  const url = new URL(`/calendar/api/orders/planning/reorder`, window.location.origin);
  url.searchParams.set('company_id', companyId);

  const res = await fetch(url, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  });
  await handleErrors(res);
  return res.json();
}

export async function fetchRouteAdditional(companyId, routes, targetDate) {
  const url = new URL(`/calendar/api/orders/planning/route-additional`, window.location.origin);
  url.searchParams.set('company_id', companyId);
  routes.forEach(r => url.searchParams.append('routes', r));
  url.searchParams.set('target_date', targetDate);

  const res = await fetch(url, { headers: JSON_HEADERS });
  await handleErrors(res);
  return res.json();
}

export async function upsertRouteAdditional(companyId, payload) {
  const url = new URL(`/calendar/api/orders/planning/route-additional`, window.location.origin);
  url.searchParams.set('company_id', companyId);

  const res = await fetch(url, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  });
  await handleErrors(res);
  return res.json();
}

export function downloadOrderingCsv(companyId, routeId, date) {
  const url = new URL(`/calendar/api/orders/planning/download-report-route-orders-list`, window.location.origin);
  url.searchParams.set("company_id", companyId);
  url.searchParams.set("route_id", routeId);
  url.searchParams.set("date", date);

  // просто открываем — браузер сам скачает с корректным именем из Content-Disposition
  window.open(url.toString(), "_blank");
}

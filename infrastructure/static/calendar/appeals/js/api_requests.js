const API_ROOT = `/calendar/api/appeals`;

export async function fetchAppeals({ page, page_size, status_filter }) {
    const url = new URL(`${API_ROOT}/`, window.location.origin);
    url.searchParams.set('company_id', window.companyId);
    url.searchParams.set('page', page);
    url.searchParams.set('page_size', page_size);
    if (status_filter) url.searchParams.set('status_filter', status_filter);

    const res = await fetch(url.href, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) throw new Error(`Ошибка ${res.status}: не удалось получить список`);
    return res.json();
}

export async function fetchAppeal(id) {
    const url = new URL(`${API_ROOT}/appeal`, window.location.origin);
    url.searchParams.set('company_id', window.companyId);
    url.searchParams.set('appeal_id', id);

    const res = await fetch(url.href, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) throw new Error(`Ошибка ${res.status}: не удалось загрузить обращение`);
    return res.json();
}

export async function createAppeal(payload) {
    const url = new URL(`${API_ROOT}/appeal/create`, window.location.origin);
    url.searchParams.set('company_id', window.companyId);

    const res = await fetch(url.href, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`Ошибка ${res.status}: не удалось создать`);
    return res.json();
}

export async function updateAppeal(id, payload) {
    const url = new URL(`${API_ROOT}/appeal/update`, window.location.origin);
    url.searchParams.set('company_id', window.companyId);
    url.searchParams.set('appeal_id', id);

    const res = await fetch(url.href, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`Ошибка ${res.status}: не удалось сохранить`);
    return res.json();
}

export async function deleteAppeal(id) {
    const url = new URL(`${API_ROOT}/appeal/delete`, window.location.origin);
    url.searchParams.set('company_id', window.companyId);
    url.searchParams.set('appeal_id', id);

    const res = await fetch(url.href, { method: 'DELETE' });
    if (!res.ok) throw new Error(`Ошибка ${res.status}: не удалось удалить`);
}

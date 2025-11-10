

const activeRequests = new Map();

/**
 * Универсальный безопасный fetch с поддержкой отмены и обработкой ошибок.
 *
 * @param {string} url — адрес запроса
 * @param {object} [options] — опции fetch (method, body, headers и т.п.)
 * @param {string} [key] — уникальный ключ запроса (например: "verifiers" или "search"). 
 *                         Если указать — предыдущий запрос с тем же ключом отменится.
 * @returns {Promise<Response>} — возвращает ответ (res), который можно .json() / .text()
 */
export async function safeFetch(url, options = {}, key = 'default') {
  // отменяем предыдущий запрос с тем же ключом, если есть
  if (activeRequests.has(key)) {
    activeRequests.get(key).abort();
  }

  const controller = new AbortController();
  activeRequests.set(key, controller);

  try {
    const res = await fetch(url, { ...options, signal: controller.signal, credentials: 'same-origin' });

    if (!res.ok) {
      // Пробуем достать текст ошибки из JSON, если он есть
      let msg = `Ошибка ${res.status}`;
      try {
        const data = await res.json();
        msg = data?.detail || msg;
      } catch {
        msg = await res.text() || msg;
      }
      throw new Error(msg);
    }

    return res; // всё хорошо
  
  } catch (err) {
    if (err.name === 'AbortError' || err.message === 'Load failed' || err.message === 'The user aborted a request.') {
      // Прерывание запроса — не считаем ошибкой
      return null;
    }

    console.error('Fetch error:', err);
    alert(err.message || 'Ошибка запроса');
    return null;
  } finally {
    activeRequests.delete(key);
  }
}

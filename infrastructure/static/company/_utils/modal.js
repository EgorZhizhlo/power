/**
 * Показывает модальное окно с ошибкой
 * @param {string} message - Текст ошибки для отображения
 */
export function showErrorModal(message) {
  const modalHtml = `
    <div class="modal fade" id="errorModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header bg-danger text-white">
            <h5 class="modal-title">Ошибка</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <p>${message}</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Закрыть</button>
          </div>
        </div>
      </div>
    </div>`;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  const modal = new bootstrap.Modal(document.getElementById('errorModal'));
  modal.show();
  document.getElementById('errorModal').addEventListener('hidden.bs.modal', () => {
    document.getElementById('errorModal').remove();
  });
}

/**
 * Парсит ошибку из ответа API
 * @param {Response} response - Fetch response объект
 * @param {string} fallback - Сообщение по умолчанию
 * @returns {Promise<string>} - Текст ошибки
 */
export async function parseErrorMessage(response, fallback = 'Произошла ошибка') {
  try {
    const text = await response.text();
    if (!text) return fallback;
    try {
      const errorJson = JSON.parse(text);
      return errorJson.detail || fallback;
    } catch {
      return text || fallback;
    }
  } catch {
    return fallback;
  }
}

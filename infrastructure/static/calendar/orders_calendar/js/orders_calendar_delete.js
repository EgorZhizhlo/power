import { deleteOrder } from './api_requests.js';

const modalEl    = document.getElementById('modalConfirmDelete');
const modal      = new bootstrap.Modal(modalEl);
const btnConfirm = document.getElementById('confirmDelete');

/**
 * Универсальная ф-ция закрытия любого модального окна
 */
function closeModal() {
  modal.hide();
  document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
  document.body.classList.remove('modal-open');
}

/**
 * Открывает модалку подтверждения удаления заявки
 */
export async function openDeleteModal(orderId, initialDate = null) {
  btnConfirm.onclick = async () => {
    const companyId = window.currentCompanyId;
    try {
      await deleteOrder(companyId, orderId);

      // Обновляем «список без дат» или текущий день:
      if (typeof window.refreshCalendar === 'function') {
        await window.refreshCalendar(window.currentDate);
      }

      closeModal();
    } catch (err) {
      console.error('Ошибка удаления заявки:', err);
      alert(err.message); // показываем именно detail из JSON
    }
  };
  modal.show();
}

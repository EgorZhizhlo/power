import { fetchAppeal, updateAppeal } from './api_requests.js';
import { preparePhoneMasks } from '/static/calendar/_utils/utils.js';

export async function openEditModal(id) {
    const modalEl = document.getElementById('modal-edit');
    const modal = new bootstrap.Modal(modalEl);
    const form = document.getElementById('form-edit');

    try {
        const app = await fetchAppeal(id);

        // Заполняем только те поля, что в DOM
        const clientEl = document.getElementById('edit-client');
        if (clientEl) clientEl.value = app.client_full_name || '';

        document.getElementById('edit-id').value = app.id;
        document.getElementById('edit-address').value = app.address || '';
        document.getElementById('edit-phone').value = app.phone_number || '';
        document.getElementById('edit-info').value = app.additional_info || '';
        document.getElementById('edit-status').value = app.status ?? '';

        preparePhoneMasks();
        modal.show();

        form.onsubmit = async e => {
            e.preventDefault();

            const clientVal = (() => {
                const el = document.getElementById('edit-client');
                return el ? el.value.trim() : null;
            })();

            const payload = {
                client_full_name: clientVal,
                address: document.getElementById('edit-address').value.trim(),
                phone_number: document.getElementById('edit-phone').value.trim(),
                additional_info: document.getElementById('edit-info').value.trim(),
                status: parseInt(document.getElementById('edit-status').value, 10)
            };

            try {
                await updateAppeal(id, payload);
                modal.hide();
                await window.loadAppeals();
            } catch (err) {
                alert('Ошибка сохранения: ' + err.message);
            }
        };
    } catch (err) {
        alert('Не удалось загрузить данные для редактирования: ' + err.message);
    }
}

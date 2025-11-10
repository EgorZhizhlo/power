document.getElementById('editTariffForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const tariffId = e.target.dataset.tariffId;
    const formData = new FormData(e.target);
    
    const data = {};
    
    const title = formData.get('title').trim();
    if (title) data.title = title;
    
    const description = formData.get('description').trim();
    data.description = description || null;

    const maxEmployees = formData.get('max_employees');
    data.max_employees = maxEmployees !== '' ? parseInt(maxEmployees) : null;

    const maxVerifications = formData.get('max_verifications_per_month');
    data.max_verifications_per_month = maxVerifications !== '' ? parseInt(maxVerifications) : null;
    
    const maxOrders = formData.get('max_orders_per_month');
    data.max_orders_per_month = maxOrders !== '' ? parseInt(maxOrders) : null;
    
    data.auto_manufacture_year = formData.get('auto_manufacture_year') === 'on';
    data.auto_teams = formData.get('auto_teams') === 'on';
    data.auto_metrolog = formData.get('auto_metrolog') === 'on';

    try {
        const response = await fetch(`/tariff/api/base-tariffs/?tariff_id=${tariffId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            alert('Тариф успешно обновлён');
            window.location.href = '/tariff/base-tariffs/';
        } else {
            const error = await response.json();
            alert(`Ошибка при обновлении тарифа: ${error.detail || 'Неизвестная ошибка'}`);
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Произошла ошибка при обновлении тарифа');
    }
});

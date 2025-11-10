document.getElementById('createTariffForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    
    const data = {
        title: formData.get('title').trim(),
        description: formData.get('description').trim() || null,
        max_employees: formData.get('max_employees') !== '' ? parseInt(formData.get('max_employees')) : null,
        max_verifications_per_month: formData.get('max_verifications_per_month') !== '' ? 
            parseInt(formData.get('max_verifications_per_month')) : null,
        max_orders_per_month: formData.get('max_orders_per_month') !== '' ? 
            parseInt(formData.get('max_orders_per_month')) : null,
        auto_manufacture_year: formData.get('auto_manufacture_year') === 'on',
        auto_teams: formData.get('auto_teams') === 'on',
        auto_metrolog: formData.get('auto_metrolog') === 'on'
    };

    try {
        const response = await fetch('/tariff/api/base-tariffs/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            alert('Тариф успешно создан');
            window.location.href = '/tariff/base-tariffs/';
        } else {
            const error = await response.json();
            alert(`Ошибка при создании тарифа: ${error.detail || 'Неизвестная ошибка'}`);
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Произошла ошибка при создании тарифа');
    }
});

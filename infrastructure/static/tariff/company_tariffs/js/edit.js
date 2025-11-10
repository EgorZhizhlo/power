const validFromInput = document.getElementById('valid_from');
const validToInput = document.getElementById('valid_to');
const durationInput = document.getElementById('duration_months');

// При загрузке страницы: вычислить месяцы из разницы дат
function initializeDuration() {
    const validFrom = validFromInput.value;
    const validTo = validToInput.value;
    
    if (validFrom && validTo) {
        const fromDate = new Date(validFrom);
        const toDate = new Date(validTo);
        const diffDays = Math.round((toDate - fromDate) / (1000 * 60 * 60 * 24));
        
        if (diffDays > 0) {
            const months = Math.floor(diffDays / 30);
            durationInput.value = months;
        }
    }
}

// Расчет valid_to из valid_from + месяцы
function calculateValidTo() {
    const months = parseInt(durationInput.value);
    const validFrom = validFromInput.value;
    
    if (months > 0 && validFrom) {
        const fromDate = new Date(validFrom);
        const daysToAdd = months * 30;
        const toDate = new Date(fromDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
        
        const year = toDate.getFullYear();
        const month = String(toDate.getMonth() + 1).padStart(2, '0');
        const day = String(toDate.getDate()).padStart(2, '0');
        
        validToInput.value = `${year}-${month}-${day}`;
    }
}

// Расчет месяцев из разницы дат
function calculateDuration() {
    const validFrom = validFromInput.value;
    const validTo = validToInput.value;
    
    if (validFrom && validTo) {
        const fromDate = new Date(validFrom);
        const toDate = new Date(validTo);
        const diffDays = Math.round((toDate - fromDate) / (1000 * 60 * 60 * 24));
        
        if (diffDays > 0 && diffDays % 30 !== 0) {
            alert(`Разница между датами должна быть кратна 30 дням! Сейчас: ${diffDays} дней`);
            validToInput.value = '';
            durationInput.value = '';
            return;
        }
        
        if (diffDays > 0) {
            const months = Math.floor(diffDays / 30);
            durationInput.value = months;
        } else if (diffDays < 0) {
            alert('Дата окончания не может быть раньше даты начала');
            validToInput.value = '';
            durationInput.value = '';
        }
    }
}

// События
// Инициализация при загрузке: вычислить месяцы из разницы дат
initializeDuration();

validFromInput.addEventListener('change', () => {
    // Если есть количество месяцев, пересчитываем valid_to
    if (durationInput.value) {
        calculateValidTo();
    } 
    // Если есть valid_to, пересчитываем месяцы
    else if (validToInput.value) {
        calculateDuration();
    }
});

durationInput.addEventListener('input', () => {
    // При изменении месяцев всегда пересчитываем valid_to от valid_from
    calculateValidTo();
});

validToInput.addEventListener('change', calculateDuration);

document.getElementById('editTariffForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const companyId = e.target.dataset.companyId;
    const formData = new FormData(e.target);
    
    const validFrom = formData.get('valid_from');
    const validTo = formData.get('valid_to');
    
    if (validFrom && validTo) {
        const fromDate = new Date(validFrom);
        const toDate = new Date(validTo);
        const diffDays = Math.round((toDate - fromDate) / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 0) {
            alert('Дата окончания должна быть позже даты начала');
            return;
        }
        
        if (diffDays % 30 !== 0) {
            alert(`Разница между датами должна быть кратна 30 дням! Сейчас: ${diffDays} дней`);
            return;
        }
    }
    
    const data = {
        valid_from: validFrom || null,
        valid_to: validTo || null,
        max_employees: formData.get('max_employees') !== '' 
            ? parseInt(formData.get('max_employees')) 
            : null,
        monthly_verifications: formData.get('max_verifications_per_month') !== '' 
            ? parseInt(formData.get('max_verifications_per_month')) 
            : null,
        monthly_orders: formData.get('max_orders_per_month') !== '' 
            ? parseInt(formData.get('max_orders_per_month')) 
            : null,
        is_extension: false,
        auto_manufacture_year: formData.get('auto_manufacture_year') === 'on',
        auto_teams: formData.get('auto_teams') === 'on',
        auto_metrolog: formData.get('auto_metrolog') === 'on',
        reason: formData.get('reason').trim()
    };

    try {
        const response = await fetch(`/tariff/api/company-tariffs/?company_id=${companyId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            alert('Тариф успешно обновлён');
            window.location.href = `/tariff/view/?company_id=${companyId}`;
        } else {
            const error = await response.json();
            alert(`Ошибка: ${error.detail || 'Неизвестная ошибка'}`);
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Произошла ошибка при обновлении тарифа');
    }
});

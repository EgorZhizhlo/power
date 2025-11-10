document.getElementById('base_tariff_id').addEventListener('change', function() {
    const selectedOption = this.options[this.selectedIndex];
    const submitBtn = document.getElementById('submitBtn');
    
    if (selectedOption.value) {
        document.getElementById('max_employees').disabled = false;
        document.getElementById('max_verifications_per_month').disabled = false;
        document.getElementById('max_orders_per_month').disabled = false;
        document.getElementById('auto_manufacture_year').disabled = false;
        document.getElementById('auto_teams').disabled = false;
        document.getElementById('auto_metrolog').disabled = false;
        submitBtn.disabled = false;
        
        document.getElementById('max_employees').value = selectedOption.dataset.maxEmployees || '';
        
        const maxVerifications = selectedOption.dataset.maxVerifications || '';
        const maxOrders = selectedOption.dataset.maxOrders || '';
        
        document.getElementById('max_verifications_per_month').value = maxVerifications;
        document.getElementById('max_orders_per_month').value = maxOrders;
        
        monthlyVerifications = maxVerifications ? parseInt(maxVerifications) : null;
        monthlyOrders = maxOrders ? parseInt(maxOrders) : null;
        
        document.getElementById('auto_manufacture_year').checked = selectedOption.dataset.autoYear === 'True';
        document.getElementById('auto_teams').checked = selectedOption.dataset.autoTeams === 'True';
        document.getElementById('auto_metrolog').checked = selectedOption.dataset.autoMetrolog === 'True';
    } else {
        document.getElementById('max_employees').disabled = true;
        document.getElementById('max_verifications_per_month').disabled = true;
        document.getElementById('max_orders_per_month').disabled = true;
        document.getElementById('auto_manufacture_year').disabled = true;
        document.getElementById('auto_teams').disabled = true;
        document.getElementById('auto_metrolog').disabled = true;
        submitBtn.disabled = true;
        
        document.getElementById('max_employees').value = '';
        document.getElementById('max_verifications_per_month').value = '';
        document.getElementById('max_orders_per_month').value = '';
        document.getElementById('auto_manufacture_year').checked = false;
        document.getElementById('auto_teams').checked = false;
        document.getElementById('auto_metrolog').checked = false;
        monthlyVerifications = null;
        monthlyOrders = null;
    }
});

document.getElementById('assignTariffForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const companyId = this.dataset.companyId;
    const baseTariffId = document.getElementById('base_tariff_id').value;
    
    if (!baseTariffId) {
        alert('Необходимо выбрать базовый тариф');
        return;
    }
    
    const validFrom = document.getElementById('valid_from').value;
    const validTo = document.getElementById('valid_to').value;
    
    const maxEmployees = document.getElementById('max_employees').value;
    const maxVerificationsPerMonth = document.getElementById('max_verifications_per_month').value;
    const maxOrdersPerMonth = document.getElementById('max_orders_per_month').value;
    
    const carryOverVerifications = document.getElementById('carry_over_verifications').checked;
    const carryOverOrders = document.getElementById('carry_over_orders').checked;
    
    const autoManufactureYear = document.getElementById('auto_manufacture_year').checked;
    const autoTeams = document.getElementById('auto_teams').checked;
    const autoMetrolog = document.getElementById('auto_metrolog').checked;
    
    const payload = {
        base_tariff_id: parseInt(baseTariffId),
        company_id: parseInt(companyId),
        valid_from: validFrom,
        valid_to: validTo || null,
        max_employees: maxEmployees ? parseInt(maxEmployees) : null,
        monthly_verifications: maxVerificationsPerMonth ? parseInt(maxVerificationsPerMonth) : null,
        monthly_orders: maxOrdersPerMonth ? parseInt(maxOrdersPerMonth) : null,
        carry_over_verifications: carryOverVerifications,
        carry_over_orders: carryOverOrders,
        auto_manufacture_year: autoManufactureYear,
        auto_teams: autoTeams,
        auto_metrolog: autoMetrolog
    };
    
    try {
        const response = await fetch(`/tariff/api/company-tariffs/?company_id=${companyId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        if (response.ok) {
            window.location.href = `/tariff/view/?company_id=${companyId}`;
        } else {
            const errorData = await response.json();
            alert(`Ошибка: ${errorData.detail || 'Не удалось назначить тариф'}`);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Произошла ошибка при назначении тарифа');
    }
});

let monthlyVerifications = null;
let monthlyOrders = null;

document.addEventListener('DOMContentLoaded', function() {
    const verificationsInput = document.getElementById('max_verifications_per_month');
    const ordersInput = document.getElementById('max_orders_per_month');
    
    if (verificationsInput.value) {
        monthlyVerifications = parseInt(verificationsInput.value);
    }
    if (ordersInput.value) {
        monthlyOrders = parseInt(ordersInput.value);
    }
});

function calculateValidTo() {
    const validFromInput = document.getElementById('valid_from');
    const durationInput = document.getElementById('duration_months');
    const validToInput = document.getElementById('valid_to');
    
    const validFrom = validFromInput.value;
    const months = parseInt(durationInput.value);
    
    if (validFrom && months > 0) {
        const startDate = new Date(validFrom);
        const daysToAdd = months * 30;
        const endDate = new Date(startDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
        
        const year = endDate.getFullYear();
        const month = String(endDate.getMonth() + 1).padStart(2, '0');
        const day = String(endDate.getDate()).padStart(2, '0');
        
        validToInput.value = `${year}-${month}-${day}`;
    }
}

function calculateMonthsFromDates() {
    const validFromInput = document.getElementById('valid_from');
    const validToInput = document.getElementById('valid_to');
    const durationInput = document.getElementById('duration_months');
    
    const validFrom = validFromInput.value;
    const validTo = validToInput.value;
    
    if (validFrom && validTo) {
        const startDate = new Date(validFrom);
        const endDate = new Date(validTo);
        const diffDays = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));
        
        if (diffDays < 30) {
            alert('Минимальная разница между датами должна быть 30 дней!');
            validToInput.removeEventListener('change', handleValidToChange);
            validToInput.value = '';
            setTimeout(() => {
                validToInput.addEventListener('change', handleValidToChange);
            }, 0);
            return;
        }
        
        if (diffDays % 30 !== 0) {
            alert(`Разница между датами должна быть кратна 30 дням! Сейчас: ${diffDays} дней`);
            validToInput.removeEventListener('change', handleValidToChange);
            validToInput.value = '';
            setTimeout(() => {
                validToInput.addEventListener('change', handleValidToChange);
            }, 0);
            return;
        }
        
        const months = Math.floor(diffDays / 30);
        durationInput.value = months;
    }
}

document.getElementById('max_verifications_per_month').addEventListener('input', function() {
    if (this.value) {
        monthlyVerifications = parseInt(this.value);
    } else {
        monthlyVerifications = null;
    }
});

document.getElementById('max_orders_per_month').addEventListener('input', function() {
    if (this.value) {
        monthlyOrders = parseInt(this.value);
    } else {
        monthlyOrders = null;
    }
});

document.getElementById('valid_from').valueAsDate = new Date();
document.getElementById('valid_from').addEventListener('change', function() {
    calculateValidTo();
});

document.getElementById('duration_months').addEventListener('input', function() {
    calculateValidTo();
});

function handleValidToChange() {
    calculateMonthsFromDates();
}

document.getElementById('valid_to').addEventListener('change', handleValidToChange);

document.getElementById('valid_to').addEventListener('focus', function() {
    document.getElementById('duration_months').value = '';
});

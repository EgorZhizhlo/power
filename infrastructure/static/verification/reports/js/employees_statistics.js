/**
 * JavaScript для загрузки и отображения статистики по сотрудникам
 */

// Получаем company_id из URL
const urlParams = new URLSearchParams(window.location.search);
const companyId = urlParams.get('company_id');

/**
 * Загружает данные статистики с сервера
 * @param {Object} filters - Объект с параметрами фильтрации
 * @returns {Promise<Array>} - Массив данных статистики
 */
async function loadEmployeesStatistics(filters = {}) {
    const loadingIndicator = document.getElementById('loading-indicator');
    const tableBody = document.querySelector('.report-table tbody');
    const errorMessage = document.getElementById('error-message');
    
    try {
        // Показываем индикатор загрузки
        if (loadingIndicator) {
            loadingIndicator.style.display = 'block';
        }
        
        // Скрываем сообщение об ошибке
        if (errorMessage) {
            errorMessage.style.display = 'none';
        }
        
        // Формируем URL с параметрами
        const params = new URLSearchParams({
            company_id: companyId
        });
        
        // Добавляем фильтры если они есть
        if (filters.date_from) {
            params.append('date_from', filters.date_from);
        }
        if (filters.date_to) {
            params.append('date_to', filters.date_to);
        }
        
        // Отправляем запрос
        const response = await fetch(`/verification/api/reports/employees/?${params.toString()}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        // Обновляем таблицу
        updateTable(result.data);
        
        return result.data;
        
    } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
        
        // Показываем сообщение об ошибке
        if (errorMessage) {
            errorMessage.textContent = 'Ошибка при загрузке данных. Пожалуйста, попробуйте позже.';
            errorMessage.style.display = 'block';
        }
        
        // Очищаем таблицу
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="11" class="text-center text-danger">Ошибка загрузки данных</td></tr>';
        }
        
        throw error;
        
    } finally {
        // Скрываем индикатор загрузки
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
    }
}

/**
 * Обновляет таблицу с данными
 * @param {Array} data - Массив данных для отображения
 */
function updateTable(data) {
    const tableBody = document.querySelector('.report-table tbody');
    
    if (!tableBody) {
        console.error('Таблица не найдена');
        return;
    }
    
    // Очищаем существующие строки
    tableBody.innerHTML = '';
    
    // Проверяем наличие данных
    if (!data || data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="11" class="text-center text-muted">Нет данных для отображения</td></tr>';
        return;
    }
    
    // Получаем информацию о видимости колонок из заголовков
    const headers = document.querySelectorAll('.report-table thead th');
    const visibleCheckboxes = [];
    
    headers.forEach(header => {
        const text = header.textContent.trim();
        if (text && text !== '#' && text !== 'ФИО сотрудника' && 
            text !== 'Пригодно' && text !== 'Непригодно' && 
            text !== 'Холодная вода' && text !== 'Горячая вода') {
            // Это кастомная колонка
            visibleCheckboxes.push(true);
        }
    });
    
    // Создаем строки таблицы
    data.forEach(row => {
        const tr = document.createElement('tr');
        
        // Базовые колонки
        tr.innerHTML = `
            <td>${row.number}</td>
            <td>${escapeHtml(row.name)}</td>
            <td>${row.passed}</td>
            <td>${row.failed}</td>
            <td>${row.cold_water}</td>
            <td>${row.hot_water}</td>
        `;
        
        // Добавляем чекбоксы если они видны
        for (let i = 1; i <= 5; i++) {
            const checkboxKey = `checkbox_${i}`;
            const headerExists = document.querySelector(`.report-table thead th:nth-child(${6 + i})`);
            
            if (headerExists) {
                const td = document.createElement('td');
                td.textContent = row[checkboxKey] || 0;
                tr.appendChild(td);
            }
        }
        
        tableBody.appendChild(tr);
    });
}

/**
 * Экранирует HTML специальные символы
 * @param {string} text - Текст для экранирования
 * @returns {string} - Экранированный текст
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Обработчик отправки формы фильтрации
 */
function setupFilterForm() {
    const filterForm = document.querySelector('.report-filter');
    
    if (!filterForm) {
        console.warn('Форма фильтрации не найдена');
        return;
    }
    
    filterForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        // Получаем значения фильтров
        const dateFrom = document.getElementById('date_from')?.value || '';
        const dateTo = document.getElementById('date_to')?.value || '';
        
        // Загружаем данные с фильтрами
        try {
            await loadEmployeesStatistics({
                date_from: dateFrom,
                date_to: dateTo
            });
            
            // Обновляем URL с параметрами (для возможности bookmark)
            const newUrl = new URL(window.location);
            if (dateFrom) {
                newUrl.searchParams.set('date_from', dateFrom);
            } else {
                newUrl.searchParams.delete('date_from');
            }
            if (dateTo) {
                newUrl.searchParams.set('date_to', dateTo);
            } else {
                newUrl.searchParams.delete('date_to');
            }
            window.history.pushState({}, '', newUrl);
            
        } catch (error) {
            console.error('Ошибка при применении фильтров:', error);
        }
    });
}

/**
 * Инициализация при загрузке страницы
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Инициализация страницы статистики по сотрудникам');
    
    // Настраиваем форму фильтрации
    setupFilterForm();
    
    // Получаем значения фильтров из URL
    const dateFrom = urlParams.get('date_from') || '';
    const dateTo = urlParams.get('date_to') || '';
    
    // Заполняем поля формы из URL
    const dateFromInput = document.getElementById('date_from');
    const dateToInput = document.getElementById('date_to');
    
    if (dateFromInput && dateFrom) {
        dateFromInput.value = dateFrom;
    }
    if (dateToInput && dateTo) {
        dateToInput.value = dateTo;
    }
    
    // Загружаем данные при первой загрузке страницы
    try {
        await loadEmployeesStatistics({
            date_from: dateFrom,
            date_to: dateTo
        });
    } catch (error) {
        console.error('Ошибка при начальной загрузке данных:', error);
    }
});

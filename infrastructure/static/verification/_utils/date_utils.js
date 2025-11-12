/**
 * Получает текущую дату в формате YYYY-MM-DD с учетом timezone компании
 * @param {string} [companyTz] - Timezone компании (по умолчанию берется из window.companyTz)
 * @returns {string} - Дата в формате YYYY-MM-DD
 */
export function getTodayInCompanyTz(companyTz = null) {
    const tz = companyTz || window.companyTz || 'Europe/Moscow';
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    return formatter.format(now);
}

/**
 * Форматирует дату в строку YYYY-MM-DD с учетом timezone
 * @param {Date} date - Дата для форматирования
 * @param {string} [companyTz] - Timezone компании
 * @returns {string} - Дата в формате YYYY-MM-DD
 */
export function formatDateInTz(date, companyTz = null) {
    const tz = companyTz || window.companyTz || 'Europe/Moscow';
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    return formatter.format(date);
}

/**
 * Форматирует дату и время в строку с учетом timezone
 * @param {Date} date - Дата для форматирования
 * @param {string} [companyTz] - Timezone компании
 * @returns {string} - Дата и время в формате DD.MM.YYYY HH:MM
 */
export function formatDateTimeInTz(date, companyTz = null) {
    const tz = companyTz || window.companyTz || 'Europe/Moscow';
    const formatter = new Intl.DateTimeFormat('ru-RU', {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
    return formatter.format(date);
}

/**
 * Создает Date объект из строки даты (YYYY-MM-DD) в контексте timezone компании
 * Важно: возвращает Date в UTC, но соответствующий полуночи в timezone компании
 * @param {string} dateStr - Дата в формате YYYY-MM-DD
 * @param {string} [companyTz] - Timezone компании
 * @returns {Date} - Date объект
 */
export function parseDateInTz(dateStr, companyTz = null) {
    if (!dateStr) return null;
    
    const tz = companyTz || window.companyTz || 'Europe/Moscow';
    
    const [year, month, day] = dateStr.split('-').map(Number);
    const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T12:00:00`;
    
    return new Date(dateString);
}

/**
 * Добавляет годы к дате с учетом timezone
 * @param {Date|string} date - Исходная дата (Date или строка YYYY-MM-DD)
 * @param {number} years - Количество лет для добавления
 * @param {string} [companyTz] - Timezone компании
 * @returns {Date} - Новая дата
 */
export function addYearsInTz(date, years, companyTz = null) {
    const tz = companyTz || window.companyTz || 'Europe/Moscow';
    
    let workDate;
    if (typeof date === 'string') {
        workDate = new Date(date);
    } else {
        workDate = new Date(date.getTime());
    }
    
    if (isNaN(workDate.getTime())) {
        return null;
    }
    
    workDate.setFullYear(workDate.getFullYear() + years);
    return workDate;
}

/**
 * Вычисляет разницу в годах между двумя датами
 * @param {Date|string} startDate - Начальная дата
 * @param {Date|string} endDate - Конечная дата
 * @returns {number} - Разница в годах
 */
export function getYearsDifference(startDate, endDate) {
    const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return 0;
    }
    
    return end.getFullYear() - start.getFullYear();
}

/**
 * Проверяет, что дата не позже сегодняшней (с учетом timezone)
 * @param {string} dateStr - Дата в формате YYYY-MM-DD
 * @param {string} [companyTz] - Timezone компании
 * @returns {boolean} - true если дата не позже сегодняшней
 */
export function isDateNotFuture(dateStr, companyTz = null) {
    if (!dateStr) return false;
    
    const today = getTodayInCompanyTz(companyTz);
    return dateStr <= today;
}

/**
 * Получает максимальную дату для input[type="date"] (сегодня в timezone компании)
 * @param {string} [companyTz] - Timezone компании
 * @returns {string} - Дата в формате YYYY-MM-DD
 */
export function getMaxDateForInput(companyTz = null) {
    return getTodayInCompanyTz(companyTz);
}

/**
 * Получает текущий год с учетом timezone компании
 * @param {string} [companyTz] - Timezone компании
 * @returns {number} - Текущий год
 */
export function getCurrentYearInTz(companyTz = null) {
    const tz = companyTz || window.companyTz || 'Europe/Moscow';
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: tz,
        year: 'numeric'
    });
    return parseInt(formatter.format(now), 10);
}

const REPORTS_BASE = `/calendar/api/reports`;
const REPORTS_STATIC_BASE = `/calendar/api/reports/static`;
const REPORTS_DYNAMIC_BASE = `/calendar/api/reports/dynamic`;

// Глобальные переменные для модального окна
let currentReportId = null;
let currentReportData = null;

// Маппинг полей на русские названия
const FIELD_LABELS = {
    dispatcher: 'Диспетчер',
    route: 'Маршрут',
    no_date: 'Без даты',
    date: 'Дата заявки',
    address: 'Адрес',
    phone_number: 'Телефон',
    sec_phone_number: 'Доп. телефон',
    client_full_name: 'ФИО клиента',
    legal_entity: 'Юр. лицо',
    counter_number: '№ счётчика',
    water_type: 'Тип воды',
    price: 'Цена',
    status: 'Статус',
    additional_info: 'Доп. информация',
    date_of_get: 'Дата получения',
    deleted_at: 'Время удаления заявки',
};

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const [dispResp, routeResp, verResp] = await Promise.all([
            fetch(`${REPORTS_BASE}/dispatchers?company_id=${window.currentCompanyId}`, { credentials: 'include' }),
            fetch(`${REPORTS_BASE}/routes?company_id=${window.currentCompanyId}`, { credentials: 'include' }),
            fetch(`${REPORTS_BASE}/verifiers?company_id=${window.currentCompanyId}`, { credentials: 'include' })
        ]);

        if (!dispResp.ok || !routeResp.ok || !verResp.ok) {
            throw new Error('Не удалось загрузить данные');
        }

        const [dispatchers, routes, verifiers] = await Promise.all([
            dispResp.json(),
            routeResp.json(),
            verResp.json()
        ]);

        // заполнение карточки 1
        for (const u of dispatchers) {
            const cap = s => s ? s[0].toUpperCase() + s.slice(1).toLowerCase() : '';
            const fullName = `${cap(u.last_name)} ${cap(u.name)}${u.patronymic ? ' ' + cap(u.patronymic) : ''} (${u.username})`;
            document.getElementById('dispatcher-select').add(new Option(fullName, u.id));
        }

        // заполнение карточки 2
        for (const r of routes) {
            document.getElementById('route-select').add(new Option(r.name, r.id));
        }

        // заполнение карточки 3
        const choices = new Choices(document.getElementById('verifier-select'), {
            removeItemButton: true,
            placeholderValue: 'Выберите поверителей',
        });
        for (const u of verifiers) {
            const cap = s => s ? s[0].toUpperCase() + s.slice(1).toLowerCase() : '';
            const label = `${cap(u.last_name)} ${cap(u.name)}${u.patronymic ? ' ' + cap(u.patronymic) : ''} (${u.username})`;
            choices.setChoices([{ value: u.id, label }], 'value', 'label', false);
        }

        // Заполняем select для модального окна (для фильтра по диспетчеру)
        const modalEmployeeSelect = document.getElementById('modal-employee-select');
        for (const u of dispatchers) {
            const cap = s => s ? s[0].toUpperCase() + s.slice(1).toLowerCase() : '';
            const fullName = `${cap(u.last_name)} ${cap(u.name)}${u.patronymic ? ' ' + cap(u.patronymic) : ''} (${u.username})`;
            modalEmployeeSelect.add(new Option(fullName, u.id));
        }

        // валидация и обработчики
        setupValidation(1);
        setupValidation(2);
        setupValidation(3);
        initHandlers();
        
        // Инициализируем обработчики модального окна
        initModalHandlers();

        // Загружаем динамические отчеты
        await loadDynamicReports();
    } catch (err) {
        console.error('Ошибка инициализации:', err);
        alert('Ошибка при загрузке страницы. Проверьте консоль.');
    }
});

function setupValidation(cardNum) {
    const start = document.getElementById(`start-date-${cardNum}`);
    const end = document.getElementById(`end-date-${cardNum}`);
    const btn = document.getElementById(`generate-report-${cardNum}`);
    const errEl = document.getElementById(`error-${cardNum}`);

    const validate = () => {
        if (start.value && end.value) {
            const sd = new Date(start.value), ed = new Date(end.value);
            const diff = (ed - sd) / (1000 * 60 * 60 * 24);
            if (sd <= ed && diff <= window.max_days) {
                errEl.style.display = 'none';
                btn.disabled = false;
                return;
            }
            errEl.style.display = 'block';
        } else {
            errEl.style.display = 'none';
        }
        btn.disabled = true;
    };

    start.addEventListener('change', validate);
    end.addEventListener('change', validate);
}

function initHandlers() {
    // карточка 1
    document.getElementById('generate-report-1')
        .addEventListener('click', async e => {
            e.preventDefault();
            const params = new URLSearchParams({
                company_id: window.currentCompanyId,
                start_date: document.getElementById('start-date-1').value,
                end_date: document.getElementById('end-date-1').value
            });

            const v = document.getElementById('dispatcher-select').value;
            if (v) params.append('employee_id', v);

            // если включен чекбокс "только актуальные" -> source=date_of_get
            // иначе -> source=date
            const source = document.getElementById('current-only-1').checked
                ? 'date_of_get'
                : 'date';
            params.append('source', source);

            await download(`${REPORTS_STATIC_BASE}/dispatchers/?${params}`, 'xlsx');
        });


    // карточка 2
    document.getElementById('generate-report-2')
        .addEventListener('click', async e => {
            e.preventDefault();
            const params = new URLSearchParams({
                company_id: window.currentCompanyId,
                start_date: document.getElementById('start-date-2').value,
                end_date: document.getElementById('end-date-2').value
            });
            const r = document.getElementById('route-select').value;
            if (r) params.append('route_id', r);
            if (document.getElementById('no-data-2').checked) {
                params.append('no_data', 'true');
            }

            await download(`${REPORTS_STATIC_BASE}/orders/?${params}`, 'xlsx');
        });

    // карточка 3
    document.getElementById('generate-report-3')
        .addEventListener('click', async e => {
            e.preventDefault();
            const params = new URLSearchParams({
                company_id: window.currentCompanyId,
                start_date: document.getElementById('start-date-3').value,
                end_date: document.getElementById('end-date-3').value
            });
            document.querySelectorAll('#verifier-select option:checked')
                .forEach(opt => params.append('verifier_id', opt.value));

            await download(`${REPORTS_STATIC_BASE}/planning/?${params}`, 'xlsx');
        });
}

async function download(url) {
    try {
        const resp = await fetch(url, {
            headers: { Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const blob = await resp.blob();
        let filename = resp.headers
            .get('Content-Disposition')
            ?.match(/filename\*?=?UTF-8''([^;]+)/)?.[1]
            || resp.headers.get('Content-Disposition')?.match(/filename="?(.+)"?/)?.[1]
            || 'report.xlsx';

        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = decodeURIComponent(filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(link.href);
    } catch (err) {
        console.error(err);
        alert('Ошибка при формировании отчёта.');
    }
}

async function loadDynamicReports() {
    const container = document.getElementById('dynamic-reports-container');
    if (!container) return;

    container.innerHTML = '<div class="col-12"><p class="text-muted">Загрузка отчетов...</p></div>';

    try {
        const url = `${REPORTS_DYNAMIC_BASE}/list?company_id=${window.currentCompanyId}`;
        const resp = await fetch(url, { credentials: 'include' });

        if (!resp.ok) {
            container.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-danger" role="alert">
                        <strong>Ошибка загрузки отчетов (${resp.status})</strong>
                    </div>
                </div>
            `;
            return;
        }

        const reports = await resp.json();

        if (!Array.isArray(reports)) {
            container.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-warning" role="alert">
                        <strong>Ошибка: неверный формат данных</strong>
                    </div>
                </div>
            `;
            return;
        }

        if (reports.length === 0) {
            container.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-info" role="alert">
                        <strong>Нет доступных динамических отчетов</strong>
                        <p class="mb-0 small mt-2">Отчеты не найдены или нет доступа для вашей роли.</p>
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = '';
        reports.forEach(report => {
            container.appendChild(createDynamicReportCard(report));
        });
    } catch (err) {
        container.innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger" role="alert">
                    <strong>Критическая ошибка загрузки отчетов</strong>
                    <p class="mb-0 small mt-2">${err.message}</p>
                </div>
            </div>
        `;
    }
}

// Создание карточки динамического отчета
function createDynamicReportCard(report) {
    const col = document.createElement('div');
    col.className = 'col-lg-4 col-md-6 col-sm-12';

    let fieldsText = 'Нет активных полей';
    if (report.fields_order) {
        const fieldsArray = report.fields_order.split(',').filter(f => f.trim());
        if (fieldsArray.length > 0) {
            const fieldLabels = fieldsArray.map(field => FIELD_LABELS[field] || field);
            fieldsText = fieldLabels.join(', ');
        }
    }

    col.innerHTML = `
        <div class="card">
            <div class="card-header">${escapeHtml(report.name)}</div>
            <div class="card-body">
                <div class="small mb-2">
                    <strong>Поля:</strong>
                    <div class="mt-1 text-muted" style="max-height: 150px; overflow-y: auto;">
                        ${escapeHtml(fieldsText)}
                    </div>
                </div>
            </div>
            <div class="card-footer">
                <button class="btn btn-outline-primary btn-full fw-bold dynamic-report-btn"
                    style="border-width: 3px;"
                    data-report-id="${report.id}">
                    Сформировать
                </button>
            </div>
        </div>
    `;

    const btn = col.querySelector('.dynamic-report-btn');
    btn.addEventListener('click', () => openDynamicReportModal(report));

    return col;
}

// Функция экранирования HTML для безопасности
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function openDynamicReportModal(report) {
    currentReportId = report.id;
    currentReportData = report;

    document.getElementById('modal-report-name').textContent = report.name;

    let fieldsText = 'Нет активных полей';
    if (report.fields_order) {
        const fieldsArray = report.fields_order.split(',').filter(f => f.trim());
        if (fieldsArray.length > 0) {
            const fieldLabels = fieldsArray.map(field => FIELD_LABELS[field] || field);
            fieldsText = fieldLabels.join(', ');
        }
    }

    const fieldsContainer = document.getElementById('modal-report-fields');
    fieldsContainer.innerHTML = `<div class="text-muted">${escapeHtml(fieldsText)}</div>`;

    document.getElementById('modal-start-date').value = '';
    document.getElementById('modal-end-date').value = '';
    document.getElementById('modal-employee-select').value = '';
    
    const errorEl = document.getElementById('modal-date-error');
    const generateBtn = document.getElementById('modal-generate-btn');
    if (errorEl) {
        errorEl.style.display = 'none';
    }
    if (generateBtn) {
        generateBtn.disabled = true;
    }

    const modalElement = document.getElementById('dynamicReportModal');
    if (modalElement) {
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
    }
}

// Валидация дат в модальном окне
function validateModalDates() {
    const startEl = document.getElementById('modal-start-date');
    const endEl = document.getElementById('modal-end-date');
    const errorEl = document.getElementById('modal-date-error');
    const generateBtn = document.getElementById('modal-generate-btn');

    if (!startEl || !endEl || !errorEl || !generateBtn) {
        return true;
    }

    const start = startEl.value;
    const end = endEl.value;

    if (!start || !end) {
        errorEl.textContent = 'Необходимо выбрать обе даты (от и до)';
        errorEl.style.display = 'block';
        generateBtn.disabled = true;
        return false;
    }

    const sd = new Date(start);
    const ed = new Date(end);
    const diff = (ed - sd) / (1000 * 60 * 60 * 24);

    if (sd > ed) {
        errorEl.textContent = 'Дата "от" не может быть больше даты "до"';
        errorEl.style.display = 'block';
        generateBtn.disabled = true;
        return false;
    }

    if (diff > 91) {
        errorEl.textContent = 'Период не может превышать 91 день';
        errorEl.style.display = 'block';
        generateBtn.disabled = true;
        return false;
    }

    errorEl.style.display = 'none';
    generateBtn.disabled = false;
    return true;
}

// Инициализация обработчиков модального окна после загрузки DOM
function initModalHandlers() {
    const startEl = document.getElementById('modal-start-date');
    const endEl = document.getElementById('modal-end-date');
    const generateBtn = document.getElementById('modal-generate-btn');

    if (startEl && endEl) {
        startEl.addEventListener('change', validateModalDates);
        endEl.addEventListener('change', validateModalDates);
    }

    if (generateBtn) {
        generateBtn.addEventListener('click', async () => {
            if (!validateModalDates()) {
                return;
            }

            if (!currentReportId) {
                alert('Ошибка: отчет не выбран');
                return;
            }

            const params = new URLSearchParams({
                company_id: window.currentCompanyId,
                report_id: currentReportId
            });

            // Добавляем необязательные фильтры
            const startDate = document.getElementById('modal-start-date').value;
            const endDate = document.getElementById('modal-end-date').value;
            const employeeId = document.getElementById('modal-employee-select').value;

            if (startDate) params.append('start_date', startDate);
            if (endDate) params.append('end_date', endDate);
            if (employeeId) params.append('employee_id', employeeId);

            // Закрываем модальное окно
            const modalElement = document.getElementById('dynamicReportModal');
            const modal = bootstrap.Modal.getInstance(modalElement);
            if (modal) {
                modal.hide();
            }

            try {
                await download(`${REPORTS_DYNAMIC_BASE}/?${params}`);
            } catch (err) {
                alert('Ошибка при формировании отчета. Проверьте параметры и попробуйте снова.');
            }
        });
    }
}
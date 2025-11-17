import { 
    getTodayInCompanyTz,
    formatDateInTz,
    getYearsDifference, 
    addYearsInTz,
    getCurrentYearInTz 
} from '/static/verification/_utils/date_utils.js';

import { renderActPhotos } from '/static/verification/_utils/act_number_photos_utils.js';

window.deletedImages = window.deletedImages || [];
window.deletedVerificationPhotos = [];

let lastRegistryData = null;
let phoneMask = null;
let originalEntry = {};

function initPhotoUploadLimit() {
    const fileInput = document.getElementById('new_verification_images');
    if (!fileInput) return;
    fileInput.addEventListener('change', () => {
        const existingCount = document.querySelectorAll('#photo-list li').length;
        const selectedCount = fileInput.files.length;
        if (existingCount + selectedCount > window.photoLimit) {
            alert(`Можно загрузить не более ${window.photoLimit} фото. Сейчас выбрано ${selectedCount}, а уже существует ${existingCount}.`);
            fileInput.value = '';
        }
    });
}

function initOldPhotoDeletion() {
    const photoList = document.getElementById('photo-list');
    if (!photoList) return;

    photoList.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-delete-photo');
        if (!btn) return;

        const photoId = btn.dataset.photoId;
        if (!photoId) return;

        if (!confirm('Удалить это фото?')) return;

        // Добавляем в массив удаленных
        if (!window.deletedVerificationPhotos.includes(photoId)) {
            window.deletedVerificationPhotos.push(photoId);
        }

        // Удаляем из DOM
        btn.closest('li').remove();

        // Если список пуст, скрываем контейнер
        if (photoList.querySelectorAll('li').length === 0) {
            const parentDiv = photoList.closest('.col-12');
            if (parentDiv) parentDiv.style.display = 'none';
        }
    });
}

async function loadRegistryData(registryNumberId, isInitial = false) {
    if (!registryNumberId) return;

    const params = new URLSearchParams({
        company_id: String(window.companyId),
        registry_number_id: String(registryNumberId),
    });

    try {
        const resp = await fetch(`/verification/api/registry-numbers/?${params.toString()}`, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            cache: 'no-store'
        });
        if (!resp.ok) return;
        const data = await resp.json();
        lastRegistryData = data;

        const modSelect = document.getElementById('modification_id');
        modSelect.innerHTML = '<option value="" disabled selected>Выберите модификацию</option>';
        const mods = Array.isArray(data.modifications) ? data.modifications : [];
        mods.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m.id;
            opt.textContent = m.modification_name;
            if (window.verifModif && Number(window.verifModif) === Number(m.id)) {
                opt.selected = true;
            }
            modSelect.appendChild(opt);
        });
        if (!modSelect.value && mods.length > 0) {
            modSelect.value = String(mods[0].id);
        }

        const methodSelect = document.getElementById('method_id');
        methodSelect.innerHTML = '<option value="" disabled selected>Выберите методику</option>';
        if (data.method) {
            const opt = document.createElement('option');
            opt.value = data.method.id;
            opt.textContent = data.method.name;
            opt.selected = true;
            methodSelect.appendChild(opt);
        }

        document.getElementById('si_type').value = data.si_type || '';

        const manufSelect = document.getElementById('manufacture_year');
        const currentSaved = manufSelect.dataset.current;
        const regText = data.registry_number;
        const startYear = getFullYearFromRegistryNumber(regText);

        const isAdmin = ['admin', 'director'].includes(window.userStatus);
        const currentYear = getCurrentYearInTz();
        const endYear = isAdmin ? currentYear : Math.min(startYear + 10, currentYear);

        manufSelect.innerHTML = '<option value="" disabled>Выберите год выпуска</option>';

        let years = [];
        for (let y = startYear; y <= endYear; y++) {
            years.push(y);
            const opt = document.createElement('option');
            opt.value = String(y);
            opt.textContent = y;
            manufSelect.appendChild(opt);
        }

        if (isInitial && currentSaved) {
            manufSelect.value = String(currentSaved);
        } else {
            if (window.autoManufYear && years.length > 0) {
                const rnd = years[Math.floor(Math.random() * years.length)];
                manufSelect.value = String(rnd);
            } else {
                if (years.length > 0) manufSelect.value = String(years[0]);
            }
        }

        applyMPI();

    } catch (e) {
        console.error('Ошибка загрузки registry data:', e);
    }
}

function getFullYearFromRegistryNumber(regNum) {
    const parts = String(regNum || '').split('-');
    const lastTwo = parseInt(parts[1], 10);
    const currentYear = getCurrentYearInTz();
    if (Number.isNaN(lastTwo)) return currentYear;
    return lastTwo <= (currentYear % 100) ? 2000 + lastTwo : 1900 + lastTwo;
}

function updateEndVerificationDate() {
    const verDateInput = document.getElementById('verification_date');
    const nextSelect = document.getElementById('next_verification');
    const endInput = document.getElementById('end_verification_date');

    const verDate = new Date(verDateInput.value);
    const yearsToAdd = parseInt(nextSelect.value, 10) || 0;
    if (!isNaN(verDate.getTime()) && !isNaN(yearsToAdd)) {
        const newDate = addYearsInTz(verDate, yearsToAdd);
        newDate.setDate(newDate.getDate() - 1);
        endInput.value = formatDateInTz(newDate);
    }
}

function calculateNextVerification() {
    const verDate = new Date(document.getElementById('verification_date').value);
    const endDate = new Date(document.getElementById('end_verification_date').value);
    const nextSelect = document.getElementById('next_verification');
    if (!isNaN(verDate.getTime()) && !isNaN(endDate.getTime())) {
        nextSelect.value = String(getYearsDifference(verDate, endDate));
    }
}

function resetClientFieldsToDefaults() {
    const addressInput = document.getElementById("address");
    const clientNameInput = document.getElementById("client_full_name");
    const phoneInput = document.getElementById("client_phone");
    const legalEntitySelect = document.getElementById("legal_entity");
    const citySelect = document.getElementById("city_id");
    const verificationDateInput = document.getElementById("verification_date");

    addressInput.value = "";
    clientNameInput.value = "";
    phoneInput.value = "";
    legalEntitySelect.value = "individual";

    const cityOptions = Array.from(citySelect.options).filter(o => o.value);
    if (window.defaultCityId && cityOptions.some(o => o.value == window.defaultCityId)) {
        citySelect.value = window.defaultCityId;
    } else {
        citySelect.value = cityOptions.length ? cityOptions[0].value : "";
    }

    verificationDateInput.value = getTodayInCompanyTz();
}

function toggleAdditionalInput() {
    const resultSelect = document.getElementById('verification_result');
    const additional = document.getElementById('additional_input');
    additional.style.display = resultSelect.value === 'False' ? 'block' : 'none';
}

function getSelectedRegistryNumberText() {
    const sel = document.getElementById('registry_number_id');
    if (!sel || sel.selectedIndex < 0) return '';
    return sel.options[sel.selectedIndex].textContent || '';
}

function populateVerificationOptions(maxValue) {
    const nextSelect = document.getElementById('next_verification');
    const current = nextSelect.dataset.current;
    nextSelect.innerHTML = '<option value="" disabled>Выберите интервал</option>';
    for (let yr = 0; yr <= maxValue; yr++) {
        const label = `${yr} ${[1, 2, 3, 4].includes(yr) ? 'год' + (yr > 1 ? 'a' : '') : 'лет'}`;
        const opt = document.createElement('option');
        opt.value = String(yr);
        opt.textContent = label;
        nextSelect.appendChild(opt);
    }
    if (current && [...nextSelect.options].some(o => o.value == current)) {
        nextSelect.value = String(current);
    }
}

function applyMPI() {
    const nextSelect = document.getElementById('next_verification');
    const waterIsCold = document.getElementById('water_type').value === 'cold';

    let mpi = null;
    if (lastRegistryData) {
        const raw = waterIsCold ? lastRegistryData.mpi_cold : lastRegistryData.mpi_hot;
        const p = parseInt(raw, 10);
        if (Number.isFinite(p) && p >= 0) mpi = p;
    }

    const isVerifier = window.userStatus === 'verifier';
    const maxYears = isVerifier ? (mpi ?? 0) : 15;

    populateVerificationOptions(maxYears);

    const stored = nextSelect.dataset.current;
    if (stored && [...nextSelect.options].some(o => o.value == stored)) {
        nextSelect.value = String(stored);
    } else if (mpi != null) {
        nextSelect.value = String(mpi);
    }
    updateEndVerificationDate();
}


async function loadActNumberForUpdate() {
    window.deletedImages = [];

    const actInput = document.getElementById('act_number');
    const seriesSelect = document.getElementById('series_id');

    const rawAct = (actInput.value || '').replace(/\D/g, '');
    const cleaned = rawAct.replace(/^0+/, '');
    if (!cleaned) {
        resetClientFieldsToDefaults();
        renderActPhotos([]);
        return;
    }

    const num = parseInt(cleaned, 10);
    if (!Number.isFinite(num) || num < 1) {
        resetClientFieldsToDefaults();
        renderActPhotos([]);
        return;
    }

    const seriesId = seriesSelect.value;
    if (!seriesId) {
        alert('Сначала выберите серию бланка.');
        resetClientFieldsToDefaults();
        renderActPhotos([]);
        return;
    }

    const params = new URLSearchParams({
        company_id: String(window.companyId),
        series_id: String(seriesId),
        act_number: String(num),
    });

    try {
        const resp = await fetch(`/verification/api/act-numbers/by-number/?${params.toString()}`, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            cache: 'no-store'
        });

        let data = null;
        if (resp.ok) {
            try {
                data = await resp.json();
            } catch (_) { }

            if (data) {
                // Заполнение полей формы
                const setIf = (id, val) => {
                    const el = document.getElementById(id);
                    if (el && val != null) el.value = val;
                };

                setIf('client_full_name', data.client_full_name);
                setIf('address', data.address);

                if (data.client_phone) {
                    if (phoneMask) {
                        phoneMask.value = data.client_phone;
                        phoneMask.updateValue();
                    } else {
                        setIf('client_phone', data.client_phone);
                    }
                }

                if (data.verification_date) {
                    setIf('verification_date', data.verification_date);
                }

                if (data.legal_entity != null) {
                    setIf('legal_entity', data.legal_entity);
                }

                if (data.city_id != null) {
                    const citySelect = document.getElementById('city_id');
                    if (citySelect && [...citySelect.options].some(o => o.value == data.city_id)) {
                        citySelect.value = String(data.city_id);
                    }
                }

                // Рендеринг фотографий
                renderActPhotos(data.photos || []);
            } else {
                resetClientFieldsToDefaults();
                renderActPhotos([]);
            }
        } else if (resp.status === 404) {
            resetClientFieldsToDefaults();
            renderActPhotos([]);
        } else {
            resetClientFieldsToDefaults();
            renderActPhotos([]);
        }

        // Пересчёт дат и интервалов
        applyMPI();
        updateEndVerificationDate();
        calculateNextVerification();
    } catch (err) {
        console.error('Ошибка /by-number:', err);
        resetClientFieldsToDefaults();
        renderActPhotos([]);
    }
}


document.addEventListener('DOMContentLoaded', function () {
    // Инициализируем phoneMask в начале, ДО вызова loadActNumberForUpdate
    const phoneInput = document.getElementById('client_phone');
    phoneMask = IMask(phoneInput, {
        mask: '+{7} (000) 000-00-00',
        lazy: false
    });
    console.log('phoneMask initialized');

    $('#registry_number_id')
        .on('select2:select', (e) => {
            const id = e.params?.data?.id || document.getElementById('registry_number_id').value;
            if (id) loadRegistryData(id);
        })
        .on('select2:clear', () => {
            lastRegistryData = null;
            document.getElementById('modification_id').innerHTML =
                '<option value="" disabled selected>Выберите модификацию</option>';
            document.getElementById('method_id').innerHTML =
                '<option value="" disabled selected>Выберите методику</option>';
            document.getElementById('si_type').value = '';
            document.getElementById('manufacture_year').innerHTML =
                '<option disabled>Выберите год выпуска</option>';
            populateVerificationOptions(15);
            updateEndVerificationDate();
        })
        .on('change', () => {
            const id = document.getElementById('registry_number_id').value;
            if (id) loadRegistryData(id);
        });

    const verificationDateInput = document.getElementById('verification_date');
    verificationDateInput.setAttribute('max', getTodayInCompanyTz());

    document.getElementById('water_type').addEventListener('change', applyMPI);
    document.getElementById('verification_result').addEventListener('change', toggleAdditionalInput);
    document.getElementById('next_verification').addEventListener('change', updateEndVerificationDate);
    document.getElementById('end_verification_date').addEventListener('change', calculateNextVerification);

    const regSelect = document.getElementById('registry_number_id');
    const actInput = document.getElementById('act_number');
    const seriesSelect = document.getElementById('series_id');

    actInput.addEventListener('change', loadActNumberForUpdate);
    seriesSelect.addEventListener('change', loadActNumberForUpdate);

    if (regSelect && regSelect.value) {
        loadRegistryData(regSelect.value, true);
    }

    if (seriesSelect && actInput && actInput.value) {
        const digits = (actInput.value || '').replace(/\D/g, '');
        const cleaned = digits.replace(/^0+/, '');
        if (cleaned) {
            // Подгружаем данные act_number при инициализации
            loadActNumberForUpdate();
        }
    }

    initPhotoUploadLimit();
    initOldPhotoDeletion();

    applyMPI();
    toggleAdditionalInput();
    calculateNextVerification();

    const INT_MAX = 2147483647;
    let lastActQuery = null;

    actInput.addEventListener('keydown', (e) => {
        const allowedCtrl =
            e.key === 'Backspace' || e.key === 'Delete' || e.key === 'Tab' ||
            e.key === 'Escape' || e.key === 'Enter' ||
            e.key === 'ArrowLeft' || e.key === 'ArrowRight' ||
            e.key === 'Home' || e.key === 'End' ||
            ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase()));
        if (allowedCtrl) return;

        if (/^[0-9]$/.test(e.key)) return;
        e.preventDefault();
    });

    actInput.addEventListener('input', () => {
        actInput.value = (actInput.value || '').replace(/\D/g, '');
    });

    verificationDateInput.addEventListener('blur', function () {
        if (!this.value) return;
        const currYear = getCurrentYearInTz();
        const parts = this.value.split('-');
        if (parts.length !== 3) return;
        const y = parseInt(parts[0], 10);
        if (y > currYear) {
            alert(`Введен неверный год, введите год не позже чем ${currYear}`);
            this.value = '';
            return;
        }
        applyMPI();
        updateEndVerificationDate();
        calculateNextVerification();
    });

    const form = document.getElementById('edit-entry-form');
    const buttons = form.querySelectorAll('button[type=submit]');

    let isSubmitting = false;
    function setBusyState(busy, submitterBtn) {
        isSubmitting = busy;
        form.setAttribute('aria-busy', busy ? 'true' : 'false');
        buttons.forEach(btn => {
            btn.disabled = busy;
            if (busy && submitterBtn && btn === submitterBtn) {
                btn.dataset._origText = btn.textContent;
                btn.textContent = '⏳ Отправка...';
            } else if (!busy && btn.dataset._origText) {
                btn.textContent = btn.dataset._origText;
                delete btn.dataset._origText;
            }
        });
    }
    window.addEventListener('pageshow', () => setBusyState(false));

    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        if (isSubmitting) return;

        const submitter = e.submitter || null;
        const redirectFlag = (submitter && submitter.id === 'edit-entry-and-metrolog') ? '1' : '0';

        const phoneInput = document.getElementById('client_phone');
        const raw = phoneMask.unmaskedValue;
        const allowShort = raw.length <= 2;
        const allowFull = phoneMask.masked.isComplete;
        if (!(allowShort || allowFull)) {
            alert('Введите телефон полностью (+7 (xxx) xxx-xx-xx) или оставьте +7');
            return;
        }
        if (allowShort) phoneInput.value = '';

        const today = getTodayInCompanyTz();
        if (verificationDateInput.value && verificationDateInput.value > today) {
            alert('Дата поверки не может быть позже сегодняшнего дня.');
            return;
        }

        const actNumberInput = document.getElementById('act_number');
        if (!actNumberInput.value || parseInt(actNumberInput.value, 10) <= 0) {
            alert('Введите корректный номер бланка (> 0).');
            return;
        }

        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const rawAct = (actInput.value || '').replace(/\D/g, '');
        const cleaned = rawAct.replace(/^0+/, '');
        if (!cleaned || cleaned === '0') {
            alert('Введите корректный номер бланка.');
            setBusyState(false, submitter);
            return;
        }

        const actNum = parseInt(cleaned, 10);
        if (!Number.isFinite(actNum) || actNum < 1 || actNum > INT_MAX) {
            alert(`Номер бланка должен быть в диапазоне 1..${INT_MAX}`);
            setBusyState(false, submitter);
            return;
        }

        setBusyState(true, submitter);

        try {
            // 1. Формируем JSON объект с данными формы
            const tmp = new FormData(form);
            tmp.set('act_number', String(actNum));

            const obj = {};
            tmp.forEach((v, k) => {
                if (v === 'True') obj[k] = true;
                else if (v === 'False') obj[k] = false;
                else obj[k] = v;
            });

            obj.company_tz = window.companyTz || "Europe/Moscow";
            obj.deleted_images_id = window.deletedImages; // Фото act_number
            obj.deleted_verification_photos_id = window.deletedVerificationPhotos; // Старые фото поверки

            // 2. Создаем FormData для отправки
            const fd = new FormData();
            fd.append("verification_entry_data", JSON.stringify(obj));

            // 3. Добавляем новые фото
            const newPhotosInput = document.getElementById('new_verification_images');
            if (newPhotosInput && newPhotosInput.files) {
                for (const file of newPhotosInput.files) {
                    fd.append("new_images", file);
                }
            }

            // 4. Отправка на сервер
            const params = new URLSearchParams({
                company_id: String(window.companyId),
                verification_entry_id: String(window.verifEntryId),
                redirect_to_metrolog_info: redirectFlag,
            });

            const url = `/verification/api/verifications-control/update/?${params.toString()}`;

            const resp = await fetch(url, {
                method: 'PUT',
                body: fd
            });

            if (!resp.ok) {
                const errText = await resp.text();
                console.error('Ошибка обновления:', resp.status, errText);
                alert(`Ошибка при обновлении записи (${resp.status}). Проверьте данные.`);
                setBusyState(false, submitter);
                return;
            }

            const data = await resp.json();
            console.log('Ответ сервера:', data);

            // 5. Обработка редиректа
            const ve = data.verification_entry_id || window.verifEntryId;
            const mi = data.metrolog_info_id;
            const r = data.redirect_to;

            if (r === 'p') {
                // Протокол поверки
                const params = new URLSearchParams({
                    company_id: String(window.companyId),
                    verification_entry_id: String(ve),
                    metrolog_info_id: String(mi),
                });
                window.location.href = `/verification/api/verification-protocols/one/?${params.toString()}`;
                return;
            }

            if (r === 'm') {
                // Метрологическая информация
                if (mi) {
                    const params = new URLSearchParams({
                        company_id: String(window.companyId),
                        verification_entry_id: String(ve),
                        metrolog_info_id: String(mi),
                    });
                    window.location.href = `/verification/metrologs-control/update/?${params.toString()}`;
                } else {
                    const params = new URLSearchParams({
                        company_id: String(window.companyId),
                        verification_entry_id: String(ve),
                    });
                    window.location.href = `/verification/metrologs-control/create/?${params.toString()}`;
                }
                return;
            }

            if (r === 'v') {
                // Возврат к списку поверок
                const params = new URLSearchParams({
                    company_id: String(window.companyId),
                });
                window.location.href = `/verification/?${params.toString()}`;
                return;
            }

            // Fallback редирект
            window.location.href = `/verification/?company_id=${window.companyId}`;
        } catch (err) {
            console.error('Ошибка отправки формы:', err);
            alert('Произошла ошибка при отправке формы. Попробуйте снова.');
            setBusyState(false, submitter);
        }
    });
});
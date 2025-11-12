import { 
    getTodayInCompanyTz,
    formatDateInTz,
    getYearsDifference, 
    addYearsInTz,
    getCurrentYearInTz 
} from '/static/verification/_utils/date_utils.js';

let lastRegistryData = null;
let originalEntry = {};

function initPhotoDeletion() {
    const list = document.getElementById('photo-list');
    const bucket = document.getElementById('photos-to-delete');
    if (!list) return;
    list.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-delete-photo');
        if (!btn) return;
        const id = btn.dataset.photoId;
        if (!id) return;
        if (!confirm('Удалить это фото?')) return;
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'delete_photo_ids[]';
        input.value = id;
        bucket.appendChild(input);
        btn.closest('li').remove();
    });
}

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

document.addEventListener('DOMContentLoaded', function () {

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

    const phoneInput = document.getElementById('client_phone');
    const phoneMask = IMask(phoneInput, { mask: '+{7} (000) 000-00-00', lazy: false, placeholderChar: '_' });
    phoneMask.updateValue();

    const verificationDateInput = document.getElementById('verification_date');
    verificationDateInput.setAttribute('max', getTodayInCompanyTz());

    document.getElementById('water_type').addEventListener('change', applyMPI);
    document.getElementById('verification_result').addEventListener('change', toggleAdditionalInput);
    document.getElementById('next_verification').addEventListener('change', updateEndVerificationDate);
    document.getElementById('end_verification_date').addEventListener('change', calculateNextVerification);

    const regSelect = document.getElementById('registry_number_id');
    const seriesSelect = document.getElementById('series_id');
    const actInput = document.getElementById('act_number');

    if (regSelect && regSelect.value) {
        loadRegistryData(regSelect.value, true);
    }

    if (seriesSelect && actInput && actInput.value) {
        const digits = (actInput.value || '').replace(/\D/g, '');
        const cleaned = digits.replace(/^0+/, '');
        if (cleaned) {
            const num = parseInt(cleaned, 10);
            if (Number.isFinite(num) && num > 0) {
                const params = new URLSearchParams({
                    company_id: String(window.companyId),
                    series_id: String(encodeURIComponent(seriesSelect.value)),
                    act_number: String(encodeURIComponent(num)),
                });

                fetch(`/verification/api/act-numbers/by-number/?${params.toString()}`)
                    .then(r => r.ok ? r.json() : null)
                    .then(data => {
                        if (!data || data.found === false) return;

                        if (Object.keys(originalEntry).length === 0) {
                            originalEntry = {
                                client_full_name: data.client_full_name || '',
                                client_phone: data.client_phone || '',
                                address: data.address || '',
                                verification_date: data.verification_date || '',
                                legal_entity: data.legal_entity,
                                city_id: data.city_id ?? null
                            };
                        }

                        const setIf = (id, val) => {
                            const el = document.getElementById(id);
                            if (el && val !== undefined && val !== null) el.value = val;
                        };
                        setIf('client_full_name', data.client_full_name);
                        setIf('address', data.address);
                        if (data.client_phone) {
                            try {
                                if (typeof phoneMask !== 'undefined' && phoneMask) {
                                    phoneMask.value = data.client_phone;
                                } else {
                                    document.getElementById('client_phone').value = data.client_phone;
                                }
                            } catch { document.getElementById('client_phone').value = data.client_phone; }
                        }
                        if (data.verification_date) setIf('verification_date', String(data.verification_date));
                        if (data.legal_entity !== undefined && data.legal_entity !== null) {
                            setIf('legal_entity', data.legal_entity);
                        }
                        if (data.city_id !== undefined && data.city_id !== null) {
                            const citySelect = document.getElementById('city_id');
                            if (citySelect && [...citySelect.options].some(o => o.value == String(data.city_id))) {
                                citySelect.value = String(data.city_id);
                            }
                        }
                        applyMPI();
                        updateEndVerificationDate();
                        calculateNextVerification();
                    })
                    .catch(err => console.error('Ошибка подгрузки act_number:', err));
            }
        }
    }

    initPhotoDeletion();
    initPhotoUploadLimit();

    applyMPI();
    toggleAdditionalInput();
    calculateNextVerification();

    const INT_MAX = 2147483647;
    let lastActQuery = null;

    actInput.addEventListener('blur', async () => {
        const digits = (actInput.value || '').replace(/\D/g, '');
        if (!digits) return;

        const cleaned = digits.replace(/^0+/, '');
        if (!cleaned) return;

        const num = parseInt(cleaned, 10);
        if (!Number.isFinite(num) || num < 1) return;

        if (num > INT_MAX) {
            alert(`Номер бланка превышает допустимый максимум (${INT_MAX}).`);
            return;
        }

        const seriesSelect = document.getElementById('series_id');
        const seriesId = seriesSelect ? seriesSelect.value : '';

        const queryKey = `${seriesId}:${num}:${Date.now()}`;
        lastActQuery = queryKey;

        const setIf = (id, val) => {
            const el = document.getElementById(id);
            if (el != null && val !== undefined && val !== null) el.value = val;
        };

        const applyOriginal = () => {
            setIf('client_full_name', originalEntry.client_full_name);
            setIf('address', originalEntry.address);

            const phoneEl = document.getElementById('client_phone');
            if (phoneEl) {
                try {
                    if (typeof phoneMask !== 'undefined' && phoneMask) {
                        phoneMask.value = originalEntry.client_phone || '';
                    } else {
                        phoneEl.value = originalEntry.client_phone || '';
                    }
                } catch {
                    phoneEl.value = originalEntry.client_phone || '';
                }
            }

            if (originalEntry.verification_date) {
                setIf('verification_date', String(originalEntry.verification_date));
            }

            if (typeof originalEntry.legal_entity !== 'undefined' && originalEntry.legal_entity !== null) {
                setIf('legal_entity', originalEntry.legal_entity);
            }

            if (originalEntry.city_id != null) {
                const citySelect = document.getElementById('city_id');
                if (citySelect && [...citySelect.options].some(o => o.value == String(originalEntry.city_id))) {
                    citySelect.value = String(originalEntry.city_id);
                }
            }

            applyMPI();
            updateEndVerificationDate();
            calculateNextVerification();
        };

        try {
            const params = new URLSearchParams({
                company_id: String(window.companyId),
                series_id: String(encodeURIComponent(seriesId)),
                act_number: String(encodeURIComponent(num)),
            });
            const url = `/verification/api/act-numbers/by-number/?${params.toString()}`;
            const resp = await fetch(url, { method: 'GET' });
            if (!resp.ok) {
                if (lastActQuery === queryKey) applyOriginal();
                return;
            }
            let data = null;
            try { data = await resp.json(); } catch { data = null; }

            if (lastActQuery !== queryKey) return;

            if (!data || (typeof data === 'object' && Object.keys(data).length === 0) || data.found === false) {
                applyOriginal();
                return;
            }

            setIf('client_full_name', data.client_full_name);
            setIf('address', data.address);

            const phoneEl = document.getElementById('client_phone');
            if (phoneEl && (data.client_phone !== undefined)) {
                try {
                    if (typeof phoneMask !== 'undefined' && phoneMask) {
                        phoneMask.value = data.client_phone || '';
                    } else {
                        phoneEl.value = data.client_phone || '';
                    }
                } catch {
                    phoneEl.value = data.client_phone || '';
                }
            }

            if (data.verification_date) {
                setIf('verification_date', String(data.verification_date));
            }

            if (data.legal_entity !== undefined && data.legal_entity !== null) {
                setIf('legal_entity', data.legal_entity);
            }

            if (data.city_id !== undefined && data.city_id !== null) {
                const citySelect = document.getElementById('city_id');
                if (citySelect && [...citySelect.options].some(o => o.value == String(data.city_id))) {
                    citySelect.value = String(data.city_id);
                }
            }

            applyMPI();
            updateEndVerificationDate();
            calculateNextVerification();

        } catch (e) {
            console.error('Ошибка запроса /act-number/by-number:', e);
        }
    });

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

    async function uploadPhotos(entryId) {
        const input = document.getElementById('new_verification_images');
        if (!input || !input.files || !input.files.length) {
            console.log('📸 Новые фото не выбраны — пропускаем загрузку.');
            return true;
        }

        const fd = new FormData();
        for (const file of input.files) {
            fd.append('new_images', file);
        }

        const url = `/verification/api/verifications-control/upload-photos/?` +
            new URLSearchParams({
                company_id: String(window.companyId),
                verification_entry_id: String(entryId),
            }).toString();

        try {
            const resp = await fetch(url, {
                method: 'POST',
                body: fd
            });

            let data = null;
            try { data = await resp.json(); } catch (_) { }

            if (!resp.ok) {
                const msg = (data && (data.detail || data.message || data.error || data.errors)) ||
                            `Ошибка ${resp.status}: не удалось загрузить фото.`;
                alert(typeof msg === 'string' ? msg : JSON.stringify(msg));
                return false;
            }

            if (data && data.status === 'ok') {
                console.log(`✅ Фото успешно загружены (${data.uploaded || input.files.length})`);
                return true;
            }

            alert('⚠️ Неожиданный ответ при загрузке фото.');
            return false;

        } catch (err) {
            console.error('Ошибка загрузки фото:', err);
            alert('Ошибка сети при загрузке фото.');
            return false;
        }
    }

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
        const actNum = cleaned === '' ? null : parseInt(cleaned, 10);

        if (actNum === null || !Number.isFinite(actNum) || actNum < 1) {
            alert('Введите корректный номер бланка (целое число > 0).');
            return;
        }
        if (actNum > INT_MAX) {
            alert(`Номер бланка превышает допустимый максимум (${INT_MAX}).`);
            return;
        }

        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const obj = Object.fromEntries(new FormData(form).entries());
        obj.act_number = String(actNum);

        obj.company_tz = window.companyTz || 'Europe/Moscow';

        const params = new URLSearchParams({
            company_id: String(window.companyId),
            verification_entry_id: window.verifEntryId,
            redirect_to_metrolog_info: String(redirectFlag),
        });

        const url = `/verification/api/verifications-control/update/?${params.toString()}`;

        setBusyState(true, submitter);

        try {
            const resp = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(obj)
            });
            let data = null;
            try { data = await resp.json(); } catch (_) { }

            if (resp.ok) {
                if (!data || data.status !== 'ok') {
                    alert('Неожиданный ответ сервера.');
                    setBusyState(false);
                    return;
                }

                const ve = data.verification_entry_id;
                const mi = data.metrolog_info_id;
                const r = data.redirect_to;

                const uploaded = await uploadPhotos(ve);
                if (!uploaded) {
                    alert('⚠️ Фото не удалось загрузить. Запись обновлена, но изображения не добавлены.');
                }

                if (r === 'p') {
                    const params = new URLSearchParams({
                        company_id: String(window.companyId),
                        verification_entry_id: String(ve),
                        metrolog_info_id: String(mi),
                    });
                    if (ve != null && mi != null) {
                        window.location.href = `/verification/api/verification-protocols/one/?${params.toString()}`;
                    } else {
                        alert('Не удалось сформировать протокол: отсутствуют идентификаторы.');
                        setBusyState(false);
                    }
                    return;
                }

                if (r === 'm') {
                    if (!ve) {
                        alert('Не удалось перейти к метрологической информации: отсутствует идентификатор поверки.');
                        setBusyState(false);
                    }
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
                    const params = new URLSearchParams({
                        company_id: String(window.companyId),
                    });
                    window.location.href = `/verification/?${params.toString()}`;
                    return;
                }

                alert('Неизвестное направление редиректа.');
                setBusyState(false);
                return;
            }

            if (resp.status === 400) {
                const msg = (data && (data.detail || data.message || data.error || data.errors)) || 'Ошибка 400: некорректные данные.';
                alert(typeof msg === 'string' ? msg : JSON.stringify(msg));
                setBusyState(false);
                return;
            }

            const msg = (data && (data.detail || data.message || data.error || data.errors)) || `Ошибка ${resp.status}`;
            alert(typeof msg === 'string' ? msg : JSON.stringify(msg));
            setBusyState(false);

        } catch (err) {
            console.error(err);
            alert('Сеть недоступна или сервер временно недоступен.');
            setBusyState(false);
        }
    });
});
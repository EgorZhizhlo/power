document.getElementById('verification_images')
    .addEventListener('change', function () {
        if (this.files.length > window.photoLimit) {
            alert(`Выбрано более ${window.photoLimit} файлов. Пожалуйста, загрузите не более ${window.photoLimit} изображений.`);
            this.value = '';
        }
    });

function getFullYearFromRegistryNumber(registryNumber) {
    const parts = registryNumber.split('-');
    const lastTwoDigits = parseInt(parts[1], 10);
    const currentYear = new Date().getFullYear();
    return lastTwoDigits <= (currentYear % 100) ? 2000 + lastTwoDigits : 1900 + lastTwoDigits;
}

function populateVerificationOptions(maxValue) {
    const intervalSelect = document.getElementById('interval');
    intervalSelect.innerHTML = '<option value="" disabled selected>Выберите интервал</option>';
    for (let year = 0; year <= maxValue; year++) {
        const yearLabel = `${year} ${[1, 2, 3, 4].includes(year) ? "год" + (year > 1 ? "a" : "") : "лет"}`;
        const option = document.createElement('option');
        option.value = year;
        option.textContent = yearLabel;
        intervalSelect.appendChild(option);
    }
}

function updateEndVerificationDate() {
    const verificationDateInput = document.getElementById('verification_date');
    const intervalSelect = document.getElementById('interval');
    const endVerificationDateInput = document.getElementById('end_verification_date');

    const inputDateValue = verificationDateInput.value;
    const verificationDate = new Date(inputDateValue);
    const yearsToAdd = parseInt(intervalSelect.value) || 0;
    if (!isNaN(verificationDate.getTime()) && !isNaN(yearsToAdd)) {
        verificationDate.setFullYear(verificationDate.getFullYear() + yearsToAdd);
        verificationDate.setDate(verificationDate.getDate() - 1);
        endVerificationDateInput.value = verificationDate.toISOString().split('T')[0];
    } else {
        endVerificationDateInput.value = '';
    }
}

function calculateNextVerification() {
    const verificationDateInput = document.getElementById('verification_date');
    const endVerificationDateInput = document.getElementById('end_verification_date');
    const intervalSelect = document.getElementById('interval');

    const verificationDate = new Date(verificationDateInput.value);
    const endVerificationDate = new Date(endVerificationDateInput.value);
    if (!isNaN(verificationDate.getTime()) && !isNaN(endVerificationDate.getTime())) {
        intervalSelect.value = endVerificationDate.getFullYear() - verificationDate.getFullYear();
    } else {
        intervalSelect.value = '';
    }
}

function toggleAdditionalInput() {
    const verificationResult = document.getElementById('verification_result');
    const additionalInput = document.getElementById('additional_input');
    additionalInput.style.display = verificationResult.value === 'False' ? 'block' : 'none';
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
    } else if (cityOptions.length > 0) {
        citySelect.value = cityOptions[0].value;
    }

    verificationDateInput.value = new Date().toISOString().split("T")[0];
}

function applyActNumberData(data) {
    const addressInput = document.getElementById("address");
    const clientNameInput = document.getElementById("client_full_name");
    const phoneInput = document.getElementById("client_phone");
    const legalEntitySelect = document.getElementById("legal_entity");
    const citySelect = document.getElementById("city_id");
    const verificationDateInput = document.getElementById("verification_date");

    addressInput.value = data.address ?? "";
    clientNameInput.value = data.client_full_name ?? "";
    phoneInput.value = data.client_phone ?? "";

    const desiredLegalValue = "legal";
    if ([...legalEntitySelect.options].some(o => o.value === desiredLegalValue)) {
        legalEntitySelect.value = desiredLegalValue;
    } else {
        legalEntitySelect.value = "individual";
    }

    if (data.city_id != null) {
        const cityOpt = [...citySelect.options].find(o => o.value == data.city_id);
        if (cityOpt) citySelect.value = cityOpt.value;
    }

    if (data.verification_date) {
        verificationDateInput.value = String(data.verification_date);
    } else if (!verificationDateInput.value) {
        verificationDateInput.value = new Date().toISOString().split("T")[0];
    }
}

async function fillFormFromServer(actNumberRaw) {
    const keyNum = parseInt(String(actNumberRaw).replace(/\D/g, ''), 10);
    if (!Number.isInteger(keyNum) || keyNum < 1) {
        resetClientFieldsToDefaults();
        return;
    }

    const seriesSelect = document.getElementById('series_id');
    const seriesId = parseInt(String(seriesSelect?.value || '').trim(), 10);

    if (!Number.isInteger(seriesId) || seriesId < 1) {
        alert('Сначала выберите серию бланка.');
        resetClientFieldsToDefaults();
        return;
    }

    const params = new URLSearchParams({
        company_id: String(window.companyId),
        series_id: String(seriesId),
        act_number: String(keyNum),
    });

    const url = `/verification/api/act-numbers/by-number/?${params.toString()}`;

    try {
        const resp = await fetch(url, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            cache: 'no-store'
        });

        let data = null;
        if (resp.ok) {
            try { data = await resp.json(); } catch (_) { }
            if (data) {
                applyActNumberData(data);
            } else {
                resetClientFieldsToDefaults();
            }
        } else if (resp.status === 404) {
            resetClientFieldsToDefaults();
        } else {
            resetClientFieldsToDefaults();
        }
    } catch (e) {
        console.error('fetch act number error:', e);
        resetClientFieldsToDefaults();
    }
}

let lastRegistryData = null;

function rebuildManufactureYears(rYearFromReg) {
    const manufactureYearSelect = document.getElementById('manufacture_year');
    manufactureYearSelect.innerHTML = '<option value="" disabled selected>Выберите год выпуска</option>';

    const currentYear = new Date().getFullYear();

    let startYear = (typeof rYearFromReg === 'number' && !Number.isNaN(rYearFromReg))
        ? rYearFromReg
        : currentYear - 10;

    if (startYear > currentYear) startYear = currentYear;

    const candidates = [];
    for (let y = startYear; y <= currentYear; y++) {
        const opt = document.createElement("option");
        opt.value = y;
        opt.textContent = y;
        manufactureYearSelect.appendChild(opt);
        candidates.push(y);
    }

    if (window.autoManufYear && candidates.length > 0) {
        const randomIdx = Math.floor(Math.random() * candidates.length);
        manufactureYearSelect.value = String(candidates[randomIdx]);
    }
}

async function updateRegistryData(registryNumberId) {
    if (!registryNumberId) return;

    try {
        const params = new URLSearchParams({
            company_id: String(window.companyId),
            registry_number_id: String(registryNumberId),
        });
        const resp = await fetch(`/verification/api/registry-numbers/?${params.toString()}`);
        if (!resp.ok) {
            console.error("Ошибка загрузки registryNumber", resp.status);
            return;
        }
        const data = await resp.json();
        lastRegistryData = data;

        const modificationSelect = document.getElementById('modification_id');
        const prev = modificationSelect.value;
        modificationSelect.innerHTML = '<option value="" disabled>Выберите модификацию</option>';

        const mods = Array.isArray(data.modifications) ? data.modifications : [];
        mods.forEach(m => {
            const opt = document.createElement("option");
            opt.value = m.id;
            opt.textContent = m.modification_name;
            modificationSelect.appendChild(opt);
        });

        if (mods.length > 0) {
            const hasPrev = mods.some(m => String(m.id) === String(prev));
            modificationSelect.value = hasPrev ? String(prev) : String(mods[0].id);
        } else {
            modificationSelect.value = "";
        }

        const methodSelect = document.getElementById('method_id');
        methodSelect.innerHTML = '<option value="" disabled selected>Выберите методику</option>';
        if (data.method) {
            const opt = document.createElement("option");
            opt.value = data.method.id;
            opt.textContent = data.method.name;
            methodSelect.appendChild(opt);
            methodSelect.value = data.method.id;
        }

        document.getElementById('si_type').value = data.si_type || "";
        let rYear = null;
        if (data.registry_number) {
            rYear = getFullYearFromRegistryNumber(data.registry_number);
        }
        rebuildManufactureYears(rYear);
        applyMPI();
    } catch (err) {
        console.error("Ошибка fetch registryNumber:", err);
    }
}

function applyMPI() {
    const intervalSelect = document.getElementById('interval');
    intervalSelect.innerHTML = '<option value="" disabled selected>Выберите интервал</option>';

    let mpiYears = null;
    if (lastRegistryData) {
        const isCold = document.getElementById('water_type').value === 'cold';
        const mpiRaw = isCold ? lastRegistryData.mpi_cold : lastRegistryData.mpi_hot;
        const parsed = parseInt(mpiRaw, 10);
        if (Number.isFinite(parsed) && parsed >= 0) {
            mpiYears = parsed;
        }
    }

    let maxYears;
    const isVerifier = String(window.userStatus || '').toLowerCase() === 'verifier';

    if (isVerifier) {
        maxYears = mpiYears != null ? mpiYears : 0;
    } else {
        maxYears = 15;
    }

    populateVerificationOptions(maxYears);

    if (mpiYears != null) {
        intervalSelect.value = String(mpiYears);
        updateEndVerificationDate();
    }
}

document.addEventListener("DOMContentLoaded", function () {
    $('#registry_number_id').select2({
        width: '100%',
        placeholder: "Выберите номер госреестра",
        allowClear: true
    });
    $('#registry_number_id').on('change', function () {
        const val = $(this).val();
        if (val) updateRegistryData(val);
    });

    const phoneInput = document.getElementById("client_phone");
    const phoneMask = IMask(phoneInput, {
        mask: '+{7} (000) 000-00-00',
        lazy: false
    });

    const verificationResult = document.getElementById('verification_result');
    const verificationDateInput = document.getElementById('verification_date');
    const intervalSelect = document.getElementById('interval');
    const endVerificationDateInput = document.getElementById('end_verification_date');
    const registryNumberIdInput = document.getElementById('registry_number_id');
    const waterTypeInput = document.getElementById('water_type');
    waterTypeInput.addEventListener('change', applyMPI);
    verificationDateInput.setAttribute('max', new Date().toISOString().split('T')[0]);
    verificationResult.addEventListener('change', toggleAdditionalInput);

    verificationDateInput.addEventListener('blur', function () {
        if (!verificationDateInput.value) return;

        const currentYear = new Date().getFullYear();
        const parts = verificationDateInput.value.split('-');
        if (parts.length !== 3) return;

        const vYear = parseInt(parts[0], 10);
        if (vYear > currentYear) {
            alert(`Введен неверный год, введите год не позже чем ${currentYear}`);
            verificationDateInput.value = '';
            return;
        }

        const registryNumberId = registryNumberIdInput.value;
        if (registryNumberId) {
            const regText = registryNumberIdInput.options[registryNumberIdInput.selectedIndex].text;
            const rYear = getFullYearFromRegistryNumber(regText);
            if (vYear < rYear) {
                alert(`Введен неверный год, введите год не раньше чем ${rYear}`);
                verificationDateInput.value = '';
                return;
            }
        }

        updateEndVerificationDate();
        calculateNextVerification();
    });

    endVerificationDateInput.addEventListener('change', calculateNextVerification);

    intervalSelect.addEventListener('change', () => {
        updateEndVerificationDate();
    });

    const INT_MAX = 2147483647;
    const actInput = document.getElementById("act_number");

    function getSanitizedActNumber() {
        const onlyDigits = (actInput.value || '').replace(/\D/g, '');
        if (!onlyDigits) return null;
        const trimmed = onlyDigits.replace(/^0+/, '');
        if (trimmed === '') return 0;
        const num = parseInt(trimmed, 10);
        return Number.isFinite(num) ? num : null;
    }

    const seriesSelectEl = document.getElementById('series_id');
    if (seriesSelectEl && !seriesSelectEl.disabled) {
        seriesSelectEl.addEventListener('change', async () => {
            const num = getSanitizedActNumber();
            if (num === null || num < 1 || num > INT_MAX) return;

            await fillFormFromServer(String(num));

            updateEndVerificationDate();
            calculateNextVerification();
        });
    }

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

    actInput.addEventListener('paste', (e) => {
        e.preventDefault();
        const text = (e.clipboardData || window.clipboardData).getData('text');
        const digits = text.replace(/\D/g, '');
        const start = actInput.selectionStart;
        const end = actInput.selectionEnd;
        const current = actInput.value;
        actInput.value = current.slice(0, start) + digits + current.slice(end);
        actInput.setSelectionRange(start + digits.length, start + digits.length);
    });

    actInput.addEventListener('input', () => {
        actInput.value = (actInput.value || '').replace(/\D/g, '');
    });

    actInput.addEventListener('blur', async () => {
        const num = getSanitizedActNumber();
        if (num === null || num < 1) {
            resetClientFieldsToDefaults();
            return;
        }
        if (num > INT_MAX) {
            alert(`Номер бланка превышает допустимый максимум (${INT_MAX}).`);
            return;
        }

        await fillFormFromServer(String(num));
        updateEndVerificationDate();
        calculateNextVerification();
    });

    toggleAdditionalInput();
    calculateNextVerification();
    if (registryNumberIdInput.value) {
        updateRegistryData(registryNumberIdInput.value);
    }

    const form = document.getElementById('add-entry-form');
    const buttons = form.querySelectorAll('button[type=submit]');
    const locationSelect = document.getElementById('location_id');

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

    function enableButtons() { setBusyState(false); }
    enableButtons();
    window.addEventListener('pageshow', enableButtons);

    async function uploadPhotos(entryId) {
        const input = document.getElementById('verification_images');
        if (!input || !input.files || !input.files.length) {
            console.log('Фото не выбраны, пропускаем загрузку.');
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
                console.log(`✅ Загружено фото: ${data.uploaded}`);
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


    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        if (isSubmitting) return;

        const submitter = e.submitter || null;
        const redirectFlag = (submitter && submitter.id === 'add-entry-and-metrolog') ? '1' : '0';

        if (!locationSelect.value) {
            alert('Пожалуйста, выберите расположение счетчика.');
            return;
        }

        const raw = phoneMask.unmaskedValue;
        const allowShort = raw.length <= 2;
        const allowFull = phoneMask.masked.isComplete;
        if (!(allowShort || allowFull)) {
            alert('Введите телефон полностью (+7 (xxx) xxx-xx-xx) или оставьте +7');
            return;
        }

        const today = new Date().toISOString().split('T')[0];
        if (verificationDateInput.value && verificationDateInput.value > today) {
            alert('Дата поверки не может быть позже сегодняшнего дня.');
            return;
        }

        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const INT_MAX = 2147483647;
        const actInput = document.getElementById('act_number');
        const rawAct = (actInput.value || '').replace(/\D/g, '');
        const cleaned = rawAct.replace(/^0+/, '');
        const actNum = cleaned === '' ? null : parseInt(cleaned, 10);

        if (actNum === null || actNum < 1) {
            alert('Введите номер бланка (только цифры, минимум 1).');
            return;
        }
        if (actNum > INT_MAX) {
            alert(`Номер бланка превышает допустимый максимум (${INT_MAX}).`);
            return;
        }

        const fd = new FormData(form);
        fd.set('act_number', String(actNum));

        const obj = {};
        fd.forEach((v, k) => {
            if (v === 'True') obj[k] = true;
            else if (v === 'False') obj[k] = false;
            else obj[k] = v;
        });

        const params = new URLSearchParams({
            company_id: String(window.companyId),
            redirect_to_metrolog_info: String(redirectFlag),
        });

        const url = `/verification/api/verifications-control/create/?${params.toString()}`;

        setBusyState(true, submitter);

        let resp;
        try {
            resp = await fetch(url, { 
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
                    alert('Некоторые фото не удалось загрузить. Запись сохранена, но фото отсутствуют.');
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
                const msg =
                    (data && (data.detail || data.message || data.error || data.errors)) ||
                    'Ошибка 400: некорректные данные.';
                alert(typeof msg === 'string' ? msg : JSON.stringify(msg));
                setBusyState(false);
                return;
            }

            const msg =
                (data && (data.detail || data.message || data.error || data.errors)) ||
                `Ошибка ${resp.status}`;
            alert(typeof msg === 'string' ? msg : JSON.stringify(msg));

            setBusyState(false);
            return;

        } catch (err) {
            console.error(err);
            alert('Сеть недоступна или сервер временно недоступен.');
            setBusyState(false);
        }
    });
});

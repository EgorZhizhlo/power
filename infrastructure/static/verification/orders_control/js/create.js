// Получаем данные из глобального объекта window
const companyId = window.companyId;
const userStatus = window.userStatus;
const autoManufactureYear = window.autoManufactureYear;
const prefillData = window.prefillData;
const defaultCityId = window.defaultCityId;

const form = document.getElementById('add-order-form');
const verificationResult = document.getElementById('verification_result');
const additionalInput = document.getElementById('additional_input');
const verificationDateInput = document.getElementById('verification_date');
const nextVerificationSelect = document.getElementById('interval');
const endVerificationDateInput = document.getElementById('end_verification_date');
const manufactureYearSelect = document.getElementById('manufacture_year');
const registryNumberIdInput = document.getElementById('registry_number_id');
const waterTypeInput = document.getElementById('water_type');
const modificationSelect = document.getElementById('modification_id');
const methodSelect = document.getElementById('method_id');
const siTypeInput = document.getElementById('si_type');
const seriesSelect = document.getElementById('series_id');
const actInput = document.getElementById('act_number');

// === Ограничения и обработка act_number ===
const INT_MAX = 2147483647;

// keydown — разрешаем только цифры и ctrl/cmd-команды
actInput.addEventListener('keydown', (e) => {
  const allowedCtrl =
    e.key === 'Backspace' || e.key === 'Delete' || e.key === 'Tab' ||
    e.key === 'Escape' || e.key === 'Enter' ||
    e.key.startsWith("Arrow") ||
    ((e.ctrlKey || e.metaKey) && ['a','c','v','x'].includes(e.key.toLowerCase()));
  if (allowedCtrl) return;

  if (/^[0-9]$/.test(e.key)) return; // цифры 0–9
  e.preventDefault();
});

// paste — обрабатываем буфер обмена
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

// input — страховка, вдруг обошли keydown/paste
actInput.addEventListener('input', () => {
  actInput.value = (actInput.value || '').replace(/\D/g, '');
});

// blur — можно запускать автозаполнение
actInput.addEventListener('blur', queryActNumber);

let lastRegistryData = null;
let isInitialRegistryLoad = false; // Флаг для предотвращения двойной загрузки

// === Select2 init + правильные события ===
document.addEventListener('DOMContentLoaded', function () {
  $('#registry_number_id').select2({
    width: '100%',
    placeholder: 'Выберите номер госреестра',
    allowClear: true
  });

  const onRegistryChanged = async (e) => {
    // Пропускаем обработчик, если идёт начальная загрузка
    if (isInitialRegistryLoad) {
      console.log('[onRegistryChanged] Пропуск - идёт начальная загрузка');
      console.log('[onRegistryChanged] Пропуск - идёт начальная загрузка');
      return;
    }

    const selectedId =
      (e && e.params && e.params.data && e.params.data.id) ||
      $('#registry_number_id').val();

    console.log('[onRegistryChanged] Событие:', e.type, 'selectedId:', selectedId);

    console.log('[onRegistryChanged] Событие:', e.type, 'selectedId:', selectedId);

    if (!selectedId) {
      resetRegistryDependentFields();
      return;
    }
    await loadRegistryData(selectedId, { isInitial: false });
  };

  // Используем только специфичные события Select2, без 'change' чтобы избежать дублирования
  $('#registry_number_id').on('select2:select', onRegistryChanged);
  $('#registry_number_id').on('select2:clear', onRegistryChanged);
});

// === Маска телефона ===
const phoneInput = document.getElementById('client_phone');
const phoneMask = IMask(phoneInput, {
  mask: '+{7} (000) 000-00-00',
  lazy: false,
  placeholderChar: '_'
});
phoneMask.updateValue();

// ===== helpers =====
function resetRegistryDependentFields() {
  lastRegistryData = null;
  modificationSelect.innerHTML = '<option value="" disabled selected>Выберите модификацию СИ</option>';
  methodSelect.innerHTML = '<option value="" disabled selected>Выберите методику</option>';
  siTypeInput.value = '';
  manufactureYearSelect.innerHTML = '<option value="" disabled selected>Выберите год выпуска поверяемого СИ</option>';
  nextVerificationSelect.innerHTML = '<option value="" disabled selected>Выберите интервал</option>';
  endVerificationDateInput.value = '';
}

function toggleAdditionalInput() {
  additionalInput.style.display = verificationResult.value === 'False' ? 'block' : 'none';
}

function updateEndVerificationDate() {
  const v = verificationDateInput.value;
  const d = new Date(v);
  const addYears = parseInt(nextVerificationSelect.value, 10) || 0;
  if (!isNaN(d.getTime())) {
    d.setFullYear(d.getFullYear() + addYears);
    d.setDate(d.getDate() - 1);
    endVerificationDateInput.value = d.toISOString().split('T')[0];
  } else {
    endVerificationDateInput.value = '';
  }
}

function calculateNextVerification() {
  const start = new Date(verificationDateInput.value);
  const end = new Date(endVerificationDateInput.value);
  if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
    nextVerificationSelect.value = String(end.getFullYear() - start.getFullYear());
  } else {
    nextVerificationSelect.value = '';
  }
}

function getFullYearFromRegistryNumber(regNum) {
  const parts = String(regNum || '').split('-');
  const lastTwo = parseInt(parts[1], 10);
  const currentYear = new Date().getFullYear();
  if (Number.isNaN(lastTwo)) return currentYear;
  return lastTwo <= (currentYear % 100) ? 2000 + lastTwo : 1900 + lastTwo;
}

function populateVerificationOptions(maxValue) {
  nextVerificationSelect.innerHTML = '<option value="" disabled selected>Выберите интервал</option>';
  for (let yr = 0; yr <= maxValue; yr++) {
    const label = `${yr} ${[1,2,3,4].includes(yr) ? 'год' + (yr > 1 ? 'a' : '') : 'лет'}`;
    const opt = document.createElement('option');
    opt.value = String(yr);
    opt.textContent = label;
    nextVerificationSelect.appendChild(opt);
  }
}

function applyMPI() {
  const waterIsCold = waterTypeInput.value === 'cold';
  let mpi = null;
  if (lastRegistryData) {
    const raw = waterIsCold ? lastRegistryData.mpi_cold : lastRegistryData.mpi_hot;
    const n = parseInt(raw, 10);
    if (Number.isFinite(n) && n >= 0) mpi = n;
  }
  const isAdminDir = (userStatus === 'admin' || userStatus === 'director');
  const maxYears = isAdminDir ? 15 : (mpi ?? 0);

  populateVerificationOptions(maxYears);
  if (mpi != null) {
    nextVerificationSelect.value = String(Math.min(mpi, maxYears));
  }
  updateEndVerificationDate();
}

async function loadRegistryData(registryNumberId, { isInitial = false } = {}) {
  if (!registryNumberId) return;
  console.log('[loadRegistryData] ВЫЗОВ:', { registryNumberId, isInitial, autoManufactureYear, userStatus });
  console.log('[loadRegistryData] ВЫЗОВ:', { registryNumberId, isInitial, autoManufactureYear, userStatus });
  try {
    const params = new URLSearchParams({
      company_id: companyId,
      registry_number_id: registryNumberId
    });
    const resp = await fetch(`/verification/api/registry-numbers/?${params.toString()}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      cache: 'no-store'
    });
    if (!resp.ok) return;
    const data = await resp.json();
    lastRegistryData = data;

    // Модификации
    modificationSelect.innerHTML = '<option value="" disabled selected>Выберите модификацию СИ</option>';
    const mods = Array.isArray(data.modifications) ? data.modifications : [];
    mods.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.id;
      opt.textContent = m.modification_name || m.name || '';
      modificationSelect.appendChild(opt);
    });
    if (mods.length > 0) {
      modificationSelect.value = String(mods[0].id);
    }

    // Методика
    methodSelect.innerHTML = '<option value="" disabled selected>Выберите методику</option>';
    if (data.method) {
      const opt = document.createElement('option');
      opt.value = data.method.id;
      opt.textContent = data.method.name;
      opt.selected = true;
      methodSelect.appendChild(opt);
    }

    // Тип СИ
    siTypeInput.value = data.si_type || '';

    // Годы выпуска
    const regText = data.registry_number;
    const startYear = getFullYearFromRegistryNumber(regText);
    const isAdminDir = (userStatus === 'admin' || userStatus === 'director');
    const endYear = isAdminDir ? new Date().getFullYear() : Math.min(startYear + 10, new Date().getFullYear());

    manufactureYearSelect.innerHTML = '<option value="" disabled selected>Выберите год выпуска поверяемого СИ</option>';
    const years = [];
    for (let y = startYear; y <= endYear; y++) {
      years.push(y);
      const opt = document.createElement('option');
      opt.value = String(y);
      opt.textContent = y;
      manufactureYearSelect.appendChild(opt);
    }

    // Устанавливаем год выпуска ОДИН РАЗ
    console.log('[loadRegistryData] Установка года выпуска:', { isInitial, hasPrefillData: !!prefillData, prefillYear: prefillData?.manufacture_year });
    
    if (isInitial && prefillData && prefillData.manufacture_year) {
      // При начальной загрузке с префиллом - используем prefill
      if ([...manufactureYearSelect.options].some(o => o.value == String(prefillData.manufacture_year))) {
        manufactureYearSelect.value = String(prefillData.manufacture_year);
        console.log('[loadRegistryData] Год выпуска установлен из prefill:', prefillData.manufacture_year);
      } else if (years.length > 0) {
        manufactureYearSelect.value = String(years[0]);
        console.log('[loadRegistryData] Год выпуска из prefill не найден, установлен первый доступный:', years[0]);
      }
    } else if (!isInitial) {
      // При последующих изменениях реестра (не initial) - применяем автоматику
      if (autoManufactureYear && years.length > 0) {
        const rnd = years[Math.floor(Math.random() * years.length)];
        manufactureYearSelect.value = String(rnd);
        console.log('[loadRegistryData] Год выпуска установлен случайно (autoManufactureYear=true):', rnd);
      } else if (years.length > 0) {
        manufactureYearSelect.value = String(years[0]);
        console.log('[loadRegistryData] Год выпуска установлен первый из списка:', years[0]);
      }
    } else {
      console.log('[loadRegistryData] Год выпуска НЕ установлен (isInitial=true, но нет prefillData)');
    }
    // Если isInitial=true но нет prefillData - вообще не трогаем значение

    // Интервал / MPI
    applyMPI();

  } catch (e) {
    console.error('Ошибка загрузки registry data:', e);
  }
}

function fillFromOrder(prefill) {
  if (!prefill) return;
  Object.entries(prefill).forEach(([key, value]) => {
    if (value === null || value === undefined) return;
    
    // Пропускаем manufacture_year - он будет установлен через loadRegistryData
    if (key === 'manufacture_year') return;
    
    const el = document.querySelector(`[name="${key}"]`);
    if (!el) return;

    if (el.type === 'checkbox') {
      el.checked = (value === 'True' || value === true);
    } else {
      el.value = value;
    }
    if (el.classList.contains('select2-hidden-accessible')) {
      $(el).trigger('change');
    }
  });

  toggleAdditionalInput();
  updateEndVerificationDate();
  calculateNextVerification();
}

// ===== Запрос по номеру акта (и серии) =====
let lastActQueryKey = null;

async function queryActNumber() {
  const seriesId = seriesSelect ? seriesSelect.value : '';
  const digits = (actInput.value || '').replace(/\D/g, '').replace(/^0+/, '');
  if (!seriesId || !digits) return;

  const num = parseInt(digits, 10);
  if (!Number.isFinite(num) || num < 1) return;
  if (num > INT_MAX) {
    alert(`Номер бланка превышает допустимый максимум (${INT_MAX}).`);
    return;
  }

  // Дедупликация
  const queryKey = `${seriesId}:${num}`;
  lastActQueryKey = queryKey;

  try {
    const params = new URLSearchParams({
      company_id: companyId,
      series_id: seriesId,
      act_number: num
    });
    const url = `/verification/api/act-numbers/by-number/?${params.toString()}`;
    const resp = await fetch(url, { 
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      cache: 'no-store'
    });

    let data = null;
    if (resp.ok) {
      try { data = await resp.json(); } catch { data = null; }
      if (lastActQueryKey !== queryKey) return; // пришёл старый ответ — игнорим
      
      if (data && data.found !== false) {
        // ====== Заполняем, если акт найден ======
        const setIf = (id, val) => {
          const el = document.getElementById(id);
          if (el != null && val !== undefined && val !== null) el.value = val;
        };

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

        if (data.verification_date) setIf('verification_date', String(data.verification_date));

        if (data.legal_entity !== undefined && data.legal_entity !== null) {
          setIf('legal_entity', data.legal_entity ? 'legal' : 'individual');
          document.getElementById('legal_entity').dispatchEvent(new Event('change'));
        }

        if (data.city_id !== undefined && data.city_id !== null) {
          const citySelect = document.getElementById('city_id');
          if (citySelect && [...citySelect.options].some(o => o.value == String(data.city_id))) {
            citySelect.value = String(data.city_id);
            citySelect.dispatchEvent(new Event('change'));
          }
        }

        updateEndVerificationDate();
        calculateNextVerification();
      } else {
        // Акт не найден — сбрасываем обратно данные формы (префилл)
        fillFromOrder(prefillData);
      }
    } else if (resp.status === 404) {
      // 404 — акт не найден, сбрасываем на префилл
      if (lastActQueryKey !== queryKey) return;
      fillFromOrder(prefillData);
    } else {
      // Другие ошибки — сбрасываем на префилл
      if (lastActQueryKey !== queryKey) return;
      fillFromOrder(prefillData);
    }
  } catch (e) {
    console.error('Ошибка запроса /act-numbers/by-number:', e);
  }
}

// === Первичная инициализация ===
document.addEventListener('DOMContentLoaded', function () {
  // ограничим дату «не позже сегодня»
  verificationDateInput.setAttribute('max', new Date().toISOString().split('T')[0]);

  // 1) Префилл из order
  fillFromOrder(prefillData);

  // 2) Серия по умолчанию
  if (seriesSelect && !seriesSelect.disabled && !seriesSelect.value) {
    const firstOption = Array.from(seriesSelect.options)
      .find(o => !o.disabled && String(o.value).trim() !== '');
    if (firstOption) {
      seriesSelect.value = firstOption.value;
      seriesSelect.dispatchEvent(new Event('change'));
    }
  }

  // 3) Если в prefill есть реестр — подтянуть детали (isInitial=true)
  if (prefillData && prefillData.registry_number_id) {
    // Устанавливаем флаг ДО trigger('change'), чтобы предотвратить двойную загрузку
    isInitialRegistryLoad = true;
    
    // Выставим значение на select2
    $('#registry_number_id').val(String(prefillData.registry_number_id));
    
    // Загружаем данные реестра с флагом isInitial
    loadRegistryData(prefillData.registry_number_id, { isInitial: true }).finally(() => {
      // Снимаем флаг после загрузки
      isInitialRegistryLoad = false;
    });
  }

  // handlers
  verificationResult.addEventListener('change', toggleAdditionalInput);

  // << ВАЖНО: эти 2 обработчика — запрос по номеру акта при смене акт/серии >>
  seriesSelect.addEventListener('change', queryActNumber);

  // MPI пересчёт при смене типа воды
  waterTypeInput.addEventListener('change', applyMPI);

  endVerificationDateInput.addEventListener('change', calculateNextVerification);

  // Валидация вручную введённой даты, с учётом lastRegistryData
  verificationDateInput.addEventListener('blur', function () {
    if (!verificationDateInput.value) return;
    const currentYear = new Date().getFullYear();
    const parts = verificationDateInput.value.split('-');
    if (parts.length !== 3) return;
    const vYear = parseInt(parts[0], 10);
    if (vYear > currentYear) {
      alert(`Введен неверный год, введите год не позже чем ${currentYear}`);
      verificationDateInput.value = '';
    }
    if (lastRegistryData && lastRegistryData.registry_number) {
      const rYear = getFullYearFromRegistryNumber(lastRegistryData.registry_number);
      if (vYear < rYear) {
        alert(`Введен неверный год, введите год не раньше чем ${rYear}`);
        verificationDateInput.value = '';
      }
    }
  });
});

// === Отправка формы ===
(function () {
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

  // Функция загрузки фотографий
  async function uploadPhotos(verificationEntryId) {
    const photosInput = document.getElementById('verification_images');
    if (!photosInput || !photosInput.files || photosInput.files.length === 0) {
      return { success: true };
    }

    const formData = new FormData();
    Array.from(photosInput.files).forEach((file) => {
      formData.append('files', file);
    });

    const params = new URLSearchParams({
      company_id: companyId,
      verification_entry_id: verificationEntryId
    });

    try {
      const resp = await fetch(`/verification/api/verifications-control/upload-photos/?${params.toString()}`, {
        method: 'POST',
        body: formData
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        return { 
          success: false, 
          error: errorData.detail || `Ошибка загрузки фото: ${resp.status}` 
        };
      }

      return { success: true };
    } catch (err) {
      console.error('Ошибка при загрузке фото:', err);
      return { success: false, error: 'Ошибка сети при загрузке фотографий' };
    }
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (isSubmitting) return;

    const submitter = e.submitter || null;
    const redirectFlag = (submitter && submitter.id === 'submit-order-and-metrolog') ? '1' : '0';

    // валидируем телефон
    const raw = phoneMask.unmaskedValue;
    const allowShort = raw.length <= 2;
    const allowFull = phoneMask.masked.isComplete;
    if (!(allowShort || allowFull)) {
      alert('Введите телефон полностью (+7 (xxx) xxx-xx-xx) или оставьте до 2 цифр.');
      return;
    }

    // дата не в будущем
    const today = new Date().toISOString().split('T')[0];
    if (verificationDateInput.value && verificationDateInput.value > today) {
      alert('Дата поверки не может быть позже сегодняшнего дня.');
      return;
    }

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    // номер бланка — очищаем и валидируем
    const rawAct = (actInput.value || '').replace(/\D/g, '');
    const cleaned = rawAct.replace(/^0+/, '');
    const actNum = cleaned === '' ? null : parseInt(cleaned, 10);

    if (actNum === null || actNum < 1) {
      alert('Введите корректный номер бланка (> 0).');
      setBusyState(false);
      return;
    }
    if (actNum > INT_MAX) {
      alert(`Номер бланка превышает допустимый максимум (${INT_MAX}).`);
      setBusyState(false);
      return;
    }

    const fd = new FormData(form);
    fd.set('act_number', String(actNum));
    
    // Удаляем файлы из FormData, загрузим их отдельно после создания записи
    fd.delete('verification_images');

    // Конвертируем FormData в объект с правильными типами
    const obj = {};
    fd.forEach((v, k) => {
      if (v === 'True') obj[k] = true;
      else if (v === 'False') obj[k] = false;
      else obj[k] = v;
    });

    const params = new URLSearchParams({
      company_id: companyId,
      order_id: window.orderId,
      redirect_to_metrolog_info: redirectFlag
    });
    const url = `/verification/api/orders-control/create/?${params.toString()}`;

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
          console.error('Неожиданный ответ сервера:', data);
          alert('Неожиданный ответ сервера.');
          setBusyState(false);
          return;
        }

        const ve = data.verification_entry_id;
        const mi = data.metrolog_info_id;
        const r = data.redirect_to; // 'p' | 'm' | 'v'

        // Загружаем фотографии, если они есть
        const photosInput = document.getElementById('verification_images');
        if (photosInput && photosInput.files && photosInput.files.length > 0) {
          const uploadResult = await uploadPhotos(ve);
          if (!uploadResult.success) {
            alert(`Запись создана, но ошибка при загрузке фото: ${uploadResult.error}`);
          }
        }

        // Редиректы
        if (r === 'p') {
          if (ve != null && mi != null) {
            const protocolParams = new URLSearchParams({
              company_id: companyId,
              verification_entry_id: ve,
              metrolog_info_id: mi
            });
            window.location.href = `/verification/api/verification-protocols/one/?${protocolParams.toString()}`;
          } else {
            alert('Не удалось сформировать протокол: отсутствуют идентификаторы.');
            setBusyState(false);
          }
          return;
        }
        if (r === 'm') {
          if (ve != null) {
            const metrologParams = new URLSearchParams({
              company_id: companyId,
              verification_entry_id: ve
            });
            window.location.href = `/verification/metrologs-control/create/?${metrologParams.toString()}`;
          } else {
            alert('Не удалось перейти к метрологической информации: отсутствует идентификатор поверки.');
            setBusyState(false);
          }
          return;
        }
        if (r === 'v') {
          const listParams = new URLSearchParams({ company_id: companyId });
          window.location.href = `/verification/orders-control/?${listParams.toString()}`;
          return;
        }
        const listParams = new URLSearchParams({ company_id: companyId });
        window.location.href = `/verification/orders-control/?${listParams.toString()}`;
        return;
      }

      // Ошибка от сервера
      console.error('Ошибка сервера:', {
        status: resp.status,
        statusText: resp.statusText,
        data: data
      });
      const msg = (data && (data.detail || data.message || data.error || data.errors)) || `Ошибка ${resp.status}`;
      alert(typeof msg === 'string' ? msg : JSON.stringify(msg));
      setBusyState(false);
    } catch (err) {
      console.error('Ошибка при отправке формы:', err);
      alert('Сеть недоступна или сервер временно недоступен.');
      setBusyState(false);
    }
  });
})();

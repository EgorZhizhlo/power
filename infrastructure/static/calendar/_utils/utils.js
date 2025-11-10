/**
 * Форматирует строку цифр в телефон вида +7 (XXX) XXX-XX-XX
 * и возвращает количество вставленных символов для корректировки курсора.
 * @param {string} value — исходная строка (с цифрами и разделителями)
 * @returns {{ formatted: string, cursorMove: number }}
 */
function maskPhone(value) {
  // Извлекаем только цифры
  let numbers = value.replace(/\D/g, "");
  // Приводим к российскому формату
  if (numbers.startsWith("8")) {
    numbers = "7" + numbers.slice(1);
  }
  if (!numbers.startsWith("7")) {
    numbers = "7" + numbers;
  }
  // Обрезаем до 11 цифр
  numbers = numbers.slice(0, 11);

  let formatted = "+7";
  let cursorMove = 0;

  // Добавляем " (XXX"
  if (numbers.length > 1) {
    formatted += " (" + numbers.substring(1, 4);
    cursorMove += 2; // " ("
  }

  // Закрываем скобку и добавляем пробел + "XXX"
  if (numbers.length >= 5) {
    formatted += ") " + numbers.substring(4, 7);
    cursorMove += 2; // ") "
  }

  // Первая часть дефиса + "XX"
  if (numbers.length >= 8) {
    formatted += "-" + numbers.substring(7, 9);
    cursorMove += 1; // "-"
  }

  // Вторая часть дефиса + "XX"
  if (numbers.length >= 10) {
    formatted += "-" + numbers.substring(9, 11);
    cursorMove += 1; // "-"
  }

  return { formatted, cursorMove };
}

/**
 * Накладывает маску на поля телефона.
 * Поля, в которые нужно вставлять телефон, должны иметь атрибут data-phone-input.
 * Формат применяется сразу при вводе, с корректным перемещением курсора.
 */
export function preparePhoneMasks() {
  const inputs = document.querySelectorAll('input[data-phone-input]');
  inputs.forEach(input => {
    input.addEventListener("input", function () {
      const oldLength = this.value.length;
      let cursorPosition = this.selectionStart;

      // Гарантируем, что курсор не уходит слишком влево
      if (cursorPosition < 3) cursorPosition = 3;

      // Форматируем и получаем смещение для курсора
      const { formatted, cursorMove } = maskPhone(this.value);

      // Обновляем значение поля
      this.value = formatted;

      // Рассчитываем новую длину и позицию курсора
      const newLength = formatted.length;
      if (newLength > oldLength) {
        cursorPosition += cursorMove;
      }
      this.setSelectionRange(cursorPosition, cursorPosition);
    });
  });
}

/**
 * Оставляем для совместимости:
 * форматирует строку цифр в +7 (XXX) XXX-XX-XX без учёта курсора.
 * Можно использовать при blur или сохранении значения.
 * @param {string} value
 * @returns {string}
 */
export function formatPhone(value) {
  return maskPhone(value).formatted;
}

/**
 * Дебаунсер: оборачивает функцию так, чтобы она вызывалась не чаще, чем
 * один раз за wait миллисекунд.
 * @param {Function} fn
 * @param {number} wait — задержка в мс
 */
export function debounce(fn, wait = 300) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), wait);
  };
}

/**
 * Преобразует ISO-строку 'YYYY-MM-DD' или объект Date в объект Date.
 * @param {string|Date} value
 * @returns {Date}
 */
export function parseISODate(value) {
  if (value instanceof Date) return value;
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Форматирует объект Date в строку 'YYYY-MM-DD'
 * @param {Date} date
 * @returns {string}
 */
export function formatDateToISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

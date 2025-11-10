/**
 * Обработчик формы для генерации отчета по номерам актов
 */

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('act-number-form');
    const resetButton = document.getElementById('reset-form');
    const loadingIndicator = document.getElementById('loading-indicator');
    const errorMessage = document.getElementById('error-message');

    /**
     * Показать индикатор загрузки
     */
    function showLoading() {
        loadingIndicator.style.display = 'block';
        errorMessage.style.display = 'none';
    }

    /**
     * Скрыть индикатор загрузки
     */
    function hideLoading() {
        loadingIndicator.style.display = 'none';
    }

    /**
     * Показать сообщение об ошибке
     */
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        hideLoading();
    }

    /**
     * Скачать файл
     */
    function downloadFile(blob, filename) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }

    /**
     * Извлечь имя файла из заголовков ответа
     */
    function getFilenameFromResponse(response) {
        const disposition = response.headers.get('Content-Disposition');
        if (disposition) {
            const filenameMatch = disposition.match(/filename\*=UTF-8''(.+)/);
            if (filenameMatch) {
                return decodeURIComponent(filenameMatch[1]);
            }
            const simpleMatch = disposition.match(/filename="?(.+)"?/);
            if (simpleMatch) {
                return simpleMatch[1];
            }
        }
        const today = new Date().toISOString().split('T')[0];
        return `Статистика_по_номерам_актов_${today}.xlsx`;
    }

    /**
     * Обработка отправки формы
     */
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const formData = new FormData(form);
        const act_number_from = formData.get('act_number_from');
        const act_number_to = formData.get('act_number_to');
        const series_id = formData.get('series_id');

        // Валидация
        if (!act_number_from || !act_number_to) {
            showError('Пожалуйста, укажите диапазон номеров актов (от и до).');
            return;
        }

        if (parseInt(act_number_from) > parseInt(act_number_to)) {
            showError('Начальный номер не может быть больше конечного.');
            return;
        }

        // Формируем URL с параметрами
        const params = new URLSearchParams({
            company_id: window.company_id,
            act_number_from: act_number_from,
            act_number_to: act_number_to
        });

        if (series_id) {
            params.append('series_id', series_id);
        }

        const url = `/verification/api/reports/act-numbers/?${params.toString()}`;

        try {
            showLoading();

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                }
            });

            if (!response.ok) {
                let errorText = 'Произошла ошибка при формировании отчета.';
                try {
                    const errorData = await response.json();
                    if (errorData.detail) {
                        errorText = errorData.detail;
                    }
                } catch (e) {
                    // Если не удалось распарсить JSON, используем текст по умолчанию
                }
                throw new Error(errorText);
            }

            const blob = await response.blob();
            const filename = getFilenameFromResponse(response);
            
            downloadFile(blob, filename);
            hideLoading();

        } catch (error) {
            console.error('Ошибка:', error);
            showError(error.message || 'Не удалось сформировать отчет. Попробуйте позже.');
        }
    });

    /**
     * Сброс формы
     */
    resetButton.addEventListener('click', function() {
        form.reset();
        errorMessage.style.display = 'none';
    });
});

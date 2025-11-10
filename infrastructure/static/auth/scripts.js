document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('loginForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        try {
            const resp = await fetch(form.action, {
                method: form.method,
                body: formData,
                credentials: 'include'
            });
            if (!resp.ok) {
                const err = await resp.json().catch(() => null);
                throw new Error(err?.detail || 'Ошибка авторизации');
            }
            const data = await resp.json();
            if (data.redirect) {
                window.location.href = data.redirect;
            } else {
                throw new Error('Неожиданный ответ сервера');
            }
        } catch (err) {
            // Можно вывести ошибку более красиво
            alert(err.message);
        }
    });
});
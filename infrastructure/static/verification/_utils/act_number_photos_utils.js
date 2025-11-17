export function renderActPhotos(photos) {
    const box = document.getElementById('act_photos_list');
    if (!box) return;

    if (!Array.isArray(photos) || photos.length === 0) {
        box.innerHTML = `<em class="text-muted">Фотографий нет</em>`;
        box.style.display = '';
        return;
    }

    const sorted = [...photos].sort((a, b) =>
        String(a.file_name || '').localeCompare(String(b.file_name || ''), 'ru')
    );

    box.style.display = "flex";
    box.style.flexWrap = "wrap";
    box.style.gap = "0.75rem";

    const html = sorted.map(p => {
        const safeName = String(p.file_name || '').replace(/</g, '&lt;');
        const safeUrl = p.url || "#";

        return `
            <div class="photo-item d-flex align-items-center" style="gap:6px;">
                <a href="${safeUrl}" target="_blank"
                   class="fw-bold text-primary text-decoration-underline"
                   style="white-space: nowrap;">
                    ${safeName}
                </a>

                <button type="button" class="btn btn-sm btn-outline-danger btn-photo-remove"
                    data-photo-id="${p.id}"
                    title="Удалить фото"
                    style="padding:0 6px; line-height:1;">
                    ✖
                </button>
            </div>
        `;
    }).join("");

    box.innerHTML = html;

    box.querySelectorAll(".btn-photo-remove").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();

            const id = btn.dataset.photoId;
            if (!id) return;

            if (!window.deletedImages.includes(id)) {
                window.deletedImages.push(id);
            }

            btn.closest(".photo-item").remove();

            if (box.querySelectorAll(".photo-item").length === 0) {
                box.innerHTML = `<em class="text-muted">Фотографий нет</em>`;
            }
        });
    });
}

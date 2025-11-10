import {
    fetchRoutes,
    fetchOrderingRoutes,
    fetchOrderingOrders,
    fetchOrderingEmployees,
    fetchAssignments,
    upsertAssignment,
    reorderOrder,
    upsertRouteAdditional,
    downloadOrderingCsv,
} from "./api_requests.js";

document.addEventListener("DOMContentLoaded", async () => {
    const routesContainer = document.getElementById("routes-container");
    const loadingOverlay = document.getElementById("loading");
    let employees = [];

    // 1) Инициализируем из localStorage или дефолтами
    let lastSelected = JSON.parse(localStorage.getItem("lastRoutes")) || [];
    let lastDate =
        localStorage.getItem("lastDate") || new Date().toISOString().slice(0, 10);

    // Инициализация Choices.js
    const choices = new Choices("#modal-routes", {
        removeItemButton: true,
        maxItemCount: 3,
        placeholderValue: "Выберите маршруты",
        searchPlaceholderValue: "Поиск маршрутов",
    });

    // Обновление шапок маршрутов (busy/day_limit)
    async function refreshRouteHeaders(date) {
        const routeIds = Array.from(document.querySelectorAll(".route-column"))
            .map((col) => Number(col.dataset.routeId));
        if (!routeIds.length) return;

        try {
            const routes = await fetchOrderingRoutes(
                window.currentCompanyId,
                routeIds,
                date
            );
            const byId = new Map(routes.map((r) => [r.id, r]));
            document.querySelectorAll(".route-column").forEach((col) => {
                const rid = Number(col.dataset.routeId);
                const r = byId.get(rid);
                if (!r) return;
                const title = col.querySelector(".route-name");
                if (title) {
                    title.textContent = `${r.name} (${r.busy ?? 0}/${r.day_limit})`;
                }
            });
        } catch (e) {
            console.error("Не удалось обновить статистику маршрутов", e);
        }
    }

    // Загрузка списка сотрудников
    async function loadEmployees(date) {
        try {
            employees = await fetchOrderingEmployees(window.currentCompanyId, date);
        } catch (err) {
            console.error("Не удалось загрузить сотрудников:", err);
        }
    }

    await loadEmployees(lastDate);

    // При открытии модалки — подгружаем маршруты
    document
        .getElementById("filterModal")
        .addEventListener("show.bs.modal", async () => {
            choices.clearStore();
            try {
                const routesList = await fetchRoutes(window.currentCompanyId);
                const choicesData = routesList.map((r) => ({
                    value: r.id,
                    label: r.name,
                    selected: lastSelected.includes(r.id),
                }));
                choices.setChoices(choicesData, "value", "label", false);
            } catch (err) {
                console.error("Не удалось загрузить маршруты:", err);
                alert("Ошибка загрузки списка маршрутов");
            }
            document.getElementById("modal-date").value = lastDate;
        });

    // Сабмит фильтра
    document
        .getElementById("modal-filter-form")
        .addEventListener("submit", async (e) => {
            e.preventDefault();

            const selected = choices.getValue(true);
            const date = document.getElementById("modal-date").value;

            if (!selected.length || selected.length > 3) {
                return alert("Выберите от 1 до 3 маршрутов.");
            }

            // сохраняем выбор
            lastSelected = [...selected];
            lastDate = date;
            localStorage.setItem("lastRoutes", JSON.stringify(lastSelected));
            localStorage.setItem("lastDate", lastDate);

            // закрываем модалку и грузим данные
            bootstrap.Modal.getInstance(
                document.getElementById("filterModal")
            ).hide();
            loadingOverlay.style.display = "flex";

            await loadEmployees(lastDate);

            try {
                const [routes, orders, assigns] = await Promise.all([
                    fetchOrderingRoutes(window.currentCompanyId, lastSelected, lastDate),
                    fetchOrderingOrders(window.currentCompanyId, lastSelected, lastDate),
                    fetchAssignments(window.currentCompanyId, lastSelected, lastDate),
                ]);
                renderColumns(routes, orders, assigns, lastDate);
            } catch (err) {
                console.error("Ошибка при загрузке данных:", err);
                alert("Не удалось загрузить данные");
            } finally {
                loadingOverlay.style.display = "none";
            }
        });

    // Рендер колонок
    function renderColumns(routes, orders, assigns, date) {
        routesContainer.innerHTML = "";

        if (routes.length === 0) {
            routesContainer.innerHTML =
                '<div class="no-orders">Нет доступных маршрутов на выбранную дату.</div>';
            return;
        }

        routes.forEach((rt) => {
            const col = document.createElement("div");
            col.className = "route-column";
            col.dataset.routeId = rt.id;
            col.innerHTML = `
                <div class="route-header">
                    <p class="route-name" data-route-id="${rt.id}">
                        ${rt.name} (${rt.busy ?? 0}/${rt.day_limit})
                    </p>
                    <div class="controls">
                        <select class="form-select form-select-sm emp-select"></select>
                        <button
                            class="btn btn-outline-success btn-sm ms-2 download-btn fw-bold"
                            style="border-width: 3px;"
                            title="Скачать отчёт"
                            data-route-id="${rt.id}"
                        >
                            <i class="bi bi-download"></i>
                        </button>
                    </div>
                </div>
                <div class="px-3 pb-2 pt-2" style="background:#f7f9fb;border-bottom:1px solid #e3e8ee">
                    <div class="d-flex gap-2 align-items-start">
                        <textarea
                            class="form-control form-control-sm addinfo-input"
                            rows="2"
                            placeholder="Доп. информация по маршруту на дату ${date}"
                        ></textarea>
                    </div>
                </div>
                <div class="orders-list" id="orders-route-${rt.id}"></div>
            `;
            routesContainer.append(col);

            // обработка кнопки скачивания отчёта
            col.querySelector(".download-btn").addEventListener("click", () => {
                downloadOrderingCsv(window.currentCompanyId, rt.id, date);
            });

            // доп.инфо
            const addInput = col.querySelector(".addinfo-input");
            addInput.value = rt.additional_info || "";
            addInput.addEventListener("blur", async () => {
                try {
                    await upsertRouteAdditional(window.currentCompanyId, {
                        route_id: rt.id,
                        date,
                        additional_info: addInput.value || "",
                    });
                    await refreshRouteHeaders(date);
                } catch (err) {
                    console.error("Не удалось сохранить доп.инфо:", err);
                    alert("Ошибка сохранения доп.информации");
                }
            });

            // селект сотрудников
            const sel = col.querySelector(".emp-select");
            sel.disabled = true;
            sel.innerHTML = "";
            const assignedRecord = assigns.find((a) => a.route_id === rt.id);
            const assignedId = assignedRecord ? assignedRecord.employee_id : null;

            const emptyOpt = new Option("--", "", assignedId === null, assignedId === null);
            sel.add(emptyOpt);

            function capitalize(word) {
                if (!word) return "";
                return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
            }

            employees.forEach((e) => {
                const parts = [e.last_name, e.name, e.patronymic]
                    .filter(Boolean)
                    .map(capitalize);
                const fullName = parts.join(" ");
                const label = e.has_assignment ? `(Занят) ${fullName}` : fullName;
                const opt = new Option(label, e.id, false, e.id === assignedId);
                sel.add(opt);
            });

            sel.disabled = false;
            sel.addEventListener("change", async () => {
                const empId = sel.value ? parseInt(sel.value) : null;
                try {
                    await upsertAssignment(window.currentCompanyId, {
                        route_id: rt.id,
                        employee_id: empId,
                        date,
                    });
                    await refreshRouteHeaders(date);
                } catch (err) {
                    console.error("Ошибка присвоения сотрудника:", err);
                }
            });

            // заявки
            const listEl = col.querySelector(".orders-list");
            const routeOrders = orders.filter((o) => o.route_id === rt.id);

            if (routeOrders.length === 0) {
                const placeholder = document.createElement("div");
                placeholder.className = "no-orders";
                placeholder.textContent = "Нет заявок в этом маршруте.";
                listEl.append(placeholder);
            } else {
                routeOrders.forEach((o) => {
                    const card = document.createElement("div");
                    card.className = "order-card";
                    card.draggable = true;
                    card.dataset.orderId = o.id;

                    const addressSpan = document.createElement("span");
                    addressSpan.className = "order-address";
                    const cityName = o.city && o.city.name ? o.city.name : "";
                    addressSpan.textContent = cityName
                        ? `${cityName}, ${o.address}`
                        : o.address;

                    const copyBtn = document.createElement("button");
                    copyBtn.className = "copy-btn";
                    copyBtn.title = "Копировать адрес";
                    copyBtn.innerHTML = `<i class="bi bi-clipboard"></i>`;
                    copyBtn.addEventListener("click", (ev) => {
                        ev.stopPropagation();
                        const text = cityName
                            ? `${cityName}, ${o.address}`
                            : o.address;

                        navigator.clipboard?.writeText(text).then(
                            () => {
                                copyBtn.innerHTML = `<i class="bi bi-clipboard-check"></i>`;
                                setTimeout(() => {
                                    copyBtn.innerHTML = `<i class="bi bi-clipboard"></i>`;
                                }, 1000);
                            },
                            (err) => console.error("Clipboard write failed:", err)
                        );
                    });

                    card.append(addressSpan, copyBtn);
                    listEl.append(card);
                });
            }

            // Drag & Drop
            new Sortable(listEl, {
                group: "routes",
                animation: 150,
                onEnd: async (evt) => {
                    const card = evt.item;
                    const movedOrderId = Number(card.dataset.orderId);

                    const fromCol = evt.from.closest(".route-column");
                    const toCol = evt.to.closest(".route-column");
                    const oldRouteId = Number(fromCol.dataset.routeId);
                    const newRouteId = Number(toCol.dataset.routeId);
                    const changeRoute = oldRouteId !== newRouteId;

                    const oldOrderIdList = Array.from(
                        fromCol.querySelectorAll(".order-card")
                    ).map((el) => Number(el.dataset.orderId));
                    const newOrderIdList = Array.from(
                        toCol.querySelectorAll(".order-card")
                    ).map((el) => Number(el.dataset.orderId));

                    const payload = {
                        old_order_id_list: oldOrderIdList,
                        new_order_id_list: newOrderIdList,
                        change_route: changeRoute,
                        old_route_id: changeRoute ? oldRouteId : undefined,
                        new_route_id: newRouteId,
                        moved_order_id: movedOrderId,
                    };

                    try {
                        await reorderOrder(window.currentCompanyId, payload);
                        await refreshRouteHeaders(date);
                    } catch (err) {
                        console.error("Ошибка при изменении порядка:", err);

                        if (evt.from && evt.oldIndex !== undefined) {
                            evt.from.insertBefore(card, evt.from.children[evt.oldIndex] || null);
                        }

                        alert(err.message);
                    }
                },
            });
        });

        refreshRouteHeaders(date);
    }
});

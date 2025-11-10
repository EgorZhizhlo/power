import './orders_calendar_render.js';
import { openCreateModal } from './orders_calendar_create.js';
import './orders_calendar_detail.js';
import './orders_calendar_edit.js';
import './orders_calendar_delete.js';

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btn-calendar-create')
          .addEventListener('click', async () => await openCreateModal(null));
  document.getElementById('createRequest')
          .addEventListener('click', async () => await openCreateModal(window.currentDate));
});

let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', filterCompanies);
    }
    
    document.querySelectorAll('input[name="filter"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            currentFilter = e.target.value;
            filterCompanies();
        });
    });
});

function filterCompanies() {
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const items = document.querySelectorAll('.company-item');
    
    items.forEach(item => {
        const name = item.dataset.name || '';
        const hasTariff = item.dataset.hasTariff === 'True';
        
        let showByFilter = true;
        if (currentFilter === 'active') {
            showByFilter = hasTariff;
        } else if (currentFilter === 'no-tariff') {
            showByFilter = !hasTariff;
        }
        
        const showBySearch = !searchTerm || name.includes(searchTerm);
        
        item.style.display = (showByFilter && showBySearch) ? '' : 'none';
    });
}

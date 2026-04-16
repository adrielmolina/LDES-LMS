const tableSearchInput = document.getElementById('searchTable');
let debounceTimer;

tableSearchInput.addEventListener('input', function () {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        const keyword = this.value.toLowerCase().trim();
        filterTable(keyword);
    }, 200);
});

let originalData = [];

async function loadBooks() {
    try {
        const res = await fetch('/api/books');
        const result = await res.json();
        if (result.error) { console.error(result.error); return; }
        originalData = result.data; // 👈 store original here
        hot.loadData(result.data);
    } catch (err) {
        console.error(err);
    }
}

function filterTable(keyword) {
    if (!keyword) {
        hot.loadData(originalData); // 👈 restore from original
        return;
    }

    const filtered = originalData.filter(row => { // 👈 always filter from original
        return Object.values(row).some(val => {
            if (val === null || val === undefined) return false;
            if (typeof val === 'number' && window.genreMap?.[val]) {
                return window.genreMap[val].toLowerCase().includes(keyword);
            }
            return String(val).toLowerCase().includes(keyword);
        });
    });

    hot.loadData(filtered);
}
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('genreSearch');
    const addBtn = document.getElementById('addGenreBtn');

    if (!searchInput || !addBtn) {
        console.error('Genre elements not found');
        return;
    }

    addBtn.addEventListener('click', addGenre);

    searchInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addGenre();
        }
    });
});



// 👇 ADD THESE GLOBALS (top of your JS file ideally)
window.genres = [];
window.genreMap = {};
window.genreReverseMap = {};

//TODO temporarily removed fix later


// old version of loadgenres
/*
async function loadGenres() {
    const tbody = document.querySelector('#genreTable tbody');

    // 👇 show loading state immediately
    tbody.innerHTML = "<tr><td colspan='2'>Loading...</td></tr>";

    try {
        const res = await fetch('/api/categories');
        const result = await res.json();

        
        // 🔥 ADD THIS BLOCK
        window.genres = result.data;
        window.genreMap = {};
        window.genreReverseMap = {};

        result.data.forEach(g => {
            window.genreMap[g.category_id] = g.name;
            window.genreReverseMap[g.name] = g.category_id;
        });
        
        // 👇 clear loading
        tbody.innerHTML = "";

        result.data.forEach(genre => {
            const row = document.createElement('tr');

            row.innerHTML = `
                <td>${genre.name}</td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="editGenre(${genre.category_id}, \`${genre.name}\`)">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteGenre(${genre.category_id}, \`${genre.name}\`)">Delete</button>
                </td>
            `;

            tbody.appendChild(row);
        });

    } catch (err) {
        console.error(err);

        // 👇 show error state
        tbody.innerHTML = "<tr><td colspan='2'>Failed to load</td></tr>";
    }
}
    
*/

async function loadGenres() {
    const tbody = document.querySelector('#genreTable tbody');
    tbody.innerHTML = "<tr><td colspan='2'>Loading...</td></tr>";

    try {
        const res = await fetch('/api/categories');
        const result = await res.json();

        // 👇 only clear and repopulate AFTER fetch succeeds
        window.genres = result.data;
        window.genreMap = {};
        window.genreReverseMap = {};

        result.data.forEach(g => {
            window.genreMap[g.category_id] = g.name;
            window.genreReverseMap[g.name] = g.category_id;
        });

        // 👇 only once
        hot.updateSettings({
            columns: hot.getSettings().columns.map(c => {
                if (c.data !== 'category_id') return c;
                return { ...c, source: window.genres.map(g => g.name) };
            })
        });

        tbody.innerHTML = "";
        result.data.forEach(genre => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${genre.name}</td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="editGenre(${genre.category_id}, \`${genre.name}\`)">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteGenre(${genre.category_id}, \`${genre.name}\`)">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });

    } catch (err) {
        console.error(err);
        tbody.innerHTML = "<tr><td colspan='2'>Failed to load</td></tr>";
    }
}


// 🔹 Add genre
async function addGenre() {
    console.log('Add genre triggered');

    const input = document.getElementById('genreSearch');
    let name = input.value.trim();

    if (!name) return;

    // 👇 apply capitalization
    name = capitalizeWords(name);

    try {
        const res = await fetch('/api/categories', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name })
        });

        const result = await res.json();

        if (result.error) {
            alert(result.error);
            return;
        }

        input.value = "";
        loadGenres();

    } catch (err) {
        console.error(err);
    }
}


// 🔹 Edit selected
async function editGenre(id, currentName) {
    const updated = prompt('Edit genre:', currentName);
    if (!updated || updated.trim() === '') return;

    // normalize
    const name = capitalizeWords(updated);

    try {
        const res = await fetch(`/api/categories/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name })
        });

        const result = await res.json();

        if (result.error) {
            alert(result.error);
            return;
        }

        // ✅ refresh from DB
        loadGenres();

    } catch (err) {
        console.error(err);
    }
}


// 🔹 Delete selected
async function deleteGenre(id, name) {
    // ✅ confirmation dialog
    if (!confirm(`Delete "${name}"?`)) return;

    try {
        const res = await fetch(`/api/categories/${id}`, {
            method: 'DELETE'
        });

        const result = await res.json();

        if (result.error) {
            alert(result.error);
            return;
        }

        // ✅ refresh table
        loadGenres();

    } catch (err) {
        console.error(err);
    }
}



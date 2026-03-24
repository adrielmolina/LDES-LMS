async function loadGenres() {
    const tbody = document.querySelector('#genreTable tbody');

    // 👇 show loading state immediately
    tbody.innerHTML = "<tr><td colspan='2'>Loading...</td></tr>";

    try {
        const res = await fetch('/api/categories');
        const result = await res.json();

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

//BIND THE FUNCTIONS TO THE MOUSE CLICK AND BUTTON PRESS
document.getElementById('addGenreBtn').addEventListener('click', addGenre);

searchInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
        e.preventDefault();
        addGenre();
    }
});


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



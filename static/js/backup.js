async function loadBackups() {
    try {
        const res = await fetch('/api/backups');
        const result = await res.json();
        if (result.error) { console.error(result.error); return; }

        const select = document.getElementById('backupSelect');
        select.innerHTML = '<option value="">Select a backup to restore...</option>';
        result.data.forEach(f => {
            const option = document.createElement('option');
            option.value = f.filename;
            option.textContent = `${f.filename} (${f.size_kb} KB)`;
            select.appendChild(option);
        });
    } catch (err) {
        console.error(err);
    }
}

async function triggerBackup() {
    try {
        const res = await fetch('/api/backups/trigger', { method: 'POST' });
        const result = await res.json();
        if (result.error) { alert('Backup failed: ' + result.error); return; }
        alert(`✅ Backup created: ${result.filename}`);
        loadBackups(); // refresh dropdown
    } catch (err) {
        console.error(err);
    }
}

async function restoreBackup() {
    const filename = document.getElementById('backupSelect').value;
    if (!filename) { alert('Please select a backup first.'); return; }

    if (!confirm(`Restore from "${filename}"? The app will restart after.`)) return;

    try {
        const res = await fetch('/api/backups/restore', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename })
        });
        const result = await res.json();
        if (result.error) { alert('Restore failed: ' + result.error); return; }
        alert('✅ Restore successful. Please restart the app.');
    } catch (err) {
        console.error(err);
    }
}

document.addEventListener('DOMContentLoaded', loadBackups);
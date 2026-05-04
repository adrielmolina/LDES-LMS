async function syncOverdue() {
    try {
        const res = await fetch('/api/borrow/sync-overdue', {
            method: 'POST'
        });

        const result = await res.json();

        if (result.error) {
            console.error(result.error);
            return;
        }

        console.log(`Overdue sync completed: ${result.updated} updated`);

        // refresh table after sync
        refreshData();

    } catch (err) {
        console.error(err);
    }
}

document.addEventListener('DOMContentLoaded', syncOverdue);
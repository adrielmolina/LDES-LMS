
document.querySelector('#borrowsTable tbody').addEventListener('click', async function (e) {
    const btn = e.target.closest('button');
    if (!btn) return;

    const id = btn.dataset.id;
    const action = btn.dataset.action;

    if (!id || !action) return;

    if (action === 'return') {
        const confirmAction = confirm("Mark this book as RETURNED?");

        if (!confirmAction) return;

        try {
            const res = await fetch(`/api/borrow/${id}/return`, {
                method: 'PUT'
            });

            const result = await res.json();

            if (result.error) {
                alert(result.error);
                return;
            }

            console.log(`RETURN updated | borrow_id: ${id}`);
            refreshData();
            syncOverdue(); // sync overdue after return to update any related overdue statuses

        } catch (err) {
            console.error(err);
        }
    }

    if (action === 'renew') {
        if (action === 'renew') {
            const confirmAction = confirm("Mark this book for renewal? This will extend the due date to 1 week.");

            if (!confirmAction) return;

            try {
                const res = await fetch(`/api/borrow/${id}/renew`, {
                    method: 'PUT'
                });

                const result = await res.json();

                if (result.error) {
                    alert(result.error);
                    return;
                }

                console.log(`RENEW updated | borrow_id: ${id}`);
                refreshData();
                syncOverdue(); // sync overdue after renewal to update any related overdue statuses

            } catch (err) {
                console.error(err);
            }
        }
    }

    if (action === 'lost') {
        if (action === 'lost') {

            const confirmAction = confirm("Mark this book as LOST? This will reduce available stock.");

            if (!confirmAction) return;

            try {
                const res = await fetch(`/api/borrow/${id}/lost`, {
                    method: 'PUT'
                });

                const result = await res.json();

                if (result.error) {
                    alert(result.error);
                    return;
                }

                console.log(`LOST updated | borrow_id: ${id}`);

                refreshData();
                syncOverdue(); // sync overdue after return to update any related overdue statuses

            } catch (err) {
                console.error(err);
            }
        }
    }

    if (action === 'delete') {
        const confirmAction = confirm("Delete this borrow record? This cannot be undone.");

        if (!confirmAction) return;

        try {
            const res = await fetch(`/api/borrow/${id}/delete`, {
                method: 'DELETE'
            });

            const result = await res.json();

            if (result.error) {
                alert(result.error);
                return;
            }

            console.log(`DELETE success | borrow_id: ${id}`);

            refreshData();

        } catch (err) {
            console.error(err);
        }
    }
});
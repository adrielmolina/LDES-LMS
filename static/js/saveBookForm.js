document.addEventListener("DOMContentLoaded", function () {
    // for auto capitalization of title, author, illustrator, publisher fields
    ['title', 'author', 'illustrator', 'publisher'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('input', function () {
            const pos = this.selectionStart; // save cursor position
            this.value = this.value.replace(/\b\w/g, c => c.toUpperCase());
            this.setSelectionRange(pos, pos); // restore cursor position
        });
    });
});



document.getElementById("saveBookBtn").addEventListener("click", async function () {

    const batchMode = document.getElementById("batchMode")?.checked;

    const payload = {
        isbn: document.getElementById("isbn")?.value.trim() || "",
        title: document.getElementById("title")?.value.trim() || "",

        author: document.getElementById("author")?.value.trim() || "",
        illustrator: document.getElementById("illustrator")?.value.trim() || "",
        publisher: document.getElementById("publisher")?.value.trim() || "",
        publication_year: document.getElementById("publicationYear")?.value.trim() || "",

        category_id: document.getElementById("categoryId")?.value.trim() || "",
        total_copies: Number(document.getElementById("totalCopies")?.value) || 0,
        shelf_location: document.getElementById("shelfLocation")?.value.trim() || "",

        key_stage: document.getElementById("keyStage")?.value || "",
        no_of_pages: Number(document.getElementById("noOfPages")?.value) || 0
    };

    if (!payload.title) {
        alert("Book title is required.");
        return;
    }

    if (!payload.category_id) {
        alert("Please select a genre.");
        return;
    }

    try {
        const res = await fetch("/api/books/form", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const result = await res.json();

        if (result.error) {
            alert(result.error);
            return;
        }

        console.log("BOOK SAVED:", result);
        refreshTable();
        // =========================
        // BATCH MODE LOGIC
        // =========================
        if (batchMode) {

            // always clear these
            document.getElementById("isbn").value = "";
            document.getElementById("title").value = "";

            // 👇 only reset keyStage if NOT pinned
            const pinKeyStage = document.getElementById("pinKeyStage");
            if (!pinKeyStage?.checked) {
                document.getElementById("keyStage").selectedIndex = 0;
            }

            // 👇 only reset category if NOT pinned
            const pinCategory = document.getElementById("pinCategory");
            console.log('pinCategory checked:', pinCategory?.checked, 'payload.category_id:', payload.category_id);
            if (!pinCategory?.checked) {
                await loadCategoryDropdown("");
            } else {
                await loadCategoryDropdown(payload.category_id); // reload but keep selected value
            }

            // map fields directly to their pin checkboxes
            const pinMap = [
                { input: "author", pin: "pinAuthor" },
                { input: "illustrator", pin: "pinIllustrator" },
                { input: "publisher", pin: "pinPublisher" },
                { input: "publicationYear", pin: "pinYear" },
                { input: "totalCopies", pin: "pinCopies" },
                { input: "shelfLocation", pin: "pinShelf" },
                { input: "noOfPages", pin: "pinPages" }
            ];

            pinMap.forEach(({ input, pin }) => {
                const inputEl = document.getElementById(input);
                const pinEl = document.getElementById(pin);

                if (!inputEl) return;

                // only clear if NOT pinned
                if (!pinEl || !pinEl.checked) {
                    inputEl.value = "";
                }
            });

            // focus back to ISBN
            document.getElementById("isbn")?.focus();
        } else {

            // NORMAL MODE RESET
            document.getElementById("addBookForm").reset();

            const modalEl = document.getElementById("addBookModal");
            const modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) modal.hide();

            refreshTable();
        }

    } catch (err) {
        console.error("SAVE BOOK ERROR:", err);
    }
});
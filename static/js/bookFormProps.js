// =============================
// LOAD DYNAMIC CATEGORIES INTO ADD BOOK FORM
// =============================
async function loadCategoryDropdown(selectedValue = "") {
    try {
        const res = await fetch('/api/categories');
        const result = await res.json();

        if (result.error) {
            console.error(result.error);
            return;
        }

        const categorySelect = document.getElementById('categoryId');

        if (!categorySelect) return;

        // 👇 preserve current value if no explicit value passed
        const currentValue = selectedValue || categorySelect.value || "";

        // reset dropdown
        categorySelect.innerHTML = `<option value="">Select Genre</option>`;

        result.data.forEach(category => {
            const option = document.createElement('option');

            // saved value
            option.value = category.category_id;

            // visible label
            option.textContent = category.name;

            categorySelect.appendChild(option);
        });
        // genre value to set after loading options
        if (selectedValue) {
            categorySelect.value = String(selectedValue);
            console.log('set value to:', String(selectedValue), 'actual value now:', categorySelect.value);
        } else {
            categorySelect.value = "";
        }
    

    } catch (err) {
        console.error("CATEGORY DROPDOWN ERROR:", err);
    }
}

// 👇 auto-load every page/modal load
document.addEventListener('DOMContentLoaded', loadCategoryDropdown);

function enforceNumberOnly(selector) {
    document.querySelectorAll(selector).forEach(input => {

        input.addEventListener("input", () => {
            input.value = input.value.replace(/[^0-9]/g, "");
        });

        input.addEventListener("keydown", (e) => {
            // allow control keys
            if (
                ["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight"].includes(e.key)
            ) return;

            // block non-numbers
            if (!/[0-9]/.test(e.key)) {
                e.preventDefault();
            }
        });
    });
}
document.addEventListener("DOMContentLoaded", () => {
    enforceNumberOnly("#isbn, #publicationYear, #totalCopies, #noOfPages");
});


//for the year dropdown
const yearSelect = document.getElementById("publicationYear");
const currentYear = new Date().getFullYear();

for (let y = currentYear; y >= 1900; y--) {
    const option = document.createElement("option");
    option.value = y;
    option.textContent = y;
    yearSelect.appendChild(option);
}


// auto complete for author, illustrator, publisher
async function loadBookFieldDatalists() {
    try {
        const res = await fetch('/api/books');
        const result = await res.json();

        if (result.error) {
            console.error(result.error);
            return;
        }

        // datalist elements
        const authorList = document.getElementById("authorList");
        const illustratorList = document.getElementById("illustratorList");
        const publisherList = document.getElementById("publisherList");

        if (!authorList || !illustratorList || !publisherList) return;

        // clear old values
        authorList.innerHTML = "";
        illustratorList.innerHTML = "";
        publisherList.innerHTML = "";

        // unique values only
        const authors = [...new Set(
            result.data.map(book => book.author?.trim()).filter(Boolean)
        )];

        const illustrators = [...new Set(
            result.data.map(book => book.illustrator?.trim()).filter(Boolean)
        )];

        const publishers = [...new Set(
            result.data.map(book => book.publisher?.trim()).filter(Boolean)
        )];

        // populate author
        authors.forEach(author => {
            const option = document.createElement("option");
            option.value = author;
            authorList.appendChild(option);
        });

        // populate illustrator
        illustrators.forEach(illustrator => {
            const option = document.createElement("option");
            option.value = illustrator;
            illustratorList.appendChild(option);
        });

        // populate publisher
        publishers.forEach(publisher => {
            const option = document.createElement("option");
            option.value = publisher;
            publisherList.appendChild(option);
        });

    } catch (err) {
        console.error("BOOK FIELD DATALIST ERROR:", err);
    }
}
document.addEventListener("DOMContentLoaded", function () {
    loadBookFieldDatalists();
});

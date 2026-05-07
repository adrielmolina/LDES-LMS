let bookMap = {};

// for the dropdown on book title
async function loadBookDatalist() {
    const res = await fetch('/api/books');
    const result = await res.json();

    const dl = document.getElementById('bookList');
    dl.innerHTML = "";

    result.data.forEach(book => {
        bookMap[book.book_id] = book.title;
        
        const option = document.createElement('option');
        option.value = book.title;   // or book.book_name if that's your field
        option.dataset.id = book.book_id;
        option.dataset.available = book.available_copies;
        dl.appendChild(option);
    });
}


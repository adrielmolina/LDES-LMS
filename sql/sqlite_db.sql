PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS books (
    book_id INTEGER PRIMARY KEY AUTOINCREMENT,
    accession_no_start INTEGER NOT NULL,
    accession_no_end INTEGER NOT NULL,
    isbn TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    illustrator TEXT NOT NULL,
    publisher TEXT NOT NULL,
    publication_year INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    total_copies INTEGER NOT NULL,
    available_copies INTEGER NOT NULL,
    shelf_location TEXT NOT NULL,
    created_at TEXT NOT NULL,
    last_updated_at TEXT NOT NULL,
    key_stage_grade_level TEXT NOT NULL,
    no_of_pages INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_no INTEGER NOT NULL UNIQUE,
    first_name TEXT NOT NULL,
    middle_name TEXT,
    last_name TEXT NOT NULL,
    suffix TEXT,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL UNIQUE,
    address TEXT,
    user_level TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS circulations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id INTEGER NOT NULL,
    student_lrn INTEGER,
    student_name TEXT,
    student_school INTEGER,
    librarian_id INTEGER,
    borrow_date TEXT,
    due_date TEXT,
    return_date TEXT,
    status TEXT NOT NULL,
    renewal_count INTEGER DEFAULT 0,
    no_of_copies INTEGER,
    remarks TEXT,
    created_at TEXT,
    FOREIGN KEY(book_id) REFERENCES books(book_id),
    FOREIGN KEY(librarian_id) REFERENCES users(user_id),
    FOREIGN KEY(student_school) REFERENCES schools(school_id)
);

CREATE TABLE IF NOT EXISTS categories (
    category_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS schools (
    school_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT
);

CREATE TABLE IF NOT EXISTS logs (
    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    log_time TEXT,
    action_name TEXT,
    description TEXT
);
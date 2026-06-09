from flask import Flask, request, render_template, redirect, url_for, flash, session, jsonify, send_file, send_from_directory, abort
from flask_login import LoginManager, login_user, login_required, logout_user, current_user
from livereload import Server
from py_scripts import db_conn, tools, models
from datetime import date, datetime, timedelta
from sqlalchemy import create_engine, text, func, extract, case, case, and_, or_
import os
import pandas as pd
import openpyxl
from functools import wraps
from io import BytesIO
from flask import send_file
import requests
import re


server = Flask(__name__)
server.jinja_env.auto_reload = True
server.secret_key = os.urandom(24)

# CACHE CONTROL FOR STATIC FILES
cache_bypass = False

if cache_bypass or os.getenv("FLASK_ENV") == "production":
    server.config['SEND_FILE_MAX_AGE_DEFAULT'] = 31536000
else:
    server.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0

'''
# not needed anymore
# for closing the session after requests
@server.teardown_appcontext
def cleanup(exception=None):
    db_conn.shutdown_session()'''

#? -------------------- LOGIN / LOGOUT -------------------- ?#

#? -------------------- END -------------------- ?#

#? -------------------- NAVIGATIONS -------------------- ?#

@server.route('/')
def landing_page():
    # redirect to dashboard if already logged in
    if os.getenv("FLASK_ENV") == "production" or os.getenv("FLASK_ENV") == "staging":
        if current_user.is_authenticated:
            return redirect(url_for('dashboard'))
        
    
    if os.getenv("env") == "production":
        env = 'Live'
    elif os.getenv("env") == "staging":
        env = 'Staging'
    else:
        env = 'Development'
    
    return render_template('dashboard.html', env=env)

@server.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')

@server.route('/books')
def books():
    return render_template('books.html')

@server.route('/borrow')
def borrow():
    return render_template('borrow.html')

@server.route('/logs')
def logs():
    return render_template('logs.html')

@server.route('/settings')
def settings():
    return render_template('settings.html')


#? -------------------- END -------------------- ?#

@server.route("/api/categories", methods=["GET"])
def get_categories():
    conn = db_conn.conn_init()
    cursor = conn.cursor()

    cursor.execute("SELECT category_id, name FROM categories")
    rows = cursor.fetchall()

    data = [dict(row) for row in rows]
    
    conn.close()
    
    return {"data": data}



@server.route("/api/categories", methods=["POST"])
def add_category():

    data = request.get_json()
    name = data.get("name")

    if not name:
        return jsonify({"error": "Name is required"}), 400
    
    # 👇 normalize spaces
    name = re.sub(r"\s+", " ", name.strip())
    
    conn = db_conn.conn_init()
    cursor = conn.cursor()

    try:
        cursor.execute("INSERT INTO categories (name) VALUES (?)", (name,))
        conn.commit()

        action_log(action="Add Category", desc=f"Category added: {name}", conn=conn)
        return jsonify({"success": True})

    except Exception as e:
        action_log(action="Add Category Failed", desc=f"Failed to add category: {name}. Error: {str(e)}", conn=conn)
        return jsonify({"error": str(e)}), 500
    
    finally:
        conn.close()
    
@server.route("/api/categories/<int:id>", methods=["PUT"])
def update_category(id):
    data = request.get_json()

    if not data:
        return jsonify({"error": "Invalid request"}), 400

    name = data.get("name")

    if not name:
        return jsonify({"error": "Name is required"}), 400

    # 👇 normalize (VERY IMPORTANT)
    name = re.sub(r"\s+", " ", name.strip()).title()

    conn = db_conn.conn_init()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "UPDATE categories SET name = ? WHERE category_id = ?",
            (name, id)
        )
        conn.commit()
        action_log(action="Update Category", desc=f"Category {id} updated: {name}", conn=conn)
        return jsonify({"success": True})

    except Exception as e:
        print("DB ERROR:", e)
        action_log(action="Update Category Failed", desc=f"Failed to update category {id} to {name}. Error: {str(e)}", conn=conn)
        return jsonify({"error": str(e)}), 500
    
    finally:
        conn.close()
    
@server.route("/api/categories/<int:id>", methods=["DELETE"])
def delete_category(id):

    conn = db_conn.conn_init()
    cursor = conn.cursor()

    try:
        cursor.execute("DELETE FROM categories WHERE category_id = ?", (id,))
        conn.commit()

        action_log(action="Delete Category", desc=f"Category deleted: {id}", conn=conn)
        return jsonify({"success": True})

    except Exception as e:
        print("DB ERROR:", e)
        action_log(action="Delete Category Failed", desc=f"Failed to delete category {id}. Error: {str(e)}", conn=conn)
        return jsonify({"error": str(e)}), 500    
    
    finally:
        conn.close()

'''
@server.route("/api/books", methods=["GET"])
def get_books():
    conn = db_conn.conn_init()
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT * FROM books")
        rows = cursor.fetchall()

        data = [dict(row) for row in rows]

        return jsonify({"data": data})

    except Exception as e:
        print("DB ERROR:", e)
        return jsonify({"error": str(e)}), 500

    finally:
        conn.close()
'''

@server.route("/api/books", methods=["GET"])
def get_books():
    conn = db_conn.conn_init()
    cursor = conn.cursor()

    try:
        # get all books
        cursor.execute("SELECT * FROM books ORDER BY book_id")
        rows = cursor.fetchall()

        data = []
        current = 1  # starting accession number

        for row in rows:
            book = dict(row)

            # -------------------------
            # ACCESSION NUMBER LOGIC
            # -------------------------
            copies = book.get("total_copies") or 0

            start = current
            end = current + copies - 1 if copies > 0 else current

            book["accession_no_start"] = f"{start:06d}"
            book["accession_no_end"] = f"{end:06d}"

            current = end + 1

            # -------------------------
            # BORROWED COUNT
            # -------------------------
            cursor.execute("""
                SELECT COALESCE(SUM(no_of_copies), 0)
                FROM circulations
                WHERE book_id = ?
                AND status IN ('borrowed', 'overdue', 'lost')
            """, (book["book_id"],))

            borrowed = cursor.fetchone()[0] or 0

            total = book.get("total_copies") or 0
            book["available_copies"] = total - borrowed

            # -------------------------
            # FINAL PUSH
            # -------------------------
            data.append(book)

        return jsonify({"data": data})

    except Exception as e:
        print("DB ERROR:", e)
        return jsonify({"error": str(e)}), 500

    finally:
        conn.close()


        
@server.route("/api/books", methods=["POST"])
def create_book():
    conn = db_conn.conn_init()
    cursor = conn.cursor()

    try:
        data = request.get_json()

        title = data.get("title", "").strip()
        author = data.get("author", "").strip()

        if not title:
            return jsonify({"error": "Title is required"}), 400

        today = date.today().isoformat()

        # 🔴 DUPLICATE CHECK (title + author)
        cursor.execute("""
            SELECT book_id
            FROM books
            WHERE LOWER(title) = LOWER(?)
            AND LOWER(author) = LOWER(?)
        """, (title, author))

        existing = cursor.fetchone()

        if existing:
            return jsonify({
                "error": "Book with same title and author already exists",
                "book_id": existing["book_id"]
            }), 409

        # ✅ INSERT NEW BOOK
        cursor.execute("""
            INSERT INTO books (title, author, created_at, last_updated_at)
            VALUES (?, ?, ?, ?)
        """, (title, author, today, today))

        conn.commit()

        action_log(
            action="Add Book",
            desc=f"Book added: {title} by {author}",
            conn=conn
        )
        return jsonify({
            "success": True,
            "book_id": cursor.lastrowid
        })

    except Exception as e:
        print("DB ERROR:", e)
        action_log(
            action="Add Book Failed",
            desc=f"Failed to add book: {title}) by {author}. Error: {str(e)}",
            conn=conn
        )
        return jsonify({"error": str(e)}), 500

    finally:
        conn.close()

@server.route("/api/books/form", methods=["POST"])
def create_book_form():
    conn = db_conn.conn_init()
    cursor = conn.cursor()

    try:
        data = request.get_json() or {}

        today = date.today().isoformat()

        cursor.execute("""
            INSERT INTO books (
                isbn,
                title,
                author,
                illustrator,
                publisher,
                publication_year,
                category_id,
                total_copies,
                shelf_location,
                key_stage_grade_level,
                no_of_pages,
                created_at,
                last_updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            data.get("isbn", ""),
            data.get("title", "").strip().title(),
            data.get("author", "").strip().title(),
            data.get("illustrator", "").strip().title(),
            data.get("publisher", "").strip().title(),
            data.get("publication_year", ""),
            data.get("category_id", ""),
            data.get("total_copies", 40),  # default
            data.get("shelf_location", ""),
            data.get("key_stage", ""),
            data.get("no_of_pages", 0),
            today,
            today
        ))

        conn.commit()

        book_id = cursor.lastrowid

        action_log(
            action="Add Book Form",
            desc=f"Book added via form: {data.get('title', '').strip().title()} by {data.get('author', '').strip().title()}",
            conn=conn
        )
        return jsonify({
            "success": True,
            "book_id": book_id
        })

    except Exception as e:
        conn.rollback()
        action_log(
            action="Add Book Form Failed",
            desc=f"Failed to add book via form: {data.get('title', '').strip().title()} by {data.get('author', '').strip().title()}. Error: {str(e)}",
            conn=conn
        )
        print("DB ERROR:", e)

        return jsonify({"error": str(e)}), 500

    finally:
        conn.close()


@server.route("/api/books/<int:book_id>", methods=["PUT"])
def update_book(book_id):
    data = request.get_json()
    field = data.get("field")
    value = data.get("value")
    if not field:
        return jsonify({"error": "Field required"}), 400

    allowed_fields = [  # 👈 added whitelist
        # removed as these are now computed fields
        #'accession_no_start', 'accession_no_end', 'available_copies',
        
        'isbn', 'title', 'author', 'illustrator', 'publisher',
        'publication_year', 'category_id', 'total_copies',
        'shelf_location', 'key_stage_grade_level', 'no_of_pages'
    ]
    if field not in allowed_fields:  # 👈 added
        return jsonify({"error": "Invalid field"}), 400

    conn = db_conn.conn_init()
    cursor = conn.cursor()
    try:
        # handle total_copies validation
        if field == "total_copies":

            # current active borrowed count
            cursor.execute("""
                SELECT COALESCE(SUM(no_of_copies), 0)
                FROM circulations
                WHERE book_id = ?
                AND status IN ('borrowed', 'overdue')
            """, (book_id,))

            borrowed = cursor.fetchone()[0] or 0

            # prevent invalid totals
            if int(value) < borrowed:
                return jsonify({
                    "error": f"Cannot set total copies below currently borrowed copies ({borrowed})."
                }), 400
        
        
        today = date.today().isoformat()  # 👈 added
        query = f"UPDATE books SET {field} = ?, last_updated_at = ? WHERE book_id = ?"  # 👈 changed
        cursor.execute(query, (value, today, book_id))  # 👈 changed
        conn.commit()
        action_log(
            action="Update Book",
            desc=f"Book {book_id} updated: {field} = {value}",
            conn=conn
        )
        return jsonify({"success": True})
    except Exception as e:
        print("DB ERROR:", e)
        action_log(
            action="Update Book Failed",
            desc=f"Book {book_id} update failed: {field} = {value}. Error: {str(e)}",
            conn=conn
        )
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()


@server.route("/api/books/<int:book_id>", methods=["DELETE"])
def delete_book(book_id):
    conn = db_conn.conn_init()
    cursor = conn.cursor()
    try:
        print("Deleting book with ID:", book_id)
        cursor.execute("DELETE FROM books WHERE book_id = ?", (book_id,))
        conn.commit()
        action_log(
            action="Delete Book",
            desc=f"Book {book_id} deleted",
            conn=conn
        )
        return jsonify({"success": True})
    except Exception as e:
        print("DB ERROR:", e)
        action_log(
            action="Delete Book Failed",
            desc=f"Book {book_id} delete failed. Error: {str(e)}",
            conn=conn
        )
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()
        
###########? -------------------- DASHBOARD ROUTES -------------------- ?#
@server.route("/api/dashboard/stats", methods=["GET"])
def get_dashboard_stats():
    """Get dashboard statistics for the 3 cards"""
    conn = db_conn.conn_init()
    cursor = conn.cursor()
    
    try:
        # 1. Total books (sum of all copies)
        cursor.execute("""
            SELECT COALESCE(SUM(total_copies), 0) as total
            FROM books
        """)
        total_books = cursor.fetchone()[0] or 0
        
        # 2. Total borrowed books (currently borrowed + currently overdue)
        cursor.execute("""
            SELECT COALESCE(SUM(no_of_copies), 0) as total
            FROM circulations
            WHERE status IN ('borrowed', 'overdue')
        """)
        total_borrowed = cursor.fetchone()[0] or 0
        
        # 3. Total currently overdue books (NOT returned yet)
        # This only counts books with status = 'overdue'
        cursor.execute("""
            SELECT COALESCE(SUM(no_of_copies), 0) as total
            FROM circulations
            WHERE status = 'overdue'
        """)
        total_overdue = cursor.fetchone()[0] or 0
        
        # Additional check: Also count books past due date but status not updated
        # This ensures accuracy even if the status hasn't been updated
        cursor.execute("""
            SELECT COALESCE(SUM(no_of_copies), 0) as total
            FROM circulations
            WHERE status IN ('borrowed', 'overdue')
            AND due_date < DATE('now')
            AND return_date IS NULL
        """)
        actually_overdue = cursor.fetchone()[0] or 0
        
        # Use the larger count to be safe
        final_overdue = max(total_overdue, actually_overdue)
        
        # 4. New books added this week (for trend)
        cursor.execute("""
            SELECT COUNT(*) as total
            FROM books
            WHERE created_at >= DATE('now', '-7 days')
        """)
        weekly_new_books = cursor.fetchone()[0] or 0
        
        # 5. New borrows this week (for trend)
        cursor.execute("""
            SELECT COALESCE(SUM(no_of_copies), 0) as total
            FROM circulations
            WHERE borrow_date >= DATE('now', '-7 days')
            AND status IN ('borrowed', 'overdue')
        """)
        weekly_borrowed = cursor.fetchone()[0] or 0
        
        # 6. Overdue change (compare to last week)
        cursor.execute("""
            SELECT COALESCE(SUM(no_of_copies), 0) as total
            FROM circulations
            WHERE status = 'overdue'
            AND due_date BETWEEN DATE('now', '-14 days') AND DATE('now', '-7 days')
        """)
        overdue_last_week = cursor.fetchone()[0] or 0
        
        overdue_change = final_overdue - overdue_last_week
        
        return jsonify({
            "success": True,
            "data": {
                "total_books": total_books,
                "total_borrowed": total_borrowed,
                "total_overdue": final_overdue,  # Only currently overdue
                "weekly_new_books": weekly_new_books,
                "weekly_borrowed": weekly_borrowed,
                "overdue_change": overdue_change
            }
        })
        
    except Exception as e:
        action_log(
            action="Get Dashboard Stats Failed",
            desc=f"Failed to get dashboard stats. Error: {str(e)}",
            conn=conn
        )
        print(f"Dashboard stats error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()


@server.route("/api/dashboard/calendar", methods=["GET"])
def get_calendar_events():
    """Get all due dates for calendar highlighting"""
    year = request.args.get('year', type=int)
    month = request.args.get('month', type=int)
    
    if not year or not month:
        return jsonify({"error": "Year and month required"}), 400
    
    conn = db_conn.conn_init()
    cursor = conn.cursor()
    
    try:
        # Get all due dates for this month (no user filtering for now)
        cursor.execute("""
            SELECT 
                c.book_id,
                c.due_date,
                c.status,
                c.student_name,
                c.no_of_copies,
                b.title
            FROM circulations c
            LEFT JOIN books b ON c.book_id = b.book_id
            WHERE c.status IN ('borrowed', 'overdue')
            AND c.due_date IS NOT NULL
            AND strftime('%Y', c.due_date) = ?
            AND strftime('%m', c.due_date) = ?
            ORDER BY c.due_date ASC
        """, (str(year), f"{month:02d}"))
        
        events = []
        for row in cursor.fetchall():
            events.append({
                "date": row["due_date"],
                "title": row["title"] or f"Book #{row['book_id']}",
                "status": row["status"],
                "copies": row["no_of_copies"],
                "borrower": row["student_name"]
            })
        
        return jsonify({
            "success": True,
            "events": events
        })
        
    except Exception as e:
        print(f"Calendar error: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()


@server.route("/api/dashboard/notifications", methods=["GET"])
def get_notifications():
    """Get notifications for a specific date"""
    date_str = request.args.get('date')  # YYYY-MM-DD
    
    if not date_str:
        return jsonify({"error": "Date required"}), 400
    
    conn = db_conn.conn_init()
    cursor = conn.cursor()
    
    try:
        # Get due dates matching this date
        cursor.execute("""
            SELECT 
                c.id,
                c.book_id,
                c.due_date,
                c.status,
                c.no_of_copies,
                c.student_name,
                b.title,
                b.author
            FROM circulations c
            LEFT JOIN books b ON c.book_id = b.book_id
            WHERE c.due_date = ?
            AND c.status IN ('borrowed', 'overdue')
            ORDER BY c.status DESC
        """, (date_str,))
        
        notifications = []
        for row in cursor.fetchall():
            notifications.append({
                "id": row["id"],
                "type": "due_date" if row["status"] == "borrowed" else "overdue",
                "title": row["title"] or "Unknown Book",
                "author": row["author"] or "Unknown Author",
                "borrower": row["student_name"],
                "due_date": row["due_date"],
                "copies": row["no_of_copies"],
                "message": f"'{row['title']}' is due today!" if row["status"] == "borrowed" 
                else f"'{row['title']}' is OVERDUE!"
            })
        
        return jsonify({
            "success": True,
            "notifications": notifications,
            "count": len(notifications)
        })
        
    except Exception as e:
        print(f"Notifications error: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()


###########? -------------------- BORROW ROUTES -------------------- ?#

@server.route("/api/borrow", methods=["GET"])
def get_borrows():
    conn = db_conn.conn_init()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            SELECT * FROM circulations
            WHERE status != 'deleted'
            ORDER BY id DESC
        """)

        rows = cursor.fetchall()
        data = [dict(row) for row in rows]

        return jsonify({"data": data})

    except Exception as e:
        print("DB ERROR:", e)
        return jsonify({"error": str(e)}), 500

    finally:
        conn.close()


@server.route("/api/borrow", methods=["POST"])
def borrow_book():
    data = request.get_json()

    book_id = data.get("book_id")
    borrower_id = data.get("borrower_id")
    borrower_name = data.get("borrower_name")
    borrower_school = data.get("borrower_school")

    borrow_date = data.get("borrow_date")
    due_date = data.get("due_date")

    no_of_copies = int(data.get("no_of_copies", 1))
    remarks = data.get("remarks", "")

    if not book_id:
        return jsonify({"error": "Book ID required"}), 400

    if not borrower_name:
        return jsonify({"error": "Student name required"}), 400

    conn = db_conn.conn_init()
    cursor = conn.cursor()

    try:
        # -----------------------------
        # GET TOTAL COPIES
        # -----------------------------
        cursor.execute("""
            SELECT total_copies
            FROM books
            WHERE book_id = ?
        """, (book_id,))

        book = cursor.fetchone()

        if not book:
            return jsonify({"error": "Book not found"}), 404

        total = book["total_copies"] or 0

        # -----------------------------
        # COMPUTE CURRENT BORROWED
        # -----------------------------
        cursor.execute("""
            SELECT COALESCE(SUM(no_of_copies), 0)
            FROM circulations
            WHERE book_id = ?
            AND status = 'borrowed'
        """, (book_id,))

        borrowed = cursor.fetchone()[0] or 0

        available = total - borrowed

        # -----------------------------
        # STOCK VALIDATION
        # -----------------------------
        if no_of_copies > available:
            return jsonify({"error": f"Only {available} copies available"}), 400

        # -----------------------------
        # INSERT BORROW RECORD
        # -----------------------------
        cursor.execute("""
            INSERT INTO circulations (
                book_id,
                student_lrn,
                student_name,
                student_school,
                borrow_date,
                due_date,
                status,
                renewal_count,
                no_of_copies,
                remarks,
                created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            book_id,
            borrower_id,
            borrower_name,
            borrower_school,
            borrow_date,
            due_date,
            "borrowed",
            0,
            no_of_copies,
            remarks,
            datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        ))

        conn.commit()

        # -----------------------------
        # LOG SUCCESS
        # -----------------------------
        action_log(
            action="Borrow Book",
            desc=f"{borrower_name} borrowed {no_of_copies} copy/copies of book {book_id}",
            conn=conn
        )

        return jsonify({"success": True})

    except Exception as e:
        conn.rollback()

        action_log(
            action="Borrow Failed",
            desc=f"Book {book_id} borrow failed: {str(e)}",
            conn=conn
        )

        return jsonify({"error": str(e)}), 500

    finally:
        conn.close()

@server.route("/api/borrow/<int:borrow_id>/lost", methods=["PUT"])
def mark_lost(borrow_id):
    conn = db_conn.conn_init()
    cursor = conn.cursor()

    try:
        # check record
        cursor.execute("""
            SELECT status
            FROM circulations
            WHERE id = ?
        """, (borrow_id,))
        row = cursor.fetchone()

        if not row:
            return jsonify({"error": "Record not found"}), 404

        if row["status"] == "lost":
            return jsonify({"error": "Already marked as lost"}), 400
        
        if row["status"] in ("lost", "recovered", "returned"):
            return jsonify({"error": "Cannot mark as lost"}), 400

        # update status
        cursor.execute("""
            UPDATE circulations
            SET status = 'lost'
            WHERE id = ?
        """, (borrow_id,))

        conn.commit()

        action_log(
            action="Mark Lost",
            desc=f"Borrow record {borrow_id} marked as lost",
            conn=conn
        )

        return jsonify({"success": True})

    except Exception as e:
        conn.rollback()

        action_log(
            action="Mark Lost Failed",
            desc=f"Borrow {borrow_id} failed: {str(e)}",
            conn=conn
        )

        return jsonify({"error": str(e)}), 500

    finally:
        conn.close()
        
        
@server.route("/api/borrow/<int:borrow_id>/renew", methods=["PUT"])
def renew_borrow(borrow_id):
    conn = db_conn.conn_init()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            SELECT due_date, renewal_count, status
            FROM circulations
            WHERE id = ?
        """, (borrow_id,))

        row = cursor.fetchone()

        if not row:
            return jsonify({"error": "Record not found"}), 404

        if row["status"] == "lost":
            return jsonify({"error": "Cannot renew a lost book"}), 400
        
        if row["status"] in ("returned", "recovered"):
            return jsonify({"error": "Cannot renew a returned/recovered book"}), 400

        # current values
        renewal_count = row["renewal_count"] or 0
        due_date = datetime.strptime(row["due_date"], "%Y-%m-%d")

        # add 1 week
        new_due_date = due_date + timedelta(days=7)

        cursor.execute("""
            UPDATE circulations
            SET renewal_count = ?,
                due_date = ?
            WHERE id = ?
        """, (
            renewal_count + 1,
            new_due_date.strftime("%Y-%m-%d"),
            borrow_id
        ))

        conn.commit()

        action_log(
            action="Renew Borrow",
            desc=f"Borrow {borrow_id} renewed (count {renewal_count + 1})",
            conn=conn
        )

        return jsonify({"success": True})

    except Exception as e:
        conn.rollback()

        action_log(
            action="Renew Failed",
            desc=f"Borrow {borrow_id} renew failed: {str(e)}",
            conn=conn
        )

        return jsonify({"error": str(e)}), 500

    finally:
        conn.close()

@server.route("/api/borrow/<int:borrow_id>/return", methods=["PUT"])
def return_borrow(borrow_id):
    conn = db_conn.conn_init()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            SELECT status
            FROM circulations
            WHERE id = ?
        """, (borrow_id,))

        row = cursor.fetchone()

        if not row:
            return jsonify({"error": "Record not found"}), 404

        if row["status"] == "returned":
            return jsonify({"error": "Already returned"}), 400

        if row["status"] == "recovered":
            return jsonify({"error": "Already recovered"}), 400

        today = datetime.now().strftime("%Y-%m-%d")

        # 👇 decide status transition
        if row["status"] == "lost":
            new_status = "recovered"
        else:
            new_status = "returned"

        cursor.execute("""
            UPDATE circulations
            SET status = ?,
                return_date = ?
            WHERE id = ?
        """, (new_status, today, borrow_id))

        conn.commit()

        action_log(
            action="Return Book",
            desc=f"Borrow {borrow_id} marked as returned",
            conn=conn
        )

        return jsonify({"success": True})

    except Exception as e:
        conn.rollback()

        action_log(
            action="Return Failed",
            desc=f"Borrow {borrow_id} return failed: {str(e)}",
            conn=conn
        )
        

        return jsonify({"error": str(e)}), 500

    finally:
        conn.close()

#TODO combined endpoints for the borrow actions. remove or reuse later
@server.route("/api/borrow/<int:borrow_id>/status", methods=["PUT"])
def update_status(borrow_id):
    data = request.get_json()
    action = data.get("action")  # return | lost | renew

    conn = db_conn.conn_init()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            SELECT status, due_date, renewal_count
            FROM circulations
            WHERE id = ?
        """, (borrow_id,))

        row = cursor.fetchone()

        if not row:
            return jsonify({"error": "Record not found"}), 404

        today = datetime.now().strftime("%Y-%m-%d")

        current_status = row["status"]
        renewal_count = row["renewal_count"] or 0

        # -------------------------
        # RETURN / RECOVER LOGIC
        # -------------------------
        if action == "return":
            if current_status == "returned":
                return jsonify({"error": "Already returned"}), 400

            new_status = "recovered" if current_status == "lost" else "returned"

            cursor.execute("""
                UPDATE circulations
                SET status = ?,
                    return_date = ?
                WHERE id = ?
            """, (new_status, today, borrow_id))

        # -------------------------
        # LOST LOGIC
        # -------------------------
        elif action == "lost":
            if current_status in ("lost", "returned"):
                return jsonify({"error": "Invalid action"}), 400

            cursor.execute("""
                UPDATE circulations
                SET status = 'lost'
                WHERE id = ?
            """, (borrow_id,))

        # -------------------------
        # RENEW LOGIC
        # -------------------------
        elif action == "renew":
            if current_status in ("lost", "returned"):
                return jsonify({"error": "Cannot renew this record"}), 400

            new_due = datetime.strptime(row["due_date"], "%Y-%m-%d") + timedelta(days=7)

            cursor.execute("""
                UPDATE circulations
                SET renewal_count = ?,
                    due_date = ?
                WHERE id = ?
            """, (
                renewal_count + 1,
                new_due.strftime("%Y-%m-%d"),
                borrow_id
            ))

        else:
            return jsonify({"error": "Invalid action"}), 400

        conn.commit()

        action_log(
            action=f"Borrow {action.capitalize()}",
            desc=f"Borrow {borrow_id} → {action}",
            conn=conn
        )

        return jsonify({"success": True})

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        conn.close()


@server.route("/api/borrow/sync-overdue", methods=["POST"])
def sync_overdue():
    ''' This endpoint checks all borrowed records and updates status to overdue if past due date.'''
    conn = db_conn.conn_init()
    cursor = conn.cursor()

    try:
        today = datetime.now().date()

        cursor.execute("""
            SELECT id, due_date, status
            FROM circulations
            WHERE status = 'borrowed'
        """)

        rows = cursor.fetchall()

        updated = 0

        for row in rows:
            if not row["due_date"]:
                continue

            due = datetime.strptime(row["due_date"], "%Y-%m-%d").date()

            if today > due:
                cursor.execute("""
                    UPDATE circulations
                    SET status = 'overdue'
                    WHERE id = ?
                """, (row["id"],))
                updated += 1

        conn.commit()

        return jsonify({
            "success": True,
            "updated": updated
        })

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        conn.close()


@server.route("/api/borrow/<int:borrow_id>/delete", methods=["DELETE"])
def delete_borrow(borrow_id):
    conn = db_conn.conn_init()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            UPDATE circulations
            SET status = 'deleted'
            WHERE id = ?
        """, (borrow_id,))

        conn.commit()

        action_log(
            action="Delete Borrow",
            desc=f"Borrow {borrow_id} deleted",
            conn=conn
        )

        return jsonify({"success": True})

    except Exception as e:
        conn.rollback()
        action_log(
            action="Delete Borrow Failed",
            desc=f"Borrow {borrow_id} delete failed: {str(e)}",
            conn=conn
        )
        return jsonify({"error": str(e)}), 500

    finally:
        conn.close()
        


@server.route("/api/logs", methods=["GET"])
def get_logs():
    conn = db_conn.conn_init()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT log_id, log_time, action_name, description
            FROM logs
            ORDER BY log_id DESC
        """)
        rows = cursor.fetchall()
        data = [dict(row) for row in rows]
        return jsonify({"data": data})
    except Exception as e:
        print("DB ERROR:", e)
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()


#? -------------------- END -------------------- ?#



#? -------------------- MISC ROUTES -------------------- ?#

@server.errorhandler(404)
def page_not_found(e):
    return render_template("404.html"), 404

@server.errorhandler(403)
def page_not_found(e):
    ''' use this with abort(403)'''
    return render_template("403.html"), 403

ROOT_STATIC_FILES = {
    "robots.txt",
    "humans.txt",
    "security.txt"
}
@server.route('/<path:filename>')
def root_static_files(filename):
    if filename in ROOT_STATIC_FILES:
        return send_from_directory(server.static_folder, filename)
    abort(404)
    
# Favicon
@server.route('/favicon.ico')
def favicon():
    return send_from_directory(server.static_folder, 'assets/favicon.ico') 

#? -------------------- END -------------------- ?#


#? -------------------- MISC FUNCTIONS -------------------- ?#


def action_log(action=None, desc=None, conn=None):
    """Log actions into logs table (SQLite)"""

    external_conn = conn is not None

    if not external_conn:
        conn = db_conn.conn_init()

    cursor = conn.cursor()

    try:
        log_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        cursor.execute("""
            INSERT INTO logs (log_time, action_name, description)
            VALUES (?, ?, ?)
        """, (
            log_time,
            action or "Unknown Action",
            desc or "No description"
        ))

        conn.commit()

        print(f"✅ Action logged: {action} - {desc}")
        return True

    except Exception as e:
        conn.rollback()
        print(f"❌ Error logging action: {e}")
        return False

    finally:
        # only close if WE created the connection
        if not external_conn:
            conn.close()
        
        
#? -------------------- END -------------------- ?#

if __name__ == '__main__':
    
    # DEPRECATED LIVE RELOAD METHOD. REMOVE LATER
    '''
    flask_server = Server(server.wsgi_app)
    flask_server.watch('static/*.*')  # watches static files (CSS/JS)
    flask_server.watch('templates/*.html')  # watches templates
    flask_server.serve(port=5000, host="127.0.0.1")

    #server.run(debug=True, use_reloader=True, port=5000)
    '''
    print("FLASK_ENV:", os.getenv("FLASK_ENV"))
    
    if os.getenv("FLASK_ENV") == "production":
        #server.run(host="0.0.0.0", port=5000)
        pass
    else:
    #if os.getenv("FLASK_ENV") == "development":
        flask_server = Server(server.wsgi_app)
        flask_server.watch('static/*.*')
        flask_server.watch('templates/*.html')
        flask_server.serve(port=5000, host="127.0.0.1")
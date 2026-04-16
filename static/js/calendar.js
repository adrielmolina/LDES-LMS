/**
 * Library Calendar Manager
 * Handles calendar rendering and due date notifications
 * No external dependencies - fully offline compatible
 */

class LibraryCalendar {
    constructor() {
        // Mock library borrowed books data (due dates)
        this.borrowedBooks = [
            { id: 1, title: "The Midnight Library", borrower: "Emma Watson", dueDate: "2026-04-16", status: "borrowed" },
            { id: 2, title: "Dune", borrower: "Paul Atreides", dueDate: "2026-04-18", status: "borrowed" },
            { id: 3, title: "Project Hail Mary", borrower: "Ryland Grace", dueDate: "2026-04-20", status: "borrowed" },
            { id: 4, title: "Atomic Habits", borrower: "James Clear", dueDate: "2026-04-10", status: "overdue" },
            { id: 5, title: "The Great Gatsby", borrower: "Nick Carraway", dueDate: "2026-04-05", status: "overdue" },
            { id: 6, title: "Sapiens", borrower: "Yuval Noah", dueDate: "2026-04-25", status: "borrowed" },
            { id: 7, title: "Klara and the Sun", borrower: "Kathy H.", dueDate: "2026-04-28", status: "borrowed" },
            { id: 8, title: "The Seven Husbands", borrower: "Evelyn Hugo", dueDate: "2026-04-30", status: "borrowed" },
            { id: 9, title: "Circe", borrower: "Madeline Miller", dueDate: "2026-04-15", status: "borrowed" },
            { id: 10, title: "1984", borrower: "Winston Smith", dueDate: "2026-04-12", status: "overdue" },
            { id: 11, title: "Pride and Prejudice", borrower: "Elizabeth Bennet", dueDate: "2026-04-22", status: "borrowed" },
            { id: 12, title: "The Hobbit", borrower: "Bilbo Baggins", dueDate: "2026-04-19", status: "borrowed" }
        ];
        
        this.currentDate = new Date();
        this.currentFilter = "today"; // Default filter: today, week, month
        
        this.init();
    }
    
    formatYMD(date) {
        let y = date.getFullYear();
        let m = String(date.getMonth() + 1).padStart(2, '0');
        let d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }
    
    updateStats() {
        const borrowed = this.borrowedBooks.filter(b => b.status === "borrowed").length;
        const overdue = this.borrowedBooks.filter(b => b.status === "overdue").length;
        const reservations = 0; // No reservations in this system
        
        const totalBorrowedElem = document.getElementById("totalBorrowedStat");
        const totalOverdueElem = document.getElementById("totalOverdueStat");
        const totalReservationsElem = document.getElementById("totalReservationsStat");
        
        if (totalBorrowedElem) totalBorrowedElem.innerText = borrowed;
        if (totalOverdueElem) totalOverdueElem.innerText = overdue;
        if (totalReservationsElem) totalReservationsElem.innerText = reservations;
    }
    
    getEventsForDate(ymd) {
        return this.borrowedBooks.filter(book => book.dueDate === ymd);
    }
    
    getDueDatesMapForMonth(year, month) {
        const map = new Map();
        
        this.borrowedBooks.forEach(book => {
            const dueDate = book.dueDate;
            if (!dueDate) return;
            
            const [y, m, d] = dueDate.split('-').map(Number);
            if (y === year && m === month + 1) {
                if (!map.has(dueDate)) {
                    map.set(dueDate, { overdue: false, borrowed: false });
                }
                const entry = map.get(dueDate);
                if (book.status === 'overdue') entry.overdue = true;
                if (book.status === 'borrowed') entry.borrowed = true;
            }
        });
        
        return map;
    }
    
    renderCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        const startWeekday = firstDayOfMonth.getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        const prevMonthDays = new Date(year, month, 0).getDate();
        const calendarCells = [];
        
        // Previous month days
        for (let i = startWeekday - 1; i >= 0; i--) {
            const dayNum = prevMonthDays - i;
            const dateObj = new Date(year, month - 1, dayNum);
            const ymd = this.formatYMD(dateObj);
            calendarCells.push({ date: ymd, day: dayNum, isCurrentMonth: false, isToday: false });
        }
        
        // Current month days
        const todayYMD = this.formatYMD(new Date());
        for (let d = 1; d <= daysInMonth; d++) {
            const ymd = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const isToday = (ymd === todayYMD);
            calendarCells.push({ date: ymd, day: d, isCurrentMonth: true, isToday });
        }
        
        // Next month days
        const remaining = 42 - calendarCells.length;
        for (let i = 1; i <= remaining; i++) {
            const dateObj = new Date(year, month + 1, i);
            const ymd = this.formatYMD(dateObj);
            calendarCells.push({ date: ymd, day: i, isCurrentMonth: false, isToday: false });
        }
        
        const dueDatesMap = this.getDueDatesMapForMonth(year, month);
        const gridContainer = document.getElementById("calendarDaysGrid");
        if (!gridContainer) return;
        
        gridContainer.innerHTML = "";
        
        calendarCells.forEach(cell => {
            const dayDiv = document.createElement("div");
            dayDiv.className = "day-cell";
            if (!cell.isCurrentMonth) dayDiv.classList.add("other-month");
            if (cell.isToday) dayDiv.classList.add("today");
            
            const daySpan = document.createElement("div");
            daySpan.className = "day-number";
            daySpan.innerText = cell.day;
            dayDiv.appendChild(daySpan);
            
            const dueInfo = dueDatesMap.get(cell.date);
            if (dueInfo && cell.isCurrentMonth) {
                const indicatorDiv = document.createElement("div");
                indicatorDiv.className = "event-indicator";
                
                if (dueInfo.overdue) {
                    const dot = document.createElement("span");
                    dot.className = "badge-event badge-overdue";
                    dot.title = "Overdue book";
                    indicatorDiv.appendChild(dot);
                }
                if (dueInfo.borrowed) {
                    const dot = document.createElement("span");
                    dot.className = "badge-event";
                    dot.style.backgroundColor = "#4a90e2";
                    dot.title = "Due date";
                    indicatorDiv.appendChild(dot);
                }
                
                if (indicatorDiv.children.length > 0) {
                    dayDiv.appendChild(indicatorDiv);
                }
            }
            
            dayDiv.addEventListener("click", (dateStr => {
                return () => this.onDateSelect(dateStr);
            })(cell.date));
            
            gridContainer.appendChild(dayDiv);
        });
        
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const monthYearElem = document.getElementById("calendarMonthYear");
        if (monthYearElem) {
            monthYearElem.innerText = `${monthNames[month]} ${year}`;
        }
    }
    
    onDateSelect(dateYMD) {
        // This is for calendar click - shows due dates for that specific date
        const eventsOnDate = this.getEventsForDate(dateYMD);
        const container = document.getElementById("eventsListContainer");
        
        if (!container) return;
        
        if (eventsOnDate.length === 0) {
            container.innerHTML = `
                <div class="notif-empty">
                    <div class="notif-empty-icon">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.5"/>
                            <path d="M16 2V6M8 2V6M3 10H21M8 14H10M12 14H14M8 17H10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                        </svg>
                    </div>
                    <p>No due dates on ${this.formatDisplayDate(dateYMD)}</p>
                    <span>Select another date or use the dropdown filter</span>
                </div>`;
            return;
        }
        
        const sorted = [...eventsOnDate].sort((a, b) => {
            const order = { overdue: 1, borrowed: 2 };
            return order[a.status] - order[b.status];
        });
        
        let html = `<div style="padding: 0 0 8px 0; border-bottom: 0.5px solid var(--border); margin-bottom: 8px;">
                        <small style="color: var(--text-secondary);">📅 ${this.formatDisplayDate(dateYMD)}</small>
                    </div>`;
        
        sorted.forEach(book => {
            let badgeClass = book.status;
            let badgeText = book.status.toUpperCase();
            let extraDetail = `<span>👤 ${book.borrower}</span><span>📅 Due: ${book.dueDate}</span>`;
            
            if (book.status === "overdue") {
                extraDetail = `<span>⚠️ Overdue</span><span>👤 ${book.borrower}</span><span>📅 Due: ${book.dueDate}</span>`;
            }
            
            html += `
                <div class="event-item">
                    <div class="event-title">
                        <span>📖 ${this.escapeHtml(book.title)}</span>
                        <span class="event-badge ${badgeClass}">${badgeText}</span>
                    </div>
                    <div class="event-detail">
                        ${extraDetail}
                    </div>
                    ${book.status === 'overdue' ? '<div style="font-size: 10px; color: #c62828; margin-top: 4px;">⚠️ Overdue fee may apply</div>' : ''}
                </div>
            `;
        });
        
        container.innerHTML = html;
    }
    
    // NEW: Get date range based on filter
    getDateRange(rangeType) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const start = new Date(today);
        const end = new Date(today);
        
        switch(rangeType) {
            case 'today':
                // Same day
                end.setHours(23, 59, 59, 999);
                break;
            case 'week':
                // Start of week (Sunday)
                start.setDate(today.getDate() - today.getDay());
                start.setHours(0, 0, 0, 0);
                // End of week (Saturday)
                end.setDate(start.getDate() + 6);
                end.setHours(23, 59, 59, 999);
                break;
            case 'month':
                // Start of month
                start.setDate(1);
                start.setHours(0, 0, 0, 0);
                // End of month
                end.setMonth(today.getMonth() + 1);
                end.setDate(0);
                end.setHours(23, 59, 59, 999);
                break;
            default:
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
        }
        
        return { start, end };
    }
    
    // NEW: Filter books by date range
    filterBooksByRange(rangeType) {
        const { start, end } = this.getDateRange(rangeType);
        
        return this.borrowedBooks.filter(book => {
            const dueDate = new Date(book.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            return dueDate >= start && dueDate <= end;
        });
    }
    
    // NEW: Get readable range text
    getRangeText(rangeType) {
        switch(rangeType) {
            case 'today': return 'Today';
            case 'week': return 'This Week';
            case 'month': return 'This Month';
            default: return '';
        }
    }
    
    // NEW: Update notifications based on selected filter
    updateNotifications(filterType) {
        this.currentFilter = filterType;
        const container = document.getElementById("eventsListContainer");
        const countBadge = document.getElementById("eventsCount");
        
        if (!container) return;
        
        const filteredBooks = this.filterBooksByRange(filterType);
        
        // Update count badge
        if (countBadge) {
            countBadge.textContent = filteredBooks.length;
        }
        
        // Display filtered books
        if (filteredBooks.length === 0) {
            container.innerHTML = `
                <div class="notif-empty">
                    <div class="notif-empty-icon">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.5"/>
                            <path d="M16 2V6M8 2V6M3 10H21M8 14H10M12 14H14M8 17H10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                        </svg>
                    </div>
                    <p>No due dates ${this.getRangeText(filterType).toLowerCase()}</p>
                    <span>All caught up! 📚</span>
                </div>
            `;
            return;
        }
        
        // Sort: overdue first, then by due date
        const sorted = [...filteredBooks].sort((a, b) => {
            if (a.status === 'overdue' && b.status !== 'overdue') return -1;
            if (a.status !== 'overdue' && b.status === 'overdue') return 1;
            return new Date(a.dueDate) - new Date(b.dueDate);
        });
        
        const rangeLabel = this.getRangeText(filterType);
        container.innerHTML = sorted.map(book => {
            let badgeClass = book.status;
            let badgeText = book.status.toUpperCase();
            let extraDetail = `<span>👤 ${this.escapeHtml(book.borrower)}</span><span>📅 Due: ${book.dueDate}</span>`;
            
            if (book.status === "overdue") {
                extraDetail = `<span>⚠️ Overdue by ${this.getOverdueDays(book.dueDate)} days</span><span>👤 ${this.escapeHtml(book.borrower)}</span><span>📅 Due: ${book.dueDate}</span>`;
            }
            
            return `
                <div class="event-item">
                    <div class="event-title">
                        <span>📖 ${this.escapeHtml(book.title)}</span>
                        <span class="event-badge ${badgeClass}">${badgeText}</span>
                    </div>
                    <div class="event-detail">
                        ${extraDetail}
                    </div>
                    ${book.status === 'overdue' ? '<div style="font-size: 10px; color: #c62828; margin-top: 4px;">⚠️ Late fee may apply. Please return soon!</div>' : ''}
                </div>
            `;
        }).join('');
    }
    
    // Helper: Calculate overdue days
    getOverdueDays(dueDateStr) {
        const dueDate = new Date(dueDateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diffTime = today - dueDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }
    
    formatDisplayDate(ymd) {
        const [y, m, d] = ymd.split('-');
        const dateObj = new Date(y, m - 1, d);
        return dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    prevMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.renderCalendar();
        // Keep showing current filter results, not a specific date
        this.updateNotifications(this.currentFilter);
    }
    
    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.renderCalendar();
        // Keep showing current filter results, not a specific date
        this.updateNotifications(this.currentFilter);
    }
    
    init() {
        this.updateStats();
        this.renderCalendar();
        
        // Initialize notification dropdown
        const dropdown = document.getElementById("notifTimeRange");
        if (dropdown) {
            dropdown.addEventListener("change", (e) => {
                this.updateNotifications(e.target.value);
            });
            // Load default filter (Today)
            this.updateNotifications("today");
        }
        
        // Calendar navigation
        const prevBtn = document.getElementById("prevMonthBtn");
        const nextBtn = document.getElementById("nextMonthBtn");
        
        if (prevBtn) {
            prevBtn.addEventListener("click", () => this.prevMonth());
        }
        if (nextBtn) {
            nextBtn.addEventListener("click", () => this.nextMonth());
        }
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new LibraryCalendar();
    });
} else {
    new LibraryCalendar();
}
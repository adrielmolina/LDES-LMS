/**
 * Library Calendar Manager
 * Handles calendar rendering, events management, and library reservations
 * No external dependencies - fully offline compatible
 */

class LibraryCalendar {
    constructor() {
        // Mock library events data
        this.libraryEvents = [
            { id: 1, title: "The Midnight Library", type: "borrowed", dueDate: "2026-03-25", patron: "Emma Watson", bookTitle: "The Midnight Library" },
            { id: 2, title: "Dune", type: "borrowed", dueDate: "2026-03-28", patron: "Paul Atreides", bookTitle: "Dune" },
            { id: 3, title: "Project Hail Mary", type: "borrowed", dueDate: "2026-03-30", patron: "Ryland Grace", bookTitle: "Project Hail Mary" },
            { id: 4, title: "Atomic Habits", type: "overdue", dueDate: "2026-03-10", patron: "James Clear", bookTitle: "Atomic Habits", overdueDays: 13 },
            { id: 5, title: "The Great Gatsby", type: "overdue", dueDate: "2026-03-05", patron: "Nick Carraway", bookTitle: "The Great Gatsby", overdueDays: 18 },
            { id: 6, title: "Sapiens", type: "reservation", dueDate: "2026-04-02", patron: "Yuval Noah", bookTitle: "Sapiens (hold)" },
            { id: 7, title: "Klara and the Sun", type: "reservation", dueDate: "2026-04-05", patron: "Kathy H.", bookTitle: "Klara and the Sun" },
            { id: 8, title: "The Seven Husbands", type: "reservation", dueDate: "2026-04-10", patron: "Evelyn Hugo", bookTitle: "The Seven Husbands of Evelyn Hugo" },
            { id: 9, title: "Circe", type: "borrowed", dueDate: "2026-03-27", patron: "Madeline Miller", bookTitle: "Circe" }
        ];
        
        this.currentDate = new Date(2026, 2, 20);
        this.selectedDateStr = "2026-03-20";
        
        this.init();
    }
    
    formatYMD(date) {
        let y = date.getFullYear();
        let m = String(date.getMonth() + 1).padStart(2, '0');
        let d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }
    
    updateStats() {
        const borrowed = this.libraryEvents.filter(e => e.type === "borrowed").length;
        const overdue = this.libraryEvents.filter(e => e.type === "overdue").length;
        const reservations = this.libraryEvents.filter(e => e.type === "reservation").length;
        
        const totalBorrowedElem = document.getElementById("totalBorrowedStat");
        const totalOverdueElem = document.getElementById("totalOverdueStat");
        const totalReservationsElem = document.getElementById("totalReservationsStat");
        
        if (totalBorrowedElem) totalBorrowedElem.innerText = borrowed;
        if (totalOverdueElem) totalOverdueElem.innerText = overdue;
        if (totalReservationsElem) totalReservationsElem.innerText = reservations;
    }
    
    getEventsForDate(ymd) {
        return this.libraryEvents.filter(ev => ev.dueDate === ymd);
    }
    
    getEventMapForMonth(year, month) {
        const map = new Map();
        
        this.libraryEvents.forEach(ev => {
            const evDate = ev.dueDate;
            if (!evDate) return;
            
            const [y, m, d] = evDate.split('-').map(Number);
            if (y === year && m === month + 1) {
                if (!map.has(evDate)) {
                    map.set(evDate, { overdue: false, borrowed: false, reservation: false });
                }
                const entry = map.get(evDate);
                if (ev.type === 'overdue') entry.overdue = true;
                if (ev.type === 'borrowed') entry.borrowed = true;
                if (ev.type === 'reservation') entry.reservation = true;
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
        
        for (let i = startWeekday - 1; i >= 0; i--) {
            const dayNum = prevMonthDays - i;
            const dateObj = new Date(year, month - 1, dayNum);
            const ymd = this.formatYMD(dateObj);
            calendarCells.push({ date: ymd, day: dayNum, isCurrentMonth: false, isToday: false });
        }
        
        const todayYMD = this.formatYMD(new Date());
        for (let d = 1; d <= daysInMonth; d++) {
            const ymd = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const isToday = (ymd === todayYMD);
            calendarCells.push({ date: ymd, day: d, isCurrentMonth: true, isToday });
        }
        
        const remaining = 42 - calendarCells.length;
        for (let i = 1; i <= remaining; i++) {
            const dateObj = new Date(year, month + 1, i);
            const ymd = this.formatYMD(dateObj);
            calendarCells.push({ date: ymd, day: i, isCurrentMonth: false, isToday: false });
        }
        
        const eventMap = this.getEventMapForMonth(year, month);
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
            
            const evInfo = eventMap.get(cell.date);
            if (evInfo && cell.isCurrentMonth) {
                const indicatorDiv = document.createElement("div");
                indicatorDiv.className = "event-indicator";
                
                if (evInfo.overdue) {
                    const dot = document.createElement("span");
                    dot.className = "badge-event badge-overdue";
                    dot.title = "Overdue item";
                    indicatorDiv.appendChild(dot);
                }
                if (evInfo.borrowed) {
                    const dot = document.createElement("span");
                    dot.className = "badge-event badge-borrow";
                    dot.title = "Active borrowed";
                    indicatorDiv.appendChild(dot);
                }
                if (evInfo.reservation) {
                    const dot = document.createElement("span");
                    dot.className = "badge-event";
                    dot.style.backgroundColor = "#f4b942";
                    dot.title = "Reservation";
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
        this.selectedDateStr = dateYMD;
        const eventsOnDate = this.getEventsForDate(dateYMD);
        const container = document.getElementById("eventsListContainer");
        
        if (!container) return;
        
        if (eventsOnDate.length === 0) {
            container.innerHTML = `
                <div class="empty-notify">
                    <span style="font-size: 2rem;">📅</span>
                    <p>No reservations, borrowed or overdue on this date.</p>
                    <small class="text-muted">Click "New reservation" to add a hold.</small>
                </div>`;
            return;
        }
        
        const sorted = [...eventsOnDate].sort((a, b) => {
            const order = { overdue: 1, borrowed: 2, reservation: 3 };
            return order[a.type] - order[b.type];
        });
        
        let html = `<div class="px-3 pt-2 pb-1"><small class="text-muted">📅 ${this.formatDisplayDate(dateYMD)}</small></div>`;
        
        sorted.forEach(ev => {
            let badgeClass = "";
            let badgeText = "";
            let extraDetail = "";
            
            if (ev.type === "overdue") {
                badgeClass = "overdue";
                badgeText = "OVERDUE";
                extraDetail = `<span>⏰ Due: ${ev.dueDate}</span>`;
            } else if (ev.type === "borrowed") {
                badgeClass = "borrowed";
                badgeText = "BORROWED";
                extraDetail = `<span>👤 ${ev.patron}</span><span>↩️ Due: ${ev.dueDate}</span>`;
            } else if (ev.type === "reservation") {
                badgeClass = "";
                badgeText = "RESERVATION";
                extraDetail = `<span>✓ ${ev.patron}</span><span>📅 Hold until ${ev.dueDate}</span>`;
            }
            
            html += `
                <div class="event-item">
                    <div class="event-title">
                        <span>📖 ${ev.bookTitle}</span>
                        <span class="event-badge ${badgeClass}">${badgeText}</span>
                    </div>
                    <div class="event-detail">
                        ${extraDetail}
                    </div>
                    ${ev.type === 'overdue' ? '<div class="text-danger small mt-1">⚠️ Overdue fee may apply</div>' : ''}
                </div>
            `;
        });
        
        container.innerHTML = html;
    }
    
    formatDisplayDate(ymd) {
        const [y, m, d] = ymd.split('-');
        const dateObj = new Date(y, m - 1, d);
        return dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
    }
    
    prevMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.renderCalendar();
        
        const eventsForPrevSelected = this.getEventsForDate(this.selectedDateStr);
        if (eventsForPrevSelected.length > 0 || this.selectedDateStr.startsWith(this.currentDate.getFullYear() + "-" + String(this.currentDate.getMonth() + 1).padStart(2, '0'))) {
            this.onDateSelect(this.selectedDateStr);
        } else {
            const container = document.getElementById("eventsListContainer");
            if (container) {
                container.innerHTML = `<div class="empty-notify"><span style="font-size: 2rem;">📅</span><p>Select a date to see details</p></div>`;
            }
        }
    }
    
    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.renderCalendar();
        
        const eventsForNextSelected = this.getEventsForDate(this.selectedDateStr);
        if (eventsForNextSelected.length > 0 || this.selectedDateStr.startsWith(this.currentDate.getFullYear() + "-" + String(this.currentDate.getMonth() + 1).padStart(2, '0'))) {
            this.onDateSelect(this.selectedDateStr);
        } else {
            const container = document.getElementById("eventsListContainer");
            if (container) {
                container.innerHTML = `<div class="empty-notify"><span style="font-size: 2rem;">📅</span><p>Select a date to see details</p></div>`;
            }
        }
    }
    
    addQuickReservation() {
        const newDueDate = this.selectedDateStr && this.selectedDateStr !== "" ? this.selectedDateStr : this.formatYMD(new Date());
        const newId = this.libraryEvents.length + 10;
        const newReservation = {
            id: newId,
            title: "New Reservation",
            type: "reservation",
            dueDate: newDueDate,
            patron: "Current User",
            bookTitle: `Reserved Book #${newId}`
        };
        
        this.libraryEvents.push(newReservation);
        this.updateStats();
        this.renderCalendar();
        this.onDateSelect(newDueDate);
        
        const panelHeader = document.querySelector(".panel-header");
        if (panelHeader) {
            const originalBg = panelHeader.style.backgroundColor;
            panelHeader.style.transition = "0.2s";
            panelHeader.style.backgroundColor = "#fff2e0";
            setTimeout(() => {
                panelHeader.style.backgroundColor = "";
                panelHeader.style.transition = "";
            }, 400);
        }
    }
    
    init() {
        this.updateStats();
        this.renderCalendar();
        this.onDateSelect(this.selectedDateStr);
        
        const prevBtn = document.getElementById("prevMonthBtn");
        const nextBtn = document.getElementById("nextMonthBtn");
        const reserveBtn = document.getElementById("quickReserveBtn");
        
        if (prevBtn) {
            prevBtn.addEventListener("click", () => this.prevMonth());
        }
        if (nextBtn) {
            nextBtn.addEventListener("click", () => this.nextMonth());
        }
        if (reserveBtn) {
            reserveBtn.addEventListener("click", () => this.addQuickReservation());
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
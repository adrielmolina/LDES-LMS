/**
 * Library Calendar Manager - Connected to Real Database
 */

class LibraryCalendar {
    constructor() {
        this.currentDate = new Date();
        this.selectedDateStr = null;
        
        const today = new Date();
        this.selectedDateStr = this.formatYMD(today);
        
        this.init();
    }
    
    formatYMD(date) {
        let y = date.getFullYear();
        let m = String(date.getMonth() + 1).padStart(2, '0');
        let d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }
    
    async loadEventsForMonth(year, month) {
        try {
            const response = await fetch(`/api/dashboard/calendar?year=${year}&month=${month + 1}`);
            const data = await response.json();
            
            if (data.success) {
                return data.events;
            } else {
                console.error('API error:', data.error);
                return [];
            }
        } catch (error) {
            console.error('Error loading calendar events:', error);
            return [];
        }
    }
    
    async getEventsForDate(ymd) {
        try {
            const response = await fetch(`/api/dashboard/notifications?date=${ymd}`);
            const data = await response.json();
            
            if (data.success) {
                return data.notifications.map(notif => ({
                    id: notif.id,
                    title: notif.title,
                    type: notif.type === 'due_date' ? 'borrowed' : 'overdue',
                    dueDate: notif.due_date,
                    patron: notif.borrower || 'Unknown',
                    bookTitle: notif.title,
                    author: notif.author,
                    message: notif.message
                }));
            }
            return [];
        } catch (error) {
            console.error('Error loading notifications:', error);
            return [];
        }
    }
    
    getEventMapForMonth(events, year, month) {
        const map = new Map();
        
        events.forEach(ev => {
            const evDate = ev.date;
            if (!evDate) return;
            
            const [y, m, d] = evDate.split('-').map(Number);
            if (y === year && m === month + 1) {
                if (!map.has(evDate)) {
                    map.set(evDate, { overdue: false, borrowed: false });
                }
                const entry = map.get(evDate);
                if (ev.status === 'overdue') entry.overdue = true;
                if (ev.status === 'borrowed') entry.borrowed = true;
            }
        });
        
        return map;
    }
    
    async renderCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        const events = await this.loadEventsForMonth(year, month);
        
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
        
        const eventMap = this.getEventMapForMonth(events, year, month);
        const gridContainer = document.getElementById("calendarDaysGrid");
        if (!gridContainer) return;
        
        gridContainer.innerHTML = "";
        
        calendarCells.forEach(cell => {
            // Use the exact class names from your CSS
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
                    dot.className = "badge-event";
                    dot.style.backgroundColor = "#e36c4a"; // Match legend-dot--due color
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
    
    async onDateSelect(dateYMD) {
        this.selectedDateStr = dateYMD;
        const eventsOnDate = await this.getEventsForDate(dateYMD);
        const container = document.getElementById("eventsListContainer");
        const eventsCountBadge = document.getElementById("eventsCount");
        
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
                    <p>No events</p>
                    <span>No due dates or overdue books for this day</span>
                </div>`;
            if (eventsCountBadge) eventsCountBadge.innerText = "0";
            return;
        }
        
        if (eventsCountBadge) eventsCountBadge.innerText = eventsOnDate.length;
        
        const formattedDate = this.formatDisplayDate(dateYMD);
        
        let html = `<div style="padding: 0 0 12px 0;"><small class="text-muted">📅 ${formattedDate}</small></div>`;
        html += `<div class="notification-list">`;
        
        eventsOnDate.forEach(ev => {
            let badgeClass = "";
            let badgeText = "";
            
            if (ev.type === "overdue") {
                badgeClass = "overdue";
                badgeText = "OVERDUE";
            } else if (ev.type === "due_date") {
                badgeClass = "borrowed";
                badgeText = "DUE TODAY";
            }
            
            html += `
                <div class="event-item">
                    <div class="event-title">
                        <span>📖 ${this.escapeHtml(ev.bookTitle)}</span>
                        <span class="event-badge ${badgeClass}">${badgeText}</span>
                    </div>
                    <div class="event-detail">
                        ${ev.author ? `<span>✍️ ${this.escapeHtml(ev.author)}</span>` : ''}
                        ${ev.patron ? `<span>👤 ${this.escapeHtml(ev.patron)}</span>` : ''}
                        <span>📅 Due: ${ev.dueDate}</span>
                    </div>
                </div>
            `;
        });
        
        html += `</div>`;
        container.innerHTML = html;
    }
    
    formatDisplayDate(ymd) {
        const [y, m, d] = ymd.split('-');
        const dateObj = new Date(y, m - 1, d);
        return dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    }
    
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    async prevMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        await this.renderCalendar();
        
        const monthStr = String(this.currentDate.getMonth() + 1).padStart(2, '0');
        if (this.selectedDateStr && this.selectedDateStr.startsWith(`${this.currentDate.getFullYear()}-${monthStr}`)) {
            await this.onDateSelect(this.selectedDateStr);
        } else {
            const container = document.getElementById("eventsListContainer");
            if (container) {
                container.innerHTML = `
                    <div class="notif-empty">
                        <div class="notif-empty-icon">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.5"/>
                                <path d="M16 2V6M8 2V6M3 10H21M8 14H10M12 14H14M8 17H10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                            </svg>
                        </div>
                        <p>Select a date</p>
                        <span>Click any calendar day to see details</span>
                    </div>
                `;
                const eventsCountBadge = document.getElementById("eventsCount");
                if (eventsCountBadge) eventsCountBadge.innerText = "0";
            }
        }
    }
    
    async nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        await this.renderCalendar();
        
        const monthStr = String(this.currentDate.getMonth() + 1).padStart(2, '0');
        if (this.selectedDateStr && this.selectedDateStr.startsWith(`${this.currentDate.getFullYear()}-${monthStr}`)) {
            await this.onDateSelect(this.selectedDateStr);
        } else {
            const container = document.getElementById("eventsListContainer");
            if (container) {
                container.innerHTML = `
                    <div class="notif-empty">
                        <div class="notif-empty-icon">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.5"/>
                                <path d="M16 2V6M8 2V6M3 10H21M8 14H10M12 14H14M8 17H10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                            </svg>
                        </div>
                        <p>Select a date</p>
                        <span>Click any calendar day to see details</span>
                    </div>
                `;
                const eventsCountBadge = document.getElementById("eventsCount");
                if (eventsCountBadge) eventsCountBadge.innerText = "0";
            }
        }
    }
    
    async init() {
        await this.renderCalendar();
        
        const today = new Date();
        await this.onDateSelect(this.formatYMD(today));
        
        const prevBtn = document.getElementById("prevMonthBtn");
        const nextBtn = document.getElementById("nextMonthBtn");
        
        if (prevBtn) {
            prevBtn.removeEventListener("click", this.prevMonth);
            prevBtn.addEventListener("click", () => this.prevMonth());
        }
        if (nextBtn) {
            nextBtn.removeEventListener("click", this.nextMonth);
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
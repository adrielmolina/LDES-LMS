// Dashboard functionality
document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard loaded');
    // Load dashboard stats immediately
    loadDashboardStats();
    
    // Refresh stats every 30 seconds
    setInterval(loadDashboardStats, 30000);
});

function loadDashboardStats() {
    console.log('Fetching dashboard stats...');
    
    fetch('/api/dashboard/stats')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Stats received:', data);
            
            if (data.success) {
                // Update the 3 stat cards
                const totalBooksEl = document.getElementById('totalBooksStat');
                const totalBorrowedEl = document.getElementById('totalBorrowedStat');
                const totalOverdueEl = document.getElementById('totalOverdueStat');
                
                if (totalBooksEl) totalBooksEl.textContent = data.data.total_books;
                if (totalBorrowedEl) totalBorrowedEl.textContent = data.data.total_borrowed;
                if (totalOverdueEl) totalOverdueEl.textContent = data.data.total_overdue;
                
                // Update trend texts for each card
                // Card 1: Total books trend
                const booksTrend = document.querySelector('.stat-card:first-child .stat-trend');
                if (booksTrend && data.data.weekly_new_books) {
                    booksTrend.innerHTML = `+${data.data.weekly_new_books} this week`;
                    booksTrend.className = 'stat-trend stat-trend--up';
                }
                
                // Card 2: Borrowed books trend  
                const borrowedTrend = document.querySelector('.stat-card:nth-child(2) .stat-trend');
                if (borrowedTrend) {
                    if (data.data.weekly_borrowed > 0) {
                        borrowedTrend.innerHTML = `+${data.data.weekly_borrowed} this week`;
                        borrowedTrend.className = 'stat-trend stat-trend--up';
                    } else {
                        borrowedTrend.innerHTML = 'No new borrows';
                        borrowedTrend.className = 'stat-trend';
                    }
                }
                
                // Card 3: Overdue books trend
                const overdueTrend = document.querySelector('.stat-card:nth-child(3) .stat-trend');
                if (overdueTrend && data.data.overdue_change) {
                    if (data.data.overdue_change > 0) {
                        overdueTrend.innerHTML = `+${data.data.overdue_change} overdue`;
                        overdueTrend.className = 'stat-trend stat-trend--up';
                    } else if (data.data.overdue_change < 0) {
                        overdueTrend.innerHTML = `${data.data.overdue_change} this week`;
                        overdueTrend.className = 'stat-trend stat-trend--down';
                    }
                }
            } else {
                console.error('Failed to load stats:', data.error);
                showStatsError();
            }
        })
        .catch(error => {
            console.error('Error loading dashboard stats:', error);
            showStatsError();
        });
}

function showStatsError() {
    // Show error indicators on stats
    const totalBooksEl = document.getElementById('totalBooksStat');
    const totalBorrowedEl = document.getElementById('totalBorrowedStat');
    const totalOverdueEl = document.getElementById('totalOverdueStat');
    
    if (totalBooksEl) totalBooksEl.textContent = 'Error';
    if (totalBorrowedEl) totalBorrowedEl.textContent = 'Error';
    if (totalOverdueEl) totalOverdueEl.textContent = 'Error';
    
    console.log('Failed to load dashboard data. Check API endpoint.');
}
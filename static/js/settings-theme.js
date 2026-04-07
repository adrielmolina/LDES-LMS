// Theme Manager
class ThemeManager {
    constructor() {
        this.themeKey = 'app_theme';
        this.currentTheme = localStorage.getItem(this.themeKey) || 'light';
        this.init();
    }

    init() {
        this.applyTheme(this.currentTheme);
        this.setupThemeListener();
    }

    applyTheme(theme) {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark-mode');
        } else {
            document.documentElement.classList.remove('dark-mode');
        }
        this.currentTheme = theme;
        localStorage.setItem(this.themeKey, theme);
        console.log('Theme set to:', theme); // Debug
    }

    setupThemeListener() {
        // Try to find the theme select element
        const themeSelect = document.getElementById('theme-select');
        if (themeSelect) {
            console.log('Theme select found!');
            themeSelect.value = this.currentTheme === 'dark' ? 'Dark' : 'Light';
            themeSelect.addEventListener('change', (e) => {
                const selectedTheme = e.target.value.toLowerCase();
                this.applyTheme(selectedTheme);
            });
        } else {
            console.log('Theme select not found yet, will retry...');
            // Retry after a short delay
            setTimeout(() => this.setupThemeListener(), 500);
        }
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.themeManager = new ThemeManager();
    });
} else {
    window.themeManager = new ThemeManager();
}
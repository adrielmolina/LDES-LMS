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
    }

    setupThemeListener() {
        const themeSelect = document.getElementById('theme-select');
        if (themeSelect) {
            themeSelect.value = this.currentTheme; // ← fix here
            themeSelect.addEventListener('change', (e) => {
                this.applyTheme(e.target.value);
            });
        } else {
            setTimeout(() => this.setupThemeListener(), 500);
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.themeManager = new ThemeManager();
    });
} else {
    window.themeManager = new ThemeManager();
}
// Font Settings Manager
class FontManager {
    constructor() {
        this.fontKey = 'app_font_style';
        this.sizeKey = 'app_font_size';
        this.currentFont = localStorage.getItem(this.fontKey) || 'sans-serif';
        this.currentSize = localStorage.getItem(this.sizeKey) || 'medium';
        this.init();
    }

    init() {
        this.applyFontSettings();
        this.setupFontListeners();
    }

    applyFontSettings() {
        // Apply font style
        this.applyFontStyle(this.currentFont);
        
        // Apply font size
        this.applyFontSize(this.currentSize);
    }

    applyFontStyle(style) {
        const fontMap = {
            'sans-serif': "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            'serif': "Georgia, 'Times New Roman', serif",
            'monospace': "'Courier New', monospace"
        };
        
        document.body.style.fontFamily = fontMap[style] || fontMap['sans-serif'];
        this.currentFont = style;
        localStorage.setItem(this.fontKey, style);
    }

    applyFontSize(size) {
        const sizeMap = {
            'small': '14px',
            'medium': '16px',
            'large': '18px'
        };
        
        document.body.style.fontSize = sizeMap[size] || sizeMap['medium'];
        this.currentSize = size;
        localStorage.setItem(this.sizeKey, size);
    }

    setupFontListeners() {
        // Check for font select elements periodically
        const checkForSelects = setInterval(() => {
            const fontStyleSelect = document.getElementById('font-style-select');
            const fontSizeSelect = document.getElementById('font-size-select');
            
            if (fontStyleSelect) {
                fontStyleSelect.value = this.currentFont;
                fontStyleSelect.addEventListener('change', (e) => {
                    this.applyFontStyle(e.target.value);
                });
            }
            
            if (fontSizeSelect) {
                fontSizeSelect.value = this.currentSize;
                fontSizeSelect.addEventListener('change', (e) => {
                    this.applyFontSize(e.target.value);
                });
            }
            
            if (fontStyleSelect && fontSizeSelect) {
                clearInterval(checkForSelects);
            }
        }, 100);
    }
}

// Initialize font manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.fontManager = new FontManager();
});
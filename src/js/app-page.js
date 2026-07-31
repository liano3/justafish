function updateThemeToggle(isDark) {
    var toggle = document.querySelector('.theme-toggle');
    if (!toggle) return;
    toggle.setAttribute('aria-pressed', isDark.toString());
    toggle.setAttribute('aria-label', t(isDark ? 'themeToLight' : 'themeToDark'));
    toggle.title = toggle.getAttribute('aria-label');
    toggle.querySelector('.sun-icon').style.display = isDark ? 'block' : 'none';
    toggle.querySelector('.moon-icon').style.display = isDark ? 'none' : 'block';
}

function applyTheme(isDark) {
    if (isDark) document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.removeAttribute('data-theme');
    updateThemeToggle(isDark);
}

window.toggleTheme = function() {
    var isDark = document.documentElement.getAttribute('data-theme') !== 'dark';
    applyTheme(isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
};

function initApp() {
    if (window.APP_ID === 'pomodoro') {
        initPomodoro();
    } else if (window.APP_ID === 'random-picker') {
        initRandomPicker();
    } else if (window.APP_ID === 'countdown') {
        initCountdown();
    } else if (window.APP_ID === 'memory') {
        initMemoryGame();
    } else if (window.APP_ID === 'schulte') {
        initSchulte();
    } else if (window.APP_ID === '2048') {
        initGame2048();
    }
}

applyTheme(document.documentElement.getAttribute('data-theme') === 'dark');
initApp();

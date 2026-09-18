function applyTheme(isDark) {
    if (isDark) document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.removeAttribute('data-theme');
    var toggle = document.querySelector('.theme-toggle');
    var label = t(isDark ? 'themeToLight' : 'themeToDark');
    toggle.setAttribute('aria-pressed', String(isDark));
    toggle.setAttribute('aria-label', label);
    toggle.title = label;
}

function toggleTheme() {
    var isDark = document.documentElement.getAttribute('data-theme') !== 'dark';
    applyTheme(isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

function initTheme() {
    applyTheme(document.documentElement.getAttribute('data-theme') === 'dark');
    document.querySelector('.theme-toggle').addEventListener('click', toggleTheme);
}

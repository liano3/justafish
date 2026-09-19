function applyTheme(isDark) {
    if (isDark) document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.removeAttribute('data-theme');
    const toggle = document.querySelector('.theme-toggle');
    const label = t(isDark ? 'themeToLight' : 'themeToDark');
    toggle.setAttribute('aria-pressed', String(isDark));
    toggle.setAttribute('aria-label', label);
    toggle.title = label;
}

function toggleTheme() {
    const isDark = document.documentElement.getAttribute('data-theme') !== 'dark';
    applyTheme(isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

function initTheme() {
    applyTheme(document.documentElement.getAttribute('data-theme') === 'dark');
    document.querySelector('.theme-toggle').addEventListener('click', toggleTheme);
}

function applyTheme(isDark) {
    if (isDark) document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.removeAttribute('data-theme');
    var toggle = document.querySelector('.theme-toggle');
    if (!toggle) return;
    var label = t(isDark ? 'themeToLight' : 'themeToDark');
    toggle.setAttribute('aria-pressed', String(isDark));
    toggle.setAttribute('aria-label', label);
    toggle.title = label;
    toggle.querySelector('.sun-icon').style.display = isDark ? 'block' : 'none';
    toggle.querySelector('.moon-icon').style.display = isDark ? 'none' : 'block';
}

window.toggleTheme = function() {
    var isDark = document.documentElement.getAttribute('data-theme') !== 'dark';
    applyTheme(isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
};

function initTheme() {
    applyTheme(document.documentElement.getAttribute('data-theme') === 'dark');
}

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
    if (window.APP_ID === 'clock') {
        initClock({ faceId: 'analogFace', hourId: 'analogHour', minuteId: 'analogMinute', secondId: 'analogSecond', digitalClockId: 'digitalClock', digitalDateId: 'digitalDate', faceSize: 200, numberRadius: 73, startImmediately: true });
    } else if (window.APP_ID === 'pomodoro') {
        initPomodoro({ timerId: 'pomodoroTimer', statusId: 'pomodoroStatus', progressId: 'pomodoroProgress', startBtnId: 'pomodoroStart', resetBtnId: 'pomodoroReset', countId: 'pomodoroCount', totalId: 'pomodoroTotal', workInputId: 'pomodoroWork', breakInputId: 'pomodoroBreak', soundToggleId: 'pomodoroSound', previewBtnId: 'pomodoroPreview', toastId: 'pomodoroToast', toastMessageId: 'pomodoroToastMessage', toastDetailId: 'pomodoroToastDetail', toastCloseId: 'pomodoroToastClose', circleRadius: 85 });
    } else if (window.APP_ID === 'schulte') {
        initSchulte({ gridId: 'schulteGrid', timeId: 'schulteTime', bestId: 'schulteBest', overlayId: 'schulteOverlay', restartBtnId: 'schulteRestart', usePerformanceNow: true, bestPlaceholder: '-' });
    } else if (window.APP_ID === '2048') {
        initGame2048();
    }
}

applyTheme(document.documentElement.getAttribute('data-theme') === 'dark');
initApp();

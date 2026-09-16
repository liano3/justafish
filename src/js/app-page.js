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

initTheme();
initApp();

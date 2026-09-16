const APPS = [
    { id: 'pomodoro', icon: 'clock', title: 'POMODORO', description: 'POMODORO_DESCRIPTION', css: 'pomodoro.css', js: ['pomodoro.js'], runtime: ['dateLocale', 'pomodoroFocusRunning', 'pomodoroFocusReady', 'pomodoroBreakRunning', 'pomodoroBreakReady', 'pomodoroWorkComplete', 'pomodoroBreakComplete', 'pomodoroPreviewSoundOn', 'pomodoroPreviewSoundOff', 'pomodoroAutoBreak', 'pomodoroAutoFocus', 'pomodoroReminderTitle', 'continue', 'pause', 'start'] },
    { id: 'random-picker', icon: 'rotate-ccw', title: 'RANDOM_PICKER', description: 'RANDOM_PICKER_DESCRIPTION', css: 'random-picker.css', js: ['random-picker.js'], runtime: ['randomPickerEmpty', 'randomPickerCount', 'randomPickerHistoryEmpty', 'randomPickerDrawing', 'randomPickerDone'] },
    { id: 'countdown', icon: 'calendar', title: 'COUNTDOWN', description: 'COUNTDOWN_DESCRIPTION', css: 'countdown.css', js: ['countdown.js'], runtime: ['dateLocale', 'countdownToday', 'countdownFuture', 'countdownPast', 'countdownDurationYear', 'countdownDurationMonth', 'countdownDurationDay', 'countdownEmpty', 'anniversaryEmpty', 'countdownInvalid', 'countdownDeleteLabel', 'anniversaryNext', 'anniversaryToday'] },
    { id: 'memory', icon: 'grid', title: 'MEMORY_GAME', description: 'MEMORY_GAME_DESCRIPTION', css: 'memory.css', js: ['memory.js'], runtime: ['memoryCardHidden', 'memoryCardRevealed', 'memoryCardMatched', 'memoryComplete', 'memoryReady'] },
    { id: 'schulte', icon: 'table', title: 'SCHULTE', description: 'SCHULTE_DESCRIPTION', css: 'schulte.css', js: ['schulte.js'], runtime: [] },
    { id: '2048', icon: 'grid', title: 'GAME_2048', description: 'GAME_2048_DESCRIPTION', css: 'game2048.css', js: ['vendor/2048-core.js', 'game2048.js'], runtime: ['gameOver', 'gameWon'] }
];

module.exports = { APPS };

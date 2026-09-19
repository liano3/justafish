const APPS = [
    { id: 'random-picker', init: 'initRandomPicker', contentWidth: 'wide', icon: 'rotate-ccw', title: 'RANDOM_PICKER', description: 'RANDOM_PICKER_DESCRIPTION', css: 'random-picker.css', js: ['random-picker.js'], runtime: ['randomPickerEmpty', 'randomPickerCount', 'randomPickerHistoryEmpty', 'randomPickerDrawing', 'randomPickerDone'] },
    { id: 'countdown', init: 'initCountdown', contentWidth: 'wide', icon: 'calendar', title: 'COUNTDOWN', description: 'COUNTDOWN_DESCRIPTION', css: 'countdown.css', js: ['countdown.js'], runtime: ['dateLocale', 'countdownToday', 'countdownFuture', 'countdownDurationYear', 'countdownDurationMonth', 'countdownDurationDay', 'countdownEmpty', 'anniversaryEmpty', 'countdownInvalid', 'countdownInvalidDate', 'countdownDeleteLabel'] },
    { id: 'schulte', init: 'initSchulte', icon: 'table', title: 'SCHULTE', description: 'SCHULTE_DESCRIPTION', css: 'schulte.css', js: ['schulte.js'], runtime: [] },
    { id: '2048', init: 'initGame2048', icon: 'grid', title: 'GAME_2048', description: 'GAME_2048_DESCRIPTION', css: 'game2048.css', js: ['vendor/2048-core.js', 'game2048.js'], runtime: ['gameOver', 'gameWon'] }
];

module.exports = { APPS };

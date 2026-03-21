window.switchPage = function(pageId) {
    document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
    $(pageId).classList.add('active');
    document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(function(link) {
        link.classList.toggle('active', link.dataset.page === pageId);
    });
    window.scrollTo(0, 0);
};

window.toggleTheme = function() {
    var html = document.documentElement;
    var isDark = html.getAttribute('data-theme') === 'dark';
    html.setAttribute('data-theme', isDark ? '' : 'dark');
    localStorage.setItem('theme', isDark ? 'light' : 'dark');
    document.querySelector('.sun-icon').style.display = isDark ? 'block' : 'none';
    document.querySelector('.moon-icon').style.display = isDark ? 'none' : 'block';
};

function initTheme() {
    var saved = localStorage.getItem('theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (saved === 'dark' || (!saved && prefersDark)) {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.querySelector('.sun-icon').style.display = 'none';
        document.querySelector('.moon-icon').style.display = 'block';
    }
}

window.toggleCategory = function(header) {
    header.querySelector('.category-toggle').classList.toggle('expanded');
    header.nextElementSibling.classList.toggle('show');
};

function initModernClock() {
    initClock({
        faceId: 'analogFace',
        hourId: 'analogHour',
        minuteId: 'analogMinute',
        secondId: 'analogSecond',
        digitalClockId: 'digitalClock',
        digitalDateId: 'digitalDate',
        faceSize: 200,
        showNumbers: false,
        markOrigin: 97,
        startImmediately: true
    });
}

function initModernPomodoro() {
    initPomodoro({
        timerId: 'pomodoroTimer',
        statusId: 'pomodoroStatus',
        progressId: 'pomodoroProgress',
        startBtnId: 'pomodoroStart',
        resetBtnId: 'pomodoroReset',
        countId: 'pomodoroCount',
        totalId: 'pomodoroTotal',
        workInputId: 'pomodoroWork',
        breakInputId: 'pomodoroBreak',
        circleRadius: 85
    });
}

function initModernSchulte() {
    initSchulte({
        gridId: 'schulteGrid',
        timeId: 'schulteTime',
        bestId: 'schulteBest',
        overlayId: 'schulteOverlay',
        restartBtnId: 'schulteRestart',
        usePerformanceNow: true,
        bestPlaceholder: '-',
        exposeAs: 'initSchulte'
    });
}

initTheme();
initModernClock();
initModernPomodoro();
initModernSchulte();

$('switchToOcean').addEventListener('click', function(e) {
    e.preventDefault();
    localStorage.setItem('preferredMode', 'ocean');
    window.location.href = 'index.html';
});

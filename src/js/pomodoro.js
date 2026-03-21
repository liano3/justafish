function initPomodoro(opts) {
    var timerDisplay = $(opts.timerId);
    var statusDisplay = $(opts.statusId);
    var progressBar = $(opts.progressId);
    var startBtn = $(opts.startBtnId);
    var resetBtn = $(opts.resetBtnId);
    var countDisplay = $(opts.countId);
    var totalDisplay = $(opts.totalId);
    var workInput = $(opts.workInputId);
    var breakInput = $(opts.breakInputId);
    var circleRadius = opts.circleRadius || 90;
    var circumference = 2 * Math.PI * circleRadius;

    var isRunning = false;
    var isWork = true;
    var timeLeft = 25 * 60;
    var totalTime = 25 * 60;
    var pomodoroRAF = null;
    var lastUpdate = 0;
    var completedCount = parseInt(localStorage.getItem('pomodoroCount') || '0');
    var totalMinutes = parseInt(localStorage.getItem('pomodoroTotal') || '0');

    countDisplay.textContent = completedCount;
    totalDisplay.textContent = totalMinutes;

    function updateDisplay() {
        timerDisplay.textContent = formatTime(timeLeft);
        var progress = timeLeft / totalTime;
        progressBar.style.strokeDashoffset = circumference * (1 - progress);
    }

    function updateStatus() {
        statusDisplay.textContent = isWork ? (isRunning ? '专注中...' : '准备专注') : (isRunning ? '休息中...' : '准备休息');
    }

    function switchMode() {
        if (isWork) {
            isWork = false;
            totalTime = parseInt(breakInput.value) * 60;
            timeLeft = totalTime;
            completedCount++;
            totalMinutes += parseInt(workInput.value);
            localStorage.setItem('pomodoroCount', completedCount.toString());
            localStorage.setItem('pomodoroTotal', totalMinutes.toString());
            countDisplay.textContent = completedCount;
            totalDisplay.textContent = totalMinutes;
        } else {
            isWork = true;
            totalTime = parseInt(workInput.value) * 60;
            timeLeft = totalTime;
        }
        updateDisplay();
        updateStatus();
    }

    function tick(timestamp) {
        if (!isRunning) return;
        if (timestamp - lastUpdate >= 1000) {
            lastUpdate = timestamp;
            timeLeft--;
            updateDisplay();
            if (timeLeft <= 0) switchMode();
        }
        pomodoroRAF = requestAnimationFrame(tick);
    }

    function start() {
        if (isRunning) {
            isRunning = false;
            startBtn.textContent = '继续';
            if (pomodoroRAF) cancelAnimationFrame(pomodoroRAF);
        } else {
            isRunning = true;
            startBtn.textContent = '暂停';
            lastUpdate = performance.now();
            pomodoroRAF = requestAnimationFrame(tick);
        }
        updateStatus();
    }

    function reset() {
        isRunning = false;
        if (pomodoroRAF) cancelAnimationFrame(pomodoroRAF);
        isWork = true;
        totalTime = parseInt(workInput.value) * 60;
        timeLeft = totalTime;
        startBtn.textContent = '开始';
        updateDisplay();
        updateStatus();
    }

    updateDisplay();
    updateStatus();

    if (opts.bindEvents !== false) {
        startBtn.addEventListener('click', start);
        resetBtn.addEventListener('click', reset);
        workInput.addEventListener('change', function() {
            if (!isRunning && isWork) {
                totalTime = parseInt(workInput.value) * 60;
                timeLeft = totalTime;
                updateDisplay();
            }
        });
        breakInput.addEventListener('change', function() {
            if (!isRunning && !isWork) {
                totalTime = parseInt(breakInput.value) * 60;
                timeLeft = totalTime;
                updateDisplay();
            }
        });
    }

    // Expose for window-level access if needed
    if (opts.exposeAs) {
        window[opts.exposeAs + 'Toggle'] = start;
        window[opts.exposeAs + 'Reset'] = reset;
    }

    return { start: start, reset: reset };
}

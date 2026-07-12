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
    var soundToggle = $(opts.soundToggleId);
    var previewBtn = $(opts.previewBtnId);
    var toast = $(opts.toastId);
    var toastMessage = $(opts.toastMessageId);
    var toastDetail = $(opts.toastDetailId);
    var toastClose = $(opts.toastCloseId);
    var circleRadius = opts.circleRadius || 90;
    var circumference = 2 * Math.PI * circleRadius;
    var originalTitle = document.title;

    var isRunning = false;
    var isWork = true;
    var timeLeft = 25 * 60;
    var totalTime = 25 * 60;
    var deadline = 0;
    var displayInterval = null;
    var completionTimeout = null;
    var toastTimer = null;
    var toastTransitionTimer = null;
    var titleTimer = null;
    var audioContext = null;
    var completedCount = parseInt(localStorage.getItem('pomodoroCount') || '0');
    var totalMinutes = parseInt(localStorage.getItem('pomodoroTotal') || '0');

    function readMinutes(input, fallback) {
        var parsed = parseInt(input.value);
        var min = parseInt(input.min) || 1;
        var max = parseInt(input.max) || 60;
        if (isNaN(parsed)) parsed = fallback;
        parsed = Math.min(max, Math.max(min, parsed));
        input.value = parsed;
        return parsed;
    }

    function updateDisplay() {
        timerDisplay.textContent = formatTime(timeLeft);
        var progress = totalTime > 0 ? timeLeft / totalTime : 0;
        progressBar.style.strokeDashoffset = circumference * (1 - progress);
    }

    function updateStatus() {
        statusDisplay.textContent = isWork ? (isRunning ? '专注中...' : '准备专注') : (isRunning ? '休息中...' : '准备休息');
    }

    function restoreTitle() {
        if (titleTimer) clearTimeout(titleTimer);
        titleTimer = null;
        document.title = originalTitle;
    }

    function showToast(message, detail) {
        if (toastTimer) clearTimeout(toastTimer);
        if (toastTransitionTimer) clearTimeout(toastTransitionTimer);
        toastMessage.textContent = message;
        toastDetail.textContent = detail;
        toast.hidden = false;
        requestAnimationFrame(function() {
            toast.classList.add('is-visible');
        });
        toastTimer = setTimeout(hideToast, 10000);
    }

    function hideToast() {
        if (toastTimer) clearTimeout(toastTimer);
        toastTimer = null;
        toast.classList.remove('is-visible');
        toastTransitionTimer = setTimeout(function() {
            toast.hidden = true;
        }, 200);
    }

    function getAudioContext() {
        if (audioContext) return audioContext;
        var AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return null;
        audioContext = new AudioContext();
        return audioContext;
    }

    function scheduleChime(context) {
        var notes = [880, 1046.5, 1318.5];
        var startAt = context.currentTime + 0.03;
        notes.forEach(function(frequency, index) {
            var oscillator = context.createOscillator();
            var gain = context.createGain();
            var noteStart = startAt + index * 0.2;
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(frequency, noteStart);
            gain.gain.setValueAtTime(0.0001, noteStart);
            gain.gain.exponentialRampToValueAtTime(0.16, noteStart + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.17);
            oscillator.connect(gain);
            gain.connect(context.destination);
            oscillator.start(noteStart);
            oscillator.stop(noteStart + 0.18);
        });
    }

    function playChime() {
        if (!soundToggle.checked) return;
        var context = getAudioContext();
        if (!context) return;
        if (context.state === 'suspended') {
            context.resume().then(function() {
                scheduleChime(context);
            }).catch(function() {});
        } else {
            scheduleChime(context);
        }
    }

    function unlockAudio() {
        if (!soundToggle.checked) return;
        var context = getAudioContext();
        if (context && context.state === 'suspended') context.resume().catch(function() {});
    }

    function triggerReminder(completedWork, isPreview) {
        var message = completedWork ? '专注完成，休息一下' : '休息结束，开始专注';
        var detail;
        if (isPreview) {
            detail = soundToggle.checked ? '提醒声音正常，到点会自动提示' : '声音已关闭，到点仍会显示页面提醒';
        } else {
            detail = completedWork ? '已自动进入休息计时' : '已自动开始下一轮专注';
        }

        playChime();
        showToast(message, detail);
        if (navigator.vibrate) navigator.vibrate([180, 100, 180]);
        if (document.hidden) {
            document.title = '提醒：' + message;
            if (titleTimer) clearTimeout(titleTimer);
            titleTimer = setTimeout(restoreTitle, 30000);
        }
    }

    function clearTimerHandles() {
        if (displayInterval) clearInterval(displayInterval);
        if (completionTimeout) clearTimeout(completionTimeout);
        displayInterval = null;
        completionTimeout = null;
    }

    function remainingSeconds() {
        return Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
    }

    function switchMode() {
        if (isWork) {
            isWork = false;
            totalTime = readMinutes(breakInput, 5) * 60;
            timeLeft = totalTime;
            completedCount++;
            totalMinutes += readMinutes(workInput, 25);
            localStorage.setItem('pomodoroCount', completedCount.toString());
            localStorage.setItem('pomodoroTotal', totalMinutes.toString());
            countDisplay.textContent = completedCount;
            totalDisplay.textContent = totalMinutes;
        } else {
            isWork = true;
            totalTime = readMinutes(workInput, 25) * 60;
            timeLeft = totalTime;
        }
        updateDisplay();
        updateStatus();
    }

    function completePeriod() {
        if (!isRunning) return;
        clearTimerHandles();
        timeLeft = 0;
        updateDisplay();
        var completedWork = isWork;
        switchMode();
        triggerReminder(completedWork, false);
        scheduleTimer();
    }

    function syncTimer() {
        var nextTimeLeft = remainingSeconds();
        if (nextTimeLeft <= 0) {
            completePeriod();
            return;
        }
        if (nextTimeLeft !== timeLeft) {
            timeLeft = nextTimeLeft;
            updateDisplay();
        }
    }

    function scheduleTimer() {
        clearTimerHandles();
        deadline = Date.now() + timeLeft * 1000;
        displayInterval = setInterval(syncTimer, 250);
        completionTimeout = setTimeout(completePeriod, timeLeft * 1000);
    }

    function start() {
        if (isRunning) {
            timeLeft = remainingSeconds();
            if (timeLeft <= 0) {
                completePeriod();
                return;
            }
            isRunning = false;
            clearTimerHandles();
            startBtn.textContent = '继续';
            updateDisplay();
        } else {
            isRunning = true;
            startBtn.textContent = '暂停';
            unlockAudio();
            scheduleTimer();
        }
        updateStatus();
    }

    function reset() {
        isRunning = false;
        clearTimerHandles();
        isWork = true;
        totalTime = readMinutes(workInput, 25) * 60;
        timeLeft = totalTime;
        startBtn.textContent = '开始';
        updateDisplay();
        updateStatus();
    }

    function preview(mode) {
        unlockAudio();
        triggerReminder(mode ? mode !== 'break' : isWork, true);
    }

    completedCount = isNaN(completedCount) ? 0 : completedCount;
    totalMinutes = isNaN(totalMinutes) ? 0 : totalMinutes;
    countDisplay.textContent = completedCount;
    totalDisplay.textContent = totalMinutes;
    soundToggle.checked = localStorage.getItem('pomodoroSoundEnabled') !== 'false';
    updateDisplay();
    updateStatus();

    if (opts.bindEvents !== false) {
        startBtn.addEventListener('click', start);
        resetBtn.addEventListener('click', reset);
        previewBtn.addEventListener('click', function() { preview(); });
        toastClose.addEventListener('click', hideToast);
        soundToggle.addEventListener('change', function() {
            localStorage.setItem('pomodoroSoundEnabled', soundToggle.checked.toString());
            if (soundToggle.checked) unlockAudio();
        });
        workInput.addEventListener('change', function() {
            if (!isRunning && isWork) {
                totalTime = readMinutes(workInput, 25) * 60;
                timeLeft = totalTime;
                updateDisplay();
            }
        });
        breakInput.addEventListener('change', function() {
            if (!isRunning && !isWork) {
                totalTime = readMinutes(breakInput, 5) * 60;
                timeLeft = totalTime;
                updateDisplay();
            }
        });
        document.addEventListener('visibilitychange', function() {
            if (!document.hidden) restoreTitle();
        });
        window.addEventListener('focus', restoreTitle);
    }

    if (opts.exposeAs) {
        window[opts.exposeAs + 'Toggle'] = start;
        window[opts.exposeAs + 'Reset'] = reset;
        window[opts.exposeAs + 'Preview'] = preview;
    }

    return { start: start, reset: reset, preview: preview };
}

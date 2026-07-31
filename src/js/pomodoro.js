function initPomodoro() {
    var currentTimeDisplay = $('pomodoroCurrentTime');
    var currentDateDisplay = $('pomodoroCurrentDate');
    var timerDisplay = $('pomodoroTimer');
    var statusDisplay = $('pomodoroStatus');
    var progressBar = $('pomodoroProgress');
    var startBtn = $('pomodoroStart');
    var resetBtn = $('pomodoroReset');
    var countDisplay = $('pomodoroCount');
    var totalDisplay = $('pomodoroTotal');
    var workInput = $('pomodoroWork');
    var breakInput = $('pomodoroBreak');
    var soundToggle = $('pomodoroSound');
    var previewBtn = $('pomodoroPreview');
    var toast = $('pomodoroToast');
    var toastMessage = $('pomodoroToastMessage');
    var toastDetail = $('pomodoroToastDetail');
    var toastClose = $('pomodoroToastClose');
    var circumference = 2 * Math.PI * 85;
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

    function updateCurrentDateTime() {
        var now = new Date();
        currentTimeDisplay.textContent = [now.getHours(), now.getMinutes(), now.getSeconds()]
            .map(function(value) { return String(value).padStart(2, '0'); })
            .join(':');
        currentTimeDisplay.dateTime = now.toISOString();
        currentDateDisplay.textContent = new Intl.DateTimeFormat(t('dateLocale'), {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        }).format(now);
    }

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
        statusDisplay.textContent = isWork
            ? (isRunning ? t('pomodoroFocusRunning') : t('pomodoroFocusReady'))
            : (isRunning ? t('pomodoroBreakRunning') : t('pomodoroBreakReady'));
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
        var message = completedWork ? t('pomodoroWorkComplete') : t('pomodoroBreakComplete');
        var detail;
        if (isPreview) {
            detail = soundToggle.checked ? t('pomodoroPreviewSoundOn') : t('pomodoroPreviewSoundOff');
        } else {
            detail = completedWork ? t('pomodoroAutoBreak') : t('pomodoroAutoFocus');
        }

        playChime();
        showToast(message, detail);
        if (navigator.vibrate) navigator.vibrate([180, 100, 180]);
        if (document.hidden) {
            document.title = t('pomodoroReminderTitle', { message: message });
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
            var completedMinutes = totalTime / 60;
            isWork = false;
            totalTime = readMinutes(breakInput, 5) * 60;
            timeLeft = totalTime;
            completedCount++;
            totalMinutes += completedMinutes;
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
            startBtn.textContent = t('continue');
            updateDisplay();
        } else {
            isRunning = true;
            startBtn.textContent = t('pause');
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
        startBtn.textContent = t('start');
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
    updateCurrentDateTime();
    setInterval(updateCurrentDateTime, 1000);
    updateDisplay();
    updateStatus();

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

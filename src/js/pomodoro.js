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
    var toastTimer = null;
    var toastTransitionTimer = null;
    var titleTimer = null;
    var audioContext = null;
    var completedCount = parseInt(localStorage.getItem('pomodoroCount') || '0');
    var totalMinutes = parseInt(localStorage.getItem('pomodoroTotal') || '0');
    var stateKey = 'pomodoroState';

    function saveState() {
        localStorage.setItem(stateKey, JSON.stringify({
            isRunning: isRunning, isWork: isWork, timeLeft: timeLeft,
            totalTime: totalTime, deadline: deadline,
            workMinutes: readMinutes(workInput, 25), breakMinutes: readMinutes(breakInput, 5)
        }));
    }

    function restoreState() {
        clearTimerHandles();
        try {
            var state = JSON.parse(localStorage.getItem(stateKey) || 'null');
            if (!state || typeof state.isRunning !== 'boolean' || typeof state.isWork !== 'boolean'
                || !Number.isFinite(state.totalTime) || state.totalTime < 60 || state.totalTime > 3600
                || !Number.isFinite(state.timeLeft) || state.timeLeft < 0 || state.timeLeft > state.totalTime
                || (state.isRunning && (!Number.isFinite(state.deadline) || state.deadline <= 0))) return;
            workInput.value = state.workMinutes;
            breakInput.value = state.breakMinutes;
            readMinutes(workInput, 25);
            readMinutes(breakInput, 5);
            isRunning = state.isRunning;
            isWork = state.isWork;
            timeLeft = state.timeLeft;
            totalTime = state.totalTime;
            deadline = state.deadline;
            completedCount = parseInt(localStorage.getItem('pomodoroCount')) || 0;
            totalMinutes = parseInt(localStorage.getItem('pomodoroTotal')) || 0;
            if (isRunning) {
                syncTimer();
                displayInterval = setInterval(syncTimer, 250);
            }
            updateDisplay();
            updateStatus();
        } catch (error) {
            localStorage.removeItem(stateKey);
        }
    }

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
        startBtn.textContent = isRunning ? t('pause') : (timeLeft < totalTime ? t('continue') : t('start'));
        countDisplay.textContent = completedCount;
        totalDisplay.textContent = totalMinutes;
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
        if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
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
        if (navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) {
            navigator.vibrate([180, 100, 180]);
        }
        if (document.hidden) {
            document.title = t('pomodoroReminderTitle', { message: message });
            if (titleTimer) clearTimeout(titleTimer);
            titleTimer = setTimeout(restoreTitle, 30000);
        }
    }

    function clearTimerHandles() {
        if (displayInterval) clearInterval(displayInterval);
        displayInterval = null;
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
        } else {
            isWork = true;
            totalTime = readMinutes(workInput, 25) * 60;
            timeLeft = totalTime;
        }
    }

    function syncTimer() {
        if (!isRunning) return;
        var now = Date.now();
        var completed = false;
        while (deadline <= now) {
            switchMode();
            deadline += totalTime * 1000;
            completed = true;
            // Skip whole focus/break cycles when restoring after a long absence.
            var cycle = (readMinutes(workInput, 25) + readMinutes(breakInput, 5)) * 60000;
            var cycles = Math.max(0, Math.floor((now - deadline) / cycle));
            if (cycles) {
                deadline += cycles * cycle;
                completedCount += cycles;
                totalMinutes += cycles * readMinutes(workInput, 25);
            }
        }
        var nextTimeLeft = remainingSeconds();
        if (completed || nextTimeLeft !== timeLeft) {
            timeLeft = nextTimeLeft;
            updateDisplay();
        }
        if (completed) {
            localStorage.setItem('pomodoroCount', String(completedCount));
            localStorage.setItem('pomodoroTotal', String(totalMinutes));
            saveState();
            updateStatus();
            triggerReminder(!isWork, false);
        }
    }

    function scheduleTimer() {
        clearTimerHandles();
        deadline = Date.now() + timeLeft * 1000;
        displayInterval = setInterval(syncTimer, 250);
    }

    function start() {
        if (isRunning) {
            syncTimer();
            timeLeft = remainingSeconds();
            isRunning = false;
            clearTimerHandles();
            updateDisplay();
        } else {
            isRunning = true;
            unlockAudio();
            scheduleTimer();
        }
        saveState();
        updateStatus();
    }

    function reset() {
        isRunning = false;
        clearTimerHandles();
        isWork = true;
        totalTime = readMinutes(workInput, 25) * 60;
        timeLeft = totalTime;
        saveState();
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
    restoreState();
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
        if (isRunning) syncTimer();
        readMinutes(workInput, 25);
        if (!isRunning && isWork) {
            totalTime = readMinutes(workInput, 25) * 60;
            timeLeft = totalTime;
            updateDisplay();
        }
        saveState();
        updateStatus();
    });
    breakInput.addEventListener('change', function() {
        if (isRunning) syncTimer();
        readMinutes(breakInput, 5);
        if (!isRunning && !isWork) {
            totalTime = readMinutes(breakInput, 5) * 60;
            timeLeft = totalTime;
            updateDisplay();
        }
        saveState();
        updateStatus();
    });
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            restoreTitle();
            syncTimer();
        }
    });
    window.addEventListener('focus', restoreTitle);
    window.addEventListener('pageshow', function(event) {
        if (event.persisted) restoreState();
    });
    window.addEventListener('storage', function(event) {
        if (event.key === stateKey) restoreState();
    });
}

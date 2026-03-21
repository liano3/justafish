function initSchulte(opts) {
    var grid = $(opts.gridId);
    var timeDisplay = $(opts.timeId);
    var bestDisplay = $(opts.bestId);
    var overlay = $(opts.overlayId);
    var restartBtn = $(opts.restartBtnId);
    var numbers = [], currentNum = 1, startTime = null, timerRAF = null, isRunning = false;
    var bestTime = localStorage.getItem('schulteBest') ? parseFloat(localStorage.getItem('schulteBest')) : null;
    var usePerformanceNow = opts.usePerformanceNow || false;

    function updateTimer() {
        if (isRunning) {
            var elapsed = usePerformanceNow
                ? (performance.now() - startTime) / 1000
                : (Date.now() - startTime) / 1000;
            timeDisplay.textContent = elapsed.toFixed(2);
            timerRAF = requestAnimationFrame(updateTimer);
        }
    }

    function stopTimer() {
        if (timerRAF) { cancelAnimationFrame(timerRAF); timerRAF = null; }
    }

    function createGrid() {
        grid.innerHTML = '';
        numbers = shuffle(Array.from({length: 25}, function(_, i) { return i + 1; }));
        currentNum = 1; startTime = null; isRunning = false;
        timeDisplay.textContent = '0.00';
        bestDisplay.textContent = bestTime ? bestTime.toFixed(2) + 's' : (opts.bestPlaceholder || '--');
        overlay.classList.remove('hidden');
        stopTimer();
        numbers.forEach(function(num) {
            var cell = document.createElement('div');
            cell.className = 'schulte-cell';
            cell.textContent = num;
            cell.addEventListener('click', function() {
                if (!isRunning) return;
                if (num === currentNum) {
                    cell.classList.add('correct');
                    currentNum++;
                    if (currentNum > 25) {
                        stopTimer();
                        isRunning = false;
                        var elapsed = usePerformanceNow
                            ? (performance.now() - startTime) / 1000
                            : (Date.now() - startTime) / 1000;
                        timeDisplay.textContent = elapsed.toFixed(2);
                        if (!bestTime || elapsed < bestTime) {
                            bestTime = elapsed;
                            localStorage.setItem('schulteBest', bestTime.toString());
                            bestDisplay.textContent = bestTime.toFixed(2) + 's';
                        }
                    }
                } else {
                    cell.classList.add('wrong');
                    setTimeout(function() { cell.classList.remove('wrong'); }, 300);
                }
            });
            grid.appendChild(cell);
        });
    }

    overlay.addEventListener('click', function() {
        if (!isRunning) {
            isRunning = true;
            startTime = usePerformanceNow ? performance.now() : Date.now();
            overlay.classList.add('hidden');
            timerRAF = requestAnimationFrame(updateTimer);
        }
    });

    if (restartBtn) {
        restartBtn.addEventListener('click', function(e) {
            if (e) e.stopPropagation();
            createGrid();
        });
    }

    // Expose for window-level access if needed
    if (opts.exposeAs) {
        window[opts.exposeAs] = createGrid;
    }

    createGrid();

    return { reset: createGrid };
}

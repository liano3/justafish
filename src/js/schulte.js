function initSchulte() {
    const grid = $('schulteGrid');
    const timeDisplay = $('schulteTime');
    const bestDisplay = $('schulteBest');
    const overlay = $('schulteOverlay');
    const restartBtn = $('schulteRestart');
    let currentNum = 1, startTime = null, timerRAF = null, isRunning = false;
    let bestTime = readStored('schulteBest', null, value => Number.isFinite(value) && value > 0);

    function updateTimer() {
        if (isRunning) {
            const elapsed = (performance.now() - startTime) / 1000;
            timeDisplay.textContent = elapsed.toFixed(2);
            timerRAF = requestAnimationFrame(updateTimer);
        }
    }

    function stopTimer() {
        if (timerRAF) { cancelAnimationFrame(timerRAF); timerRAF = null; }
    }

    function createGrid() {
        grid.innerHTML = '';
        const numbers = shuffle(Array.from({length: 25}, function(_, i) { return i + 1; }));
        currentNum = 1; startTime = null; isRunning = false;
        timeDisplay.textContent = '0.00';
        bestDisplay.textContent = bestTime ? bestTime.toFixed(2) + 's' : '-';
        overlay.hidden = false;
        stopTimer();
        numbers.forEach(function(num) {
            const cell = document.createElement('button');
            cell.type = 'button';
            cell.disabled = true;
            cell.className = 'schulte-cell';
            cell.textContent = num;
            cell.addEventListener('click', function(event) {
                if (!isRunning) return;
                if (num === currentNum) {
                    cell.classList.add('correct');
                    cell.disabled = true;
                    currentNum++;
                    if (currentNum > 25) {
                        stopTimer();
                        isRunning = false;
                        const elapsed = (performance.now() - startTime) / 1000;
                        timeDisplay.textContent = elapsed.toFixed(2);
                        if (!bestTime || elapsed < bestTime) {
                            bestTime = elapsed;
                            localStorage.setItem('schulteBest', bestTime.toString());
                            bestDisplay.textContent = bestTime.toFixed(2) + 's';
                        }
                    }
                    if (event.detail === 0) {
                        const cells = Array.from(grid.children);
                        const index = cells.indexOf(cell);
                        const next = cells.slice(index + 1).concat(cells.slice(0, index)).find(function(item) { return !item.disabled; });
                        (next || restartBtn).focus();
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
            startTime = performance.now();
            overlay.hidden = true;
            Array.from(grid.children).forEach(function(cell) { cell.disabled = false; });
            grid.firstElementChild.focus();
            timerRAF = requestAnimationFrame(updateTimer);
        }
    });

    restartBtn.addEventListener('click', function() {
        createGrid();
        overlay.focus();
    });

    createGrid();
}

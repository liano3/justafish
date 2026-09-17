function initRandomPicker() {
    var optionsEditor = $('randomPickerOptions');
    var addOptionButton = $('randomPickerAddOption');
    var countInput = $('randomPickerCount');
    var deduplicateInput = $('randomPickerDeduplicate');
    var removeInput = $('randomPickerRemove');
    var drawButton = $('randomPickerDraw');
    var resetButton = $('randomPickerReset');
    var resultDisplay = $('randomPickerResult');
    var historyList = $('randomPickerHistory');
    var message = $('randomPickerMessage');
    var optionLabel = $('randomPickerOptionsLabel').textContent;
    var optionPlaceholder = optionsEditor.getAttribute('data-placeholder');
    var history = [];
    var spinTimer;
    var revealTimer;
    var isDrawing = false;

    function optionRows() {
        return Array.from(optionsEditor.querySelectorAll('.random-picker-option'));
    }

    function updateRowLabels() {
        optionRows().forEach(function(row, index) {
            var input = row.querySelector('input');
            input.setAttribute('aria-label', optionLabel + ' ' + (index + 1));
            input.placeholder = index === 0 ? optionPlaceholder : '';
        });
    }

    function saveOptions() {
        var values = optionRows().map(function(row) {
            return row.querySelector('input').value.trim();
        }).filter(Boolean);
        localStorage.setItem('randomPickerOptions', values.join('\n'));
        localStorage.setItem('randomPickerDeduplicate', deduplicateInput.checked.toString());
        localStorage.setItem('randomPickerRemove', removeInput.checked.toString());
    }

    function insertRowAfter(row) {
        var nextRow = createRow('');
        row.after(nextRow);
        updateRowLabels();
        nextRow.querySelector('input').focus();
    }

    function createRow(value) {
        var row = document.createElement('div');
        row.className = 'random-picker-option';
        var input = document.createElement('input');
        input.className = 'random-picker-option-input';
        input.type = 'text';
        input.value = value || '';
        input.autocomplete = 'off';
        input.enterKeyHint = 'next';

        input.addEventListener('input', saveOptions);
        input.addEventListener('keydown', function(event) {
            if (event.isComposing) return;
            var rows = optionRows();
            var rowIndex = rows.indexOf(row);
            if (event.key === 'Enter') {
                event.preventDefault();
                insertRowAfter(row);
                return;
            }
            if (event.key === 'Backspace' && !input.value && rows.length > 1) {
                event.preventDefault();
                var previousInput = rows[rowIndex > 0 ? rowIndex - 1 : 1].querySelector('input');
                row.remove();
                updateRowLabels();
                saveOptions();
                previousInput.focus();
                previousInput.setSelectionRange(previousInput.value.length, previousInput.value.length);
                return;
            }
            if (event.key === 'ArrowUp' && rowIndex > 0) {
                event.preventDefault();
                rows[rowIndex - 1].querySelector('input').focus();
            } else if (event.key === 'ArrowDown' && rowIndex < rows.length - 1) {
                event.preventDefault();
                rows[rowIndex + 1].querySelector('input').focus();
            }
        });
        input.addEventListener('paste', function(event) {
            const text = event.clipboardData.getData('text');
            if (!text.includes('\n')) return;
            event.preventDefault();
            insertPastedRows(input, row, text);
        });

        row.appendChild(input);
        return row;
    }

    function insertPastedRows(input, row, text) {
        var values = text.split(/\r?\n/).map(function(item) { return item.trim(); }).filter(Boolean);
        if (!values.length) return;
        input.value = values.shift();
        var insertAfter = row;
        values.forEach(function(item) {
            var nextRow = createRow(item);
            insertAfter.after(nextRow);
            insertAfter = nextRow;
        });
        updateRowLabels();
        saveOptions();
        insertAfter.querySelector('input').focus();
    }

    function renderRows(values) {
        optionsEditor.innerHTML = '';
        (values.length ? values : ['']).forEach(function(value) {
            optionsEditor.appendChild(createRow(value));
        });
        updateRowLabels();
    }

    function allEntries() {
        return optionRows().map(function(row) {
            return { row: row, value: row.querySelector('input').value.trim() };
        }).filter(function(entry) { return Boolean(entry.value); });
    }

    function eligibleEntries(entries) {
        if (!deduplicateInput.checked) return entries;
        var seen = new Set();
        return entries.filter(function(entry) {
            if (seen.has(entry.value)) return false;
            seen.add(entry.value);
            return true;
        });
    }

    function saveHistory() {
        localStorage.setItem('randomPickerHistory', JSON.stringify(history));
    }

    function renderHistory() {
        historyList.innerHTML = '';
        if (!history.length) {
            var empty = document.createElement('li');
            empty.className = 'random-picker-history-empty';
            empty.textContent = t('randomPickerHistoryEmpty');
            historyList.appendChild(empty);
            return;
        }
        history.forEach(function(entry) {
            var item = document.createElement('li');
            item.textContent = entry.join(' · ');
            historyList.appendChild(item);
        });
    }

    function setInputsDisabled(disabled) {
        [addOptionButton, countInput, deduplicateInput, removeInput, drawButton].forEach(control => { control.disabled = disabled; });
        optionRows().forEach(function(row) {
            row.querySelector('input').disabled = disabled;
        });
    }

    function clearAnimation() {
        clearInterval(spinTimer);
        clearTimeout(revealTimer);
        isDrawing = false;
        setInputsDisabled(false);
        optionRows().forEach(function(row) { row.classList.remove('is-active'); });
    }

    function animateSelection(entries, selectedEntries, onComplete) {
        clearAnimation();
        isDrawing = true;
        setInputsDisabled(true);
        message.classList.remove('is-error');
        message.textContent = t('randomPickerDrawing');
        var animationRows = entries.map(function(entry) { return entry.row; });
        var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        animationRows.forEach(function(row) { row.classList.remove('is-selected'); });

        if (!reduceMotion) {
            var position = 0;
            spinTimer = setInterval(function() {
                animationRows.forEach(row => row.classList.remove('is-active'));
                animationRows[position].classList.add('is-active');
                position = (position + 1) % animationRows.length;
            }, 65);
        }
        revealTimer = setTimeout(function() {
            clearAnimation();
            selectedEntries.forEach(entry => entry.row.classList.add('is-selected'));
            message.textContent = t('randomPickerDone');
            onComplete();
        }, reduceMotion ? 0 : 900);
    }

    function draw() {
        if (isDrawing) return;
        var entries = allEntries();
        var eligible = eligibleEntries(entries);
        var requested = Math.max(1, Math.min(10, parseInt(countInput.value) || 1));
        countInput.value = requested;
        message.textContent = '';
        message.classList.remove('is-error');
        if (!eligible.length) {
            message.classList.add('is-error');
            message.textContent = t('randomPickerEmpty');
            optionRows()[0].querySelector('input').focus();
            return;
        }
        if (requested > eligible.length) {
            message.classList.add('is-error');
            message.textContent = t('randomPickerCount', { count: eligible.length });
            countInput.focus();
            return;
        }

        var selectedEntries = shuffle(eligible).slice(0, requested);
        var selected = selectedEntries.map(function(entry) { return entry.value; });
        resultDisplay.textContent = '…';
        animateSelection(entries, selectedEntries, function() {
            resultDisplay.innerHTML = '';
            selected.forEach(function(value) {
                var item = document.createElement('strong');
                item.textContent = value;
                resultDisplay.appendChild(item);
            });
            history.unshift(selected);
            history = history.slice(0, 5);
            saveHistory();
            renderHistory();

            if (removeInput.checked) {
                selectedEntries.forEach(function(entry) { entry.row.remove(); });
                if (!optionRows().length) optionsEditor.appendChild(createRow(''));
                updateRowLabels();
            }
            saveOptions();
        });
    }

    function reset() {
        clearAnimation();
        renderRows([]);
        countInput.value = '1';
        resultDisplay.textContent = '—';
        message.textContent = '';
        message.classList.remove('is-error');
        history = [];
        saveOptions();
        saveHistory();
        renderHistory();
        optionRows()[0].querySelector('input').focus();
    }

    var storedOptions = (localStorage.getItem('randomPickerOptions') || '').split(/\r?\n/).map(function(item) { return item.trim(); }).filter(Boolean);
    deduplicateInput.checked = localStorage.getItem('randomPickerDeduplicate') !== 'false';
    removeInput.checked = localStorage.getItem('randomPickerRemove') === 'true';
    renderRows(storedOptions);
    history = JSON.parse(localStorage.getItem('randomPickerHistory') || '[]');
    deduplicateInput.addEventListener('change', saveOptions);
    removeInput.addEventListener('change', saveOptions);
    addOptionButton.addEventListener('click', function() {
        insertRowAfter(optionRows()[optionRows().length - 1]);
    });
    drawButton.addEventListener('click', draw);
    resetButton.addEventListener('click', reset);
    renderHistory();
}

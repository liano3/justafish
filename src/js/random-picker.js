function initRandomPicker() {
    const optionsEditor = $('randomPickerOptions');
    const markers = $('randomPickerMarkers');
    const countInput = $('randomPickerCount');
    const deduplicateButton = $('randomPickerDeduplicate');
    const removeInput = $('randomPickerRemove');
    const drawButton = $('randomPickerDraw');
    const resultDisplay = $('randomPickerResult');
    const historyList = $('randomPickerHistory');
    const message = $('randomPickerMessage');
    let history = readStored('randomPickerHistory', [], Array.isArray)
        .filter(entry => Array.isArray(entry) && entry.length && entry.every(value => typeof value === 'string'))
        .slice(0, 5);
    let spinTimer;
    let revealTimer;

    function options() {
        return optionsEditor.value.split('\n').map(value => value.trim());
    }

    function syncScroll() {
        markers.style.transform = `translateY(${-optionsEditor.scrollTop}px)`;
    }

    function renderMarkers() {
        // Normalize pasted line separators so each marker matches one native text line.
        const normalized = optionsEditor.value.replace(/\r\n|[\r\u2028\u2029]/g, '\n');
        if (normalized !== optionsEditor.value) {
            const { selectionStart, selectionEnd } = optionsEditor;
            optionsEditor.value = normalized;
            optionsEditor.setSelectionRange(selectionStart, selectionEnd);
        }
        markers.replaceChildren(...options().map(value => {
            const marker = document.createElement('span');
            marker.className = 'random-picker-marker';
            marker.toggleAttribute('data-option', Boolean(value));
            return marker;
        }));
        syncScroll();
    }

    function saveOptions() {
        localStorage.setItem('randomPickerOptions', optionsEditor.value);
        localStorage.setItem('randomPickerRemove', String(removeInput.checked));
    }

    function renderHistory() {
        historyList.replaceChildren();
        historyList.classList.toggle('empty-state', !history.length);
        (history.length ? history.map(entry => entry.join(' · ')) : [t('randomPickerHistoryEmpty')]).forEach(text => {
            const item = document.createElement('li');
            item.textContent = text;
            historyList.appendChild(item);
        });
        localStorage.setItem('randomPickerHistory', JSON.stringify(history));
    }

    function setDrawing(drawing) {
        [countInput, deduplicateButton, removeInput, drawButton].forEach(control => { control.disabled = drawing; });
        optionsEditor.readOnly = drawing;
        optionsEditor.setAttribute('aria-busy', String(drawing));
    }

    function stopDrawing() {
        clearInterval(spinTimer);
        clearTimeout(revealTimer);
        setDrawing(false);
    }

    function draw() {
        if (drawButton.disabled) return;
        const entries = options().map((value, line) => ({ value, line })).filter(entry => entry.value);
        const requested = Math.max(1, Math.min(10, parseInt(countInput.value) || 1));
        countInput.value = requested;
        message.classList.remove('is-error');
        if (!entries.length || requested > entries.length) {
            message.classList.add('is-error');
            message.textContent = t(entries.length ? 'randomPickerCount' : 'randomPickerEmpty', { count: entries.length });
            (entries.length ? countInput : optionsEditor).focus();
            return;
        }

        // Indices preserve independently weighted duplicates until the user removes them.
        const selectedEntries = shuffle(entries).slice(0, requested);
        const selectedLines = new Set(selectedEntries.map(entry => entry.line));
        const selected = selectedEntries.map(entry => entry.value);
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        renderMarkers();
        const rows = Array.from(markers.children);
        setDrawing(true);
        resultDisplay.textContent = '…';
        message.textContent = t('randomPickerDrawing');
        if (!reduceMotion) {
            let position = 0;
            spinTimer = setInterval(() => {
                const line = entries[position].line;
                rows.forEach((row, index) => row.classList.toggle('is-active', index === line));
                position = (position + 1) % entries.length;
            }, 65);
        }
        revealTimer = setTimeout(() => {
            stopDrawing();
            rows.forEach((row, index) => {
                row.classList.remove('is-active');
                row.classList.toggle('is-selected', selectedLines.has(index));
            });
            resultDisplay.replaceChildren();
            selected.forEach(value => {
                const item = document.createElement('strong');
                item.textContent = value;
                resultDisplay.appendChild(item);
            });
            message.textContent = t('randomPickerDone');
            history = [selected, ...history].slice(0, 5);
            renderHistory();
            if (removeInput.checked) {
                optionsEditor.value = entries.filter(entry => !selectedLines.has(entry.line)).map(entry => entry.value).join('\n');
                renderMarkers();
            }
            saveOptions();
        }, reduceMotion ? 0 : 900);
    }

    optionsEditor.value = localStorage.getItem('randomPickerOptions') || '';
    removeInput.checked = readStored('randomPickerRemove', false, value => typeof value === 'boolean');
    optionsEditor.addEventListener('input', () => { renderMarkers(); saveOptions(); });
    optionsEditor.addEventListener('scroll', syncScroll, { passive: true });
    removeInput.addEventListener('change', saveOptions);
    deduplicateButton.addEventListener('click', () => {
        optionsEditor.value = Array.from(new Set(options().filter(Boolean))).join('\n');
        renderMarkers();
        saveOptions();
    });
    drawButton.addEventListener('click', draw);
    $('randomPickerReset').addEventListener('click', () => {
        stopDrawing();
        optionsEditor.value = '';
        renderMarkers();
        countInput.value = '1';
        resultDisplay.textContent = '—';
        message.textContent = '';
        message.classList.remove('is-error');
        history = [];
        saveOptions();
        renderHistory();
        optionsEditor.focus();
    });
    renderMarkers();
    renderHistory();
}

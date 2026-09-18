function initCountdown() {
    var form = $('countdownForm');
    var nameInput = $('countdownName');
    var dateInput = $('countdownDate');
    var datePicker = $('countdownDatePicker');
    var dateButton = $('countdownDateButton');
    var autoConvertInput = $('countdownAutoConvert');
    var countdownList = $('countdownList');
    var anniversaryList = $('anniversaryList');
    var iconSprite = document.querySelector('.countdown-app').getAttribute('data-icon-sprite');
    var storageKey = 'countdownEvents';
    var events = JSON.parse(localStorage.getItem(storageKey) || '[]');
    let renderedDay;

    function parseLocalDate(value) { return new Date(value + 'T00:00:00'); }

    function validateDate() {
        datePicker.value = dateInput.value;
        var valid = datePicker.value === dateInput.value && datePicker.validity.valid;
        dateInput.setCustomValidity(valid ? '' : t('countdownInvalidDate'));
        return valid && Boolean(dateInput.value);
    }

    dateInput.addEventListener('input', validateDate);
    dateButton.addEventListener('click', function() {
        validateDate();
        datePicker.showPicker();
    });
    datePicker.addEventListener('change', function() {
        dateInput.value = datePicker.value;
        validateDate();
        dateInput.focus();
    });

    function startOfToday() {
        var today = new Date();
        return new Date(today.getFullYear(), today.getMonth(), today.getDate());
    }

    function differenceInDays(date, today) {
        return Math.round((date.getTime() - today.getTime()) / 86400000);
    }

    function addMonthsClamped(date, months) {
        var target = new Date(date.getFullYear(), date.getMonth() + months, 1);
        var lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
        target.setDate(Math.min(date.getDate(), lastDay));
        return target;
    }

    function nextAnniversary(date, today) {
        var months = (today.getFullYear() - date.getFullYear()) * 12;
        var next = addMonthsClamped(date, months);
        if (next < today) next = addMonthsClamped(date, months + 12);
        return next;
    }

    function calendarDuration(start, end) {
        var months = (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth();
        if (addMonthsClamped(start, months) > end) months -= 1;
        var cursor = addMonthsClamped(start, months);
        return {
            years: Math.floor(months / 12),
            months: months % 12,
            days: differenceInDays(end, cursor)
        };
    }

    function durationLabel(date, today) {
        var duration = calendarDuration(today, date);
        if (!duration.years && !duration.months) return '';
        var parts = [];
        if (duration.years) parts.push(t('countdownDurationYear', { count: duration.years }));
        if (duration.months) parts.push(t('countdownDurationMonth', { count: duration.months }));
        if (duration.days) parts.push(t('countdownDurationDay', { count: duration.days }));
        var isChinese = t('dateLocale').startsWith('zh');
        return parts.join(isChinese ? '' : ' ');
    }

    function removeEvent(id) {
        events = events.filter(event => event.id !== id);
        render();
        if (document.activeElement === document.body) nameInput.focus();
    }

    function createEmptyState(key) {
        var empty = document.createElement('p');
        empty.className = 'countdown-empty';
        empty.textContent = t(key);
        return empty;
    }

    function createEventItem(event, today) {
        var date = parseLocalDate(event.date);
        var targetDate = event.kind === 'anniversary' ? nextAnniversary(date, today) : date;
        var days = differenceInDays(targetDate, today);
        var item = document.createElement('article');
        item.className = 'countdown-item';

        var copy = document.createElement('div');
        copy.className = 'countdown-item-copy';
        var title = document.createElement('h3');
        title.textContent = event.name;
        var meta = document.createElement('div');
        meta.className = 'countdown-item-meta';
        meta.textContent = new Intl.DateTimeFormat(t('dateLocale'), {
            year: 'numeric', month: 'long', day: 'numeric'
        }).format(date);
        copy.appendChild(title);
        copy.appendChild(meta);

        var remaining = document.createElement('strong');
        remaining.className = 'countdown-remaining';
        remaining.textContent = days === 0
            ? t('countdownToday')
            : t('countdownFuture', { days: days });
        var duration = document.createElement('span');
        duration.className = 'countdown-duration';
        duration.textContent = durationLabel(targetDate, today);

        var remove = document.createElement('button');
        remove.className = 'icon-button countdown-delete';
        remove.type = 'button';
        remove.dataset.eventId = event.id;
        remove.setAttribute('aria-label', t('countdownDeleteLabel', { name: event.name }));
        remove.title = remove.getAttribute('aria-label');
        remove.innerHTML = '<svg aria-hidden="true"><use href="' + iconSprite + '#x"></use></svg>';
        remove.addEventListener('click', function() { removeEvent(event.id); });

        item.appendChild(copy);
        item.appendChild(remaining);
        if (duration.textContent) item.appendChild(duration);
        item.appendChild(remove);
        return item;
    }

    function renderGroup(target, groupEvents, today, emptyKey, newestFirst) {
        target.innerHTML = '';
        if (!groupEvents.length) {
            target.appendChild(createEmptyState(emptyKey));
            return;
        }
        groupEvents.sort(function(a, b) {
            var difference = parseLocalDate(a.date) - parseLocalDate(b.date);
            return newestFirst ? -difference : difference;
        }).forEach(function(event) {
            target.appendChild(createEventItem(event, today));
        });
    }

    function render() {
        const focusedId = document.activeElement.dataset.eventId;
        var today = startOfToday();
        renderedDay = today.getTime();
        events = events.flatMap(function(event) {
            if (event.kind !== 'countdown' || parseLocalDate(event.date) >= today) return [event];
            return event.autoConvert ? [{ ...event, kind: 'anniversary' }] : [];
        });
        localStorage.setItem(storageKey, JSON.stringify(events));

        renderGroup(countdownList, events.filter(function(event) {
            return event.kind === 'countdown';
        }), today, 'countdownEmpty', false);
        renderGroup(anniversaryList, events.filter(function(event) {
            return event.kind === 'anniversary';
        }), today, 'anniversaryEmpty', true);
        if (focusedId) {
            const next = Array.from(document.querySelectorAll('.countdown-delete')).find(button => button.dataset.eventId === focusedId);
            (next || nameInput).focus();
        }
    }

    nameInput.addEventListener('input', function() { nameInput.setCustomValidity(''); });
    form.addEventListener('submit', function(event) {
        event.preventDefault();
        if (!validateDate()) {
            dateInput.reportValidity();
            return;
        }
        var name = nameInput.value.trim();
        if (!name) {
            nameInput.setCustomValidity(t('countdownInvalid'));
            nameInput.reportValidity();
            return;
        }
        var date = parseLocalDate(dateInput.value);
        var record = {
            id: crypto.randomUUID(),
            name: name,
            date: dateInput.value,
            kind: date >= startOfToday() ? 'countdown' : 'anniversary',
            autoConvert: autoConvertInput.checked
        };
        events.push(record);
        form.reset();
        dateInput.setCustomValidity('');
        render();
        nameInput.focus();
    });

    render();
    const refreshDate = () => { if (startOfToday().getTime() !== renderedDay) render(); };
    setInterval(refreshDate, 60000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshDate(); });
}

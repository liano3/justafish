function initCountdown() {
    const form = $('countdownForm');
    const nameInput = $('countdownName');
    const dateInput = $('countdownDate');
    const datePicker = $('countdownDatePicker');
    const dateButton = $('countdownDateButton');
    const autoConvertInput = $('countdownAutoConvert');
    const countdownList = $('countdownList');
    const anniversaryList = $('anniversaryList');
    const iconSprite = document.querySelector('.countdown-app').getAttribute('data-icon-sprite');
    const storageKey = 'countdownEvents';
    let events = readStored(storageKey, [], Array.isArray).filter(event => {
        if (!event || typeof event.id !== 'string' || typeof event.name !== 'string' ||
            !['countdown', 'anniversary'].includes(event.kind) || !/^\d{4}-\d{2}-\d{2}$/.test(event.date)) return false;
        const date = parseLocalDate(event.date);
        return Number.isFinite(date.getTime()) && date.getFullYear() > 0 &&
            date.getFullYear() === Number(event.date.slice(0, 4)) &&
            date.getMonth() + 1 === Number(event.date.slice(5, 7)) && date.getDate() === Number(event.date.slice(8, 10));
    });
    let renderedDay;

    function parseLocalDate(value) { return new Date(value + 'T00:00:00'); }

    function validateDate() {
        datePicker.value = dateInput.value;
        const valid = datePicker.value === dateInput.value && datePicker.validity.valid;
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
        const today = new Date();
        return new Date(today.getFullYear(), today.getMonth(), today.getDate());
    }

    function differenceInDays(date, today) {
        return Math.round((date.getTime() - today.getTime()) / 86400000);
    }

    function addMonthsClamped(date, months) {
        const target = new Date(date);
        target.setDate(1);
        target.setMonth(target.getMonth() + months);
        const lastDay = new Date(target);
        lastDay.setMonth(lastDay.getMonth() + 1, 0);
        target.setDate(Math.min(date.getDate(), lastDay.getDate()));
        return target;
    }

    function nextAnniversary(date, today) {
        const months = (today.getFullYear() - date.getFullYear()) * 12;
        let next = addMonthsClamped(date, months);
        if (next < today) next = addMonthsClamped(date, months + 12);
        return next;
    }

    function calendarDuration(start, end) {
        let months = (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth();
        if (addMonthsClamped(start, months) > end) months -= 1;
        const cursor = addMonthsClamped(start, months);
        return {
            years: Math.floor(months / 12),
            months: months % 12,
            days: differenceInDays(end, cursor)
        };
    }

    function durationLabel(date, today) {
        const duration = calendarDuration(today, date);
        if (!duration.years && !duration.months) return '';
        const parts = [];
        if (duration.years) parts.push(t('countdownDurationYear', { count: duration.years }));
        if (duration.months) parts.push(t('countdownDurationMonth', { count: duration.months }));
        if (duration.days) parts.push(t('countdownDurationDay', { count: duration.days }));
        const isChinese = t('dateLocale').startsWith('zh');
        return parts.join(isChinese ? '' : ' ');
    }

    function removeEvent(id) {
        events = events.filter(event => event.id !== id);
        render();
        if (document.activeElement === document.body) nameInput.focus();
    }

    function createEmptyState(key) {
        const empty = document.createElement('p');
        empty.className = 'empty-state';
        empty.textContent = t(key);
        return empty;
    }

    function createEventItem(event, today) {
        const date = parseLocalDate(event.date);
        const targetDate = event.kind === 'anniversary' ? nextAnniversary(date, today) : date;
        const days = differenceInDays(targetDate, today);
        const item = document.createElement('article');
        item.className = 'countdown-item';

        const copy = document.createElement('div');
        copy.className = 'countdown-item-copy';
        const title = document.createElement('h3');
        title.textContent = event.name;
        const meta = document.createElement('div');
        meta.className = 'countdown-item-meta';
        meta.textContent = new Intl.DateTimeFormat(t('dateLocale'), {
            year: 'numeric', month: 'long', day: 'numeric'
        }).format(date);
        copy.appendChild(title);
        copy.appendChild(meta);

        const remaining = document.createElement('strong');
        remaining.className = 'countdown-remaining';
        remaining.textContent = days === 0
            ? t('countdownToday')
            : t('countdownFuture', { days: days });
        const duration = document.createElement('span');
        duration.className = 'countdown-duration';
        duration.textContent = durationLabel(targetDate, today);

        const remove = document.createElement('button');
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

    function renderGroup(target, groupEvents, today, emptyKey) {
        target.innerHTML = '';
        if (!groupEvents.length) {
            target.appendChild(createEmptyState(emptyKey));
            return;
        }
        const targetDate = event => event.kind === 'anniversary' ? nextAnniversary(parseLocalDate(event.date), today) : parseLocalDate(event.date);
        groupEvents.sort((a, b) => targetDate(a) - targetDate(b)).forEach(function(event) {
            target.appendChild(createEventItem(event, today));
        });
    }

    function render() {
        const focusedId = document.activeElement.dataset.eventId;
        const today = startOfToday();
        renderedDay = today.getTime();
        events = events.flatMap(function(event) {
            if (event.kind !== 'countdown' || parseLocalDate(event.date) >= today) return [event];
            return event.autoConvert ? [{ ...event, kind: 'anniversary' }] : [];
        });
        localStorage.setItem(storageKey, JSON.stringify(events));

        renderGroup(countdownList, events.filter(function(event) {
            return event.kind === 'countdown';
        }), today, 'countdownEmpty');
        renderGroup(anniversaryList, events.filter(function(event) {
            return event.kind === 'anniversary';
        }), today, 'anniversaryEmpty');
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
        const name = nameInput.value.trim();
        if (!name) {
            nameInput.setCustomValidity(t('countdownInvalid'));
            nameInput.reportValidity();
            return;
        }
        const date = parseLocalDate(dateInput.value);
        const record = {
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

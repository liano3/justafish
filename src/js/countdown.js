function initCountdown() {
    var form = $('countdownForm');
    var nameInput = $('countdownName');
    var dateInput = $('countdownDate');
    var message = $('countdownMessage');
    var countdownList = $('countdownList');
    var anniversaryList = $('anniversaryList');
    var iconSprite = document.querySelector('.countdown-app').getAttribute('data-icon-sprite');
    var storageKey = 'countdownEvents';
    var events = [];

    function parseLocalDate(value) {
        if (typeof value !== 'string') return null;
        var parts = value.split('-').map(Number);
        if (parts.length !== 3 || parts.some(isNaN)) return null;
        var date = new Date(parts[0], parts[1] - 1, parts[2]);
        return date.getFullYear() === parts[0] && date.getMonth() === parts[1] - 1 && date.getDate() === parts[2] ? date : null;
    }

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

    function durationLabel(date, today, days) {
        var duration = calendarDuration(days > 0 ? today : date, days > 0 ? date : today);
        if (!duration.years && !duration.months) return '';
        var parts = [];
        if (duration.years) parts.push(t('countdownDurationYear', { count: duration.years }));
        if (duration.months) parts.push(t('countdownDurationMonth', { count: duration.months }));
        if (duration.days) parts.push(t('countdownDurationDay', { count: duration.days }));
        var isChinese = t('dateLocale').startsWith('zh');
        var detail = parts.join(isChinese ? '' : ' ');
        return isChinese ? '（' + detail + '）' : ' (' + detail + ')';
    }

    function save() {
        localStorage.setItem(storageKey, JSON.stringify(events));
    }

    function removeEvent(id) {
        events = events.filter(function(event) { return event.id !== id; });
        save();
        render();
    }

    function createEmptyState(key) {
        var empty = document.createElement('p');
        empty.className = 'countdown-empty';
        empty.textContent = t(key);
        return empty;
    }

    function createEventItem(event, today) {
        var date = parseLocalDate(event.date);
        var days = differenceInDays(date, today);
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
            : (days > 0 ? t('countdownFuture', { days: days }) : t('countdownPast', { days: Math.abs(days) })) + durationLabel(date, today, days);

        var remove = document.createElement('button');
        remove.className = 'countdown-delete';
        remove.type = 'button';
        remove.setAttribute('aria-label', t('countdownDeleteLabel', { name: event.name }));
        remove.title = remove.getAttribute('aria-label');
        remove.innerHTML = '<svg aria-hidden="true"><use href="' + iconSprite + '#x"></use></svg>';
        remove.addEventListener('click', function() { removeEvent(event.id); });

        item.appendChild(copy);
        item.appendChild(remaining);
        item.appendChild(remove);
        return item;
    }

    function renderGroup(target, groupEvents, today, emptyKey, newestFirst) {
        target.innerHTML = '';
        if (!groupEvents.length) {
            target.appendChild(createEmptyState(emptyKey));
            return;
        }
        groupEvents.slice().sort(function(a, b) {
            var difference = parseLocalDate(a.date) - parseLocalDate(b.date);
            return newestFirst ? -difference : difference;
        }).forEach(function(event) {
            target.appendChild(createEventItem(event, today));
        });
    }

    function render() {
        var today = startOfToday();
        var previousCount = events.length;
        events = events.filter(function(event) {
            return event.kind !== 'countdown' || parseLocalDate(event.date) > today;
        });
        if (events.length !== previousCount) save();

        renderGroup(countdownList, events.filter(function(event) {
            return event.kind === 'countdown';
        }), today, 'countdownEmpty', false);
        renderGroup(anniversaryList, events.filter(function(event) {
            return event.kind === 'anniversary';
        }), today, 'anniversaryEmpty', true);
    }

    form.addEventListener('submit', function(event) {
        event.preventDefault();
        var name = nameInput.value.trim();
        var date = parseLocalDate(dateInput.value);
        message.textContent = '';
        if (!name || !date) {
            message.textContent = t('countdownInvalid');
            (!name ? nameInput : dateInput).focus();
            return;
        }
        events.push({
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
            name: name,
            date: dateInput.value,
            kind: date > startOfToday() ? 'countdown' : 'anniversary'
        });
        save();
        form.reset();
        render();
        nameInput.focus();
    });

    try {
        var stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
        if (Array.isArray(stored)) {
            events = stored.filter(function(event) {
                return event
                    && typeof event.id === 'string'
                    && typeof event.name === 'string'
                    && parseLocalDate(event.date)
                    && (event.kind === 'countdown' || event.kind === 'anniversary');
            }).map(function(event) {
                return { id: event.id, name: event.name, date: event.date, kind: event.kind };
            });
        }
    } catch (error) {
        localStorage.removeItem(storageKey);
    }
    render();
    setInterval(render, 60000);
}

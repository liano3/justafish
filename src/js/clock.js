function initClock() {
    var faceEl = $('analogFace');
    var hourHand = $('analogHour');
    var minuteHand = $('analogMinute');
    var secondHand = $('analogSecond');
    var digitalClock = $('digitalClock');
    var digitalDate = $('digitalDate');
    var faceStyle = getComputedStyle(faceEl);
    var borderX = Number(faceStyle.borderLeftWidth.replace('px', '')) + Number(faceStyle.borderRightWidth.replace('px', ''));
    var borderY = Number(faceStyle.borderTopWidth.replace('px', '')) + Number(faceStyle.borderBottomWidth.replace('px', ''));
    var faceWidth = faceEl.clientWidth || 200 - borderX;
    var faceHeight = faceEl.clientHeight || 200 - borderY;
    var lastSecond = -1;

    // Create marks
    for (var i = 0; i < 60; i++) {
        var mark = document.createElement('div');
        mark.className = i % 5 === 0 ? 'analog-mark hour' : 'analog-mark minute';
        mark.style.transform = 'rotate(' + (i * 6) + 'deg)';
        faceEl.appendChild(mark);
        var markTop = Number(getComputedStyle(mark).top.replace('px', ''));
        mark.style.transformOrigin = 'center ' + (faceHeight / 2 - markTop) + 'px';
    }

    // Create numbers
    var nums = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    var cx = faceWidth / 2;
    var cy = faceHeight / 2;
    nums.forEach(function(num, idx) {
        var angle = (idx * 30 - 90) * (Math.PI / 180);
        var span = document.createElement('span');
        var isCardinal = num % 3 === 0;
        span.className = 'analog-number' + (isCardinal ? ' analog-number-cardinal' : '');
        span.textContent = num;
        span.style.cssText = 'left:' + (cx + 73 * Math.cos(angle)) + 'px;top:' + (cy + 73 * Math.sin(angle)) + 'px;transform:translate(-50%,-50%)';
        faceEl.appendChild(span);
    });

    function updateClock() {
        var now = new Date();
        var currentSecond = now.getSeconds();
        if (currentSecond !== lastSecond) {
            lastSecond = currentSecond;
            digitalClock.textContent = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0') + ':' + String(currentSecond).padStart(2, '0');
            digitalDate.textContent = new Intl.DateTimeFormat(t('dateLocale'), {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
            }).format(now);
        }
        secondHand.style.transform = 'rotate(' + ((currentSecond + now.getMilliseconds() / 1000) * 6) + 'deg)';
        minuteHand.style.transform = 'rotate(' + ((now.getMinutes() + currentSecond / 60) * 6) + 'deg)';
        hourHand.style.transform = 'rotate(' + ((now.getHours() % 12 + now.getMinutes() / 60) * 30) + 'deg)';
        requestAnimationFrame(updateClock);
    }

    updateClock();
}

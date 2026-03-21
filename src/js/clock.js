function initClock(opts) {
    var faceEl = $(opts.faceId);
    var hourHand = $(opts.hourId);
    var minuteHand = $(opts.minuteId);
    var secondHand = $(opts.secondId);
    var digitalClock = $(opts.digitalClockId);
    var digitalDate = $(opts.digitalDateId);
    var faceSize = opts.faceSize || 240;
    var showNumbers = opts.showNumbers !== undefined ? opts.showNumbers : true;
    var clockRAF = null;
    var lastSecond = -1;

    // Create marks
    var markOrigin = Math.floor(faceSize / 2) - 6;
    for (var i = 0; i < 60; i++) {
        var mark = document.createElement('div');
        mark.className = i % 5 === 0 ? 'analog-mark hour' : 'analog-mark minute';
        mark.style.transform = 'rotate(' + (i * 6) + 'deg)';
        if (opts.markOrigin) {
            mark.style.transformOrigin = 'center ' + opts.markOrigin + 'px';
        }
        faceEl.appendChild(mark);
    }

    // Create numbers
    if (showNumbers) {
        var nums = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
        var radius = opts.numberRadius || 88;
        var cx = faceSize / 2;
        var cy = faceSize / 2;
        nums.forEach(function(num, idx) {
            var angle = (idx * 30 - 90) * (Math.PI / 180);
            var span = document.createElement('span');
            span.className = 'analog-number';
            span.textContent = num;
            span.style.cssText = 'left:' + (cx + radius * Math.cos(angle)) + 'px;top:' + (cy + radius * Math.sin(angle)) + 'px;transform:translate(-50%,-50%)';
            faceEl.appendChild(span);
        });
    }

    function updateClock() {
        var now = new Date();
        var currentSecond = now.getSeconds();
        if (currentSecond !== lastSecond) {
            lastSecond = currentSecond;
            digitalClock.textContent = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0') + ':' + String(currentSecond).padStart(2, '0');
            digitalDate.textContent = now.getFullYear() + '年' + (now.getMonth() + 1) + '月' + now.getDate() + '日 ' + ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'][now.getDay()];
        }
        secondHand.style.transform = 'rotate(' + ((currentSecond + now.getMilliseconds() / 1000) * 6) + 'deg)';
        minuteHand.style.transform = 'rotate(' + ((now.getMinutes() + currentSecond / 60) * 6) + 'deg)';
        hourHand.style.transform = 'rotate(' + ((now.getHours() % 12 + now.getMinutes() / 60) * 30) + 'deg)';
    }

    function start() {
        if (clockRAF) cancelAnimationFrame(clockRAF);
        lastSecond = -1;
        function tick() { updateClock(); clockRAF = requestAnimationFrame(tick); }
        tick();
    }

    function stop() {
        if (clockRAF) { cancelAnimationFrame(clockRAF); clockRAF = null; }
    }

    if (opts.startImmediately) {
        start();
    }

    return { start: start, stop: stop };
}

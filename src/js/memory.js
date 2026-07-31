function initMemoryGame() {
    var root = document.querySelector('.memory-game');
    var board = $('memoryBoard');
    var movesDisplay = $('memoryMoves');
    var timeDisplay = $('memoryTime');
    var bestDisplay = $('memoryBest');
    var statusDisplay = $('memoryStatus');
    var restartButton = $('memoryRestart');
    var sizeButtons = document.querySelectorAll('[data-memory-size]');
    var iconSprite = root.getAttribute('data-icon-sprite');
    var iconNames = ['book-open', 'github', 'scholar', 'mail', 'calendar', 'phone', 'copy', 'check', 'sun', 'moon', 'download', 'search', 'clock', 'bell', 'table', 'grid', 'home', 'bookmark'];
    var size = 4;
    var firstCard = null;
    var lockBoard = false;
    var moves = 0;
    var elapsed = 0;
    var matchedPairs = 0;
    var timer = null;
    var mismatchTimeout = null;
    var startedAt = 0;

    function bestKey() {
        return 'memoryBest' + size;
    }

    function getBest() {
        var value = parseInt(localStorage.getItem(bestKey()));
        return isNaN(value) ? null : value;
    }

    function updateBest() {
        var best = getBest();
        bestDisplay.textContent = best === null ? '—' : formatTime(best);
    }

    function updateTimer() {
        elapsed = Math.floor((Date.now() - startedAt) / 1000);
        timeDisplay.textContent = formatTime(elapsed);
    }

    function startTimer() {
        if (timer) return;
        startedAt = Date.now() - elapsed * 1000;
        timer = setInterval(updateTimer, 250);
    }

    function stopTimer() {
        if (timer) clearInterval(timer);
        timer = null;
        updateTimer();
    }

    function setCardState(card, state) {
        card.classList.toggle('is-flipped', state !== 'hidden');
        card.classList.toggle('is-matched', state === 'matched');
        card.setAttribute('aria-label', t(state === 'hidden'
            ? 'memoryCardHidden'
            : (state === 'matched' ? 'memoryCardMatched' : 'memoryCardRevealed')));
    }

    function finishGame() {
        stopTimer();
        var best = getBest();
        if (best === null || elapsed < best) {
            localStorage.setItem(bestKey(), String(elapsed));
            updateBest();
        }
        statusDisplay.textContent = t('memoryComplete', { moves: moves, time: formatTime(elapsed) });
    }

    function handleCard(card) {
        if (lockBoard || card.classList.contains('is-flipped') || card.classList.contains('is-matched')) return;
        startTimer();
        setCardState(card, 'flipped');
        if (!firstCard) {
            firstCard = card;
            return;
        }

        moves++;
        movesDisplay.textContent = moves;
        var secondCard = card;
        if (firstCard.getAttribute('data-icon') === secondCard.getAttribute('data-icon')) {
            setCardState(firstCard, 'matched');
            setCardState(secondCard, 'matched');
            firstCard = null;
            matchedPairs++;
            if (matchedPairs === size * size / 2) finishGame();
            return;
        }

        lockBoard = true;
        var firstMismatchCard = firstCard;
        var secondMismatchCard = secondCard;
        mismatchTimeout = setTimeout(function() {
            setCardState(firstMismatchCard, 'hidden');
            setCardState(secondMismatchCard, 'hidden');
            firstCard = null;
            lockBoard = false;
            mismatchTimeout = null;
        }, 650);
    }

    function newGame() {
        if (timer) clearInterval(timer);
        if (mismatchTimeout) clearTimeout(mismatchTimeout);
        timer = null;
        mismatchTimeout = null;
        firstCard = null;
        lockBoard = false;
        moves = 0;
        elapsed = 0;
        matchedPairs = 0;
        movesDisplay.textContent = '0';
        timeDisplay.textContent = '00:00';
        statusDisplay.textContent = t('memoryReady');
        updateBest();
        board.innerHTML = '';
        board.style.setProperty('--memory-size', size);

        var pairCount = size * size / 2;
        var deck = shuffle(iconNames.slice(0, pairCount).concat(iconNames.slice(0, pairCount)));
        deck.forEach(function(iconName) {
            var card = document.createElement('button');
            card.className = 'memory-card';
            card.type = 'button';
            card.setAttribute('role', 'gridcell');
            card.setAttribute('data-icon', iconName);
            card.innerHTML = '<span class="memory-card-back" aria-hidden="true"></span><span class="memory-card-face" aria-hidden="true"><svg><use href="' + iconSprite + '#' + iconName + '"></use></svg></span>';
            setCardState(card, 'hidden');
            card.addEventListener('click', function() { handleCard(card); });
            board.appendChild(card);
        });
    }

    sizeButtons.forEach(function(button) {
        button.addEventListener('click', function() {
            size = parseInt(button.getAttribute('data-memory-size'));
            sizeButtons.forEach(function(item) {
                item.setAttribute('aria-pressed', (item === button).toString());
            });
            newGame();
        });
    });
    restartButton.addEventListener('click', newGame);
    newGame();
}

function Game2048InputManager() {
    this.events = {};
    this.pointerStart = null;
    this.listen();
}

Game2048InputManager.prototype.on = function(event, callback) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(callback);
};

Game2048InputManager.prototype.emit = function(event, data) {
    var callbacks = this.events[event];
    if (callbacks) callbacks.forEach(function(callback) { callback(data); });
};

Game2048InputManager.prototype.listen = function() {
    var self = this;
    var board = $('game2048Board');
    var keyMap = {
        ArrowUp: 0, w: 0, W: 0,
        ArrowRight: 1, d: 1, D: 1,
        ArrowDown: 2, s: 2, S: 2,
        ArrowLeft: 3, a: 3, A: 3
    };

    document.addEventListener('keydown', function(event) {
        var target = event.target;
        if (event.altKey || event.ctrlKey || event.metaKey) return;
        if (!board.contains(target)) return;
        if (!Object.prototype.hasOwnProperty.call(keyMap, event.key)) return;
        event.preventDefault();
        self.emit('move', keyMap[event.key]);
    });

    document.querySelectorAll('[data-2048-restart]').forEach(function(button) {
        button.addEventListener('click', function() {
            self.emit('restart');
            board.focus({ preventScroll: true });
        });
    });

    var keepPlayingButton = document.querySelector('[data-2048-continue]');
    keepPlayingButton.addEventListener('click', function() {
        self.emit('keepPlaying');
        board.focus({ preventScroll: true });
    });

    board.addEventListener('pointerdown', function(event) {
        if (event.target.closest('button')) return;
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        self.pointerStart = { id: event.pointerId, x: event.clientX, y: event.clientY };
        board.focus({ preventScroll: true });
        board.setPointerCapture(event.pointerId);
    });

    board.addEventListener('pointerup', function(event) {
        if (!self.pointerStart || self.pointerStart.id !== event.pointerId) return;
        var dx = event.clientX - self.pointerStart.x;
        var dy = event.clientY - self.pointerStart.y;
        self.pointerStart = null;
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
        event.preventDefault();
        self.emit('move', Math.abs(dx) > Math.abs(dy)
            ? (dx > 0 ? 1 : 3)
            : (dy > 0 ? 2 : 0));
    });

    board.addEventListener('pointercancel', function() {
        self.pointerStart = null;
    });
};

function Game2048StorageManager() {
    this.bestScoreKey = 'game2048BestScore';
    this.gameStateKey = 'game2048State';
}

Game2048StorageManager.prototype.getBestScore = function() {
    return Number(localStorage.getItem(this.bestScoreKey) || 0);
};

Game2048StorageManager.prototype.setBestScore = function(score) {
    localStorage.setItem(this.bestScoreKey, String(score));
};

Game2048StorageManager.prototype.getGameState = function() {
    return JSON.parse(localStorage.getItem(this.gameStateKey));
};

Game2048StorageManager.prototype.setGameState = function(state) {
    localStorage.setItem(this.gameStateKey, JSON.stringify(state));
};

Game2048StorageManager.prototype.clearGameState = function() {
    localStorage.removeItem(this.gameStateKey);
};

function Game2048Actuator() {
    this.grid = $('game2048Grid');
    this.score = $('game2048Score');
    this.best = $('game2048Best');
    this.message = $('game2048Message');
    this.messageText = $('game2048MessageText');
    this.keepPlayingButton = document.querySelector('[data-2048-continue]');
    this.createCells();
}

Game2048Actuator.prototype.createCells = function() {
    this.grid.innerHTML = '';
    for (var i = 0; i < 16; i++) {
        var cell = document.createElement('div');
        cell.className = 'game2048-cell';
        this.grid.appendChild(cell);
    }
};

Game2048Actuator.prototype.actuate = function(grid, metadata) {
    var cells = this.grid.children;
    var animate = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var step = cells[1].offsetLeft - cells[0].offsetLeft;
    function slide(element, from, to) {
        if (!animate || !from || (from.x === to.x && from.y === to.y)) return;
        return element.animate([
            { transform: 'translate(' + ((from.x - to.x) * step) + 'px,' + ((from.y - to.y) * step) + 'px)' },
            { transform: 'translate(0,0)' }
        ], { duration: 120, easing: 'ease-out' });
    }
    for (var y = 0; y < grid.size; y++) {
        for (var x = 0; x < grid.size; x++) {
            var tile = grid.cellContent({ x: x, y: y });
            var cell = cells[y * grid.size + x];
            cell.textContent = '';
            if (!tile) continue;

            var digits = String(tile.value).length;
            var valueClass = tile.value <= 2048 ? tile.value : 'super';
            var digitClass = digits >= 6 ? 'digits-many' : 'digits-' + digits;
            var piece = document.createElement('span');
            piece.className = 'game2048-tile game2048-tile-' + valueClass + ' ' + digitClass;
            piece.textContent = tile.value;
            cell.appendChild(piece);
            if (tile.mergedFrom) {
                piece.classList.add('is-merged');
                if (animate) {
                    piece.style.animationDelay = '120ms';
                    tile.mergedFrom.forEach(function(source) {
                        var ghost = document.createElement('span');
                        ghost.className = 'game2048-merge-source game2048-tile-' + (source.value <= 2048 ? source.value : 'super');
                        ghost.textContent = source.value;
                        ghost.setAttribute('aria-hidden', 'true');
                        cell.appendChild(ghost);
                        var movement = slide(ghost, source.previousPosition || source, tile);
                        if (movement) movement.onfinish = function() { ghost.remove(); };
                        else ghost.remove();
                    });
                }
            } else if (tile.previousPosition) {
                slide(piece, tile.previousPosition, tile);
            } else piece.classList.add('is-new');
        }
    }

    this.score.textContent = metadata.score;
    this.best.textContent = metadata.bestScore;
    if (metadata.terminated) {
        this.messageText.textContent = metadata.over ? t('gameOver') : t('gameWon');
        this.keepPlayingButton.hidden = metadata.over;
        this.message.classList.add('show');
    } else {
        this.message.classList.remove('show');
    }
};

Game2048Actuator.prototype.continueGame = function() {
    this.message.classList.remove('show');
};

function initGame2048() {
    window.game2048 = new GameManager(
        4,
        Game2048InputManager,
        Game2048Actuator,
        Game2048StorageManager
    );
}

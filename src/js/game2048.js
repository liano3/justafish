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
    const callbacks = this.events[event];
    if (callbacks) callbacks.forEach(function(callback) { callback(data); });
};

Game2048InputManager.prototype.listen = function() {
    const self = this;
    const board = $('game2048Board');
    const keyMap = {
        ArrowUp: 0, w: 0, W: 0,
        ArrowRight: 1, d: 1, D: 1,
        ArrowDown: 2, s: 2, S: 2,
        ArrowLeft: 3, a: 3, A: 3
    };

    document.addEventListener('keydown', function(event) {
        const target = event.target;
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

    const keepPlayingButton = document.querySelector('[data-2048-continue]');
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
        const dx = event.clientX - self.pointerStart.x;
        const dy = event.clientY - self.pointerStart.y;
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
    return readStored(this.bestScoreKey, 0, value => Number.isFinite(value) && value >= 0);
};

Game2048StorageManager.prototype.setBestScore = function(score) {
    localStorage.setItem(this.bestScoreKey, String(score));
};

Game2048StorageManager.prototype.getGameState = function() {
    return readStored(this.gameStateKey, null, state => state &&
        Number.isFinite(state.score) && state.score >= 0 &&
        ['over', 'won', 'keepPlaying'].every(key => typeof state[key] === 'boolean') &&
        state.grid?.size === 4 && Array.isArray(state.grid.cells) && state.grid.cells.length === 4 &&
        state.grid.cells.every((column, x) => Array.isArray(column) && column.length === 4 &&
            column.every((tile, y) => tile === null || (tile?.position?.x === x && tile.position.y === y &&
                typeof tile.value === 'number' && tile.value >= 2 && Number.isInteger(Math.log2(tile.value))))));
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
    this.keepPlayingButton = document.querySelector('[data-2048-continue]');
    this.createCells();
}

Game2048Actuator.prototype.createCells = function() {
    this.grid.innerHTML = '';
    for (let i = 0; i < 16; i++) {
        const cell = document.createElement('div');
        cell.className = 'game2048-cell';
        this.grid.appendChild(cell);
    }
};

Game2048Actuator.prototype.actuate = function(grid, metadata) {
    const cells = this.grid.children;
    const animate = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const step = cells[1].offsetLeft - cells[0].offsetLeft;
    function slide(element, from, to) {
        if (!animate || !from || (from.x === to.x && from.y === to.y)) return;
        return element.animate([
            { transform: 'translate(' + ((from.x - to.x) * step) + 'px,' + ((from.y - to.y) * step) + 'px)' },
            { transform: 'translate(0,0)' }
        ], { duration: 120, easing: 'ease-out' });
    }
    for (let y = 0; y < grid.size; y++) {
        for (let x = 0; x < grid.size; x++) {
            const tile = grid.cellContent({ x: x, y: y });
            const cell = cells[y * grid.size + x];
            cell.textContent = '';
            if (!tile) continue;

            const digits = String(tile.value).length;
            const valueClass = tile.value <= 2048 ? tile.value : 'super';
            const digitClass = digits >= 6 ? 'digits-many' : 'digits-' + digits;
            const piece = document.createElement('span');
            piece.className = 'game2048-tile game2048-tile-' + valueClass + ' ' + digitClass;
            piece.textContent = tile.value;
            cell.appendChild(piece);
            if (tile.mergedFrom) {
                piece.classList.add('is-merged');
                if (animate) {
                    piece.style.animationDelay = '120ms';
                    tile.mergedFrom.forEach(function(source) {
                        const ghost = document.createElement('span');
                        ghost.className = 'game2048-merge-source game2048-tile-' + (source.value <= 2048 ? source.value : 'super');
                        ghost.textContent = source.value;
                        ghost.setAttribute('aria-hidden', 'true');
                        cell.appendChild(ghost);
                        const movement = slide(ghost, source.previousPosition || source, tile);
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
    this.message.hidden = !metadata.terminated;
    this.message.textContent = metadata.terminated ? t(metadata.over ? 'gameOver' : 'gameWon') : '';
    this.keepPlayingButton.hidden = !metadata.terminated || metadata.over;
};

Game2048Actuator.prototype.continueGame = function() {
    this.message.hidden = true;
    this.keepPlayingButton.hidden = true;
};

function initGame2048() {
    window.game2048 = new GameManager(
        4,
        Game2048InputManager,
        Game2048Actuator,
        Game2048StorageManager
    );
}

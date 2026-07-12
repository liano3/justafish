/*
 * Core game logic adapted from Gabriele Cirulli's 2048.
 * https://github.com/gabrielecirulli/2048
 *
 * The MIT License (MIT)
 * Copyright (c) 2014 Gabriele Cirulli
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

function Tile(position, value) {
    this.x = position.x;
    this.y = position.y;
    this.value = value || 2;
    this.previousPosition = null;
    this.mergedFrom = null;
}

Tile.prototype.savePosition = function() {
    this.previousPosition = { x: this.x, y: this.y };
};

Tile.prototype.updatePosition = function(position) {
    this.x = position.x;
    this.y = position.y;
};

Tile.prototype.serialize = function() {
    return { position: { x: this.x, y: this.y }, value: this.value };
};

function Grid(size, previousState) {
    this.size = size;
    this.cells = previousState ? this.fromState(previousState) : this.empty();
}

Grid.prototype.empty = function() {
    var cells = [];
    for (var x = 0; x < this.size; x++) {
        var row = cells[x] = [];
        for (var y = 0; y < this.size; y++) row.push(null);
    }
    return cells;
};

Grid.prototype.fromState = function(state) {
    var cells = [];
    for (var x = 0; x < this.size; x++) {
        var row = cells[x] = [];
        for (var y = 0; y < this.size; y++) {
            var tile = state[x][y];
            row.push(tile ? new Tile(tile.position, tile.value) : null);
        }
    }
    return cells;
};

Grid.prototype.randomAvailableCell = function() {
    var cells = this.availableCells();
    if (cells.length) return cells[Math.floor(Math.random() * cells.length)];
};

Grid.prototype.availableCells = function() {
    var cells = [];
    this.eachCell(function(x, y, tile) {
        if (!tile) cells.push({ x: x, y: y });
    });
    return cells;
};

Grid.prototype.eachCell = function(callback) {
    for (var x = 0; x < this.size; x++) {
        for (var y = 0; y < this.size; y++) callback(x, y, this.cells[x][y]);
    }
};

Grid.prototype.cellsAvailable = function() {
    return !!this.availableCells().length;
};

Grid.prototype.cellAvailable = function(cell) {
    return !this.cellOccupied(cell);
};

Grid.prototype.cellOccupied = function(cell) {
    return !!this.cellContent(cell);
};

Grid.prototype.cellContent = function(cell) {
    return this.withinBounds(cell) ? this.cells[cell.x][cell.y] : null;
};

Grid.prototype.insertTile = function(tile) {
    this.cells[tile.x][tile.y] = tile;
};

Grid.prototype.removeTile = function(tile) {
    this.cells[tile.x][tile.y] = null;
};

Grid.prototype.withinBounds = function(position) {
    return position.x >= 0 && position.x < this.size &&
        position.y >= 0 && position.y < this.size;
};

Grid.prototype.serialize = function() {
    var cellState = [];
    for (var x = 0; x < this.size; x++) {
        var row = cellState[x] = [];
        for (var y = 0; y < this.size; y++) {
            row.push(this.cells[x][y] ? this.cells[x][y].serialize() : null);
        }
    }
    return { size: this.size, cells: cellState };
};

function GameManager(size, InputManager, Actuator, StorageManager) {
    this.size = size;
    this.inputManager = new InputManager();
    this.storageManager = new StorageManager();
    this.actuator = new Actuator();
    this.startTiles = 2;

    this.inputManager.on('move', this.move.bind(this));
    this.inputManager.on('restart', this.restart.bind(this));
    this.inputManager.on('keepPlaying', this.keepPlayingAfterWin.bind(this));
    this.setup();
}

GameManager.prototype.restart = function() {
    this.storageManager.clearGameState();
    this.actuator.continueGame();
    this.setup();
};

GameManager.prototype.keepPlayingAfterWin = function() {
    this.keepPlaying = true;
    this.actuator.continueGame();
    this.actuate();
};

GameManager.prototype.isGameTerminated = function() {
    return this.over || (this.won && !this.keepPlaying);
};

GameManager.prototype.setup = function() {
    var previousState = this.storageManager.getGameState();
    if (previousState) {
        this.grid = new Grid(previousState.grid.size, previousState.grid.cells);
        this.score = previousState.score;
        this.over = previousState.over;
        this.won = previousState.won;
        this.keepPlaying = previousState.keepPlaying;
    } else {
        this.grid = new Grid(this.size);
        this.score = 0;
        this.over = false;
        this.won = false;
        this.keepPlaying = false;
        this.addStartTiles();
    }
    this.actuate();
};

GameManager.prototype.addStartTiles = function() {
    for (var i = 0; i < this.startTiles; i++) this.addRandomTile();
};

GameManager.prototype.addRandomTile = function() {
    if (!this.grid.cellsAvailable()) return;
    var value = Math.random() < 0.9 ? 2 : 4;
    this.grid.insertTile(new Tile(this.grid.randomAvailableCell(), value));
};

GameManager.prototype.actuate = function() {
    if (this.storageManager.getBestScore() < this.score) {
        this.storageManager.setBestScore(this.score);
    }
    if (this.over) this.storageManager.clearGameState();
    else this.storageManager.setGameState(this.serialize());

    this.actuator.actuate(this.grid, {
        score: this.score,
        over: this.over,
        won: this.won,
        bestScore: this.storageManager.getBestScore(),
        terminated: this.isGameTerminated()
    });
};

GameManager.prototype.serialize = function() {
    return {
        grid: this.grid.serialize(),
        score: this.score,
        over: this.over,
        won: this.won,
        keepPlaying: this.keepPlaying
    };
};

GameManager.prototype.prepareTiles = function() {
    this.grid.eachCell(function(x, y, tile) {
        if (!tile) return;
        tile.mergedFrom = null;
        tile.savePosition();
    });
};

GameManager.prototype.moveTile = function(tile, cell) {
    this.grid.cells[tile.x][tile.y] = null;
    this.grid.cells[cell.x][cell.y] = tile;
    tile.updatePosition(cell);
};

GameManager.prototype.move = function(direction) {
    if (this.isGameTerminated()) return;

    var self = this;
    var vector = this.getVector(direction);
    var traversals = this.buildTraversals(vector);
    var moved = false;
    this.prepareTiles();

    traversals.x.forEach(function(x) {
        traversals.y.forEach(function(y) {
            var cell = { x: x, y: y };
            var tile = self.grid.cellContent(cell);
            if (!tile) return;

            var positions = self.findFarthestPosition(cell, vector);
            var next = self.grid.cellContent(positions.next);
            if (next && next.value === tile.value && !next.mergedFrom) {
                var merged = new Tile(positions.next, tile.value * 2);
                merged.mergedFrom = [tile, next];
                self.grid.insertTile(merged);
                self.grid.removeTile(tile);
                tile.updatePosition(positions.next);
                self.score += merged.value;
                if (merged.value === 2048) self.won = true;
            } else {
                self.moveTile(tile, positions.farthest);
            }

            if (!self.positionsEqual(cell, tile)) moved = true;
        });
    });

    if (!moved) return;
    this.addRandomTile();
    if (!this.movesAvailable()) this.over = true;
    this.actuate();
};

GameManager.prototype.getVector = function(direction) {
    return {
        0: { x: 0, y: -1 },
        1: { x: 1, y: 0 },
        2: { x: 0, y: 1 },
        3: { x: -1, y: 0 }
    }[direction];
};

GameManager.prototype.buildTraversals = function(vector) {
    var traversals = { x: [], y: [] };
    for (var position = 0; position < this.size; position++) {
        traversals.x.push(position);
        traversals.y.push(position);
    }
    if (vector.x === 1) traversals.x.reverse();
    if (vector.y === 1) traversals.y.reverse();
    return traversals;
};

GameManager.prototype.findFarthestPosition = function(cell, vector) {
    var previous;
    do {
        previous = cell;
        cell = { x: previous.x + vector.x, y: previous.y + vector.y };
    } while (this.grid.withinBounds(cell) && this.grid.cellAvailable(cell));
    return { farthest: previous, next: cell };
};

GameManager.prototype.movesAvailable = function() {
    return this.grid.cellsAvailable() || this.tileMatchesAvailable();
};

GameManager.prototype.tileMatchesAvailable = function() {
    for (var x = 0; x < this.size; x++) {
        for (var y = 0; y < this.size; y++) {
            var tile = this.grid.cellContent({ x: x, y: y });
            if (!tile) continue;
            for (var direction = 0; direction < 4; direction++) {
                var vector = this.getVector(direction);
                var other = this.grid.cellContent({ x: x + vector.x, y: y + vector.y });
                if (other && other.value === tile.value) return true;
            }
        }
    }
    return false;
};

GameManager.prototype.positionsEqual = function(first, second) {
    return first.x === second.x && first.y === second.y;
};

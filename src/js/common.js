function $(id) { return document.getElementById(id); }

function t(key, values = {}) {
    return window.PAGE_I18N[key].replace(/\{(\w+)\}/g, (match, name) => values[name] ?? match);
}

function shuffle(items) {
    const result = items.slice();
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

function readStored(key, fallback, validate) {
    try {
        const value = JSON.parse(localStorage.getItem(key));
        return validate(value) ? value : fallback;
    } catch {
        return fallback;
    }
}

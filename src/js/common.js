function $(id) { return document.getElementById(id); }

function t(key, replacements) {
    var dictionary = window.PAGE_I18N || {};
    var value = dictionary[key] || key;
    if (!replacements) return value;
    Object.keys(replacements).forEach(function(name) {
        value = value.replace(new RegExp('\\{' + name + '\\}', 'g'), String(replacements[name]));
    });
    return value;
}

function formatTime(seconds) {
    var m = Math.floor(seconds / 60);
    var s = seconds % 60;
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}

function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
}

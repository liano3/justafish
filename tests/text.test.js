const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createSeoData } = require('../src/build/render');
const { DEFAULT_CONFIG } = require('../src/config/default');
const { UI_TEXT } = require('../src/build/i18n');

test('translations preserve literal replacement characters in user content', () => {
    const literal = "$& $$ $` $'";
    const context = { window: { PAGE_I18N: { sample: '{value} / {value}' } } };
    vm.createContext(context);
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/js/common.js'), 'utf8'), context);
    assert.equal(context.t('sample', { value: literal }), `${literal} / ${literal}`);
    const seo = createSeoData({ ...DEFAULT_CONFIG.profile, introduction: literal }, 'en', UI_TEXT.en);
    assert.ok(seo.description.endsWith(literal));
});

test('both languages provide all runtime translations', () => {
    assert.deepEqual(Object.keys(UI_TEXT.zh).sort(), Object.keys(UI_TEXT.en).sort());
    const { MAIN_RUNTIME_TEXT_KEYS } = require('../src/build/i18n');
    for (const locale of ['zh', 'en']) for (const key of MAIN_RUNTIME_TEXT_KEYS) assert.equal(typeof UI_TEXT[locale][key], 'string');
    const { APPS } = require('../src/config/apps');
    for (const app of APPS) for (const key of app.runtime) {
        for (const locale of ['zh', 'en']) assert.equal(typeof UI_TEXT[locale][key], 'string');
    }
});

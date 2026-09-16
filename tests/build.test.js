const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { spawnSync } = require('node:child_process');
const root = path.join(__dirname, '..');

test('builds both languages and respects page switches with shared navigation', async t => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'justafish-test-'));
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
    fs.cpSync(path.join(root, 'src'), path.join(dir, 'src'), { recursive: true });
    fs.copyFileSync(path.join(root, 'build.js'), path.join(dir, 'build.js'));
    const variants = [{}, { home: false }, { apps: false }, { bookmarks: false, language: false }, { home: false, resume: false, bookmarks: false, apps: false }];
    for (const pages of variants) {
        await t.test(JSON.stringify(pages), () => {
            const build = spawnSync(process.execPath, ['build.js'], {
                cwd: dir, encoding: 'utf8',
                env: { PATH: process.env.PATH, PAGES_JSON: JSON.stringify(pages), PROFILE_JSON: JSON.stringify({ name: 'A & B', slogan: '$& costs <5', footer: { showVisitorCount: false } }) }
            });
            assert.equal(build.status, 0, build.stderr);
            const dist = path.join(dir, 'dist');
            const homepage = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
            const enabled = ['home', 'resume', 'bookmarks', 'apps'].filter(id => pages[id] !== false);
            if (!enabled.length) enabled.push('home');
            if (enabled.includes('home')) assert.ok(homepage.includes('$&amp; costs &lt;5'));
            for (const locale of ['', 'en/']) {
                if (locale && pages.language === false) {
                    assert.equal(fs.existsSync(path.join(dist, locale)), false);
                    continue;
                }
                const paths = [locale + 'index.html'];
                if (pages.apps !== false) for (const id of ['2048', 'countdown', 'memory', 'pomodoro', 'random-picker', 'schulte']) paths.push(locale + 'apps/' + id + '/index.html');
                for (const file of paths) {
                    const html = fs.readFileSync(path.join(dist, file), 'utf8');
                    assert.doesNotMatch(html, /{{[A-Z0-9_]+}}/);
                    const nav = html.match(/<nav class="nav">([\s\S]*?)<\/nav>/)[1];
                    assert.deepEqual([...nav.matchAll(/data-page="([^"]+)"/g)].map(match => match[1]), enabled);
                    if (pages.language === false) assert.doesNotMatch(html, /class="language-switch"/);
                    for (const [, source] of html.matchAll(/<script src="([^"]+)"/g)) {
                        const script = path.resolve(dist, path.dirname(file), source);
                        assert.ok(fs.existsSync(script), script);
                        new vm.Script(fs.readFileSync(script, 'utf8'));
                    }
                }
            }
            assert.equal(fs.existsSync(path.join(dist, 'apps')), pages.apps !== false);
        });
    }
});

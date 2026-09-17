const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { spawnSync } = require('node:child_process');
const root = path.join(__dirname, '..');

test('resume renders arbitrary profiles, optional sections and safe author highlighting', t => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'justafish-resume-'));
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
    fs.cpSync(path.join(root, 'src'), path.join(dir, 'src'), { recursive: true });
    fs.copyFileSync(path.join(root, 'build.js'), path.join(dir, 'build.js'));
    const env = {
        PATH: process.env.PATH,
        PAGES_JSON: JSON.stringify({ home: false, bookmarks: false, apps: false }),
        PROFILE_JSON: JSON.stringify({ name: 'Alex Doe', authorNames: [' A. Doe ', null, 3], footer: { showVisitorCount: false } }),
        EDUCATION_JSON: JSON.stringify([{ title: 'Example <University>', subtitle: 'M.S. · Computing', date: '2024–2026', description: 'Research & Teaching', descriptionUrl: 'https://example.org/lab?a=1&b=2' }]),
        STUDENT_WORK_JSON: JSON.stringify([{ title: 'Teaching Assistant', subtitle: 'Data & Society' }, { title: 'Representative', subtitle: 'Student Council', date: '2020–2022' }]),
        AWARDS_JSON: JSON.stringify([{ title: 'Scholarship', subtitle: 'First Class', description: 'For research achievement' }]),
        PROJECTS_JSON: JSON.stringify([{ title: 'Example Project', author: 'Example Team', description: '', tag: [], result: '', url: '' }]),
        PAPERS_JSON: JSON.stringify([
            { title: 'Example Paper', author: 'Alex Doe, Alex Doering； A. Doe，<script>alert(1)</script>', description: '', tag: ['AI'], result: 'Conference 2026', url: 'javascript:alert(1)' },
            { title: 'Minimal Paper', author: '', description: '', tag: [], result: '', url: '' }
        ])
    };
    const build = () => {
        const result = spawnSync(process.execPath, ['build.js'], { cwd: dir, encoding: 'utf8', env });
        assert.equal(result.status, 0, result.stderr);
        return ['', 'en/'].map(locale => fs.readFileSync(path.join(dir, 'dist', locale, 'index.html'), 'utf8'));
    };
    for (const html of build()) {
        assert.ok(html.includes('Example &lt;University&gt;'));
        assert.ok(html.includes('class="resume-entry-subtitle">M.S. · Computing</span>'));
        assert.ok(html.includes('class="resume-entry-date">2024–2026</div>'));
        assert.ok(html.includes('https://example.org/lab?a=1&amp;b=2'));
        assert.ok(html.includes('Data &amp; Society'));
        assert.ok(html.includes('Student Council'));
        assert.ok(html.includes('id="awardsHeading"'));
        assert.ok(html.includes('class="resume-entry-subtitle">First Class</span>'));
        assert.ok(html.includes('class="resume-entry-description">For research achievement</p>'));
        assert.ok(html.indexOf('id="publicationsHeading"') < html.indexOf('id="projectsHeading"'));
        assert.equal((html.match(/class="work-author-self"/g) || []).length, 2);
        assert.ok(html.includes('<strong class="work-author-self">Alex Doe</strong>, Alex Doering'));
        assert.ok(html.includes('<strong class="work-author-self">A. Doe</strong>'));
        assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
        assert.ok(!html.includes('href="javascript:'));
        const minimal = html.match(/<article class="work-entry">\s*<h3>Minimal Paper<\/h3>([\s\S]*?)<\/article>/)[1];
        assert.equal(minimal.trim(), '');
        const linkedPaper = html.match(/<article class="work-entry">\s*<div class="work-header">([\s\S]*?)<h3>Example Paper<\/h3>/)[1];
        assert.ok(!linkedPaper.includes('class="work-links"'));
        assert.ok(!linkedPaper.includes('href="#"'));
        assert.ok(linkedPaper.includes('Conference 2026'));
        assert.doesNotMatch(html, /{{[A-Z0-9_]+}}/);
        assert.doesNotMatch(html, /download="/);
    }
    fs.writeFileSync(path.join(dir, 'resume.pdf'), '%PDF-1.7');
    fs.writeFileSync(path.join(dir, 'resume-en.pdf'), '%PDF-1.7');
    const [zhWithPdf, enWithPdf] = build();
    assert.match(zhWithPdf, /href="\/resume.pdf" download="Alex Doe-简历.pdf"/);
    assert.match(enWithPdf, /href="\/resume-en.pdf" download="Alex-Doe-Resume.pdf"/);
    env.AWARDS_JSON = '[]';
    env.EDUCATION_JSON = '[]';
    env.STUDENT_WORK_JSON = '[]';
    env.PAPERS_JSON = '[]';
    env.PROJECTS_JSON = '[]';
    for (const html of build()) {
        assert.doesNotMatch(html, /id="(?:education|studentWork|awards|publications|projects)Heading"/);
    }
});

test('builds both languages and respects page switches with shared navigation', async t => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'justafish-test-'));
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
    fs.cpSync(path.join(root, 'src'), path.join(dir, 'src'), { recursive: true });
    fs.copyFileSync(path.join(root, 'build.js'), path.join(dir, 'build.js'));
    const variants = [{}, { home: false }, { apps: false }, { bookmarks: false, language: false }, { home: false, resume: false, bookmarks: false, apps: false }, { home: true, resume: false, bookmarks: false, apps: false, language: false }];
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
            const js = fs.readFileSync(path.resolve(dist, homepage.match(/<script src="([^"]+)"/)[1]), 'utf8');
            const css = fs.readFileSync(path.resolve(dist, homepage.match(/<link rel="stylesheet" href="([^"]+)"/)[1]), 'utf8');
            for (const [id, fn, selector] of [['home', 'initAnnouncements', '.hero'], ['resume', 'initResumeActions', '.resume-container'], ['bookmarks', 'initBookmarkSearch', '.bookmark-link']]) {
                assert.equal(js.includes('function ' + fn), enabled.includes(id));
                assert.equal(css.includes(selector), enabled.includes(id));
            }
            assert.ok(homepage.includes('id="' + enabled[0] + '" class="page active"'));
            assert.doesNotMatch(homepage, /onclick=/);
            assert.doesNotMatch(js + css, /(?:PAGE|FEATURE):[a-z]+:(?:START|END)/);
            assert.equal((css.match(/\{/g) || []).length, (css.match(/\}/g) || []).length);
            if (enabled.includes('home')) assert.ok(homepage.includes('$&amp; costs &lt;5'));
            for (const locale of ['', 'en/']) {
                if (locale && pages.language === false) {
                    assert.equal(fs.existsSync(path.join(dist, locale)), false);
                    continue;
                }
                if (pages.apps !== false) {
                    assert.deepEqual(fs.readdirSync(path.join(dist, locale, 'apps')).sort(), ['2048', 'countdown', 'random-picker', 'schulte']);
                }
                const paths = [locale + 'index.html'];
                if (pages.apps !== false) for (const id of ['2048', 'countdown', 'random-picker', 'schulte']) paths.push(locale + 'apps/' + id + '/index.html');
                for (const file of paths) {
                    const html = fs.readFileSync(path.join(dist, file), 'utf8');
                    assert.doesNotMatch(html, /{{[A-Z0-9_]+}}/);
                    for (const [, source] of html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)) {
                        const css = fs.readFileSync(path.resolve(dist, path.dirname(file), source), 'utf8');
                        if (file.includes('apps/')) assert.doesNotMatch(css, /\.(?:resume-container|bookmark-link|hero-avatar)/);
                    }
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

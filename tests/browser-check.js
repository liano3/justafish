async function browserCheck(page) {
    const base = await page.evaluate(() => location.origin);
    const checks = [];
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
        if (message.type() === 'error') errors.push(message.text());
    });
    const assert = (condition, message) => { if (!condition) throw new Error(message); };
    const goto = path => page.goto(base + path);
    // Check the first render independently of the deferred application script.
    const initial = await page.context().newPage();
    await initial.route('**/assets/site.*.js', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
    const assertInitialPage = async expected => {
        await initial.waitForLoadState('load');
        const state = await initial.evaluate(() => ({
            visible: [...document.querySelectorAll('.page')].filter(el => getComputedStyle(el).display !== 'none').map(el => el.id),
            selected: [...document.querySelectorAll('.nav-link, .mobile-nav-link')].filter(el => getComputedStyle(el).backgroundColor !== 'rgba(0, 0, 0, 0)').map(el => el.dataset.page)
        }));
        assert(JSON.stringify(state.visible) === JSON.stringify([expected]), 'First render content: ' + JSON.stringify(state));
        assert(JSON.stringify(state.selected) === JSON.stringify([expected, expected]), 'First render navigation: ' + JSON.stringify(state));
    };
    for (const locale of ['', 'en/']) {
        for (const id of ['resume', 'bookmarks', 'apps']) {
            await initial.goto(base + '/' + locale + '?initial=' + id + '#' + id);
            await assertInitialPage(id);
            await initial.reload();
            await assertInitialPage(id);
        }
        await initial.goto(base + '/' + locale + '?initial=invalid#invalid');
        await assertInitialPage('home');
        await initial.goto(base + '/' + locale + 'apps/countdown/');
        await initial.locator('.app-detail-back').click();
        await assertInitialPage('apps');
    }
    await initial.close();
    checks.push('Correct initial content and both navigation bars before application JS, including reload and app return');
    await goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.locator('.nav').getByRole('link', { name: '简历', exact: true }).click();
    assert(page.url().endsWith('/#resume'), 'Resume navigation');
    assert(await page.locator('#resume').isVisible(), 'Resume content');
    await page.getByRole('link', { name: 'Switch to English' }).click();
    assert(page.url().endsWith('/en/#resume'), 'Language must retain current section');
    await page.getByRole('button', { name: 'Switch to dark mode' }).click();
    await goto('/apps/countdown/');
    assert(await page.locator('html').getAttribute('data-theme') === 'dark', 'Shared theme');
    assert(await page.locator('.sun-icon').isVisible() && await page.locator('.moon-icon').isHidden(), 'Dark theme shows the sun icon');
    await page.getByRole('button', { name: '切换到浅色模式' }).click();
    assert(await page.locator('.moon-icon').isVisible() && await page.locator('.sun-icon').isHidden(), 'Light theme shows the moon icon');
    checks.push('Shared navigation, language switching and persistent theme');

    await goto('/#bookmarks');
    const category = page.locator('.bookmark-category').first();
    const header = category.locator('.category-header');
    const links = category.locator('.bookmark-links');
    assert(await links.isVisible(), 'Initial bookmark group is expanded');
    await header.click();
    assert(await links.isHidden(), 'Category button collapses the group');
    const query = await category.locator('.bookmark-link-heading > span').first().innerText();
    await page.locator('#bookmarkSearch').fill(query);
    assert(await links.isVisible(), 'Search expands the matching group');
    await page.locator('#bookmarkSearchClear').click();
    assert(await links.isHidden(), 'Clearing search restores the collapsed state');
    await header.click();
    assert(await links.isVisible(), 'Category button reopens the group');
    checks.push('Bookmark expansion and search restoration use one state');

    await goto('/apps/2048/');
    const seedBoard = async rows => {
        await page.evaluate(rows => {
            const cells = Array.from({ length: 4 }, (_, x) => Array.from({ length: 4 }, (_, y) => rows[y][x] ? { position: { x, y }, value: rows[y][x] } : null));
            localStorage.setItem('game2048State', JSON.stringify({ grid: { size: 4, cells }, score: 0, over: false, won: false, keepPlaying: false }));
        }, rows);
        await page.reload();
        await page.locator('#game2048Board').focus();
    };
    await seedBoard([[1024, 1024, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]);
    await page.locator('#game2048Board').press('ArrowLeft');
    assert(await page.locator('#game2048MessageText').innerText() === '达到 2048', '2048 win message');
    assert(await page.locator('#game2048Message').evaluate(el => el.classList.contains('show')), '2048 win overlay');
    await page.locator('[data-2048-continue]').click();
    assert(!(await page.locator('#game2048Message').evaluate(el => el.classList.contains('show'))), '2048 continue button');
    assert(await page.locator('#game2048Board').evaluate(el => document.activeElement === el), 'Keyboard focus after continue');
    const boardBefore = await page.evaluate(() => JSON.stringify(window.game2048.serialize().grid));
    await page.keyboard.press('ArrowRight');
    assert(await page.evaluate(() => JSON.stringify(window.game2048.serialize().grid)) !== boardBefore, 'Keyboard works after continue');
    await seedBoard([[2, 4, 8, 16], [32, 64, 128, 256], [512, 1024, 2, 4], [8, 16, 32, 0]]);
    await page.locator('#game2048Board').press('ArrowRight');
    assert(await page.locator('#game2048MessageText').innerText() === '游戏结束', '2048 loss message');
    assert(await page.locator('[data-2048-continue]').isHidden(), 'Hide continue after loss');
    await page.locator('#game2048Message [data-2048-restart]').click();
    assert(await page.locator('.game2048-tile').count() === 2, '2048 restart');
    assert(await page.locator('#game2048Board').evaluate(el => document.activeElement === el), 'Keyboard focus after restart');
    checks.push('2048 actual winning move, continue, loss and restart');

    await goto('/apps/random-picker/');
    const first = page.locator('.random-picker-option-input').first();
    await first.fill('测试');
    await first.dispatchEvent('keydown', { key: 'Enter', isComposing: true, keyCode: 229, bubbles: true, cancelable: true });
    assert(await page.locator('.random-picker-option').count() === 1, 'IME must not create row');
    await first.press('Enter');
    assert(await page.locator('.random-picker-option').count() === 2, 'Ordinary Enter must create row');
    await first.fill('');
    await first.press('Backspace');
    assert(await page.locator('.random-picker-option').count() === 1, 'Remove first row');
    assert(await first.evaluate(el => document.activeElement === el), 'Focus surviving row');
    await first.fill('唯一候选');
    await page.getByRole('button', { name: '开始抽取' }).click();
    await page.waitForFunction(() => !document.getElementById('randomPickerDraw').disabled);
    assert(await page.locator('#randomPickerResult').innerText() === '唯一候选', 'Draw result');
    checks.push('IME Enter, ordinary Enter, first-row deletion focus and draw');

    for (const deduplicate of [true, false]) {
        await page.locator('#randomPickerReset').click();
        await first.fill('同一候选');
        await first.press('Enter');
        await page.locator('.random-picker-option-input').nth(1).fill(' 同一候选 ');
        await page.locator('#randomPickerDeduplicate').setChecked(deduplicate);
        await page.locator('#randomPickerRemove').check();
        await page.locator('#randomPickerDraw').click();
        await page.waitForFunction(() => !document.getElementById('randomPickerDraw').disabled);
        const remaining = (await first.inputValue()).trim();
        assert(remaining === (deduplicate ? '' : '同一候选'), 'Remove all equal values only when deduplicating');
        await page.locator('#randomPickerDraw').click();
        await page.waitForFunction(() => !document.getElementById('randomPickerDraw').disabled);
        assert(await page.locator('#randomPickerHistory li').count() === (deduplicate ? 1 : 2), 'Deduplicated option cannot be drawn twice');
    }
    checks.push('Duplicate removal honors normalized values and the deduplication option');

    await goto('/apps/schulte/');
    await page.getByRole('button', { name: '点击开始' }).focus();
    await page.keyboard.press('Enter');
    for (let number = 1; number <= 25; number++) {
        await page.locator('#schulteGrid').getByRole('button', { name: String(number), exact: true }).focus();
        await page.keyboard.press('Space');
    }
    assert(await page.locator('.schulte-cell.correct').count() === 25, 'Complete grid with keyboard');
    assert((await page.locator('#schulteStatus').innerText()).includes('完成'), 'Schulte announces completion');
    assert(await page.locator('#schulteRestart').evaluate(el => document.activeElement === el), 'Focus restart after completion');
    await page.keyboard.press('Enter');
    assert(await page.locator('#schulteOverlay').isVisible(), 'Schulte restart');
    checks.push('Schulte keyboard start, all 25 numbers and restart');

    let resolveUnlock;
    let unlockArrived;
    const passwords = [];
    let failReply = false;
    await page.route('**/api/chat', async route => {
        const body = route.request().postDataJSON();
        if (!body.messages) {
            resolveUnlock = () => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ unlocked: true, greeting: 'Mock greeting' }) });
            unlockArrived();
            return;
        }
        passwords.push(body.password);
        if (failReply) { failReply = false; await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }); return; }
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ reply: 'Mock reply' }) });
    });
    await goto('/#bookmarks');
    await page.locator('#bookmarkSearch').fill('submitted-password');
    const unlock = new Promise(resolve => { unlockArrived = resolve; });
    await page.locator('#bookmarkSearch').press('Enter');
    await unlock;
    await page.locator('#bookmarkSearch').fill('changed-query');
    await resolveUnlock();
    await page.locator('#aiChatInput').fill('Test message');
    await page.locator('#aiChatSend').click();
    await page.waitForFunction(() => !document.getElementById('aiChatSend').disabled);
    assert(passwords[0] === 'submitted-password', 'Capture submitted password');
    assert((await page.locator('#aiChatMessages').innerText()).includes('Mock reply'), 'Chat reply');
    await page.locator('#aiChatClose').click();
    assert(await page.locator('#bookmarkSearch').inputValue() === 'changed-query', 'Do not erase newer search');
    await page.locator('#bookmarkSearch').fill('submitted-password');
    const reopen = new Promise(resolve => { unlockArrived = resolve; });
    await page.locator('#bookmarkSearch').press('Enter');
    await reopen;
    await resolveUnlock();
    await page.locator('#aiChatInput').waitFor({ state: 'visible' });
    await page.locator('#aiChatInput').focus();
    await page.keyboard.press('Shift+Tab');
    assert(await page.locator('#aiChatClose').evaluate(el => el === document.activeElement), 'Native dialog keyboard navigation');
    failReply = true;
    await page.locator('#aiChatInput').fill('Retry this');
    await page.locator('#aiChatSend').click();
    await page.waitForFunction(() => !document.getElementById('aiChatSend').disabled);
    assert(await page.locator('#aiChatInput').inputValue() === 'Retry this', 'Failed message remains editable');
    await page.locator('#aiChatSend').click();
    await page.waitForFunction(() => document.getElementById('aiChatMessages').textContent.includes('Mock reply'));
    await page.keyboard.press('Escape');
    assert(await page.locator('#bookmarkSearch').evaluate(el => el === document.activeElement), 'Chat restores focus');
    checks.push('Delayed chat unlock retains submitted password and newer search');

    await page.unroute('**/api/chat');
    for (const [locale, placeholder] of [['', '年-月-日'], ['en/', 'YYYY-MM-DD']]) {
        await goto('/' + locale + 'apps/countdown/');
        const input = page.locator('#countdownDate');
        assert(await input.getAttribute('placeholder') === placeholder, 'Date hint follows page language');
        for (const invalid of ['2026-02-29', '2026-04-31', '0000-01-01', '09/18/2026']) {
            await input.fill(invalid);
            assert(await input.evaluate(el => !el.checkValidity()), 'Reject invalid date: ' + invalid);
        }
        await input.fill('2024-02-29');
        assert(await input.evaluate(el => el.checkValidity()), 'Accept a valid leap day');
        await page.locator('#countdownDatePicker').evaluate(el => {
            el.value = '2026-12-31';
            el.dispatchEvent(new Event('change', { bubbles: true }));
        });
        assert(await input.inputValue() === '2026-12-31', 'Calendar selection uses the same date format');
        await page.locator('#countdownForm').evaluate(el => el.reset());
        assert(await input.inputValue() === '', 'Reset clears the displayed date');
    }
    checks.push('Date hints follow page language; leap-day validation, calendar synchronization and reset');
    await page.clock.install({ time: new Date('2026-09-16T12:00:00+08:00') });
    await goto('/apps/countdown/');
    const add = async (name, date, checked) => {
        await page.locator('#countdownName').fill(name);
        await page.locator('#countdownDate').fill(date);
        await page.locator('#countdownAutoConvert').setChecked(checked);
        await page.getByRole('button', { name: '添加事件' }).click();
    };
    await add('   ', '2026-09-16', true);
    assert(await page.locator('.countdown-item').count() === 0, 'Reject whitespace-only names');
    assert(await page.locator('#countdownName').evaluate(input => !input.validity.valid), 'Show native validation for blank name');
    await add('保留', '2026-09-16', true);
    await add('移除', '2026-09-16', false);
    assert(await page.locator('#countdownList .countdown-item').count() === 2, 'Keep both due-today events');
    assert(await page.locator('#countdownList input').count() === 0, 'No checkbox inside countdown cards');
    await page.locator('.countdown-delete').first().focus();
    const focused = await page.locator('.countdown-delete').first().elementHandle();
    await page.clock.runFor(60000);
    assert(await focused.evaluate(el => el.isConnected && el === document.activeElement), 'Minute tick retains node and focus');
    await page.clock.setSystemTime(new Date('2026-09-17T00:00:00+08:00'));
    await page.clock.runFor(60000);
    assert(await page.locator('#countdownList .countdown-item').count() === 0, 'Process following day');
    assert(await page.locator('#anniversaryList .countdown-item').count() === 1, 'Only opted-in event converts');
    assert(await page.locator('#anniversaryList .countdown-remaining').innerText() === '还有 364 天', 'Anniversary emphasizes days until the next occurrence');
    assert(await page.locator('#anniversaryList .countdown-duration').innerText() === '11个月30天', 'Anniversary duration uses the next occurrence');
    assert(!(await page.locator('#anniversaryList').innerText()).includes('已过去'), 'Do not show elapsed anniversary days');
    assert(await page.locator('.countdown-item').first().evaluate(el => getComputedStyle(el.querySelector('.countdown-remaining')).fontSize === getComputedStyle(el.querySelector('h3')).fontSize), 'Remaining days use the event title font size');
    await add('当天纪念日', '2000-09-17', false);
    await add('明天纪念日', '2000-09-18', false);
    assert(await page.locator('.countdown-item').filter({ hasText: '当天纪念日' }).locator('.countdown-remaining').innerText() === '就是今天', 'Today anniversary stays today');
    assert(await page.locator('.countdown-item').filter({ hasText: '明天纪念日' }).locator('.countdown-remaining').innerText() === '还有 1 天', 'Upcoming anniversary stays in the current year');
    checks.push('Countdown zero day retained, next-day conversion and form-only option');

    await page.reload();
    assert(await page.locator('.countdown-item').count() === 3, 'Saved events survive reload');
    await page.getByRole('button', { name: '删除 明天纪念日', exact: true }).click();
    await goto('/en/apps/countdown/');
    assert(await page.locator('.countdown-item').count() === 2, 'Deletion persists across page navigation');
    assert(!(await page.locator('main').innerText()).includes('明天纪念日'), 'Deleted event stays removed');
    checks.push('Countdown additions and deletions persist after reload and language navigation');

    const mobile = await page.context().browser().newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    try {
        const touch = await mobile.newPage();
        for (const route of ['apps/random-picker/', 'apps/countdown/', '#bookmarks']) {
            await touch.goto(base + '/' + route);
            const controls = await touch.locator('main .field-input').evaluateAll(inputs => inputs.filter(input => input.checkVisibility()).map(input => ({ size: parseFloat(getComputedStyle(input).fontSize), height: input.getBoundingClientRect().height })));
            assert(controls.every(input => input.size >= 16 && input.height >= 44), 'Readable touch inputs: ' + route);
        }
        await touch.goto(base + '/apps/random-picker/');
        await touch.locator('#randomPickerAddOption').tap();
        assert(await touch.locator('.random-picker-option').count() === 2, 'Add row with touch');
        checks.push('Touch context: 16px input text, 44px fields and tap interactions');
    } finally { await mobile.close(); }

    const routes = ['', '#resume', '#bookmarks', '#apps', 'apps/random-picker/', 'apps/countdown/', 'apps/schulte/', 'apps/2048/'];
    let surfaces = 0;
    for (const locale of ['', 'en/']) {
        for (const route of routes) {
            await goto('/' + locale + route);
            assert((await page.locator('main').innerText()).trim().length > 0, 'Blank page: ' + page.url());
            for (const width of [1280, 390, 320]) {
                await page.setViewportSize({ width, height: 900 });
                assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Page overflow: ' + page.url());
                surfaces++;
            }
        }
    }
    checks.push('16 Chinese/English routes at 1280, 390 and 320 pixels (' + surfaces + ' layouts)');
    assert(errors.length === 0, errors.join('\n'));
    return { passed: true, checks, errors };
}

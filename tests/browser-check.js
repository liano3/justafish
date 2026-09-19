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
    assert(await page.locator('#game2048Message').innerText() === '达到 2048', '2048 win message');
    assert(await page.locator('#game2048Message').isVisible(), '2048 win status');
    const statusBelowBoard = () => page.locator('#game2048Message').evaluate(el => el.getBoundingClientRect().top >= document.getElementById('game2048Board').getBoundingClientRect().bottom);
    assert(await statusBelowBoard(), 'Win status does not cover the board');
    await page.locator('[data-2048-continue]').click();
    assert(await page.locator('#game2048Message').isHidden(), '2048 continue button');
    assert(await page.locator('#game2048Board').evaluate(el => document.activeElement === el), 'Keyboard focus after continue');
    const boardBefore = await page.evaluate(() => JSON.stringify(window.game2048.serialize().grid));
    await page.keyboard.press('ArrowRight');
    assert(await page.evaluate(() => JSON.stringify(window.game2048.serialize().grid)) !== boardBefore, 'Keyboard works after continue');
    await seedBoard([[2, 4, 8, 16], [32, 64, 128, 256], [512, 1024, 2, 4], [8, 16, 32, 0]]);
    await page.locator('#game2048Board').press('ArrowRight');
    assert(await page.locator('#game2048Message').innerText() === '游戏结束', '2048 loss message');
    assert(await page.locator('[data-2048-continue]').isHidden(), 'Hide continue after loss');
    assert(await statusBelowBoard(), 'Game-over status does not cover the board');
    await page.setViewportSize({ width: 390, height: 844 });
    assert(await statusBelowBoard(), 'Mobile game-over status stays below the board');
    await page.screenshot({ path: '/tmp/justafish-2048-finished-mobile.png', fullPage: true, animations: 'disabled' });
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.locator('[data-2048-restart]').click();
    assert(await page.locator('.game2048-tile').count() === 2, '2048 restart');
    assert(await page.locator('#game2048Board').evaluate(el => document.activeElement === el), 'Keyboard focus after restart');
    checks.push('2048 actual winning move, continue, loss and restart');

    await goto('/apps/random-picker/');
    const first = page.locator('#randomPickerOptions');
    await first.fill('测试');
    await first.dispatchEvent('keydown', { key: 'Enter', isComposing: true, bubbles: true, cancelable: true });
    assert(await first.inputValue() === '测试', 'IME Enter does not change the editor');
    await first.press('End');
    await first.press('Enter');
    await first.press('B');
    assert(await first.inputValue() === '测试\nB', 'Native multiline editing');
    await first.press('Backspace');
    await first.press('Backspace');
    assert(await first.inputValue() === '测试', 'Native line merging');
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await first.fill('');
    await page.evaluate(() => navigator.clipboard.writeText('粘贴甲\n粘贴乙'));
    await first.press('ControlOrMeta+V');
    assert(await first.inputValue() === '粘贴甲\n粘贴乙', 'Real clipboard paste retains line breaks');
    await first.fill('唯一候选');
    const editorGeometry = () => first.evaluate(el => {
        const rect = el.getBoundingClientRect();
        return { x: rect.x + scrollX, y: rect.y + scrollY, width: rect.width, height: rect.height, scrollTop: el.scrollTop, lineHeight: getComputedStyle(el).lineHeight };
    });
    const editorBefore = await editorGeometry();
    await page.locator('#randomPickerDraw').click();
    await page.locator('.random-picker-marker.is-active').waitFor();
    assert(await first.evaluate(el => el.readOnly && !el.disabled), 'Native editor stays visible and keeps its normal styling during drawing');
    const editorDuring = await editorGeometry();
    assert(JSON.stringify(editorBefore) === JSON.stringify(editorDuring), 'Drawing does not change editor geometry: ' + JSON.stringify({ editorBefore, editorDuring }));
    await page.waitForFunction(() => !document.getElementById('randomPickerDraw').disabled);
    assert(await page.locator('#randomPickerResult').innerText() === '唯一候选', 'Draw result');
    assert(await page.locator('.random-picker-marker.is-selected').count() === 1, 'Selected marker persists after drawing');
    await first.focus();
    assert(await page.locator('.random-picker-marker.is-selected').count() === 1, 'Focus does not clear selected markers');
    await first.press('End');
    await first.press('Space');
    assert(await page.locator('.random-picker-marker.is-selected').count() === 0, 'Editing clears stale markers');
    await page.locator('#randomPickerReset').click();
    await first.fill('同一候选\n 同一候选 \u2028另一个候选');
    await page.locator('#randomPickerDeduplicate').click();
    assert(await first.inputValue() === '同一候选\n另一个候选', 'Visible deduplication preserves order');
    await page.reload();
    assert(await first.inputValue() === '同一候选\n另一个候选', 'Deduplicated list persists');
    await page.locator('#randomPickerRemove').check();
    await page.locator('#randomPickerCount').fill('2');
    await page.locator('#randomPickerDraw').click();
    await page.waitForFunction(() => !document.getElementById('randomPickerDraw').disabled);
    assert(await first.inputValue() === '', 'Remove drawn entries');
    assert(await page.locator('#randomPickerResult strong').count() === 2, 'Draw both unique entries');
    await page.locator('#randomPickerReset').click();
    await first.fill('重复\n重复');
    await page.locator('#randomPickerDraw').click();
    await page.waitForFunction(() => !document.getElementById('randomPickerDraw').disabled);
    assert(await first.inputValue() === '重复', 'Without deduplication remove only the drawn row');
    await page.locator('#randomPickerDraw').click();
    await page.locator('#randomPickerReset').click();
    await page.waitForTimeout(1200);
    assert(await first.inputValue() === '' && await page.locator('#randomPickerResult').innerText() === '—', 'Clear cancels an in-flight draw');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await first.fill('低动效');
    await page.locator('#randomPickerDraw').click();
    await page.waitForFunction(() => !document.getElementById('randomPickerDraw').disabled);
    assert(await page.locator('#randomPickerResult').innerText() === '低动效', 'Reduced-motion drawing');
    await page.locator('#randomPickerRemove').uncheck();
    await first.fill('甲\n\n乙\n丙');
    await page.locator('#randomPickerCount').fill('3');
    await page.locator('#randomPickerDraw').click();
    await page.waitForFunction(() => !document.getElementById('randomPickerDraw').disabled);
    assert(JSON.stringify(await page.locator('.random-picker-marker').evaluateAll(rows => rows.map((row, index) => row.classList.contains('is-selected') ? index : -1).filter(index => index >= 0))) === '[0,2,3]', 'Markers align with physical lines and skip blanks');
    await first.fill(Array.from({ length: 20 }, (_, index) => '候选项' + index).join('\n'));
    await first.evaluate(el => { el.scrollTop = 160; el.dispatchEvent(new Event('scroll')); });
    assert(await page.locator('#randomPickerMarkers').evaluate(el => el.style.transform) === 'translateY(-160px)', 'Rail follows native scrolling');
    await first.fill('很长的候选项'.repeat(30));
    assert(await first.evaluate(el => el.wrap === 'off' && el.scrollWidth > el.clientWidth), 'Long candidates stay on one horizontally scrollable line');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    checks.push('Native multiline/IME editing, animation, deduplication, persistence, removal, cancellation and reduced motion');

    await goto('/apps/schulte/');
    await page.getByRole('button', { name: '点击开始' }).focus();
    await page.keyboard.press('Enter');
    for (let number = 1; number <= 25; number++) {
        await page.locator('#schulteGrid').getByRole('button', { name: String(number), exact: true }).focus();
        await page.keyboard.press('Space');
    }
    assert(await page.locator('.schulte-cell.correct').count() === 25, 'Complete grid with keyboard');
    assert(await page.locator('#schulteStatus').count() === 0, 'No redundant completion message');
    const completedTime = await page.locator('#schulteTime').innerText();
    await page.waitForTimeout(100);
    assert(await page.locator('#schulteTime').innerText() === completedTime, 'Completed time remains visible and stops ticking');
    assert(await page.locator('#schulteBest').innerText() === completedTime + 's', 'Best record matches the completed time');
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
    await goto('/');
    const announcements = page.locator('[data-announcement-slide]');
    if (await announcements.count() > 1) {
        await page.mouse.move(0, 0);
        const activeBefore = await page.locator('[data-announcement-index][aria-pressed="true"]').getAttribute('data-announcement-index');
        await page.waitForFunction(previous => {
            return document.querySelector('[data-announcement-index][aria-pressed="true"]').dataset.announcementIndex !== previous;
        }, activeBefore, { timeout: 7000 });
        await page.locator('[data-announcement-index="0"]').click();
        assert(await page.locator('[data-announcement-index="0"]').getAttribute('aria-pressed') === 'true', 'Announcement manual navigation');
    }
    await goto('/#resume');
    await page.evaluate(async () => {
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        scrollTo(0, document.documentElement.scrollHeight);
    });
    await page.locator('#backToTop').waitFor({ state: 'visible' });
    assert(await page.locator('[data-back-to-top-progress]').evaluate(el => Number(el.style.strokeDashoffset) < 100), 'Back-to-top progress remains');
    await page.locator('#backToTop').click();
    await page.waitForFunction(() => scrollY === 0);
    checks.push('Announcement auto/manual rotation and back-to-top progress/navigation retained');

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
    assert(JSON.stringify(await page.locator('#anniversaryList h3').allTextContents()) === JSON.stringify(['当天纪念日', '明天纪念日', '保留']), 'Anniversaries sort by next occurrence');
    await add('早期年份', '0001-09-18', false);
    assert(await page.locator('.countdown-item').filter({ hasText: '早期年份' }).locator('.countdown-remaining').innerText() === '还有 1 天', 'Years below 100 retain their original year in anniversary calculations');
    await page.getByRole('button', { name: '删除 早期年份', exact: true }).click();
    checks.push('Countdown zero day, next-day conversion, date-format preservation and upcoming anniversary order');

    await page.reload();
    assert(await page.locator('.countdown-item').count() === 3, 'Saved events survive reload');
    await page.getByRole('button', { name: '删除 明天纪念日', exact: true }).click();
    await goto('/en/apps/countdown/');
    assert(await page.locator('.countdown-item').count() === 2, 'Deletion persists across page navigation');
    assert(!(await page.locator('main').innerText()).includes('明天纪念日'), 'Deleted event stays removed');
    checks.push('Countdown additions and deletions persist after reload and language navigation');

    for (const invalid of ['{broken', 'null', '{}', '[null]']) {
        await page.evaluate(value => {
            ['randomPickerHistory', 'countdownEvents', 'game2048State', 'game2048BestScore', 'schulteBest'].forEach(key => localStorage.setItem(key, value));
        }, invalid);
        for (const app of ['random-picker', 'countdown', '2048', 'schulte']) {
            await goto('/apps/' + app + '/');
            assert((await page.locator('main').innerText()).trim(), 'Corrupt cache must not block ' + app);
            if (app === '2048') assert(await page.locator('.game2048-tile').count() === 2, 'Invalid game state starts a playable board');
            if (app === 'countdown') assert(await page.locator('.empty-state').count() === 2, 'Invalid event cache shows empty lists');
            if (app === 'schulte') assert(await page.locator('.schulte-cell').count() === 25, 'Invalid best score does not block grid');
            if (app === 'random-picker') assert(await page.locator('#randomPickerHistory').innerText() === '还没有抽取记录', 'Invalid history is discarded');
        }
    }
    await page.evaluate(() => localStorage.setItem('countdownEvents', JSON.stringify([
        { id: 'bad-date', name: '无效日期', date: '2026-02-30', kind: 'anniversary' },
        { id: 'valid', name: '有效日期', date: '2000-09-18', kind: 'anniversary' }
    ])));
    await goto('/apps/countdown/');
    assert(await page.locator('.countdown-item').count() === 1 && (await page.locator('.countdown-item').innerText()).includes('有效日期'), 'Keep valid cached events and discard invalid dates');
    checks.push('Malformed and wrong-shape caches recover across all tools, preserving valid events');
    await page.clock.resume();

    const mobile = await page.context().browser().newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    try {
        const touch = await mobile.newPage();
        touch.on('pageerror', error => errors.push(error.message));
        for (const route of ['apps/random-picker/', 'apps/countdown/', '#bookmarks']) {
            await touch.goto(base + '/' + route);
            const controls = await touch.locator('main .field-input').evaluateAll(inputs => inputs.filter(input => input.checkVisibility()).map(input => ({ size: parseFloat(getComputedStyle(input).fontSize), height: input.getBoundingClientRect().height })));
            assert(controls.every(input => input.size >= 16 && input.height >= 44), 'Readable touch inputs: ' + route);
        }
        await touch.goto(base + '/apps/random-picker/');
        assert(await touch.locator('#randomPickerAddOption').count() === 0, 'No add button');
        const mobileFirst = touch.locator('#randomPickerOptions');
        await mobileFirst.tap();
        await mobileFirst.fill('苹果\r\n香蕉\r苹果\u2028梨');
        await touch.locator('#randomPickerDeduplicate').tap();
        assert(await mobileFirst.inputValue() === '苹果\n香蕉\n梨', 'Touch deduplication handles newline variants');
        const dedupBox = await touch.locator('#randomPickerDeduplicate').boundingBox();
        const clearBox = await touch.locator('#randomPickerReset').boundingBox();
        assert(dedupBox.y === clearBox.y, 'Deduplicate and clear are peers');
        assert(await touch.locator('#randomPickerDeduplicate').evaluate(el => getComputedStyle(el).webkitTapHighlightColor) === 'rgba(0, 0, 0, 0)', 'No native tap highlight');
        await touch.locator('#randomPickerDraw').tap();
        await touch.waitForFunction(() => !document.getElementById('randomPickerDraw').disabled);
        await touch.waitForTimeout(1100);
        assert(await touch.locator('.random-picker-marker.is-selected').count() === 1, 'Touch selection stays highlighted after the animation');
        await touch.screenshot({ path: '/tmp/justafish-picker-rail-mobile.png', fullPage: true, animations: 'disabled' });
        await mobileFirst.press('End');
        await mobileFirst.press('Enter');
        assert((await mobileFirst.inputValue()).includes('\n'), 'Mobile editor accepts native newlines');
        await touch.locator('#randomPickerReset').tap();
        assert(await mobileFirst.inputValue() === '', 'Touch clear');
        checks.push('Touch context: 16px input text, 44px fields and tap interactions');
    } finally { await mobile.close(); }

    const routes = ['', '#resume', '#bookmarks', '#apps', 'apps/random-picker/', 'apps/countdown/', 'apps/schulte/', 'apps/2048/'];
    let surfaces = 0;
    for (const theme of ['light', 'dark']) {
        await page.evaluate(value => localStorage.setItem('theme', value), theme);
        for (const locale of ['', 'en/']) {
            for (const route of routes) {
                await goto('/' + locale + route);
                await page.reload();
                assert((await page.title()).length > 0, 'Page title: ' + page.url());
                assert((await page.locator('main').innerText()).trim().length > 0, 'Blank page: ' + page.url());
                assert(await page.locator('html').getAttribute('data-theme') === (theme === 'dark' ? 'dark' : null), 'Theme persists on ' + page.url());
                for (const width of [1280, 390, 320]) {
                    await page.setViewportSize({ width, height: 900 });
                    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Page overflow: ' + page.url());
                    surfaces++;
                    if (!locale && [1280, 390].includes(width)) {
                        const label = route.replace(/[^a-z0-9]+/g, '-') || 'home';
                        await page.screenshot({ path: '/tmp/justafish-' + label + '-' + theme + '-' + width + '.png', fullPage: true, animations: 'disabled' });
                    }
                }
            }
        }
    }
    checks.push('16 Chinese/English routes in light/dark themes at 1280, 390 and 320 pixels (' + surfaces + ' layouts), with screenshot evidence');
    assert(errors.length === 0, errors.join('\n'));
    return { passed: true, checks, errors };
}

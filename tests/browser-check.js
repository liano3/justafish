async page => {
    const base = 'http://localhost:8080';
    const checks = [];
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
        if (message.type() === 'error') errors.push(message.text());
    });
    const assert = (condition, message) => { if (!condition) throw new Error(message); };
    const goto = path => page.goto(base + path);
    await goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.locator('.nav').getByRole('link', { name: '简历', exact: true }).click();
    assert(page.url().endsWith('/#resume'), 'Resume navigation');
    assert(await page.locator('#resume').evaluate(el => el.classList.contains('active')), 'Resume content');
    await page.getByRole('link', { name: 'Switch to English' }).click();
    assert(page.url().endsWith('/en/#resume'), 'Language must retain current section');
    await page.getByRole('button', { name: 'Switch to dark mode' }).click();
    await goto('/apps/countdown/');
    assert(await page.locator('html').getAttribute('data-theme') === 'dark', 'Shared theme');
    await page.getByRole('button', { name: '切换到浅色模式' }).click();
    checks.push('Shared navigation, language switching and persistent theme');

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

    await goto('/apps/schulte/');
    await page.getByRole('button', { name: '点击开始' }).focus();
    await page.keyboard.press('Enter');
    for (let number = 1; number <= 25; number++) {
        await page.locator('#schulteGrid').getByRole('button', { name: String(number), exact: true }).focus();
        await page.keyboard.press('Space');
    }
    assert(await page.locator('.schulte-cell.correct').count() === 25, 'Complete grid with keyboard');
    assert(await page.locator('#schulteRestart').evaluate(el => document.activeElement === el), 'Focus restart after completion');
    await page.keyboard.press('Enter');
    assert(await page.locator('#schulteOverlay').isVisible(), 'Schulte restart');
    checks.push('Schulte keyboard start, all 25 numbers and restart');

    let resolveUnlock;
    let unlockArrived;
    const passwords = [];
    await page.route('**/api/chat', async route => {
        const body = route.request().postDataJSON();
        if (!body.messages) {
            resolveUnlock = () => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ unlocked: true, greeting: 'Mock greeting' }) });
            unlockArrived();
            return;
        }
        passwords.push(body.password);
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
    await page.unroute('**/api/chat');
    checks.push('Delayed chat unlock retains submitted password and newer search');

    await page.clock.install({ time: new Date('2026-09-16T12:00:00+08:00') });
    await goto('/apps/pomodoro/');
    await page.locator('#pomodoroWork').fill('10');
    await page.locator('#pomodoroWork').blur();
    await page.locator('#pomodoroBreak').fill('3');
    await page.locator('#pomodoroBreak').blur();
    if (await page.locator('#pomodoroSound').isChecked()) await page.locator('label[for="pomodoroSound"]').click();
    await page.locator('#pomodoroStart').click();
    await page.clock.runFor(30000);
    const deadline = await page.evaluate(() => JSON.parse(localStorage.getItem('pomodoroState')).deadline);
    await page.getByRole('link', { name: '返回应用' }).click();
    await page.locator('a[href="./apps/pomodoro/"]').click();
    assert(await page.locator('#pomodoroStart').innerText() === '暂停', 'Running state restored');
    assert(await page.locator('#pomodoroWork').inputValue() === '10', 'Work length restored');
    assert(await page.locator('#pomodoroBreak').inputValue() === '3', 'Break length restored');
    assert(await page.evaluate(() => JSON.parse(localStorage.getItem('pomodoroState')).deadline) === deadline, 'Deadline unchanged on navigation');
    await page.locator('#pomodoroStart').click();
    const paused = await page.locator('#pomodoroTimer').innerText();
    await page.reload();
    await page.clock.runFor(30000);
    assert(await page.locator('#pomodoroTimer').innerText() === paused, 'Paused remaining time restored');
    await page.locator('#pomodoroStart').click();
    const resumeDeadline = await page.evaluate(() => JSON.parse(localStorage.getItem('pomodoroState')).deadline);
    await goto('/');
    await page.clock.setSystemTime(new Date(resumeDeadline + 60000));
    await goto('/apps/pomodoro/');
    assert(await page.locator('#pomodoroStatus').innerText() === '休息中...', 'Offline phase change');
    assert(await page.locator('#pomodoroCount').innerText() === '1', 'Count focus once');
    assert(await page.locator('#pomodoroTotal').innerText() === '10', 'Record correct focus length');
    await page.reload();
    assert(await page.locator('#pomodoroCount').innerText() === '1', 'Do not count same phase twice');
    await goto('/');
    await page.clock.setSystemTime(new Date(resumeDeadline + (3 + 10 + 3 + 10 + 1) * 60000));
    await goto('/apps/pomodoro/');
    assert(await page.locator('#pomodoroCount').innerText() === '3', 'Restore several offline cycles');
    assert(await page.locator('#pomodoroTotal').innerText() === '30', 'Offline total minutes');
    await page.locator('#pomodoroReset').click();
    assert(await page.locator('#pomodoroTimer').innerText() === '10:00', 'Reset uses saved length');
    checks.push('Pomodoro navigation, running/paused reload, offline phases, no duplicate statistics and reset');

    await page.clock.setSystemTime(new Date('2026-09-16T12:00:00+08:00'));
    await goto('/apps/countdown/');
    const add = async (name, date, checked) => {
        await page.locator('#countdownName').fill(name);
        await page.locator('#countdownDate').fill(date);
        await page.locator('#countdownAutoConvert').setChecked(checked);
        await page.getByRole('button', { name: '添加事件' }).click();
    };
    await add('保留', '2026-09-16', true);
    await add('移除', '2026-09-16', false);
    assert(await page.locator('#countdownList .countdown-item').count() === 2, 'Keep both due-today events');
    assert(await page.locator('#countdownList input').count() === 0, 'No checkbox inside countdown cards');
    await page.clock.setSystemTime(new Date('2026-09-17T00:00:00+08:00'));
    await page.clock.runFor(60000);
    assert(await page.locator('#countdownList .countdown-item').count() === 0, 'Process following day');
    assert(await page.locator('#anniversaryList .countdown-item').count() === 1, 'Only opted-in event converts');
    assert((await page.locator('#anniversaryList').innerText()).includes('距下次还有 364 天'), 'Next anniversary');
    checks.push('Countdown zero day retained, next-day conversion and form-only option');

    const routes = ['', '#resume', '#bookmarks', '#apps', 'apps/pomodoro/', 'apps/random-picker/', 'apps/countdown/', 'apps/memory/', 'apps/schulte/', 'apps/2048/'];
    let surfaces = 0;
    for (const locale of ['', 'en/']) {
        for (const route of routes) {
            await goto('/' + locale + route);
            assert((await page.locator('main').innerText()).trim().length > 0, 'Blank page: ' + page.url());
            for (const width of [1280, 390, 320]) {
                await page.setViewportSize({ width, height: 900 });
                assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Page overflow: ' + page.url());
                if (route === 'apps/pomodoro/') {
                    assert(await page.evaluate(() => {
                        const card = document.querySelector('.tool-card').getBoundingClientRect();
                        return Array.from(document.querySelectorAll('.pomodoro-setting')).every(el => {
                            const rect = el.getBoundingClientRect();
                            return rect.left >= card.left && rect.right <= card.right;
                        });
                    }), 'Clipped pomodoro settings');
                }
                surfaces++;
            }
        }
    }
    checks.push('20 Chinese/English routes at 1280, 390 and 320 pixels (' + surfaces + ' layouts)');
    assert(errors.length === 0, errors.join('\n'));
    return { passed: true, checks, errors };
}

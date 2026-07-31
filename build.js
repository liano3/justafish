const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { DEFAULT_CONFIG } = require('./src/config/default');

const PAGE_IDS = ['home', 'resume', 'bookmarks', 'apps'];
const BUILD_FEATURE_IDS = ['language'];
const BUILD_OPTION_IDS = [...PAGE_IDS, ...BUILD_FEATURE_IDS];
const MAIN_RUNTIME_TEXT_KEYS = ['AI_CHAT_ERROR', 'AI_CHAT_GREETING', 'AI_CHAT_TITLE', 'AI_CHAT_WAIT', 'ageYears', 'announcementIndex', 'backToTopProgress', 'backToTopTitle', 'bookmarksFound', 'bookmarksTotal', 'comingSoon', 'copied', 'copyEmail', 'copyEmailFailed', 'copyFailed', 'copyNotAllowed', 'downloadPdf', 'emailCopied', 'emailCopiedStatus', 'pdfChecking', 'pdfCheckingStatus', 'pdfDownloading', 'pdfDownloadingStatus', 'pdfMissing', 'themeToDark', 'themeToLight'];
const APPS = [
    { id: 'pomodoro', icon: 'clock', title: 'POMODORO', description: 'POMODORO_DESCRIPTION', css: 'pomodoro.css', js: ['pomodoro.js'], runtime: ['dateLocale', 'pomodoroFocusRunning', 'pomodoroFocusReady', 'pomodoroBreakRunning', 'pomodoroBreakReady', 'pomodoroWorkComplete', 'pomodoroBreakComplete', 'pomodoroPreviewSoundOn', 'pomodoroPreviewSoundOff', 'pomodoroAutoBreak', 'pomodoroAutoFocus', 'pomodoroReminderTitle', 'continue', 'pause', 'start'] },
    { id: 'random-picker', icon: 'rotate-ccw', title: 'RANDOM_PICKER', description: 'RANDOM_PICKER_DESCRIPTION', css: 'random-picker.css', js: ['random-picker.js'], runtime: ['randomPickerEmpty', 'randomPickerCount', 'randomPickerHistoryEmpty', 'randomPickerDrawing', 'randomPickerDone'] },
    { id: 'countdown', icon: 'calendar', title: 'COUNTDOWN', description: 'COUNTDOWN_DESCRIPTION', css: 'countdown.css', js: ['countdown.js'], runtime: ['dateLocale', 'countdownToday', 'countdownFuture', 'countdownPast', 'countdownEmpty', 'anniversaryEmpty', 'countdownInvalid', 'countdownDeleteLabel'] },
    { id: 'memory', icon: 'grid', title: 'MEMORY_GAME', description: 'MEMORY_GAME_DESCRIPTION', css: 'memory.css', js: ['memory.js'], runtime: ['memoryCardHidden', 'memoryCardRevealed', 'memoryCardMatched', 'memoryComplete', 'memoryReady'] },
    { id: 'schulte', icon: 'table', title: 'SCHULTE', description: 'SCHULTE_DESCRIPTION', css: 'schulte.css', js: ['schulte.js'], runtime: [] },
    { id: '2048', icon: 'grid', title: 'GAME_2048', description: 'GAME_2048_DESCRIPTION', css: 'game2048.css', js: ['vendor/2048-core.js', 'game2048.js'], runtime: ['gameOver', 'gameWon'] }
];
const PROFILE_ICON_IDS = {
    blog: 'book-open',
    github: 'github',
    scholar: 'scholar',
    email: 'mail'
};

const UI_TEXT = {
    zh: {
        NAV_HOME: '首页', NAV_RESUME: '简历', NAV_BOOKMARKS: '书签', NAV_APPS: '应用',
        SWITCH_LANGUAGE_ARIA: 'Switch to English', GITHUB_PROJECT_ARIA: '查看 GitHub 项目', THEME_TO_DARK: '切换到深色模式',
        DOWNLOAD_PDF: '下载 PDF', BOOKMARKS_TITLE: '我的书签', BOOKMARK_SEARCH_LABEL: '搜索书签',
        BOOKMARK_SEARCH_PLACEHOLDER: '搜索分类、名称、描述、标签或网址', BOOKMARK_CLEAR: '清空搜索', BOOKMARK_EMPTY: '没有匹配的书签',
        BOOKMARK_TAG_FILTER_ARIA: '按标签筛选书签', BOOKMARK_TAG_ALL: '全部',
        APPS_TITLE: '实用工具与小游戏', GAME_2048: '2048', BACK_TO_APPS: '返回应用', RANDOM_PICKER: '随机选择器', COUNTDOWN: '倒计时与纪念日', MEMORY_GAME: '记忆翻牌',
        POMODORO_DESCRIPTION: '查看当前时间与日期，调节专注和休息时长，并使用提醒与统计。',
        RANDOM_PICKER_DESCRIPTION: '从自定义候选项中随机抽取结果，支持多选、移除和历史记录。', COUNTDOWN_DESCRIPTION: '记录重要日期，自动区分未来的倒计时与已经发生的纪念日。', MEMORY_GAME_DESCRIPTION: '翻开并配对图标卡片，挑战更少步数和更短用时。',
        SCHULTE_DESCRIPTION: '按顺序寻找 1 至 25，训练注意力与视觉搜索。', GAME_2048_DESCRIPTION: '使用方向键或滑动合并数字，挑战 2048。',
        POMODORO: '番茄钟', POMODORO_READY: '准备专注',
        START: '开始', RESET: '重置', SOUND_REMINDER: '声音提醒', PREVIEW_REMINDER: '试听提醒',
        FOCUS: '专注', MINUTES: '分钟', BREAK: '休息', COMPLETED_PREFIX: '完成', COMPLETED_SUFFIX: '次', TOTAL_PREFIX: '累计',
        SCHULTE: '舒尔特方格', CURRENT_TIME: '当前用时(秒)', BEST_SCORE: '最佳记录', CLICK_TO_START: '点击开始', RESTART: '重新开始',
        CURRENT_SCORE: '当前分数', GAME_BOARD: '2048 棋盘', CONTINUE: '继续', PLAY_AGAIN: '再来一局', NEW_GAME: '新游戏',
        RANDOM_OPTIONS: '候选项', RANDOM_OPTIONS_PLACEHOLDER: '每行输入一个候选项', RANDOM_DRAW_COUNT: '抽取数量', RANDOM_DEDUPLICATE: '候选项去重', RANDOM_REMOVE_DRAWN: '抽取后移除', RANDOM_DRAW: '开始抽取', RANDOM_RESET: '清空', RANDOM_RESULT: '抽取结果', RANDOM_HISTORY: '最近结果',
        COUNTDOWN_EVENT_NAME: '事件名称', COUNTDOWN_EVENT_PLACEHOLDER: '例如：项目截止日期', COUNTDOWN_DATE: '日期', COUNTDOWN_ADD: '添加事件', COUNTDOWN_LIST: '倒计时', ANNIVERSARY_LIST: '纪念日',
        MEMORY_MOVES: '步数', MEMORY_TIME: '用时', MEMORY_BEST: '最佳', MEMORY_DIFFICULTY: '难度', MEMORY_EASY: '4 × 4', MEMORY_HARD: '6 × 6', MEMORY_BOARD: '记忆翻牌棋盘', MEMORY_NEW_GAME: '重新开始',
        BACK_TO_TOP: '返回顶部', POMODORO_WORK_COMPLETE: '专注完成，休息一下', POMODORO_AUTO_BREAK: '已自动进入休息计时', CLOSE_REMINDER: '关闭提醒',
        avatarAlt: '{name}的头像', seoDescription: '{identity}的个人主页，{title}。{introduction}', seoKeywords: ['个人主页', '学术主页'],
        ageYears: '{age} 岁', phoneAria: '电话 {phone}', copyEmail: '复制邮箱地址', researchInterests: '研究兴趣',
        AI_CHAT_TITLE: '隐藏对话', AI_CHAT_CLOSE: '关闭对话', AI_CHAT_PLACEHOLDER: '输入消息...', AI_CHAT_SEND: '发送',
        AI_CHAT_GREETING: '你好，想聊点什么？', AI_CHAT_WAIT: '正在回复...', AI_CHAT_ERROR: '暂时无法连接 AI，请稍后再试。',
        announcementIndex: '查看第 {index} 条公告', announcementBanner: '公告栏', announcementNavigation: '公告切换',
        educationHeading: '教育经历', awardsHeading: '获奖经历', worksHeading: '项目与论文', paper: '论文', project: '项目',
        footerLastUpdated: '更新于 {date}', footerVisitors: '访问者',
        backToTopProgress: '返回顶部，已阅读 {progress}%', backToTopTitle: '返回顶部 · {progress}%',
        themeToLight: '切换到浅色模式', themeToDark: '切换到深色模式', copyNotAllowed: '浏览器未允许复制',
        pdfChecking: '检查中…', pdfCheckingStatus: '正在检查简历 PDF', pdfMissing: '简历 PDF 不存在', pdfDownloading: '开始下载', pdfDownloadingStatus: '简历 PDF 已开始下载',
        comingSoon: 'Coming soon...', downloadPdf: '下载 PDF', emailCopied: '邮箱地址已复制', copied: '已复制', emailCopiedStatus: '邮箱地址已复制：{email}',
        copyEmailFailed: '复制失败，请手动选择邮箱地址', copyFailed: '复制失败',
        bookmarksFound: '找到 {count} 个书签', bookmarksTotal: '共 {count} 个书签', dateLocale: 'zh-CN',
        pomodoroFocusRunning: '专注中...', pomodoroFocusReady: '准备专注', pomodoroBreakRunning: '休息中...', pomodoroBreakReady: '准备休息',
        pomodoroWorkComplete: '专注完成，休息一下', pomodoroBreakComplete: '休息结束，开始专注', pomodoroPreviewSoundOn: '提醒声音正常，到点会自动提示',
        pomodoroPreviewSoundOff: '声音已关闭，到点仍会显示页面提醒', pomodoroAutoBreak: '已自动进入休息计时', pomodoroAutoFocus: '已自动开始下一轮专注',
        pomodoroReminderTitle: '提醒：{message}', continue: '继续', pause: '暂停', start: '开始', gameOver: '游戏结束', gameWon: '达到 2048',
        randomPickerEmpty: '请至少输入一个候选项', randomPickerCount: '可抽取数量最多为 {count}', randomPickerHistoryEmpty: '还没有抽取记录', randomPickerDrawing: '抽取中...', randomPickerDone: '抽取完成',
        countdownToday: '就是今天', countdownFuture: '还有 {days} 天', countdownPast: '已过去 {days} 天', countdownEmpty: '还没有倒计时', anniversaryEmpty: '还没有纪念日', countdownInvalid: '请填写事件名称和日期', countdownDeleteLabel: '删除 {name}',
        memoryCardHidden: '未翻开的卡片', memoryCardRevealed: '已翻开的卡片', memoryCardMatched: '已配对的卡片', memoryComplete: '完成！用了 {moves} 步，耗时 {time}', memoryReady: '翻开任意卡片开始'
    },
    en: {
        NAV_HOME: 'Home', NAV_RESUME: 'Resume', NAV_BOOKMARKS: 'Bookmarks', NAV_APPS: 'Apps',
        SWITCH_LANGUAGE_ARIA: 'Switch to Chinese', GITHUB_PROJECT_ARIA: 'View project on GitHub', THEME_TO_DARK: 'Switch to dark mode',
        DOWNLOAD_PDF: 'Download PDF', BOOKMARKS_TITLE: 'My Bookmarks', BOOKMARK_SEARCH_LABEL: 'Search bookmarks',
        BOOKMARK_SEARCH_PLACEHOLDER: 'Search categories, names, descriptions, tags, or URLs', BOOKMARK_CLEAR: 'Clear search', BOOKMARK_EMPTY: 'No matching bookmarks',
        BOOKMARK_TAG_FILTER_ARIA: 'Filter bookmarks by tag', BOOKMARK_TAG_ALL: 'All',
        APPS_TITLE: 'Tools & Mini Games', GAME_2048: '2048', BACK_TO_APPS: 'Back to apps', RANDOM_PICKER: 'Random Picker', COUNTDOWN: 'Countdown & Anniversaries', MEMORY_GAME: 'Memory Match',
        POMODORO_DESCRIPTION: 'See the current time and date, set focus and break durations, and use reminders and session stats.',
        RANDOM_PICKER_DESCRIPTION: 'Draw random results from your own list with multiple picks, removal, and history.', COUNTDOWN_DESCRIPTION: 'Save important dates and automatically separate future countdowns from past anniversaries.', MEMORY_GAME_DESCRIPTION: 'Flip and match icon cards while aiming for fewer moves and a faster time.',
        SCHULTE_DESCRIPTION: 'Find 1 through 25 in order to train attention and visual search.', GAME_2048_DESCRIPTION: 'Use arrow keys or swipe to merge tiles and reach 2048.',
        POMODORO: 'Pomodoro Timer', POMODORO_READY: 'Ready to focus',
        START: 'Start', RESET: 'Reset', SOUND_REMINDER: 'Sound reminder', PREVIEW_REMINDER: 'Preview reminder',
        FOCUS: 'Focus', MINUTES: 'minutes', BREAK: 'Break', COMPLETED_PREFIX: 'Completed', COMPLETED_SUFFIX: 'sessions', TOTAL_PREFIX: 'Total',
        SCHULTE: 'Schulte Grid', CURRENT_TIME: 'Current time (s)', BEST_SCORE: 'Best', CLICK_TO_START: 'Click to start', RESTART: 'Restart',
        CURRENT_SCORE: 'Score', GAME_BOARD: '2048 board', CONTINUE: 'Continue', PLAY_AGAIN: 'Play again', NEW_GAME: 'New game',
        RANDOM_OPTIONS: 'Options', RANDOM_OPTIONS_PLACEHOLDER: 'Enter one option per line', RANDOM_DRAW_COUNT: 'Number to draw', RANDOM_DEDUPLICATE: 'Remove duplicates', RANDOM_REMOVE_DRAWN: 'Remove after drawing', RANDOM_DRAW: 'Draw', RANDOM_RESET: 'Clear', RANDOM_RESULT: 'Result', RANDOM_HISTORY: 'Recent results',
        COUNTDOWN_EVENT_NAME: 'Event name', COUNTDOWN_EVENT_PLACEHOLDER: 'For example: Project deadline', COUNTDOWN_DATE: 'Date', COUNTDOWN_ADD: 'Add event', COUNTDOWN_LIST: 'Countdowns', ANNIVERSARY_LIST: 'Anniversaries',
        MEMORY_MOVES: 'Moves', MEMORY_TIME: 'Time', MEMORY_BEST: 'Best', MEMORY_DIFFICULTY: 'Difficulty', MEMORY_EASY: '4 × 4', MEMORY_HARD: '6 × 6', MEMORY_BOARD: 'Memory match board', MEMORY_NEW_GAME: 'Restart',
        BACK_TO_TOP: 'Back to top', POMODORO_WORK_COMPLETE: 'Focus complete — take a break', POMODORO_AUTO_BREAK: 'Break timer started automatically', CLOSE_REMINDER: 'Close reminder',
        avatarAlt: '{name}\'s avatar', seoDescription: '{identity}\'s personal website. {title}. {introduction}', seoKeywords: ['personal website', 'academic homepage'],
        ageYears: 'Age {age}', phoneAria: 'Phone {phone}', copyEmail: 'Copy email address', researchInterests: 'Research interests',
        AI_CHAT_TITLE: 'Secret chat', AI_CHAT_CLOSE: 'Close chat', AI_CHAT_PLACEHOLDER: 'Type a message...', AI_CHAT_SEND: 'Send',
        AI_CHAT_GREETING: 'Hi, what would you like to talk about?', AI_CHAT_WAIT: 'Replying...', AI_CHAT_ERROR: 'AI is unavailable right now. Please try again later.',
        announcementIndex: 'View announcement {index}', announcementBanner: 'Announcements', announcementNavigation: 'Announcement navigation',
        educationHeading: 'Education', awardsHeading: 'Awards', worksHeading: 'Projects & Publications', paper: 'Paper', project: 'Project',
        footerLastUpdated: 'Last updated {date}', footerVisitors: 'Visitors',
        backToTopProgress: 'Back to top, {progress}% read', backToTopTitle: 'Back to top · {progress}%',
        themeToLight: 'Switch to light mode', themeToDark: 'Switch to dark mode', copyNotAllowed: 'Clipboard access was not allowed',
        pdfChecking: 'Checking…', pdfCheckingStatus: 'Checking resume PDF', pdfMissing: 'Resume PDF is unavailable', pdfDownloading: 'Downloading', pdfDownloadingStatus: 'Resume PDF download started',
        comingSoon: 'Coming soon...', downloadPdf: 'Download PDF', emailCopied: 'Email copied', copied: 'Copied', emailCopiedStatus: 'Email copied: {email}',
        copyEmailFailed: 'Copy failed. Please select the email address manually.', copyFailed: 'Copy failed',
        bookmarksFound: '{count} bookmarks found', bookmarksTotal: '{count} bookmarks', dateLocale: 'en-US',
        pomodoroFocusRunning: 'Focusing...', pomodoroFocusReady: 'Ready to focus', pomodoroBreakRunning: 'On a break...', pomodoroBreakReady: 'Ready for a break',
        pomodoroWorkComplete: 'Focus complete — take a break', pomodoroBreakComplete: 'Break complete — time to focus', pomodoroPreviewSoundOn: 'Sound is working and will play when time is up',
        pomodoroPreviewSoundOff: 'Sound is off; an on-page reminder will still appear', pomodoroAutoBreak: 'Break timer started automatically', pomodoroAutoFocus: 'Next focus session started automatically',
        pomodoroReminderTitle: 'Reminder: {message}', continue: 'Continue', pause: 'Pause', start: 'Start', gameOver: 'Game over', gameWon: 'You reached 2048',
        randomPickerEmpty: 'Enter at least one option', randomPickerCount: 'You can draw at most {count}', randomPickerHistoryEmpty: 'No draws yet', randomPickerDrawing: 'Drawing...', randomPickerDone: 'Draw complete',
        countdownToday: 'Today', countdownFuture: '{days} days to go', countdownPast: '{days} days ago', countdownEmpty: 'No countdowns yet', anniversaryEmpty: 'No anniversaries yet', countdownInvalid: 'Enter an event name and date', countdownDeleteLabel: 'Delete {name}',
        memoryCardHidden: 'Hidden card', memoryCardRevealed: 'Revealed card', memoryCardMatched: 'Matched card', memoryComplete: 'Complete! {moves} moves in {time}', memoryReady: 'Flip any card to begin'
    }
};

function formatMessage(value, replacements = {}) {
    return Object.keys(replacements).reduce((result, key) => {
        return result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(replacements[key]));
    }, String(value || ''));
}

function loadLocalEnvFile() {
    const envPath = path.join(__dirname, '.env.local');
    if (!fs.existsSync(envPath)) return;

    const content = fs.readFileSync(envPath, 'utf8');
    const assignments = [];
    const lines = content.split(/\r?\n/);
    let pending = null;

    lines.forEach(rawLine => {
        if (pending) {
            pending.value += `\n${rawLine}`;
            if (rawLine.endsWith(pending.quote)) {
                assignments.push(pending);
                pending = null;
            }
            return;
        }

        const trimmed = rawLine.trim();
        if (!trimmed || trimmed.startsWith('#')) return;

        const equalsIndex = rawLine.indexOf('=');
        if (equalsIndex === -1) return;

        const key = rawLine.slice(0, equalsIndex).trim();
        const value = rawLine.slice(equalsIndex + 1).trim();
        const quote = value[0];
        if ((quote === "'" || quote === '"') && !value.endsWith(quote)) {
            pending = { key, value, quote };
            return;
        }
        assignments.push({ key, value });
    });

    assignments.forEach(({ key, value: rawValue }) => {
        let value = rawValue.trim();
        if (!key) return;

        if (
            (value.startsWith("'") && value.endsWith("'"))
            || (value.startsWith('"') && value.endsWith('"'))
        ) {
            value = value.slice(1, -1);
        }
        if (process.env[key] === undefined) process.env[key] = value;
    });
}

loadLocalEnvFile();

function parseJsonEnv(env, defaultValue) {
    if (!env) return defaultValue;
    try {
        return JSON.parse(env);
    } catch (e) {
        console.warn(`Failed to parse env, using default: ${e.message}`);
        return defaultValue;
    }
}

function isRecord(value) {
    return value !== null && !Array.isArray(value) && typeof value === 'object';
}

function isRecordArray(value) {
    return Array.isArray(value) && value.every(isRecord);
}

function parseJsonArrayEnv(env, defaultValue, envName, itemValidator = isRecord) {
    const parsed = parseJsonEnv(env, defaultValue);
    if (Array.isArray(parsed) && parsed.every(itemValidator)) return parsed;
    console.warn(`${envName} must be a JSON array with valid object items; using default value.`);
    return defaultValue;
}

function parsePageVisibilityEnv(envValue) {
    const defaults = Object.fromEntries(BUILD_OPTION_IDS.map(optionId => [optionId, true]));
    if (!envValue) return defaults;

    const parsed = parseJsonEnv(envValue, defaults);
    if (!isRecord(parsed)) {
        console.warn('PAGES_JSON must be a JSON object; showing all pages.');
        return defaults;
    }

    const pages = { ...defaults };
    BUILD_OPTION_IDS.forEach(optionId => {
        if (parsed[optionId] === undefined) return;
        if (typeof parsed[optionId] === 'boolean') pages[optionId] = parsed[optionId];
        else console.warn(`PAGES_JSON.${optionId} must be true or false; keeping it enabled.`);
    });

    if (!PAGE_IDS.some(pageId => pages[pageId])) {
        console.warn('PAGES_JSON cannot hide every page; keeping the home page visible.');
        pages.home = true;
    }
    return pages;
}

function escapeHtml(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function createTextFavicon(value) {
    const icon = String(value || '•').trim() || '•';
    const fontSize = Array.from(icon).length > 2 ? 48 : 72;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text x="50" y="54" font-size="${fontSize}" text-anchor="middle" dominant-baseline="middle">${escapeHtml(icon)}</text></svg>`;
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function safeUrl(value) {
    const url = String(value || '').trim();
    if (/^(https?:|mailto:|tel:)/i.test(url) || /^(\.\/|\.\.\/|\/)/.test(url)) {
        return escapeHtml(url);
    }
    return '#';
}

function renderIcon(iconId, className = '') {
    const classAttribute = className ? ` class="${className}"` : '';
    return `<svg${classAttribute} aria-hidden="true" focusable="false"><use href="{{ICON_SPRITE_URL}}#${iconId}"></use></svg>`;
}

function normalizeSiteUrl(value) {
    const input = String(value || '').trim();
    try {
        const url = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`);
        if (!['http:', 'https:'].includes(url.protocol)) return 'https://example.com/';
        return new URL('/', url).href;
    } catch (error) {
        return 'https://example.com/';
    }
}

function resolveHttpUrl(value, baseUrl) {
    const input = String(value || '').trim();
    if (!input) return '';
    try {
        const url = new URL(input, baseUrl);
        return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
    } catch (error) {
        return '';
    }
}

function formatUpdateDate(now = new Date()) {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).formatToParts(now).reduce((result, part) => {
        result[part.type] = part.value;
        return result;
    }, {});
    return `${parts.year}-${parts.month}-${parts.day}`;
}

function getResearchInterests(profile) {
    return Array.isArray(profile.researchInterests)
        ? profile.researchInterests.filter(item => typeof item === 'string').map(item => item.trim()).filter(Boolean)
        : [];
}

function getBookmarkTags(bookmark) {
    if (!Array.isArray(bookmark.tags)) return [];
    const seen = new Set();
    return bookmark.tags.map(tag => String(tag || '').trim()).filter(tag => {
        const normalized = tag.toLowerCase();
        if (!tag || seen.has(normalized)) return false;
        seen.add(normalized);
        return true;
    });
}

function createSeoData(profile, locale, text) {
    const rootSiteUrl = normalizeSiteUrl(profile.domain);
    const siteUrl = locale === 'en' ? new URL('en/', rootSiteUrl).href : rootSiteUrl;
    const nickname = String(profile.nickname || profile.name || '').trim();
    const identity = nickname && nickname !== profile.name
        ? (locale === 'en' ? `${nickname} (${profile.name})` : `${nickname}（${profile.name}）`)
        : String(profile.name || nickname);
    const description = String(profile.seoDescription || '').trim()
        || formatMessage(text.seoDescription, {
            identity,
            title: profile.title,
            introduction: profile.introduction
        });
    const interests = getResearchInterests(profile);
    const keywords = [...new Set([
        profile.name,
        nickname,
        profile.siteName,
        profile.title,
        ...interests,
        ...text.seoKeywords
    ].map(item => String(item || '').trim()).filter(Boolean))].join(',');
    const shareImage = resolveHttpUrl(profile.shareImage || profile.avatar, rootSiteUrl);
    const sameAs = (Array.isArray(profile.links) ? profile.links : [])
        .map(link => resolveHttpUrl(link.url, rootSiteUrl))
        .filter(Boolean);
    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: String(profile.name || ''),
        alternateName: nickname,
        jobTitle: String(profile.title || ''),
        description,
        url: siteUrl,
        inLanguage: locale === 'en' ? 'en' : 'zh-CN',
        image: shareImage,
        knowsAbout: interests,
        sameAs
    };
    return {
        rootSiteUrl,
        siteUrl,
        shareImage,
        description,
        keywords,
        lastUpdated: formatUpdateDate(),
        structuredData: JSON.stringify(structuredData).replace(/</g, '\\u003c')
    };
}

function renderProfileLinks(links) {
    return links.map((link, index) => {
        const isMail = String(link.url || '').startsWith('mailto:');
        const iconId = PROFILE_ICON_IDS[link.icon];
        const icon = iconId ? renderIcon(iconId) : '';
        const className = `hero-link ${index === 0 ? 'hero-link-primary' : 'hero-link-secondary'}`;
        return `<a href="${safeUrl(link.url)}" target="${isMail ? '_self' : '_blank'}"${isMail ? '' : ' rel="noopener noreferrer"'} class="${className}">
            ${icon}
            <span>${escapeHtml(link.label)}</span>
        </a>`;
    }).join('\n                        ');
}

function calculateAge(birthday, now = new Date()) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(birthday || ''));
    if (!match) return null;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const birthdayDate = new Date(year, month - 1, day);
    if (birthdayDate.getFullYear() !== year || birthdayDate.getMonth() !== month - 1 || birthdayDate.getDate() !== day) return null;
    var age = now.getFullYear() - year;
    if (now.getMonth() < month - 1 || (now.getMonth() === month - 1 && now.getDate() < day)) age--;
    return age >= 0 ? age : null;
}

function renderResumeContacts(profile, text) {
    const contacts = [];
    const age = calculateAge(profile.birthday);
    if (age !== null) {
        contacts.push(`<span class="resume-contact">
                                    ${renderIcon('calendar')}
                                    <span id="resumeAge" data-birthday="${escapeHtml(profile.birthday)}">${escapeHtml(formatMessage(text.ageYears, { age }))}</span>
                                </span>`);
    }
    const phone = String(profile.phone || '').trim();
    if (phone) {
        contacts.push(`<span class="resume-contact" aria-label="${escapeHtml(formatMessage(text.phoneAria, { phone }))}">
                                    ${renderIcon('phone')}
                                    <span>${escapeHtml(phone)}</span>
                                </span>`);
    }
    if (profile.email) {
        const email = String(profile.email).trim();
        contacts.push(`<span class="resume-email-group">
                                    <a class="resume-contact" href="${safeUrl(`mailto:${email}`)}">
                                        ${renderIcon('mail')}
                                        <span>${escapeHtml(email)}</span>
                                    </a>
                                    <button class="resume-copy-button" type="button" data-copy-email="${escapeHtml(email)}" aria-label="${escapeHtml(text.copyEmail)}" aria-describedby="resumeActionStatus" title="${escapeHtml(text.copyEmail)}">
                                        ${renderIcon('copy', 'resume-copy-icon')}
                                        ${renderIcon('check', 'resume-copy-success-icon')}
                                    </button>
                                </span>`);
    }
    return contacts.join('\n                                ');
}

function renderResearchInterests(profile, text) {
    const interests = getResearchInterests(profile);
    if (!interests.length) return '';
    return `<div class="research-interests" aria-label="${escapeHtml(text.researchInterests)}">
                                ${interests.map(interest => `<span>${escapeHtml(interest)}</span>`).join('')}
                            </div>`;
}

function renderFooter(profile, seo, text) {
    const footer = isRecord(profile.footer) ? profile.footer : {};
    if (footer.enabled === false) return '';

    const segments = [];
    const identityParts = [];
    const startYear = String(footer.startYear || '').trim();
    if (startYear) identityParts.push(`&copy; ${escapeHtml(startYear)}`);
    if (footer.showDomain !== false && profile.domain) {
        identityParts.push(`<a href="${escapeHtml(seo.rootSiteUrl)}">${escapeHtml(profile.domain)}</a>`);
    }
    if (identityParts.length) segments.push({ html: identityParts.join('&nbsp;') });
    if (footer.showLastUpdated !== false) {
        segments.push({ html: escapeHtml(formatMessage(text.footerLastUpdated, { date: seo.lastUpdated })) });
    }
    if (footer.showVisitorCount !== false) {
        segments.push({
            html: `${escapeHtml(text.footerVisitors)} <strong id="busuanzi_value_site_uv">0</strong>`,
            id: 'busuanzi_container_site_uv',
            className: 'visitor-counter',
            hidden: true
        });
    }
    const footerText = String(footer.text || '').trim();
    if (footerText) segments.push({ html: escapeHtml(footerText) });
    if (!segments.length) return '';

    return `<footer class="footer">
            <p>${segments.map(segment => {
                const id = segment.id ? ` id="${segment.id}"` : '';
                const className = `footer-segment${segment.className ? ` ${segment.className}` : ''}`;
                const style = segment.hidden ? ' style="display:none"' : '';
                return `<span${id} class="${className}"${style}>${segment.html}</span>`;
            }).join('\n                ')}</p>
        </footer>`;
}

function renderVisitorCounterScript(profile) {
    const footer = isRecord(profile.footer) ? profile.footer : {};
    if (footer.enabled === false || footer.showVisitorCount === false) return '';
    return `<script>
    (function() {
        var localHosts = ['localhost', '127.0.0.1', '::1', '[::1]'];
        if (localHosts.indexOf(window.location.hostname) !== -1) return;
        var script = document.createElement('script');
        script.async = true;
        script.src = 'https://busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js';
        document.body.appendChild(script);
    })();
    </script>`;
}

function renderAnnouncementsSection(announcements, text) {
    const activeAnnouncements = announcements.filter(item => item && item.content);
    if (!activeAnnouncements.length) return '';
    const items = activeAnnouncements.map((item, index) => {
        const link = item.link && item.link.label && item.link.url
            ? `<a href="${safeUrl(item.link.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.link.label)}${renderIcon('external-link')}</a>`
            : '';
        return `<div class="announcement-slide${index === 0 ? ' is-active' : ''}" data-announcement-slide data-expires-at="${escapeHtml(item.expiresAt || '')}" aria-hidden="${index === 0 ? 'false' : 'true'}">
                            <span class="announcement-icon" aria-hidden="true">${escapeHtml(item.icon || '📢')}</span>
                            <p>${escapeHtml(item.content)}</p>
                            ${link}
                        </div>`;
    }).join('\n                        ');
    const indicators = activeAnnouncements.map((item, index) => {
        return `<button type="button" class="announcement-dot${index === 0 ? ' is-active' : ''}" data-announcement-index="${index}" aria-label="${escapeHtml(formatMessage(text.announcementIndex, { index: index + 1 }))}" aria-pressed="${index === 0 ? 'true' : 'false'}"></button>`;
    }).join('');
    return `<section class="announcement-banner" id="announcementBanner" aria-label="${escapeHtml(text.announcementBanner)}">
                    <div class="announcement-inner">
                        <div class="announcement-track" aria-live="off">
                            ${items}
                        </div>
                        <div class="announcement-dots" aria-label="${escapeHtml(text.announcementNavigation)}">
                            ${indicators}
                        </div>
                    </div>
                </section>`;
}

function renderEducationSection(education, text) {
    if (!education.length) return '';
    const items = education.map(item => {
        const date = [item.start, item.end].filter(Boolean).join(' - ');
        const qualification = [item.degree, item.major].filter(Boolean).join(' · ');
        return `<div class="education-item">
                            <div class="education-date">${escapeHtml(date)}</div>
                            <div class="education-rail"><span></span></div>
                            <div class="education-content">
                                <h3>${escapeHtml(item.school)}</h3>
                                ${qualification ? `<p class="education-degree">${escapeHtml(qualification)}</p>` : ''}
                                ${item.description ? `<p class="education-description">${escapeHtml(item.description)}</p>` : ''}
                            </div>
                        </div>`;
    }).join('\n                        ');
    return `<section class="resume-section" aria-labelledby="educationHeading">
                    <h2 class="resume-section-title" id="educationHeading">${escapeHtml(text.educationHeading)}</h2>
                    <div class="education-list">
                        ${items}
                    </div>
                </section>`;
}

function renderAwardsSection(awards, text) {
    if (!awards.length) return '';
    const items = awards.map(item => {
        return `<div class="award-item">
                            <div class="award-date">${escapeHtml(item.date)}</div>
                            <div class="award-content">
                                <div class="award-heading">
                                    <h3>${escapeHtml(item.title)}</h3>
                                    ${item.issuer ? `<span>${escapeHtml(item.issuer)}</span>` : ''}
                                </div>
                                ${item.description ? `<p>${escapeHtml(item.description)}</p>` : ''}
                            </div>
                        </div>`;
    }).join('\n                        ');
    return `<section class="resume-section" aria-labelledby="awardsHeading">
                    <h2 class="resume-section-title" id="awardsHeading">${escapeHtml(text.awardsHeading)}</h2>
                    <div class="awards-list">
                        ${items}
                    </div>
                </section>`;
}

function renderWorkLinks(links) {
    if (!Array.isArray(links) || !links.length) return '';
    return `<div class="work-links">${links.map(link => {
        return `<a href="${safeUrl(link.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(link.label)}${renderIcon('external-link')}</a>`;
    }).join('')}</div>`;
}

function renderWorksSection(works, text) {
    if (!works.length) return '';
    const cards = works.map(item => {
        const tag = item.tag === 'paper' ? 'paper' : 'project';
        const tagLabel = tag === 'paper' ? text.paper : text.project;
        const meta = tag === 'paper' ? item.publication : item.period;
        const context = tag === 'paper' ? item.authors : item.organization;
        const keywords = Array.isArray(item.keywords) ? item.keywords : [];
        return `<article class="work-card work-card-${tag}">
                            <div class="work-card-header">
                                <span class="work-type">${tagLabel}</span>
                                ${meta ? `<span class="work-meta">${escapeHtml(meta)}</span>` : ''}
                            </div>
                            <h3>${escapeHtml(item.title)}</h3>
                            ${context ? `<p class="work-context">${escapeHtml(context)}</p>` : ''}
                            ${item.description ? `<p class="work-description">${escapeHtml(item.description)}</p>` : ''}
                            <div class="work-card-footer">
                                ${keywords.length ? `<div class="work-keywords">${keywords.map(keyword => `<span>${escapeHtml(keyword)}</span>`).join('')}</div>` : ''}
                                ${renderWorkLinks(item.links)}
                            </div>
                        </article>`;
    }).join('\n                        ');
    return `<section class="resume-section" aria-labelledby="worksHeading">
                    <h2 class="resume-section-title" id="worksHeading">${escapeHtml(text.worksHeading)}</h2>
                    <div class="works-grid">
                        ${cards}
                    </div>
                </section>`;
}

function readFiles(filePaths) {
    return filePaths.map(f => fs.readFileSync(path.join(__dirname, f), 'utf8')).join('\n');
}

function resolvePageAssetUrl(value, locale) {
    const url = String(value || '').trim();
    if (locale === 'en' && url.startsWith('./')) return `../${url.slice(2)}`;
    return url;
}

function createPdfFilename(profile, locale) {
    const name = String(profile.name || 'resume').trim();
    if (locale === 'en') {
        const safeName = name.replace(/\s+/g, '-').replace(/[^A-Za-z0-9._-]/g, '') || 'resume';
        return `${safeName}-Resume.pdf`;
    }
    return `${name}-简历.pdf`;
}

function applySourceFeatureVisibility(source, options) {
    PAGE_IDS.forEach(pageId => {
        if (options[pageId]) return;
        const pageBlock = new RegExp(`[\\t ]*\\/\\* PAGE:${pageId}:START \\*\\/[\\s\\S]*?\\/\\* PAGE:${pageId}:END \\*\\/\\r?\\n?`, 'g');
        source = source.replace(pageBlock, '');
    });
    BUILD_FEATURE_IDS.forEach(featureId => {
        if (options[featureId]) return;
        const featureBlock = new RegExp(`[\\t ]*\\/\\* FEATURE:${featureId}:START \\*\\/[\\s\\S]*?\\/\\* FEATURE:${featureId}:END \\*\\/\\r?\\n?`, 'g');
        source = source.replace(featureBlock, '');
    });
    return source
        .replace(/\/\* PAGE:(?:home|resume|bookmarks|apps):(?:START|END) \*\//g, '')
        .replace(/\/\* FEATURE:language:(?:START|END) \*\//g, '');
}

function writeHashedAsset(assetsDir, baseName, extension, content) {
    const hash = crypto.createHash('sha256').update(content).digest('hex').slice(0, 10);
    const fileName = `${baseName}.${hash}.${extension}`;
    fs.writeFileSync(path.join(assetsDir, fileName), content);
    return `assets/${fileName}`;
}

function buildFrontendAssets(options) {
    const assetsDir = path.join(__dirname, 'dist/assets');
    fs.mkdirSync(assetsDir, { recursive: true });

    const cssFiles = ['src/css/common.css', 'src/css/modern.css'];
    const css = applySourceFeatureVisibility(readFiles(cssFiles), options);
    const siteJs = applySourceFeatureVisibility(readFiles([
        'src/js/common.js',
        'src/js/modern/main.js'
    ]), options);
    const wrappedSiteJs = "(function(){\n'use strict';\n" + siteJs + "\n})();";
    const iconSprite = fs.readFileSync(path.join(__dirname, 'src/assets/icons.svg'), 'utf8');

    const manifest = {
        stylesheet: writeHashedAsset(assetsDir, 'site', 'css', css),
        mainScript: writeHashedAsset(assetsDir, 'site', 'js', wrappedSiteJs),
        iconSprite: writeHashedAsset(assetsDir, 'icons', 'svg', iconSprite),
        apps: {}
    };

    if (options.apps) {
        APPS.forEach(app => {
            const appCss = readFiles(['src/css/components/apps.css', `src/css/components/${app.css}`]);
            const appJs = readFiles(['src/js/common.js', ...app.js.map(file => `src/js/${file}`), 'src/js/app-page.js']);
            manifest.apps[app.id] = {
                stylesheet: writeHashedAsset(assetsDir, `app-${app.id}`, 'css', appCss),
                script: writeHashedAsset(assetsDir, `app-${app.id}`, 'js', `(function(){\n'use strict';\n${appJs}\n})();`)
            };
        });
    }

    return manifest;
}

function resolveBuiltAssetUrl(assetPath, locale) {
    if (!assetPath) return '';
    return `${locale === 'en' ? '../' : './'}${assetPath}`;
}

function renderAppDirectory(text) {
    return APPS.map(app => `<a class="app-directory-link" href="./apps/${app.id}/">
                        <span class="app-directory-icon">${renderIcon(app.icon)}</span>
                        <span class="app-directory-copy"><strong>${escapeHtml(text[app.title])}</strong><span>${escapeHtml(text[app.description])}</span></span>
                        ${renderIcon('chevron-left', 'app-directory-arrow')}
                    </a>`).join('\n                    ');
}

function applyBuildVisibility(html, options) {
    PAGE_IDS.forEach(pageId => {
        if (options[pageId]) return;
        const pageBlock = new RegExp(`[\\t ]*<!-- PAGE:${pageId}:START -->[\\s\\S]*?<!-- PAGE:${pageId}:END -->\\r?\\n?`, 'g');
        html = html.replace(pageBlock, '');
    });
    BUILD_FEATURE_IDS.forEach(featureId => {
        if (options[featureId]) return;
        const featureBlock = new RegExp(`[\\t ]*<!-- FEATURE:${featureId}:START -->[\\s\\S]*?<!-- FEATURE:${featureId}:END -->\\r?\\n?`, 'g');
        html = html.replace(featureBlock, '');
    });
    return html
        .replace(/<!-- PAGE:(?:home|resume|bookmarks|apps):(?:START|END) -->/g, '')
        .replace(/<!-- FEATURE:language:(?:START|END) -->/g, '');
}

function buildHomepage(config, seo, locale, assetManifest) {
    const text = UI_TEXT[locale];
    const enabledPageIds = PAGE_IDS.filter(pageId => config.pages[pageId]);
    const defaultPageId = enabledPageIds[0];
    const runtimeText = Object.fromEntries(MAIN_RUNTIME_TEXT_KEYS.map(key => [key, text[key]]));
    const pageI18n = JSON.stringify(runtimeText).replace(/</g, '\\u003c');
    const stylesheetUrl = resolveBuiltAssetUrl(assetManifest.stylesheet, locale);
    const mainScriptUrl = resolveBuiltAssetUrl(assetManifest.mainScript, locale);
    const iconSpriteUrl = resolveBuiltAssetUrl(assetManifest.iconSprite, locale);
    const runtimeConfig = `window.PAGE_LOCALE = ${JSON.stringify(locale)};\nwindow.PAGE_I18N = ${pageI18n};\nwindow.ENABLED_PAGE_IDS = ${JSON.stringify(enabledPageIds)};\nwindow.ICON_SPRITE_URL = ${JSON.stringify(iconSpriteUrl)};\n`;

    let html = fs.readFileSync(path.join(__dirname, 'src/templates/modern.template.html'), 'utf8');
    html = html.replace('{{RUNTIME_CONFIG}}', runtimeConfig);
    html = html.replace(/{{STYLESHEET_URL}}/g, escapeHtml(stylesheetUrl));
    html = html.replace(/{{MAIN_SCRIPT_URL}}/g, escapeHtml(mainScriptUrl));

    const avatarUrl = resolvePageAssetUrl(config.profile.avatar, locale);
    const avatarAlt = formatMessage(text.avatarAlt, { name: config.profile.name });
    const rootSiteUrl = seo.rootSiteUrl;
    const englishSiteUrl = new URL('en/', rootSiteUrl).href;

    html = html.replace(/\{\{T_([A-Z0-9_]+)\}\}/g, (match, key) => {
        if (Object.prototype.hasOwnProperty.call(text, key)) return escapeHtml(text[key]);
        console.warn(`Missing ${locale} template translation: ${key}`);
        return '';
    });
    html = html.replace(/{{HTML_LANG}}/g, locale === 'en' ? 'en' : 'zh-CN');
    html = html.replace(/{{OG_LOCALE}}/g, locale === 'en' ? 'en_US' : 'zh_CN');
    html = html.replace(/{{ZH_URL}}/g, escapeHtml(rootSiteUrl));
    html = html.replace(/{{EN_URL}}/g, escapeHtml(englishSiteUrl));
    html = html.replace(/{{LANG_SWITCH_URL}}/g, locale === 'en' ? '/' : '/en/');
    html = html.replace(/{{LANG_SWITCH_HREFLANG}}/g, locale === 'en' ? 'zh-CN' : 'en');
    html = html.replace(/{{LANG_SWITCH_LABEL}}/g, locale === 'en' ? '中' : 'EN');
    html = html.replace(/{{DEFAULT_PAGE_ID}}/g, defaultPageId);
    html = html.replace(/{{DEFAULT_PAGE_HREF}}/g, defaultPageId === 'home' ? '#' : `#${defaultPageId}`);
    html = html.replace(/{{PROFILE_AVATAR_ALT}}/g, escapeHtml(avatarAlt));
    html = html.replace(/{{PDF_URL}}/g, locale === 'en' ? '/resume-en.pdf' : '/resume.pdf');
    html = html.replace(/{{PDF_FILENAME}}/g, escapeHtml(createPdfFilename(config.profile, locale)));
    html = html.replace(/{{SITE_NAME}}/g, escapeHtml(config.profile.siteName));
    html = html.replace(/{{SITE_ICON}}/g, escapeHtml(config.profile.siteIcon));
    html = html.replace(/{{SITE_FAVICON}}/g, createTextFavicon(config.profile.siteIcon));
    html = html.replace(/{{PROFILE_NAME}}/g, escapeHtml(config.profile.name));
    html = html.replace(/{{PROFILE_NICKNAME}}/g, escapeHtml(config.profile.nickname || config.profile.name));
    html = html.replace(/{{PROFILE_TITLE}}/g, escapeHtml(config.profile.title));
    html = html.replace(/{{PROFILE_AVATAR}}/g, safeUrl(avatarUrl));
    html = html.replace(/{{PROFILE_SLOGAN}}/g, escapeHtml(config.profile.slogan));
    html = html.replace(/{{PROFILE_INTRODUCTION}}/g, escapeHtml(config.profile.introduction));
    html = html.replace(/{{SEO_DESCRIPTION}}/g, escapeHtml(seo.description));
    html = html.replace(/{{SEO_KEYWORDS}}/g, escapeHtml(seo.keywords));
    html = html.replace(/{{SITE_URL}}/g, escapeHtml(seo.siteUrl));
    html = html.replace(/{{SHARE_IMAGE}}/g, escapeHtml(seo.shareImage));
    html = html.replace('{{STRUCTURED_DATA}}', seo.structuredData);
    html = html.replace('{{FOOTER}}', renderFooter(config.profile, seo, text));
    html = html.replace('{{VISITOR_COUNTER_SCRIPT}}', renderVisitorCounterScript(config.profile));
    html = html.replace('{{HERO_LINKS}}', renderProfileLinks(config.profile.links));
    html = html.replace('{{ANNOUNCEMENTS_SECTION}}', renderAnnouncementsSection(config.announcements, text));
    html = html.replace('{{RESUME_CONTACTS}}', renderResumeContacts(config.profile, text));
    html = html.replace('{{RESEARCH_INTERESTS}}', renderResearchInterests(config.profile, text));
    html = html.replace('{{EDUCATION_SECTION}}', renderEducationSection(config.education, text));
    html = html.replace('{{AWARDS_SECTION}}', renderAwardsSection(config.awards, text));
    html = html.replace('{{WORKS_SECTION}}', renderWorksSection(config.works, text));
    html = html.replace('{{APPS_DIRECTORY}}', renderAppDirectory(text));

    const bookmarkTotal = config.bookmarks.reduce((total, folder) => total + folder.links.length, 0);
    html = html.replace('{{BOOKMARK_STATUS}}', escapeHtml(formatMessage(text.bookmarksTotal, { count: bookmarkTotal })));

    const bookmarkTagCounts = new Map();
    config.bookmarks.forEach(folder => {
        folder.links.forEach(link => {
            getBookmarkTags(link).forEach(label => {
                const normalized = label.toLowerCase();
                const existing = bookmarkTagCounts.get(normalized);
                if (existing) existing.count++;
                else bookmarkTagCounts.set(normalized, { label, count: 1 });
            });
        });
    });
    const bookmarkTagFilter = bookmarkTagCounts.size
        ? `<div class="bookmark-tag-filter" id="bookmarkTagFilter" aria-label="${escapeHtml(text.BOOKMARK_TAG_FILTER_ARIA)}">
                        <button type="button" class="bookmark-tag-filter-button is-active" data-bookmark-tag="" aria-pressed="true">${escapeHtml(text.BOOKMARK_TAG_ALL)} <span>${bookmarkTotal}</span></button>
                        ${Array.from(bookmarkTagCounts.entries()).map(([normalized, tag]) => `<button type="button" class="bookmark-tag-filter-button" data-bookmark-tag="${escapeHtml(normalized)}" aria-pressed="false">${escapeHtml(tag.label)} <span>${tag.count}</span></button>`).join('')}
                    </div>`
        : '';
    html = html.replace('{{BOOKMARK_TAG_FILTER}}', bookmarkTagFilter);

    const bookmarks = config.bookmarks.map((folder, idx) => {
        const links = folder.links.map(l => {
            const description = String(l.description || '').trim();
            const tags = getBookmarkTags(l);
            const tagItems = tags.length
                ? `<span class="bookmark-link-tags">${tags.map(tag => `<span data-bookmark-tag-value="${escapeHtml(tag.toLowerCase())}">${escapeHtml(tag)}</span>`).join('')}</span>`
                : '';
            return `<a href="${safeUrl(l.url)}" target="_blank" rel="noopener noreferrer" class="bookmark-link" data-bookmark-url="${escapeHtml(l.url)}">
                            <span class="bookmark-link-heading"><span>${escapeHtml(l.label)}</span>${renderIcon('external-link')}</span>
                            ${description ? `<span class="bookmark-link-description">${escapeHtml(description)}</span>` : ''}
                            ${tagItems}
                        </a>`;
        }).join('\n                        ');
        const groupId = `bookmarkGroup${idx + 1}`;
        return `<div class="bookmark-category" data-bookmark-category="${escapeHtml(folder.name)}">
                    <button type="button" class="category-header" aria-expanded="${idx === 0 ? 'true' : 'false'}" aria-controls="${groupId}" onclick="toggleCategory(this)">
                        <span class="category-title">
                            <span>${escapeHtml(folder.name)}</span>
                            <span class="category-count">${folder.links.length}</span>
                        </span>
                        ${renderIcon('chevron-down', `category-toggle ${idx === 0 ? 'expanded' : ''}`)}
                    </button>
                    <div class="bookmark-links ${idx === 0 ? 'show' : ''}" id="${groupId}">
                        ${links}
                    </div>
                </div>`;
    }).join('\n                        ');
    html = html.replace('{{BOOKMARKS}}', bookmarks);
    html = html.replace(/{{ICON_SPRITE_URL}}/g, escapeHtml(iconSpriteUrl));
    html = applyBuildVisibility(html, config.pages);

    const outputPath = locale === 'en'
        ? path.join(__dirname, 'dist/en/index.html')
        : path.join(__dirname, 'dist/index.html');
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, html);
    console.log(`✅ ${locale === 'en' ? 'English' : 'Chinese'} homepage build completed!`);
}

function renderPomodoroOverlay() {
    return `<div class="pomodoro-toast" id="pomodoroToast" role="alert" aria-live="assertive" hidden>
        <div class="pomodoro-toast-icon" aria-hidden="true"><svg aria-hidden="true"><use href="{{ICON_SPRITE_URL}}#bell"></use></svg></div>
        <div class="pomodoro-toast-content"><strong id="pomodoroToastMessage">{{T_POMODORO_WORK_COMPLETE}}</strong><span id="pomodoroToastDetail">{{T_POMODORO_AUTO_BREAK}}</span></div>
        <button class="pomodoro-toast-close" id="pomodoroToastClose" type="button" aria-label="{{T_CLOSE_REMINDER}}" title="{{T_CLOSE_REMINDER}}"><svg aria-hidden="true"><use href="{{ICON_SPRITE_URL}}#x"></use></svg></button>
    </div>`;
}

function buildAppPages(config, seo, locale, assetManifest) {
    const text = UI_TEXT[locale];
    const localeRoot = locale === 'en' ? '/en/' : '/';
    const assetPrefix = locale === 'en' ? '../../../' : '../../';
    const iconSpriteUrl = `${assetPrefix}${assetManifest.iconSprite}`;
    const defaultPageId = PAGE_IDS.find(pageId => config.pages[pageId]);
    const pageUrl = pageId => pageId === 'home' ? localeRoot : `${localeRoot}#${pageId}`;

    return APPS.map(app => {
        const appUrl = new URL(`${locale === 'en' ? 'en/' : ''}apps/${app.id}/`, seo.rootSiteUrl).href;
        const zhAppUrl = new URL(`apps/${app.id}/`, seo.rootSiteUrl).href;
        const enAppUrl = new URL(`en/apps/${app.id}/`, seo.rootSiteUrl).href;
        const runtimeText = Object.fromEntries(['themeToLight', 'themeToDark', ...app.runtime].map(key => [key, text[key]]));
        const runtimeConfig = `window.PAGE_I18N = ${JSON.stringify(runtimeText)};\nwindow.APP_ID = ${JSON.stringify(app.id)};\n`;
        let html = fs.readFileSync(path.join(__dirname, 'src/templates/app.template.html'), 'utf8');
        const content = fs.readFileSync(path.join(__dirname, `src/templates/apps/${app.id}.html`), 'utf8').trim();

        html = html.replace('{{APP_CONTENT}}', content);
        html = html.replace('{{APP_OVERLAY}}', app.id === 'pomodoro' ? renderPomodoroOverlay() : '');
        html = html.replace(/\{\{T_([A-Z0-9_]+)\}\}/g, (match, key) => Object.prototype.hasOwnProperty.call(text, key) ? escapeHtml(text[key]) : '');
        const replacements = {
            HTML_LANG: locale === 'en' ? 'en' : 'zh-CN', APP_TITLE: escapeHtml(text[app.title]), APP_DESCRIPTION: escapeHtml(text[app.description]),
            SITE_NAME: escapeHtml(config.profile.siteName), SITE_ICON: escapeHtml(config.profile.siteIcon), SITE_FAVICON: createTextFavicon(config.profile.siteIcon), PROFILE_NAME: escapeHtml(config.profile.name),
            APP_URL: appUrl, ZH_APP_URL: zhAppUrl, EN_APP_URL: enAppUrl, DEFAULT_PAGE_URL: pageUrl(defaultPageId), HOME_URL: pageUrl('home'), RESUME_URL: pageUrl('resume'), BOOKMARKS_URL: pageUrl('bookmarks'), APPS_URL: pageUrl('apps'),
            LANG_SWITCH_URL: locale === 'en' ? `/apps/${app.id}/` : `/en/apps/${app.id}/`, LANG_SWITCH_HREFLANG: locale === 'en' ? 'zh-CN' : 'en', LANG_SWITCH_LABEL: locale === 'en' ? '中' : 'EN',
            SITE_STYLESHEET_URL: `${assetPrefix}${assetManifest.stylesheet}`, APP_STYLESHEET_URL: `${assetPrefix}${assetManifest.apps[app.id].stylesheet}`,
            ICON_SPRITE_URL: iconSpriteUrl, APP_SCRIPT_URL: `${assetPrefix}${assetManifest.apps[app.id].script}`, RUNTIME_CONFIG: runtimeConfig,
            FOOTER: renderFooter(config.profile, seo, text), VISITOR_COUNTER_SCRIPT: renderVisitorCounterScript(config.profile)
        };
        Object.entries(replacements).forEach(([key, value]) => {
            html = html.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
        });
        html = applyBuildVisibility(html, config.pages);

        const outputPath = path.join(__dirname, 'dist', locale === 'en' ? 'en' : '', 'apps', app.id, 'index.html');
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        fs.writeFileSync(outputPath, html);
        return { siteUrl: appUrl, lastUpdated: seo.lastUpdated };
    });
}

function writeSeoFiles(zhSeo, enSeo, appPages = []) {
    const sitemapEntries = [zhSeo, enSeo, ...appPages].filter(Boolean).map(seo => `    <url>
        <loc>${escapeHtml(seo.siteUrl)}</loc>
        <lastmod>${seo.lastUpdated}</lastmod>
    </url>`).join('\n');
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries}
</urlset>
`;
    const robots = `User-agent: *
Allow: /

Sitemap: ${zhSeo.rootSiteUrl}sitemap.xml
`;
    fs.writeFileSync(path.join(__dirname, 'dist/sitemap.xml'), sitemap);
    fs.writeFileSync(path.join(__dirname, 'dist/robots.txt'), robots);
}

function copyStaticAssets(languageEnabled) {
    const assets = ['avatar.png', 'BingSiteAuth.xml', 'resume.pdf'];
    if (languageEnabled) assets.push('resume-en.pdf');
    assets.forEach(file => {
        const src = path.join(__dirname, file);
        const dest = path.join(__dirname, 'dist', file);
        if (fs.existsSync(src)) {
            fs.copyFileSync(src, dest);
        }
    });
}

function parseProfileEnv(envValue, envName) {
    if (!envValue) return {};
    const parsed = parseJsonEnv(envValue, {});
    if (isRecord(parsed)) return parsed;
    console.warn(`${envName} must be a JSON object; using inherited values.`);
    return {};
}

function mergeProfile(baseProfile, overrides, envName) {
    let links = baseProfile.links;
    if (overrides.links !== undefined) {
        if (isRecordArray(overrides.links)) links = overrides.links;
        else console.warn(`${envName}.links must be a JSON array with valid object items; using inherited links.`);
    }

    let footer = baseProfile.footer;
    if (overrides.footer !== undefined) {
        if (isRecord(overrides.footer)) footer = { ...baseProfile.footer, ...overrides.footer };
        else console.warn(`${envName}.footer must be a JSON object; using the inherited footer.`);
    }

    return {
        ...baseProfile,
        ...overrides,
        links,
        footer
    };
}

function build() {
    const distDir = path.join(__dirname, 'dist');
    fs.rmSync(distDir, { recursive: true, force: true });
    fs.mkdirSync(distDir, { recursive: true });

    const itemWithOptionalLinks = item => isRecord(item)
        && (item.links === undefined || isRecordArray(item.links));
    const bookmarkFolder = folder => isRecord(folder) && isRecordArray(folder.links);
    const pages = parsePageVisibilityEnv(process.env.PAGES_JSON);

    const zhProfile = mergeProfile(
        DEFAULT_CONFIG.profile,
        parseProfileEnv(process.env.PROFILE_JSON, 'PROFILE_JSON'),
        'PROFILE_JSON'
    );
    const zhConfig = {
        pages,
        profile: zhProfile,
        announcements: parseJsonArrayEnv(process.env.ANNOUNCEMENTS_JSON, DEFAULT_CONFIG.announcements, 'ANNOUNCEMENTS_JSON'),
        education: parseJsonArrayEnv(process.env.EDUCATION_JSON, DEFAULT_CONFIG.education, 'EDUCATION_JSON'),
        awards: parseJsonArrayEnv(process.env.AWARDS_JSON, DEFAULT_CONFIG.awards, 'AWARDS_JSON'),
        works: parseJsonArrayEnv(process.env.WORKS_JSON, DEFAULT_CONFIG.works, 'WORKS_JSON', itemWithOptionalLinks),
        bookmarks: parseJsonArrayEnv(process.env.BOOKMARKS, DEFAULT_CONFIG.bookmarks, 'BOOKMARKS', bookmarkFolder)
    };

    const enProfile = mergeProfile(
        zhProfile,
        parseProfileEnv(process.env.PROFILE_EN_JSON, 'PROFILE_EN_JSON'),
        'PROFILE_EN_JSON'
    );
    const enConfig = {
        pages,
        profile: enProfile,
        announcements: parseJsonArrayEnv(process.env.ANNOUNCEMENTS_EN_JSON, zhConfig.announcements, 'ANNOUNCEMENTS_EN_JSON'),
        education: parseJsonArrayEnv(process.env.EDUCATION_EN_JSON, zhConfig.education, 'EDUCATION_EN_JSON'),
        awards: parseJsonArrayEnv(process.env.AWARDS_EN_JSON, zhConfig.awards, 'AWARDS_EN_JSON'),
        works: parseJsonArrayEnv(process.env.WORKS_EN_JSON, zhConfig.works, 'WORKS_EN_JSON', itemWithOptionalLinks),
        bookmarks: parseJsonArrayEnv(process.env.BOOKMARKS_EN, zhConfig.bookmarks, 'BOOKMARKS_EN', bookmarkFolder)
    };

    const zhSeo = createSeoData(zhConfig.profile, 'zh', UI_TEXT.zh);
    const enSeo = pages.language
        ? createSeoData(enConfig.profile, 'en', UI_TEXT.en)
        : null;
    const assetManifest = buildFrontendAssets(pages);
    buildHomepage(zhConfig, zhSeo, 'zh', assetManifest);
    if (pages.language) buildHomepage(enConfig, enSeo, 'en', assetManifest);
    const appPages = pages.apps
        ? [...buildAppPages(zhConfig, zhSeo, 'zh', assetManifest), ...(pages.language ? buildAppPages(enConfig, enSeo, 'en', assetManifest) : [])]
        : [];
    writeSeoFiles(zhSeo, enSeo, appPages);
    copyStaticAssets(pages.language);

    console.log('\n📊 Build Summary:');
    console.log(`   Chinese profile: ${zhConfig.profile.name}`);
    if (pages.language) console.log(`   English profile: ${enConfig.profile.name}`);
    console.log(`   Pages: ${PAGE_IDS.filter(pageId => pages[pageId]).join(', ')}`);
    console.log(`   Optional features: ${BUILD_FEATURE_IDS.filter(featureId => pages[featureId]).join(', ') || 'none'}`);
    const localeCount = (zhCount, enCount) => pages.language
        ? `${zhCount} zh / ${enCount} en`
        : `${zhCount} zh`;
    console.log(`   Announcements: ${localeCount(zhConfig.announcements.length, enConfig.announcements.length)}`);
    console.log(`   Education: ${localeCount(zhConfig.education.length, enConfig.education.length)}`);
    console.log(`   Awards: ${localeCount(zhConfig.awards.length, enConfig.awards.length)}`);
    console.log(`   Works: ${localeCount(zhConfig.works.length, enConfig.works.length)}`);
    console.log(`   Bookmarks: ${localeCount(zhConfig.bookmarks.length, enConfig.bookmarks.length)} folders`);
}

build();

const fs = require('fs');
const path = require('path');
const { DEFAULT_CONFIG, ICONS, EXTERNAL_ICON } = require('./src/config/default');

const PAGE_IDS = ['home', 'resume', 'bookmarks', 'apps'];
const BUILD_FEATURE_IDS = ['language'];
const BUILD_OPTION_IDS = [...PAGE_IDS, ...BUILD_FEATURE_IDS];

const UI_TEXT = {
    zh: {
        NAV_HOME: '首页', NAV_RESUME: '简历', NAV_BOOKMARKS: '书签', NAV_APPS: '应用',
        SWITCH_LANGUAGE_ARIA: 'Switch to English', THEME_TO_DARK: '切换到深色模式',
        DOWNLOAD_PDF: '下载 PDF', BOOKMARKS_TITLE: '我的书签', BOOKMARK_SEARCH_LABEL: '搜索书签',
        BOOKMARK_SEARCH_PLACEHOLDER: '搜索分类、名称或网址', BOOKMARK_CLEAR: '清空搜索', BOOKMARK_EMPTY: '没有匹配的书签',
        APPS_TITLE: '实用工具与小游戏', APPS_LOADING: '正在加载应用', CLOCK: '时钟',
        CLOCK_DATE_PLACEHOLDER: '2024年1月1日 星期一', POMODORO: '番茄钟', POMODORO_READY: '准备专注',
        START: '开始', RESET: '重置', SOUND_REMINDER: '声音提醒', PREVIEW_REMINDER: '试听提醒',
        FOCUS: '专注', MINUTES: '分钟', BREAK: '休息', COMPLETED_PREFIX: '完成', COMPLETED_SUFFIX: '次', TOTAL_PREFIX: '累计',
        SCHULTE: '舒尔特方格', CURRENT_TIME: '当前用时(秒)', BEST_SCORE: '最佳记录', CLICK_TO_START: '点击开始', RESTART: '重新开始',
        CURRENT_SCORE: '当前分数', GAME_BOARD: '2048 棋盘', CONTINUE: '继续', PLAY_AGAIN: '再来一局', NEW_GAME: '新游戏',
        BACK_TO_TOP: '返回顶部', POMODORO_WORK_COMPLETE: '专注完成，休息一下', POMODORO_AUTO_BREAK: '已自动进入休息计时', CLOSE_REMINDER: '关闭提醒',
        avatarAlt: '{name}的头像', seoDescription: '{identity}的个人主页，{title}。{introduction}', seoKeywords: ['个人主页', '学术主页'],
        ageYears: '{age} 岁', phoneAria: '电话 {phone}', copyEmail: '复制邮箱地址', researchInterests: '研究兴趣',
        announcementIndex: '查看第 {index} 条公告', announcementBanner: '公告栏', announcementNavigation: '公告切换',
        educationHeading: '教育经历', awardsHeading: '获奖经历', worksHeading: '项目与论文', paper: '论文', project: '项目',
        footerLastUpdated: '更新于 {date}', footerVisitors: '访问者',
        backToTopProgress: '返回顶部，已阅读 {progress}%', backToTopTitle: '返回顶部 · {progress}%',
        appsLoadError: '应用加载失败，请刷新后重试', appsLoading: '正在加载应用', appsRegistrationError: '应用模块没有正确注册', appsBundleError: '应用代码加载失败',
        themeToLight: '切换到浅色模式', themeToDark: '切换到深色模式', copyNotAllowed: '浏览器未允许复制',
        pdfChecking: '检查中…', pdfCheckingStatus: '正在检查简历 PDF', pdfMissing: '简历 PDF 不存在', pdfDownloading: '开始下载', pdfDownloadingStatus: '简历 PDF 已开始下载',
        comingSoon: 'Coming soon...', downloadPdf: '下载 PDF', emailCopied: '邮箱地址已复制', copied: '已复制', emailCopiedStatus: '邮箱地址已复制：{email}',
        copyEmailFailed: '复制失败，请手动选择邮箱地址', copyFailed: '复制失败', fullscreenView: '全屏查看{title}', fullscreen: '全屏查看', fullscreenExit: '退出{title}全屏', restore: '恢复',
        bookmarksFound: '找到 {count} 个书签', bookmarksTotal: '共 {count} 个书签', dateLocale: 'zh-CN',
        pomodoroFocusRunning: '专注中...', pomodoroFocusReady: '准备专注', pomodoroBreakRunning: '休息中...', pomodoroBreakReady: '准备休息',
        pomodoroWorkComplete: '专注完成，休息一下', pomodoroBreakComplete: '休息结束，开始专注', pomodoroPreviewSoundOn: '提醒声音正常，到点会自动提示',
        pomodoroPreviewSoundOff: '声音已关闭，到点仍会显示页面提醒', pomodoroAutoBreak: '已自动进入休息计时', pomodoroAutoFocus: '已自动开始下一轮专注',
        pomodoroReminderTitle: '提醒：{message}', continue: '继续', pause: '暂停', start: '开始', gameOver: '游戏结束', gameWon: '达到 2048'
    },
    en: {
        NAV_HOME: 'Home', NAV_RESUME: 'Resume', NAV_BOOKMARKS: 'Bookmarks', NAV_APPS: 'Apps',
        SWITCH_LANGUAGE_ARIA: 'Switch to Chinese', THEME_TO_DARK: 'Switch to dark mode',
        DOWNLOAD_PDF: 'Download PDF', BOOKMARKS_TITLE: 'My Bookmarks', BOOKMARK_SEARCH_LABEL: 'Search bookmarks',
        BOOKMARK_SEARCH_PLACEHOLDER: 'Search categories, names, or URLs', BOOKMARK_CLEAR: 'Clear search', BOOKMARK_EMPTY: 'No matching bookmarks',
        APPS_TITLE: 'Tools & Mini Games', APPS_LOADING: 'Loading apps', CLOCK: 'Clock',
        CLOCK_DATE_PLACEHOLDER: 'Monday, January 1, 2024', POMODORO: 'Pomodoro Timer', POMODORO_READY: 'Ready to focus',
        START: 'Start', RESET: 'Reset', SOUND_REMINDER: 'Sound reminder', PREVIEW_REMINDER: 'Preview reminder',
        FOCUS: 'Focus', MINUTES: 'minutes', BREAK: 'Break', COMPLETED_PREFIX: 'Completed', COMPLETED_SUFFIX: 'sessions', TOTAL_PREFIX: 'Total',
        SCHULTE: 'Schulte Grid', CURRENT_TIME: 'Current time (s)', BEST_SCORE: 'Best', CLICK_TO_START: 'Click to start', RESTART: 'Restart',
        CURRENT_SCORE: 'Score', GAME_BOARD: '2048 board', CONTINUE: 'Continue', PLAY_AGAIN: 'Play again', NEW_GAME: 'New game',
        BACK_TO_TOP: 'Back to top', POMODORO_WORK_COMPLETE: 'Focus complete — take a break', POMODORO_AUTO_BREAK: 'Break timer started automatically', CLOSE_REMINDER: 'Close reminder',
        avatarAlt: '{name}\'s avatar', seoDescription: '{identity}\'s personal website. {title}. {introduction}', seoKeywords: ['personal website', 'academic homepage'],
        ageYears: 'Age {age}', phoneAria: 'Phone {phone}', copyEmail: 'Copy email address', researchInterests: 'Research interests',
        announcementIndex: 'View announcement {index}', announcementBanner: 'Announcements', announcementNavigation: 'Announcement navigation',
        educationHeading: 'Education', awardsHeading: 'Awards', worksHeading: 'Projects & Publications', paper: 'Paper', project: 'Project',
        footerLastUpdated: 'Last updated {date}', footerVisitors: 'Visitors',
        backToTopProgress: 'Back to top, {progress}% read', backToTopTitle: 'Back to top · {progress}%',
        appsLoadError: 'Failed to load apps. Please refresh and try again.', appsLoading: 'Loading apps', appsRegistrationError: 'App modules were not registered correctly', appsBundleError: 'Failed to load app code',
        themeToLight: 'Switch to light mode', themeToDark: 'Switch to dark mode', copyNotAllowed: 'Clipboard access was not allowed',
        pdfChecking: 'Checking…', pdfCheckingStatus: 'Checking resume PDF', pdfMissing: 'Resume PDF is unavailable', pdfDownloading: 'Downloading', pdfDownloadingStatus: 'Resume PDF download started',
        comingSoon: 'Coming soon...', downloadPdf: 'Download PDF', emailCopied: 'Email copied', copied: 'Copied', emailCopiedStatus: 'Email copied: {email}',
        copyEmailFailed: 'Copy failed. Please select the email address manually.', copyFailed: 'Copy failed', fullscreenView: 'View {title} in fullscreen', fullscreen: 'Fullscreen', fullscreenExit: 'Exit {title} fullscreen', restore: 'Restore',
        bookmarksFound: '{count} bookmarks found', bookmarksTotal: '{count} bookmarks', dateLocale: 'en-US',
        pomodoroFocusRunning: 'Focusing...', pomodoroFocusReady: 'Ready to focus', pomodoroBreakRunning: 'On a break...', pomodoroBreakReady: 'Ready for a break',
        pomodoroWorkComplete: 'Focus complete — take a break', pomodoroBreakComplete: 'Break complete — time to focus', pomodoroPreviewSoundOn: 'Sound is working and will play when time is up',
        pomodoroPreviewSoundOff: 'Sound is off; an on-page reminder will still appear', pomodoroAutoBreak: 'Break timer started automatically', pomodoroAutoFocus: 'Next focus session started automatically',
        pomodoroReminderTitle: 'Reminder: {message}', continue: 'Continue', pause: 'Pause', start: 'Start', gameOver: 'Game over', gameWon: 'You reached 2048'
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
        const icon = ICONS[link.icon] || '';
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
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                    <span id="resumeAge" data-birthday="${escapeHtml(profile.birthday)}">${escapeHtml(formatMessage(text.ageYears, { age }))}</span>
                                </span>`);
    }
    const phone = String(profile.phone || '').trim();
    if (phone) {
        contacts.push(`<span class="resume-contact" aria-label="${escapeHtml(formatMessage(text.phoneAria, { phone }))}">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.69 2.8a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.33 1.84.56 2.8.69A2 2 0 0 1 22 16.92z"></path></svg>
                                    <span>${escapeHtml(phone)}</span>
                                </span>`);
    }
    if (profile.email) {
        const email = String(profile.email).trim();
        contacts.push(`<span class="resume-email-group">
                                    <a class="resume-contact" href="${safeUrl(`mailto:${email}`)}">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"></rect><polyline points="3 7 12 13 21 7"></polyline></svg>
                                        <span>${escapeHtml(email)}</span>
                                    </a>
                                    <button class="resume-copy-button" type="button" data-copy-email="${escapeHtml(email)}" aria-label="${escapeHtml(text.copyEmail)}" aria-describedby="resumeActionStatus" title="${escapeHtml(text.copyEmail)}">
                                        <svg class="resume-copy-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                        <svg class="resume-copy-success-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 4 4L19 6"></path></svg>
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
            ? `<a href="${safeUrl(item.link.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.link.label)}${EXTERNAL_ICON}</a>`
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
        return `<a href="${safeUrl(link.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(link.label)}${EXTERNAL_ICON}</a>`;
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
    BUILD_FEATURE_IDS.forEach(featureId => {
        if (options[featureId]) return;
        const featureBlock = new RegExp(`[\\t ]*\\/\\* FEATURE:${featureId}:START \\*\\/[\\s\\S]*?\\/\\* FEATURE:${featureId}:END \\*\\/\\r?\\n?`, 'g');
        source = source.replace(featureBlock, '');
    });
    return source.replace(/\/\* FEATURE:language:(?:START|END) \*\//g, '');
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

function buildHomepage(config, seo, locale) {
    const text = UI_TEXT[locale];
    const enabledPageIds = PAGE_IDS.filter(pageId => config.pages[pageId]);
    const defaultPageId = enabledPageIds[0];
    const css = applySourceFeatureVisibility(readFiles([
        'src/css/common.css',
        'src/css/components/clock.css',
        'src/css/components/pomodoro.css',
        'src/css/components/schulte.css',
        'src/css/components/game2048.css',
        'src/css/modern.css'
    ]), config.pages);

    const js = applySourceFeatureVisibility(readFiles([
        'src/js/common.js',
        'src/js/modern/main.js'
    ]), config.pages);

    const appsJs = readFiles([
        'src/js/common.js',
        'src/js/clock.js',
        'src/js/pomodoro.js',
        'src/js/schulte.js',
        'src/js/vendor/2048-core.js',
        'src/js/game2048.js'
    ]);

    const runtimeText = { ...text };
    if (!config.pages.language) delete runtimeText.SWITCH_LANGUAGE_ARIA;
    const pageI18n = JSON.stringify(runtimeText).replace(/</g, '\\u003c');
    const runtimeConfig = `window.PAGE_LOCALE = ${JSON.stringify(locale)};\nwindow.PAGE_I18N = ${pageI18n};\nwindow.SITE_BASE_PATH = ${JSON.stringify(locale === 'en' ? '../' : './')};\nwindow.ENABLED_PAGE_IDS = ${JSON.stringify(enabledPageIds)};\n`;
    const wrappedJs = runtimeConfig + "(function(){\n'use strict';\n" + js + "\n})();";
    const wrappedAppsJs = "(function(){\n'use strict';\n" + appsJs
        + "\nwindow.JustAFishAppModules = { initClock: initClock, initPomodoro: initPomodoro, initSchulte: initSchulte, initGame2048: initGame2048 };\n})();";

    if (config.pages.apps) {
        const assetsDir = path.join(__dirname, 'dist/assets');
        if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });
        fs.writeFileSync(path.join(assetsDir, 'apps.js'), wrappedAppsJs);
    }

    let html = fs.readFileSync(path.join(__dirname, 'src/templates/modern.template.html'), 'utf8');
    html = html.replace('/* {{INLINE_CSS}} */', css);
    html = html.replace('/* {{INLINE_JS}} */', wrappedJs);

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

    const bookmarkTotal = config.bookmarks.reduce((total, folder) => total + folder.links.length, 0);
    html = html.replace('{{BOOKMARK_STATUS}}', escapeHtml(formatMessage(text.bookmarksTotal, { count: bookmarkTotal })));
    const bookmarks = config.bookmarks.map((folder, idx) => {
        const links = folder.links.map(l => {
            return `<a href="${safeUrl(l.url)}" target="_blank" rel="noopener noreferrer" class="bookmark-link" data-bookmark-label="${escapeHtml(l.label)}" data-bookmark-url="${escapeHtml(l.url)}">${escapeHtml(l.label)}${EXTERNAL_ICON}</a>`;
        }).join('\n                        ');
        const groupId = `bookmarkGroup${idx + 1}`;
        return `<div class="bookmark-category" data-bookmark-category="${escapeHtml(folder.name)}">
                    <button type="button" class="category-header" aria-expanded="${idx === 0 ? 'true' : 'false'}" aria-controls="${groupId}" onclick="toggleCategory(this)">
                        <span class="category-title">
                            <span>${escapeHtml(folder.name)}</span>
                            <span class="category-count">${folder.links.length}</span>
                        </span>
                        <svg class="category-toggle ${idx === 0 ? 'expanded' : ''}" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </button>
                    <div class="bookmark-links ${idx === 0 ? 'show' : ''}" id="${groupId}">
                        ${links}
                    </div>
                </div>`;
    }).join('\n                        ');
    html = html.replace('{{BOOKMARKS}}', bookmarks);
    html = applyBuildVisibility(html, config.pages);

    const outputPath = locale === 'en'
        ? path.join(__dirname, 'dist/en/index.html')
        : path.join(__dirname, 'dist/index.html');
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, html);
    console.log(`✅ ${locale === 'en' ? 'English' : 'Chinese'} homepage build completed!`);
}

function writeSeoFiles(zhSeo, enSeo) {
    const sitemapEntries = [zhSeo, enSeo].filter(Boolean).map(seo => `    <url>
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
    buildHomepage(zhConfig, zhSeo, 'zh');
    if (pages.language) buildHomepage(enConfig, enSeo, 'en');
    writeSeoFiles(zhSeo, enSeo);
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

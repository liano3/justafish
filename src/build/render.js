const fs = require('fs');
const path = require('path');
const { PAGE_IDS, BUILD_FEATURE_IDS } = require('./config');
const { APPS } = require('../config/apps');
const { UI_TEXT, MAIN_RUNTIME_TEXT_KEYS } = require('./i18n');
const { resolveBuiltAssetUrl } = require('./assets');
const ROOT_DIR = path.join(__dirname, '../..');

const PROFILE_ICON_IDS = {
    blog: 'book-open',
    github: 'github',
    scholar: 'scholar',
    email: 'mail'
};

function isRecord(value) {
    return value !== null && !Array.isArray(value) && typeof value === 'object';
}

function formatMessage(value, replacements = {}) {
    return Object.keys(replacements).reduce((result, key) => {
        return result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(replacements[key]));
    }, String(value || ''));
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


function fillTemplate(template, values) {
    return template.replace(/{{([A-Z0-9_]+)}}/g, (match, key) => {
        if (!Object.prototype.hasOwnProperty.call(values, key)) throw new Error('Missing template value: ' + key);
        return String(values[key]);
    });
}

function layoutValues(config, locale, iconSpriteUrl, activePage) {
    const text = UI_TEXT[locale];
    const root = locale === 'en' ? '/en/' : '/';
    const pageUrl = id => id === 'home' ? root : root + '#' + id;
    const defaultPage = PAGE_IDS.find(id => config.pages[id]);
    const icons = { home: 'home', resume: 'file-text', bookmarks: 'bookmark', apps: 'grid' };
    const nav = mobile => PAGE_IDS.filter(id => config.pages[id]).map(id => {
        const active = id === activePage;
        const cls = (mobile ? 'mobile-nav-link' : 'nav-link') + (active ? ' active' : '');
        const icon = mobile ? renderIcon(icons[id]).replace('{{ICON_SPRITE_URL}}', iconSpriteUrl) : '';
        return `<a class="${cls}" href="${pageUrl(id)}" data-page="${id}"${active ? ' aria-current="page"' : ''}>${icon}${escapeHtml(text['NAV_' + id.toUpperCase()])}</a>`;
    }).join('\n');
    return {
        DEFAULT_PAGE_ID: defaultPage, DEFAULT_PAGE_URL: pageUrl(defaultPage),
        DESKTOP_NAV: nav(false), MOBILE_NAV: nav(true)
    };
}

function renderTemplate(name, values, text, options) {
    const translations = Object.fromEntries(Object.entries(text).map(([key, value]) => ['T_' + key, escapeHtml(value)]));
    const all = { ...translations, ...values };
    const read = file => fs.readFileSync(path.join(ROOT_DIR, 'src/templates', file), 'utf8');
    const fragmentKeys = ['HERO_LINKS', 'ANNOUNCEMENTS_SECTION', 'RESUME_CONTACTS', 'EDUCATION_SECTION', 'AWARDS_SECTION', 'WORKS_SECTION', 'APPS_DIRECTORY', 'BOOKMARKS'];
    fragmentKeys.forEach(key => {
        if (all[key]) all[key] = all[key].replace(/{{ICON_SPRITE_URL}}/g, () => values.ICON_SPRITE_URL);
    });
    all.HEADER = fillTemplate(read('partials/header.html'), all);
    all.MOBILE_NAVIGATION = fillTemplate(read('partials/mobile-nav.html'), all);
    all.THEME_BOOTSTRAP = read('partials/theme.html');
    if (all.APP_CONTENT) all.APP_CONTENT = fillTemplate(all.APP_CONTENT, all);
    if (all.APP_OVERLAY) all.APP_OVERLAY = fillTemplate(all.APP_OVERLAY, all);
    return applyBuildVisibility(fillTemplate(read(name), all), options);
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

    const values = layoutValues(config, locale, iconSpriteUrl, defaultPageId);
    values.RUNTIME_CONFIG = runtimeConfig;
    values.STYLESHEET_URL = stylesheetUrl;
    values.MAIN_SCRIPT_URL = mainScriptUrl;

    const avatarUrl = resolvePageAssetUrl(config.profile.avatar, locale);
    const avatarAlt = formatMessage(text.avatarAlt, { name: config.profile.name });
    const rootSiteUrl = seo.rootSiteUrl;
    const englishSiteUrl = new URL('en/', rootSiteUrl).href;

    values.HTML_LANG = locale === 'en' ? 'en' : 'zh-CN';
    values.OG_LOCALE = locale === 'en' ? 'en_US' : 'zh_CN';
    values.ZH_URL = escapeHtml(rootSiteUrl);
    values.EN_URL = escapeHtml(englishSiteUrl);
    values.LANG_SWITCH_URL = locale === 'en' ? '/' : '/en/';
    values.LANG_SWITCH_HREFLANG = locale === 'en' ? 'zh-CN' : 'en';
    values.LANG_SWITCH_LABEL = locale === 'en' ? '中' : 'EN';
    values.PROFILE_AVATAR_ALT = escapeHtml(avatarAlt);
    values.PDF_URL = locale === 'en' ? '/resume-en.pdf' : '/resume.pdf';
    values.PDF_FILENAME = escapeHtml(createPdfFilename(config.profile, locale));
    values.SITE_NAME = escapeHtml(config.profile.siteName);
    values.SITE_ICON = escapeHtml(config.profile.siteIcon);
    values.SITE_FAVICON = createTextFavicon(config.profile.siteIcon);
    values.PROFILE_NAME = escapeHtml(config.profile.name);
    values.PROFILE_NICKNAME = escapeHtml(config.profile.nickname || config.profile.name);
    values.PROFILE_TITLE = escapeHtml(config.profile.title);
    values.PROFILE_AVATAR = safeUrl(avatarUrl);
    values.PROFILE_SLOGAN = escapeHtml(config.profile.slogan);
    values.PROFILE_INTRODUCTION = escapeHtml(config.profile.introduction);
    values.SEO_DESCRIPTION = escapeHtml(seo.description);
    values.SEO_KEYWORDS = escapeHtml(seo.keywords);
    values.SITE_URL = escapeHtml(seo.siteUrl);
    values.SHARE_IMAGE = escapeHtml(seo.shareImage);
    values.STRUCTURED_DATA = seo.structuredData;
    values.FOOTER = renderFooter(config.profile, seo, text);
    values.VISITOR_COUNTER_SCRIPT = renderVisitorCounterScript(config.profile);
    values.HERO_LINKS = renderProfileLinks(config.profile.links);
    values.ANNOUNCEMENTS_SECTION = renderAnnouncementsSection(config.announcements, text);
    values.RESUME_CONTACTS = renderResumeContacts(config.profile, text);
    values.RESEARCH_INTERESTS = renderResearchInterests(config.profile, text);
    values.EDUCATION_SECTION = renderEducationSection(config.education, text);
    values.AWARDS_SECTION = renderAwardsSection(config.awards, text);
    values.WORKS_SECTION = renderWorksSection(config.works, text);
    values.APPS_DIRECTORY = renderAppDirectory(text);

    const bookmarkTotal = config.bookmarks.reduce((total, folder) => total + folder.links.length, 0);
    values.BOOKMARK_STATUS = escapeHtml(formatMessage(text.bookmarksTotal, { count: bookmarkTotal }));

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
    values.BOOKMARK_TAG_FILTER = bookmarkTagFilter;

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
    values.BOOKMARKS = bookmarks;
    values.ICON_SPRITE_URL = escapeHtml(iconSpriteUrl);
    const html = renderTemplate('modern.template.html', values, text, config.pages);

    const outputPath = locale === 'en'
        ? path.join(ROOT_DIR, 'dist/en/index.html')
        : path.join(ROOT_DIR, 'dist/index.html');
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

    return APPS.map(app => {
        const appUrl = new URL(`${locale === 'en' ? 'en/' : ''}apps/${app.id}/`, seo.rootSiteUrl).href;
        const zhAppUrl = new URL(`apps/${app.id}/`, seo.rootSiteUrl).href;
        const enAppUrl = new URL(`en/apps/${app.id}/`, seo.rootSiteUrl).href;
        const runtimeText = Object.fromEntries(['themeToLight', 'themeToDark', ...app.runtime].map(key => [key, text[key]]));
        const runtimeConfig = `window.PAGE_I18N = ${JSON.stringify(runtimeText)};\nwindow.APP_ID = ${JSON.stringify(app.id)};\n`;
        const content = fs.readFileSync(path.join(ROOT_DIR, `src/templates/apps/${app.id}.html`), 'utf8').trim();

        const values = {
            ...layoutValues(config, locale, iconSpriteUrl, 'apps'),
            APP_CONTENT: content,
            APP_OVERLAY: app.id === 'pomodoro' ? renderPomodoroOverlay() : '',
            TOOL_LAYOUT_CLASS: ['countdown', 'random-picker'].includes(app.id) ? ' tool-card-flat' : '',
            HTML_LANG: locale === 'en' ? 'en' : 'zh-CN', APP_TITLE: escapeHtml(text[app.title]), APP_DESCRIPTION: escapeHtml(text[app.description]),
            SITE_NAME: escapeHtml(config.profile.siteName), SITE_ICON: escapeHtml(config.profile.siteIcon), SITE_FAVICON: createTextFavicon(config.profile.siteIcon), PROFILE_NAME: escapeHtml(config.profile.name),
            APP_URL: appUrl, ZH_APP_URL: zhAppUrl, EN_APP_URL: enAppUrl, APPS_URL: `${localeRoot}#apps`,
            LANG_SWITCH_URL: locale === 'en' ? `/apps/${app.id}/` : `/en/apps/${app.id}/`, LANG_SWITCH_HREFLANG: locale === 'en' ? 'zh-CN' : 'en', LANG_SWITCH_LABEL: locale === 'en' ? '中' : 'EN',
            SITE_STYLESHEET_URL: `${assetPrefix}${assetManifest.stylesheet}`, APP_STYLESHEET_URL: `${assetPrefix}${assetManifest.apps[app.id].stylesheet}`,
            ICON_SPRITE_URL: iconSpriteUrl, APP_SCRIPT_URL: `${assetPrefix}${assetManifest.apps[app.id].script}`, RUNTIME_CONFIG: runtimeConfig,
            FOOTER: renderFooter(config.profile, seo, text), VISITOR_COUNTER_SCRIPT: renderVisitorCounterScript(config.profile)
        };
        const html = renderTemplate('app.template.html', values, text, config.pages);

        const outputPath = path.join(ROOT_DIR, 'dist', locale === 'en' ? 'en' : '', 'apps', app.id, 'index.html');
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
    fs.writeFileSync(path.join(ROOT_DIR, 'dist/sitemap.xml'), sitemap);
    fs.writeFileSync(path.join(ROOT_DIR, 'dist/robots.txt'), robots);
}

module.exports = { createSeoData, buildHomepage, buildAppPages, writeSeoFiles };

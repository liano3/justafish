const fs = require('fs');
const path = require('path');
const { DEFAULT_CONFIG, ICONS, EXTERNAL_ICON } = require('./src/config/default');

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
        process.env[key] = value;
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

function createSeoData(profile) {
    const siteUrl = normalizeSiteUrl(profile.domain);
    const nickname = String(profile.nickname || profile.name || '').trim();
    const identity = nickname && nickname !== profile.name
        ? `${nickname}（${profile.name}）`
        : String(profile.name || nickname);
    const description = String(profile.seoDescription || '').trim()
        || `${identity}的个人主页，${profile.title}。${profile.introduction}`;
    const interests = getResearchInterests(profile);
    const keywords = [...new Set([
        profile.name,
        nickname,
        profile.siteName,
        profile.title,
        ...interests,
        '个人主页',
        '学术主页'
    ].map(item => String(item || '').trim()).filter(Boolean))].join(',');
    const shareImage = resolveHttpUrl(profile.shareImage || profile.avatar, siteUrl);
    const sameAs = (Array.isArray(profile.links) ? profile.links : [])
        .map(link => resolveHttpUrl(link.url, siteUrl))
        .filter(Boolean);
    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: String(profile.name || ''),
        alternateName: nickname,
        jobTitle: String(profile.title || ''),
        description,
        url: siteUrl,
        image: shareImage,
        knowsAbout: interests,
        sameAs
    };
    return {
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

function renderResumeContacts(profile) {
    const contacts = [];
    const age = calculateAge(profile.birthday);
    if (age !== null) {
        contacts.push(`<span class="resume-contact">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                    <span id="resumeAge" data-birthday="${escapeHtml(profile.birthday)}">${age} 岁</span>
                                </span>`);
    }
    const phone = String(profile.phone || '').trim();
    if (phone) {
        contacts.push(`<span class="resume-contact" aria-label="电话 ${escapeHtml(phone)}">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.69 2.8a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.33 1.84.56 2.8.69A2 2 0 0 1 22 16.92z"></path></svg>
                                    <span>${escapeHtml(phone)}</span>
                                </span>`);
    }
    if (profile.email) {
        contacts.push(`<a class="resume-contact" href="${safeUrl(`mailto:${profile.email}`)}">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"></rect><polyline points="3 7 12 13 21 7"></polyline></svg>
                                    <span>${escapeHtml(profile.email)}</span>
                                </a>`);
    }
    return contacts.join('\n                                ');
}

function renderResearchInterests(profile) {
    const interests = getResearchInterests(profile);
    if (!interests.length) return '';
    return `<div class="research-interests" aria-label="研究兴趣">
                                ${interests.map(interest => `<span>${escapeHtml(interest)}</span>`).join('')}
                            </div>`;
}

function renderFooter(profile, seo) {
    const footer = isRecord(profile.footer) ? profile.footer : {};
    if (footer.enabled === false) return '';

    const segments = [];
    const identityParts = [];
    const startYear = String(footer.startYear || '').trim();
    if (startYear) identityParts.push(`&copy; ${escapeHtml(startYear)}`);
    if (footer.showDomain !== false && profile.domain) {
        identityParts.push(`<a href="${escapeHtml(seo.siteUrl)}">${escapeHtml(profile.domain)}</a>`);
    }
    if (identityParts.length) segments.push({ html: identityParts.join('&nbsp;') });
    if (footer.showLastUpdated !== false) {
        segments.push({ html: `Last updated ${escapeHtml(seo.lastUpdated)}` });
    }
    if (footer.showVisitorCount !== false) {
        segments.push({
            html: 'Visitors <strong id="busuanzi_value_site_uv">0</strong>',
            id: 'busuanzi_container_site_uv',
            className: 'visitor-counter',
            hidden: true
        });
    }
    const text = String(footer.text || '').trim();
    if (text) segments.push({ html: escapeHtml(text) });
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

function renderAnnouncementsSection(announcements) {
    const activeAnnouncements = announcements.filter(item => item && item.enabled !== false && item.content);
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
        return `<button type="button" class="announcement-dot${index === 0 ? ' is-active' : ''}" data-announcement-index="${index}" aria-label="查看第 ${index + 1} 条公告" aria-pressed="${index === 0 ? 'true' : 'false'}"></button>`;
    }).join('');
    return `<section class="announcement-banner" id="announcementBanner" aria-label="公告栏">
                    <div class="announcement-inner">
                        <div class="announcement-track" aria-live="off">
                            ${items}
                        </div>
                        <div class="announcement-dots" aria-label="公告切换">
                            ${indicators}
                        </div>
                    </div>
                </section>`;
}

function renderEducationSection(education) {
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
                    <h2 class="resume-section-title" id="educationHeading">教育经历</h2>
                    <div class="education-list">
                        ${items}
                    </div>
                </section>`;
}

function renderAwardsSection(awards) {
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
                    <h2 class="resume-section-title" id="awardsHeading">获奖经历</h2>
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

function renderWorksSection(works) {
    if (!works.length) return '';
    const cards = works.map(item => {
        const tag = item.tag === 'paper' ? 'paper' : 'project';
        const tagLabel = tag === 'paper' ? '论文' : '项目';
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
                    <h2 class="resume-section-title" id="worksHeading">项目与论文</h2>
                    <div class="works-grid">
                        ${cards}
                    </div>
                </section>`;
}

function readFiles(filePaths) {
    return filePaths.map(f => fs.readFileSync(path.join(__dirname, f), 'utf8')).join('\n');
}

function buildHomepage(config, seo) {
    const css = readFiles([
        'src/css/common.css',
        'src/css/components/clock.css',
        'src/css/components/pomodoro.css',
        'src/css/components/schulte.css',
        'src/css/components/game2048.css',
        'src/css/modern.css'
    ]);

    const js = readFiles([
        'src/js/common.js',
        'src/js/modern/main.js'
    ]);

    const appsJs = readFiles([
        'src/js/common.js',
        'src/js/clock.js',
        'src/js/pomodoro.js',
        'src/js/schulte.js',
        'src/js/vendor/2048-core.js',
        'src/js/game2048.js'
    ]);

    const wrappedJs = "(function(){\n'use strict';\n" + js + "\n})();";
    const wrappedAppsJs = "(function(){\n'use strict';\n" + appsJs
        + "\nwindow.JustAFishAppModules = { initClock: initClock, initPomodoro: initPomodoro, initSchulte: initSchulte, initGame2048: initGame2048 };\n})();";

    const assetsDir = path.join(__dirname, 'dist/assets');
    if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });
    fs.writeFileSync(path.join(assetsDir, 'apps.js'), wrappedAppsJs);

    let html = fs.readFileSync(path.join(__dirname, 'src/templates/modern.template.html'), 'utf8');
    html = html.replace('/* {{INLINE_CSS}} */', css);
    html = html.replace('/* {{INLINE_JS}} */', wrappedJs);

    html = html.replace(/{{SITE_NAME}}/g, escapeHtml(config.profile.siteName));
    html = html.replace(/{{SITE_ICON}}/g, escapeHtml(config.profile.siteIcon));
    html = html.replace(/{{SITE_FAVICON}}/g, createTextFavicon(config.profile.siteIcon));
    html = html.replace(/{{PROFILE_NAME}}/g, escapeHtml(config.profile.name));
    html = html.replace(/{{PROFILE_NICKNAME}}/g, escapeHtml(config.profile.nickname || config.profile.name));
    html = html.replace(/{{PROFILE_TITLE}}/g, escapeHtml(config.profile.title));
    html = html.replace(/{{PROFILE_AVATAR}}/g, safeUrl(config.profile.avatar));
    html = html.replace(/{{PROFILE_SLOGAN}}/g, escapeHtml(config.profile.slogan));
    html = html.replace(/{{PROFILE_INTRODUCTION}}/g, escapeHtml(config.profile.introduction));
    html = html.replace(/{{SEO_DESCRIPTION}}/g, escapeHtml(seo.description));
    html = html.replace(/{{SEO_KEYWORDS}}/g, escapeHtml(seo.keywords));
    html = html.replace(/{{SITE_URL}}/g, escapeHtml(seo.siteUrl));
    html = html.replace(/{{SHARE_IMAGE}}/g, escapeHtml(seo.shareImage));
    html = html.replace('{{STRUCTURED_DATA}}', seo.structuredData);
    html = html.replace('{{FOOTER}}', renderFooter(config.profile, seo));
    html = html.replace('{{VISITOR_COUNTER_SCRIPT}}', renderVisitorCounterScript(config.profile));
    html = html.replace('{{HERO_LINKS}}', renderProfileLinks(config.profile.links));
    html = html.replace('{{ANNOUNCEMENTS_SECTION}}', renderAnnouncementsSection(config.announcements));
    html = html.replace('{{RESUME_CONTACTS}}', renderResumeContacts(config.profile));
    html = html.replace('{{RESEARCH_INTERESTS}}', renderResearchInterests(config.profile));
    html = html.replace('{{EDUCATION_SECTION}}', renderEducationSection(config.education));
    html = html.replace('{{AWARDS_SECTION}}', renderAwardsSection(config.awards));
    html = html.replace('{{WORKS_SECTION}}', renderWorksSection(config.works));

    const bookmarkTotal = config.bookmarks.reduce((total, folder) => total + folder.links.length, 0);
    html = html.replace('{{BOOKMARK_TOTAL}}', String(bookmarkTotal));
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

    fs.writeFileSync(path.join(__dirname, 'dist/index.html'), html);
    console.log('✅ Homepage build completed!');
}

function writeSeoFiles(seo) {
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>${escapeHtml(seo.siteUrl)}</loc>
        <lastmod>${seo.lastUpdated}</lastmod>
    </url>
</urlset>
`;
    const robots = `User-agent: *
Allow: /

Sitemap: ${seo.siteUrl}sitemap.xml
`;
    fs.writeFileSync(path.join(__dirname, 'dist/sitemap.xml'), sitemap);
    fs.writeFileSync(path.join(__dirname, 'dist/robots.txt'), robots);
}

function copyStaticAssets() {
    const assets = ['avatar.png', 'BingSiteAuth.xml'];
    assets.forEach(file => {
        const src = path.join(__dirname, file);
        const dest = path.join(__dirname, 'dist', file);
        if (fs.existsSync(src)) {
            fs.copyFileSync(src, dest);
        }
    });
}

function build() {
    // Ensure dist directory exists
    const distDir = path.join(__dirname, 'dist');
    if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });
    const legacyModernPage = path.join(distDir, 'modern.html');
    if (fs.existsSync(legacyModernPage)) fs.unlinkSync(legacyModernPage);

    const parsedProfile = parseJsonEnv(process.env.PROFILE_JSON, {});
    const profileEnv = isRecord(parsedProfile)
        ? parsedProfile
        : {};
    let profileLinks = DEFAULT_CONFIG.profile.links;
    if (profileEnv.links !== undefined) {
        if (isRecordArray(profileEnv.links)) profileLinks = profileEnv.links;
        else console.warn('PROFILE_JSON.links must be a JSON array with valid object items; using default links.');
    }
    let profileFooter = DEFAULT_CONFIG.profile.footer;
    if (profileEnv.footer !== undefined) {
        if (isRecord(profileEnv.footer)) profileFooter = { ...DEFAULT_CONFIG.profile.footer, ...profileEnv.footer };
        else console.warn('PROFILE_JSON.footer must be a JSON object; using the default footer.');
    }
    const itemWithOptionalLinks = item => isRecord(item)
        && (item.links === undefined || isRecordArray(item.links));
    const bookmarkFolder = folder => isRecord(folder) && isRecordArray(folder.links);
    const config = {
        profile: {
            ...DEFAULT_CONFIG.profile,
            ...profileEnv,
            links: profileLinks,
            footer: profileFooter
        },
        announcements: parseJsonArrayEnv(process.env.ANNOUNCEMENTS_JSON, DEFAULT_CONFIG.announcements, 'ANNOUNCEMENTS_JSON'),
        education: parseJsonArrayEnv(process.env.EDUCATION_JSON, DEFAULT_CONFIG.education, 'EDUCATION_JSON'),
        awards: parseJsonArrayEnv(process.env.AWARDS_JSON, DEFAULT_CONFIG.awards, 'AWARDS_JSON'),
        works: parseJsonArrayEnv(process.env.WORKS_JSON, DEFAULT_CONFIG.works, 'WORKS_JSON', itemWithOptionalLinks),
        bookmarks: parseJsonArrayEnv(process.env.BOOKMARKS, DEFAULT_CONFIG.bookmarks, 'BOOKMARKS', bookmarkFolder)
    };

    const seo = createSeoData(config.profile);
    buildHomepage(config, seo);
    writeSeoFiles(seo);
    copyStaticAssets();

    console.log('\n📊 Build Summary:');
    console.log(`   Profile: ${config.profile.name}`);
    console.log(`   Announcements: ${config.announcements.length}`);
    console.log(`   Education: ${config.education.length}`);
    console.log(`   Awards: ${config.awards.length}`);
    console.log(`   Works: ${config.works.length}`);
    console.log(`   Bookmarks: ${config.bookmarks.length} folders`);
}

build();

const fs = require('fs');
const path = require('path');
const { DEFAULT_CONFIG, ICONS, EXTERNAL_ICON } = require('./src/config/default');

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
    if (profile.email) {
        contacts.push(`<a class="resume-contact" href="${safeUrl(`mailto:${profile.email}`)}">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"></rect><polyline points="3 7 12 13 21 7"></polyline></svg>
                                    <span>${escapeHtml(profile.email)}</span>
                                </a>`);
    }
    if (profile.phone) {
        const phoneHref = `tel:${String(profile.phone).replace(/[^\d+]/g, '')}`;
        contacts.push(`<a class="resume-contact" href="${safeUrl(phoneHref)}">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.62 2.63a2 2 0 0 1-.45 2.11L8 9.73a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.85.29 1.73.5 2.63.62A2 2 0 0 1 22 16.92z"></path></svg>
                                    <span>${escapeHtml(profile.phone)}</span>
                                </a>`);
    }
    return contacts.join('\n                                ');
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

function buildHomepage(config) {
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
        'src/js/clock.js',
        'src/js/pomodoro.js',
        'src/js/schulte.js',
        'src/js/vendor/2048-core.js',
        'src/js/game2048.js',
        'src/js/modern/main.js'
    ]);

    const wrappedJs = "(function(){\n'use strict';\n" + js + "\n})();";

    let html = fs.readFileSync(path.join(__dirname, 'src/templates/modern.template.html'), 'utf8');
    html = html.replace('/* {{INLINE_CSS}} */', css);
    html = html.replace('/* {{INLINE_JS}} */', wrappedJs);

    const domain = escapeHtml(config.profile.domain);
    const domainUrl = safeUrl(/^https?:\/\//i.test(config.profile.domain)
        ? config.profile.domain
        : `https://${config.profile.domain}`);
    html = html.replace(/{{SITE_NAME}}/g, escapeHtml(config.profile.siteName));
    html = html.replace(/{{SITE_ICON}}/g, escapeHtml(config.profile.siteIcon));
    html = html.replace(/{{SITE_FAVICON}}/g, createTextFavicon(config.profile.siteIcon));
    html = html.replace(/{{PROFILE_NAME}}/g, escapeHtml(config.profile.name));
    html = html.replace(/{{PROFILE_TITLE}}/g, escapeHtml(config.profile.title));
    html = html.replace(/{{PROFILE_AVATAR}}/g, safeUrl(config.profile.avatar));
    html = html.replace(/{{PROFILE_SLOGAN}}/g, escapeHtml(config.profile.slogan));
    html = html.replace(/{{PROFILE_INTRODUCTION}}/g, escapeHtml(config.profile.introduction));
    html = html.replace(/{{PROFILE_DOMAIN_URL}}/g, domainUrl);
    html = html.replace(/{{PROFILE_DOMAIN}}/g, domain);
    html = html.replace('{{HERO_LINKS}}', renderProfileLinks(config.profile.links));
    html = html.replace('{{ANNOUNCEMENTS_SECTION}}', renderAnnouncementsSection(config.announcements));
    html = html.replace('{{RESUME_CONTACTS}}', renderResumeContacts(config.profile));
    html = html.replace('{{EDUCATION_SECTION}}', renderEducationSection(config.education));
    html = html.replace('{{AWARDS_SECTION}}', renderAwardsSection(config.awards));
    html = html.replace('{{WORKS_SECTION}}', renderWorksSection(config.works));

    const bookmarks = config.bookmarks.map((folder, idx) => {
        const links = folder.links.map(l => {
            return `<a href="${safeUrl(l.url)}" target="_blank" rel="noopener noreferrer" class="bookmark-link">${escapeHtml(l.label)}${EXTERNAL_ICON}</a>`;
        }).join('\n                        ');
        const groupId = `bookmarkGroup${idx + 1}`;
        return `<div class="bookmark-category">
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
    const itemWithOptionalLinks = item => isRecord(item)
        && (item.links === undefined || isRecordArray(item.links));
    const bookmarkFolder = folder => isRecord(folder) && isRecordArray(folder.links);
    const config = {
        profile: {
            ...DEFAULT_CONFIG.profile,
            ...profileEnv,
            links: profileLinks
        },
        announcements: parseJsonArrayEnv(process.env.ANNOUNCEMENTS_JSON, DEFAULT_CONFIG.announcements, 'ANNOUNCEMENTS_JSON'),
        education: parseJsonArrayEnv(process.env.EDUCATION_JSON, DEFAULT_CONFIG.education, 'EDUCATION_JSON'),
        awards: parseJsonArrayEnv(process.env.AWARDS_JSON, DEFAULT_CONFIG.awards, 'AWARDS_JSON'),
        works: parseJsonArrayEnv(process.env.WORKS_JSON, DEFAULT_CONFIG.works, 'WORKS_JSON', itemWithOptionalLinks),
        bookmarks: parseJsonArrayEnv(process.env.BOOKMARKS, DEFAULT_CONFIG.bookmarks, 'BOOKMARKS', bookmarkFolder)
    };

    buildHomepage(config);
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

const fs = require('fs');
const path = require('path');
const { DEFAULT_CONFIG, ICONS, EXTERNAL_ICON } = require('./src/config/default');

function parseEnv(env, defaultValue) {
    return env || defaultValue;
}

function parseJsonEnv(env, defaultValue) {
    if (!env) return defaultValue;
    try {
        return JSON.parse(env);
    } catch (e) {
        console.warn(`Failed to parse env, using default: ${e.message}`);
        return defaultValue;
    }
}

function readFiles(filePaths) {
    return filePaths.map(f => fs.readFileSync(path.join(__dirname, f), 'utf8')).join('\n');
}

function buildOceanMode(config) {
    const css = readFiles([
        'src/css/common.css',
        'src/css/components/clock.css',
        'src/css/components/pomodoro.css',
        'src/css/components/schulte.css',
        'src/css/ocean.css'
    ]);

    const js = readFiles([
        'src/js/common.js',
        'src/js/clock.js',
        'src/js/pomodoro.js',
        'src/js/schulte.js',
        'src/js/ocean/main.js'
    ]);

    const wrappedJs = "(function(){\n'use strict';\n" + js + "\n})();";

    const oceanConfig = {
        profile: config.profile,
        links: config.links.map(link => ({
            url: link.url,
            label: link.label,
            icon: ICONS[link.icon] || link.icon
        })),
        announcements: config.announcements,
        bookmarks: config.bookmarks
    };

    // Replace {{CONFIG}} in JS before wrapping
    const finalJs = wrappedJs.replace('{{CONFIG}}', JSON.stringify(oceanConfig));

    let html = fs.readFileSync(path.join(__dirname, 'src/templates/index.template.html'), 'utf8');
    html = html.replace('/* {{INLINE_CSS}} */', css);
    html = html.replace('/* {{INLINE_JS}} */', finalJs);

    fs.writeFileSync(path.join(__dirname, 'dist/index.html'), html);
    console.log('✅ Ocean mode build completed!');
}

function buildModernMode(config) {
    const css = readFiles([
        'src/css/common.css',
        'src/css/components/clock.css',
        'src/css/components/pomodoro.css',
        'src/css/components/schulte.css',
        'src/css/modern.css'
    ]);

    const js = readFiles([
        'src/js/common.js',
        'src/js/clock.js',
        'src/js/pomodoro.js',
        'src/js/schulte.js',
        'src/js/modern/main.js'
    ]);

    const wrappedJs = "(function(){\n'use strict';\n" + js + "\n})();";

    let html = fs.readFileSync(path.join(__dirname, 'src/templates/modern.template.html'), 'utf8');
    html = html.replace('/* {{INLINE_CSS}} */', css);
    html = html.replace('/* {{INLINE_JS}} */', wrappedJs);

    // Config replacements
    html = html.replace(/{{PROFILE_NAME}}/g, config.profile.name);
    html = html.replace(/{{PROFILE_TITLE}}/g, config.profile.title);
    html = html.replace(/{{PROFILE_AVATAR}}/g, config.profile.avatar);
    html = html.replace(/{{PROFILE_SLOGAN}}/g, config.profile.slogan);
    html = html.replace(/{{PROFILE_DOMAIN}}/g, config.profile.domain);

    const heroLinks = config.links.map((link, index) => {
        const isPrimary = index === 0;
        const className = isPrimary ? 'hero-link hero-link-primary' : 'hero-link hero-link-secondary';
        const icon = ICONS[link.icon] || '';
        return `<a href="${link.url}" target="${link.url.startsWith('mailto:') ? '_self' : '_blank'}" class="${className}">
            ${icon}
            ${link.label}
        </a>`;
    }).join('\n                        ');
    html = html.replace('{{HERO_LINKS}}', heroLinks);

    const infoLinks = config.links.map(link => {
        return `<div class="info-item">
            <span class="info-label">${link.icon === 'blog' ? '博客' : link.icon === 'github' ? 'GitHub' : '邮箱'}</span>
            <span class="info-value"><a href="${link.url}" target="${link.url.startsWith('mailto:') ? '_self' : '_blank'}">${link.label}</a></span>
        </div>`;
    }).join('\n                            ');
    html = html.replace('{{INFO_LINKS}}', infoLinks);

    const announcements = config.announcements.map(item => {
        return `<div class="announcement-item">
            <div class="announcement-date">${item.date}</div>
            <div class="announcement-content">${item.content}<span class="announcement-tag">${item.tag}</span></div>
        </div>`;
    }).join('\n                        ');
    html = html.replace('{{ANNOUNCEMENTS}}', announcements);

    const bookmarks = config.bookmarks.map((folder, idx) => {
        const links = folder.links.map(l => {
            return `<a href="${l.url}" target="_blank" class="bookmark-link">${l.label}${EXTERNAL_ICON}</a>`;
        }).join('\n                        ');
        return `<div class="bookmark-category">
                    <div class="category-header" onclick="toggleCategory(this)">
                        <div class="category-title">
                            <span>${folder.name}</span>
                            <span class="category-count">${folder.links.length}</span>
                        </div>
                        <svg class="category-toggle ${idx === 0 ? 'expanded' : ''}" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </div>
                    <div class="bookmark-links ${idx === 0 ? 'show' : ''}">
                        ${links}
                    </div>
                </div>`;
    }).join('\n                        ');
    html = html.replace('{{BOOKMARKS}}', bookmarks);

    fs.writeFileSync(path.join(__dirname, 'dist/modern.html'), html);
    console.log('✅ Modern mode build completed!');
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

    const config = {
        profile: {
            name: parseEnv(process.env.PROFILE_NAME, DEFAULT_CONFIG.profile.name),
            title: parseEnv(process.env.PROFILE_TITLE, DEFAULT_CONFIG.profile.title),
            avatar: parseEnv(process.env.PROFILE_AVATAR, DEFAULT_CONFIG.profile.avatar),
            slogan: parseEnv(process.env.PROFILE_SLOGAN, DEFAULT_CONFIG.profile.slogan),
            domain: parseEnv(process.env.PROFILE_DOMAIN, DEFAULT_CONFIG.profile.domain)
        },
        links: parseJsonEnv(process.env.PROFILE_LINKS, DEFAULT_CONFIG.links),
        announcements: parseJsonEnv(process.env.ANNOUNCEMENTS, DEFAULT_CONFIG.announcements),
        bookmarks: parseJsonEnv(process.env.BOOKMARKS, DEFAULT_CONFIG.bookmarks)
    };

    buildOceanMode(config);
    buildModernMode(config);
    copyStaticAssets();

    console.log('\n📊 Build Summary:');
    console.log(`   Profile: ${config.profile.name}`);
    console.log(`   Links: ${config.links.length}`);
    console.log(`   Announcements: ${config.announcements.length}`);
    console.log(`   Bookmarks: ${config.bookmarks.length} folders`);
}

build();

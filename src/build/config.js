const fs = require('fs');
const path = require('path');
const { DEFAULT_CONFIG } = require('../config/default');
const PAGE_IDS = ['home', 'resume', 'bookmarks', 'apps'];
const BUILD_FEATURE_IDS = ['language'];
const CONTENT_FIELDS = {
    announcements: 'ANNOUNCEMENTS', education: 'EDUCATION', studentWork: 'STUDENT_WORK',
    awards: 'AWARDS', papers: 'PAPERS', projects: 'PROJECTS', bookmarks: 'BOOKMARKS'
};

function readConfig(name, defaults) {
    return process.env[name] ? JSON.parse(process.env[name]) : defaults;
}

function loadConfigs() {
    const envFile = path.join(__dirname, '../../.env.local');
    if (fs.existsSync(envFile)) process.loadEnvFile(envFile);
    const pages = { ...Object.fromEntries([...PAGE_IDS, ...BUILD_FEATURE_IDS].map(id => [id, true])), ...readConfig('PAGES_JSON', {}) };
    if (!PAGE_IDS.some(id => pages[id])) pages.home = true;
    function localeConfig(defaults, locale) {
        const profile = readConfig(locale === 'en' ? 'PROFILE_EN_JSON' : 'PROFILE_JSON', {});
        const content = Object.entries(CONTENT_FIELDS).map(([key, name]) => {
            const envName = name + (locale === 'en' ? '_EN' : '') + (key === 'bookmarks' ? '' : '_JSON');
            return [key, readConfig(envName, defaults[key])];
        });
        return {
            pages,
            profile: { ...defaults.profile, ...profile, footer: { ...defaults.profile.footer, ...profile.footer } },
            ...Object.fromEntries(content)
        };
    }
    const zhConfig = localeConfig(DEFAULT_CONFIG, 'zh');
    return { pages, zhConfig, enConfig: localeConfig(zhConfig, 'en') };
}

module.exports = { PAGE_IDS, BUILD_FEATURE_IDS, loadConfigs };

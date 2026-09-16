const fs = require('fs');
const path = require('path');
const { DEFAULT_CONFIG } = require('../config/default');
const ROOT_DIR = path.join(__dirname, '../..');

const PAGE_IDS = ['home', 'resume', 'bookmarks', 'apps'];
const BUILD_FEATURE_IDS = ['language'];
const BUILD_OPTION_IDS = [...PAGE_IDS, ...BUILD_FEATURE_IDS];

function loadLocalEnvFile() {
    const envPath = path.join(ROOT_DIR, '.env.local');
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

function loadConfigs() {
    loadLocalEnvFile();
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
    return { pages, zhConfig, enConfig };
}

module.exports = { PAGE_IDS, BUILD_FEATURE_IDS, loadConfigs };

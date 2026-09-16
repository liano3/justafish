const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { PAGE_IDS, BUILD_FEATURE_IDS } = require('./config');
const { APPS } = require('../config/apps');
const ROOT_DIR = path.join(__dirname, '../..');

function readFiles(filePaths) {
    return filePaths.map(f => fs.readFileSync(path.join(ROOT_DIR, f), 'utf8')).join('\n');
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
    const assetsDir = path.join(ROOT_DIR, 'dist/assets');
    fs.mkdirSync(assetsDir, { recursive: true });

    const cssFiles = ['src/css/common.css', 'src/css/modern.css'];
    const css = applySourceFeatureVisibility(readFiles(cssFiles), options);
    const siteJs = applySourceFeatureVisibility(readFiles([
        'src/js/common.js',
        'src/js/theme.js',
        'src/js/modern/main.js'
    ]), options);
    const wrappedSiteJs = "(function(){\n'use strict';\n" + siteJs + "\n})();";
    const iconSprite = fs.readFileSync(path.join(ROOT_DIR, 'src/assets/icons.svg'), 'utf8');

    const manifest = {
        stylesheet: writeHashedAsset(assetsDir, 'site', 'css', css),
        mainScript: writeHashedAsset(assetsDir, 'site', 'js', wrappedSiteJs),
        iconSprite: writeHashedAsset(assetsDir, 'icons', 'svg', iconSprite),
        apps: {}
    };

    if (options.apps) {
        APPS.forEach(app => {
            const appCss = readFiles(['src/css/components/apps.css', `src/css/components/${app.css}`]);
            const appJs = readFiles(['src/js/common.js', 'src/js/theme.js', ...app.js.map(file => `src/js/${file}`), 'src/js/app-page.js']);
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

function copyStaticAssets(languageEnabled) {
    const assets = ['avatar.png', 'BingSiteAuth.xml', 'resume.pdf'];
    if (languageEnabled) assets.push('resume-en.pdf');
    assets.forEach(file => {
        const src = path.join(ROOT_DIR, file);
        const dest = path.join(ROOT_DIR, 'dist', file);
        if (fs.existsSync(src)) {
            fs.copyFileSync(src, dest);
        }
    });
}

module.exports = { buildFrontendAssets, resolveBuiltAssetUrl, copyStaticAssets };

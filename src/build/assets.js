const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { PAGE_IDS, BUILD_FEATURE_IDS } = require('./config');
const { APPS } = require('../config/apps');
const ROOT_DIR = path.join(__dirname, '../..');

function readFiles(filePaths) {
    return filePaths.map(f => fs.readFileSync(path.join(ROOT_DIR, f), 'utf8')).join('\n');
}

function applyBuildVisibility(source, options, html = false) {
    for (const [kind, ids] of [['PAGE', PAGE_IDS], ['FEATURE', BUILD_FEATURE_IDS]]) {
        for (const id of ids) {
            const start = html ? `<!-- ${kind}:${id}:START -->` : `/\\* ${kind}:${id}:START \\*/`;
            const end = html ? `<!-- ${kind}:${id}:END -->` : `/\\* ${kind}:${id}:END \\*/`;
            source = source.replace(new RegExp(`${start}([\\s\\S]*?)${end}`, 'g'), (_, content) => options[id] ? content : '');
        }
    }
    return source;
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
    const css = applyBuildVisibility(readFiles(cssFiles), options);
    const siteJs = applyBuildVisibility(readFiles([
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
        const shellOptions = { ...options, ...Object.fromEntries(PAGE_IDS.map(id => [id, false])) };
        manifest.appBaseStylesheet = writeHashedAsset(assetsDir, 'app-base', 'css', applyBuildVisibility(readFiles(cssFiles), shellOptions));
        APPS.forEach(app => {
            const appCss = readFiles(['src/css/components/apps.css', `src/css/components/${app.css}`]);
            const appJs = readFiles(['src/js/common.js', 'src/js/theme.js', ...app.js.map(file => `src/js/${file}`)]);
            manifest.apps[app.id] = {
                stylesheet: writeHashedAsset(assetsDir, `app-${app.id}`, 'css', appCss),
                script: writeHashedAsset(assetsDir, `app-${app.id}`, 'js', `(function(){\n'use strict';\n${appJs}\ninitTheme();\n${app.init}();\n})();`)
            };
        });
    }

    return manifest;
}

function resolveBuiltAssetUrl(assetPath, locale, depth = 0) {
    const levels = depth + (locale === 'en' ? 1 : 0);
    return (levels ? '../'.repeat(levels) : './') + assetPath;
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

module.exports = { applyBuildVisibility, buildFrontendAssets, resolveBuiltAssetUrl, copyStaticAssets };

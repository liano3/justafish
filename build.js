const fs = require('fs');
const path = require('path');
const { PAGE_IDS, BUILD_FEATURE_IDS, loadConfigs } = require('./src/build/config');
const { UI_TEXT } = require('./src/build/i18n');
const { buildFrontendAssets, copyStaticAssets } = require('./src/build/assets');
const { createSeoData, buildHomepage, buildAppPages, writeSeoFiles } = require('./src/build/render');

function build() {
    const { pages, zhConfig, enConfig } = loadConfigs();
    const distDir = path.join(__dirname, 'dist');
    fs.rmSync(distDir, { recursive: true, force: true });
    fs.mkdirSync(distDir, { recursive: true });

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
    console.log(`   Papers: ${localeCount(zhConfig.papers.length, enConfig.papers.length)}`);
    console.log(`   Projects: ${localeCount(zhConfig.projects.length, enConfig.projects.length)}`);
    console.log(`   Bookmarks: ${localeCount(zhConfig.bookmarks.length, enConfig.bookmarks.length)} folders`);
}

build();

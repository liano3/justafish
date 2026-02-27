const fs = require('fs');
const path = require('path');

const DEFAULT_CONFIG = {
    profile: {
        name: 'Ning Li',
        title: 'USTC Master Student',
        avatar: './avatar.png',
        slogan: '鱼没有记忆，但鱼很快乐',
        domain: 'justafish.cn'
    },
    links: [
        { url: 'https://blog.justafish.cn/', label: 'blog.justafish.cn', icon: 'blog' },
        { url: 'https://github.com/liano3', label: 'github.com/liano3', icon: 'github' },
        { url: 'mailto:1291516518@qq.com', label: '1291516518@qq.com', icon: 'email' }
    ],
    announcements: [
        { date: '2026-02-24', content: '个人主页上线啦！欢迎访问~', tag: '新站' },
        { date: '2025-09-01', content: '中科大研究生入学', tag: '生活' }
    ],
    bookmarks: [
        {
        "name": "收藏夹栏",
        "links":[
            { "url": "https://ustcguide.cn/", "label": "USTC GUIDE" },
            { "url": "https://latex.ustc.edu.cn/", "label": "USTC Overleaf" },
            { "url": "https://aistudio.google.com/", "label": "Google AI Studio" }
        ]
    },
    {
        "name": "学习",
        "links":[
            { "url": "https://papers.cool/", "label": "Cool Papers" },
            { "url": "https://zh.d2l.ai/", "label": "动手学深度学习" },
            { "url": "https://oi-wiki.org/", "label": "OI Wiki" },
            { "url": "https://labuladong.online/algo/", "label": "labuladong 的算法笔记" },
            { "url": "https://codetop.cc/", "label": "CodeTop 面试题目总结" }
        ]
    },
    {
        "name": "其他",
        "links":[
            { "url": "https://ustcgroup.pages.dev/", "label": "USTC群聊信息汇总" },
            { "url": "https://lkssite.vip/", "label": "LKs 网站推荐合集" },
            { "url": "https://www.flaticon.com/", "label": "Icons" },
            { "url": "https://next-ai-drawio.jiang.jp/zh/", "label": "Next AI Drawio" },
            { "url": "https://excalidraw.com/", "label": "Excalidraw" },
            { "url": "https://cspaper.org/", "label": "CS Paper Reviews" },
            { "url": "https://ccfddl.com/", "label": "CCF DDL" },
            { "url": "https://cook.aiursoft.com/", "label": "Cook" }
        ]
    }
]
};

const ICONS = {
    blog: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>',
    github: '<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>',
    scholar: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" /></svg>',
    email: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>'
};

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

function build() {
    const config = {
        profile: {
            name: parseEnv(process.env.PROFILE_NAME, DEFAULT_CONFIG.profile.name),
            title: parseEnv(process.env.PROFILE_TITLE, DEFAULT_CONFIG.profile.title),
            avatar: parseEnv(process.env.PROFILE_AVATAR, DEFAULT_CONFIG.profile.avatar),
            slogan: parseEnv(process.env.PROFILE_SLOGAN, DEFAULT_CONFIG.profile.slogan),
            domain: parseEnv(process.env.PROFILE_DOMAIN, DEFAULT_CONFIG.profile.domain)
        },
        links: parseJsonEnv(process.env.PROFILE_LINKS, DEFAULT_CONFIG.links).map(link => ({
            url: link.url,
            label: link.label,
            icon: ICONS[link.icon] || link.icon
        })),
        announcements: parseJsonEnv(process.env.ANNOUNCEMENTS, DEFAULT_CONFIG.announcements),
        bookmarks: parseJsonEnv(process.env.BOOKMARKS, DEFAULT_CONFIG.bookmarks)
    };

    const templatePath = path.join(__dirname, 'index.template.html');
    const outputPath = path.join(__dirname, 'index.html');

    let html = fs.readFileSync(templatePath, 'utf8');
    html = html.replace('{{CONFIG}}', JSON.stringify(config));
    fs.writeFileSync(outputPath, html);

    console.log('✅ Build completed!');
    console.log(`   Profile: ${config.profile.name}`);
    console.log(`   Links: ${config.links.length}`);
    console.log(`   Announcements: ${config.announcements.length}`);
    console.log(`   Bookmarks: ${config.bookmarks.length} folders`);
}

build();

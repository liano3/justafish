const DEFAULT_CONFIG = {
    profile: {
        siteName: 'Just A Fish',
        siteIcon: '🐟',
        name: 'Alex Chen',
        nickname: 'Alex Chen',
        title: 'Computer Science Student',
        avatar: './avatar.png',
        slogan: '保持好奇，持续创造',
        domain: 'example.com',
        introduction: '正在学习计算机科学，关注智能系统与软件工程，并持续记录项目实践。',
        researchInterests: ['Intelligent Systems', 'Software Engineering', 'Human-Centered AI'],
        birthday: '2002-08-15',
        email: 'alex.chen@example.com',
        phone: '+86 000 0000 0000',
        links: [
            { url: 'https://example.com/blog', label: 'example.com/blog', icon: 'blog' },
            { url: 'https://github.com/octocat', label: 'github.com/octocat', icon: 'github' },
            { url: 'mailto:alex.chen@example.com', label: 'alex.chen@example.com', icon: 'email' }
        ]
    },
    announcements: [
        {
            enabled: true,
            icon: '📢',
            content: '欢迎来到示例个人主页，页面内容可以通过环境变量配置。',
            link: { label: '配置说明', url: 'https://example.com/docs' },
            expiresAt: ''
        },
        {
            enabled: true,
            icon: '✨',
            content: '简历页面已整理项目、论文、教育和获奖经历。',
            link: null,
            expiresAt: ''
        },
        {
            enabled: true,
            icon: '🧩',
            content: '应用页面提供时钟、番茄钟、舒尔特方格和 2048。',
            link: null,
            expiresAt: ''
        }
    ],
    education: [
        {
            school: '星海大学',
            degree: '硕士研究生',
            major: '计算机科学与技术',
            start: '2025',
            end: '至今',
            description: '研究方向包括智能系统与大模型应用。'
        },
        {
            school: '远川理工学院',
            degree: '工学学士',
            major: '软件工程',
            start: '2021',
            end: '2025',
            description: '主修数据结构、机器学习与软件工程。'
        }
    ],
    awards: [
        {
            title: '优秀学生奖学金',
            issuer: '星海大学',
            date: '2026-06',
            description: '奖励在课程学习与研究实践中的综合表现。'
        },
        {
            title: '高校软件创意赛一等奖',
            issuer: '软件创意赛组委会',
            date: '2024-11',
            description: '负责核心系统设计与前端实现。'
        }
    ],
    works: [
        {
            tag: 'project',
            title: 'Just A Fish 个人主页',
            organization: '个人项目',
            period: '2026',
            description: '一个通过 Vercel 环境变量驱动内容的个人主页，包含简历、书签、效率工具与小游戏。',
            keywords: ['JavaScript', 'CSS', 'Vercel'],
            links: [
                { label: '项目主页', url: 'https://example.com/projects/homepage' }
            ]
        },
        {
            tag: 'project',
            title: '智能文献阅读助手',
            organization: '星海大学智能系统实验室',
            period: '2025 - 2026',
            description: '面向学术论文的检索、摘要与知识整理工具，支持结构化阅读笔记和重点内容追踪。',
            keywords: ['LLM', 'RAG', 'Web'],
            links: [
                { label: '项目主页', url: 'https://example.com/projects/paper-assistant' }
            ]
        },
        {
            tag: 'paper',
            title: 'Efficient Collaboration for Language Model Agents',
            publication: 'ACL 2026',
            authors: 'Alex Chen, Taylor Liu',
            description: '研究语言模型智能体在长程任务中的协作与信息共享机制。',
            keywords: ['LLM Agents', 'Collaboration'],
            links: [
                { label: '论文', url: 'https://example.com/papers/agent-collaboration' }
            ]
        }
    ],
    bookmarks: [
        {
            "name": "常用网站",
            "links":[
                { "url": "https://example.com/", "label": "Example" },
                { "url": "https://github.com/", "label": "GitHub" },
                { "url": "https://developer.mozilla.org/", "label": "MDN Web Docs" }
            ]
        },
        {
            "name": "学习资源",
            "links":[
                { "url": "https://arxiv.org/", "label": "arXiv" },
                { "url": "https://paperswithcode.com/", "label": "Papers with Code" },
                { "url": "https://ocw.mit.edu/", "label": "MIT OpenCourseWare" }
            ]
        },
        {
            "name": "在线工具",
            "links":[
                { "url": "https://excalidraw.com/", "label": "Excalidraw" },
                { "url": "https://www.overleaf.com/", "label": "Overleaf" },
                { "url": "https://jsonformatter.org/", "label": "JSON Formatter" }
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

const EXTERNAL_ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>';

module.exports = { DEFAULT_CONFIG, ICONS, EXTERNAL_ICON };

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
        phone: '182****9662',
        email: 'alex.chen@example.com',
        footer: {
            enabled: true,
            startYear: '2024',
            showDomain: true,
            showLastUpdated: true,
            showVisitorCount: true,
            text: 'Made with ❤️'
        },
        links: [
            { url: 'https://example.com/blog', label: 'example.com/blog', icon: 'blog' },
            { url: 'https://github.com/octocat', label: 'github.com/octocat', icon: 'github' },
            { url: 'mailto:alex.chen@example.com', label: 'alex.chen@example.com', icon: 'email' }
        ]
    },
    announcements: [
        {
            icon: '📢',
            content: '欢迎来到示例个人主页，页面内容可以通过环境变量配置。',
            link: { label: '配置说明', url: 'https://example.com/docs' },
            expiresAt: ''
        },
        {
            icon: '✨',
            content: '简历页面已整理项目、论文、教育和获奖经历。',
            link: null,
            expiresAt: ''
        },
        {
            icon: '🧩',
            content: '应用页面提供番茄钟、随机选择、日期记录和多款注意力小游戏。',
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
                { "url": "https://example.com/", "label": "Example", "description": "用于文档和测试的示例域名。", "tags": ["参考", "Web"] },
                { "url": "https://github.com/", "label": "GitHub", "description": "代码托管、协作开发与开源项目平台。", "tags": ["开发", "Git"] },
                { "url": "https://developer.mozilla.org/", "label": "MDN Web Docs", "description": "Web 开发技术文档与浏览器 API 参考。", "tags": ["开发", "Web", "文档"] }
            ]
        },
        {
            "name": "学习资源",
            "links":[
                { "url": "https://arxiv.org/", "label": "arXiv", "description": "查找和阅读多学科预印本论文。", "tags": ["学术", "论文"] },
                { "url": "https://paperswithcode.com/", "label": "Papers with Code", "description": "联系机器学习论文、代码和基准结果。", "tags": ["学术", "AI", "代码"] },
                { "url": "https://ocw.mit.edu/", "label": "MIT OpenCourseWare", "description": "MIT 免费开放的课程讲义与学习资源。", "tags": ["课程", "学习"] }
            ]
        },
        {
            "name": "在线工具",
            "links":[
                { "url": "https://excalidraw.com/", "label": "Excalidraw", "description": "手绘风格的在线白板与流程图工具。", "tags": ["绘图", "效率"] },
                { "url": "https://www.overleaf.com/", "label": "Overleaf", "description": "支持多人协作的在线 LaTeX 编辑器。", "tags": ["写作", "LaTeX"] },
                { "url": "https://jsonformatter.org/", "label": "JSON Formatter", "description": "格式化、校验和查看 JSON 数据。", "tags": ["开发", "JSON"] }
            ]
        }
    ]
};

module.exports = { DEFAULT_CONFIG };

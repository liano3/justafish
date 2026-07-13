# Just A Fish 🐟

一个简洁优雅的个人主页，通过环境变量自定义所有配置。

> 本次更新是为了体验 Codex + GPT-5.6 sol。

---

## 项目结构

```
web1/
  src/
    css/
      common.css              # 共享的 reset 和基础样式
      components/
        clock.css              # 时钟组件样式
        pomodoro.css           # 番茄钟样式
        schulte.css            # 舒尔特方格样式
        game2048.css           # 2048 游戏样式
      modern.css               # 主页样式
    js/
      common.js                # $()、formatTime()、shuffle() 等工具函数
      clock.js                 # 时钟模块
      pomodoro.js              # 番茄钟模块
      schulte.js               # 舒尔特方格模块
      game2048.js              # 2048 输入、渲染与本地存档适配
      vendor/
        2048-core.js           # 2048 官方 MIT 核心游戏逻辑
      modern/
        main.js                # 主题切换、SPA 路由、初始化
    templates/
      modern.template.html     # 主页 HTML 骨架
    config/
      default.js               # 默认配置（个人信息、简历、书签）
  dist/                        # 构建输出目录（已 gitignore）
  build.js                     # 构建脚本
  package.json
  vercel.json
```

## 快速开始

### 本地开发

```bash
# 安装依赖（无外部依赖，仅需 Node.js）
node build.js

# 启动本地服务器预览
cd dist && python3 -m http.server 8080

# 或一步到位
npm run preview
```

访问 `http://localhost:8080` 查看主页。

### 构建流程

`node build.js` 会执行以下操作：

1. 按顺序拼接 CSS：`common.css` → 组件样式 → 主页样式
2. 按顺序拼接 JS：`common.js` → 组件模块 → 主页入口
3. 将 CSS/JS 内联到 HTML 模板中
4. 注入配置数据（环境变量 > 默认配置）
5. 输出 `dist/index.html`、`sitemap.xml` 和 `robots.txt`
6. 复制静态资源（avatar.png、BingSiteAuth.xml）

### 修改内容

- **改样式**：编辑 `src/css/` 下对应的 CSS 文件
- **改交互**：编辑 `src/js/` 下对应的 JS 文件
- **改页面结构**：编辑 `src/templates/` 下的模板
- **改默认配置**：编辑 `src/config/default.js`

修改后运行 `node build.js` 重新构建。

2048 核心逻辑基于 [Gabriele Cirulli 的 2048](https://github.com/gabrielecirulli/2048)，按 MIT License 使用并保留原始许可声明。

---

## 部署到 Vercel

1. 推送代码到 GitHub
2. 在 [vercel.com](https://vercel.com) 导入项目
3. 按需配置环境变量（见下方）
4. 部署完成，可绑定自定义域名

---

## 环境变量配置

在 Vercel 中设置以下环境变量来自定义主页。不设置时使用 `src/config/default.js` 中的演示数据。数组变量中的每一项都应是 JSON 对象；结构无效时构建会输出警告并回退到演示数据。

| 变量名 | JSON 类型 | 说明 |
|--------|-----------|------|
| `PROFILE_JSON` | 对象 | 个人信息、个人介绍和外部链接 |
| `ANNOUNCEMENTS_JSON` | 数组 | 首页滚动公告 |
| `EDUCATION_JSON` | 数组 | 教育经历 |
| `AWARDS_JSON` | 数组 | 获奖经历 |
| `WORKS_JSON` | 数组 | 项目与论文，通过 `tag` 区分 |
| `BOOKMARKS` | 数组 | 收藏夹分组 |

原来的 `PROFILE_NAME`、`PROFILE_TITLE`、`PROFILE_AVATAR`、`PROFILE_SLOGAN`、`PROFILE_DOMAIN` 和 `PROFILE_LINKS` 已合并为 `PROFILE_JSON`。旧的动态列表 `ANNOUNCEMENTS` 不再读取，首页公告使用新的 `ANNOUNCEMENTS_JSON`。

### 个人信息 (PROFILE_JSON)

```json
{
  "siteName": "Just A Fish",
  "siteIcon": "🐟",
  "name": "Alex Chen",
  "nickname": "Alex",
  "title": "Computer Science Student",
  "avatar": "./avatar.png",
  "slogan": "保持好奇，持续创造",
  "domain": "example.com",
  "introduction": "正在学习计算机科学，关注智能系统与软件工程。",
  "researchInterests": ["Intelligent Systems", "Software Engineering", "Human-Centered AI"],
  "birthday": "2002-08-15",
  "email": "alex.chen@example.com",
  "footer": {
    "enabled": true,
    "startYear": "2024",
    "showDomain": true,
    "showLastUpdated": true,
    "showVisitorCount": true,
    "text": "Made with ❤️"
  },
  "links": [
    {"url": "https://example.com/blog", "label": "example.com/blog", "icon": "blog"},
    {"url": "https://github.com/octocat", "label": "github.com/octocat", "icon": "github"},
    {"url": "mailto:alex.chen@example.com", "label": "alex.chen@example.com", "icon": "email"}
  ]
}
```

`siteName` 控制浏览器标题和页头品牌名。`siteIcon` 是文本字段，支持 emoji 或短文本，并会同时用于页头图标和自动生成的 favicon，不需要额外上传图标文件。`name` 用于简历姓名和作者信息，`nickname` 用于首页名称；未设置 `nickname` 时使用 `name`。

`researchInterests` 会在简历介绍下方显示为研究兴趣标签，并参与 SEO 关键词和结构化数据生成。`birthday` 使用 `YYYY-MM-DD` 格式，简历页会根据访问当天的日期自动计算年龄。`email` 显示在简历姓名下方；`links` 只用于首页入口，支持的 `icon` 为 `blog`、`github`、`scholar`、`email`。

SEO 描述、规范网址、分享信息和人物结构化数据会从个人信息自动生成。需要覆盖默认分享内容时，可在 `PROFILE_JSON` 中额外设置 `seoDescription` 和 `shareImage`；`shareImage` 支持站内相对路径或完整 HTTPS 地址。

`footer` 控制页脚：`enabled` 控制是否显示，`startYear` 是网站建立年份，`showDomain`、`showLastUpdated` 和 `showVisitorCount` 分别控制域名、更新时间与全站 UV，`text` 是末尾的自定义文字。UV 使用不蒜子提供的匿名计数脚本；关闭后不会加载该第三方脚本，本地预览也不会计数。页脚和站点地图中的更新时间在每次构建时自动生成。

### 首页公告 (ANNOUNCEMENTS_JSON)

```json
[
  {
    "enabled": true,
    "icon": "📢",
    "content": "欢迎来到示例个人主页。",
    "link": {
      "label": "查看详情",
      "url": "https://example.com"
    },
    "expiresAt": "2026-12-31"
  },
  {
    "enabled": true,
    "icon": "✨",
    "content": "新的项目与论文已经发布。",
    "link": null,
    "expiresAt": ""
  }
]
```

多条公告每 5 秒纵向切换，鼠标悬停或键盘聚焦时暂停。`icon`、`link` 和 `expiresAt` 可省略；`enabled` 为 `false` 或到期的公告会自动隐藏。没有有效公告时整个公告栏不渲染。

### 教育经历 (EDUCATION_JSON)

```json
[
  {
    "school": "星海大学",
    "degree": "硕士研究生",
    "major": "计算机科学与技术",
    "start": "2025",
    "end": "至今",
    "description": "研究方向或补充说明。"
  }
]
```

### 获奖经历 (AWARDS_JSON)

```json
[
  {
    "title": "优秀研究生奖学金",
    "issuer": "星海大学",
    "date": "2026-06",
    "description": "奖项说明。"
  }
]
```

### 项目与论文 (WORKS_JSON)

项目使用 `organization` 表示所属学校、实验室、公司或开源组织；论文使用合并后的 `publication`，例如 `ACL 2026`。

```json
[
  {
    "tag": "project",
    "title": "项目名称",
    "organization": "所属单位",
    "period": "2025 - 2026",
    "description": "项目简介。",
    "keywords": ["JavaScript", "Web"],
    "links": [
      {"label": "GitHub", "url": "https://github.com/example/project"}
    ]
  },
  {
    "tag": "paper",
    "title": "Paper Title",
    "publication": "ACL 2026",
    "authors": "Author One, Author Two",
    "description": "论文简介。",
    "keywords": ["LLM", "Agent"],
    "links": [
      {"label": "论文", "url": "https://aclanthology.org/"}
    ]
  }
]
```

### 收藏夹 (BOOKMARKS)

JSON 数组格式，支持文件夹分组：

```json
[
  {
    "name": "学习资源",
    "links": [
      {"url": "https://arxiv.org/", "label": "arXiv"},
      {"url": "https://paperswithcode.com/", "label": "Papers with Code"}
    ]
  }
]
```

---

## License

MIT

# Just A Fish 🐟

一个由 JSON 环境变量驱动的静态个人网站，包含首页、简历、收藏夹和实用工具，并支持中英文页面。

## 快速开始

项目无第三方 npm 依赖，只需 Node.js 22 或更新版本；本地预览还需要 Python 3。

```bash
npm run build
npm run preview
```

预览地址为 `http://localhost:8080`，构建结果位于 `dist/`。每次构建都会重新生成整个输出目录。

本地配置写入被 Git 忽略的 `.env.local`：

```dotenv
PAGES_JSON='{"home":true,"resume":true,"bookmarks":true,"apps":true,"language":true}'
PROFILE_JSON='{"name":"Alex Chen","email":"alex@example.com","domain":"example.com"}'
```

配置优先级为系统环境变量、`.env.local`、`src/config/default.js`。配置按下方字段格式填写；无效 JSON 直接终止构建，不做自动修复或逐字段类型兼容。

JSON 内容含英文单引号时，`.env.local` 的值使用反引号包裹，避免截断。

## 项目结构

```text
src/config/default.js       默认示例配置
src/config/apps.js          工具目录、资源与初始化入口
src/build/                  配置读取、双语文案、资源构建和页面渲染
src/templates/              HTML 模板及公共片段
src/css/common.css          公共控件样式
src/css/modern.css          页面布局与主题
src/css/components/         各工具样式
src/js/                     共用逻辑、页面交互与工具模块
build.js                    静态构建脚本
tests/                      单元测试与浏览器回归
dist/                       构建输出（Git 忽略）
vercel.json                 Vercel 构建配置
```

修改源码后运行 `npm run build`。Vercel 部署时直接导入仓库并按需添加环境变量即可。

运行 `npm test` 检查配置、API、双语构建和页面开关。浏览器回归先运行 `npm run preview`，再在另一终端执行 `npm run test:browser`；可用 `TEST_BASE_URL` 指定其他预览地址。测试通过 Playwright CLI 创建隔离会话，使用模拟聊天响应，不调用真实 AI 服务。

页面关闭后，其对应 JS/CSS 不进入构建；工具详情页只加载公共样式与自身资源。新增工具在 `src/config/apps.js` 中声明入口。面向现代浏览器，工具直接使用 localStorage 保存数据，不维护备用存储或旧版本存档迁移。邮箱复制需要 HTTPS 或 localhost。

## 配置

所有配置均为 JSON。英文对象只覆盖填写的字段，英文数组未设置时继承中文数据。

| 变量 | 类型 | 内容 |
| --- | --- | --- |
| `PAGES_JSON` | 对象 | 页面和双语构建开关 |
| `PROFILE_JSON` | 对象 | 个人信息、外部链接和页脚 |
| `ANNOUNCEMENTS_JSON` | 数组 | 首页公告 |
| `EDUCATION_JSON` | 数组 | 教育经历；可选 `descriptionUrl` 为描述添加醒目的外链 |
| `STUDENT_WORK_JSON` | 数组 | 学生工作（`title`、`subtitle`、`date`、`description`） |
| `AWARDS_JSON` | 数组 | 获奖经历 |
| `PAPERS_JSON` | 数组 | 论文 |
| `PROJECTS_JSON` | 数组 | 项目 |
| `BOOKMARKS` | 数组 | 收藏夹分组、描述和标签 |
| `PROFILE_EN_JSON` | 对象 | 英文个人信息 |
| `ANNOUNCEMENTS_EN_JSON` | 数组 | 英文公告 |
| `EDUCATION_EN_JSON` | 数组 | 英文教育经历 |
| `STUDENT_WORK_EN_JSON` | 数组 | 英文学生工作 |
| `AWARDS_EN_JSON` | 数组 | 英文获奖经历 |
| `PAPERS_EN_JSON` | 数组 | 英文论文 |
| `PROJECTS_EN_JSON` | 数组 | 英文项目 |
| `BOOKMARKS_EN` | 数组 | 英文收藏夹 |
| `AI_CONFIG` | 对象 | 服务端 AI 配置：`apiKey`、`baseUrl`、`model` |
| `EASTER_EGGS` | 对象 | 口令到 `title`、`greeting`、`prompt` 的映射，仅服务端读取 |

### 页面与语言

```json
{"home":true,"resume":true,"bookmarks":true,"apps":true,"language":true}
```

字段未填写时默认启用。页面设为 `false` 后，其菜单和内容不会生成；如果四个页面全部关闭，构建会保留首页。`language: false` 还会去除 `/en/`、语言切换、英文 sitemap 条目和 `hreflang`。

中文页面位于 `/`，英文页面位于 `/en/`，切换语言时会保留当前页面锚点。

### 个人信息

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
  "introduction": "个人简介",
  "researchInterests": ["AI", "Software Engineering"],
  "birthday": "2002-08-15",
  "phone": "182****9662",
  "email": "alex@example.com",
  "links": [{"url":"https://github.com/octocat","label":"GitHub","icon":"github"}],
  "footer": {"enabled":true,"startYear":"2024","showDomain":true,"showLastUpdated":true,"showVisitorCount":true,"text":"Made with ❤️"}
}
```

- `siteIcon` 支持 emoji 或短文本，并用于页头和 favicon。
- `name` 用于简历和作者信息，`nickname` 用于首页名称。
- `birthday` 使用 `YYYY-MM-DD`；年龄由浏览器自动计算。电话可以使用脱敏文本。
- 首页链接图标支持 `blog`、`github`、`scholar` 和 `email`。
- `showVisitorCount` 启用不蒜子匿名 UV 统计；关闭后不加载其脚本。
- SEO、分享信息和结构化数据会自动生成，也可用 `seoDescription`、`shareImage` 覆盖。

作者高亮由 `PROFILE_JSON.authorNames` 配置（例如 `["Alex Chen", "A. Chen"]`），默认也匹配 `name`。`author` 用中英文逗号或分号分隔，按完整姓名匹配。

### 内容数组

| 配置 | 字段 |
| --- | --- |
| 公告 | `icon`、`content`、`link`（`label`、`url`）、`expiresAt` |
| 教育、学生工作、奖项 | `title`、`subtitle`、`date`、`description`；可选 `descriptionUrl` 为描述添加链接 |
| 论文、项目 | `title`、`author`、`description`、`tag`（字符串数组）、`result`、`url` |

公告的 `icon`、`link` 和 `expiresAt` 可省略；`expiresAt` 使用 `YYYY-MM-DD`，过期公告会自动隐藏。没有有效公告时不生成公告栏。

空内容数组不显示对应简历区块；论文和项目分别由 `PAPERS_JSON`、`PROJECTS_JSON` 配置；英文配置分别为 `PAPERS_EN_JSON`、`PROJECTS_EN_JSON`。

论文和项目共用以下结构。`author` 为作者或所属团队，`result` 为发表信息、项目成果或时间，`url` 为主要链接；链接显示在条目顶部。

```json
[
  {"title":"Paper Title","author":"Author One, Author Two","description":"论文简介","tag":["LLM"],"result":"ACL 2026","url":"https://example.com/paper"}
]
```

项目示例（填写到 `PROJECTS_JSON`）：

```json
[
  {"title":"项目名称","author":"所属团队","description":"项目简介","tag":["JavaScript"],"result":"2025–2026","url":"https://example.com/project"}
]
```

### 收藏夹

```json
[
  {
    "name": "学习资源",
    "links": [
      {"url":"https://arxiv.org/","label":"arXiv","description":"多学科预印本平台","tags":["学术","论文"]}
    ]
  }
]
```

`description` 和 `tags` 可省略。页面会根据标签自动生成单选筛选器，标签筛选与关键词搜索可组合使用。

## 静态文件

构建时会复制项目根目录中存在的以下文件：

| 文件 | 用途 |
| --- | --- |
| `avatar.png` | 默认头像 |
| `resume.pdf` | 中文简历 |
| `resume-en.pdf` | 英文简历，仅双语构建时复制 |
| `BingSiteAuth.xml` | Bing 站点验证 |

构建时存在简历文件才显示原生下载链接。下载文件名根据对应语言的 `name` 生成：`名字-简历.pdf` 或 `English-Name-Resume.pdf`。

## License

MIT。2048 核心逻辑基于 [Gabriele Cirulli 的 2048](https://github.com/gabrielecirulli/2048)，沿用其 MIT License。

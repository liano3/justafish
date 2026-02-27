# Just A Fish 🐟

一个简洁优雅炫酷的海洋主题个人主页，支持通过环境变量自定义所有配置。**所有内容均由 Trae 生成**。

---

## 文件说明

| 文件 | 说明 |
|------|------|
| `index.template.html` | HTML 模板文件，包含页面结构、样式和交互逻辑，使用 `{{CONFIG}}` 占位符等待配置注入 |
| `build.js` | 构建脚本，读取环境变量和默认配置，生成最终的 `index.html` |
| `index.html` | 构建生成的最终文件，Vercel 部署时使用此文件（不要手动编辑） |
| `vercel.json` | Vercel 部署配置，指定构建命令和输出目录 |
| `package.json` | 项目元信息和脚本配置 |
| `.gitignore` | Git 忽略规则 |

---

## 环境变量配置

在 Vercel 中设置以下环境变量来自定义你的主页。

### 个人信息

| 变量名 | 说明 |
|--------|------|
| `PROFILE_NAME` | 姓名 |
| `PROFILE_TITLE` | 头衔/身份 |
| `PROFILE_AVATAR` | 头像(url) |
| `PROFILE_SLOGAN` | Slogan 文案 |
| `PROFILE_DOMAIN` | 底部域名 |

### 社交链接 (PROFILE_LINKS)

JSON 数组格式，支持任意数量的链接：

```json
[
  {"url": "https://blog.justafish.cn/", "label": "blog.justafish.cn", "icon": "blog"},
  {"url": "https://github.com/liano3", "label": "github.com/liano3", "icon": "github"},
  {"url": "mailto:1291516518@qq.com", "label": "1291516518@qq.com", "icon": "email"}
]
```

| 字段 | 说明 |
|------|------|
| `url` | 链接地址，`mailto:` 开头为邮箱 |
| `label` | 显示文字 |
| `icon` | 图标类型：`blog`、`github`、`scholar`、`email` |

### 公告栏 (ANNOUNCEMENTS)

JSON 数组格式，按时间倒序排列：

```json
[
  {"date": "2026-02-24", "content": "个人主页上线啦！欢迎访问~", "tag": "新站"},
  {"date": "2025-09-01", "content": "中科大研究生入学", "tag": "生活"}
]
```

| 字段 | 说明 |
|------|------|
| `date` | 日期，格式 `YYYY-MM-DD` |
| `content` | 公告内容 |
| `tag` | 标签，用于分类显示 |

### 收藏夹 (BOOKMARKS)

JSON 数组格式，支持文件夹分组：

```json
[
  {
    "name": "学习",
    "links": [
      {"url": "https://papers.cool/", "label": "Cool Papers"},
      {"url": "https://oi-wiki.org/", "label": "OI Wiki"}
    ]
  },
  {
    "name": "工具",
    "links": [
      {"url": "https://github.com/", "label": "GitHub"},
      {"url": "https://www.overleaf.com/project", "label": "Overleaf"}
    ]
  },
  {
    "name": "AI",
    "links": [
      {"url": "https://chatgpt.com/", "label": "ChatGPT"},
      {"url": "https://gemini.google.com/app", "label": "Gemini"}
    ]
  }
]
```

| 字段 | 说明 |
|------|------|
| `name` | 文件夹名称 |
| `links` | 该文件夹下的链接数组 |
| `links[].url` | 链接地址 |
| `links[].label` | 显示文字 |

---

## 部署到 Vercel

### 方法一：从 GitHub 导入（推荐）

1. **推送代码到 GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/你的用户名/justafish.git
   git push -u origin main
   ```

2. **登录 Vercel**
   - 访问 [vercel.com](https://vercel.com)
   - 使用 GitHub 账号登录

3. **导入项目**
   - 点击 "Add New..." → "Project"
   - 选择你的 GitHub 仓库
   - 点击 "Import"

4. **配置环境变量（可选）**
   - 展开 "Environment Variables"
   - 添加需要自定义的变量（如 `PROFILE_NAME`、`ANNOUNCEMENTS` 等）
   - 不添加则使用默认值

5. **部署**
   - 点击 "Deploy"
   - 等待构建完成

6. **绑定自定义域名**
   - 进入项目 Settings → Domains
   - 添加你的域名（如 `justafish.cn`）
   - 按提示配置 DNS 解析

## 本地预览

```bash
# 构建页面
node build.js

# 启动本地服务器
python3 -m http.server 8080

# 或使用 npm
npm run build && npm run preview
```

访问 http://localhost:8080 查看效果。

---

## License

MIT

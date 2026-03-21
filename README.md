# Just A Fish 🐟

一个简洁优雅的个人主页，支持海洋模式和现代模式切换，通过环境变量自定义所有配置。

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
      ocean.css                # 海洋模式样式
      modern.css               # 现代模式样式
    js/
      common.js                # $()、formatTime()、shuffle() 等工具函数
      clock.js                 # 时钟模块（参数化，两种模式共用）
      pomodoro.js              # 番茄钟模块
      schulte.js               # 舒尔特方格模块
      ocean/
        main.js                # 海洋模式：光线、气泡、鱼、面板系统、初始化
      modern/
        main.js                # 现代模式：主题切换、SPA 路由、初始化
    templates/
      index.template.html      # 海洋模式 HTML 骨架
      modern.template.html     # 现代模式 HTML 骨架
    config/
      default.js               # 默认配置（个人信息、链接、公告、书签）
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

访问 `http://localhost:8080` 查看海洋模式，`http://localhost:8080/modern.html` 查看现代模式。

### 构建流程

`node build.js` 会执行以下操作：

1. 按顺序拼接 CSS：`common.css` → 组件样式 → 模式样式
2. 按顺序拼接 JS：`common.js` → 组件模块 → 模式入口
3. 将 CSS/JS 内联到 HTML 模板中
4. 注入配置数据（环境变量 > 默认配置）
5. 输出 `dist/index.html` 和 `dist/modern.html`
6. 复制静态资源（avatar.png、BingSiteAuth.xml）

### 修改内容

- **改样式**：编辑 `src/css/` 下对应的 CSS 文件
- **改交互**：编辑 `src/js/` 下对应的 JS 文件
- **改页面结构**：编辑 `src/templates/` 下的模板
- **改默认配置**：编辑 `src/config/default.js`

修改后运行 `node build.js` 重新构建。

---

## 部署到 Vercel

1. 推送代码到 GitHub
2. 在 [vercel.com](https://vercel.com) 导入项目
3. 按需配置环境变量（见下方）
4. 部署完成，可绑定自定义域名

---

## 环境变量配置

在 Vercel 中设置以下环境变量来自定义你的主页，不设置则使用 `src/config/default.js` 中的默认值。

### 个人信息

| 变量名 | 说明 |
|--------|------|
| `PROFILE_NAME` | 姓名 |
| `PROFILE_TITLE` | 头衔/身份 |
| `PROFILE_AVATAR` | 头像 URL |
| `PROFILE_SLOGAN` | Slogan 文案 |
| `PROFILE_DOMAIN` | 底部显示的域名 |

### 社交链接 (PROFILE_LINKS)

JSON 数组格式：

```json
[
  {"url": "https://blog.justafish.cn/", "label": "blog.justafish.cn", "icon": "blog"},
  {"url": "https://github.com/liano3", "label": "github.com/liano3", "icon": "github"},
  {"url": "mailto:1291516518@qq.com", "label": "1291516518@qq.com", "icon": "email"}
]
```

支持的 `icon` 类型：`blog`、`github`、`scholar`、`email`

### 公告栏 (ANNOUNCEMENTS)

JSON 数组格式，按时间倒序排列：

```json
[
  {"date": "2026-02-24", "content": "个人主页上线啦！欢迎访问~", "tag": "新站"},
  {"date": "2025-09-01", "content": "中科大研究生入学", "tag": "生活"}
]
```

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
  }
]
```

---

## License

MIT

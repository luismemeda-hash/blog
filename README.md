# 陛下的小站 · 磨砂玻璃个人博客

一个零依赖的纯静态博客：没有框架、不需要服务器，双击 `index.html` 就能打开（`file://` 下也完全可用，运行时不发任何网络请求，也不依赖任何 CDN）。

- 每篇文章是 `posts/` 目录里的一个 Markdown 文件，一条命令编译成 `js/posts.js`；
- 首页的精选、最新文章、归档、分类、标签云，以及阅读器、目录、站内搜索都由它自动生成；
- 推送到 GitHub 后，GitHub Actions 会自动构建并发布到 GitHub Pages。

---

## 目录结构

```
glass-blog/
├── index.html                  页面骨架（一般不用改）
├── css/style.css               样式与配色（含代码高亮配色）
├── js/
│   ├── site.js                 ★ 站点信息（名称、简介、社交链接…）+ 封面预设
│   ├── posts.js                ⚙ 自动生成，请勿手改（由 posts/*.md 构建）
│   ├── markdown.js             内置 Markdown 渲染器（表格、任务列表、代码高亮、目录…）
│   └── app.js                  渲染、导航、阅读器、目录、搜索、灯箱、动画
├── posts/
│   ├── _template.md            新文章模板（下划线开头的文件不会被构建）
│   ├── digital-life.md         ★ 一篇文章 = 一个 .md 文件，文件名就是网址里的 id
│   └── …
├── images/                     文章图片（示例：glass-card.svg）
├── scripts/
│   ├── build-posts.mjs         构建脚本：posts/*.md → js/posts.js（零依赖）
│   └── new-post.mjs            新建文章脚本
├── package.json                npm run build / watch / new
├── .github/workflows/deploy.yml  推送到 main 自动部署到 GitHub Pages
├── vercel.json                 （可选）Vercel 部署配置
├── .nojekyll                   告诉 GitHub Pages 不要用 Jekyll 处理
├── CNAME.example               自定义域名示例
└── README.md
```

> `index.html` 里脚本的加载顺序是 `site.js → posts.js → markdown.js → app.js`，不要调换。

---

## 一、本地预览

1. 直接 **双击 `index.html`** 用浏览器打开即可。
2. 修改了 `posts/` 里的文章后，需要先构建一次再刷新页面：

```bash
npm run build      # 构建一次
npm run watch      # 或者：边写边自动构建（保存 .md 即更新），Ctrl+C 退出
```

只需要安装 [Node.js](https://nodejs.org/)（18 或更高版本），**不需要 `npm install`**——项目没有任何依赖。
没有装 Node 也没关系：直接推送到 GitHub，线上会自动构建（见“部署上线”）。

---

## 二、写文章

### 新建

```bash
npm run new -- 我的新文章                    # → posts/2026-10-08-post.md（纯中文标题用日期命名）
npm run new -- "Hello World"                 # → posts/hello-world.md
npm run new -- 京都游记 --slug kyoto-trip      # → posts/kyoto-trip.md（推荐：自己指定英文网址）
```

脚本会复制 `posts/_template.md`，自动填好标题和今天的日期。也可以直接复制任意一个 `.md` 文件改名使用。

- **文件名就是文章 id**，会出现在网址里：`#post/kyoto-trip`。只能用英文字母、数字、短横线 `-` 和下划线 `_`。
- 改文件名 = 改网址，旧链接会失效。
- 删除文章：删掉对应的 `.md` 文件，再构建一次。

### Front matter（文件开头的字段）

每篇文章以两行 `---` 包住的字段开头，后面是正文：

```markdown
---
title: 在京都的七天慢旅行
date: 2026-09-28
category: 旅行
tags: [旅行, 日本, 徒步]
cover: sunset
emoji: 🏔️
excerpt: 不赶景点，只在巷子里走走停停，喝一杯抹茶，看一场秋天的雨。
featured: false
---

正文从这里开始，用 Markdown 书写……
```

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `title` | 是 | 标题。含有 `: ` 或以特殊符号开头时请加引号：`title: "前端: 入门"` |
| `date` | 是 | 发布日期，必须是 `YYYY-MM-DD`，决定排序、归档的年 / 月分组 |
| `category` | 是 | 分类（一篇一个），侧栏“分类”自动统计篇数 |
| `excerpt` | 是 | 摘要，显示在卡片和搜索结果里 |
| `tags` | 否 | 标签数组：`tags: [CSS, 设计]`；也可写成多行 `- CSS` 列表。标签里有逗号时加引号 |
| `cover` | 否 | 封面：预设名 `aurora` / `sunset` / `mint` / `ice` / `night` / `blossom` / `meadow`（在 `js/site.js` 的 `COVERS` 里），或 CSS 渐变，或图片路径 `images/kyoto.jpg`、完整网址 |
| `emoji` | 否 | 文章卡片右上角的小图标 |
| `featured` | 否 | `true` / `false`。为 `true` 的最新一篇成为首页“精选文章”；都没有时自动取最新文章 |

- 以 `#` 开头的行是注释；字段名写错会给出提醒，必填项缺失或格式错误会**中止构建并用中文指出文件和行号**，此时 `js/posts.js` 不会被覆盖。
- **阅读时长** 不用填：按约 400 字 / 分钟自动计算。
- 构建后文章按日期从新到旧排序（同一天按文件名）。

### 正文里的图片

把图片放进 `images/`，然后写 `![说明](images/photo.jpg)`。说明文字会作为图片的替代文本，并在放大查看时显示在底部。

---

## 三、支持的 Markdown 语法

| 写法 | 效果 |
| --- | --- |
| `## 标题` / `### 标题` | 二、三级标题（`#` 一级，更多 `#` 按三级处理）。**每个标题自动生成锚点**，鼠标移上去出现 `#` 链接 |
| 空行分隔的文字 | 段落；行尾两个空格可强制换行 |
| `**粗体**`、`*斜体*`、`~~删除线~~` | **粗体**、*斜体*、~~删除线~~ |
| `` `行内代码` `` | `行内代码` |
| `- 项目` / `1. 项目` | 无序 / 有序列表；**缩进 2 个空格（有序列表 3 个）即可嵌套** |
| `- [ ] 待办` / `- [x] 完成` | 任务列表（显示为复选框） |
| `> 引用` | 引用块（内部可继续使用 Markdown） |
| `[文字](https://…)` | 链接（外部链接在新标签页打开；`javascript:` 会被拦截） |
| `![说明](images/a.jpg)` | 图片，点击可放大 |
| `---` | 分隔线 |
| `\*` | 反斜杠转义，原样显示符号 |
| 表格（见下） | GFM 表格，支持对齐 |
| 代码块（见下） | 语法高亮 + 一键复制 |

### 表格

```markdown
| 左对齐 | 居中 | 右对齐 |
| :--- | :---: | ---: |
| 苹果 | 3 个 | ¥12 |
```

窄屏下表格可左右滑动。单元格里要写 `|` 时写成 `\|`。

### 代码块

用三个反引号 ```` ``` ```` 或三个波浪线 `~~~` 包裹，并写上语言名：

````markdown
```js
console.log("你好");
```
````

- 内置高亮：`js` / `javascript`、`ts` / `typescript`、`python` / `py`、`html` / `xml` / `svg`、`css` / `scss`、`bash` / `sh` / `shell`、`json`。其他语言按纯文本显示。
- 高亮颜色随浅色 / 深色模式切换，在 `css/style.css` 顶部的 `--x-tk-*` 变量里修改。
- 每个代码块右上角有 **复制** 按钮。

### 自动目录

一篇文章有 **3 个及以上** 二级 / 三级标题时，会自动生成目录：

- 宽屏（≥ 1120px）：阅读器右侧的吸顶玻璃侧栏，滚动时自动高亮当前小节；
- 窄屏：正文顶部可折叠的“目录”，点开后选择小节即可跳转。

点击目录或标题旁的 `#` 后，网址会变成 `#post/<文章 id>/<小节>`，可以直接分享到某一小节。

所有内容都会先做 HTML 转义：正文里写的 `<div>` 等会原样显示，不会被执行。暂不支持：HTML 混写、脚注、数学公式。

---

## 四、站内搜索

- 打开方式：导航栏右上角的 🔍 按钮，或快捷键 **`/`**、**`Ctrl + K`**（Mac 上 **`⌘ + K`**）。
- 实时搜索标题、标签、分类、摘要和正文，中文直接按字词匹配；英文不区分大小写，允许一个字母的拼写错误；标题中按顺序出现的字也能模糊命中（如“纯效果”能找到《用纯 CSS 实现磨砂玻璃效果》）。多个关键词用空格分开，需要同时命中。
- 匹配的文字会高亮；结果显示标题、日期、分类 / 标签和正文片段。
- 键盘：**↑ / ↓** 选择，**Enter** 打开，**Esc** 关闭。

---

## 五、阅读体验

- **阅读器**：点击文章在页内打开，网址变为 `#post/<id>`；支持“返回”按钮、Esc、浏览器后退、点击空白处关闭，并恢复原来的滚动位置。分类和标签会在阅读器中列出相关文章。
- **阅读进度条**：阅读器顶部的细条，随阅读位置伸长。
- **图片放大**：点击正文图片，从原位置平滑放大；再点一下、按 Esc、向下轻扫或点 × 关闭。
- **回到顶部**：页面或阅读器向下滚动一段后，右下角出现玻璃按钮。
- 动画只使用 `transform` 和 `opacity`，统一缓动 `cubic-bezier(0.22, 1, 0.36, 1)`；系统开启“减少动态效果”时自动关闭动画；页面切到后台时背景动画暂停。
- 所有可点击元素至少 44 × 44px，方便手机点按。

---

## 六、修改站点名、简介、社交链接

都在 `js/site.js` 的 `window.SITE`：

```js
window.SITE = {
  name: "陛下的小站",               // 导航左上角与页脚
  title: "陛下的小站 · 个人博客",    // 浏览器标签页标题
  author: "Luis",                    // 首页大标题
  bio: "记录生活、技术与灵感",        // 一句话简介
  avatar: "L",                       // 一个字作为头像，或图片路径 "images/avatar.jpg"
  social: [
    { name: "GitHub", url: "https://github.com/你的用户名", icon: "github" },
    { name: "邮箱", url: "mailto:you@example.com", icon: "email" }
  ],
  about: "侧栏“关于我”的文字",
  footer: "© 2026 陛下的小站"
};
```

`icon` 可选：`github`、`weibo`、`email`、`twitter`、`link`。同一文件里的 `window.COVERS` 是封面渐变预设，可以增改，front matter 里写预设名即可使用。修改 `site.js` 不需要构建，刷新页面即可。

---

## 七、修改配色

打开 `css/style.css`，最上面的 `:root` 里：

- `--x-b1`、`--x-b2`、`--x-b3`：背景里三团缓慢漂移的渐变色团（换主题色主要改这三个）
- `--x-accent`：强调色（链接、按钮、焦点框、目录高亮、进度条）
- `--x-base`：页面底色；`--x-glass` / `--x-glass-strong`：玻璃透明度；`--x-blur`：模糊强度
- `--x-tk-c`（注释）、`--x-tk-k`（关键字）、`--x-tk-s`（字符串）、`--x-tk-n`（数字）、`--x-tk-f`（函数）等：代码高亮颜色
- `--x-mark`：搜索结果高亮底色

深色模式的对应颜色在 `:root[data-theme="dark"]` 和下面的 `@media (prefers-color-scheme: dark)` 两处，**两处要一起改**。右上角的主题切换只保存在内存中，刷新后重新跟随系统。

---

## 八、部署上线

### 方式 A：GitHub Pages（推荐，推送即自动发布）

**1. 创建仓库**
登录 GitHub → 右上角 **+ → New repository** → 填写仓库名（例如 `blog`；若想用 `用户名.github.io` 这个网址，仓库名就填 `用户名.github.io`）→ 选 Public → **Create repository**。

**2. 推送代码**（在 `glass-blog` 文件夹里执行，让这个文件夹成为仓库根目录）

```bash
cd glass-blog
git init
git add .
git commit -m "初始化博客"
git branch -M main
git remote add origin https://github.com/你的用户名/blog.git
git push -u origin main
```

> 注意 `.github/`、`.nojekyll` 是隐藏文件，用 `git add .` 会一起提交；如果用网页上传，请确认它们也上传了。

**3. 打开 Pages（Source 选 GitHub Actions）**
仓库页面 → **Settings → Pages** → *Build and deployment* 下的 **Source** 选择 **GitHub Actions**。

**4. 等待发布**
打开仓库的 **Actions** 标签，可以看到“部署到 GitHub Pages”在运行（每次推送到 `main` 都会自动触发，也可以在这里点 *Run workflow* 手动运行）。变绿后访问：

- 普通仓库：`https://你的用户名.github.io/blog/`
- `用户名.github.io` 仓库：`https://你的用户名.github.io/`

工作流做的事：检出代码 → `node scripts/build-posts.mjs` 构建文章 → `configure-pages` → `upload-pages-artifact` 打包整个文件夹 → `deploy-pages` 发布。构建失败（例如 front matter 写错）时，Actions 日志里会显示中文错误信息，线上保持上一版不变。

### 绑定自定义域名

**1. 在 GitHub 上填写域名**（先做这一步，防止域名被他人抢占）
**Settings → Pages → Custom domain** 填入域名（如 `blog.example.com`）→ **Save**。

> 使用 GitHub Actions 部署时，以这里填写的域名为准，仓库里的 `CNAME` 文件会被忽略。项目附带的 `CNAME.example` 只是示例：如果以后改用“从分支部署”或其他托管方式，可以把它复制为 `CNAME`、内容改成你的域名（只写一行域名）。

**2. 在域名服务商处添加 DNS 记录**

| 场景 | 记录类型 | 主机记录 | 记录值 |
| --- | --- | --- | --- |
| 子域名（`blog.example.com`、`www.example.com`） | `CNAME` | `blog`（或 `www`） | `你的用户名.github.io`（不带仓库名） |
| 根域名（`example.com`） | `A` | `@` | `185.199.108.153`、`185.199.109.153`、`185.199.110.153`、`185.199.111.153`（四条都加） |
| 根域名 IPv6（可选） | `AAAA` | `@` | `2606:50c0:8000::153`、`2606:50c0:8001::153`、`2606:50c0:8002::153`、`2606:50c0:8003::153` |

- 不要添加 `*.example.com` 这样的通配符记录。
- DNS 生效最长需要 24 小时；生效后回到 **Settings → Pages**，勾选 **Enforce HTTPS**。
- 根域名和 `www` 都配置好记录后，GitHub 会自动在两者之间跳转。

### 方式 B：Vercel（可选）

1. 先完成上面的“创建仓库、推送代码”两步。
2. 登录 [vercel.com](https://vercel.com) → **Add New → Project** → 导入这个 GitHub 仓库。
3. 项目根目录的 `vercel.json` 已经写好：Build Command 为 `node scripts/build-posts.mjs`，Output Directory 为 `.`，Framework 选 **Other**，其余保持默认 → **Deploy**。
4. 之后每次推送到 `main`，Vercel 会自动重新构建发布。自定义域名在 Vercel 项目的 **Settings → Domains** 中添加，按页面提示配置 DNS。

> 两种方式选一种即可；同时使用也没问题，它们互不影响。

---

## 九、日常写作流程

```bash
npm run new -- 京都游记 --slug kyoto-autumn   # 1. 新建文章
#  2. 用任意编辑器写 posts/kyoto-autumn.md（可同时开着 npm run watch，保存即构建）
npm run build                                 # 3. 构建，双击 index.html 预览
git add . && git commit -m "新文章：京都游记" && git push   # 4. 推送，几分钟后自动上线
```

也可以跳过第 3 步直接推送——线上会自动构建。但记得本地预览前要先构建，因为 `index.html` 读取的是 `js/posts.js`。

---

## 附：示例文章

`posts/markdown-guide.md` 是一篇演示全部 Markdown 写法的示例（表格、任务清单、代码高亮、目录、图片放大），可以当速查表；不需要的话，删除它和 `images/glass-card.svg`，再运行一次 `npm run build`。

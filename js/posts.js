/*
 * posts.js · 由 scripts/build-posts.mjs 自动生成，请勿手动修改！
 * 编辑文章：修改 posts/*.md，然后运行 npm run build（或 npm run watch 自动构建）。
 */
window.POSTS = [
  {
    "id": "digital-life",
    "title": "用 Hark 打造我的数字生活",
    "date": "2026-10-07",
    "category": "效率",
    "tags": [
      "效率",
      "工具",
      "生活方式"
    ],
    "cover": "radial-gradient(circle at 20% 30%, #c4b5fd, transparent 55%), radial-gradient(circle at 80% 20%, #fdba74, transparent 50%), radial-gradient(circle at 60% 90%, #67e8f9, transparent 55%), linear-gradient(135deg, #e9d5ff, #bae6fd)",
    "emoji": "✨",
    "excerpt": "从日程、笔记到这个小站，我把零散的工具收拢到一处。这篇文章记录了整理的过程、踩过的坑，以及现在每天真正在用的工作流。",
    "featured": true,
    "body": "\n从日程、笔记到这个小站，我把零散的工具收拢到一处。这篇文章记录了整理的过程、踩过的坑，以及现在每天真正在用的工作流。\n\n## 为什么要整理\n\n以前我的待办在一个 App，笔记在另一个，灵感又散落在聊天记录里。每次想找点什么，都要先回忆“它到底在哪儿”。\n\n## 现在的工作流\n\n1. 早上花五分钟看一眼当天的日程和待办。\n2. 白天的想法先随手记下，不急着分类。\n3. 晚上把值得留下的内容整理成笔记，偶尔写成这里的文章。\n\n> 工具不在多，在于每天真的会打开它。\n\n这里是正文的占位段落。真正动笔之前，我习惯先把想说的话列成几条，再慢慢把它们连成一段完整的叙述，让读者能顺着思路一路读下去。\n\n写作的过程也是整理自己的过程。很多当时觉得理所当然的细节，落到纸面上才发现还有不少值得推敲的地方，于是删删改改，留下最想分享的部分。\n\n如果你也有类似的经历或想法，欢迎通过页面上的邮箱联系我。替换这段文字时，保留段落之间的节奏，读起来会更舒服。\n"
  },
  {
    "id": "markdown-guide",
    "title": "博客写作指南：Markdown 语法速查",
    "date": "2026-10-05",
    "category": "编程",
    "tags": [
      "写作",
      "Markdown",
      "编程"
    ],
    "cover": "radial-gradient(circle at 20% 30%, #c4b5fd, transparent 55%), radial-gradient(circle at 80% 20%, #fdba74, transparent 50%), radial-gradient(circle at 60% 90%, #67e8f9, transparent 55%), linear-gradient(135deg, #e9d5ff, #bae6fd)",
    "emoji": "✍️",
    "excerpt": "表格、任务清单、代码高亮、目录、图片放大……这篇文章把博客支持的 Markdown 写法都演示一遍，写新文章时可以随时回来翻。",
    "featured": false,
    "body": "\n这是一篇示例文章，演示博客支持的全部 Markdown 写法。它同时也是一份速查表：写新文章时打开 `posts/markdown-guide.md`，照着抄就行。不需要的话，删掉这个文件再运行 `npm run build` 即可。\n\n## 文字与段落\n\n段落之间空一行。**粗体**、*斜体*、~~删除线~~ 和 `行内代码` 可以混用；[链接](https://developer.mozilla.org/zh-CN/) 会在新标签页打开。\n\n> 引用块里也可以继续使用 **Markdown**。\n\n## 列表\n\n### 嵌套列表\n\n- 旅行\n  - 京都：清水寺、哲学之道\n  - 大阪：道顿堀\n- 读书\n  1. 《置身事内》\n  2. 《被讨厌的勇气》\n\n### 任务清单\n\n- [x] 把文章拆成独立的 Markdown 文件\n- [x] 加上站内搜索\n- [ ] 写完京都游记的下篇\n- [ ] 给每篇文章配一张封面图\n\n## 表格\n\n冒号控制对齐方式：`:---` 左对齐，`:---:` 居中，`---:` 右对齐。\n\n| 功能 | 写法 | 对齐示例 |\n| :--- | :---: | ---: |\n| 粗体 | `**文字**` | 1 |\n| 删除线 | `~~文字~~` | 22 |\n| 任务 | `- [ ] 待办` | 333 |\n\n## 代码高亮\n\n代码块写上语言名就会自动高亮，右上角的按钮可以一键复制。支持 js / ts、python、html、css、bash、json。\n\n```js\n// 计算阅读时长：中文约 400 字 / 分钟\nfunction readingTime(text) {\n  const cjk = (text.match(/[\\u4e00-\\u9fff]/g) || []).length;\n  return Math.max(1, Math.ceil(cjk / 400));\n}\nconsole.log(`约 ${readingTime(\"你好\")} 分钟`);\n```\n\n```python\nfrom pathlib import Path\n\ndef count_posts(folder: str = \"posts\") -> int:\n    \"\"\"统计文章数量（跳过下划线开头的模板）\"\"\"\n    return sum(1 for p in Path(folder).glob(\"*.md\") if not p.name.startswith(\"_\"))\n\nprint(f\"共有 {count_posts()} 篇文章\")\n```\n\n```bash\n# 新建文章、构建、推送\nnpm run new -- 京都游记 --slug kyoto-2\nnpm run build && git add . && git commit -m \"新文章\" && git push\n```\n\n```json\n{\n  \"scripts\": { \"build\": \"node scripts/build-posts.mjs\" },\n  \"private\": true\n}\n```\n\n## 图片\n\n点击图片可以放大查看，再点一下、按 Esc 或向下轻扫即可关闭。\n\n![磨砂玻璃卡片示意图](images/glass-card.svg)\n\n## 目录与锚点\n\n文章里有三个及以上的二级 / 三级标题时，会自动生成目录：宽屏显示在右侧，窄屏折叠在正文顶部。鼠标移到标题上会出现 `#`，点击即可得到这一小节的链接。\n"
  },
  {
    "id": "kyoto-slow-travel",
    "title": "在京都的七天慢旅行",
    "date": "2026-09-28",
    "category": "旅行",
    "tags": [
      "旅行",
      "日本",
      "徒步"
    ],
    "cover": "radial-gradient(circle at 25% 35%, #fca5a5, transparent 55%), radial-gradient(circle at 80% 70%, #fde68a, transparent 55%), linear-gradient(135deg, #fecaca, #fef3c7)",
    "emoji": "🏔️",
    "excerpt": "不赶景点，只在巷子里走走停停，喝一杯抹茶，看一场秋天的雨。",
    "featured": false,
    "body": "\n不赶景点，只在巷子里走走停停，喝一杯抹茶，看一场秋天的雨。\n\n## 慢下来的几个小办法\n\n- 每天只安排一个“必须去”的地方\n- 早上出门，避开人潮\n- 走累了就找家小店坐下，**不看攻略**\n\n这里是正文的占位段落。真正动笔之前，我习惯先把想说的话列成几条，再慢慢把它们连成一段完整的叙述，让读者能顺着思路一路读下去。\n\n写作的过程也是整理自己的过程。很多当时觉得理所当然的细节，落到纸面上才发现还有不少值得推敲的地方，于是删删改改，留下最想分享的部分。\n\n如果你也有类似的经历或想法，欢迎通过页面上的邮箱联系我。替换这段文字时，保留段落之间的节奏，读起来会更舒服。\n"
  },
  {
    "id": "zhishen-shinei-notes",
    "title": "《置身事内》读书笔记",
    "date": "2026-09-20",
    "category": "读书",
    "tags": [
      "读书",
      "经济"
    ],
    "cover": "radial-gradient(circle at 30% 30%, #a7f3d0, transparent 55%), radial-gradient(circle at 75% 75%, #93c5fd, transparent 55%), linear-gradient(135deg, #d1fae5, #dbeafe)",
    "emoji": "📚",
    "excerpt": "用最朴素的语言讲清楚地方财政与经济发展，读完对身边的城市多了一层理解。",
    "featured": false,
    "body": "\n用最朴素的语言讲清楚地方财政与经济发展，读完对身边的城市多了一层理解。\n\n> 读懂一座城市，先读懂它的钱从哪里来、花到哪里去。\n\n这里是正文的占位段落。真正动笔之前，我习惯先把想说的话列成几条，再慢慢把它们连成一段完整的叙述，让读者能顺着思路一路读下去。\n\n写作的过程也是整理自己的过程。很多当时觉得理所当然的细节，落到纸面上才发现还有不少值得推敲的地方，于是删删改改，留下最想分享的部分。\n\n如果你也有类似的经历或想法，欢迎通过页面上的邮箱联系我。替换这段文字时，保留段落之间的节奏，读起来会更舒服。\n"
  },
  {
    "id": "css-glassmorphism",
    "title": "用纯 CSS 实现磨砂玻璃效果",
    "date": "2026-09-12",
    "category": "编程",
    "tags": [
      "编程",
      "CSS",
      "设计"
    ],
    "cover": "radial-gradient(circle at 20% 70%, #a5b4fc, transparent 55%), radial-gradient(circle at 80% 25%, #67e8f9, transparent 50%), linear-gradient(135deg, #e0e7ff, #cffafe)",
    "emoji": "💻",
    "excerpt": "backdrop-filter、半透明背景与细边框，三步做出 iOS 风格的玻璃卡片。",
    "featured": false,
    "body": "\nbackdrop-filter、半透明背景与细边框，三步做出 iOS 风格的玻璃卡片。\n\n## 三个关键步骤\n\n1. **半透明背景**：用 `rgba()` 让背后的色彩透出来。\n2. **背景模糊**：`backdrop-filter: blur(12px)` 是玻璃感的灵魂。\n3. **细边框与阴影**：一圈浅色描边，让卡片从背景里“浮”起来。\n\n### 示例代码\n\n~~~css\n.glass {\n  background: rgba(255, 255, 255, 0.42);\n  -webkit-backdrop-filter: blur(12px) saturate(160%);\n  backdrop-filter: blur(12px) saturate(160%);\n  border: 1px solid rgba(255, 255, 255, 0.65);\n  border-radius: 24px;\n}\n~~~\n\n### 性能提示\n\n- 模糊半径越大越耗性能，*12px* 左右在手机上就很顺滑\n- 动画只改 `transform` 和 `opacity`\n- 给卡片加上 `contain: paint`，减少重绘范围\n\n> 玻璃效果需要“有东西可透”：背后放几团柔和的渐变色，效果立刻就出来了。\n\n---\n\n想了解更多，可以查阅 [MDN 上的 backdrop-filter 文档](https://developer.mozilla.org/zh-CN/docs/Web/CSS/backdrop-filter)。\n\n这里是正文的占位段落。真正动笔之前，我习惯先把想说的话列成几条，再慢慢把它们连成一段完整的叙述，让读者能顺着思路一路读下去。\n\n写作的过程也是整理自己的过程。很多当时觉得理所当然的细节，落到纸面上才发现还有不少值得推敲的地方，于是删删改改，留下最想分享的部分。\n\n如果你也有类似的经历或想法，欢迎通过页面上的邮箱联系我。替换这段文字时，保留段落之间的节奏，读起来会更舒服。\n"
  },
  {
    "id": "phone-night-photography",
    "title": "手机也能拍好城市夜景",
    "date": "2026-09-03",
    "category": "摄影",
    "tags": [
      "摄影",
      "城市"
    ],
    "cover": "radial-gradient(circle at 70% 30%, #818cf8, transparent 55%), radial-gradient(circle at 25% 80%, #f0abfc, transparent 55%), linear-gradient(135deg, #312e81, #6d28d9)",
    "emoji": "📷",
    "excerpt": "稳住机身、压低曝光、找好前景，分享几张最近在街头拍下的夜色。",
    "featured": false,
    "body": "\n稳住机身、压低曝光、找好前景，分享几张最近在街头拍下的夜色。\n\n## 三个要点\n\n- **稳住机身**：靠墙、架在栏杆上，或者用一个迷你三脚架\n- **压低曝光**：点一下高光处再往下拖，保留灯光的细节\n- **找好前景**：水面倒影、路牌、行人，让画面有层次\n\n这里是正文的占位段落。真正动笔之前，我习惯先把想说的话列成几条，再慢慢把它们连成一段完整的叙述，让读者能顺着思路一路读下去。\n\n写作的过程也是整理自己的过程。很多当时觉得理所当然的细节，落到纸面上才发现还有不少值得推敲的地方，于是删删改改，留下最想分享的部分。\n\n如果你也有类似的经历或想法，欢迎通过页面上的邮箱联系我。替换这段文字时，保留段落之间的节奏，读起来会更舒服。\n"
  },
  {
    "id": "coding-playlist",
    "title": "写代码时循环播放的歌单",
    "date": "2026-08-25",
    "category": "音乐",
    "tags": [
      "音乐",
      "Lo-fi"
    ],
    "cover": "radial-gradient(circle at 30% 30%, #f9a8d4, transparent 55%), radial-gradient(circle at 75% 70%, #c4b5fd, transparent 55%), linear-gradient(135deg, #fce7f3, #ede9fe)",
    "emoji": "🎧",
    "excerpt": "后摇、Lo-fi 和一些没有歌词的钢琴曲，帮我进入心流的十二首歌。",
    "featured": false,
    "body": "\n后摇、Lo-fi 和一些没有歌词的钢琴曲，帮我进入心流的十二首歌。\n\n## 挑歌的标准\n\n1. 没有歌词，或者歌词听不懂\n2. 节奏平稳，不会突然变响\n3. 循环一小时也不会腻\n\n这里是正文的占位段落。真正动笔之前，我习惯先把想说的话列成几条，再慢慢把它们连成一段完整的叙述，让读者能顺着思路一路读下去。\n\n写作的过程也是整理自己的过程。很多当时觉得理所当然的细节，落到纸面上才发现还有不少值得推敲的地方，于是删删改改，留下最想分享的部分。\n\n如果你也有类似的经历或想法，欢迎通过页面上的邮箱联系我。替换这段文字时，保留段落之间的节奏，读起来会更舒服。\n"
  },
  {
    "id": "small-things-before-thirty",
    "title": "三十岁前想明白的几件小事",
    "date": "2026-08-16",
    "category": "随笔",
    "tags": [
      "随笔",
      "生活方式"
    ],
    "cover": "radial-gradient(circle at 25% 30%, #bbf7d0, transparent 55%), radial-gradient(circle at 80% 75%, #fde68a, transparent 55%), linear-gradient(135deg, #dcfce7, #fef9c3)",
    "emoji": "🌿",
    "excerpt": "关于时间、关系和选择，写给未来的自己，也写给正在犹豫的你。",
    "featured": false,
    "body": "\n关于时间、关系和选择，写给未来的自己，也写给正在犹豫的你。\n\n> 慢一点没关系，方向对就好。\n\n这里是正文的占位段落。真正动笔之前，我习惯先把想说的话列成几条，再慢慢把它们连成一段完整的叙述，让读者能顺着思路一路读下去。\n\n写作的过程也是整理自己的过程。很多当时觉得理所当然的细节，落到纸面上才发现还有不少值得推敲的地方，于是删删改改，留下最想分享的部分。\n\n如果你也有类似的经历或想法，欢迎通过页面上的邮箱联系我。替换这段文字时，保留段落之间的节奏，读起来会更舒服。\n"
  }
];

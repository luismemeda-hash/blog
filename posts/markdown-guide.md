---
title: 博客写作指南：Markdown 语法速查
date: 2026-10-05
category: 编程
tags: [写作, Markdown, 编程]
cover: aurora
emoji: ✍️
excerpt: 表格、任务清单、代码高亮、目录、图片放大……这篇文章把博客支持的 Markdown 写法都演示一遍，写新文章时可以随时回来翻。
featured: false
---

这是一篇示例文章，演示博客支持的全部 Markdown 写法。它同时也是一份速查表：写新文章时打开 `posts/markdown-guide.md`，照着抄就行。不需要的话，删掉这个文件再运行 `npm run build` 即可。

## 文字与段落

段落之间空一行。**粗体**、*斜体*、~~删除线~~ 和 `行内代码` 可以混用；[链接](https://developer.mozilla.org/zh-CN/) 会在新标签页打开。

> 引用块里也可以继续使用 **Markdown**。

## 列表

### 嵌套列表

- 旅行
  - 京都：清水寺、哲学之道
  - 大阪：道顿堀
- 读书
  1. 《置身事内》
  2. 《被讨厌的勇气》

### 任务清单

- [x] 把文章拆成独立的 Markdown 文件
- [x] 加上站内搜索
- [ ] 写完京都游记的下篇
- [ ] 给每篇文章配一张封面图

## 表格

冒号控制对齐方式：`:---` 左对齐，`:---:` 居中，`---:` 右对齐。

| 功能 | 写法 | 对齐示例 |
| :--- | :---: | ---: |
| 粗体 | `**文字**` | 1 |
| 删除线 | `~~文字~~` | 22 |
| 任务 | `- [ ] 待办` | 333 |

## 代码高亮

代码块写上语言名就会自动高亮，右上角的按钮可以一键复制。支持 js / ts、python、html、css、bash、json。

```js
// 计算阅读时长：中文约 400 字 / 分钟
function readingTime(text) {
  const cjk = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  return Math.max(1, Math.ceil(cjk / 400));
}
console.log(`约 ${readingTime("你好")} 分钟`);
```

```python
from pathlib import Path

def count_posts(folder: str = "posts") -> int:
    """统计文章数量（跳过下划线开头的模板）"""
    return sum(1 for p in Path(folder).glob("*.md") if not p.name.startswith("_"))

print(f"共有 {count_posts()} 篇文章")
```

```bash
# 新建文章、构建、推送
npm run new -- 京都游记 --slug kyoto-2
npm run build && git add . && git commit -m "新文章" && git push
```

```json
{
  "scripts": { "build": "node scripts/build-posts.mjs" },
  "private": true
}
```

## 图片

点击图片可以放大查看，再点一下、按 Esc 或向下轻扫即可关闭。

![磨砂玻璃卡片示意图](images/glass-card.svg)

## 目录与锚点

文章里有三个及以上的二级 / 三级标题时，会自动生成目录：宽屏显示在右侧，窄屏折叠在正文顶部。鼠标移到标题上会出现 `#`，点击即可得到这一小节的链接。

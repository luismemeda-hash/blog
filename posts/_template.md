---
# 新文章模板：npm run new -- 标题 会复制这个文件并自动填好 title 和 date。
# 以下划线开头的文件不会被构建。以 # 开头的行是注释，可以删掉。
title: 新文章标题
date: 2026-01-01
category: 随笔
tags: [随笔]
# 封面：预设名 aurora / sunset / mint / ice / night / blossom / meadow，
#       或 CSS 渐变，或图片路径如 images/cover.jpg
cover: aurora
emoji: 📝
excerpt: 一两句话的摘要，会显示在首页卡片和搜索结果里。
featured: false
---

开头第一段，简单交代这篇文章想说什么。

## 第一个小标题

正文用 Markdown 书写。三个及以上的二级 / 三级标题会自动生成目录。

- 列表项
- [ ] 待办事项
- [x] 已完成事项

## 第二个小标题

~~~js
console.log("代码块会自动高亮，右上角有复制按钮");
~~~

## 结尾

写完后运行 npm run build，或直接推送到 GitHub 自动构建。

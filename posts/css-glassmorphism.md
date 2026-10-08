---
title: 用纯 CSS 实现磨砂玻璃效果
date: 2026-09-12
category: 编程
tags: [编程, CSS, 设计]
cover: ice
emoji: 💻
excerpt: backdrop-filter、半透明背景与细边框，三步做出 iOS 风格的玻璃卡片。
featured: false
---

backdrop-filter、半透明背景与细边框，三步做出 iOS 风格的玻璃卡片。

## 三个关键步骤

1. **半透明背景**：用 `rgba()` 让背后的色彩透出来。
2. **背景模糊**：`backdrop-filter: blur(12px)` 是玻璃感的灵魂。
3. **细边框与阴影**：一圈浅色描边，让卡片从背景里“浮”起来。

### 示例代码

~~~css
.glass {
  background: rgba(255, 255, 255, 0.42);
  -webkit-backdrop-filter: blur(12px) saturate(160%);
  backdrop-filter: blur(12px) saturate(160%);
  border: 1px solid rgba(255, 255, 255, 0.65);
  border-radius: 24px;
}
~~~

### 性能提示

- 模糊半径越大越耗性能，*12px* 左右在手机上就很顺滑
- 动画只改 `transform` 和 `opacity`
- 给卡片加上 `contain: paint`，减少重绘范围

> 玻璃效果需要“有东西可透”：背后放几团柔和的渐变色，效果立刻就出来了。

---

想了解更多，可以查阅 [MDN 上的 backdrop-filter 文档](https://developer.mozilla.org/zh-CN/docs/Web/CSS/backdrop-filter)。

这里是正文的占位段落。真正动笔之前，我习惯先把想说的话列成几条，再慢慢把它们连成一段完整的叙述，让读者能顺着思路一路读下去。

写作的过程也是整理自己的过程。很多当时觉得理所当然的细节，落到纸面上才发现还有不少值得推敲的地方，于是删删改改，留下最想分享的部分。

如果你也有类似的经历或想法，欢迎通过页面上的邮箱联系我。替换这段文字时，保留段落之间的节奏，读起来会更舒服。

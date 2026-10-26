/*
 * ============================================================
 *  site.js · 站点信息与封面预设（手动编辑这个文件）
 * ============================================================
 *  - window.SITE   站点名、作者、简介、社交链接、关于我、页脚
 *  - window.COVERS 封面渐变预设。文章 front matter 里写 `cover: aurora`
 *                  这样的预设名，构建时会替换成对应的渐变。
 *
 *  文章不在这里：每篇文章是 posts/ 目录下的一个 .md 文件，
 *  运行 `npm run build`（或 node scripts/build-posts.mjs）生成 js/posts.js。
 *  index.html 中 site.js 必须在 posts.js 之前加载。
 * ============================================================
 */

/* ---------------- 站点信息 ---------------- */
window.SITE = {
  name: "陛下的小站",              // 站点名称：导航、标题栏、页脚
  title: "陛下的小站 · 个人博客",   // 浏览器标签页标题
  author: "Luis",                   // 首页大标题（作者名）
  bio: "记录生活、技术与灵感",       // 一句话简介
  avatar: "L",                      // 头像：一个字（首字母），或图片路径如 'images/avatar.jpg'
  social: [
    // icon 可选：github / weibo / email / twitter / link
    { name: "GitHub", url: "https://github.com/luismemeda-hash", icon: "github" }
    // 需要时取消注释并填上真实地址：
    // { name: "微博", url: "https://weibo.com/你的ID", icon: "weibo" },
    // { name: "邮箱", url: "mailto:you@example.com", icon: "email" }
  ],
  about: "你好，我是 Luis，一名喜欢写代码也喜欢四处走走的普通人。这里记录我的旅行见闻、读过的书和做过的小项目，欢迎常来坐坐。",
  footer: "© 2026 陛下的小站 · 由 Hark 构建"
};

/* ---------------- 封面渐变预设：front matter 中写 cover: aurora 即可使用 ---------------- */
window.COVERS = {
  aurora: "radial-gradient(circle at 20% 30%, #c4b5fd, transparent 55%), radial-gradient(circle at 80% 20%, #fdba74, transparent 50%), radial-gradient(circle at 60% 90%, #67e8f9, transparent 55%), linear-gradient(135deg, #e9d5ff, #bae6fd)",
  sunset: "radial-gradient(circle at 25% 35%, #fca5a5, transparent 55%), radial-gradient(circle at 80% 70%, #fde68a, transparent 55%), linear-gradient(135deg, #fecaca, #fef3c7)",
  mint: "radial-gradient(circle at 30% 30%, #a7f3d0, transparent 55%), radial-gradient(circle at 75% 75%, #93c5fd, transparent 55%), linear-gradient(135deg, #d1fae5, #dbeafe)",
  ice: "radial-gradient(circle at 20% 70%, #a5b4fc, transparent 55%), radial-gradient(circle at 80% 25%, #67e8f9, transparent 50%), linear-gradient(135deg, #e0e7ff, #cffafe)",
  night: "radial-gradient(circle at 70% 30%, #818cf8, transparent 55%), radial-gradient(circle at 25% 80%, #f0abfc, transparent 55%), linear-gradient(135deg, #312e81, #6d28d9)",
  blossom: "radial-gradient(circle at 30% 30%, #f9a8d4, transparent 55%), radial-gradient(circle at 75% 70%, #c4b5fd, transparent 55%), linear-gradient(135deg, #fce7f3, #ede9fe)",
  meadow: "radial-gradient(circle at 25% 30%, #bbf7d0, transparent 55%), radial-gradient(circle at 80% 75%, #fde68a, transparent 55%), linear-gradient(135deg, #dcfce7, #fef9c3)"
};

/* 兼容旧写法：允许在其他脚本中直接使用 COVERS.aurora */
var COVERS = window.COVERS;

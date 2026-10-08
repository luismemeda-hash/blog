/*
 * app.js · 渲染、导航、阅读器、目录、搜索、灯箱与动画
 * 一般不需要修改。站点信息在 js/site.js，文章在 posts/*.md（构建后生成 js/posts.js）。
 */
(function () {
  "use strict";

  var SITE = window.SITE || {};
  var POSTS = (window.POSTS || []).slice();
  var MD = window.Markdown || {};
  var renderMarkdown = window.renderMarkdown;
  var readingTime = window.readingTime;
  var COVERS = window.COVERS || {};
  var doc = document, root = doc.documentElement;

  function mq(q) { return window.matchMedia ? window.matchMedia(q) : { matches: false, addEventListener: function () {} }; }
  function onMq(m, fn) { if (m.addEventListener) m.addEventListener("change", fn); else if (m.addListener) m.addListener(fn); }
  var mqReduce = mq("(prefers-reduced-motion: reduce)");
  var mqDark = mq("(prefers-color-scheme: dark)");
  var mqWide = mq("(min-width: 980px)");

  function $(id) { return doc.getElementById(id); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function enc(s) { return encodeURIComponent(s); }
  function postHref(p) { return "#post/" + enc(p.id); }
  function coverCss(c) {
    if (!c) return "";
    if (Object.prototype.hasOwnProperty.call(COVERS, c)) return COVERS[c]; // 预设名，如 "aurora"
    if (/gradient\(/i.test(c)) return c;
    return 'url("' + String(c).replace(/"/g, "%22") + '") center / cover no-repeat';
  }

  // ======================================================
  // 1. 数据整理
  // ======================================================
  POSTS.forEach(function (p, i) {
    p._i = i;
    p.tags = p.tags || [];
    p.minutes = readingTime ? readingTime(p.body) : 1;
  });
  var sorted = POSTS.slice().sort(function (a, b) {
    return a.date < b.date ? 1 : a.date > b.date ? -1 : a._i - b._i;
  });
  var byId = {};
  sorted.forEach(function (p) { byId[p.id] = p; });
  var featured = sorted.filter(function (p) { return p.featured; })[0] || sorted[0];

  // ======================================================
  // 2. 渲染（全部由 SITE / POSTS 生成）
  // ======================================================
  var ICONS = {
    github: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .5a11.5 11.5 0 0 0-3.6 22.4c.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2a11 11 0 0 1 5.8 0c2.2-1.5 3.2-1.2 3.2-1.2.6 1.6.2 2.8.1 3.1.8.8 1.2 1.9 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.2c0 .3.2.7.8.6A11.5 11.5 0 0 0 12 .5z"/></svg>',
    weibo: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M10.1 19.6c-4 .4-7.4-1.4-7.7-4-.3-2.6 2.7-5 6.7-5.4 4-.4 7.4 1.4 7.7 4 .3 2.6-2.7 5-6.7 5.4zM20 9.4c-.1-.6.3-1.1.9-1.2.5-.1 1.1.3 1.2.9.4 2.2-.4 4-.4 4-.2.5-.8.8-1.3.6-.5-.2-.8-.8-.6-1.3 0 0 .5-1.3.2-3zM17 4.1c3.5.7 5.6 4 4.9 7.5-.1.5-.6.8-1.1.7-.5-.1-.8-.6-.7-1.1.5-2.5-1-4.9-3.5-5.4-.5-.1-.8-.6-.7-1.1.1-.5.6-.8 1.1-.6zM9.3 13.3c-1.6.3-2.7 1.6-2.4 2.9.3 1.3 1.8 2 3.4 1.7 1.6-.3 2.7-1.6 2.4-2.9-.3-1.3-1.8-2-3.4-1.7zm6.9-4.7c-.8-.2-.4-.6-.4-.6s.8-1.3-.2-2.2c-1.2-1.2-4.1.1-4.1.1-1.1.4-.8-.2-.7-.8 0-.8-.3-2.1-2.5-1.3C6 4.5 3.8 7.6 3.8 7.6 2.5 9.3 2.6 10.6 2.6 10.6c.3 2.9 3.4 3.7 5.8 3.9 2.5.2 5.9-.9 6.9-3.1 1-2.2-.3-2.8-1.1-2.8z"/></svg>',
    email: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="m3 7 9 6 9-6"/></svg>',
    twitter: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.8 3h3.1l-6.8 7.7 8 10.3h-6.3l-4.9-6.4L5.3 21H2.2l7.2-8.3L1.8 3h6.4l4.4 5.9L17.8 3zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5z"/></svg>',
    link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.1 0l3-3a5 5 0 0 0-7.1-7.1l-1.1 1.1"/><path d="M14 11a5 5 0 0 0-7.1 0l-3 3a5 5 0 0 0 7.1 7.1l1.1-1.1"/></svg>'
  };

  function tagsHtml(tags) {
    return '<ul class="x-tags">' + tags.map(function (t) { return '<li><span class="x-pill">' + esc(t) + "</span></li>"; }).join("") + "</ul>";
  }
  function metaHtml(p) {
    return '<p class="x-meta"><time datetime="' + esc(p.date) + '">' + esc(p.date) + "</time><span>" + p.minutes + " 分钟阅读</span></p>";
  }

  function renderSite() {
    doc.title = SITE.title || SITE.name || doc.title;
    $("x-brand").textContent = SITE.name || "";

    var av = SITE.avatar || (SITE.author || "?").charAt(0);
    var isImg = /[./]/.test(av) && av.length > 2;
    $("x-hero").innerHTML =
      '<div class="x-avatar" aria-hidden="true"' + (isImg ? ' style="background-image:url(&quot;' + esc(av.replace(/"/g, "%22")) + '&quot;)"' : "") + ">" + (isImg ? "" : esc(av)) + "</div>" +
      "<h1>" + esc(SITE.author || SITE.name || "") + "</h1>" +
      '<p class="x-bio">' + esc(SITE.bio || "") + "</p>" +
      '<ul class="x-tags" aria-label="社交链接">' + (SITE.social || []).map(function (s) {
        var ext = /^https?:/i.test(s.url || "");
        return '<li><a class="x-pill x-pill--btn" href="' + esc(s.url || "#") + '"' + (ext ? ' target="_blank" rel="noopener noreferrer"' : "") + ">" + (ICONS[s.icon] || ICONS.link) + esc(s.name) + "</a></li>";
      }).join("") + "</ul>";

    $("x-about").textContent = SITE.about || "";
    $("x-foot").textContent = SITE.footer || "";
  }

  function renderFeatured() {
    var p = featured, el = $("x-featured");
    if (!p) { el.innerHTML = '<p class="x-empty x-glass">还没有文章，在 posts/ 目录里写第一篇，然后运行 npm run build。</p>'; return; }
    el.innerHTML =
      '<a class="x-featured x-glass x-card" href="' + postHref(p) + '">' +
      '<div class="x-cover" style="background:' + esc(coverCss(p.cover)) + '"><span class="x-pill">✨ 精选</span></div>' +
      '<div class="x-featured__body">' + metaHtml(p) + "<h3>" + esc(p.title) + "</h3>" +
      '<p class="x-excerpt">' + esc(p.excerpt) + "</p>" + tagsHtml(p.tags) +
      '<span class="x-more">阅读全文 →</span></div></a>';
  }

  function renderGrid() {
    // 最新文章：按日期倒序，精选那篇已在上方展示，这里不重复
    var list = sorted.filter(function (p) { return p !== featured; });
    $("x-grid").innerHTML = list.length ? list.map(function (p) {
      return '<a class="x-post x-glass x-card" href="' + postHref(p) + '">' +
        '<div class="x-post__top"><span class="x-pill">' + esc(p.category || "未分类") + "</span>" +
        (p.emoji ? '<span class="x-emoji" aria-hidden="true">' + esc(p.emoji) + "</span>" : "") + "</div>" +
        "<h3>" + esc(p.title) + "</h3>" +
        '<p class="x-excerpt">' + esc(p.excerpt) + "</p>" +
        '<p class="x-meta"><time datetime="' + esc(p.date) + '">' + esc(p.date) + "</time><span>" + p.minutes + " 分钟阅读</span></p>" +
        '<span class="x-more">阅读全文 →</span></a>';
    }).join("") : '<p class="x-empty x-glass">暂时没有更多文章。</p>';
  }

  function arcItems(list) {
    return '<ul class="x-arc-list">' + list.map(function (p) {
      return '<li><a href="' + postHref(p) + '"><time datetime="' + esc(p.date) + '">' + esc(p.date.slice(5)) + "</time>" +
        '<span class="x-arc-t">' + esc(p.title) + "</span>" +
        '<span class="x-pill">' + esc(p.category || "未分类") + "</span></a></li>";
    }).join("") + "</ul>";
  }

  function renderArchive() {
    var years = [], ym = {};
    sorted.forEach(function (p) {
      var y = p.date.slice(0, 4), m = p.date.slice(5, 7);
      if (!ym[y]) { ym[y] = { months: [], map: {}, n: 0 }; years.push(y); }
      var Y = ym[y];
      if (!Y.map[m]) { Y.map[m] = []; Y.months.push(m); }
      Y.map[m].push(p); Y.n++;
    });
    $("x-archive").innerHTML = years.length ? years.map(function (y) {
      var Y = ym[y];
      return '<section class="x-arc-year" aria-label="' + y + ' 年"><h3 class="x-arc-y"><span>' + y + '</span><span class="x-count">' + Y.n + " 篇</span></h3>" +
        Y.months.map(function (m) {
          return '<div class="x-arc-month"><h4 class="x-arc-m">' + parseInt(m, 10) + " 月</h4>" + arcItems(Y.map[m]) + "</div>";
        }).join("") + "</section>";
    }).join("") : '<p class="x-empty">还没有文章。</p>';
  }

  function countBy(fn) {
    var order = [], map = {};
    sorted.forEach(function (p) {
      [].concat(fn(p)).forEach(function (k) {
        if (!k) return;
        if (!map[k]) { map[k] = 0; order.push(k); }
        map[k]++;
      });
    });
    return order.map(function (k) { return { name: k, n: map[k] }; });
  }

  function renderWidgets() {
    $("x-cats").innerHTML = countBy(function (p) { return p.category || "未分类"; }).map(function (c) {
      return '<li><a href="#category/' + enc(c.name) + '">' + esc(c.name) + ' <span class="x-count">' + c.n + "</span></a></li>";
    }).join("");
    var tags = countBy(function (p) { return p.tags; });
    var max = Math.max.apply(null, tags.map(function (t) { return t.n; }).concat(1));
    $("x-cloud").innerHTML = tags.map(function (t, i) {
      // 文章越多字越大；数量相同时按位置错落，让标签云更有节奏
      var tier = Math.min(3, [2, 1, 2, 3, 1, 2][i % 6] + (max > 1 && t.n === max ? 1 : 0));
      return '<li><a class="x-pill x-t' + tier + '" href="#tag/' + enc(t.name) + '" title="' + t.n + ' 篇">' + esc(t.name) + "</a></li>";
    }).join("");
  }

  renderSite();
  renderFeatured();
  renderGrid();
  renderArchive();
  renderWidgets();

  // ======================================================
  // 3. 主题（只保存在内存中，刷新后跟随系统）
  // ======================================================
  var toggle = $("x-toggle");
  var themeChoice = null;
  function isDark() { return themeChoice ? themeChoice === "dark" : mqDark.matches; }
  function applyTheme() {
    if (themeChoice) root.setAttribute("data-theme", themeChoice); else root.removeAttribute("data-theme");
    root.classList.toggle("x-is-dark", isDark());
    toggle.setAttribute("aria-label", isDark() ? "切换浅色模式" : "切换深色模式");
  }
  toggle.addEventListener("click", function () { themeChoice = isDark() ? "light" : "dark"; applyTheme(); });
  onMq(mqDark, applyTheme);
  applyTheme();

  // 订阅框：模板演示，仅显示提示，不提交数据
  $("x-sub").addEventListener("submit", function (e) {
    e.preventDefault();
    var email = $("x-email").value.trim();
    $("x-sub-msg").textContent = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ? "感谢订阅！（模板演示，尚未接入邮件服务）"
      : "请输入有效的邮箱地址。";
  });

  // 页面不可见时暂停背景色团
  function onVis() { root.classList.toggle("x-paused", !!doc.hidden); }
  doc.addEventListener("visibilitychange", onVis);
  onVis();

  // ======================================================
  // 4. 导航：收起 / 展开
  //    两种状态预先算好位置（尺寸只在 resize / 字体加载时测量）：
  //    链接与指示器的位移写入 CSS 变量，玻璃背景是两块预先布局的胶囊。
  //    切换时只改一个 class，由 CSS 过渡 transform / opacity（可随时被打断并平滑反向）。
  // ======================================================
  var nav = $("x-nav");
  var ind = nav.querySelector(".x-ind");
  var brand = $("x-brand");
  var links = [].slice.call(nav.querySelectorAll(".x-links a"));
  var GAP = 2, PAD = 4;
  var geo = null, compact = false, active = 0;

  function offsetIn(el) {
    var x = 0, y = 0;
    while (el && el !== nav) { x += el.offsetLeft; y += el.offsetTop; el = el.offsetParent; }
    return { x: x, y: y };
  }
  function px(n) { return Math.round(n * 100) / 100 + "px"; }
  function placeInd() {
    if (!geo) return;
    var l = geo.L[active];
    ind.style.width = px(l.w);
    ind.style.height = px(l.h);
    ind.style.setProperty("--ix", px(l.x));
    ind.style.setProperty("--iy", px(l.y));
    ind.style.setProperty("--icx", px(l.cx));
    ind.style.setProperty("--icy", px(l.cy));
    ind.classList.add("x-on");
  }
  // offsetLeft/offsetTop 不受 transform 影响，所以收起状态下也能测到展开布局
  function measure() {
    var W = nav.offsetWidth, H = nav.offsetHeight;
    if (!W) return;
    var L = links.map(function (a) { var o = offsetIn(a); return { x: o.x, y: o.y, w: a.offsetWidth, h: a.offsetHeight }; });
    var total = L.reduce(function (s, l) { return s + l.w; }, 0) + GAP * (L.length - 1);
    var sig = W + "|" + H + "|" + L.map(function (l) { return l.x + "," + l.y + "," + l.w + "," + l.h; }).join(";");
    if (geo && geo.sig === sig) return; // 尺寸没变就不打断正在进行的过渡
    var Wc = total + PAD * 2, cx = (W - total) / 2;
    L.forEach(function (l) { l.cx = cx; l.cy = PAD; cx += l.w + GAP; });
    geo = { W: W, H: H, L: L, sig: sig };
    nav.classList.add("x-snap");
    var last = L[L.length - 1];
    nav.style.setProperty("--wc", px(Wc));
    nav.style.setProperty("--cbx", px((L[0].x + last.x + last.w) / 2 - W / 2));
    nav.style.setProperty("--cby", px(L[0].y - PAD));
    links.forEach(function (a, i) {
      a.style.setProperty("--lx", px(L[i].cx - L[i].x));
      a.style.setProperty("--ly", px(L[i].cy - L[i].y));
    });
    placeInd();
    void nav.offsetWidth; // 提交无过渡的新位置
    requestAnimationFrame(function () { nav.classList.remove("x-snap"); });
  }
  function setCompact(on) {
    if (compact === on) return;
    compact = on;
    nav.classList.toggle("x-compact", on);
  }
  function setActive(i) {
    active = i;
    links.forEach(function (a, k) { if (k === i) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
    placeInd();
  }

  // 键盘聚焦导航时展开，并在焦点留在导航内时保持展开
  var kbdInNav = false;
  nav.addEventListener("focusin", function (e) {
    var fv = true;
    try { fv = e.target.matches(":focus-visible"); } catch (err) { /* 旧浏览器 */ }
    if (fv) { kbdInNav = true; setCompact(false); }
  });
  nav.addEventListener("focusout", function (e) { if (!nav.contains(e.relatedTarget)) kbdInNav = false; });

  // ======================================================
  // 5. 滚动：被动监听 + rAF 节流，循环内不读取布局
  // ======================================================
  var sideEl = $("x-side");
  var wrap = $("x-wrap");
  var spyEls = [$("top"), $("posts"), $("archive"), $("about")];
  var lastY = window.pageYOffset || 0, ticking = false;
  var vh = window.innerHeight, docH = root.scrollHeight, atBottom = false;
  var navLock = false, lockT = null, holdAbout = false, holdY = 0;
  var inBand = [false, false, false, false];
  var openKind = null;
  var navOffset = 76;
  var mainY = lastY;

  function readNavOffset() {
    var v = parseFloat(getComputedStyle(spyEls[1]).scrollMarginTop);
    if (v > 0) navOffset = v;
  }
  function spy() {
    if (openKind || navLock) return;
    var i = -1;
    if (holdAbout) i = 3;
    else {
      for (var k = 0; k < 4; k++) {
        if (k === 3 && mqWide.matches) continue; // 宽屏：关于我在吸顶侧栏中，常驻可见，不参与自动高亮
        if (inBand[k]) i = k;
      }
      if (!mqWide.matches && atBottom) i = 3;
    }
    if (i >= 0 && i !== active) setActive(i);
  }
  function update() {
    ticking = false;
    var y = Math.max(window.pageYOffset || 0, 0);
    atBottom = y + vh >= docH - 4;
    mainY = y;
    if (openKind) return;
    refreshTopBtn();
    if (navLock) { lastY = y; return; }
    if (y <= 24) { setCompact(false); lastY = y; }
    else if (y - lastY > 8) { if (!kbdInNav) setCompact(true); lastY = y; }
    else if (lastY - y > 8) { setCompact(false); lastY = y; }
    if (holdAbout && Math.abs(y - holdY) > 160) holdAbout = false;
    spy();
  }
  function unlock() {
    clearTimeout(lockT);
    if (!navLock) return;
    navLock = false;
    lastY = holdY = window.pageYOffset || 0;
    spy();
  }
  window.addEventListener("scroll", function () {
    if (navLock) { clearTimeout(lockT); lockT = setTimeout(unlock, 140); }
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  if ("onscrollend" in window) window.addEventListener("scrollend", function () { if (navLock) unlock(); });

  // 滚动监听：一条位于导航下方的检测带
  if ("IntersectionObserver" in window) {
    readNavOffset();
    var spyIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { inBand[+en.target.getAttribute("data-spy")] = en.isIntersecting; });
      spy();
    }, { rootMargin: "-" + Math.max(0, navOffset - 4) + "px 0px -60% 0px", threshold: 0 });
    spyEls.forEach(function (el) { spyIO.observe(el); });
  }

  // 宽屏吸顶侧栏：侧栏比视口高时改为“底部对齐吸顶”，保证每个小组件都能看到
  function fitSide() {
    if (!mqWide.matches) { sideEl.style.top = ""; return; }
    sideEl.style.top = Math.min(navOffset, vh - sideEl.offsetHeight - 16) + "px";
  }

  // 底部留白：保证最后一个导航目标（宽屏是“归档”，窄屏是“关于我”）也能滚到导航下方的准确位置
  var spacer = 0;
  function fitSpacer() {
    var target = mqWide.matches ? spyEls[2] : spyEls[3];
    var top = 0, el = target;
    while (el) { top += el.offsetTop; el = el.offsetParent; } // offsetTop 不受 reveal 位移影响
    var base = root.scrollHeight - spacer;
    var need = Math.max(0, Math.ceil(top - navOffset + vh - base));
    if (need !== spacer) { spacer = need; wrap.style.paddingBottom = need ? "calc(40px + " + need + "px)" : ""; docH = root.scrollHeight; }
  }

  function smooth() { return mqReduce.matches ? "auto" : "smooth"; }
  function goSection(i) {
    if (openKind) return;
    setActive(i);
    holdAbout = false;
    navLock = true;
    clearTimeout(lockT);
    lockT = setTimeout(unlock, 400); // 若无需滚动，稍后解锁
    var el = spyEls[i];
    if (i === 0) { setCompact(false); window.scrollTo({ top: 0, behavior: smooth() }); return; }
    if (!kbdInNav) setCompact(true);
    if (i === 3 && mqWide.matches) {
      // 侧栏吸顶：只滚到“关于我”完整可见为止
      holdAbout = true;
      var r = el.getBoundingClientRect(), y = window.pageYOffset, delta = 0;
      if (r.top < navOffset) delta = r.top - navOffset;
      else if (r.bottom > vh - 16) delta = Math.min(r.bottom - vh + 16, r.top - navOffset);
      if (delta) window.scrollTo({ top: Math.max(0, y + delta), behavior: smooth() });
      return;
    }
    if (el.scrollIntoView) el.scrollIntoView({ behavior: smooth(), block: "start" });
  }
  links.forEach(function (a, i) {
    a.addEventListener("click", function (e) { e.preventDefault(); goSection(i); });
  });
  brand.addEventListener("click", function (e) { e.preventDefault(); goSection(0); });

  function onResize() {
    vh = window.innerHeight;
    docH = root.scrollHeight;
    readNavOffset();
    measure();
    fitSide();
    fitSpacer();
  }
  window.addEventListener("resize", onResize);
  onMq(mqWide, function () { fitSide(); fitSpacer(); holdAbout = false; spy(); });
  if ("ResizeObserver" in window) {
    var roNav = new ResizeObserver(function () { measure(); });
    roNav.observe(nav);
    links.forEach(function (a) { roNav.observe(a); });
    var roRaf = 0;
    var roPage = new ResizeObserver(function () {
      if (roRaf) return;
      roRaf = requestAnimationFrame(function () { roRaf = 0; docH = root.scrollHeight; fitSide(); fitSpacer(); });
    });
    roPage.observe(doc.body);
    roPage.observe(sideEl);
  }
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(onResize);
  window.addEventListener("load", onResize);

  // ======================================================
  // 6. 卡片进入视口：只播放一次，60ms 错落
  // ======================================================
  if (!mqReduce.matches && "IntersectionObserver" in window) {
    var revealEls = [].slice.call(doc.querySelectorAll(".x-card, .x-widget, .x-archive"));
    revealEls.forEach(function (el) { el.classList.add("x-reveal"); });
    var revealIO = new IntersectionObserver(function (entries) {
      var batch = entries.filter(function (en) { return en.isIntersecting; });
      batch.forEach(function (en, k) {
        var el = en.target;
        revealIO.unobserve(el);
        el.style.transitionDelay = k * 60 + "ms";
        requestAnimationFrame(function () { el.classList.add("x-in"); });
        setTimeout(function () { el.classList.remove("x-reveal", "x-in"); el.style.transitionDelay = ""; }, 420 + k * 60);
      });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.08 });
    revealEls.forEach(function (el) { revealIO.observe(el); });
  }

  // ======================================================
  // 7. 页内阅读器：#post/<id>[/<小节>]、#category/<名称>、#tag/<名称>
  // ======================================================
  var reader = $("x-reader");
  var panel = $("x-r-panel");
  var tocAside = $("x-toc");
  var progressEl = $("x-progress");
  var topBtn = $("x-totop");
  var savedY = 0, opener = null, hideT = null;
  var curPost = null;
  var toc = null;            // 当前文章目录：{ ids, heads, links, tops, geo, active }
  var rMax = 0, rY = 0, rTicking = false, topOn = false;
  var R_OFFSET = 84;         // 吸顶“返回”栏 + 留白：跳转时标题停在它下方
  var SPY_SLACK = 72;        // 标题进入视口上部（返回栏下方 72px 内）即视为“当前小节”

  function listView(title, list) {
    panel.innerHTML = '<div class="x-r-body"><h1 id="x-r-title">' + esc(title) + "</h1>" +
      '<p class="x-meta"><span>共 ' + list.length + " 篇</span></p>" +
      (list.length ? arcItems(list).replace("x-arc-list", "x-arc-list x-arc-list--reader") : '<p class="x-empty">没有找到相关文章。</p>') + "</div>";
  }
  function setToc(listHtml) {
    tocAside.innerHTML = listHtml ? '<p class="x-toc__title">目录</p><div class="x-toc__wrap"><span class="x-toc__ind" aria-hidden="true"></span>' + listHtml + "</div>" : "";
    tocAside.hidden = !listHtml;
    reader.classList.toggle("x-has-toc", !!listHtml);
  }
  function postView(p) {
    var i = sorted.indexOf(p), newer = sorted[i - 1], older = sorted[i + 1];
    var r = MD.renderPost ? MD.renderPost(p.body) : { html: renderMarkdown(p.body), headings: [] };
    var list = MD.tocHtml ? MD.tocHtml(r.headings, 3) : "";
    panel.innerHTML =
      (p.cover ? '<div class="x-r-cover" style="background:' + esc(coverCss(p.cover)) + '"></div>' : "") +
      '<div class="x-r-body"><h1 id="x-r-title">' + esc(p.title) + "</h1>" +
      '<p class="x-meta"><time datetime="' + esc(p.date) + '">' + esc(p.date) + "</time><span>" + esc(p.category || "") + "</span><span>" + p.minutes + " 分钟阅读</span></p>" +
      tagsHtml(p.tags) +
      (list ? '<details class="x-toc-m"><summary>目录 <span class="x-count">' + r.headings.length + '</span></summary><nav aria-label="文章目录">' + list + "</nav></details>" : "") +
      '<div class="x-md">' + r.html + "</div>" +
      ((older || newer) ? '<nav class="x-r-nav" aria-label="上一篇 / 下一篇">' +
        (older ? '<a href="' + postHref(older) + '"><small>← 上一篇</small>' + esc(older.title) + "</a>" : "") +
        (newer ? '<a class="x-next" href="' + postHref(newer) + '"><small>下一篇 →</small>' + esc(newer.title) + "</a>" : "") +
        "</nav>" : "") + "</div>";
    setToc(list);
    // 正文图片：可点击 / 键盘 Enter 放大
    [].forEach.call(panel.querySelectorAll(".x-md img"), function (img) {
      img.tabIndex = 0;
      img.setAttribute("role", "button");
      img.setAttribute("aria-label", "放大图片" + (img.alt ? "：" + img.alt : ""));
    });
    toc = null;
    if (list) {
      toc = { ids: [], heads: [], links: [], tops: [], geo: [], active: -1 };
      r.headings.forEach(function (h) {
        var sel = '[data-toc="' + h.id + '"]';
        toc.ids.push(h.id);
        toc.heads.push(panel.querySelector('.x-md [id="' + h.id + '"]'));
        toc.links.push([tocAside.querySelector(sel), panel.querySelector(".x-toc-m " + sel)]);
      });
    }
  }

  // ---------- 阅读进度、目录高亮（scroll-spy）、回到顶部 ----------
  // 位置只在渲染 / 尺寸变化时测量；滚动回调里只读 scrollTop
  // 元素在阅读器滚动内容中的位置；用 offsetTop（不受面板入场位移动画影响）
  function topInReader(el) {
    var y = 0, n = el;
    while (n && n !== reader) { y += n.offsetTop; n = n.offsetParent; }
    if (n === reader) return y;
    return el.getBoundingClientRect().top - reader.getBoundingClientRect().top + reader.scrollTop;
  }
  function measureReader() {
    if (!openKind) return;
    rMax = Math.max(0, reader.scrollHeight - reader.clientHeight);
    if (toc) {
      toc.tops = toc.heads.map(function (h) { return h ? topInReader(h) : Infinity; });
      toc.geo = toc.links.map(function (l) { return l[0] && l[0].offsetHeight ? { y: l[0].offsetTop, h: l[0].offsetHeight } : null; });
      placeTocInd();
    }
    readerUpdate();
  }
  function setTocActive(k) {
    if (!toc) return;
    toc.active = k;
    toc.links.forEach(function (l, j) {
      l.forEach(function (a) { if (!a) return; if (j === k) a.setAttribute("aria-current", "location"); else a.removeAttribute("aria-current"); });
    });
    placeTocInd();
  }
  function placeTocInd() {
    var ind = tocAside.querySelector(".x-toc__ind");
    if (!ind || !toc) return;
    var g = toc.active >= 0 ? toc.geo[toc.active] : null;
    if (!g) { ind.classList.remove("x-on"); return; }
    var first = !ind.classList.contains("x-on");
    if (first) ind.style.transition = "none";
    ind.style.height = g.h + "px";
    ind.style.transform = "translate3d(0," + g.y + "px,0)";
    ind.classList.add("x-on");
    if (first) { void ind.offsetWidth; ind.style.transition = ""; }
  }
  function readerUpdate() {
    rTicking = false;
    if (!openKind) return;
    rY = reader.scrollTop;
    var p = curPost ? (rMax > 0 ? Math.min(1, Math.max(0, rY / rMax)) : 1) : 0;
    progressEl.style.transform = "scaleX(" + p.toFixed(4) + ")";
    if (toc && toc.tops.length) {
      var k = -1;
      if (rMax > 0 && rY >= rMax - 2) k = toc.tops.length - 1;
      else for (var j = 0; j < toc.tops.length; j++) if (toc.tops[j] - R_OFFSET <= rY + SPY_SLACK) k = j;
      if (k !== toc.active) setTocActive(k);
    }
    refreshTopBtn();
  }
  reader.addEventListener("scroll", function () {
    if (!rTicking) { rTicking = true; requestAnimationFrame(readerUpdate); }
  }, { passive: true });
  if ("ResizeObserver" in window) {
    var rRaf = 0;
    var roReader = new ResizeObserver(function () {
      if (rRaf) return;
      rRaf = requestAnimationFrame(function () { rRaf = 0; measureReader(); });
    });
    roReader.observe(panel);
    roReader.observe(tocAside);
  }
  window.addEventListener("resize", measureReader);

  function refreshTopBtn() {
    var on = openKind ? rY > vh * 0.6 : mainY > vh * 0.9;
    if (on === topOn) return;
    topOn = on;
    topBtn.classList.toggle("x-show", on);
  }
  topBtn.addEventListener("click", function () {
    if (openKind) {
      reader.scrollTo({ top: 0, behavior: smooth() });
      try { panel.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
    } else {
      goSection(0);
      try { brand.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
    }
  });

  function scrollToHeading(id, animate) {
    var h = panel.querySelector('.x-md [id="' + String(id).replace(/["\\]/g, "") + '"]');
    if (!h) return false;
    var y = topInReader(h) - R_OFFSET;
    reader.scrollTo({ top: Math.max(0, Math.round(y)), behavior: animate && !mqReduce.matches ? "smooth" : "auto" });
    return true;
  }

  // ---------- 打开 / 关闭 ----------
  function show(kind, key) {
    clearTimeout(hideT);
    if (!openKind) {
      savedY = window.pageYOffset || 0;
      opener = doc.activeElement;
      root.classList.add("x-lock");
      wrap.setAttribute("inert", "");
      wrap.setAttribute("aria-hidden", "true");
      reader.hidden = false;
      void reader.offsetWidth;
      reader.classList.add("x-open");
    }
    var prevKind = openKind;
    openKind = kind;
    var anchor = "";
    if (kind === "post") {
      var slash = key.indexOf("/"), id = slash >= 0 ? key.slice(0, slash) : key;
      anchor = slash >= 0 ? key.slice(slash + 1) : "";
      var p = byId[id];
      if (p && p === curPost && prevKind === "post") { // 同一篇文章内跳到小节
        if (anchor) { measureReader(); scrollToHeading(anchor, true); }
        return;
      }
      curPost = p || null;
      if (p) postView(p);
      else { setToc(""); toc = null; panel.innerHTML = '<div class="x-r-body"><h1 id="x-r-title">文章不存在</h1><p class="x-excerpt">这篇文章可能已被删除或改名。</p></div>'; }
    } else {
      curPost = null; toc = null; setToc("");
      if (kind === "category") listView("分类：" + key, sorted.filter(function (p) { return (p.category || "未分类") === key; }));
      else listView("标签：" + key, sorted.filter(function (p) { return p.tags.indexOf(key) >= 0; }));
    }
    reader.classList.toggle("x-has-progress", !!curPost);
    reader.scrollTop = 0;
    rY = 0;
    measureReader();
    if (anchor) scrollToHeading(anchor, false);
    try { panel.focus({ preventScroll: true }); } catch (e) { panel.focus(); }
  }
  function hide() {
    if (!openKind) return;
    closeLightbox(true);
    openKind = null;
    curPost = null; toc = null;
    root.classList.remove("x-lock");
    wrap.removeAttribute("inert");
    wrap.removeAttribute("aria-hidden");
    window.scrollTo(0, savedY); // 恢复原滚动位置（瞬时）
    lastY = mainY = savedY;
    reader.classList.remove("x-open");
    hideT = setTimeout(function () {
      reader.hidden = true; panel.innerHTML = ""; setToc("");
      progressEl.style.transform = "scaleX(0)";
    }, mqReduce.matches ? 0 : 340);
    if (opener && opener.focus) { try { opener.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }
    refreshTopBtn();
    spy();
  }
  function parseHash() {
    var m = /^#(post|category|tag)\/(.+)$/.exec(location.hash);
    if (!m) return null;
    var key = m[2];
    try { key = decodeURIComponent(key); } catch (e) { /* 保留原样 */ }
    return { kind: m[1], key: key };
  }
  function route() {
    var r = parseHash();
    if (r) show(r.kind, r.key); else hide();
  }
  function go(hash) {
    if (location.hash === hash) return;
    // 阅读器内跳转（上一篇 / 下一篇）用 replace，“返回”总是直接关闭阅读器
    if (openKind && history.state && history.state.xr) history.replaceState({ xr: 1 }, "", hash);
    else history.pushState({ xr: 1 }, "", hash);
    route();
  }
  function back() {
    if (history.state && history.state.xr) history.back();
    else {
      try { history.replaceState(null, "", location.href.split("#")[0]); }
      catch (e) { location.hash = ""; }
      route();
    }
  }
  doc.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#post/"], a[href^="#category/"], a[href^="#tag/"]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    go(a.getAttribute("href"));
  });
  $("x-back").addEventListener("click", back);
  reader.addEventListener("click", function (e) {
    var t = e.target;
    // 代码块复制
    var cb = t.closest && t.closest(".x-copy");
    if (cb) { copyCode(cb); return; }
    // 图片放大
    if (t.tagName === "IMG" && t.closest(".x-md")) { openLightbox(t); return; }
    // 目录 / 标题锚点：在阅读器内滚动，并把网址更新为 #post/<id>/<小节>
    var a = t.closest && t.closest('a[href^="#"]');
    if (a && curPost && !/^#(post|category|tag)\//.test(a.getAttribute("href"))) {
      var id = a.getAttribute("href").slice(1);
      try { id = decodeURIComponent(id); } catch (err) { /* ignore */ }
      if (!panel.querySelector('.x-md [id="' + id.replace(/["\\]/g, "") + '"]')) return;
      e.preventDefault();
      var det = a.closest(".x-toc-m");
      if (det) det.open = false;
      measureReader();
      scrollToHeading(id, true);
      if (toc) { var k = toc.ids.indexOf(id); if (k >= 0) setTocActive(k); }
      try { history.replaceState(history.state, "", "#post/" + enc(curPost.id) + "/" + enc(id)); } catch (err) { /* ignore */ }
      return;
    }
    if (t === reader || t.id === "x-r-grid" || t.classList.contains("x-reader__bar")) back();
  });
  reader.addEventListener("keydown", function (e) {
    if ((e.key === "Enter" || e.key === " ") && e.target.tagName === "IMG" && e.target.closest(".x-md")) {
      e.preventDefault();
      openLightbox(e.target);
    }
  });
  window.addEventListener("popstate", route);
  window.addEventListener("hashchange", route);

  // ---------- 代码复制 ----------
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).catch(function () { return legacyCopy(text); });
    }
    return Promise.resolve(legacyCopy(text));
  }
  function legacyCopy(text) {
    var ta = doc.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;top:0;left:0;opacity:0;pointer-events:none";
    doc.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = doc.execCommand("copy"); } catch (e) { ok = false; }
    doc.body.removeChild(ta);
    if (!ok) throw new Error("copy failed");
    return true;
  }
  function copyCode(btn) {
    var code = btn.closest(".x-code").querySelector("code");
    var done = function (ok) {
      btn.textContent = ok ? "已复制" : "复制失败";
      btn.classList.toggle("x-done", ok);
      btn.setAttribute("aria-label", ok ? "已复制到剪贴板" : "复制失败，请手动选择");
      clearTimeout(btn._t);
      btn._t = setTimeout(function () { btn.textContent = "复制"; btn.classList.remove("x-done"); btn.setAttribute("aria-label", "复制代码"); }, 1600);
    };
    var p;
    try { p = copyText(code.textContent); } catch (e) { done(false); return; }
    p.then(function () { done(true); }, function () { done(false); });
  }

  // ======================================================
  // 8. 图片灯箱：FLIP 从原图位置放大；点击 / Esc / 下滑关闭
  // ======================================================
  var lb = null, lbSrc = null, lbBox = null, lbOpen = false, lbOpener = null, lbT = null;
  function buildLightbox() {
    lb = doc.createElement("div");
    lb.className = "x-lb";
    lb.hidden = true;
    lb.setAttribute("role", "dialog");
    lb.setAttribute("aria-modal", "true");
    lb.setAttribute("aria-label", "图片预览");
    lb.innerHTML = '<div class="x-lb__bg"></div><img class="x-lb__img" alt="" draggable="false"><p class="x-lb__cap"></p>' +
      '<button class="x-lb__close" type="button" aria-label="关闭图片预览"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button>';
    doc.body.appendChild(lb);
    lb.querySelector(".x-lb__close").addEventListener("click", function (e) { e.stopPropagation(); closeLightbox(); });
    // 下滑关闭（触摸 / 鼠标拖动），轻点关闭
    var sy = 0, sx = 0, dy = 0, moved = false, pid = null;
    var img = lb.querySelector(".x-lb__img"), bg = lb.querySelector(".x-lb__bg");
    lb.addEventListener("pointerdown", function (e) {
      if (!lbOpen || e.target.closest(".x-lb__close")) return;
      pid = e.pointerId; sy = e.clientY; sx = e.clientX; dy = 0; moved = false;
      try { lb.setPointerCapture(pid); } catch (err) { /* ignore */ }
    });
    lb.addEventListener("pointermove", function (e) {
      if (pid !== e.pointerId || !lbOpen) return;
      dy = e.clientY - sy;
      if (!moved && Math.abs(dy) + Math.abs(e.clientX - sx) > 6) { moved = true; img.classList.remove("x-anim"); bg.style.transition = "none"; }
      if (!moved) return;
      var d = Math.max(0, dy), s = 1 - Math.min(d / vh, 0.5) * 0.3;
      img.style.transform = "translate3d(" + ((1 - s) * lbBox.w / 2) + "px," + (d + (1 - s) * lbBox.h / 2) + "px,0) scale(" + s + ")";
      bg.style.opacity = String(Math.max(0.15, 1 - d / (vh * 0.6)));
    });
    function end(e) {
      if (pid !== e.pointerId) return;
      pid = null;
      bg.style.transition = "";
      if (!moved) { closeLightbox(); return; }
      if (dy > 90) closeLightbox();
      else { img.classList.add("x-anim"); img.style.transform = "none"; bg.style.opacity = ""; }
    }
    lb.addEventListener("pointerup", end);
    lb.addEventListener("pointercancel", end);
  }
  function fitBox(r) {
    var vw = window.innerWidth, h = window.innerHeight, m = vw < 600 ? 12 : 32;
    var s = Math.min((vw - m * 2) / r.width, (h - m * 2 - 40) / r.height);
    var w = r.width * s, hh = r.height * s;
    return { x: (vw - w) / 2, y: (h - hh) / 2, w: w, h: hh };
  }
  function flipFrom(r) {
    return "translate3d(" + (r.left - lbBox.x) + "px," + (r.top - lbBox.y) + "px,0) scale(" + (r.width / lbBox.w) + "," + (r.height / lbBox.h) + ")";
  }
  function openLightbox(src) {
    if (lbOpen) return;
    if (!lb) buildLightbox();
    clearTimeout(lbT);
    var r = src.getBoundingClientRect();
    if (!r.width || !r.height) return;
    lbSrc = src; lbOpen = true; lbOpener = doc.activeElement;
    lbBox = fitBox(r);
    var img = lb.querySelector(".x-lb__img");
    img.src = src.currentSrc || src.src;
    img.alt = src.alt || "";
    lb.querySelector(".x-lb__cap").textContent = src.alt || "";
    img.classList.remove("x-anim");
    img.style.cssText = "left:" + lbBox.x + "px;top:" + lbBox.y + "px;width:" + lbBox.w + "px;height:" + lbBox.h + "px;";
    img.style.transform = mqReduce.matches ? "none" : flipFrom(r);
    lb.hidden = false;
    src.classList.add("x-lb-src");
    void lb.offsetWidth;
    lb.classList.add("x-open");
    requestAnimationFrame(function () {
      img.classList.add("x-anim");
      img.style.transform = "none";
    });
    try { lb.querySelector(".x-lb__close").focus({ preventScroll: true }); } catch (e) { /* ignore */ }
  }
  function closeLightbox(instant) {
    if (!lbOpen) return;
    lbOpen = false;
    var img = lb.querySelector(".x-lb__img"), src = lbSrc;
    var finish = function () {
      lb.hidden = true;
      lb.classList.remove("x-open");
      img.classList.remove("x-anim");
      lb.querySelector(".x-lb__bg").style.opacity = "";
      if (src) src.classList.remove("x-lb-src");
    };
    lb.classList.remove("x-open");
    lb.querySelector(".x-lb__bg").style.opacity = "";
    var r = src && src.isConnected ? src.getBoundingClientRect() : null;
    if (instant || mqReduce.matches || !r || !r.width || r.bottom < 0 || r.top > window.innerHeight) {
      if (!instant && !mqReduce.matches) {
        img.classList.add("x-anim");
        img.style.transform = "translate3d(" + lbBox.w * 0.05 + "px," + lbBox.h * 0.05 + "px,0) scale(0.9)";
        img.style.opacity = "0";
        lbT = setTimeout(function () { img.style.opacity = ""; finish(); }, 320);
      } else finish();
    } else {
      img.classList.add("x-anim");
      img.style.transform = flipFrom(r);
      lbT = setTimeout(finish, 340);
    }
    if (lbOpener && lbOpener.focus && !instant) { try { lbOpener.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }
  }

  // ======================================================
  // 9. 站内搜索：/ 或 Ctrl/⌘ + K 打开；实时模糊搜索标题、标签、分类、摘要和正文
  // ======================================================
  var sEl = $("x-search"), sInput = $("x-q"), sList = $("x-sr"), sMsg = $("x-sr-msg"), sBtn = $("x-search-btn");
  var sOpen = false, sIndex = null, sResults = [], sActive = -1, sTimer = null, sComposing = false, sOpener = null, sInerted = [];
  var W = { title: 10, tags: 6, category: 5, excerpt: 3, body: 1 };
  var FIELDS = ["title", "tags", "category", "excerpt", "body"];

  // 索引只构建一次（第一次打开搜索时）
  function buildIndex() {
    sIndex = sorted.map(function (p) {
      var f = {
        title: p.title || "",
        tags: (p.tags || []).join(" · "),
        category: p.category || "",
        excerpt: p.excerpt || "",
        body: (MD.markdownToText ? MD.markdownToText(p.body) : String(p.body || "")).replace(/\s+/g, " ")
      };
      var low = {};
      FIELDS.forEach(function (k) { low[k] = f[k].toLowerCase(); if (low[k].length !== f[k].length) low[k] = f[k]; });
      return { p: p, f: f, low: low };
    });
  }
  function subseq(hay, t) {
    var pos = [], j = 0;
    for (var i = 0; i < hay.length && j < t.length; i++) if (hay.charAt(i) === t.charAt(j)) { pos.push(i); j++; }
    return j === t.length ? pos : null;
  }
  function lev1(a, b) { // 编辑距离是否 ≤ 1
    if (a === b) return true;
    var la = a.length, lb2 = b.length;
    if (Math.abs(la - lb2) > 1) return false;
    var i = 0, j = 0, diff = 0;
    while (i < la && j < lb2) {
      if (a.charAt(i) === b.charAt(j)) { i++; j++; continue; }
      if (++diff > 1) return false;
      if (la > lb2) i++; else if (lb2 > la) j++; else { i++; j++; }
    }
    return diff + (la - i) + (lb2 - j) <= 1;
  }
  function searchPosts(q) {
    var terms = q.toLowerCase().trim().split(/\s+/).filter(Boolean).slice(0, 6);
    if (!terms.length) return [];
    if (!sIndex) buildIndex();
    var out = [];
    sIndex.forEach(function (en) {
      var total = 0, marks = { title: [], tags: [], category: [], excerpt: [], body: [] }, ok = true;
      terms.forEach(function (t) {
        if (!ok) return;
        var best = 0;
        FIELDS.forEach(function (k) {
          var s = en.low[k], at = s.indexOf(t);
          if (at < 0) return;
          var sc = W[k] * (at === 0 ? 1.5 : 1) * (k === "title" && s === t ? 2 : 1);
          var n = 0, from = at;
          while (from >= 0 && n < 50) { marks[k].push([from, from + t.length]); n++; from = s.indexOf(t, from + t.length); }
          sc += Math.min(n - 1, 4) * W[k] * 0.1;
          if (sc > best) best = sc;
        });
        if (!best && t.length >= 2) { // 模糊：标题里按顺序出现这些字，且不太分散
          var pos = subseq(en.low.title, t);
          if (pos && pos[pos.length - 1] - pos[0] <= t.length * 4 + 4) {
            best = W.title * 0.35;
            pos.forEach(function (x) { marks.title.push([x, x + 1]); });
          }
        }
        if (!best && /^[a-z0-9]{4,}$/.test(t)) { // 模糊：英文单词允许一个字母的拼写错误
          ["title", "tags", "category", "excerpt", "body"].some(function (k) {
            var re = /[a-z0-9]+/g, m;
            while ((m = re.exec(en.low[k]))) {
              if (m[0].length >= 3 && lev1(m[0], t)) { best = W[k] * 0.3; marks[k].push([m.index, m.index + m[0].length]); return true; }
            }
            return false;
          });
        }
        if (!best) ok = false; else total += best;
      });
      if (ok) out.push({ en: en, score: total, marks: marks });
    });
    out.sort(function (a, b) { return b.score - a.score || (a.en.p.date < b.en.p.date ? 1 : a.en.p.date > b.en.p.date ? -1 : 0); });
    return out.slice(0, 20);
  }
  function markHtml(text, ranges, from, to) {
    from = from || 0; to = to == null ? text.length : to;
    var rs = ranges.filter(function (r) { return r[1] > from && r[0] < to; })
      .map(function (r) { return [Math.max(r[0], from), Math.min(r[1], to)]; })
      .sort(function (a, b) { return a[0] - b[0]; });
    var merged = [];
    rs.forEach(function (r) { var l = merged[merged.length - 1]; if (l && r[0] <= l[1]) l[1] = Math.max(l[1], r[1]); else merged.push(r.slice()); });
    var out = "", i = from;
    merged.forEach(function (r) { out += esc(text.slice(i, r[0])) + "<mark>" + esc(text.slice(r[0], r[1])) + "</mark>"; i = r[1]; });
    return out + esc(text.slice(i, to));
  }
  function snippet(res) {
    var f = res.en.f, k = res.marks.body.length ? "body" : res.marks.excerpt.length ? "excerpt" : null;
    if (!k) return esc(f.excerpt.length > 80 ? f.excerpt.slice(0, 80) + "…" : f.excerpt);
    var text = f[k], first = Math.min.apply(null, res.marks[k].map(function (r) { return r[0]; }));
    var from = Math.max(0, first - 22), to = Math.min(text.length, first + 70);
    return (from > 0 ? "…" : "") + markHtml(text, res.marks[k], from, to) + (to < text.length ? "…" : "");
  }
  function renderResults(q) {
    var query = q.trim();
    sResults = query ? searchPosts(query) : [];
    sActive = sResults.length ? 0 : -1;
    sList.innerHTML = sResults.map(function (r, i) {
      var p = r.en.p;
      return '<li role="none"><a class="x-sr" role="option" id="x-sr-' + i + '" href="' + postHref(p) + '" aria-selected="' + (i === sActive) + '">' +
        '<span class="x-sr__t">' + markHtml(r.en.f.title, r.marks.title) + "</span>" +
        '<span class="x-sr__m"><time datetime="' + esc(p.date) + '">' + esc(p.date) + "</time>" +
        "<span>" + markHtml(r.en.f.category, r.marks.category) + "</span>" +
        (r.en.f.tags ? "<span>" + markHtml(r.en.f.tags, r.marks.tags) + "</span>" : "") + "</span>" +
        '<span class="x-sr__s">' + snippet(r) + "</span></a></li>";
    }).join("");
    sMsg.textContent = !query ? "输入关键词，搜索标题、标签、分类、摘要和正文" :
      sResults.length ? "找到 " + sResults.length + " 篇相关文章" : "没有找到与「" + query + "」相关的文章";
    sMsg.classList.toggle("x-sr-count", !!sResults.length);
    sInput.setAttribute("aria-expanded", sResults.length ? "true" : "false");
    syncActive();
  }
  function syncActive() {
    [].forEach.call(sList.querySelectorAll(".x-sr"), function (a, i) { a.setAttribute("aria-selected", i === sActive ? "true" : "false"); });
    if (sActive >= 0) {
      sInput.setAttribute("aria-activedescendant", "x-sr-" + sActive);
      var el = $("x-sr-" + sActive);
      if (el && el.scrollIntoView) el.scrollIntoView({ block: "nearest" });
    } else sInput.removeAttribute("aria-activedescendant");
  }
  function schedule() {
    clearTimeout(sTimer);
    sTimer = setTimeout(function () { renderResults(sInput.value); }, 120); // 防抖
  }
  function openSearch() {
    if (sOpen) { sInput.focus(); sInput.select(); return; }
    if (lbOpen) closeLightbox(true);
    if (!sIndex) buildIndex();
    sOpen = true;
    sOpener = doc.activeElement;
    sInerted = [wrap, reader].filter(function (el) { return !el.hasAttribute("inert"); });
    sInerted.forEach(function (el) { el.setAttribute("inert", ""); });
    root.classList.add("x-lock-search");
    sEl.hidden = false;
    void sEl.offsetWidth;
    sEl.classList.add("x-open");
    sBtn.setAttribute("aria-expanded", "true");
    sInput.focus();
    sInput.select();
    renderResults(sInput.value);
  }
  function closeSearch(restoreFocus) {
    if (!sOpen) return;
    sOpen = false;
    clearTimeout(sTimer);
    sInerted.forEach(function (el) { el.removeAttribute("inert"); });
    sInerted = [];
    root.classList.remove("x-lock-search");
    sEl.classList.remove("x-open");
    sBtn.setAttribute("aria-expanded", "false");
    setTimeout(function () { if (!sOpen) sEl.hidden = true; }, mqReduce.matches ? 0 : 260);
    if (restoreFocus !== false && sOpener && sOpener.focus) { try { sOpener.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }
  }
  function openResult(i) {
    var r = sResults[i];
    if (!r) return;
    closeSearch(false);
    go(postHref(r.en.p));
  }
  sBtn.addEventListener("click", openSearch);
  $("x-search-close").addEventListener("click", function () { closeSearch(); });
  sEl.addEventListener("click", function (e) {
    if (e.target === sEl) { closeSearch(); return; }
    var a = e.target.closest && e.target.closest(".x-sr");
    if (a && !(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)) {
      e.preventDefault();
      e.stopPropagation();
      openResult(+a.id.replace("x-sr-", ""));
    }
  });
  sList.addEventListener("mousemove", function (e) {
    var a = e.target.closest && e.target.closest(".x-sr");
    if (!a) return;
    var i = +a.id.replace("x-sr-", "");
    if (i !== sActive) { sActive = i; [].forEach.call(sList.querySelectorAll(".x-sr"), function (el, k) { el.setAttribute("aria-selected", k === i ? "true" : "false"); }); sInput.setAttribute("aria-activedescendant", a.id); }
  });
  sInput.addEventListener("input", function () { if (!sComposing) schedule(); });
  sInput.addEventListener("compositionstart", function () { sComposing = true; });
  sInput.addEventListener("compositionend", function () { sComposing = false; schedule(); });
  sInput.addEventListener("keydown", function (e) {
    if (e.isComposing || sComposing) return;
    var n = sResults.length;
    if (e.key === "ArrowDown" && n) { e.preventDefault(); sActive = (sActive + 1) % n; syncActive(); }
    else if (e.key === "ArrowUp" && n) { e.preventDefault(); sActive = (sActive - 1 + n) % n; syncActive(); }
    else if (e.key === "Enter") {
      e.preventDefault();
      clearTimeout(sTimer);
      if (sInput.value.trim() && !sResults.length) renderResults(sInput.value); // 防抖还没跑完时立即搜索
      openResult(sActive >= 0 ? sActive : 0);
    }
  });
  // 焦点留在搜索面板内
  sEl.addEventListener("keydown", function (e) {
    if (e.key !== "Tab") return;
    var f = [].slice.call(sEl.querySelectorAll("input, button, .x-sr"));
    if (!f.length) return;
    var i = f.indexOf(doc.activeElement);
    if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
  });

  // ---------- 全局键盘：Esc 依次关闭灯箱 → 搜索 → 阅读器；/ 与 Ctrl/⌘+K 打开搜索 ----------
  function isEditable(el) {
    return el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
  }
  doc.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if (lbOpen) { e.preventDefault(); closeLightbox(); return; }
      if (sOpen) { e.preventDefault(); closeSearch(); return; }
      if (openKind) { e.preventDefault(); back(); return; }
      return;
    }
    if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey) {
      e.preventDefault();
      if (sOpen) closeSearch(); else openSearch();
      return;
    }
    if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey && !sOpen && !lbOpen && !isEditable(e.target)) {
      e.preventDefault();
      openSearch();
    }
  });

  // ======================================================
  // 10. 启动
  // ======================================================
  measure();
  fitSide();
  fitSpacer();
  setActive(0);
  if (lastY > 24) setCompact(true);
  refreshTopBtn();
  route();

  // 供调试 / 测试使用
  window.__blog = {
    sorted: sorted, featured: featured, goSection: goSection, route: route, search: searchPosts,
    openSearch: openSearch, closeSearch: closeSearch,
    state: function () {
      return { active: active, compact: compact, openKind: openKind, search: sOpen, lightbox: lbOpen, toc: toc ? toc.active : null, topBtn: topOn };
    }
  };
})();

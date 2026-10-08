/*
 * markdown.js · 内置 Markdown 渲染器（无依赖）
 *
 * 块级：# ~ ### 标题（自动生成锚点）、段落、``` / ~~~ 代码块（语法高亮 + 复制按钮）、
 *       无序 / 有序 / 嵌套列表、任务列表 - [ ] / - [x]、> 引用、GFM 表格（含对齐）、--- 分隔线。
 * 行内：**粗体**、*斜体*、~~删除线~~、`行内代码`、[链接](url)、![图片](src)、\* 反斜杠转义。
 * 目录：renderPost() 会同时返回 h2 / h3 标题列表，tocHtml() 把它变成目录。
 * 高亮：js / ts、python、html、css、bash、json，内置的小型分词器，颜色由 CSS 变量控制。
 *
 * 所有文本都会先做 HTML 转义：正文里写的 <tag> 会原样显示，不会被执行。
 */
(function (root) {
  "use strict";

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // 只允许安全的链接协议；javascript: 等一律替换为 #
  function safeUrl(url) {
    var u = String(url).trim();
    if (/^(https?:|mailto:|tel:|#|\/|\.{0,2}\/)/i.test(u)) return u;
    if (!/^[a-z][a-z0-9+.-]*:/i.test(u)) return u; // 相对路径，如 images/a.jpg
    return "#";
  }

  // 图片额外允许内嵌的 data:image/…（<img> 中不会执行脚本）
  function safeImg(url) {
    var u = String(url).trim();
    return /^data:image\/(png|jpe?g|gif|webp|avif|svg\+xml)[;,]/i.test(u) ? u : safeUrl(u);
  }

  // ======================================================
  // 行内语法
  // ======================================================
  function inline(src) {
    var slots = [];
    function keep(html) { slots.push(html); return "\u0000" + (slots.length - 1) + "\u0000"; }
    var s = String(src);
    // 0) 反斜杠转义：\* \_ \| \~ 等按字面显示
    s = s.replace(/\\([\\`*_{}\[\]()#+\-.!|~>])/g, function (_, c) { return keep(esc(c)); });
    // 1) 行内代码先取出，内部不再解析
    s = s.replace(/`([^`\n]+)`/g, function (_, code) { return keep("<code>" + esc(code) + "</code>"); });
    // 2) 图片与链接（在转义前取出，参数单独转义）
    s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, function (_, alt, url, title) {
      return keep('<img src="' + esc(safeImg(url)) + '" alt="' + esc(alt) + '"' + (title ? ' title="' + esc(title) + '"' : "") + ' loading="lazy" decoding="async">');
    });
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, function (_, text, url, title) {
      var href = safeUrl(url), ext = /^https?:/i.test(href);
      return keep('<a href="' + esc(href) + '"' + (title ? ' title="' + esc(title) + '"' : "") + (ext ? ' target="_blank" rel="noopener noreferrer"' : "") + ">" + emph(esc(text)) + "</a>");
    });
    // 3) 其余文本转义后处理粗体 / 斜体 / 删除线
    s = emph(esc(s));
    // 4) 还原占位
    var guard = 0;
    while (/\u0000\d+\u0000/.test(s) && guard++ < 5) {
      s = s.replace(/\u0000(\d+)\u0000/g, function (_, i) { return slots[+i]; });
    }
    return s;
  }
  function emph(s) {
    return s
      .replace(/\*\*([^*\n]+?)\*\*/g, "<strong>$1</strong>")
      .replace(/__([^_\n]+?)__/g, "<strong>$1</strong>")
      .replace(/(^|[^*])\*([^*\n]+?)\*(?!\*)/g, "$1<em>$2</em>")
      .replace(/~~(?=\S)([^~\n]*?\S)~~/g, "<del>$1</del>");
  }

  // 合并多行段落：中文之间不加空格，西文之间加一个空格
  var CJK = /[\u2e80-\u9fff\uf900-\ufaff\uff00-\uffef\u3000-\u303f]/;
  function joinLines(lines) {
    var out = "";
    lines.forEach(function (l, i) {
      var hardBreak = / {2,}$/.test(l);
      var t = l.trim();
      if (i > 0 && !/\n$/.test(out)) {
        var a = out.slice(-1), b = t.charAt(0);
        out += CJK.test(a) || CJK.test(b) ? "" : " ";
      }
      out += t + (hardBreak && i < lines.length - 1 ? "\n" : "");
    });
    return out;
  }
  function inlineLines(lines) { return joinLines(lines).split("\n").map(inline).join("<br>"); }
  function para(lines) { return "<p>" + inlineLines(lines) + "</p>"; }

  // 标题纯文本（去掉行内标记），用于锚点和目录
  function plainInline(s) {
    return String(s)
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/\\([\\`*_{}\[\]()#+\-.!|~>])/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/(\*\*|__|~~)(.+?)\1/g, "$2")
      .replace(/\*([^*]+)\*/g, "$1")
      .trim();
  }
  var HAS_UNICODE_RE = (function () { try { new RegExp("\\p{L}", "u"); return true; } catch (e) { return false; } })();
  function slugify(text) {
    var s = plainInline(text).toLowerCase();
    s = HAS_UNICODE_RE
      ? s.replace(new RegExp("[^\\p{L}\\p{N}]+", "gu"), "-")
      : s.replace(/[\s!-\/:-@\[-`{-~\u3000-\u303f\uff00-\uff0f\uff1a-\uff20]+/g, "-");
    s = s.replace(/^-+|-+$/g, "");
    return s || "section";
  }

  // ======================================================
  // 语法高亮：每种语言一组「正则 → 颜色类」规则，从左到右扫描
  // ======================================================
  function tk(cls, text) { return cls ? '<span class="x-tk-' + cls + '">' + esc(text) + "</span>" : esc(text); }
  function words(s) { var o = {}; s.split(" ").forEach(function (w) { o[w] = 1; }); return o; }
  function prevNonSpace(code, i) { while (i > 0 && /[ \t]/.test(code.charAt(i - 1))) i--; return i > 0 ? code.charAt(i - 1) : "\n"; }

  function scanner(rules) {
    var compiled = rules.map(function (r) { return { re: new RegExp(r[0], "y"), out: r[1], guard: r[2] }; });
    return function (code) {
      var out = "", plain = "", i = 0, n = code.length;
      while (i < n) {
        var hit = false;
        for (var k = 0; k < compiled.length; k++) {
          var r = compiled[k];
          if (r.guard && !r.guard(code, i)) continue;
          r.re.lastIndex = i;
          var m = r.re.exec(code);
          if (m && m[0].length) {
            if (plain) { out += esc(plain); plain = ""; }
            out += typeof r.out === "function" ? r.out(m, code, i) : tk(r.out, m[0]);
            i += m[0].length; hit = true; break;
          }
        }
        if (!hit) { plain += code.charAt(i); i++; }
      }
      return out + esc(plain);
    };
  }
  function identRule(re, kw, lit, builtin, extra) {
    return [re, function (m, code, i) {
      var w = m[0], next = code.slice(i + w.length).match(/^\s*(.)/);
      if (kw[w]) return tk("k", w);
      if (lit[w]) return tk("l", w);
      if (extra) { var e = extra(w, code, i); if (e) return tk(e, w); }
      if (builtin[w]) return tk("b", w);
      if (/^[A-Z][A-Za-z0-9_]*[a-z][A-Za-z0-9_]*$/.test(w)) return tk("t", w);
      if (next && next[1] === "(") return tk("f", w);
      return esc(w);
    }];
  }

  var STR_DQ = '"(?:\\\\[\\s\\S]|[^"\\\\\\n])*"?';
  var STR_SQ = "'(?:\\\\[\\s\\S]|[^'\\\\\\n])*'?";
  var NUM = "(?:0[xX][\\da-fA-F_]+|0[bB][01_]+|0[oO][0-7_]+|(?:\\d[\\d_]*\\.?[\\d_]*|\\.\\d[\\d_]*)(?:[eE][+-]?\\d+)?)n?";

  var JS_KW = "var let const function return if else for while do switch case default break continue new delete typeof instanceof in of class extends import export from as async await yield try catch finally throw debugger with static get set";
  var TS_KW = JS_KW + " interface type enum implements declare readonly namespace abstract private public protected keyof infer is satisfies";
  var JS_LIT = words("true false null undefined NaN Infinity this super");
  var JS_BI = words("console Math JSON Object Array String Number Boolean Promise Date RegExp Map Set WeakMap Symbol Error document window globalThis require module process fetch setTimeout setInterval clearTimeout parseInt parseFloat");
  var TS_TYPES = words("string number boolean any unknown never void object bigint symbol");
  function jsRules(kw, ts) {
    return [
      ["\\s+", null],
      ["\\/\\/[^\\n]*", "c"],
      ["\\/\\*[\\s\\S]*?(?:\\*\\/|$)", "c"],
      ["`(?:\\\\[\\s\\S]|\\$\\{[^}]*\\}|[^\\\\`])*`?", "s"],
      [STR_DQ, "s"], [STR_SQ, "s"],
      ts ? ["@[A-Za-z_$][\\w$]*", "a"] : ["(?!)", null],
      identRule("[A-Za-z_$][\\w$]*", words(kw), JS_LIT, JS_BI, ts ? function (w) { return TS_TYPES[w] ? "t" : ""; } : null),
      [NUM, "n"],
      ["=>|[=!]==?|[<>]=?|&&|\\|\\||\\?\\?|\\.\\.\\.|[-+*/%&|^~?:]=?", "o"]
    ];
  }
  var PY_KW = words("def class return if elif else for while in not and or is import from as with try except finally raise lambda yield pass break continue global nonlocal assert del async await match case");
  var PY_LIT = words("True False None self cls");
  var PY_BI = words("print len range int str float list dict set tuple open enumerate zip map filter sorted sum min max isinstance type super abs round input any all bool repr iter next format");
  var PY_STR_PREFIX = "(?:[rRbBuUfF]{1,2})?";
  var pyRules = [
    ["\\s+", null],
    ["#[^\\n]*", "c"],
    [PY_STR_PREFIX + '(?:"""[\\s\\S]*?(?:"""|$)|\'\'\'[\\s\\S]*?(?:\'\'\'|$))', "s"],
    [PY_STR_PREFIX + "(?:" + STR_DQ + "|" + STR_SQ + ")", "s"],
    ["@[A-Za-z_][\\w.]*", "a"],
    identRule("[A-Za-z_][\\w]*", PY_KW, PY_LIT, PY_BI),
    [NUM, "n"],
    ["->|[=!<>]=|\\*\\*|//|[-+*/%&|^~<>]=?|:=", "o"]
  ];

  var CSS_RULES = [
    ["\\s+", null],
    ["\\/\\*[\\s\\S]*?(?:\\*\\/|$)", "c"],
    [STR_DQ, "s"], [STR_SQ, "s"],
    ["@[\\w-]+", "k"],
    ["!important\\b", "k"],
    ["(-{0,2}[A-Za-z_][\\w-]*)(\\s*:)(?=[^{};]*(?:[;}]|$))", function (m) { return tk("p", m[1]) + esc(m[2]); }],
    ["#[\\da-fA-F]{3,8}(?![\\w-])", "n"],
    ["[.#]-?[A-Za-z_][\\w-]*", "g"],
    ["::?[A-Za-z-]+", "a"],
    ["-?(?:\\d+\\.?\\d*|\\.\\d+)(?:%|[A-Za-z]+)?", "n"],
    ["-{0,2}[A-Za-z_][\\w-]*", function (m, code, i) {
      return /^\s*\(/.test(code.slice(i + m[0].length)) ? tk("f", m[0]) : esc(m[0]);
    }]
  ];
  var cssScan = scanner(CSS_RULES);

  function tagHtml(t) {
    var m = /^(<\/?)([^\s\/>]+)([\s\S]*?)(\/?>)?$/.exec(t);
    if (!m) return esc(t);
    var attrs = m[3].replace(/([^\s=]+)(\s*=\s*)?("[^"]*"|'[^']*'|[^\s"']+)?|(\s+)/g, function (all, name, eq, val, ws) {
      if (ws) return ws;
      return tk("a", name) + (eq ? esc(eq) : "") + (val ? tk("s", val) : "");
    });
    return tk("o", m[1]) + tk("g", m[2]) + attrs + (m[4] ? tk("o", m[4]) : "");
  }
  var htmlScan = scanner([
    ["\\s+", null],
    ["<!--[\\s\\S]*?(?:-->|$)", "c"],
    ["<![^>]*>", "m"],
    ["(<(script|style)\\b[^>]*>)([\\s\\S]*?)(<\\/\\2\\s*>|$)", function (m) {
      return tagHtml(m[1]) + (m[2].toLowerCase() === "script" ? LANGS.js.fn(m[3]) : cssScan(m[3])) + (m[4] ? tagHtml(m[4]) : "");
    }],
    ["<\\/?[A-Za-z][\\w:-]*(?:\\s+[^\\s=>\\/]+(?:\\s*=\\s*(?:\"[^\"]*\"|'[^']*'|[^\\s>]+))?)*\\s*\\/?>", function (m) { return tagHtml(m[0]); }],
    ["&#?[\\w]+;", "l"]
  ]);

  var SH_KW = words("if then else elif fi for while until do done case esac in function return local export source alias unset set shift exit break continue select time readonly declare");
  var SH_BI = words("echo cd printf read test pwd ls cat grep sed awk mkdir rm cp mv touch chmod chown curl wget git npm npx node yarn pnpm python python3 pip sudo apt apt-get brew docker kill sleep tar zip unzip find xargs head tail sort uniq wc tee env which open vercel gh ssh scp");
  function atWordStart(code, i) { return i === 0 || /[\s;|&(]/.test(code.charAt(i - 1)); }
  var bashScan = scanner([
    ["[ \\t]+|\\n", null],
    ["#[^\\n]*", "c", atWordStart],
    ["\\$(?=\\s)", "o", function (code, i) { return i === 0 || code.charAt(i - 1) === "\n"; }], // 提示符 $
    [STR_DQ, "s"], [STR_SQ, "s"],
    ["\\$(?:\\{[^}\\n]*\\}|[A-Za-z_]\\w*|[@*#?$!0-9-])", "v"],
    ["--?[A-Za-z][\\w-]*(?:=[^\\s]*)?", "a", atWordStart],
    ["[A-Za-z_][\\w]*(?==)", "v", atWordStart],
    ["[A-Za-z_][\\w.+-]*", function (m, code, i) {
      var w = m[0];
      if (SH_KW[w]) return tk("k", w);
      var p = prevNonSpace(code, i);
      if (SH_BI[w] || /[\n;|&(]/.test(p)) return tk("f", w);
      return esc(w);
    }],
    ["\\d+(?:\\.\\d+)?(?![\\w.])", "n"],
    ["&&|\\|\\||[|><]=?|;", "o"]
  ]);
  var jsonScan = scanner([
    ["\\s+", null],
    ["\\/\\/[^\\n]*", "c"],
    ["\\/\\*[\\s\\S]*?(?:\\*\\/|$)", "c"],
    ['"(?:\\\\.|[^"\\\\\\n])*"(?=\\s*:)', "p"],
    [STR_DQ, "s"],
    ["-?\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?", "n"],
    ["\\b(?:true|false|null)\\b", "l"]
  ]);

  var LANGS = {
    js: { label: "JavaScript", fn: scanner(jsRules(JS_KW, false)) },
    ts: { label: "TypeScript", fn: scanner(jsRules(TS_KW, true)) },
    py: { label: "Python", fn: scanner(pyRules) },
    html: { label: "HTML", fn: htmlScan },
    css: { label: "CSS", fn: cssScan },
    bash: { label: "Bash", fn: bashScan },
    json: { label: "JSON", fn: jsonScan }
  };
  var ALIAS = {
    js: "js", javascript: "js", jsx: "js", mjs: "js", cjs: "js", node: "js",
    ts: "ts", typescript: "ts", tsx: "ts",
    py: "py", python: "py", python3: "py",
    html: "html", htm: "html", xml: "html", svg: "html", vue: "html",
    css: "css", scss: "css", less: "css",
    bash: "bash", sh: "bash", shell: "bash", zsh: "bash", console: "bash", shellsession: "bash",
    json: "json", jsonc: "json", json5: "json"
  };
  /** 返回高亮后的 HTML；不认识的语言只做转义 */
  function highlight(code, lang) {
    var key = ALIAS[String(lang || "").toLowerCase()];
    return key ? LANGS[key].fn(String(code)) : esc(code);
  }
  function langLabel(lang) {
    var key = ALIAS[String(lang || "").toLowerCase()];
    return key ? LANGS[key].label : lang ? String(lang) : "代码";
  }

  // ======================================================
  // 块级语法
  // ======================================================
  var RE = {
    fence: /^\s*(`{3,}|~{3,})\s*([\w+#.-]*)\s*$/,
    heading: /^\s{0,3}(#{1,6})\s+(.*?)\s*#*\s*$/,
    hr: /^\s{0,3}([-*_])(\s*\1){2,}\s*$/,
    quote: /^\s{0,3}>\s?(.*)$/,
    ul: /^(\s*)([-*+])(\s+)(.*)$/,
    ol: /^(\s*)(\d{1,9})([.)])(\s+)(.*)$/,
    task: /^\[([ xX])\]\s+(.*)$/,
    tableDelim: /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/,
    blank: /^\s*$/
  };
  function indentOf(l) { return /^ */.exec(l)[0].length; }
  function itemOf(l) {
    var m;
    if ((m = RE.ul.exec(l))) return { indent: m[1].length, ordered: false, text: m[4], content: m[1].length + 1 + m[3].length };
    if ((m = RE.ol.exec(l))) return { indent: m[1].length, ordered: true, start: parseInt(m[2], 10), text: m[5], content: m[1].length + m[2].length + 1 + m[4].length };
    return null;
  }

  // ---------- 表格 ----------
  function splitRow(line) {
    var s = line.trim();
    if (s.charAt(0) === "|") s = s.slice(1);
    if (s.slice(-1) === "|" && s.slice(-2) !== "\\|") s = s.slice(0, -1);
    var cells = [], cur = "", inCode = false;
    for (var i = 0; i < s.length; i++) {
      var c = s.charAt(i);
      if (c === "\\" && s.charAt(i + 1) === "|") { cur += inCode ? "|" : "\\|"; i++; continue; }
      if (c === "`") inCode = !inCode;
      if (c === "|" && !inCode) { cells.push(cur.trim()); cur = ""; continue; }
      cur += c;
    }
    cells.push(cur.trim());
    return cells;
  }
  function isTableStart(lines, i) {
    if (i + 1 >= lines.length || lines[i].indexOf("|") < 0 || !RE.tableDelim.test(lines[i + 1]) || lines[i + 1].indexOf("-") < 0) return false;
    var head = splitRow(lines[i]), delim = splitRow(lines[i + 1]);
    return head.length === delim.length && lines[i + 1].indexOf("|") >= 0;
  }
  function table(lines, i) {
    var head = splitRow(lines[i]);
    var align = splitRow(lines[i + 1]).map(function (d) {
      var l = d.charAt(0) === ":", r = d.slice(-1) === ":";
      return l && r ? "center" : r ? "right" : l ? "left" : "";
    });
    function cell(tag, text, k) { return "<" + tag + (align[k] ? ' style="text-align:' + align[k] + '"' : "") + ">" + inline(text) + "</" + tag + ">"; }
    var html = '<div class="x-table" tabindex="0" role="region" aria-label="表格"><table><thead><tr>' + head.map(function (t, k) { return cell("th", t, k); }).join("") + "</tr></thead>";
    i += 2;
    var rows = [];
    while (i < lines.length && !RE.blank.test(lines[i]) && lines[i].indexOf("|") >= 0) {
      var cells = splitRow(lines[i]);
      rows.push("<tr>" + head.map(function (_, k) { return cell("td", cells[k] || "", k); }).join("") + "</tr>");
      i++;
    }
    html += (rows.length ? "<tbody>" + rows.join("") + "</tbody>" : "") + "</table></div>";
    return { html: html, next: i };
  }

  // ---------- 列表（支持嵌套、任务列表） ----------
  function list(lines, i, ctx) {
    var first = itemOf(lines[i]), base = first.indent, ordered = first.ordered;
    var items = [], cur = null;
    while (i < lines.length) {
      var l = lines[i];
      if (RE.blank.test(l)) {
        var j = i + 1;
        while (j < lines.length && RE.blank.test(lines[j])) j++;
        if (j >= lines.length) break;
        var nx = itemOf(lines[j]);
        if (nx && nx.indent < base + 2 && nx.ordered === ordered && !RE.hr.test(lines[j])) { i = j; continue; }
        if (cur && indentOf(lines[j]) >= base + 2) { cur.lines.push(""); i++; continue; }
        break;
      }
      var it = RE.hr.test(l) && indentOf(l) < base + 2 ? null : itemOf(l);
      if (it && it.indent < base + 2) {
        if (it.ordered !== ordered) break; // 换了列表类型：结束当前列表
        cur = { lines: [it.text], content: it.content };
        items.push(cur); i++; continue;
      }
      if (cur && indentOf(l) >= base + 2) { // 缩进行：续行或子列表
        cur.lines.push(l.slice(Math.min(cur.content, indentOf(l))));
        i++; continue;
      }
      break;
    }
    var hasTask = false;
    var lis = items.map(function (item) {
      var ls = item.lines, k = 0;
      while (k < ls.length && !RE.blank.test(ls[k]) && (k === 0 || (!itemOf(ls[k]) && !RE.fence.test(ls[k]) && !RE.quote.test(ls[k]) && !RE.heading.test(ls[k])))) k++;
      var head = ls.slice(0, k), rest = ls.slice(k).join("\n").replace(/^\n+|\n+$/g, "");
      var cls = "", pre = "", t = RE.task.exec(head[0] || "");
      if (t) {
        hasTask = true;
        var done = t[1] !== " ";
        head[0] = t[2];
        cls = ' class="x-task' + (done ? " x-task--done" : "") + '"';
        pre = '<input type="checkbox" disabled' + (done ? " checked" : "") + ' aria-label="' + (done ? "已完成" : "未完成") + '"> ';
      }
      return "<li" + cls + ">" + pre + inlineLines(head) + (rest ? blocks(rest, ctx, 1) : "") + "</li>";
    }).join("");
    var tag = ordered ? "ol" : "ul";
    var startAttr = ordered && first.start !== 1 ? ' start="' + first.start + '"' : "";
    return { html: "<" + tag + startAttr + (hasTask ? ' class="x-tasks"' : "") + ">" + lis + "</" + tag + ">", next: i };
  }

  function codeBlock(lang, code) {
    var cls = lang ? ' class="language-' + esc(lang) + '"' : "";
    return '<div class="x-code"' + (lang ? ' data-lang="' + esc(lang) + '"' : "") + '>' +
      '<div class="x-code__bar"><span class="x-code__lang">' + esc(langLabel(lang)) + "</span>" +
      '<button class="x-copy" type="button" aria-label="复制代码">复制</button></div>' +
      "<pre><code" + cls + ">" + highlight(code, lang) + "</code></pre></div>";
  }

  var RESERVED_IDS = words("top posts archive about");
  function headingId(text, ctx) {
    var base = slugify(text);
    if (RESERVED_IDS[base] || /^x-/.test(base)) base = "h-" + base;
    var id = base, n = 1;
    while (ctx.ids[id]) id = base + "-" + ++n;
    ctx.ids[id] = 1;
    return id;
  }

  function blocks(text, ctx, depth) {
    ctx = ctx || { ids: {}, headings: [] };
    depth = depth || 0;
    var lines = String(text || "").replace(/\r\n?/g, "\n").replace(/\t/g, "    ").split("\n");
    var html = [], i = 0, buf = [], m;
    function flush() { if (buf.length) { html.push(para(buf)); buf = []; } }

    while (i < lines.length) {
      var line = lines[i];

      if ((m = RE.fence.exec(line))) {
        flush();
        var marker = m[1], lang = m[2], code = [], ind = indentOf(line);
        i++;
        while (i < lines.length && !(lines[i].trim().indexOf(marker) === 0 && lines[i].trim().replace(/[`~]/g, "") === "")) {
          code.push(ind ? lines[i].replace(new RegExp("^ {0," + ind + "}"), "") : lines[i]);
          i++;
        }
        i++; // 跳过结束标记（若缺失则到文末）
        html.push(codeBlock(lang, code.join("\n")));
        continue;
      }
      if (RE.blank.test(line)) { flush(); i++; continue; }
      if ((m = RE.heading.exec(line))) {
        flush();
        var lvl = Math.min(m[1].length, 3), id = headingId(m[2], ctx), plain = plainInline(m[2]);
        if (depth === 0 && (lvl === 2 || lvl === 3)) ctx.headings.push({ level: lvl, id: id, text: plain });
        html.push("<h" + lvl + ' id="' + esc(id) + '">' + inline(m[2]) +
          '<a class="x-anchor" href="#' + esc(id) + '" aria-label="链接到本节：' + esc(plain) + '">#</a></h' + lvl + ">");
        i++; continue;
      }
      if (RE.hr.test(line)) { flush(); html.push("<hr>"); i++; continue; }
      if (RE.quote.test(line)) {
        flush();
        var q = [];
        while (i < lines.length && (m = RE.quote.exec(lines[i]))) { q.push(m[1]); i++; }
        html.push("<blockquote>" + blocks(q.join("\n"), ctx, depth + 1) + "</blockquote>");
        continue;
      }
      if (isTableStart(lines, i)) {
        flush();
        var t = table(lines, i);
        html.push(t.html); i = t.next; continue;
      }
      if (itemOf(line) && !(buf.length && indentOf(line) >= 4)) {
        flush();
        var L = list(lines, i, ctx);
        html.push(L.html); i = L.next; continue;
      }
      buf.push(line);
      i++;
    }
    flush();
    return html.join("\n");
  }

  /** 渲染整篇文章：返回 { html, headings }，headings 为顶层 h2 / h3 */
  function renderPost(text) {
    var ctx = { ids: {}, headings: [] };
    var html = blocks(text, ctx, 0);
    return { html: html, headings: ctx.headings };
  }
  function renderMarkdown(text) { return renderPost(text).html; }

  /** 目录 HTML：标题少于 min（默认 3）个时返回空字符串 */
  function tocHtml(headings, min) {
    if (!headings || headings.length < (min || 3)) return "";
    return '<ol class="x-toc__list">' + headings.map(function (h) {
      return '<li class="x-toc__i x-toc__i--' + h.level + '"><a href="#' + esc(h.id) + '" data-toc="' + esc(h.id) + '">' + esc(h.text) + "</a></li>";
    }).join("") + "</ol>";
  }

  /** Markdown → 纯文本（用于站内搜索） */
  function markdownToText(md) {
    return String(md || "")
      .replace(/\r\n?/g, "\n")
      .replace(/^\s*(`{3,}|~{3,}).*$/gm, " ")
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/^\s{0,3}#{1,6}\s+/gm, "")
      .replace(/^\s*>\s?/gm, "")
      .replace(/^\s*([-*+]|\d+[.)])\s+(\[[ xX]\]\s+)?/gm, "")
      .replace(/^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/gm, " ")
      .replace(/\\([\\`*_{}\[\]()#+\-.!|~>])/g, "$1")
      .replace(/(\*\*|__|~~|`)/g, "")
      .replace(/(^|[^\w*])\*([^*\n]+)\*/g, "$1$2")
      .replace(/\|/g, " ")
      .replace(/[ \t]+/g, " ")
      .replace(/\s*\n\s*/g, "\n")
      .trim();
  }

  // 阅读时长：中文约 400 字/分钟，英文单词按 2 个字计
  function readingTime(text) {
    var t = String(text || "").replace(/[#>*_`~\-\[\]()!|]/g, " ");
    var cjk = (t.match(/[\u3400-\u9fff\uf900-\ufaff]/g) || []).length;
    var words = (t.replace(/[\u3400-\u9fff\uf900-\ufaff]/g, " ").match(/[A-Za-z0-9]+/g) || []).length;
    return Math.max(1, Math.ceil((cjk + words * 2) / 400));
  }

  var api = {
    renderMarkdown: renderMarkdown, renderPost: renderPost, tocHtml: tocHtml, markdownToText: markdownToText,
    highlight: highlight, slugify: slugify, readingTime: readingTime, escapeHtml: esc
  };
  root.renderMarkdown = renderMarkdown;
  root.readingTime = readingTime;
  root.Markdown = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : this);

#!/usr/bin/env node
/*
 * build-posts.mjs · 把 posts/*.md 编译成 js/posts.js（零依赖，Node 18+）
 *
 *   node scripts/build-posts.mjs           构建一次
 *   node scripts/build-posts.mjs --watch   监听 posts/ 与 js/site.js，保存即重新构建
 *
 * 每篇文章是 posts/<slug>.md，文件名（去掉 .md）就是文章 id，出现在网址 #post/<slug> 中。
 * 以下划线开头的文件（如 _template.md）不会被构建。
 * front matter 字段：title、date、category、tags、cover、excerpt、featured、emoji（可选）。
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const POSTS_DIR = path.join(ROOT, "posts");
const SITE_FILE = path.join(ROOT, "js", "site.js");
const OUT_FILE = path.join(ROOT, "js", "posts.js");

const REQUIRED = ["title", "date", "category", "excerpt"];
const KNOWN = ["title", "date", "category", "tags", "cover", "excerpt", "featured", "emoji"];
const SLUG_RE = /^[a-z0-9][a-z0-9_-]*$/i;

const color = process.stdout.isTTY && !process.env.NO_COLOR;
const red = (s) => (color ? `\x1b[31m${s}\x1b[0m` : s);
const yellow = (s) => (color ? `\x1b[33m${s}\x1b[0m` : s);
const green = (s) => (color ? `\x1b[32m${s}\x1b[0m` : s);
const rel = (f) => path.relative(ROOT, f).split(path.sep).join("/");

/* ---------------- front matter 解析（YAML 的一个够用子集） ---------------- */
function unquote(v) {
  v = v.trim();
  if (v.length >= 2 && v[0] === '"' && v[v.length - 1] === '"') {
    try { return JSON.parse(v); } catch { return v.slice(1, -1); }
  }
  if (v.length >= 2 && v[0] === "'" && v[v.length - 1] === "'") return v.slice(1, -1).replace(/''/g, "'");
  return v;
}
function splitList(inner) {
  const out = [];
  let cur = "", q = null;
  for (const ch of inner) {
    if (q) { cur += ch; if (ch === q) q = null; continue; }
    if (ch === '"' || ch === "'") { q = ch; cur += ch; continue; }
    if (ch === ",") { out.push(cur); cur = ""; continue; }
    cur += ch;
  }
  if (cur.trim() !== "" || out.length) out.push(cur);
  return out.map(unquote).filter((s) => s !== "");
}
function scalar(raw) {
  const v = raw.trim();
  if (v === "") return "";
  if (v[0] === "[") {
    if (v[v.length - 1] !== "]") return { error: "数组缺少右方括号 ]" };
    return splitList(v.slice(1, -1));
  }
  if (/^(true|false)$/i.test(v)) return v.toLowerCase() === "true";
  return unquote(v);
}

/** 解析单个 Markdown 文件，返回 { data, body, errors, warnings } */
export function parsePost(src, file = "post.md") {
  const errors = [], warnings = [];
  const text = String(src).replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  const lines = text.split("\n");
  if (lines[0].trim() !== "---") {
    errors.push(`第 1 行：文件必须以 --- 开头的 front matter 开始（参考 posts/_template.md）`);
    return { data: {}, body: "", errors, warnings, fatal: true };
  }
  let end = -1;
  for (let i = 1; i < lines.length; i++) if (lines[i].trim() === "---") { end = i; break; }
  if (end < 0) {
    errors.push(`front matter 没有结束：请在字段后面加一行 ---`);
    return { data: {}, body: "", errors, warnings, fatal: true };
  }
  const data = {}, lineOf = {};
  let listKey = null;
  for (let i = 1; i < end; i++) {
    const line = lines[i], n = i + 1;
    if (/^\s*(#.*)?$/.test(line)) continue; // 空行 / 注释
    const item = /^\s+-\s*(.*)$/.exec(line);
    if (item && listKey) { data[listKey].push(unquote(item[1])); continue; }
    const m = /^([A-Za-z_][\w-]*)\s*:(.*)$/.exec(line);
    if (!m) { errors.push(`第 ${n} 行：无法识别「${line.trim()}」，格式应为「字段: 值」`); listKey = null; continue; }
    const key = m[1];
    if (key in data) errors.push(`第 ${n} 行：字段 ${key} 重复出现（第 ${lineOf[key]} 行已写过）`);
    lineOf[key] = n;
    if (m[2].trim() === "") { data[key] = []; listKey = key; continue; } // 可能是 YAML 列表块
    listKey = null;
    const v = scalar(m[2]);
    if (v && v.error) { errors.push(`第 ${n} 行：${key} 的${v.error}`); continue; }
    data[key] = v;
    if (!KNOWN.includes(key)) warnings.push(`第 ${n} 行：未知字段 ${key}（会被忽略）。可用字段：${KNOWN.join("、")}`);
  }
  // 「key:」后面既没有值也没有列表项 → 视为空字符串
  for (const k of Object.keys(data)) if (Array.isArray(data[k]) && data[k].length === 0 && k !== "tags") data[k] = "";
  const body = lines.slice(end + 1).join("\n");
  return { data, body, errors, warnings, lineOf };
}

function validDate(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

/** 校验并整理成 posts.js 中的对象 */
export function toPost(slug, parsed, covers = {}) {
  const { data, body } = parsed;
  const errors = [...parsed.errors], warnings = [...parsed.warnings];
  const at = (k) => (parsed.lineOf && parsed.lineOf[k] ? `第 ${parsed.lineOf[k]} 行：` : "");
  if (!SLUG_RE.test(slug)) errors.push(`文件名「${slug}.md」不合法：只能使用英文字母、数字、短横线和下划线（它就是网址里的文章 id）`);
  if (parsed.fatal) return { post: null, errors, warnings };
  for (const k of REQUIRED) {
    if (data[k] === undefined) errors.push(`缺少必填字段 ${k}`);
    else if (typeof data[k] !== "string" || data[k].trim() === "") errors.push(`${at(k)}${k} 不能为空，且必须是文字`);
  }
  if (typeof data.date === "string" && data.date && !validDate(data.date)) errors.push(`${at("date")}date「${data.date}」不是有效日期，格式必须是 YYYY-MM-DD，例如 2026-10-08`);
  let tags = data.tags === undefined || data.tags === "" ? [] : data.tags;
  if (typeof tags === "string") tags = splitList(tags); // 兼容 tags: a, b
  if (!Array.isArray(tags)) errors.push(`${at("tags")}tags 必须是数组，例如 tags: [旅行, 日本]`);
  else {
    tags = tags.map((t) => String(t).trim()).filter(Boolean);
    const dup = tags.filter((t, i) => tags.indexOf(t) !== i);
    if (dup.length) warnings.push(`${at("tags")}标签重复：${[...new Set(dup)].join("、")}（已去重）`);
    tags = [...new Set(tags)];
  }
  if (data.featured !== undefined && data.featured !== "" && typeof data.featured !== "boolean") errors.push(`${at("featured")}featured 只能是 true 或 false`);
  if (data.cover !== undefined && typeof data.cover !== "string") errors.push(`${at("cover")}cover 必须是预设名（如 aurora）、CSS 渐变或图片路径`);
  if (data.emoji !== undefined && typeof data.emoji !== "string") errors.push(`${at("emoji")}emoji 必须是文字`);
  const text = body.trim();
  if (!text) warnings.push(`正文为空`);

  const post = { id: slug, title: data.title, date: data.date, category: data.category, tags };
  if (data.cover) {
    const c = String(data.cover).trim();
    if (Object.prototype.hasOwnProperty.call(covers, c)) post.cover = covers[c];
    else {
      if (/^[a-z]+$/.test(c)) warnings.push(`${at("cover")}cover「${c}」不是已知的预设名（${Object.keys(covers).join(" / ")}），将按图片路径处理`);
      post.cover = c;
    }
  }
  if (data.emoji) post.emoji = data.emoji;
  post.excerpt = data.excerpt;
  post.featured = data.featured === true;
  post.body = "\n" + text + "\n";
  return { post, errors, warnings };
}

function loadCovers() {
  try {
    const ctx = { window: {} };
    vm.createContext(ctx);
    vm.runInContext(fs.readFileSync(SITE_FILE, "utf8"), ctx, { filename: "js/site.js" });
    return ctx.window.COVERS || {};
  } catch (e) {
    console.warn(yellow(`⚠ 读取 js/site.js 中的封面预设失败：${e.message}`));
    return {};
  }
}

/** 构建：返回 { ok, count }；出错时不覆盖 js/posts.js */
export function build({ quiet = false } = {}) {
  const t0 = Date.now();
  if (!fs.existsSync(POSTS_DIR)) {
    console.error(red(`✖ 找不到 posts/ 目录：${POSTS_DIR}`));
    return { ok: false, count: 0 };
  }
  const covers = loadCovers();
  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith(".md") && !f.startsWith("_") && !f.startsWith(".")).sort();
  const posts = [], problems = [];
  let warnCount = 0;
  for (const f of files) {
    const full = path.join(POSTS_DIR, f);
    const slug = f.slice(0, -3);
    const res = toPost(slug, parsePost(fs.readFileSync(full, "utf8"), f), covers);
    if (res.errors.length) problems.push({ file: rel(full), errors: res.errors });
    for (const w of res.warnings) { warnCount++; console.warn(yellow(`⚠ ${rel(full)}：${w}`)); }
    if (!res.errors.length) posts.push(res.post);
  }
  if (problems.length) {
    console.error(red(`\n✖ 构建失败：${problems.length} 个文件有错误，js/posts.js 未更新。\n`));
    for (const p of problems) {
      console.error(red(`  ${p.file}`));
      for (const e of p.errors) console.error(red(`    - ${e}`));
    }
    console.error("");
    return { ok: false, count: posts.length };
  }
  // 日期从新到旧；同一天按文件名排序，保证结果稳定
  posts.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const featured = posts.filter((p) => p.featured);
  if (featured.length > 1) { warnCount++; console.warn(yellow(`⚠ 有 ${featured.length} 篇 featured: true，首页只展示最新的一篇：${featured[0].title}`)); }

  const json = JSON.stringify(posts, null, 2)
    .replace(/<\/(script)/gi, "<\\/$1") // 内联进单文件 HTML 时也安全
    .replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
  const out =
    "/*\n" +
    " * posts.js · 由 scripts/build-posts.mjs 自动生成，请勿手动修改！\n" +
    " * 编辑文章：修改 posts/*.md，然后运行 npm run build（或 npm run watch 自动构建）。\n" +
    " */\n" +
    "window.POSTS = " + json + ";\n";
  const prev = fs.existsSync(OUT_FILE) ? fs.readFileSync(OUT_FILE, "utf8") : null;
  if (prev !== out) fs.writeFileSync(OUT_FILE, out);
  if (!quiet) console.log(green(`✔ 已生成 js/posts.js：${posts.length} 篇文章${warnCount ? `，${warnCount} 条提醒` : ""}（${Date.now() - t0}ms${prev === out ? "，内容无变化" : ""}）`));
  return { ok: true, count: posts.length };
}

function watch() {
  build();
  console.log(`👀 正在监听 posts/ 与 js/site.js 的变化，按 Ctrl+C 退出…`);
  let timer = null;
  const again = (why) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      console.log(`\n[${new Date().toLocaleTimeString("zh-CN", { hour12: false })}] ${why} 有变化，重新构建…`);
      build();
    }, 120);
  };
  fs.watch(POSTS_DIR, (ev, name) => { if (!name || name.endsWith(".md")) again(name ? `posts/${name}` : "posts/"); });
  fs.watch(SITE_FILE, () => again("js/site.js"));
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const args = process.argv.slice(2);
  if (args.includes("-h") || args.includes("--help")) {
    console.log("用法：node scripts/build-posts.mjs [--watch]\n  --watch, -w  监听文件变化并自动重新构建");
  } else if (args.includes("--watch") || args.includes("-w")) {
    watch();
  } else {
    const r = build();
    process.exitCode = r.ok ? 0 : 1;
  }
}

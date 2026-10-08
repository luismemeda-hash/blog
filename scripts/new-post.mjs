#!/usr/bin/env node
/*
 * new-post.mjs · 新建文章（零依赖）
 *
 *   npm run new -- 我的新文章
 *   npm run new -- "Hello World"            → posts/hello-world.md
 *   npm run new -- 京都游记 --slug kyoto     → posts/kyoto.md
 *
 * 以 posts/_template.md 为模板，自动填入标题和今天的日期（本地时区）。
 * 文件名（slug）就是文章网址 #post/<slug>：
 *   - 标题里的英文 / 数字会转成小写短横线形式；
 *   - 纯中文标题没有可用的英文，会用日期生成，如 2026-10-08-post，之后可自行改名。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const POSTS_DIR = path.join(ROOT, "posts");
const TEMPLATE = path.join(POSTS_DIR, "_template.md");

export function slugify(title) {
  return String(title)
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
}
function today() {
  const d = new Date(), p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
function yamlString(s) {
  // 含特殊字符时加引号，保证 front matter 能被正确解析
  return /^[\s"'\[{>|*&!%@`#-]|:\s|\s#|^(true|false)$/i.test(s) || /\s$/.test(s) ? JSON.stringify(s) : s;
}

const args = process.argv.slice(2);
let slugArg = null;
const words = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--slug" || args[i] === "-s") slugArg = args[++i];
  else if (args[i].startsWith("--slug=")) slugArg = args[i].slice(7);
  else words.push(args[i]);
}
const title = words.join(" ").trim();
if (!title) {
  console.error("✖ 请提供文章标题，例如：npm run new -- 我的新文章\n  可选：--slug my-new-post 指定文件名（网址）");
  process.exit(1);
}
const date = today();
let slug = slugArg ? slugify(slugArg) : slugify(title);
if (slugArg && !slug) { console.error(`✖ --slug「${slugArg}」不合法：只能包含英文字母、数字和短横线`); process.exit(1); }
if (!slug) slug = `${date}-post`;
let file = path.join(POSTS_DIR, `${slug}.md`);
for (let n = 2; fs.existsSync(file); n++) file = path.join(POSTS_DIR, `${slug}-${n}.md`);

const tpl = fs.existsSync(TEMPLATE)
  ? fs.readFileSync(TEMPLATE, "utf8")
  : "---\ntitle: 标题\ndate: 2026-01-01\ncategory: 随笔\ntags: []\ncover: aurora\nexcerpt: 摘要\nfeatured: false\n---\n\n正文\n";
const out = tpl
  .replace(/^title:.*$/m, `title: ${yamlString(title)}`)
  .replace(/^date:.*$/m, `date: ${date}`)
  // 去掉模板顶部关于模板本身的注释
  .replace(/^(---\n)(#[^\n]*\n)+/, "$1");
fs.mkdirSync(POSTS_DIR, { recursive: true });
fs.writeFileSync(file, out);
const rel = path.relative(ROOT, file).split(path.sep).join("/");
console.log(`✔ 已创建 ${rel}\n  网址：#post/${path.basename(file, ".md")}\n  写完后运行 npm run build（或 npm run watch 边写边构建）。`);

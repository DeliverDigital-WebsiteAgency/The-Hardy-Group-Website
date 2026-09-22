// Blog content lives in the repo as Markdown:
//   content/authors/<slug>.md  — author profile (front matter + bio)
//   content/blog/<slug>.md     — blog post (front matter + body)
// Files starting with "_" are ignored (templates/notes).
// Everything is read once at startup; in development it re-reads on each request
// so edits show up without a restart.

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import matter from 'gray-matter';
import { marked } from 'marked';
import { config } from './config.js';

const ROOT = 'content';
export const POSTS_PER_PAGE = 9;

function readDir(dir) {
  const full = join(ROOT, dir);
  if (!existsSync(full)) return [];
  return readdirSync(full)
    .filter((f) => f.endsWith('.md') && !f.startsWith('_'))
    .map((f) => ({ file: join(full, f), slug: basename(f, '.md'), ...matter(readFileSync(join(full, f), 'utf8')) }));
}

const plainText = (html) =>
  html.replace(/<[^>]*>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();

function summarize(html, max = 160) {
  const firstPara = html.match(/<p>([\s\S]*?)<\/p>/)?.[1] ?? html;
  const text = plainText(firstPara);
  if (text.length <= max) return text;
  return text.slice(0, text.lastIndexOf(' ', max)) + '…';
}

function load() {
  const authors = new Map();
  for (const a of readDir('authors')) {
    authors.set(a.slug, {
      slug: a.slug,
      name: a.data.name || a.slug,
      photo: a.data.photo || null,
      bio: a.content.trim() ? plainText(marked.parse(a.content)) : '',
    });
  }

  const posts = [];
  for (const p of readDir('blog')) {
    const { data } = p;
    const date = data.date ? new Date(data.date) : null;
    const problems = [];
    if (!data.title) problems.push('missing "title"');
    if (!date || Number.isNaN(date.getTime())) problems.push('missing or invalid "date"');
    if (!authors.has(data.author)) problems.push(`unknown author "${data.author}" (add content/authors/${data.author}.md)`);
    if (problems.length) {
      console.error(`[content] Skipping ${p.file}: ${problems.join('; ')}`);
      continue;
    }
    if (data.draft) continue;

    const html = marked.parse(p.content);
    posts.push({
      slug: data.slug || p.slug,
      title: String(data.title),
      date: date.toISOString(),
      modified: data.updated ? new Date(data.updated).toISOString() : date.toISOString(),
      excerpt: data.excerpt || summarize(html),
      content: html,
      readingMinutes: Math.max(1, Math.round(plainText(html).split(' ').length / 225)),
      author: authors.get(data.author),
      image: data.image ? { url: data.image, alt: data.imageAlt || '' } : null,
    });
  }

  // Newest first; future-dated posts stay hidden until their date arrives.
  posts.sort((a, b) => b.date.localeCompare(a.date));
  return { authors, posts };
}

let store = load();
console.log(`[content] Loaded ${store.posts.length} posts, ${store.authors.size} authors`);

function current() {
  if (!config.isProd) store = load();
  const now = new Date().toISOString();
  return { authors: store.authors, posts: store.posts.filter((p) => p.date <= now) };
}

function paginate(list, page) {
  const totalPages = Math.max(1, Math.ceil(list.length / POSTS_PER_PAGE));
  const posts = list.slice((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE);
  return { posts, totalPages, total: list.length };
}

export function getPosts({ page = 1, authorSlug } = {}) {
  let { posts } = current();
  if (authorSlug) posts = posts.filter((p) => p.author.slug === authorSlug);
  return paginate(posts, page);
}

export function getPostBySlug(slug) {
  return current().posts.find((p) => p.slug === slug) || null;
}

export function getAuthorBySlug(slug) {
  return current().authors.get(slug) || null;
}

export function getAllPosts() {
  return current().posts;
}

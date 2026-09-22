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

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
const plainText = (html) =>
  html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(n))
    .replace(/&([a-z]+);/gi, (m, name) => ENTITIES[name.toLowerCase()] ?? m)
    .replace(/\s+/g, ' ')
    .trim();

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
      jobTitle: a.data.jobTitle || null,
      photo: a.data.photo || null,
      bio: a.content.trim() ? plainText(marked.parse(a.content)) : '',
    });
  }

  const posts = [];
  for (const p of readDir('blog')) {
    const { data } = p;
    const date = data.date ? new Date(data.date) : null;
    // "author: dick-hardy" or "authors: [dick-hardy, jonathan-hardy]"
    const authorSlugs = [].concat(data.authors ?? data.author ?? []);
    const problems = [];
    if (!data.title) problems.push('missing "title"');
    if (!date || Number.isNaN(date.getTime())) problems.push('missing or invalid "date"');
    if (!authorSlugs.length) problems.push('missing "author"');
    for (const slug of authorSlugs) {
      if (!authors.has(slug)) problems.push(`unknown author "${slug}" (add content/authors/${slug}.md)`);
    }
    if (problems.length) {
      console.error(`[content] Skipping ${p.file}: ${problems.join('; ')}`);
      continue;
    }
    if (data.draft) continue;

    const html = marked.parse(p.content);
    const summary = summarize(html);
    posts.push({
      slug: data.slug || p.slug,
      title: String(data.title),
      seoTitle: data.seoTitle ? String(data.seoTitle) : null, // <title>/search result title; the H1 stays `title`
      date: date.toISOString(),
      modified: data.updated ? new Date(data.updated).toISOString() : date.toISOString(),
      description: data.description || data.excerpt || summary, // meta description (aim for ≤155 chars)
      excerpt: data.excerpt || data.description || summary, // blog card text
      content: html,
      markdown: p.content.trim(),
      wordCount: plainText(html).split(' ').length,
      readingMinutes: Math.max(1, Math.round(plainText(html).split(' ').length / 225)),
      authors: authorSlugs.map((s) => authors.get(s)),
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
  if (authorSlug) posts = posts.filter((p) => p.authors.some((a) => a.slug === authorSlug));
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

export function getLatestPosts(limit = 3) {
  return current().posts.slice(0, limit);
}

export function getAllAuthors() {
  return [...current().authors.values()];
}

// Other posts to link from a post: ones sharing an author first, then newest.
export function getRelatedPosts(post, limit = 3) {
  const others = current().posts.filter((p) => p.slug !== post.slug);
  const shares = (p) => p.authors.some((a) => post.authors.some((b) => b.slug === a.slug));
  return [...others.filter(shares), ...others.filter((p) => !shares(p))].slice(0, limit);
}

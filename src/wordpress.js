// Thin client for the headless WordPress REST API at cms.thehardygroup.org.
// Responses are cached in memory; if WordPress is unreachable, the last good
// copy is served so the public site keeps working.

import { config } from './config.js';

const API = `${config.wpUrl}/wp-json/wp/v2`;
const cache = new Map(); // url -> { at, data }

export class CmsUnavailableError extends Error {}

async function wpFetch(path) {
  const url = `${API}${path}`;
  const hit = cache.get(url);
  if (hit && Date.now() - hit.at < config.cacheTtlMs) return hit.data;

  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
    if (res.status === 400 && /[?&]page=/.test(path)) {
      // WordPress answers 400 for a page number past the end.
      return { items: [], totalPages: 0, total: 0 };
    }
    if (!res.ok) throw new Error(`WordPress ${res.status} for ${url}`);
    const data = {
      items: await res.json(),
      totalPages: Number(res.headers.get('x-wp-totalpages')) || 1,
      total: Number(res.headers.get('x-wp-total')) || 0,
    };
    cache.set(url, { at: Date.now(), data });
    return data;
  } catch (err) {
    if (hit) {
      console.warn(`[cms] ${err.message} — serving stale cache`);
      return hit.data;
    }
    console.error(`[cms] ${err.message}`);
    throw new CmsUnavailableError(err.message);
  }
}

export function clearCache() {
  cache.clear();
}

// --- Normalizers: turn raw WP JSON into the shape the templates use. ---

const stripTags = (html = '') =>
  html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

const decodeEntities = (s = '') =>
  s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#039;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&hellip;/g, '…');

const plain = (html) => decodeEntities(stripTags(html));

function normalizeAuthor(a) {
  if (!a || a.code) return null; // embedded error object (e.g. author has no published posts)
  const avatars = a.avatar_urls || {};
  const largest = Object.keys(avatars).map(Number).sort((x, y) => y - x)[0];
  return {
    id: a.id,
    name: a.name,
    slug: a.slug,
    bio: a.description || '',
    avatar: largest ? avatars[largest] : null,
  };
}

function normalizePost(p) {
  const author = normalizeAuthor(p._embedded?.author?.[0]);
  const media = p._embedded?.['wp:featuredmedia']?.[0];
  const text = plain(p.content?.rendered);
  return {
    id: p.id,
    slug: p.slug,
    title: plain(p.title?.rendered),
    excerpt: plain(p.excerpt?.rendered).replace(/\s*\[…\]$|\s*…$/, '…'),
    content: p.content?.rendered || '',
    date: p.date,
    modified: p.modified,
    readingMinutes: Math.max(1, Math.round(text.split(' ').length / 225)),
    author,
    image: media && !media.code
      ? { url: media.source_url, alt: media.alt_text || '', width: media.media_details?.width, height: media.media_details?.height }
      : null,
  };
}

// --- Public API ---

export const POSTS_PER_PAGE = 9;

export async function getPosts({ page = 1, authorId } = {}) {
  const params = new URLSearchParams({
    _embed: 'author,wp:featuredmedia',
    per_page: String(POSTS_PER_PAGE),
    page: String(page),
    status: 'publish',
  });
  if (authorId) params.set('author', String(authorId));
  const { items, totalPages, total } = await wpFetch(`/posts?${params}`);
  return { posts: items.map(normalizePost), totalPages, total };
}

export async function getPostBySlug(slug) {
  const params = new URLSearchParams({ slug, _embed: 'author,wp:featuredmedia' });
  const { items } = await wpFetch(`/posts?${params}`);
  return items[0] ? normalizePost(items[0]) : null;
}

export async function getAuthorBySlug(slug) {
  const { items } = await wpFetch(`/users?${new URLSearchParams({ slug })}`);
  return items[0] ? normalizeAuthor(items[0]) : null;
}

// Every published post (for the sitemap). Walks pages 100 at a time.
export async function getAllPostSlugs() {
  const out = [];
  for (let page = 1; ; page++) {
    const params = new URLSearchParams({ per_page: '100', page: String(page), _fields: 'slug,modified' });
    const { items, totalPages } = await wpFetch(`/posts?${params}`);
    out.push(...items);
    if (page >= totalPages) break;
  }
  return out;
}

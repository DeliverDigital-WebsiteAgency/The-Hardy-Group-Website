import express from 'express';
import compression from 'compression';
import nunjucks from 'nunjucks';
import { config } from './src/config.js';
import { site } from './src/site.js';
import {
  getPosts, getPostBySlug, getAuthorBySlug, getAllPosts, getAllAuthors, getLatestPosts, getRelatedPosts,
} from './src/content.js';
import * as schema from './src/schema.js';

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', true);
app.use(compression());

// --- Templates ---
const env = nunjucks.configure('views', {
  autoescape: true,
  express: app,
  noCache: !config.isProd,
});
env.addFilter('date', (iso) =>
  new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }));
env.addFilter('json', (v) => JSON.stringify(v).replace(/</g, '\\u003c'));
app.set('view engine', 'njk');

app.use((req, res, next) => {
  res.locals.site = site;
  res.locals.canonical = config.siteUrl + req.path.replace(/\/+$/, '');
  res.locals.year = new Date().getFullYear();
  next();
});

// --- Static assets ---
app.use(express.static('public', { maxAge: config.isProd ? '7d' : 0 }));
app.get('/favicon.ico', (req, res) => res.redirect(301, '/favicon.svg'));

// --- Redirects from the old static .html URLs ---
const legacy = {
  '/TheHardyGroup.html': '/',
  '/index.html': '/',
  '/blog.html': '/blog',
  '/personal-coaching.html': '/personal-coaching',
};
app.use((req, res, next) => (legacy[req.path] ? res.redirect(301, legacy[req.path]) : next()));

// --- Static pages ---
app.get('/', (req, res) => res.render('home.njk', {
  canonical: config.siteUrl + '/',
  latestPosts: getLatestPosts(3),
  jsonld: [schema.organization(), schema.website()],
}));

app.get('/personal-coaching', (req, res) => res.render('personal-coaching.njk', {
  latestPosts: getLatestPosts(3),
  jsonld: [schema.coachingService(), schema.breadcrumbs([['Home', '/'], ['Lead Pastor Coaching', '/personal-coaching']])],
}));

const legalPages = {
  privacy: 'Privacy Policy',
  terms: 'Terms and Conditions',
  eula: 'End User License Agreement',
  accessibility: 'Accessibility Statement',
};
for (const [slug, name] of Object.entries(legalPages)) {
  app.get(`/${slug}`, (req, res) => res.render(`legal/${slug}.njk`, {
    jsonld: [schema.breadcrumbs([['Home', '/'], [name, `/${slug}`]])],
  }));
}

// --- Blog (Markdown files in content/) ---
const pageNum = (v) => Math.max(1, parseInt(v, 10) || 1);
// Paginated pages are canonical to themselves, not to page 1.
const pagedCanonical = (path, page) => config.siteUrl + path + (page > 1 ? `?page=${page}` : '');

app.get('/blog', (req, res, next) => {
  const page = pageNum(req.query.page);
  const data = getPosts({ page });
  if (page > data.totalPages) return next();
  res.render('blog/index.njk', {
    ...data,
    page,
    canonical: pagedCanonical('/blog', page),
    jsonld: [schema.breadcrumbs([['Home', '/'], ['Blog', '/blog']])],
  });
});

app.get('/blog/author/:slug', (req, res, next) => {
  const author = getAuthorBySlug(req.params.slug);
  if (!author) return next();
  const page = pageNum(req.query.page);
  const data = getPosts({ page, authorSlug: author.slug });
  if (page > data.totalPages) return next();
  const path = `/blog/author/${author.slug}`;
  res.render('blog/author.njk', {
    author,
    ...data,
    page,
    canonical: pagedCanonical(path, page),
    jsonld: [schema.profilePage(author), schema.breadcrumbs([['Home', '/'], ['Blog', '/blog'], [author.name, path]])],
  });
});

app.get('/blog/:slug', (req, res, next) => {
  const post = getPostBySlug(req.params.slug);
  if (!post) return next();
  res.render('blog/post.njk', {
    post,
    relatedPosts: getRelatedPosts(post, 3),
    ogImage: post.image && new URL(post.image.url, config.siteUrl).href,
    jsonld: [
      schema.blogPosting(post),
      schema.breadcrumbs([['Home', '/'], ['Blog', '/blog'], [post.title, `/blog/${post.slug}`]]),
    ],
  });
});

// --- SEO plumbing ---
app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(`User-agent: *\nAllow: /\n\nSitemap: ${config.siteUrl}/sitemap.xml\n`);
});

app.get('/sitemap.xml', (req, res) => {
  const posts = getAllPosts();
  const latest = posts[0]?.modified.slice(0, 10);
  const urls = [
    { loc: '/', lastmod: latest },
    { loc: '/personal-coaching' },
    { loc: '/blog', lastmod: latest },
    ...posts.map((p) => ({ loc: `/blog/${p.slug}`, lastmod: p.modified.slice(0, 10) })),
    ...getAllAuthors().map((a) => ({ loc: `/blog/author/${a.slug}` })),
    ...Object.keys(legalPages).map((slug) => ({ loc: `/${slug}` })),
  ];
  const body = urls
    .map((u) => `  <url><loc>${config.siteUrl}${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`)
    .join('\n');
  res.type('application/xml').send(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`);
});

// llms.txt (https://llmstxt.org): a plain-Markdown map of the site for AI assistants.
// Generated from content/, so new posts appear automatically.
const byline = (p) => p.authors.map((a) => a.name).join(' & ');

app.get('/llms.txt', (req, res) => {
  const u = (path) => config.siteUrl + path;
  const lines = [
    `# ${site.name}`,
    '',
    `> ${site.description}`,
    '',
    `${site.name} (legal name: ${site.legalName}) is based in ${site.address.city}, Missouri, and was co-founded by Dick Hardy and Jonathan Hardy. `
      + 'It offers one-on-one coaching for lead pastors and publishes practical articles on pastoral leadership, church board governance, volunteers, and ministry decisions. '
      + `Contact: ${site.email}.`,
    '',
    '## Services',
    '',
    `- [Lead Pastor Personal Coaching](${u('/personal-coaching')}): Dick Hardy serves the lead pastor as a non-resident executive staff member for directional, leadership, board development, and ministry decisions.`,
    `- [Home](${u('/')}): Overview of pastoral leadership, church board leadership, volunteer ministry, and coaching.`,
    '',
    '## Articles',
    '',
    ...getAllPosts().map((p) => `- [${p.title}](${u(`/blog/${p.slug}`)}): ${p.description} (by ${byline(p)}, ${p.date.slice(0, 10)})`),
    '',
    '## Authors',
    '',
    ...getAllAuthors().map((a) => `- [${a.name}](${u(`/blog/author/${a.slug}`)})${a.bio ? `: ${a.bio}` : ''}`),
    '',
    '## Optional',
    '',
    `- [Full article text](${u('/llms-full.txt')}): Every article in full, as Markdown.`,
    `- [Terms and Conditions](${u('/terms')}): Includes the permission terms for sharing our articles.`,
    `- [Privacy Policy](${u('/privacy')})`,
    '',
  ];
  res.type('text/plain; charset=utf-8').send(lines.join('\n'));
});

app.get('/llms-full.txt', (req, res) => {
  const parts = [`# ${site.name}: full article text`, '', `> ${site.description}`, ''];
  for (const p of getAllPosts()) {
    parts.push(
      '---', '',
      `# ${p.title}`, '',
      `URL: ${config.siteUrl}/blog/${p.slug}`,
      `Authors: ${byline(p)}`,
      `Published: ${p.date.slice(0, 10)}`, '',
      p.markdown, '',
    );
  }
  res.type('text/plain; charset=utf-8').send(parts.join('\n'));
});

// --- Errors ---
app.use((req, res) => res.status(404).render('404.njk'));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('500.njk');
});

app.listen(config.port, () => {
  console.log(`The Hardy Group running on port ${config.port}`);
});

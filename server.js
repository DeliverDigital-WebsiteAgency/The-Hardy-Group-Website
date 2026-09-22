import express from 'express';
import compression from 'compression';
import nunjucks from 'nunjucks';
import { config } from './src/config.js';
import { getPosts, getPostBySlug, getAuthorBySlug, getAllPosts } from './src/content.js';

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
  res.locals.site = { url: config.siteUrl, name: 'The Hardy Group', email: 'info@thehardygroup.org' };
  res.locals.canonical = config.siteUrl + req.path.replace(/\/+$/, '');
  res.locals.year = new Date().getFullYear();
  next();
});

// --- Static assets ---
app.use(express.static('public', { maxAge: config.isProd ? '7d' : 0 }));

// --- Redirects from the old static .html URLs ---
const legacy = {
  '/TheHardyGroup.html': '/',
  '/index.html': '/',
  '/blog.html': '/blog',
  '/personal-coaching.html': '/personal-coaching',
};
app.use((req, res, next) => (legacy[req.path] ? res.redirect(301, legacy[req.path]) : next()));

// --- Static pages ---
app.get('/', (req, res) => res.render('home.njk', { canonical: config.siteUrl + '/' }));
app.get('/personal-coaching', (req, res) => res.render('personal-coaching.njk'));
app.get('/privacy', (req, res) => res.render('legal/privacy.njk'));
app.get('/terms', (req, res) => res.render('legal/terms.njk'));
app.get('/eula', (req, res) => res.render('legal/eula.njk'));

// --- Blog (Markdown files in content/) ---
const pageNum = (v) => Math.max(1, parseInt(v, 10) || 1);

app.get('/blog', (req, res, next) => {
  const page = pageNum(req.query.page);
  const data = getPosts({ page });
  if (page > data.totalPages) return next();
  res.render('blog/index.njk', { ...data, page });
});

app.get('/blog/author/:slug', (req, res, next) => {
  const author = getAuthorBySlug(req.params.slug);
  if (!author) return next();
  const page = pageNum(req.query.page);
  const data = getPosts({ page, authorSlug: author.slug });
  if (page > data.totalPages) return next();
  res.render('blog/author.njk', { author, ...data, page });
});

app.get('/blog/:slug', (req, res, next) => {
  const post = getPostBySlug(req.params.slug);
  if (!post) return next();
  const imageUrl = post.image && new URL(post.image.url, config.siteUrl).href;
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    dateModified: post.modified,
    mainEntityOfPage: res.locals.canonical,
    image: imageUrl,
    author: {
      '@type': 'Person',
      name: post.author.name,
      url: `${config.siteUrl}/blog/author/${post.author.slug}`,
    },
    publisher: { '@type': 'Organization', name: 'The Hardy Group', url: config.siteUrl },
  };
  res.render('blog/post.njk', { post, schema, ogImage: imageUrl });
});

// --- SEO plumbing ---
app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(`User-agent: *\nAllow: /\n\nSitemap: ${config.siteUrl}/sitemap.xml\n`);
});

app.get('/sitemap.xml', (req, res) => {
  const urls = ['/', '/personal-coaching', '/blog', '/privacy', '/terms', '/eula'].map((p) => ({ loc: config.siteUrl + p }));
  for (const p of getAllPosts()) {
    urls.push({ loc: `${config.siteUrl}/blog/${p.slug}`, lastmod: p.modified.slice(0, 10) });
  }
  const body = urls
    .map((u) => `  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`)
    .join('\n');
  res.type('application/xml').send(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`);
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

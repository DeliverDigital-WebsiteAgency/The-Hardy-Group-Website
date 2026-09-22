# The Hardy Group — website

This is a Node/Express site for **thehardygroup.org**. The blog uses **headless WordPress** at **cms.thehardygroup.org**:

- WordPress only stores and edits the **blog posts and authors**. Nobody visits the WordPress theme; the mu-plugin redirects any visit to this site.
- This Node app renders every public page. Blog content comes from the WordPress REST API (`/wp-json/wp/v2`) and is cached in memory.
- The home page, Personal Coaching, and the legal pages are templates in this repo.

```
server.js              Express app: routes, redirects, sitemap, cache-purge hook
src/config.js          Environment variables
src/wordpress.js       WordPress REST client (with caching and stale-on-error)
views/                 Nunjucks templates (layout, pages, blog, legal)
public/                Static files (CSS, images)
wordpress/             Must-use plugin that switches WordPress to headless mode
```

## Routes

| URL | Source |
| --- | --- |
| `/` | `views/home.njk` |
| `/personal-coaching` | `views/personal-coaching.njk` |
| `/blog` | WordPress posts, 9 per page (`?page=2`…) |
| `/blog/:slug` | Single WordPress post, with author box and BlogPosting schema |
| `/blog/author/:slug` | Author bio and posts (the slug is the WP user's "nicename") |
| `/privacy`, `/terms`, `/eula` | `views/legal/*.njk` |
| `/sitemap.xml`, `/robots.txt` | Generated; the sitemap includes every published post |
| `POST /api/revalidate` | Clears the CMS cache. WordPress calls it on publish/update |

The old `.html` URLs (`/TheHardyGroup.html`, `/blog.html`, `/personal-coaching.html`) 301-redirect to the new ones.

If WordPress is unreachable, the blog serves the last cached copy. If nothing has been cached yet, it shows the "First posts are on the way" message instead of erroring.

## Local development

```bash
npm install
cp .env.example .env     # then edit values
npm run dev              # http://localhost:3000, restarts on file changes
```

## Deploying on SiteGround (Node.js + GitHub)

1. Push this repo to GitHub, then connect it to the Node.js app in SiteGround Site Tools.
2. **Start command:** `npm start` (entry file: `server.js`). The app listens on the `PORT` SiteGround provides.
3. **Node version:** 20.12 or newer.
4. **Environment variables** (Site Tools → your Node app):
   - `NODE_ENV=production`
   - `SITE_URL=https://thehardygroup.org`
   - `WP_URL=https://cms.thehardygroup.org`
   - `CMS_CACHE_TTL=300`
   - `REVALIDATE_SECRET=<long random string>`. Use the same value in WordPress's `wp-config.php`.
5. Set up WordPress on `cms.thehardygroup.org`. See [wordpress/README.md](wordpress/README.md).

## Not in the repo

`.gitignore` excludes the source material in the project root: blog drafts in `Blogs/`, the old static HTML prototypes, the .docx/.rtf legal files, and the screenshots. It stays on your computer but never gets pushed or deployed.

# The Hardy Group — website

This is a Node/Express site for **thehardygroup.org**, deployed from GitHub to SiteGround's Node.js hosting. Blog posts and authors are Markdown files in this repo. There's no database or CMS: to publish, commit a file and push.

```
server.js              Express app: routes, redirects, sitemap
src/config.js          Environment variables
src/content.js         Loads blog posts + authors from content/
content/blog/          One .md file per post (see _TEMPLATE.md)
content/authors/       One .md file per author
views/                 Nunjucks templates (layout, pages, blog, legal)
public/                Static files (CSS, images)
```

## Adding a blog post

1. Copy `content/blog/_TEMPLATE.md` to `content/blog/<slug>.md`. The filename becomes the URL, e.g. `/blog/motivating-volunteers`.
2. Fill in the front matter:

   | Field | Required | Notes |
   | --- | --- | --- |
   | `title` | yes | |
   | `date` | yes | `YYYY-MM-DD`. Future-dated posts stay hidden until that date (checked after each restart/deploy). |
   | `author` | yes | Must match a file in `content/authors/`, e.g. `dick-hardy` or `jonathan-hardy` |
   | `excerpt` | no | Summary for the blog list and search results. Defaults to the first paragraph. |
   | `image`, `imageAlt` | no | Featured image, e.g. `/images/blog/foo.jpg` stored in `public/images/blog/` |
   | `updated` | no | Date of a meaningful revision |
   | `draft` | no | `true` keeps the post off the site |

3. Write the post in Markdown below the front matter.
4. Commit and push. SiteGround redeploys, and the post is live.

If a post has a missing title, a bad date, or an unknown author, it is **skipped**, not published, and the reason is logged as `[content] Skipping ...`.

## Adding or editing an author

Create `content/authors/<slug>.md`:

```md
---
name: Dick Hardy
photo: /images/authors/dick-hardy.jpg   # optional; file in public/images/authors/
---
Short bio shown under each of their posts and on /blog/author/dick-hardy.
```

## Routes

| URL | Source |
| --- | --- |
| `/` | `views/home.njk` |
| `/personal-coaching` | `views/personal-coaching.njk` |
| `/blog` | All posts, newest first, 9 per page (`?page=2`…) |
| `/blog/:slug` | Single post, with author box and BlogPosting schema |
| `/blog/author/:slug` | Author bio and posts |
| `/privacy`, `/terms`, `/eula` | `views/legal/*.njk` |
| `/sitemap.xml`, `/robots.txt` | Generated; the sitemap includes every published post |

The old `.html` URLs (`/TheHardyGroup.html`, `/blog.html`, `/personal-coaching.html`) 301-redirect to the new ones.

## Local development

```bash
npm install
cp .env.example .env
npm run dev              # http://localhost:3000, re-reads content on every request
```

## Deploying on SiteGround (Node.js + GitHub)

1. Push this repo to GitHub, then connect it to the Node.js app in SiteGround Site Tools.
2. **Start command:** `npm start` (entry file: `server.js`). The app listens on the `PORT` SiteGround provides.
3. **Node version:** 20.12 or newer.
4. **Environment variables:** `NODE_ENV=production`, `SITE_URL=https://thehardygroup.org`.

## Not in the repo

`.gitignore` excludes the source material in the project root: blog drafts in `Blogs/`, the old static HTML prototypes, the .docx/.rtf legal files, and the screenshots. It stays on your computer but never gets pushed or deployed.

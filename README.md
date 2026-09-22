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
   | `authors` | yes | One or more files in `content/authors/`, e.g. `[dick-hardy, jonathan-hardy]`. A single `author: dick-hardy` also works. |
   | `description` | recommended | 120–155 character summary for Google and the blog list. Defaults to the first paragraph, which usually gets cut off. |
   | `seoTitle` | if long title | Search-result title of 60 characters or fewer. The on-page H1 stays `title`. " \| The Hardy Group" is added automatically when it fits. |
   | `excerpt` | no | Blog-card text, if it should differ from `description` |
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
| `/privacy`, `/terms`, `/accessibility`, `/eula` | `views/legal/*.njk` |

The organization's legal name, email, and mailing address are set once in `src/site.js` and used by the footer, every legal page, structured data, and llms.txt.
| `/sitemap.xml`, `/robots.txt` | Generated; the sitemap includes every published post and author page |
| `/llms.txt`, `/llms-full.txt` | Generated site map and full article text for AI assistants ([llmstxt.org](https://llmstxt.org)) |

Structured data (JSON-LD) is built in `src/schema.js`: NGO + WebSite (home), BlogPosting + BreadcrumbList (posts), ProfilePage/Person (authors), Service (coaching). Organization details live in `src/site.js`.

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

# The Hardy Group — website

This is a Node/Express site for **thehardygroup.org**, deployed from GitHub to SiteGround's Node.js hosting. Blog posts and authors are Markdown files in this repo. There's no database or CMS: to publish, commit a file and push.

> **Writing a blog post?** Go to [Publishing a blog post](#publishing-a-blog-post-no-coding-needed). You can do all of it in your web browser.

```
server.js              Express app: routes, redirects, sitemap
src/config.js          Environment variables
src/content.js         Loads blog posts + authors from content/
content/blog/          One .md file per post (see _TEMPLATE.md)
content/authors/       One .md file per author
views/                 Nunjucks templates (layout, pages, blog, legal)
public/                Static files (CSS, images)
```

## Publishing a blog post (no coding needed)

You can do all of this on the GitHub website. You don't need to install anything. Each blog post is one text file in the [`content/blog/`](content/blog/) folder.

### 1. Create the file

1. Open the [`content/blog/`](content/blog/) folder, then click **Add file → Create new file**.
2. Name the file after the post's web address. Use lowercase letters and hyphens only, and end the name with `.md`:
   - `building-unity.md` becomes **thehardygroup.org/blog/building-unity**
   - Don't use spaces, capital letters, or punctuation. You can't easily change the address once the post is shared, so pick carefully.

### 2. Paste this at the very top and fill it in

```md
---
title: "How to Build Unity on a Church Staff"
date: 2026-10-06
authors: [dick-hardy, jonathan-hardy]
description: "One or two sentences, 120-155 characters, saying what the reader will learn. This is what Google shows under the title."
---

The first paragraph of the post starts here.
```

The part between the two `---` lines is the post's settings. Follow these rules, or the post won't appear:

| Setting | What to enter |
| --- | --- |
| `title` | The headline, **inside double quotes**. If the title itself needs quote marks, use single quotes `'like this'` inside it. |
| `date` | The publish date as `YYYY-MM-DD`, for example `2026-10-06`. **If you use a future date, the post stays hidden until that day**, so you can use this to schedule posts. |
| `authors` | Use `[dick-hardy]`, `[jonathan-hardy]`, or `[dick-hardy, jonathan-hardy]`. Type these exactly as shown, in square brackets. |
| `description` | Keep it to 120–155 characters, **inside double quotes**. Google shows it in search results and the blog page shows it on the post's card. |

These settings are optional. Add them on their own lines between the `---` lines:

| Setting | What it does |
| --- | --- |
| `seoTitle: "..."` | A shorter title for Google, 60 characters max. Use it when the headline is long. The page itself still shows `title`. |
| `draft: true` | Saves the post without publishing it. Delete this line when the post is ready. |
| `image: /images/blog/building-unity.jpg` | A featured photo. You have to upload the photo first (see step 4). |
| `imageAlt: "Church staff praying together"` | A short description of the photo for screen readers. Add it whenever you add `image`. |
| `updated: 2026-11-01` | Shows that a post was meaningfully revised after it was published. |

### 3. Write the post below the second `---`

The post is written in Markdown, which is plain text with a few symbols for formatting:

| Type this | To get |
| --- | --- |
| A blank line between paragraphs | Separate paragraphs |
| `## Section Heading` | A section heading. Always use two `#`. The title is already the one-`#` heading. |
| `### Smaller Heading` | A sub-heading |
| `**bold words**` | **bold words** |
| `*italic words*` | *italic words* |
| `[link text](https://example.com)` | A link |
| `- item` on each line | A bulleted list |
| `1. item` on each line | A numbered list |
| `> Quoted text` | A highlighted quote callout |

**Copying from Word:** pasting text from Word is fine, but it loses the headings, bold, and bullets. After pasting, add `##` in front of each heading, re-add any `**bold**`, and make sure there's a blank line between paragraphs. Don't include an "About the Authors" section, because the site adds the author bios automatically.

### 4. (Optional) Add a featured photo

1. Open [`public/images/blog/`](public/images/blog/) and click **Add file → Upload files**. If that folder doesn't exist yet, open [`public/images/`](public/images/), click **Add file → Upload files**, and drag the photo in. Then, before you commit, change its name to `blog/your-photo-name.jpg`.
2. Name the photo the same way as the post, for example `building-unity.jpg`, and keep it under about 300 KB. A wide photo about 1600 px across works best.
3. In the post's settings, add `image: /images/blog/building-unity.jpg` and an `imageAlt:` line.

### 5. Publish

1. Click **Commit changes…** at the top right. Enter a short message such as "Add building unity post" and choose **Commit directly to the `master` branch**.
2. The site redeploys automatically, and the post should be live at `thehardygroup.org/blog/<file-name>` within a few minutes.

**If the post doesn't show up**, check these first:
- Is the date in the future? Is `draft: true` still there?
- Are the `title` and `description` inside double quotes?
- Do both `---` lines exist, and is the first one on the very first line of the file?
- Is the author spelled exactly `dick-hardy` or `jonathan-hardy`?

Posts with a missing title, a bad date, or an unknown author are skipped rather than published. The server logs the reason as `[content] Skipping ...`.

### Editing or removing a post

To edit a post, open it in [`content/blog/`](content/blog/), click the pencil icon ✏️, make your changes, and commit. For bigger revisions, also set `updated:` to today's date. To take a post down, open it, click **⋯ → Delete file**, and commit. You can also add `draft: true` to hide it without deleting it.

For a complete example, see [`content/blog/_TEMPLATE.md`](content/blog/_TEMPLATE.md) or any existing post. Files that start with `_` never appear on the site.

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
| `/sitemap.xml`, `/robots.txt` | Generated; the sitemap includes every published post and author page |
| `/llms.txt`, `/llms-full.txt` | Generated site map and full article text for AI assistants ([llmstxt.org](https://llmstxt.org)) |

The organization's legal name, email, and mailing address are set once in `src/site.js` and used by the footer, every legal page, structured data, and llms.txt.

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

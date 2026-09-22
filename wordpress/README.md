# WordPress setup: cms.thehardygroup.org

WordPress is only the editor for blog posts and authors. The public site is the Node app.

## 1. Install WordPress on the subdomain

In SiteGround Site Tools, create the subdomain `cms.thehardygroup.org` and install WordPress on it. Enable SSL (Let's Encrypt) for it.

## 2. Install the headless mu-plugin

Copy `mu-plugins/hardy-headless.php` to `wp-content/mu-plugins/` on the WordPress install. Create the folder if it doesn't exist. Must-use plugins load automatically and can't be turned off by accident.

Add this to `wp-config.php`, above the `/* That's all, stop editing! */` line:

```php
define( 'THG_FRONTEND_URL', 'https://thehardygroup.org' );
define( 'THG_REVALIDATE_SECRET', 'same long random string as REVALIDATE_SECRET on the Node app' );
```

The plugin:
- Redirects anyone who visits the WordPress front end to the matching page on thehardygroup.org.
- Makes "View Post" in the editor open the live page on thehardygroup.org.
- Tells the Node site to clear its cache whenever a post is published, updated, or unpublished, or an author profile changes. New posts appear right away.
- Turns off comments and hides the Comments and Appearance menus.

## 3. WordPress settings

- **Settings → Permalinks:** choose **Post name**. The REST API works best with pretty permalinks.
- **Settings → Reading:** check "Discourage search engines from indexing this site". Only thehardygroup.org should be indexed.

## 4. Authors

Each author is a WordPress **user**, and posts are attributed through the post's **Author** field.

1. **Users → Add New** for each writer (e.g. Dick Hardy, Jonathan Hardy). Give them the **Author** role, or **Editor** if they should edit others' posts.
2. On each user's profile:
   - **First/Last name**, then set **Display name publicly as** to the full name. This name shows on the site.
   - **Biographical Info:** the bio shown in the author box under each post and on their author page.
   - **Profile photo:** WordPress uses Gravatar by default. To upload a photo in WordPress instead, install the **Simple Local Avatars** plugin, which feeds the photo into the API automatically.
3. The author page URL comes from the username, e.g. `/blog/author/dick-hardy`.

> An author only appears in the public API (and gets an author page) once they have at least one published post.

## 5. Writing a post

- **Title**, **content** (headings, lists, quotes, and images all style correctly), and **Author** (right sidebar → Post → Author).
- **Excerpt** (optional): the summary on blog cards and in search results. If empty, WordPress uses the start of the post.
- **Featured image** (optional): shows on the blog card and at the top of the post.
- **Slug:** becomes the URL, `thehardygroup.org/blog/<slug>`.

## Security notes

- Keep WordPress, themes, and plugins updated. SiteGround's auto-update handles this.
- The site only uses public, read-only API data, so no application passwords or API keys are needed.

import { existsSync } from 'node:fs';

// Local development reads .env; on SiteGround the variables come from Site Tools.
if (existsSync('.env')) process.loadEnvFile('.env');

const trimSlash = (s) => s.replace(/\/+$/, '');

export const config = {
  port: Number(process.env.PORT) || 3000,
  siteUrl: trimSlash(process.env.SITE_URL || 'https://thehardygroup.org'),
  wpUrl: trimSlash(process.env.WP_URL || 'https://cms.thehardygroup.org'),
  cacheTtlMs: (Number(process.env.CMS_CACHE_TTL) || 300) * 1000,
  revalidateSecret: process.env.REVALIDATE_SECRET || '',
  isProd: process.env.NODE_ENV === 'production',
};

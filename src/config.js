import { existsSync } from 'node:fs';

// Local development reads .env; on SiteGround the variables come from Site Tools.
if (existsSync('.env')) process.loadEnvFile('.env');

export const config = {
  port: Number(process.env.PORT) || 3000,
  siteUrl: (process.env.SITE_URL || 'https://thehardygroup.org').replace(/\/+$/, ''),
  isProd: process.env.NODE_ENV === 'production',
};

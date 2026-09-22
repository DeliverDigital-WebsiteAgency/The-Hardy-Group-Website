// Organization details used by the footer, legal pages, structured data, and llms.txt.
import { config } from './config.js';

export const site = {
  url: config.siteUrl,
  domain: 'thehardygroup.org',
  name: 'The Hardy Group',
  legalName: 'The Hardy Group Ministries',
  description:
    'The Hardy Group is a 501(c)(3) pastoral leadership consulting nonprofit that coaches lead pastors, church boards, and ministry leaders to lead well and reach more people.',
  email: 'info@thehardygroup.org',
  address: { street: '1105 W. Woodbine Street', city: 'Springfield', state: 'MO', zip: '65803' },
  founders: ['dick-hardy', 'jonathan-hardy'], // slugs in content/authors/
};

// schema.org JSON-LD builders. Entities reference each other by @id so search
// engines can connect posts -> authors -> organization.

import { config } from './config.js';
import { site } from './site.js';

const url = (path = '/') => config.siteUrl + path;
const ORG_ID = url('/#organization');
const personId = (slug) => url(`/blog/author/${slug}#person`);

export function organization() {
  return {
    '@context': 'https://schema.org',
    '@type': 'NGO',
    '@id': ORG_ID,
    name: site.name,
    legalName: site.legalName,
    nonprofitStatus: 'Nonprofit501c3',
    description: site.description,
    url: url('/'),
    email: site.email,
    logo: { '@type': 'ImageObject', url: url('/images/logo-512.png'), width: 512, height: 512 },
    image: url('/images/og-default.jpg'),
    founder: site.founders.map((slug) => ({ '@id': personId(slug) })),
    address: {
      '@type': 'PostalAddress',
      streetAddress: site.address.street,
      addressLocality: site.address.city,
      addressRegion: site.address.state,
      postalCode: site.address.zip,
      addressCountry: 'US',
    },
    knowsAbout: ['Pastoral leadership', 'Church board governance', 'Church volunteer ministry', 'Discipleship', 'Church growth'],
  };
}

export function website() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': url('/#website'),
    name: site.name,
    url: url('/'),
    publisher: { '@id': ORG_ID },
    inLanguage: 'en-US',
  };
}

export function person(author) {
  return {
    '@type': 'Person',
    '@id': personId(author.slug),
    name: author.name,
    url: url(`/blog/author/${author.slug}`),
    ...(author.jobTitle && { jobTitle: author.jobTitle }),
    ...(author.bio && { description: author.bio }),
    ...(author.photo && { image: url(author.photo) }),
    worksFor: { '@id': ORG_ID },
  };
}

export function profilePage(author) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    url: url(`/blog/author/${author.slug}`),
    mainEntity: person(author),
  };
}

export function breadcrumbs(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map(([name, path], i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name,
      item: url(path),
    })),
  };
}

export function blogPosting(post) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': url(`/blog/${post.slug}#article`),
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.modified,
    mainEntityOfPage: url(`/blog/${post.slug}`),
    image: post.image ? url(post.image.url) : url('/images/og-default.jpg'),
    wordCount: post.wordCount,
    inLanguage: 'en-US',
    author: post.authors.map(person),
    publisher: { '@id': ORG_ID },
    isPartOf: { '@type': 'Blog', '@id': url('/blog#blog'), name: `${site.name} Blog`, url: url('/blog') },
  };
}

export function coachingService() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': url('/personal-coaching#service'),
    name: 'Lead Pastor Personal Coaching',
    serviceType: 'Pastoral leadership coaching and consulting',
    description:
      'One-on-one coaching in which Dick Hardy serves the lead pastor as a non-resident executive staff member in directional, leadership, board development, and ministry decisions.',
    provider: { '@id': ORG_ID },
    audience: { '@type': 'Audience', audienceType: 'Lead pastors, church boards, and ministry leaders' },
    areaServed: { '@type': 'Country', name: 'United States' },
    url: url('/personal-coaching'),
  };
}

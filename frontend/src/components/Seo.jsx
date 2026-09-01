import { useEffect } from 'react';

const SITE_URL = 'https://www.zelarion.tech';
const SITE_NAME = 'Zelarion';

/**
 * Per-route title, description and canonical URL.
 *
 * This exists FOR GOOGLE, which renders JavaScript before indexing. It deliberately does
 * not carry the sharing burden: Facebook's, Messenger's and LinkedIn's crawlers do not
 * execute JavaScript, so the Open Graph tags they read are the static ones in
 * `public/index.html` and every shared link previews with those. Anything written here
 * would be invisible to them.
 *
 * Open Graph title/description/url are still updated below so that the document is
 * internally consistent for anything that does run JS, and so a future move to
 * prerendering has one place to read the per-route copy from.
 */
function setMeta(selector, attribute, name, content) {
  let tag = document.head.querySelector(selector);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attribute, name);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

export default function Seo({ title, description, path, jsonLd, noIndex = false }) {
  useEffect(() => {
    const url = `${SITE_URL}${path === '/' ? '/' : path}`;
    // Every title ends in the brand so a tab or a search result is attributable even when
    // the leading phrase is cut off, except the home page where that would stutter.
    const fullTitle = path === '/' ? title : `${title} — ${SITE_NAME}`;

    document.title = fullTitle;
    setMeta('meta[name="description"]', 'name', 'description', description);
    setMeta('meta[property="og:title"]', 'property', 'og:title', fullTitle);
    setMeta('meta[property="og:description"]', 'property', 'og:description', description);
    setMeta('meta[property="og:url"]', 'property', 'og:url', url);
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', fullTitle);
    setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description);

    // Route-level structured data, kept in its own tagged element so it can be removed
    // on navigation. The static graph in index.html is served for every route, so
    // anything true of only ONE page — people named on /team, for instance — has to be
    // injected here instead of asserted site-wide.
    const LD_ID = 'route-jsonld';
    document.getElementById(LD_ID)?.remove();
    if (jsonLd) {
      const script = document.createElement('script');
      script.id = LD_ID;
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }

    // index.html ships a site-wide `index, follow`. A route that opts out has to override
    // it and put it back on the way out, or the opt-out leaks into the next route.
    const robots = document.head.querySelector('meta[name="robots"]');
    const siteRobots = robots ? robots.getAttribute('content') : null;
    if (robots && noIndex) robots.setAttribute('content', 'noindex, nofollow');

    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', url);

    return () => {
      document.getElementById(LD_ID)?.remove();
      if (robots && siteRobots) robots.setAttribute('content', siteRobots);
    };
  }, [title, description, path, jsonLd, noIndex]);

  return null;
}

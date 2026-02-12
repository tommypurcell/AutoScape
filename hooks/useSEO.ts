import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOConfig {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  noindex?: boolean;
  jsonLd?: object | object[];
}

const SITE_URL = 'https://autoscape.online';
const DEFAULT_OG_IMAGE = `${SITE_URL}/images/og-default.png`;

const setMetaName = (name: string, content: string) => {
  let el = document.querySelector(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
};

const setMetaProperty = (property: string, content: string) => {
  let el = document.querySelector(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', property);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
};

const setCanonical = (href: string) => {
  let el = document.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
};

const setJsonLd = (data: object | object[]) => {
  // Remove any existing injected JSON-LD blocks
  document.querySelectorAll('script[data-seo="true"]').forEach(el => el.remove());

  const schemas = Array.isArray(data) ? data : [data];
  schemas.forEach(schema => {
    const script = document.createElement('script');
    script.setAttribute('type', 'application/ld+json');
    script.setAttribute('data-seo', 'true');
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
  });
};

/**
 * Manages all SEO head tags for a given page.
 * Sets title, description, canonical, Open Graph, Twitter Card, robots, and JSON-LD.
 */
export const useSEO = (config: SEOConfig) => {
  const location = useLocation();

  useEffect(() => {
    const canonicalUrl = config.canonical || `${SITE_URL}${location.pathname}`;
    const ogImage = config.ogImage || DEFAULT_OG_IMAGE;

    document.title = config.title;

    setMetaName('description', config.description);
    setCanonical(canonicalUrl);

    // Robots
    if (config.noindex) {
      setMetaName('robots', 'noindex, nofollow');
    } else {
      const existing = document.querySelector('meta[name="robots"]');
      if (existing) existing.remove();
    }

    // Open Graph
    setMetaProperty('og:site_name', 'AutoScape');
    setMetaProperty('og:title', config.title);
    setMetaProperty('og:description', config.description);
    setMetaProperty('og:type', config.ogType || 'website');
    setMetaProperty('og:url', canonicalUrl);
    setMetaProperty('og:image', ogImage);
    setMetaProperty('og:image:width', '1200');
    setMetaProperty('og:image:height', '630');

    // Twitter Card
    setMetaName('twitter:card', 'summary_large_image');
    setMetaName('twitter:title', config.title);
    setMetaName('twitter:description', config.description);
    setMetaName('twitter:image', ogImage);

    // JSON-LD structured data
    if (config.jsonLd) {
      setJsonLd(config.jsonLd);
    }
  }, [config.title, config.description, config.canonical, config.noindex, config.ogImage, config.ogType, location.pathname]);
};

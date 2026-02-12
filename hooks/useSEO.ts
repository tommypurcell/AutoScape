import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOConfig {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  noindex?: boolean;
}

const SITE_URL = 'https://autoscape.online';

/**
 * Hook to manage SEO meta tags for each page
 * Ensures all pages have proper canonical URLs and meta tags
 */
export const useSEO = (config: SEOConfig) => {
  const location = useLocation();

  useEffect(() => {
    // Set title
    document.title = config.title;

    // Update or create meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', config.description);

    // Set canonical URL
    const canonicalUrl = config.canonical || `${SITE_URL}${location.pathname}`;
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonicalUrl);

    // Update Open Graph tags
    const updateMetaTag = (property: string, content: string) => {
      let meta = document.querySelector(`meta[property="${property}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('property', property);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    updateMetaTag('og:title', config.title);
    updateMetaTag('og:description', config.description);
    updateMetaTag('og:type', config.ogType || 'website');
    updateMetaTag('og:url', canonicalUrl);
    
    if (config.ogImage) {
      updateMetaTag('og:image', config.ogImage);
    }

    // Handle noindex
    let robotsMeta = document.querySelector('meta[name="robots"]');
    if (config.noindex) {
      if (!robotsMeta) {
        robotsMeta = document.createElement('meta');
        robotsMeta.setAttribute('name', 'robots');
        document.head.appendChild(robotsMeta);
      }
      robotsMeta.setAttribute('content', 'noindex, nofollow');
    } else if (robotsMeta) {
      robotsMeta.remove();
    }
  }, [config, location.pathname]);
};

/**
 * Centralized domain configuration
 * All URLs should use this constant instead of window.location.origin
 */
export const SITE_URL = 'https://autoscape.online';

/**
 * Get the canonical URL for a given path
 */
export const getCanonicalUrl = (path: string = ''): string => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${cleanPath}`;
};

/**
 * Get full URL for sharing/links
 */
export const getFullUrl = (path: string = ''): string => {
  return getCanonicalUrl(path);
};

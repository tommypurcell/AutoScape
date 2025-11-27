/**
 * Convert an image URL to a File object
 * Useful for converting gallery selections to File objects for API calls
 */
export const urlToFile = async (url: string, filename: string): Promise<File> => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new File([blob], filename, { type: blob.type });
};

/**
 * Convert multiple image URLs to File objects
 */
export const urlsToFiles = async (urls: string[]): Promise<File[]> => {
  const promises = urls.map((url, index) => {
    const filename = `style-reference-${index + 1}.jpg`;
    return urlToFile(url, filename);
  });
  return Promise.all(promises);
};

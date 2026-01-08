// Helper function to create page URLs
export function createPageUrl(pageName) {
  return `/${pageName.toLowerCase().replace(/\s+/g, '-')}`;
} 
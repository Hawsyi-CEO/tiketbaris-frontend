// ==========================================
// UNIFIED API Configuration - Environment Based
// ==========================================

// Auto-detect environment
const isDevelopment = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1';

// Domain based on environment
export const DOMAIN = isDevelopment 
  ? 'http://localhost:5000' 
  : 'https://tiketbaris.id';

export const API_URL = `${DOMAIN}/api`;
export const API_BASE_URL = API_URL; // Alias for compatibility
export const SOCKET_URL = DOMAIN;
export const IS_PRODUCTION = !isDevelopment;

// VPS IP (for reference)
export const VPS_IP = '72.61.140.193';

// Helper function to get full API endpoint
export const getApiEndpoint = (path) => {
  return `${API_URL}${path}`;
};

// Helper function to get image URL
export const getImageUrl = (imagePath) => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http')) return imagePath;
  return `${DOMAIN}${imagePath}`;
};

// Helper function to get document URL  
export const getDocumentUrl = (docPath) => {
  if (!docPath) return '';
  if (docPath.startsWith('http')) return docPath;
  return `${DOMAIN}${docPath}`;
};

export default {
  DOMAIN,
  API_URL,
  API_BASE_URL,
  SOCKET_URL,
  IS_PRODUCTION,
  VPS_IP,
  getApiEndpoint,
  getImageUrl,
  getDocumentUrl
};

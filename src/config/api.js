// ==========================================
// API Configuration - Production Domain
// ==========================================

// Production Domain
export const DOMAIN = 'https://tiketbaris.id';
export const API_URL = `${DOMAIN}/api`;
export const SOCKET_URL = DOMAIN;

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
  SOCKET_URL,
  VPS_IP,
  getApiEndpoint,
  getImageUrl,
  getDocumentUrl
};

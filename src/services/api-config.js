// API Configuration - Auto detect environment
const getAPIBaseURL = () => {
  // Production detection
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return 'https://tiketbaris.id/api';
  }
  
  // Development - use production when testing
  return 'https://tiketbaris.id/api';
};

export const API_BASE_URL = getAPIBaseURL();
export const IS_PRODUCTION = !window.location.hostname.includes('localhost');
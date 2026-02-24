// Utility untuk parse User-Agent dan extract device info
const UAParser = require('ua-parser-js');

/**
 * Parse User-Agent string dan return device info
 * @param {string} userAgent - User-Agent header dari request
 * @returns {Object} Device info (browser, os, deviceType)
 */
function parseDeviceInfo(userAgent) {
  if (!userAgent) {
    return {
      browser: 'Unknown',
      os: 'Unknown',
      deviceType: 'desktop',
      deviceName: 'Unknown Device'
    };
  }

  const parser = new UAParser(userAgent);
  const result = parser.getResult();

  // Get browser info
  const browser = result.browser.name || 'Unknown';
  const browserVersion = result.browser.version ? ` ${result.browser.version.split('.')[0]}` : '';

  // Get OS info
  const os = result.os.name || 'Unknown';
  const osVersion = result.os.version ? ` ${result.os.version}` : '';

  // Determine device type
  let deviceType = 'desktop';
  if (result.device.type === 'mobile') deviceType = 'mobile';
  else if (result.device.type === 'tablet') deviceType = 'tablet';

  // Create device name
  const deviceName = `${os}${osVersion} - ${browser}${browserVersion}`;

  return {
    browser: `${browser}${browserVersion}`,
    os: `${os}${osVersion}`,
    deviceType,
    deviceName,
    raw: {
      browser: result.browser,
      os: result.os,
      device: result.device,
      engine: result.engine
    }
  };
}

/**
 * Get device icon emoji based on device type
 * @param {string} deviceType - Type of device
 * @returns {string} Emoji icon
 */
function getDeviceIcon(deviceType) {
  const icons = {
    mobile: '📱',
    tablet: '📱',
    desktop: '💻'
  };
  return icons[deviceType] || '💻';
}

/**
 * Mask IP address for privacy (show only first 2 octets)
 * @param {string} ip - IP address
 * @returns {string} Masked IP
 */
function maskIpAddress(ip) {
  if (!ip) return 'Unknown';
  
  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.xxx.xxx`;
  }
  
  // For IPv6 or other formats
  if (ip.includes(':')) {
    const parts = ip.split(':');
    return `${parts[0]}:${parts[1]}:xxxx:xxxx:xxxx:xxxx`;
  }
  
  return 'xxx.xxx.xxx.xxx';
}

/**
 * Get location from IP (simplified - you can integrate with IP geolocation service)
 * @param {string} ip - IP address
 * @returns {Promise<string>} Location string
 */
async function getLocationFromIP(ip) {
  // TODO: Integrate dengan IP geolocation service (ipapi.co, ip-api.com, dll)
  // For now, return default location
  
  if (!ip || ip === '::1' || ip === '127.0.0.1') {
    return 'Localhost';
  }
  
  // Simplified: just return Indonesia for now
  // In production, use real geolocation API
  return 'Indonesia';
}

/**
 * Format last activity time
 * @param {Date} lastActive - Last activity timestamp
 * @returns {string} Formatted string
 */
function formatLastActivity(lastActive) {
  if (!lastActive) return 'Unknown';
  
  const now = new Date();
  const diff = Math.floor((now - new Date(lastActive)) / 1000); // seconds
  
  if (diff < 60) return 'Baru saja';
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} hari lalu`;
  
  return new Date(lastActive).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

module.exports = {
  parseDeviceInfo,
  getDeviceIcon,
  maskIpAddress,
  getLocationFromIP,
  formatLastActivity
};

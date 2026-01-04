// Base64 encoded placeholder image (1x1 px transparent)
export const TRANSPARENT_PLACEHOLDER = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

// SVG placeholder for events
export const EVENT_PLACEHOLDER = `data:image/svg+xml;base64,${btoa(`
<svg width="400" height="200" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#f3f4f6"/>
  <g transform="translate(200,100)">
    <text x="0" y="0" font-family="Arial, sans-serif" font-size="20" font-weight="bold" text-anchor="middle" fill="#6b7280">
      🎟️ Event Image
    </text>
    <text x="0" y="25" font-family="Arial, sans-serif" font-size="14" text-anchor="middle" fill="#9ca3af">
      No Image Available
    </text>
  </g>
</svg>`)}`;

// Better error handling for images
export const handleImageError = (event, fallbackSrc = EVENT_PLACEHOLDER) => {
  // Prevent infinite loop
  if (event.target.src === fallbackSrc) return;
  
  event.target.src = fallbackSrc;
  event.target.style.backgroundColor = '#f3f4f6';
  event.target.style.border = '2px dashed #d1d5db';
  
  // Log error for debugging
  console.warn('Image failed to load:', event.target.originalSrc || 'unknown');
};

// Image component with better error handling
export const SafeImage = ({ src, alt, style, ...props }) => {
  const handleError = (e) => {
    handleImageError(e, EVENT_PLACEHOLDER);
  };

  return (
    <img 
      src={src || EVENT_PLACEHOLDER}
      alt={alt}
      style={style}
      onError={handleError}
      loading="lazy"
      {...props}
    />
  );
};
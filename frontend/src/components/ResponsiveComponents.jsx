import React, { useState, useEffect } from 'react';

// Responsive Layout Component
export const ResponsiveLayout = ({ children, className = "" }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return (
    <div className={`responsive-layout ${className}`}>
      {children}
    </div>
  );
};

// Mobile Navigation Component - iOS-Style Bottom Tab
export const MobileNavigation = ({ items, activeItem, onItemClick, badges = {} }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pb-safe">
      {/* Subtle border top */}
      <div className="absolute top-0 left-0 right-0 h-[0.5px] bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
      
      {/* iOS-style frosted glass background */}
      <div className="absolute inset-0 bg-white/70 backdrop-blur-2xl backdrop-saturate-150"></div>
      
      {/* Navigation items */}
      <div className="relative flex justify-around items-center px-2 pt-2 pb-1 max-w-lg mx-auto">
        {items.map((item) => {
          const isActive = activeItem === item.key;
          const badgeCount = badges[item.key] || 0;
          
          return (
            <button
              key={item.key}
              onClick={() => onItemClick(item)}
              className="relative flex flex-col items-center justify-center min-w-[70px] py-1 transition-all duration-200 ease-out active:scale-95"
            >
              {/* Icon container */}
              <div className="relative">
                {/* Icon */}
                <div
                  className={`text-[28px] transition-all duration-300 ease-out ${
                    isActive ? 'scale-100' : 'scale-90'
                  }`}
                  style={{
                    filter: isActive 
                      ? 'brightness(1)' 
                      : 'brightness(0.6) saturate(0.8)',
                  }}
                >
                  {item.icon}
                </div>
                
                {/* Badge */}
                {badgeCount > 0 && (
                  <div className="absolute -top-1 -right-2 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1.5 shadow-sm">
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </div>
                )}
              </div>
              
              {/* Label - fades in when active */}
              <span
                className={`text-[11px] font-medium mt-0.5 transition-all duration-300 ${
                  isActive
                    ? 'opacity-100 text-blue-600 translate-y-0'
                    : 'opacity-0 text-gray-600 translate-y-1'
                }`}
                style={{
                  letterSpacing: '-0.01em',
                }}
              >
                {item.label}
              </span>
              
              {/* Active indicator - subtle dot */}
              <div
                className={`absolute -bottom-0.5 w-1 h-1 rounded-full bg-blue-600 transition-all duration-300 ${
                  isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
                }`}
              />
            </button>
          );
        })}
      </div>
      
      {/* Home indicator line (iOS style) */}
      <div className="relative flex justify-center pt-1 pb-2">
        <div className="w-32 h-1 bg-gray-900/20 rounded-full"></div>
      </div>
    </div>
  );
};

// Responsive Card Component
export const ResponsiveCard = ({ 
  children, 
  className = "", 
  hover = true, 
  onClick,
  animation = "fade-in-up"
}) => {
  return (
    <div 
      className={`
        dashboard-card 
        ${hover ? 'hover-lift' : ''} 
        ${animation} 
        ${onClick ? 'cursor-pointer' : ''} 
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

// Interactive Button Component
export const InteractiveButton = ({ 
  children, 
  variant = "primary", 
  size = "medium",
  fullWidth = false,
  loading = false,
  disabled = false,
  onClick,
  className = ""
}) => {
  const baseClasses = "font-semibold rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-none focus:ring-4";
  
  const variants = {
    primary: "button-primary",
    secondary: "button-secondary",
    success: "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white focus:ring-green-300",
    danger: "bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white focus:ring-red-300",
    warning: "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white focus:ring-yellow-300"
  };

  const sizes = {
    small: "py-2 px-4 text-sm",
    medium: "py-3 px-6 text-base",
    large: "py-4 px-8 text-lg"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${baseClasses}
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      {loading ? (
        <div className="flex items-center justify-center gap-2">
          <div className="loading-spinner"></div>
          Loading...
        </div>
      ) : (
        children
      )}
    </button>
  );
};

// Responsive Input Field
export const ResponsiveInput = ({ 
  label, 
  type = "text", 
  placeholder,
  value,
  onChange,
  error,
  icon,
  required = false,
  className = ""
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="text-sm font-semibold text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={`
            input-field
            ${icon ? 'pl-10' : ''}
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}
          `}
        />
      </div>
      {error && (
        <p className="text-sm text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
};

// Responsive Grid Component
export const ResponsiveGrid = ({ 
  children, 
  cols = { xs: 1, sm: 2, lg: 3, xl: 4 },
  gap = 6,
  className = ""
}) => {
  const gridClasses = `
    grid 
    grid-cols-${cols.xs} 
    sm:grid-cols-${cols.sm} 
    lg:grid-cols-${cols.lg} 
    xl:grid-cols-${cols.xl} 
    gap-${gap}
    ${className}
  `;

  return (
    <div className={gridClasses}>
      {children}
    </div>
  );
};

// Loading Component
export const LoadingSpinner = ({ size = "medium", text = "" }) => {
  const sizes = {
    small: "h-4 w-4",
    medium: "h-8 w-8",
    large: "h-12 w-12"
  };

  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center space-y-4">
        <div className={`loading-spinner mx-auto ${sizes[size]}`}></div>
        {text && <p className="text-gray-600">{text}</p>}
      </div>
    </div>
  );
};

// Modal Component
export const ResponsiveModal = ({ 
  isOpen, 
  onClose, 
  title, 
  children,
  maxWidth = "md" 
}) => {
  if (!isOpen) return null;

  const maxWidths = {
    sm: "max-w-sm",
    md: "max-w-md", 
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl"
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Overlay */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        ></div>
        
        {/* Modal */}
        <div className={`
          relative bg-white rounded-2xl shadow-2xl w-full ${maxWidths[maxWidth]}
          transform transition-all duration-300 scale-100
        `}>
          {/* Header */}
          {title && (
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">{title}</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          
          {/* Content */}
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

// Notification Toast Component
export const NotificationToast = ({ 
  type = "info", 
  message, 
  isVisible, 
  onClose,
  duration = 5000 
}) => {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const types = {
    success: "bg-green-500 text-white",
    error: "bg-red-500 text-white", 
    warning: "bg-yellow-500 text-white",
    info: "bg-red-500 text-white"
  };

  const icons = {
    success: "✅",
    error: "❌", 
    warning: "⚠️",
    info: "ℹ️"
  };

  return (
    <div className="fixed top-4 right-4 z-50 slide-in-right">
      <div className={`
        ${types[type]} 
        px-6 py-4 rounded-xl shadow-lg 
        flex items-center gap-3 min-w-80
      `}>
        <span className="text-xl">{icons[type]}</span>
        <p className="flex-1">{message}</p>
        <button 
          onClick={onClose}
          className="text-white hover:text-gray-200 transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

// Responsive Table Component
export const ResponsiveTable = ({ 
  columns, 
  data, 
  loading = false,
  onRowClick 
}) => {
  if (loading) {
    return <LoadingSpinner text="Loading data..." />;
  }

  return (
    <div className="table-responsive">
      <table className="w-full border-collapse bg-white">
        <thead>
          <tr className="bg-gray-50">
            {columns.map((col, index) => (
              <th 
                key={index}
                className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.map((row, rowIndex) => (
            <tr 
              key={rowIndex}
              className={`
                hover:bg-gray-50 transition-colors
                ${onRowClick ? 'cursor-pointer' : ''}
              `}
              onClick={() => onRowClick && onRowClick(row)}
            >
              {columns.map((col, colIndex) => (
                <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Stats Card Component
export const StatsCard = ({ 
  title, 
  value, 
  icon, 
  trend,
  trendValue,
  color = "blue",
  clickable = false 
}) => {
  const colors = {
    blue: "from-red-500 to-orange-600",
    green: "from-green-500 to-green-600", 
    red: "from-red-500 to-red-600",
    yellow: "from-yellow-500 to-yellow-600",
    purple: "from-red-500 to-orange-600"
  };

  return (
    <div className={`stat-card ${clickable ? 'cursor-pointer hover:shadow-xl transition-all' : ''}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {trend && (
            <div className="flex items-center mt-2">
              <span className={`
                text-sm font-medium
                ${trend === 'up' ? 'text-green-600' : 'text-red-600'}
              `}>
                {trend === 'up' ? '↗' : '↘'} {trendValue}
              </span>
            </div>
          )}
          {clickable && (
            <p className="text-xs text-gray-400 mt-1">👆 Klik untuk lihat detail</p>
          )}
        </div>
        <div className={`
          w-12 h-12 rounded-xl bg-gradient-to-r ${colors[color]}
          flex items-center justify-center text-white text-xl
          ${clickable ? 'transform transition-transform group-hover:scale-110' : ''}
        `}>
          {icon}
        </div>
      </div>
    </div>
  );
};
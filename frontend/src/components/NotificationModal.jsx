import { useState, useEffect } from 'react';

export default function NotificationModal({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = 'info', // 'success', 'error', 'warning', 'info', 'confirm'
  onConfirm,
  confirmText = 'OK',
  cancelText = 'Batal',
  details = null
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    handleClose();
  };

  if (!isOpen) return null;

  const typeConfig = {
    success: {
      icon: '✅',
      bgGradient: 'from-green-500 to-emerald-600',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      buttonBg: 'bg-green-600 hover:bg-green-700'
    },
    error: {
      icon: '❌',
      bgGradient: 'from-red-500 to-rose-600',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      buttonBg: 'bg-red-600 hover:bg-red-700'
    },
    warning: {
      icon: '⚠️',
      bgGradient: 'from-yellow-500 to-amber-600',
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      buttonBg: 'bg-yellow-600 hover:bg-yellow-700'
    },
    info: {
      icon: 'ℹ️',
      bgGradient: 'from-blue-500 to-indigo-600',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      buttonBg: 'bg-blue-600 hover:bg-blue-700'
    },
    confirm: {
      icon: '❓',
      bgGradient: 'from-purple-500 to-indigo-600',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      buttonBg: 'bg-purple-600 hover:bg-purple-700'
    }
  };

  const config = typeConfig[type] || typeConfig.info;

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)' }}
    >
      <div 
        className={`bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 ${
          isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header dengan gradient */}
        <div className={`bg-gradient-to-r ${config.bgGradient} p-6 rounded-t-2xl`}>
          <div className="flex items-center gap-4">
            <div className={`${config.iconBg} w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-lg animate-bounce`}>
              {config.icon}
            </div>
            <h3 className="text-2xl font-bold text-white flex-1">{title}</h3>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 text-lg leading-relaxed mb-4">{message}</p>
          
          {details && (
            <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-200">
              {typeof details === 'object' ? (
                <div className="space-y-2">
                  {Object.entries(details).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center">
                      <span className="text-gray-600 text-sm font-medium">{key}:</span>
                      <span className="text-gray-900 font-bold">{value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-700 text-sm">{details}</p>
              )}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 mt-6">
            {type === 'confirm' ? (
              <>
                <button
                  onClick={handleClose}
                  className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-bold transition-all duration-200 transform hover:scale-105"
                >
                  {cancelText}
                </button>
                <button
                  onClick={handleConfirm}
                  className={`flex-1 px-6 py-3 ${config.buttonBg} text-white rounded-xl font-bold transition-all duration-200 transform hover:scale-105 shadow-lg`}
                >
                  {confirmText}
                </button>
              </>
            ) : (
              <button
                onClick={handleClose}
                className={`w-full px-6 py-3 ${config.buttonBg} text-white rounded-xl font-bold transition-all duration-200 transform hover:scale-105 shadow-lg`}
              >
                {confirmText}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

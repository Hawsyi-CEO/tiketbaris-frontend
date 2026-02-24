// Utility untuk format payment method dengan icon dan nama yang user-friendly

export const getPaymentMethodInfo = (paymentType, bankName, vaNumber, paymentCode) => {
  if (!paymentType) {
    return {
      icon: '',
      name: 'Belum dibayar',
      detail: '',
      color: 'gray'
    };
  }

  const paymentTypeUpper = paymentType.toUpperCase();
  
  // Bank Transfer / Virtual Account
  if (paymentTypeUpper === 'BANK_TRANSFER') {
    const bankUpper = (bankName || '').toUpperCase();
    let bankIcon = '';
    let bankDisplayName = bankName || 'Bank Transfer';
    
    if (bankUpper.includes('BNI')) {
      bankIcon = '';
      bankDisplayName = 'BNI';
    } else if (bankUpper.includes('BRI')) {
      bankIcon = '';
      bankDisplayName = 'BRI';
    } else if (bankUpper.includes('MANDIRI')) {
      bankIcon = '';
      bankDisplayName = 'Mandiri';
    } else if (bankUpper.includes('PERMATA')) {
      bankIcon = '';
      bankDisplayName = 'Permata';
    } else if (bankUpper.includes('BCA')) {
      bankIcon = '';
      bankDisplayName = 'BCA';
    }
    
    return {
      icon: bankIcon,
      name: `${bankDisplayName} Virtual Account`,
      detail: vaNumber ? `VA: ${vaNumber}` : '',
      color: 'blue'
    };
  }
  
  // Mandiri Bill Payment (Echannel)
  if (paymentTypeUpper === 'ECHANNEL') {
    return {
      icon: '',
      name: 'Mandiri Bill Payment',
      detail: paymentCode ? `Kode: ${paymentCode}` : '',
      color: 'blue'
    };
  }
  
  // E-Wallet
  if (paymentTypeUpper === 'GOPAY') {
    return {
      icon: '',
      name: 'GoPay',
      detail: 'E-Wallet',
      color: 'green'
    };
  }
  
  if (paymentTypeUpper === 'SHOPEEPAY') {
    return {
      icon: '',
      name: 'ShopeePay',
      detail: 'E-Wallet',
      color: 'orange'
    };
  }
  
  // QRIS
  if (paymentTypeUpper === 'QRIS') {
    return {
      icon: '',
      name: 'QRIS',
      detail: 'Scan QR Code',
      color: 'purple'
    };
  }
  
  // Convenience Store
  if (paymentTypeUpper === 'CSTORE') {
    const storeUpper = (bankName || '').toUpperCase();
    let storeName = 'Convenience Store';
    
    if (storeUpper.includes('INDOMARET')) {
      storeName = 'Indomaret';
    } else if (storeUpper.includes('ALFAMART')) {
      storeName = 'Alfamart';
    }
    
    return {
      icon: '',
      name: storeName,
      detail: paymentCode ? `Kode: ${paymentCode}` : '',
      color: 'yellow'
    };
  }
  
  // Credit Card
  if (paymentTypeUpper === 'CREDIT_CARD') {
    return {
      icon: '',
      name: 'Credit Card',
      detail: bankName || '',
      color: 'indigo'
    };
  }
  
  // Default fallback
  return {
    icon: '',
    name: paymentType.replace('_', ' '),
    detail: bankName || '',
    color: 'gray'
  };
};

export const formatPaymentMethod = (paymentType, bankName, vaNumber, paymentCode) => {
  const info = getPaymentMethodInfo(paymentType, bankName, vaNumber, paymentCode);
  return `${info.icon} ${info.name}`;
};

// Get color classes for Tailwind CSS
export const getPaymentMethodColorClasses = (color) => {
  const colorMap = {
    blue: 'bg-blue-100 text-blue-800 border-blue-300',
    green: 'bg-green-100 text-green-800 border-green-300',
    orange: 'bg-orange-100 text-orange-800 border-orange-300',
    purple: 'bg-purple-100 text-purple-800 border-purple-300',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    indigo: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    gray: 'bg-gray-100 text-gray-800 border-gray-300'
  };
  
  return colorMap[color] || colorMap.gray;
};

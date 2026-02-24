// Utility untuk download QR code dari Midtrans payment page
export const downloadQRCode = () => {
  try {
    // Cari QR code element di Midtrans iframe/popup
    const qrElements = [
      // Cari berbagai selector yang mungkin untuk QR code
      document.querySelector('.qr-code img'),
      document.querySelector('[alt*="QR"]'),
      document.querySelector('img[src*="qr"]'),
      document.querySelector('canvas[data-qr]'),
      // Cari di iframe Midtrans
      ...Array.from(document.querySelectorAll('iframe')).map(iframe => {
        try {
          return iframe.contentDocument?.querySelector('.qr-code img') || 
                 iframe.contentDocument?.querySelector('img[alt*="QR"]');
        } catch (e) {
          // Cross-origin iframe tidak bisa diakses
          return null;
        }
      }).filter(Boolean)
    ];

    const qrElement = qrElements.find(el => el !== null);

    if (!qrElement) {
      alert('❌ QR Code tidak ditemukan. Pastikan popup pembayaran masih terbuka.');
      return false;
    }

    // Download QR code
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (qrElement.tagName === 'CANVAS') {
      // Jika QR dalam bentuk canvas
      canvas.width = qrElement.width;
      canvas.height = qrElement.height;
      ctx.drawImage(qrElement, 0, 0);
    } else if (qrElement.tagName === 'IMG') {
      // Jika QR dalam bentuk image
      canvas.width = qrElement.naturalWidth || 300;
      canvas.height = qrElement.naturalHeight || 300;
      ctx.drawImage(qrElement, 0, 0);
    }

    // Convert to blob dan download
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `QR-Payment-${Date.now()}.png`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      
      alert('✅ QR Code berhasil didownload!');
    });

    return true;
  } catch (error) {
    console.error('Error downloading QR code:', error);
    alert('❌ Gagal mendownload QR code: ' + error.message);
    return false;
  }
};

// Inject button ke Midtrans popup (experimental)
export const injectDownloadButton = () => {
  try {
    // Cari container payment methods di Midtrans
    const paymentContainer = document.querySelector('.payment-method-container') ||
                            document.querySelector('.midtrans-payment-options');
    
    if (!paymentContainer) {
      console.warn('Payment container not found, cannot inject download button');
      return;
    }

    // Cek apakah button sudah ada
    if (document.querySelector('#qr-download-btn')) {
      return; // Button sudah ada
    }

    // Buat button
    const downloadBtn = document.createElement('button');
    downloadBtn.id = 'qr-download-btn';
    downloadBtn.innerHTML = '📥 Download QR Code';
    downloadBtn.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 999999;
      transition: all 0.3s ease;
    `;

    downloadBtn.onmouseover = () => {
      downloadBtn.style.transform = 'translateY(-2px)';
      downloadBtn.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
    };

    downloadBtn.onmouseout = () => {
      downloadBtn.style.transform = 'translateY(0)';
      downloadBtn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    };

    downloadBtn.onclick = downloadQRCode;

    document.body.appendChild(downloadBtn);
    console.log('✅ Download QR button injected');
  } catch (error) {
    console.error('Error injecting download button:', error);
  }
};

// Monitor Midtrans popup dan inject button saat QRIS muncul
export const monitorQRISPayment = () => {
  let checkInterval;
  let checkCount = 0;
  const maxChecks = 50; // Check selama 10 detik (50 * 200ms)

  checkInterval = setInterval(() => {
    checkCount++;

    // Cari indikasi QRIS payment sedang aktif
    const qrisIndicators = [
      document.querySelector('.qr-code'),
      document.querySelector('[data-payment-type="qris"]'),
      document.querySelector('img[alt*="QR"]'),
      Array.from(document.querySelectorAll('.payment-method')).find(el => 
        el.textContent?.toLowerCase().includes('qris')
      )
    ];

    const qrisActive = qrisIndicators.some(el => el !== null && el !== undefined);

    if (qrisActive) {
      console.log('🎯 QRIS payment detected, injecting download button...');
      setTimeout(() => injectDownloadButton(), 500); // Delay sedikit untuk memastikan DOM ready
      clearInterval(checkInterval);
    }

    // Stop monitoring setelah maxChecks
    if (checkCount >= maxChecks) {
      clearInterval(checkInterval);
      console.log('⏱️ QRIS monitoring stopped (timeout)');
    }
  }, 200); // Check setiap 200ms

  // Return cleanup function
  return () => clearInterval(checkInterval);
};

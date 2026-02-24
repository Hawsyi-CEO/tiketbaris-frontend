/**
 * Format angka ke format Rupiah Indonesia
 * Contoh: 515000 → "515.000" (tanpa desimal)
 * @param {number} value - Angka yang akan diformat
 * @returns {string} - String dengan format rupiah menggunakan titik sebagai pemisah ribuan
 */
export const formatRupiah = (value) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }
  
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

/**
 * Format angka ke format Rupiah lengkap dengan simbol Rp
 * Contoh: 515000 → "Rp 515.000"
 * @param {number} value - Angka yang akan diformat
 * @returns {string} - String dengan format "Rp [angka]"
 */
export const formatRupiahWithSymbol = (value) => {
  return `Rp ${formatRupiah(value)}`;
};

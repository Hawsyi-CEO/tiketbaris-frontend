/**
 * PricingService.js
 * 
 * Layanan untuk menghitung fee dengan model:
 * - Komisi Platform = 2% FLAT (sama untuk semua payment method)
 * - Midtrans fee = varies per payment method (non-negotiable dari Midtrans)
 * 
 * Model ini FAIR karena semua organizer bayar komisi yang sama (2%)
 */

class PricingService {
  /**
   * Calculate fees dengan model: Midtrans + 2% platform komisi
   * @param {number} grossAmount - Total harga tiket
   * @param {string} paymentMethod - gopay, shopeepay, dana, bank, cc, minimarket, akulaku, kredivo
   * @returns {Object} Fee breakdown { grossAmount, midtransFee, platformFee, totalFee, netAmount, breakdown }
   */
  static calculateFees(grossAmount, paymentMethod) {
    if (grossAmount < 0) {
      throw new Error('Gross amount must be positive');
    }

    // 1. Calculate Midtrans fee (non-negotiable per payment method)
    const midtransFee = this.getMidtransFee(grossAmount, paymentMethod);
    
    // 2. Calculate platform fee (FLAT 2% untuk semua)
    const platformFee = Math.floor(grossAmount * 0.02);
    
    // 3. Total fee
    const totalFee = midtransFee + platformFee;
    
    // 4. Net amount to organizer
    const netAmount = grossAmount - totalFee;
    
    // 5. Fee breakdown untuk display
    const breakdown = {
      gross: this._formatCurrency(grossAmount),
      midtrans: {
        amount: this._formatCurrency(midtransFee),
        percentage: this.getMidtransFeePercentage(paymentMethod),
        note: this.getMidtransFeeNote(paymentMethod)
      },
      platform: {
        amount: this._formatCurrency(platformFee),
        percentage: '2%',
        note: 'Komisi platform (FLAT)'
      },
      total: {
        amount: this._formatCurrency(totalFee),
        percentage: `${((totalFee / grossAmount) * 100).toFixed(2)}%`
      },
      net: this._formatCurrency(netAmount)
    };

    return {
      grossAmount,
      paymentMethod,
      midtransFee,
      platformFee,
      totalFee,
      netAmount,
      breakdown,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get Midtrans fee berdasarkan payment method (dari Midtrans - tidak bisa diubah)
   */
  static getMidtransFee(amount, method) {
    switch (method) {
      // E-Wallets: 2%
      case 'gopay':
      case 'shopeepay':
      case 'kredivo':
        return Math.floor(amount * 0.02);
      
      // E-Wallets: 1.5%
      case 'dana':
      case 'akulaku':
        return Math.floor(amount * 0.015);
      
      // Credit Card: 2.9% + fixed Rp2.000
      case 'cc':
      case 'credit_card':
        return Math.floor(amount * 0.029) + 2000;
      
      // Bank Transfer: Fixed Rp4.000
      case 'bank':
      case 'transfer':
        return 4000;
      
      // Minimarket: Fixed Rp5.000
      case 'minimarket':
        return 5000;
      
      default:
        return 0;
    }
  }

  /**
   * Get Midtrans fee percentage (untuk display)
   */
  static getMidtransFeePercentage(method) {
    switch (method) {
      case 'gopay':
      case 'shopeepay':
      case 'kredivo':
        return '2%';
      case 'dana':
      case 'akulaku':
        return '1.5%';
      case 'cc':
        return '2.9% + Rp2.000';
      case 'bank':
        return 'Rp4.000 (fixed)';
      case 'minimarket':
        return 'Rp5.000 (fixed)';
      default:
        return '0%';
    }
  }

  /**
   * Get Midtrans fee note (untuk display)
   */
  static getMidtransFeeNote(method) {
    switch (method) {
      case 'gopay':
      case 'shopeepay':
        return 'Biaya e-wallet Midtrans';
      case 'dana':
      case 'akulaku':
        return 'Biaya e-wallet Midtrans';
      case 'bank':
        return 'Biaya transfer bank Midtrans';
      case 'cc':
        return 'Biaya kartu kredit Midtrans';
      case 'minimarket':
        return 'Biaya minimarket Midtrans';
      default:
        return '';
    }
  }

  /**
   * Format currency to Rp format
   */
  static _formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Get list of available payment methods dengan fee info
   */
  static getPaymentMethods() {
    return {
      gopay: {
        name: 'GoPay',
        icon: '💚',
        midtransFeePercentage: 2,
        platformFeePercentage: 2,
        totalFeePercentage: 4,
        description: 'E-wallet populer Indonesia'
      },
      shopeepay: {
        name: 'ShopeePay',
        icon: '🧡',
        midtransFeePercentage: 2,
        platformFeePercentage: 2,
        totalFeePercentage: 4,
        description: 'E-wallet dari Shopee'
      },
      dana: {
        name: 'DANA',
        icon: '💜',
        midtransFeePercentage: 1.5,
        platformFeePercentage: 2,
        totalFeePercentage: 3.5,
        description: 'E-wallet paling hemat'
      },
      akulaku: {
        name: 'Akulaku',
        icon: '🎁',
        midtransFeePercentage: 1.7,
        platformFeePercentage: 2,
        totalFeePercentage: 3.7,
        description: 'Cicilan bunga 0%'
      },
      kredivo: {
        name: 'Kredivo',
        icon: '🎀',
        midtransFeePercentage: 2,
        platformFeePercentage: 2,
        totalFeePercentage: 4,
        description: 'Cicilan fleksibel'
      },
      bank: {
        name: 'Transfer Bank',
        icon: '🏦',
        midtransFeeFixed: 4000,
        platformFeePercentage: 2,
        description: 'Transfer langsung ke rekening'
      },
      cc: {
        name: 'Kartu Kredit',
        icon: '💳',
        midtransFeePercentage: 2.9,
        midtransFeeFixed: 2000,
        platformFeePercentage: 2,
        description: 'Kartu kredit Visa/Mastercard'
      },
      minimarket: {
        name: 'Minimarket',
        icon: '🏪',
        midtransFeeFixed: 5000,
        platformFeePercentage: 2,
        description: 'Bayar di Indomaret/Alfamart'
      }
    };
  }

  /**
   * Calculate total revenue untuk event (aggregate multiple transactions)
   */
  static calculateEventRevenue(transactions) {
    if (!transactions || transactions.length === 0) {
      return {
        totalGross: 0,
        totalMidtransFee: 0,
        totalPlatformFee: 0,
        totalFee: 0,
        totalNet: 0,
        transactionCount: 0,
        averagePerTransaction: 0,
        feePercentage: '0%',
        byPaymentMethod: {}
      };
    }

    let totalGross = 0;
    let totalMidtransFee = 0;
    let totalPlatformFee = 0;
    let totalNet = 0;
    const byPaymentMethod = {};

    transactions.forEach(txn => {
      const amount = txn.amount || 0;
      const method = txn.paymentMethod || 'unknown';
      
      const fees = this.calculateFees(amount, method);
      
      totalGross += fees.grossAmount;
      totalMidtransFee += fees.midtransFee;
      totalPlatformFee += fees.platformFee;
      totalNet += fees.netAmount;

      // Aggregate per payment method
      if (!byPaymentMethod[method]) {
        byPaymentMethod[method] = {
          count: 0,
          gross: 0,
          midtransFee: 0,
          platformFee: 0,
          net: 0
        };
      }
      
      byPaymentMethod[method].count++;
      byPaymentMethod[method].gross += fees.grossAmount;
      byPaymentMethod[method].midtransFee += fees.midtransFee;
      byPaymentMethod[method].platformFee += fees.platformFee;
      byPaymentMethod[method].net += fees.netAmount;
    });

    const totalFee = totalMidtransFee + totalPlatformFee;

    return {
      totalGross,
      totalMidtransFee,
      totalPlatformFee,
      totalFee,
      totalNet,
      transactionCount: transactions.length,
      averagePerTransaction: Math.floor(totalGross / transactions.length),
      feePercentage: totalGross > 0 ? `${((totalFee / totalGross) * 100).toFixed(2)}%` : '0%',
      byPaymentMethod
    };
  }

  /**
   * Get payment method detail dengan fee
   */
  static getPaymentMethodDetail(method, amount = 100000) {
    const methods = this.getPaymentMethods();
    const methodInfo = methods[method] || {};
    const feeCalc = this.calculateFees(amount, method);

    return {
      ...methodInfo,
      exampleCalculation: {
        gross: amount,
        midtransFee: feeCalc.midtransFee,
        platformFee: feeCalc.platformFee,
        totalFee: feeCalc.totalFee,
        net: feeCalc.netAmount,
        totalFeePercentage: `${((feeCalc.totalFee / amount) * 100).toFixed(2)}%`
      }
    };
  }
}

module.exports = PricingService;

import React, { useState } from 'react';

/**
 * Customer Payment Info Component
 * Ditampilkan kepada customer saat checkout
 * Menunjukkan breakdown biaya untuk transparansi
 */

const PaymentInfo = ({ selectedMethod = 'gopay', ticketPrice = 100000, quantity = 1 }) => {
  const [showDetails, setShowDetails] = useState(false);

  const paymentMethods = {
    gopay: { name: 'GoPay', midtransFee: 'percent', midtransRate: 2, platformComission: 1.5, icon: '💚', color: 'from-green-400 to-green-600' },
    shopeepay: { name: 'ShopeePay', midtransFee: 'percent', midtransRate: 2, platformComission: 1.5, icon: '🧡', color: 'from-orange-400 to-orange-600' },
    dana: { name: 'DANA', midtransFee: 'percent', midtransRate: 1.5, platformComission: 1.5, icon: '🔵', color: 'from-blue-400 to-blue-600' },
    bank: { name: 'Transfer Bank', midtransFee: 'fixed', midtransRate: 4000, platformComission: 3000, icon: '🏦', color: 'from-slate-400 to-slate-600' },
    cc: { name: 'Kartu Kredit', midtransFee: 'mixed', midtransRate: 2.9, midtransFixed: 2000, platformComission: 2.5, icon: '💳', color: 'from-red-400 to-red-600' },
    minimarket: { name: 'Minimarket', midtransFee: 'fixed', midtransRate: 5000, platformComission: 2000, icon: '🏪', color: 'from-purple-400 to-purple-600' },
    akulaku: { name: 'Akulaku', midtransFee: 'percent', midtransRate: 1.7, platformComission: 1.7, icon: '🛍️', color: 'from-cyan-400 to-cyan-600' },
    kredivo: { name: 'Kredivo', midtransFee: 'percent', midtransRate: 2, platformComission: 1.7, icon: '🎁', color: 'from-pink-400 to-pink-600' }
  };

  // Hitung biaya untuk metode yang dipilih
  const calculatePayment = (method) => {
    const pm = paymentMethods[method];
    const totalPrice = ticketPrice * quantity;

    let midtransFeePerUnit = 0;
    let midtransFeeTotal = 0;

    if (pm.midtransFee === 'percent') {
      midtransFeePerUnit = (ticketPrice * pm.midtransRate) / 100;
      midtransFeeTotal = (totalPrice * pm.midtransRate) / 100;
    } else if (pm.midtransFee === 'fixed') {
      midtransFeePerUnit = pm.midtransRate;
      midtransFeeTotal = pm.midtransRate * quantity;
    } else if (pm.midtransFee === 'mixed') {
      midtransFeePerUnit = (ticketPrice * pm.midtransRate) / 100 + pm.midtransFixed;
      midtransFeeTotal = ((ticketPrice * pm.midtransRate) / 100 + pm.midtransFixed) * quantity;
    }

    let platformFeePerUnit = 0;
    let platformFeeTotal = 0;

    if (typeof pm.platformComission === 'number' && pm.platformComission < 10) {
      platformFeePerUnit = (ticketPrice * pm.platformComission) / 100;
      platformFeeTotal = (totalPrice * pm.platformComission) / 100;
    } else {
      platformFeePerUnit = pm.platformComission;
      platformFeeTotal = pm.platformComission * quantity;
    }

    const totalFeePerUnit = midtransFeePerUnit + platformFeePerUnit;
    const totalFeeAll = midtransFeeTotal + platformFeeTotal;
    const finalTotal = totalPrice + totalFeeAll;
    const feePercentage = (totalFeeAll / totalPrice) * 100;

    return {
      totalPrice,
      midtransFeePerUnit: Math.round(midtransFeePerUnit),
      platformFeePerUnit: Math.round(platformFeePerUnit),
      totalFeePerUnit: Math.round(totalFeePerUnit),
      midtransFeeTotal: Math.round(midtransFeeTotal),
      platformFeeTotal: Math.round(platformFeeTotal),
      totalFeeAll: Math.round(totalFeeAll),
      finalTotal: Math.round(finalTotal),
      feePercentage: feePercentage.toFixed(1)
    };
  };

  const current = paymentMethods[selectedMethod];
  const payment = calculatePayment(selectedMethod);

  const formatRupiah = (num) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  // Hitung semua metode untuk perbandingan
  const allMethods = Object.keys(paymentMethods).map(method => {
    const pm = paymentMethods[method];
    const data = calculatePayment(method);
    return { method, pm, ...data };
  });

  const sortedMethods = [...allMethods].sort((a, b) => a.finalTotal - b.finalTotal);

  return (
    <div className="space-y-4">
      {/* Main Payment Summary */}
      <div className={`bg-gradient-to-br ${current.color} rounded-2xl shadow-lg p-8 text-white`}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-sm opacity-90 mb-1">💳 TOTAL PEMBAYARAN</p>
            <p className="text-4xl font-bold">{formatRupiah(payment.finalTotal)}</p>
          </div>
          <div className="text-5xl">{current.icon}</div>
        </div>

        <div className="border-t border-white border-opacity-30 pt-4 space-y-2">
          <div className="flex justify-between text-sm opacity-90">
            <span>Harga Tiket ({quantity}×)</span>
            <span>{formatRupiah(payment.totalPrice)}</span>
          </div>
          <div className="flex justify-between text-sm opacity-90">
            <span>Biaya Midtrans</span>
            <span>Rp {payment.midtransFeeTotal.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between text-sm opacity-90">
            <span>Biaya Platform</span>
            <span>Rp {payment.platformFeeTotal.toLocaleString('id-ID')}</span>
          </div>
        </div>
      </div>

      {/* Biaya Terurai Per Tiket */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full flex items-center justify-between hover:opacity-70 transition-opacity"
        >
          <span className="font-semibold text-gray-800">📋 Lihat Rincian Per Tiket</span>
          <span className="text-2xl">{showDetails ? '▲' : '▼'}</span>
        </button>

        {showDetails && (
          <div className="mt-4 space-y-2 pt-4 border-t border-gray-300">
            <div className="flex justify-between text-sm text-gray-700">
              <span>Harga Tiket Satuan</span>
              <span className="font-semibold">{formatRupiah(ticketPrice)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-700">
              <span>Biaya Midtrans (per tiket)</span>
              <span className="font-semibold">Rp {payment.midtransFeePerUnit.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-700">
              <span>Biaya Platform (per tiket)</span>
              <span className="font-semibold">Rp {payment.platformFeePerUnit.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-700 border-t border-gray-300 pt-2">
              <span>Total per Tiket</span>
              <span className="font-bold text-orange-600">{formatRupiah(ticketPrice + payment.totalFeePerUnit)}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>Biaya ({payment.feePercentage}%)</span>
              <span>{formatRupiah(payment.totalFeePerUnit)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Perbandingan dengan Metode Lain */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm font-semibold text-blue-900 mb-3">💡 Bandingkan dengan metode lain</p>
        <div className="space-y-2">
          {sortedMethods.slice(0, 3).map((data, idx) => {
            const isCurrent = data.method === selectedMethod;
            const saving = data.finalTotal - payment.finalTotal;

            return (
              <div
                key={data.method}
                className={`flex items-center justify-between p-2 rounded-lg text-sm transition-all ${
                  isCurrent ? 'bg-blue-200 font-semibold border border-blue-400' : 'hover:bg-blue-100'
                }`}
              >
                <span>
                  {data.pm.icon} {data.pm.name}
                </span>
                <div className="text-right">
                  <span className="font-semibold">{formatRupiah(data.finalTotal)}</span>
                  {!isCurrent && saving > 0 && (
                    <span className="ml-2 text-green-600 font-bold">Hemat {formatRupiah(saving)}</span>
                  )}
                  {!isCurrent && saving < 0 && (
                    <span className="ml-2 text-red-600 font-bold">Lebih Mahal {formatRupiah(-saving)}</span>
                  )}
                  {isCurrent && <span className="ml-2 text-blue-600">✓ Pilihan Anda</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Info Biaya */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-xs font-semibold text-amber-900 mb-2">⚠️ Informasi Penting</p>
        <div className="text-xs text-amber-800 space-y-1">
          <p>
            <strong>Biaya Midtrans:</strong> Biaya dari payment gateway untuk memproses transaksi. 
            Besarnya tergantung metode pembayaran yang Anda pilih.
          </p>
          <p className="mt-1">
            <strong>Biaya Platform:</strong> Untuk maintenance server, keamanan data, dan customer support.
          </p>
          <p className="mt-1">
            <strong>💚 Hemat Biaya:</strong> Gunakan GoPay atau ShopeePay untuk biaya paling murah!
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentInfo;

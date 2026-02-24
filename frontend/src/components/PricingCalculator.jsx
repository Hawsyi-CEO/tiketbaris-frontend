import React, { useState, useEffect } from 'react';

/**
 * PricingCalculator Component
 * Menampilkan breakdown biaya untuk organizer
 * Menunjukkan estimasi uang yang akan diterima berdasarkan harga tiket dan metode pembayaran
 */

const PricingCalculator = ({ ticketPrice = 100000, estimatedSales = 100 }) => {
  const [price, setPrice] = useState(ticketPrice);
  const [sales, setSales] = useState(estimatedSales);

  // Struktur biaya Midtrans
  const paymentMethods = {
    gopay: { name: 'GoPay', midtransFee: 'percent', midtransRate: 2, platformComission: 1.5, icon: '💚' },
    shopeepay: { name: 'ShopeePay', midtransFee: 'percent', midtransRate: 2, platformComission: 1.5, icon: '🧡' },
    dana: { name: 'DANA', midtransFee: 'percent', midtransRate: 1.5, platformComission: 1.5, icon: '🔵' },
    bank: { name: 'Transfer Bank', midtransFee: 'fixed', midtransRate: 4000, platformComission: 3000, icon: '🏦' },
    cc: { name: 'Kartu Kredit', midtransFee: 'mixed', midtransRate: 2.9, midtransFixed: 2000, platformComission: 2.5, icon: '💳' },
    minimarket: { name: 'Minimarket', midtransFee: 'fixed', midtransRate: 5000, platformComission: 2000, icon: '🏪' },
    akulaku: { name: 'Akulaku', midtransFee: 'percent', midtransRate: 1.7, platformComission: 1.7, icon: '🛍️' },
    kredivo: { name: 'Kredivo', midtransFee: 'percent', midtransRate: 2, platformComission: 1.7, icon: '🎁' }
  };

  // Hitung biaya untuk payment method tertentu
  const calculateFee = (method) => {
    const pm = paymentMethods[method];
    
    let midtransFeePerTiket = 0;
    let totalMidtransFee = 0;

    if (pm.midtransFee === 'percent') {
      midtransFeePerTiket = (price * pm.midtransRate) / 100;
      totalMidtransFee = (price * sales * pm.midtransRate) / 100;
    } else if (pm.midtransFee === 'fixed') {
      midtransFeePerTiket = pm.midtransRate;
      totalMidtransFee = pm.midtransRate * sales;
    } else if (pm.midtransFee === 'mixed') {
      midtransFeePerTiket = (price * pm.midtransRate) / 100 + pm.midtransFixed;
      totalMidtransFee = ((price * pm.midtransRate) / 100 + pm.midtransFixed) * sales;
    }

    let platformFeePerTiket = 0;
    let totalPlatformFee = 0;

    if (typeof pm.platformComission === 'number' && pm.platformComission < 10) {
      // Percentage
      platformFeePerTiket = (price * pm.platformComission) / 100;
      totalPlatformFee = (price * sales * pm.platformComission) / 100;
    } else {
      // Fixed amount
      platformFeePerTiket = pm.platformComission;
      totalPlatformFee = pm.platformComission * sales;
    }

    const totalPerTiket = midtransFeePerTiket + platformFeePerTiket;
    const totalFeeAll = totalMidtransFee + totalPlatformFee;
    const totalRevenue = price * sales;
    const netRevenue = totalRevenue - totalFeeAll;
    const feePercentage = (totalFeeAll / totalRevenue) * 100;

    return {
      method,
      midtransFeePerTiket: Math.round(midtransFeePerTiket),
      platformFeePerTiket: Math.round(platformFeePerTiket),
      totalFeePerTiket: Math.round(totalPerTiket),
      midtransFeeTotal: Math.round(totalMidtransFee),
      platformFeeTotal: Math.round(totalPlatformFee),
      totalFeeAll: Math.round(totalFeeAll),
      netRevenue: Math.round(netRevenue),
      feePercentage: feePercentage.toFixed(2)
    };
  };

  // Hitung semua metode pembayaran
  const allMethods = Object.keys(paymentMethods).map(calculateFee);

  // Urutkan berdasarkan total fee (termurah di atas)
  const sortedMethods = [...allMethods].sort((a, b) => a.totalFeePerTiket - b.totalFeePerTiket);

  const formatRupiah = (num) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            💰 Pricing Calculator
          </h1>
          <p className="text-gray-600">Hitung estimasi revenue Anda dengan breakdown biaya lengkap</p>
        </div>

        {/* Input Controls */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-gradient-to-r from-blue-200 to-purple-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Harga Tiket */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                💵 Harga Tiket (IDR)
              </label>
              <div className="flex items-center gap-3">
                <span className="text-2xl text-gray-400">Rp</span>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(Math.max(1000, parseInt(e.target.value) || 0))}
                  className="flex-1 px-4 py-3 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-500 text-lg font-semibold"
                  placeholder="Masukkan harga tiket"
                  min="1000"
                  step="5000"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">Minimal: Rp 1.000</p>
            </div>

            {/* Estimasi Penjualan */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                📊 Estimasi Penjualan (Lembar Tiket)
              </label>
              <div className="flex items-center gap-3">
                <span className="text-2xl text-gray-400">#</span>
                <input
                  type="number"
                  value={sales}
                  onChange={(e) => setSales(Math.max(1, parseInt(e.target.value) || 0))}
                  className="flex-1 px-4 py-3 border-2 border-purple-300 rounded-lg focus:outline-none focus:border-purple-500 text-lg font-semibold"
                  placeholder="Berapa lembar tiket?"
                  min="1"
                  step="10"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">Total Revenue: <span className="font-bold">{formatRupiah(price * sales)}</span></p>
            </div>
          </div>
        </div>

        {/* Summary Terbaik */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Biaya Termurah */}
          <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-2xl shadow-lg p-6 text-white">
            <h3 className="text-sm font-semibold opacity-90 mb-2">🏆 BIAYA TERMURAH</h3>
            <p className="text-3xl font-bold mb-1">{paymentMethods[sortedMethods[0].method].icon} {paymentMethods[sortedMethods[0].method].name}</p>
            <p className="text-lg opacity-90">Rp {sortedMethods[0].totalFeePerTiket.toLocaleString('id-ID')} per tiket</p>
            <p className="text-sm opacity-75 mt-2">{sortedMethods[0].feePercentage}% dari harga tiket</p>
          </div>

          {/* Revenue Terambil */}
          <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl shadow-lg p-6 text-white">
            <h3 className="text-sm font-semibold opacity-90 mb-2">💎 REVENUE TERBAIK</h3>
            <p className="text-2xl font-bold mb-1">{formatRupiah(sortedMethods[0].netRevenue)}</p>
            <p className="text-sm opacity-90">({sortedMethods[0].method})</p>
            <p className="text-xs opacity-75 mt-2">Dari {sales} tiket @ {formatRupiah(price)}</p>
          </div>

          {/* Selisih Termahal */}
          <div className="bg-gradient-to-br from-red-400 to-red-600 rounded-2xl shadow-lg p-6 text-white">
            <h3 className="text-sm font-semibold opacity-90 mb-2">⚠️ BIAYA TERMAHAL</h3>
            <p className="text-3xl font-bold mb-1">{paymentMethods[sortedMethods[sortedMethods.length-1].method].icon} {paymentMethods[sortedMethods[sortedMethods.length-1].method].name}</p>
            <p className="text-lg opacity-90">Rp {sortedMethods[sortedMethods.length-1].totalFeePerTiket.toLocaleString('id-ID')} per tiket</p>
            <p className="text-sm opacity-75 mt-2">Selisih: Rp {(sortedMethods[sortedMethods.length-1].totalFeePerTiket - sortedMethods[0].totalFeePerTiket).toLocaleString('id-ID')}</p>
          </div>
        </div>

        {/* Detailed Breakdown Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6">
            <h2 className="text-2xl font-bold text-white">📋 Breakdown Lengkap Semua Metode Pembayaran</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b-2 border-gray-300">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Metode</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Biaya Midtrans</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Biaya Platform</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700 bg-orange-50">Total/Tiket</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Total ({sales} tiket)</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700 bg-green-50">Revenue Netto</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sortedMethods.map((data, idx) => {
                  const pm = paymentMethods[data.method];
                  const isBest = idx === 0;
                  const isWorst = idx === sortedMethods.length - 1;

                  return (
                    <tr 
                      key={data.method}
                      className={`hover:bg-blue-50 transition-colors ${
                        isBest ? 'bg-green-50' : isWorst ? 'bg-red-50' : ''
                      }`}
                    >
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {pm.icon} {pm.name}
                        {isBest && <span className="ml-2 inline-block bg-green-500 text-white text-xs px-2 py-1 rounded-full">✓ TERBAIK</span>}
                        {isWorst && <span className="ml-2 inline-block bg-red-500 text-white text-xs px-2 py-1 rounded-full">⚠ TERMAHAL</span>}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-600">Rp {data.midtransFeePerTiket.toLocaleString('id-ID')}</td>
                      <td className="px-6 py-4 text-right text-sm text-gray-600">Rp {data.platformFeePerTiket.toLocaleString('id-ID')}</td>
                      <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900 bg-orange-50">Rp {data.totalFeePerTiket.toLocaleString('id-ID')}</td>
                      <td className="px-6 py-4 text-right text-sm text-gray-600">Rp {data.totalFeeAll.toLocaleString('id-ID')}</td>
                      <td className="px-6 py-4 text-right text-sm font-bold text-green-600 bg-green-50">Rp {data.netRevenue.toLocaleString('id-ID')}</td>
                      <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900">{data.feePercentage}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border-2 border-blue-200 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-blue-900 mb-4">ℹ️ Penjelasan Biaya</h3>
          <div className="space-y-3 text-sm text-blue-800">
            <p><strong>📍 Biaya Midtrans:</strong> Biaya wajib dari payment gateway untuk memproses pembayaran. Tidak bisa dinegosiasikan dan berbeda untuk setiap metode pembayaran.</p>
            <p><strong>📍 Biaya Platform:</strong> Biaya untuk maintenance server, customer support, dan pengembangan fitur platform.</p>
            <p><strong>💡 Tips:</strong> Dorong organizer menggunakan GoPay/ShopeePay karena biaya paling murah. Buat campaign "Bayar dengan GoPay dapat cashback!"</p>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>💻 Calculator ini akurat berdasarkan struktur biaya Midtrans per February 2026</p>
          <p>Untuk update terbaru, hubungi tim support kami</p>
        </div>
      </div>
    </div>
  );
};

export default PricingCalculator;

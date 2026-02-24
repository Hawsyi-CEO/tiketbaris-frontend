import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config/api';
import PricingCalculator from '../components/PricingCalculator';

const PricingAnalytics = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/events/my-events`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.data && response.data.data.length > 0) {
        setEvents(response.data.data);
        setSelectedEvent(response.data.data[0]);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const fetchTransactions = async (eventId) => {
    if (!eventId) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/transactions/event/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const txns = response.data.data || response.data || [];
      setTransactions(txns);

      // Calculate stats
      calculateStats(txns);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (txns) => {
    const paymentMethods = {
      gopay: { midtrans: 2, platform: 1.5 },
      shopeepay: { midtrans: 2, platform: 1.5 },
      dana: { midtrans: 1.5, platform: 1.5 },
      bank: { midtrans: 4000, platform: 3000 },
      cc: { midtrans: 2.9, platform: 2.5 },
      minimarket: { midtrans: 5000, platform: 2000 },
      akulaku: { midtrans: 1.7, platform: 1.7 },
      kredivo: { midtrans: 2, platform: 1.7 }
    };

    let totalRevenue = 0;
    let totalMidtrans = 0;
    let totalPlatform = 0;
    const methodBreakdown = {};

    txns.forEach(txn => {
      const amount = txn.total_amount || 0;
      totalRevenue += amount;

      // Estimasi biaya (biasanya dari payment_type di txn)
      // Simplified: assume gopay for now
      const method = paymentMethods.gopay;
      const midtrans = (amount * method.midtrans) / 100;
      const platform = (amount * method.platform) / 100;

      totalMidtrans += midtrans;
      totalPlatform += platform;
    });

    setStats({
      totalTransactions: txns.length,
      totalRevenue,
      totalMidtrans: Math.round(totalMidtrans),
      totalPlatform: Math.round(totalPlatform),
      totalFees: Math.round(totalMidtrans + totalPlatform),
      netRevenue: Math.round(totalRevenue - totalMidtrans - totalPlatform),
      feePercentage: totalRevenue > 0 ? (((totalMidtrans + totalPlatform) / totalRevenue) * 100).toFixed(2) : 0
    });
  };

  const formatRupiah = (num) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num || 0);
  };

  const handleEventSelect = (event) => {
    setSelectedEvent(event);
    fetchTransactions(event.id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8">
        <h1 className="text-4xl font-bold mb-2">💰 Analisis Revenue & Biaya</h1>
        <p className="text-blue-100">Lihat breakdown biaya dan estimasi revenue untuk setiap event</p>
      </div>

      <div className="max-w-7xl mx-auto p-8 space-y-8">
        {/* Event Selector */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">📅 Pilih Event</h2>
          
          {events.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Anda belum membuat event. Buat event terlebih dahulu untuk melihat analisis.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.map(event => (
                <button
                  key={event.id}
                  onClick={() => handleEventSelect(event)}
                  className={`p-4 rounded-lg text-left transition-all border-2 ${
                    selectedEvent?.id === event.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 bg-white'
                  }`}
                >
                  <h3 className="font-semibold text-gray-900 truncate">{event.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {new Date(event.date).toLocaleDateString('id-ID')}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Rp {event.price?.toLocaleString('id-ID')} per tiket
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedEvent && (
          <>
            {/* Real Transaction Stats */}
            {stats && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">📊 Statistik Penjualan Aktual</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {/* Total Transactions */}
                  <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl p-6 text-white">
                    <p className="text-sm opacity-90 mb-2">Total Transaksi</p>
                    <p className="text-3xl font-bold">{stats.totalTransactions}</p>
                  </div>

                  {/* Total Revenue */}
                  <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-xl p-6 text-white">
                    <p className="text-sm opacity-90 mb-2">Total Revenue</p>
                    <p className="text-2xl font-bold">{formatRupiah(stats.totalRevenue)}</p>
                  </div>

                  {/* Net Revenue */}
                  <div className="bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl p-6 text-white">
                    <p className="text-sm opacity-90 mb-2">Uang Masuk (Netto)</p>
                    <p className="text-2xl font-bold">{formatRupiah(stats.netRevenue)}</p>
                  </div>

                  {/* Fee Percentage */}
                  <div className="bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl p-6 text-white">
                    <p className="text-sm opacity-90 mb-2">Total Potongan</p>
                    <p className="text-2xl font-bold">{stats.feePercentage}%</p>
                    <p className="text-xs opacity-75 mt-1">{formatRupiah(stats.totalFees)}</p>
                  </div>
                </div>

                {/* Fee Breakdown */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <h3 className="font-semibold text-gray-900 mb-4">Breakdown Biaya:</h3>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">Total Penjualan:</span>
                    <span className="font-semibold">{formatRupiah(stats.totalRevenue)}</span>
                  </div>
                  <div className="flex justify-between text-sm border-t pt-3">
                    <span className="text-gray-700">Biaya Midtrans:</span>
                    <span className="font-semibold text-red-600">-{formatRupiah(stats.totalMidtrans)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">Biaya Platform:</span>
                    <span className="font-semibold text-red-600">-{formatRupiah(stats.totalPlatform)}</span>
                  </div>
                  <div className="flex justify-between text-sm border-t pt-3 bg-green-50 -mx-4 px-4 py-3 rounded">
                    <span className="font-bold text-gray-900">Uang Masuk Ke Akun:</span>
                    <span className="font-bold text-green-600 text-lg">{formatRupiah(stats.netRevenue)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Pricing Calculator untuk Estimasi */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">🔮 Estimasi Revenue</h2>
              <p className="text-gray-600 mb-6">Ubah harga tiket atau estimasi penjualan untuk melihat proyeksi revenue dengan breakdown biaya lengkap</p>
              <PricingCalculator 
                ticketPrice={selectedEvent.price} 
                estimatedSales={stats?.totalTransactions || 100}
              />
            </div>

            {/* Tips & Strategy */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border-2 border-blue-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">💡 Tips Maksimalkan Revenue</h2>
              <div className="space-y-3 text-sm text-gray-700">
                <p className="flex items-start gap-3">
                  <span className="text-xl">💚</span>
                  <span><strong>Promosikan GoPay/ShopeePay:</strong> Biaya paling murah (hanya 3.5%). Buat campaign "Bayar GoPay gratis ongkir" atau "Diskon 2% untuk GoPay"</span>
                </p>
                <p className="flex items-start gap-3">
                  <span className="text-xl">📢</span>
                  <span><strong>Transparan ke Pembeli:</strong> Tunjukkan breakdown biaya. Customer akan mengerti kenapa harga berbeda per metode pembayaran.</span>
                </p>
                <p className="flex items-start gap-3">
                  <span className="text-xl">🎯</span>
                  <span><strong>Tingkatkan Harga Sedikit:</strong> Jika mayoritas pembeli pakai GoPay, biaya Anda kecil. Bisa tingkatkan harga dasar.</span>
                </p>
                <p className="flex items-start gap-3">
                  <span className="text-xl">📊</span>
                  <span><strong>Monitor Dashboard:</strong> Lihat metode pembayaran paling populer. Optimalkan pricing berdasarkan data real.</span>
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PricingAnalytics;

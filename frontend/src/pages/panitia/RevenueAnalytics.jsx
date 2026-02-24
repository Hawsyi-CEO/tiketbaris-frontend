import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ResponsiveLayout, ResponsiveCard, InteractiveButton, ResponsiveGrid } from '../../components/ResponsiveComponents';
import { API_URL } from '../../config/api';

const RevenueAnalytics = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('all');
  const [eventRevenue, setEventRevenue] = useState(null);
  const [dateRange, setDateRange] = useState('month');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/panitia/my-events`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEvents(response.data || []);
      if (response.data && response.data.length > 0) {
        setSelectedEventId(response.data[0].id);
        fetchEventRevenue(response.data[0].id);
      }
    } catch (err) {
      setError('Gagal memuat event');
      console.error(err);
    }
  };

  const fetchEventRevenue = async (eventId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/panitia/event/${eventId}/revenue`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEventRevenue(response.data);
      setError(null);
    } catch (err) {
      setError('Gagal memuat data revenue');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEventChange = (eventId) => {
    setSelectedEventId(eventId);
    fetchEventRevenue(eventId);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getPaymentMethodIcon = (method) => {
    const icons = {
      'gopay': '💳',
      'shopeepay': '🛒',
      'dana': '📱',
      'bank': '🏦',
      'cc': '💳',
      'minimarket': '🏪',
      'akulaku': '🎯',
      'kredivo': '💰'
    };
    return icons[method] || '💳';
  };

  const getPaymentMethodLabel = (method) => {
    const labels = {
      'gopay': 'GoPay',
      'shopeepay': 'ShopeePay',
      'dana': 'DANA',
      'bank': 'Transfer Bank',
      'cc': 'Kartu Kredit',
      'minimarket': 'Minimarket',
      'akulaku': 'Akulaku',
      'kredivo': 'Kredivo'
    };
    return labels[method] || method.toUpperCase();
  };

  if (!eventRevenue && !loading) {
    return (
      <ResponsiveLayout>
        <div className="space-y-6">
          <ResponsiveCard className="text-center">
            <div className="py-12">
              <div className="text-6xl mb-4">📊</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Revenue Analytics</h2>
              <p className="text-gray-600">Pilih event untuk melihat detail pendapatan</p>
            </div>
          </ResponsiveCard>
        </div>
      </ResponsiveLayout>
    );
  }

  return (
    <ResponsiveLayout>
      <div className="space-y-6">
        {/* Header */}
        <ResponsiveCard className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">📊 Revenue Analytics</h1>
              <p className="text-blue-100 mt-2">Analisis mendalam pendapatan event Anda</p>
            </div>
            <InteractiveButton
              variant="secondary"
              onClick={() => navigate('/panitia/dashboard')}
            >
              ← Kembali
            </InteractiveButton>
          </div>
        </ResponsiveCard>

        {error && (
          <ResponsiveCard className="bg-red-50 border-2 border-red-200">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="font-semibold text-red-900">{error}</p>
              </div>
            </div>
          </ResponsiveCard>
        )}

        {/* Event Selector */}
        <ResponsiveCard>
          <h3 className="text-lg font-bold text-gray-900 mb-4">🎭 Pilih Event</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {events.map((event) => (
              <button
                key={event.id}
                onClick={() => handleEventChange(event.id)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  selectedEventId === event.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-blue-300'
                }`}
              >
                <div className="font-semibold text-gray-900 line-clamp-1">{event.title}</div>
                <div className="text-sm text-gray-600 mt-1">
                  📅 {new Date(event.date).toLocaleDateString('id-ID')}
                </div>
                <div className="text-sm text-gray-600">
                  💰 Rp {event.price.toLocaleString('id-ID')}
                </div>
              </button>
            ))}
          </div>
        </ResponsiveCard>

        {/* Loading State */}
        {loading && (
          <ResponsiveCard className="text-center py-12">
            <div className="text-4xl mb-4 animate-pulse">⏳</div>
            <p className="text-gray-600">Memuat data revenue...</p>
          </ResponsiveCard>
        )}

        {eventRevenue && !loading && (
          <>
            {/* Event Info */}
            <ResponsiveCard className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Event</div>
                  <div className="text-lg font-bold text-gray-900">{eventRevenue.event.title}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Kapasitas</div>
                  <div className="text-lg font-bold text-gray-900">{eventRevenue.event.capacity} tiket</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Tersisa</div>
                  <div className="text-lg font-bold text-blue-600">{eventRevenue.event.remaining} tiket</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Harga per Tiket</div>
                  <div className="text-lg font-bold text-green-600">{formatCurrency(eventRevenue.event.price)}</div>
                </div>
              </div>
            </ResponsiveCard>

            {/* Revenue Summary */}
            <ResponsiveCard>
              <h3 className="text-lg font-bold text-gray-900 mb-4">💰 Ringkasan Pendapatan</h3>
              <ResponsiveGrid cols={{ xs: 2, sm: 2, lg: 4 }}>
                {/* Tiket Terjual */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="text-sm text-gray-600 mb-2">Tiket Terjual</div>
                  <div className="text-2xl font-bold text-blue-600">{eventRevenue.revenue.tickets_sold}</div>
                  <div className="text-xs text-gray-500 mt-2">{eventRevenue.revenue.total_transactions} transaksi</div>
                </div>

                {/* Total Gross */}
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="text-sm text-gray-600 mb-2">Total Terjual</div>
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(eventRevenue.revenue.total_gross_amount)}</div>
                  <div className="text-xs text-gray-500 mt-2">Sebelum potongan</div>
                </div>

                {/* Platform Fee */}
                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                  <div className="text-sm text-gray-600 mb-2">Komisi Platform</div>
                  <div className="text-2xl font-bold text-orange-500">-{formatCurrency(eventRevenue.revenue.total_platform_fee)}</div>
                  <div className="text-xs text-gray-500 mt-2">{eventRevenue.revenue.total_platform_fee_percentage}% flat</div>
                </div>

                {/* Midtrans Fee */}
                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <div className="text-sm text-gray-600 mb-2">Biaya Midtrans</div>
                  <div className="text-2xl font-bold text-red-500">-{formatCurrency(eventRevenue.revenue.total_midtrans_fee)}</div>
                  <div className="text-xs text-gray-500 mt-2">Biaya payment gateway</div>
                </div>
              </ResponsiveGrid>

              {/* Net Amount - Big Card */}
              <div className="mt-4 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg p-6 text-white">
                <div className="text-sm text-emerald-100 mb-2">💳 Bersih ke Akun Anda</div>
                <div className="text-3xl font-bold">{formatCurrency(eventRevenue.revenue.net_to_organizer)}</div>
                <div className="text-sm text-emerald-200 mt-2">
                  Komisi: {formatCurrency(eventRevenue.revenue.total_platform_fee)} + 
                  Midtrans: {formatCurrency(eventRevenue.revenue.total_midtrans_fee)} = 
                  Total Potongan: {formatCurrency(eventRevenue.revenue.total_platform_fee + eventRevenue.revenue.total_midtrans_fee)}
                </div>
              </div>
            </ResponsiveCard>

            {/* Payment Method Breakdown */}
            {Object.keys(eventRevenue.revenue.by_payment_method || {}).length > 0 && (
              <ResponsiveCard>
                <h3 className="text-lg font-bold text-gray-900 mb-4">📊 Breakdown per Metode Pembayaran</h3>
                <ResponsiveGrid cols={{ xs: 1, sm: 2, lg: 3 }}>
                  {Object.entries(eventRevenue.revenue.by_payment_method).map(([method, data]) => (
                    <div key={method} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-2xl">{getPaymentMethodIcon(method)}</span>
                        <div className="font-semibold text-gray-900">{getPaymentMethodLabel(method)}</div>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        {/* Transactions */}
                        <div className="flex justify-between items-center pb-2 border-b border-gray-300">
                          <span className="text-gray-600">Transaksi</span>
                          <span className="font-bold text-gray-900">{data.count}x</span>
                        </div>

                        {/* Gross */}
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Terjual</span>
                          <span className="font-semibold text-gray-900">{formatCurrency(data.gross)}</span>
                        </div>

                        {/* Fees */}
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-500">Komisi (2%)</span>
                          <span className="text-orange-600">-{formatCurrency(Math.floor(data.gross * 0.02))}</span>
                        </div>

                        <div className="flex justify-between items-center text-xs pb-2 border-b border-gray-300">
                          <span className="text-gray-500">Midtrans</span>
                          <span className="text-red-600">-{formatCurrency(data.midtrans_fee || 0)}</span>
                        </div>

                        {/* Net */}
                        <div className="flex justify-between items-center pt-2">
                          <span className="font-semibold text-gray-700">Bersih</span>
                          <span className="font-bold text-green-600">{formatCurrency(data.net)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </ResponsiveGrid>
              </ResponsiveCard>
            )}

            {/* Transactions List */}
            {eventRevenue.transactions && eventRevenue.transactions.length > 0 && (
              <ResponsiveCard>
                <h3 className="text-lg font-bold text-gray-900 mb-4">🧾 Daftar Transaksi ({eventRevenue.transactions.length})</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b-2 border-gray-300">
                      <tr className="text-gray-600">
                        <th className="text-left py-2 px-3">Qty</th>
                        <th className="text-left py-2 px-3">Gross</th>
                        <th className="text-left py-2 px-3">Komisi 2%</th>
                        <th className="text-left py-2 px-3">Midtrans</th>
                        <th className="text-left py-2 px-3">Bersih</th>
                        <th className="text-left py-2 px-3">Metode</th>
                        <th className="text-left py-2 px-3">Tanggal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {eventRevenue.transactions.map((trans, idx) => (
                        <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-2 px-3 font-semibold text-gray-900">{trans.quantity}</td>
                          <td className="py-2 px-3 text-gray-900">{formatCurrency(trans.gross_amount)}</td>
                          <td className="py-2 px-3 text-orange-600">-{formatCurrency(trans.platform_fee)}</td>
                          <td className="py-2 px-3 text-red-600">-{formatCurrency(trans.midtrans_fee)}</td>
                          <td className="py-2 px-3 font-bold text-green-600">{formatCurrency(trans.net_amount)}</td>
                          <td className="py-2 px-3">
                            <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">
                              {getPaymentMethodIcon(trans.payment_method)} {getPaymentMethodLabel(trans.payment_method)}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-gray-600 text-xs">
                            {new Date(trans.date).toLocaleDateString('id-ID')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ResponsiveCard>
            )}

            {/* Empty Transactions */}
            {(!eventRevenue.transactions || eventRevenue.transactions.length === 0) && (
              <ResponsiveCard className="text-center py-12">
                <div className="text-6xl mb-4">🎪</div>
                <p className="text-gray-600 text-lg">Belum ada transaksi untuk event ini</p>
              </ResponsiveCard>
            )}
          </>
        )}
      </div>
    </ResponsiveLayout>
  );
};

export default RevenueAnalytics;

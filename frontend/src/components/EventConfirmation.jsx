import { useState } from 'react';

export default function EventConfirmation({ eventData, onConfirm, onBack, onCancel, isCreating = false }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Use parent loading state if provided, otherwise use local state
  const loading = isCreating || isSubmitting;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };

  const calculateCommission = () => {
    const totalRevenue = eventData.price * eventData.stock;
    const commission = totalRevenue * 0.02;
    const netRevenue = totalRevenue - commission;
    return { totalRevenue, commission, netRevenue };
  };

  const { totalRevenue, commission, netRevenue } = calculateCommission();

  const handleConfirm = async () => {
    if (!isCreating) {
      setIsSubmitting(true);
    }
    try {
      await onConfirm();
    } catch (error) {
      console.error('Error creating event:', error);
      if (!isCreating) {
        setIsSubmitting(false);
      }
    }
  };

  const getCategoryLabel = (category) => {
    const categories = {
      music: '🎸 Musik & Konser',
      sports: '🏆 Olahraga',
      education: '🎓 Pendidikan & Workshop',
      technology: '🚀 Teknologi & Startup',
      arts: '🖼️ Seni & Budaya',
      food: '🍕 Kuliner & Festival',
      business: '📊 Bisnis & Networking',
      entertainment: '🎪 Hiburan & Pertunjukan',
      charity: '🤝 Sosial & Charity',
      other: '✨ Lainnya'
    };
    return categories[category] || category;
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-center gap-4">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-bold">
              ✓
            </div>
            <span className="ml-2 text-sm font-semibold text-green-600">Syarat & Ketentuan</span>
          </div>
          <div className="w-16 h-1 bg-green-500"></div>
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-bold">
              ✓
            </div>
            <span className="ml-2 text-sm font-semibold text-green-600">Detail Event</span>
          </div>
          <div className="w-16 h-1 bg-indigo-500"></div>
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
              3
            </div>
            <span className="ml-2 text-sm font-semibold text-indigo-600">Konfirmasi</span>
          </div>
        </div>
      </div>

      {/* Confirmation Card */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
          <h2 className="text-3xl font-bold mb-2">✅ Konfirmasi Event</h2>
          <p className="text-indigo-100">Periksa kembali detail event Anda sebelum dipublikasikan</p>
        </div>

        <div className="p-8">
          {/* Event Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Left: Image */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">🖼️ Gambar Event</h3>
              <img 
                src={eventData.imagePreview} 
                alt={eventData.title} 
                className="w-full rounded-lg shadow-md"
              />
            </div>

            {/* Right: Details */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">📋 Detail Event</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-600">Judul Event</label>
                  <p className="text-lg font-bold text-gray-900">{eventData.title}</p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-600">Kategori</label>
                  <p className="text-gray-900">{getCategoryLabel(eventData.category)}</p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-600">Deskripsi</label>
                  <p className="text-gray-700 text-sm leading-relaxed">{eventData.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-600">📅 Tanggal</label>
                    <p className="text-gray-900 text-sm">{formatDate(eventData.date)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600">📍 Lokasi</label>
                    <p className="text-gray-900 text-sm">{eventData.location}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-600">💰 Harga</label>
                    <p className="text-lg font-bold text-indigo-600">{formatCurrency(eventData.price)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600">🎫 Stok</label>
                    <p className="text-lg font-bold text-purple-600">{eventData.stock} tiket</p>
                  </div>
                </div>

                {eventData.documents && (
                  <div>
                    <label className="text-sm font-semibold text-gray-600">📄 Dokumen</label>
                    <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg mt-1">
                      <span className="text-2xl">📎</span>
                      <p className="text-sm text-gray-700">{eventData.documentPreview || 'Dokumen terlampir'}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              💹 Proyeksi Pendapatan (Jika Semua Tiket Terjual)
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Total Penjualan Tiket:</span>
                <span className="font-bold text-lg text-gray-900">
                  {eventData.stock} tiket × {formatCurrency(eventData.price)} = {formatCurrency(totalRevenue)}
                </span>
              </div>
              <div className="flex justify-between items-center text-red-600">
                <span>Komisi Platform (2%):</span>
                <span className="font-bold">- {formatCurrency(commission)}</span>
              </div>
              <div className="border-t-2 border-green-300 pt-3 flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">Pendapatan Anda:</span>
                <span className="text-2xl font-bold text-green-600">{formatCurrency(netRevenue)}</span>
              </div>
            </div>
            <div className="mt-4 bg-white bg-opacity-70 p-3 rounded-lg">
              <p className="text-xs text-gray-600">
                ℹ️ <strong>Catatan:</strong> Dana akan tersedia untuk ditarik setelah event selesai. 
                Komisi dipotong otomatis dari setiap transaksi.
              </p>
            </div>
          </div>

          {/* Important Notes */}
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded mb-6">
            <h4 className="font-bold text-amber-800 mb-2">⚠️ Penting untuk Diperhatikan:</h4>
            <ul className="text-sm text-amber-700 space-y-1 ml-4 list-disc">
              <li>Event akan langsung <strong>aktif dan muncul di halaman utama</strong> setelah Anda klik "Publikasikan Event"</li>
              <li>Pastikan semua informasi sudah benar karena event yang sudah aktif memerlukan persetujuan admin untuk diubah</li>
              <li>Anda bertanggung jawab penuh atas penyelenggaraan event sesuai dengan informasi yang dipublikasikan</li>
              <li>Dengan mempublikasikan event ini, Anda menyetujui <strong>Syarat & Ketentuan</strong> yang telah Anda baca sebelumnya</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={onBack}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed text-gray-700 font-semibold rounded-lg transition-all duration-300"
            >
              ⬅️ Kembali & Edit
            </button>
            <button
              onClick={onCancel}
              disabled={loading}
              className="px-6 py-3 bg-red-500 hover:bg-red-600 disabled:bg-red-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-300"
            >
              ❌ Batalkan
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-bold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Membuat Event...</span>
                </>
              ) : (
                <>
                  <span>🚀 Publikasikan Event Sekarang</span>
                </>
              )}
            </button>
          </div>

          {/* Success Guarantee */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              🔒 Data Anda aman dan dilindungi. Event dapat dikelola melalui dashboard Anda.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

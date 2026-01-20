import React from 'react';

const InfoModal = ({ isOpen, onClose, type }) => {
  if (!isOpen) return null;

  const content = {
    about: {
      title: '📱 Tentang Kami',
      body: (
        <>
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Tiket Baris</h2>
            <p className="text-sm text-gray-600">Platform Pemesanan Tiket Event</p>
          </div>

          <div className="space-y-4 text-sm text-gray-700">
            <p>
              Tiket Baris adalah platform digital yang mempermudah pembelian tiket event 
              dan pengelolaan acara. Dari konser musik, seminar, festival, hingga event 
              olahraga - semua bisa dikelola dalam satu platform.
            </p>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100">
              <h3 className="font-bold text-gray-900 mb-2">🔗 Bagian dari Ekosistem SimpaSkor</h3>
              <p className="text-sm mb-3">
                Tiket Baris adalah layanan resmi dari SimpaSkor, platform terpercaya untuk 
                berbagai kebutuhan digital Anda.
              </p>
              <a 
                href="https://simpaskor.id" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all text-sm"
              >
                🌐 Kunjungi SimpaSkor
              </a>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-2">✨ Visi Kami</h3>
              <ul className="space-y-1.5 ml-4">
                <li>✅ Mempermudah akses tiket event untuk semua orang</li>
                <li>✅ Membantu panitia mengelola event dengan efisien</li>
                <li>✅ Transaksi aman dan terpercaya</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-bold text-gray-900 mb-2">📞 Hubungi Kami</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span>📧</span>
                  <a href="mailto:vertinovagroup@gmail.com" className="text-blue-600 hover:underline">
                    vertinovagroup@gmail.com
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <span>📱</span>
                  <a href="https://wa.me/6285161414022" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    +62 851-6141-4022
                  </a>
                </div>
              </div>
            </div>
          </div>
        </>
      )
    },
    help: {
      title: '🆘 Bantuan',
      body: (
        <>
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Butuh Bantuan?</h2>
            <p className="text-sm text-gray-600">Hubungi kami dan kami siap membantu Anda</p>
          </div>

          <div className="space-y-4">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200 text-center">
              <div className="text-4xl mb-3">💬</div>
              <h3 className="font-bold text-gray-900 mb-2">Chat WhatsApp Admin</h3>
              <p className="text-sm text-gray-600 mb-4">
                Klik tombol di bawah untuk chat langsung dengan admin kami
              </p>
              <a
                href="https://wa.me/6285161414022?text=Halo%20Admin%20Tiket%20Baris,%20saya%20butuh%20bantuan"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold hover:shadow-lg transition-all"
              >
                <span className="text-xl">📱</span>
                Chat WhatsApp Sekarang
              </a>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-bold text-gray-900 mb-2">📧 Email Support</h3>
              <a href="mailto:vertinovagroup@gmail.com" className="text-blue-600 hover:underline">
                vertinovagroup@gmail.com
              </a>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-bold text-gray-900 mb-2">⏰ Jam Operasional</h3>
              <p className="text-sm text-gray-700">Senin - Minggu: 08.00 - 22.00 WIB</p>
              <p className="text-xs text-gray-500 mt-1">(Respon dalam 1-24 jam)</p>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-bold text-gray-900 mb-3">❓ FAQ Cepat</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="font-semibold text-gray-800">• Cara beli tiket?</p>
                  <p className="text-gray-600 ml-4">Pilih event → Klik Beli Tiket → Bayar via Midtrans</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-800">• Tiket tidak muncul?</p>
                  <p className="text-gray-600 ml-4">Cek email atau tab "Tiket Saya" di dashboard</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-800">• Cara scan tiket?</p>
                  <p className="text-gray-600 ml-4">Panitia akan scan QR code saat masuk event</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )
    },
    terms: {
      title: '📋 Syarat & Ketentuan',
      body: (
        <>
          <div className="text-center mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Syarat & Ketentuan</h2>
            <p className="text-xs sm:text-sm text-gray-600">Terakhir diperbarui: 21 Januari 2026</p>
          </div>

          <div className="space-y-4 text-xs sm:text-sm text-gray-700 max-h-[60vh] overflow-y-auto pr-2">
            <p className="text-gray-600">
              Dengan menggunakan platform Tiket Baris, Anda menyetujui syarat dan ketentuan berikut:
            </p>

            <div className="bg-red-50 rounded-xl p-4 border border-red-200">
              <h3 className="font-bold text-gray-900 mb-2">1. KETENTUAN PEMBELIAN</h3>
              <ul className="space-y-1.5 ml-4">
                <li>✅ Tiket yang sudah dibeli <strong>TIDAK DAPAT DIREFUND/DIKEMBALIKAN</strong></li>
                <li>✅ Tiket <strong>TIDAK DAPAT DITRANSFER</strong> ke nama lain</li>
                <li>✅ 1 QR Code hanya berlaku untuk 1 orang masuk</li>
                <li>✅ Pembayaran melalui Midtrans (Gopay, OVO, Bank Transfer, dll)</li>
              </ul>
            </div>

            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <h3 className="font-bold text-gray-900 mb-2">2. VERIFIKASI & KEAMANAN</h3>
              <ul className="space-y-1.5 ml-4">
                <li>✅ QR Code hanya bisa di-scan <strong>1 kali</strong> oleh panitia</li>
                <li>✅ Screenshot/foto QR Code tetap valid (simpan backup)</li>
                <li>✅ Jangan bagikan QR Code ke orang lain</li>
              </ul>
            </div>

            <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
              <h3 className="font-bold text-gray-900 mb-2">3. TANGGUNG JAWAB EVENT</h3>
              <ul className="space-y-1.5 ml-4">
                <li>⚠️ Event diselenggarakan oleh <strong>PANITIA/ORGANIZER</strong>, bukan Tiket Baris</li>
                <li>⚠️ Tiket Baris hanya menyediakan platform pemesanan</li>
                <li>⚠️ Keluhan terkait acara harap hubungi panitia langsung</li>
              </ul>
            </div>

            <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
              <h3 className="font-bold text-gray-900 mb-2">4. PEMBATALAN/PERUBAHAN EVENT</h3>
              <div className="space-y-3">
                <div>
                  <p className="font-semibold mb-1">📌 Jika event DIBATALKAN oleh panitia:</p>
                  <ul className="space-y-1 ml-4 text-xs sm:text-sm">
                    <li>• Panitia wajib mengembalikan dana ke pembeli</li>
                    <li>• Tiket Baris memfasilitasi proses refund maksimal 14 hari kerja</li>
                    <li>• Hubungi admin untuk proses refund</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold mb-1">📌 Jika event DIUBAH jadwal/lokasi:</p>
                  <ul className="space-y-1 ml-4 text-xs sm:text-sm">
                    <li>• Tiket tetap berlaku untuk jadwal/lokasi baru</li>
                    <li>• Pembeli akan diinfokan via email/notifikasi</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-bold text-gray-900 mb-2">5. LARANGAN</h3>
              <ul className="space-y-1.5 ml-4">
                <li>❌ Jual-beli tiket di luar platform (calo)</li>
                <li>❌ Duplikasi/pemalsuan QR Code</li>
                <li>❌ Penyalahgunaan akun untuk aktivitas ilegal</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-bold text-gray-900 mb-2">6. HAK PLATFORM</h3>
              <ul className="space-y-1.5 ml-4">
                <li>🔒 Tiket Baris berhak menutup akun yang melanggar ketentuan</li>
                <li>🔒 Perubahan S&K dapat dilakukan dengan pemberitahuan</li>
              </ul>
            </div>
          </div>
        </>
      )
    },
    privacy: {
      title: '🔒 Kebijakan Privasi',
      body: (
        <>
          <div className="text-center mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Kebijakan Privasi</h2>
            <p className="text-xs sm:text-sm text-gray-600">Terakhir diperbarui: 21 Januari 2026</p>
          </div>

          <div className="space-y-4 text-xs sm:text-sm text-gray-700 max-h-[60vh] overflow-y-auto pr-2">
            <p className="text-gray-600">
              Kami menghormati privasi Anda dan berkomitmen melindungi data pribadi Anda.
            </p>

            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <h3 className="font-bold text-gray-900 mb-2">1. DATA YANG KAMI KUMPULKAN</h3>
              <ul className="space-y-1.5 ml-4">
                <li>📝 Username & Email (untuk login)</li>
                <li>📝 Nomor HP (opsional, untuk notifikasi)</li>
                <li>📝 Riwayat pembelian tiket</li>
                <li>📝 Informasi pembayaran (diproses Midtrans, tidak disimpan di server kami)</li>
              </ul>
            </div>

            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <h3 className="font-bold text-gray-900 mb-2">2. PENGGUNAAN DATA</h3>
              <ul className="space-y-1.5 ml-4">
                <li>✅ Verifikasi pembelian dan pengiriman tiket digital</li>
                <li>✅ Notifikasi terkait event dan transaksi</li>
                <li>✅ Komunikasi customer support</li>
                <li>✅ Analisis untuk meningkatkan layanan</li>
              </ul>
            </div>

            <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
              <h3 className="font-bold text-gray-900 mb-2">3. KEAMANAN DATA</h3>
              <ul className="space-y-1.5 ml-4">
                <li>🔒 Data disimpan dengan enkripsi</li>
                <li>🔒 Password di-hash (tidak bisa dibaca siapapun)</li>
                <li>🔒 Akses database terbatas untuk admin</li>
                <li>🔒 HTTPS/SSL untuk semua transaksi</li>
              </ul>
            </div>

            <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
              <h3 className="font-bold text-gray-900 mb-2">4. COOKIES & SESSION</h3>
              <ul className="space-y-1.5 ml-4">
                <li>🍪 Kami menggunakan cookies untuk menyimpan sesi login</li>
                <li>🍪 Tidak ada tracking iklan pihak ketiga</li>
              </ul>
            </div>

            <div className="bg-red-50 rounded-xl p-4 border border-red-200">
              <h3 className="font-bold text-gray-900 mb-2">5. BERBAGI DATA</h3>
              <ul className="space-y-1.5 ml-4">
                <li>⚠️ Data email/nama <strong>HANYA</strong> dibagikan ke panitia event yang Anda beli tiketnya</li>
                <li>⚠️ <strong>TIDAK</strong> dibagikan ke pihak ketiga untuk marketing</li>
                <li>⚠️ Data pembayaran diproses langsung oleh Midtrans (Payment Gateway)</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-bold text-gray-900 mb-2">6. HAK PENGGUNA</h3>
              <ul className="space-y-1.5 ml-4">
                <li>✅ Anda bisa menghapus akun kapan saja</li>
                <li>✅ Anda bisa request data yang kami simpan</li>
                <li>✅ Anda bisa opt-out dari notifikasi email</li>
              </ul>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200">
              <p className="text-sm">
                <strong>Pertanyaan tentang privasi?</strong><br/>
                Hubungi: <a href="mailto:vertinovagroup@gmail.com" className="text-blue-600 hover:underline">vertinovagroup@gmail.com</a>
              </p>
            </div>
          </div>
        </>
      )
    }
  };

  const currentContent = content[type] || content.about;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-orange-600 text-white px-4 sm:px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold">{currentContent.title}</h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {currentContent.body}
        </div>
      </div>
    </div>
  );
};

export default InfoModal;

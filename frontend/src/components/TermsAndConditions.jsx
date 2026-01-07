import { useState } from 'react';

export default function TermsAndConditions({ onAccept, onCancel }) {
  const [isChecked, setIsChecked] = useState(false);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(false);

  const handleScroll = (e) => {
    const element = e.target;
    const isAtBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 10;
    if (isAtBottom && !isScrolledToBottom) {
      setIsScrolledToBottom(true);
    }
  };

  const handleAccept = () => {
    if (!isChecked) {
      alert('Anda harus menyetujui syarat dan ketentuan untuk melanjutkan');
      return;
    }
    onAccept();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-1 sm:p-4 overflow-hidden">
      <div className="bg-white rounded-lg sm:rounded-2xl shadow-2xl max-w-4xl w-full h-[96vh] sm:h-auto sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-2 sm:p-5 lg:p-6 flex-shrink-0">
          <h2 className="text-base sm:text-2xl lg:text-3xl font-bold mb-0.5 sm:mb-2 leading-tight">📜 Syarat & Ketentuan</h2>
          <p className="text-[10px] sm:text-sm text-indigo-100 leading-tight">Dibaca dengan teliti sebelum membuat event</p>
        </div>

        {/* Content */}
        <div 
          className="px-2 pt-2 pb-1 sm:p-5 lg:p-6 overflow-y-auto flex-1 space-y-2 sm:space-y-4 lg:space-y-5 text-gray-700 text-[11px] sm:text-sm leading-relaxed"
          onScroll={handleScroll}
          style={{ WebkitOverflowScrolling: 'touch', maxHeight: 'calc(96vh - 180px)' }}
        >
          {/* Intro */}
          <div className="bg-blue-50 border-l-2 sm:border-l-4 border-blue-500 p-2 sm:p-3 lg:p-4 rounded text-[11px] sm:text-sm">
            <p className="leading-relaxed">
              Selamat datang di <strong>tiketbaris.id</strong>! Dengan membuat event di platform kami, 
              Anda menyetujui syarat dan ketentuan berikut yang mengatur kerjasama antara penyelenggara event 
              (selanjutnya disebut "Panitia") dan platform tiketbaris.id.
            </p>
          </div>

          {/* 1. Komisi Platform */}
          <div>
            <h3 className="text-xs sm:text-base lg:text-lg font-bold text-indigo-600 mb-1.5 sm:mb-3 flex items-center gap-1.5">
              <span>💰</span> <span>1. Komisi Platform</span>
            </h3>
            <ul className="space-y-1 text-[11px] sm:text-sm ml-3 sm:ml-6 list-disc leading-relaxed">
              <li>Platform tiketbaris.id mengenakan <strong>komisi sebesar 2%</strong> dari setiap tiket yang terjual.</li>
              <li>Komisi akan dipotong secara otomatis sebelum dana ditransfer ke rekening Panitia.</li>
              <li>Tidak ada biaya pendaftaran atau biaya tersembunyi lainnya.</li>
              <li>Contoh: Tiket seharga Rp 100.000 → Komisi Rp 2.000 → Panitia menerima Rp 98.000 per tiket.</li>
            </ul>
          </div>

          {/* 2. Kebijakan Refund */}
          <div>
            <h3 className="text-xs sm:text-base lg:text-lg font-bold text-indigo-600 mb-1.5 sm:mb-3 flex items-center gap-1.5">
              <span>🔄</span> <span>2. Kebijakan Refund & Pembatalan</span>
            </h3>
            <ul className="space-y-1 text-[11px] sm:text-sm ml-3 sm:ml-6 list-disc leading-relaxed">
              <li><strong>Pembatalan oleh Pembeli:</strong> Refund hanya dapat dilakukan jika Panitia menyetujui atau event dibatalkan oleh Panitia.</li>
              <li><strong>Pembatalan oleh Panitia:</strong> Jika event dibatalkan, Panitia wajib mengembalikan 100% dana kepada pembeli melalui sistem kami.</li>
              <li>Refund akan diproses dalam waktu maksimal 7 hari kerja setelah persetujuan.</li>
              <li>Komisi platform <strong>tidak dapat dikembalikan</strong> jika event sudah berjalan dan pembeli membatalkan secara sepihak tanpa alasan yang jelas.</li>
              <li>Force majeure (bencana alam, pandemi, dll) akan ditangani secara kasus per kasus dengan kebijakan khusus.</li>
            </ul>
          </div>

          {/* 3. Tanggung Jawab Panitia */}
          <div>
            <h3 className="text-xs sm:text-base lg:text-lg font-bold text-indigo-600 mb-1.5 sm:mb-3 flex items-center gap-1.5">
              <span>✅</span> <span>3. Tanggung Jawab Panitia</span>
            </h3>
            <ul className="space-y-1 text-[11px] sm:text-sm ml-3 sm:ml-6 list-disc leading-relaxed">
              <li>Panitia bertanggung jawab penuh atas konten event yang dipublikasikan (deskripsi, gambar, harga, dll).</li>
              <li>Panitia wajib memastikan event diselenggarakan sesuai dengan informasi yang telah dipublikasikan.</li>
              <li>Panitia tidak diperbolehkan menjual tiket di luar platform untuk event yang sama (eksklusivitas).</li>
              <li>Panitia wajib memberikan pelayanan terbaik kepada pembeli tiket dan menyelesaikan komplain dengan profesional.</li>
              <li>Panitia tidak diperbolehkan memuat konten yang melanggar hukum, SARA, pornografi, atau menyinggung pihak lain.</li>
              <li>Pelanggaran terhadap ketentuan ini dapat mengakibatkan penangguhan akun atau pemutusan kerjasama secara permanen.</li>
            </ul>
          </div>

          {/* 4. Hak & Kewajiban Platform */}
          <div>
            <h3 className="text-xs sm:text-base lg:text-lg font-bold text-indigo-600 mb-1.5 sm:mb-3 flex items-center gap-1.5">
              <span>🏢</span> <span>4. Hak & Kewajiban Platform</span>
            </h3>
            <ul className="space-y-1 text-[11px] sm:text-sm ml-3 sm:ml-6 list-disc leading-relaxed">
              <li>Platform berhak menampilkan event Anda di halaman utama dan melakukan promosi tanpa biaya tambahan.</li>
              <li>Platform berhak menangguhkan atau menghapus event yang melanggar ketentuan atau mendapat laporan dari pengguna.</li>
              <li>Platform akan menyediakan sistem pembayaran yang aman dan dashboard untuk monitoring penjualan tiket real-time.</li>
              <li>Platform tidak bertanggung jawab atas kerugian yang timbul akibat kesalahan informasi yang diberikan oleh Panitia.</li>
              <li>Platform akan membantu mediasi jika terjadi sengketa antara Panitia dan pembeli, namun keputusan akhir ada di tangan Panitia.</li>
            </ul>
          </div>

          {/* 5. Pencairan Dana */}
          <div>
            <h3 className="text-xs sm:text-base lg:text-lg font-bold text-indigo-600 mb-1.5 sm:mb-3 flex items-center gap-1.5">
              <span>💳</span> <span>5. Pencairan Dana (Withdrawal)</span>
            </h3>
            <ul className="space-y-1 text-[11px] sm:text-sm ml-3 sm:ml-6 list-disc leading-relaxed">
              <li>Dana hasil penjualan tiket dapat ditarik <strong>setelah event selesai</strong> atau sesuai dengan jadwal yang telah disepakati.</li>
              <li>Pencairan dana dapat dilakukan melalui transfer bank dengan minimal penarikan Rp 50.000.</li>
              <li>Proses pencairan memerlukan waktu 3-5 hari kerja setelah permintaan diajukan.</li>
              <li>Platform berhak menahan dana sementara jika terdapat indikasi fraud atau komplain yang belum diselesaikan.</li>
            </ul>
          </div>

          {/* 6. Keamanan Data */}
          <div>
            <h3 className="text-xs sm:text-base lg:text-lg font-bold text-indigo-600 mb-1.5 sm:mb-3 flex items-center gap-1.5">
              <span>🔐</span> <span>6. Privasi & Keamanan Data</span>
            </h3>
            <ul className="space-y-1 text-[11px] sm:text-sm ml-3 sm:ml-6 list-disc leading-relaxed">
              <li>Platform akan menjaga kerahasiaan data pribadi Panitia dan pembeli sesuai dengan peraturan perlindungan data yang berlaku.</li>
              <li>Data penjualan dan informasi pembeli dapat diakses oleh Panitia melalui dashboard untuk keperluan operasional event.</li>
              <li>Platform tidak akan membagikan data Anda kepada pihak ketiga tanpa izin, kecuali diwajibkan oleh hukum.</li>
            </ul>
          </div>

          {/* 7. Perubahan Ketentuan */}
          <div>
            <h3 className="text-xs sm:text-base lg:text-lg font-bold text-indigo-600 mb-1.5 sm:mb-3 flex items-center gap-1.5">
              <span>📝</span> <span>7. Perubahan Syarat & Ketentuan</span>
            </h3>
            <ul className="space-y-1 text-[11px] sm:text-sm ml-3 sm:ml-6 list-disc leading-relaxed">
              <li>Platform berhak mengubah syarat dan ketentuan ini sewaktu-waktu dengan pemberitahuan kepada Panitia.</li>
              <li>Perubahan akan berlaku efektif setelah 14 hari sejak pemberitahuan dikirimkan melalui email atau notifikasi di dashboard.</li>
              <li>Panitia yang tidak menyetujui perubahan dapat menghentikan kerjasama dengan tetap menyelesaikan kewajiban atas event yang sedang berjalan.</li>
            </ul>
          </div>

          {/* 8. Hukum yang Berlaku */}
          <div>
            <h3 className="text-xs sm:text-base lg:text-lg font-bold text-indigo-600 mb-1.5 sm:mb-3 flex items-center gap-1.5">
              <span>⚖️</span> <span>8. Hukum yang Berlaku</span>
            </h3>
            <ul className="space-y-1 text-[11px] sm:text-sm ml-3 sm:ml-6 list-disc leading-relaxed">
              <li>Syarat dan ketentuan ini tunduk pada hukum Negara Republik Indonesia.</li>
              <li>Segala perselisihan yang timbul akan diselesaikan secara musyawarah, atau jika tidak tercapai, akan diselesaikan melalui jalur hukum di Pengadilan Negeri yang berwenang.</li>
            </ul>
          </div>

          {/* Footer Note */}
          <div className="bg-amber-50 border-l-2 sm:border-l-4 border-amber-500 p-2 sm:p-3 lg:p-4 rounded">
            <p className="text-[11px] sm:text-sm font-semibold text-amber-800 leading-relaxed">
              ⚠️ <strong>PENTING:</strong> Dengan mencentang kotak, Anda menyatakan telah membaca, 
              memahami, dan menyetujui seluruh syarat dan ketentuan ini.
            </p>
          </div>

          {!isScrolledToBottom && (
            <div className="text-center text-[10px] sm:text-sm text-gray-500 animate-pulse py-1 sm:py-2">
              ⬇️ Scroll ke bawah untuk melanjutkan
            </div>
          )}
        </div>

        {/* Footer - Checkbox & Buttons */}
        <div className="bg-gray-50 p-2 sm:p-4 lg:p-6 border-t flex-shrink-0" style={{ minHeight: '90px' }}>
          <label className="flex items-start gap-2 mb-2 cursor-pointer group">
            <input 
              type="checkbox" 
              checked={isChecked}
              onChange={(e) => setIsChecked(e.target.checked)}
              disabled={!isScrolledToBottom}
              className="mt-0.5 w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            />
            <span className={`text-[10px] sm:text-sm leading-tight ${isScrolledToBottom ? 'text-gray-700' : 'text-gray-400'}`}>
              Saya telah membaca dan menyetujui <strong>Syarat & Ketentuan Kerjasama</strong> yang berlaku.
            </span>
          </label>

          <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-2">
            <button
              onClick={onCancel}
              className="w-full sm:flex-1 px-3 sm:px-6 py-1.5 sm:py-3 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold rounded-lg transition-all duration-300 text-xs sm:text-sm"
            >
              ❌ Batalkan
            </button>
            <button
              onClick={handleAccept}
              disabled={!isChecked}
              className={`w-full sm:flex-1 px-3 sm:px-6 py-1.5 sm:py-3 font-semibold rounded-lg transition-all duration-300 text-xs sm:text-sm ${
                isChecked 
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl sm:transform sm:hover:scale-105' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              ✅ Setuju & Lanjutkan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

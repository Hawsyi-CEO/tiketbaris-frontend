import { useState } from 'react';
import { formatRupiah } from '../utils/formatRupiah';

export default function CreateEventForm({ onNext, onBack, initialData }) {
  const data = initialData || {};
  
  const [formData, setFormData] = useState({
    title: data.title || '',
    description: data.description || '',
    date: data.date || '',
    location: data.location || '',
    price: data.price || '',
    stock: data.stock || '',
    category: data.category || 'music',
    image: data.image || null,
    documents: data.documents || null
  });

  const [imagePreview, setImagePreview] = useState(data.imagePreview || null);
  const [documentPreview, setDocumentPreview] = useState(data.documentPreview || null);
  const [errors, setErrors] = useState({});

  const categories = [
    { value: 'music', label: '🎵 Musik & Konser', icon: '🎸' },
    { value: 'sports', label: '⚽ Olahraga', icon: '🏆' },
    { value: 'education', label: '📚 Pendidikan & Workshop', icon: '🎓' },
    { value: 'technology', label: '💻 Teknologi & Startup', icon: '🚀' },
    { value: 'arts', label: '🎨 Seni & Budaya', icon: '🖼️' },
    { value: 'food', label: '🍔 Kuliner & Festival', icon: '🍕' },
    { value: 'business', label: '💼 Bisnis & Networking', icon: '📊' },
    { value: 'entertainment', label: '🎭 Hiburan & Pertunjukan', icon: '🎪' },
    { value: 'charity', label: '❤️ Sosial & Charity', icon: '🤝' },
    { value: 'other', label: '📦 Lainnya', icon: '✨' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, image: 'Ukuran gambar maksimal 5MB' }));
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, image: 'File harus berupa gambar (JPG, PNG, dll)' }));
        return;
      }

      setFormData(prev => ({ ...prev, image: file }));
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      
      setErrors(prev => ({ ...prev, image: '' }));
    }
  };

  const handleDocumentChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, documents: 'Ukuran dokumen maksimal 10MB' }));
        return;
      }

      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        setErrors(prev => ({ ...prev, documents: 'File harus berupa PDF atau Word (DOC/DOCX)' }));
        return;
      }

      setFormData(prev => ({ ...prev, documents: file }));
      setDocumentPreview(file.name);
      setErrors(prev => ({ ...prev, documents: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) newErrors.title = 'Judul event wajib diisi';
    else if (formData.title.length < 5) newErrors.title = 'Judul minimal 5 karakter';

    if (!formData.description.trim()) newErrors.description = 'Deskripsi event wajib diisi';
    else if (formData.description.length < 20) newErrors.description = 'Deskripsi minimal 20 karakter';

    if (!formData.date) newErrors.date = 'Tanggal event wajib diisi';
    else {
      const eventDate = new Date(formData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (eventDate < today) newErrors.date = 'Tanggal event tidak boleh di masa lalu';
    }

    if (!formData.location.trim()) newErrors.location = 'Lokasi event wajib diisi';

    if (!formData.price || formData.price <= 0) newErrors.price = 'Harga tiket harus lebih dari 0';
    else if (formData.price < 1000) newErrors.price = 'Harga tiket minimal Rp 1.000';

    if (!formData.stock || formData.stock <= 0) newErrors.stock = 'Stok tiket harus lebih dari 0';
    else if (formData.stock > 1000000) newErrors.stock = 'Stok tiket maksimal 1.000.000';

    if (!formData.image && !imagePreview) newErrors.image = 'Gambar event wajib diupload';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      alert('Mohon lengkapi semua field dengan benar');
      return;
    }

    // Pass data to next step
    onNext({ ...formData, imagePreview, documentPreview });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-0">
      {/* Progress Indicator */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center justify-center gap-2 sm:gap-4 overflow-x-auto pb-2">
          <div className="flex items-center flex-shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-sm sm:text-base">
              ✓
            </div>
            <span className="ml-2 text-xs sm:text-sm font-semibold text-green-600 whitespace-nowrap">Syarat & Ketentuan</span>
          </div>
          <div className="w-8 sm:w-16 h-1 bg-indigo-500 flex-shrink-0"></div>
          <div className="flex items-center flex-shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm sm:text-base">
              2
            </div>
            <span className="ml-2 text-xs sm:text-sm font-semibold text-indigo-600 whitespace-nowrap">Detail Event</span>
          </div>
          <div className="w-8 sm:w-16 h-1 bg-gray-300 flex-shrink-0"></div>
          <div className="flex items-center flex-shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center font-bold text-sm sm:text-base">
              3
            </div>
            <span className="ml-2 text-xs sm:text-sm font-semibold text-gray-500 whitespace-nowrap">Konfirmasi</span>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-8">
        <div className="mb-4 sm:mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">📝 Detail Event</h2>
          <p className="text-gray-600 text-sm sm:text-base">Lengkapi informasi event Anda dengan detail</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              🎯 Judul Event <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Contoh: Konser Musik Jazz 2025"
              className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.title && <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              📄 Deskripsi Event <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="5"
              placeholder="Jelaskan detail event, rundown acara, fasilitas yang didapat, dll..."
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
            ></textarea>
            <p className="text-xs text-gray-500 mt-1">{formData.description.length} karakter (minimal 20)</p>
            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              🏷️ Kategori Event <span className="text-red-500">*</span>
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date & Location Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📅 Tanggal Event <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                  errors.date ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📍 Lokasi Event <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Contoh: Balai Sarbini, Jakarta"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                  errors.location ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
            </div>
          </div>

          {/* Price & Stock Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                💰 Harga Tiket (Rp) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="50000"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                  errors.price ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {formData.price > 0 && (
                <p className="text-xs text-indigo-600 mt-1">
                  Anda terima: Rp {formatRupiah(formData.price * 0.98)} (setelah komisi 2%)
                </p>
              )}
              {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                🎫 Jumlah Tiket <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                placeholder="100"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                  errors.stock ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.stock && <p className="text-red-500 text-sm mt-1">{errors.stock}</p>}
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              🖼️ Gambar Event <span className="text-red-500">*</span>
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-500 transition-colors">
              {imagePreview ? (
                <div className="space-y-4">
                  <img src={imagePreview} alt="Preview" className="mx-auto max-h-64 rounded-lg shadow-md" />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview(null);
                      setFormData(prev => ({ ...prev, image: null }));
                    }}
                    className="text-red-600 hover:text-red-700 font-semibold"
                  >
                    ❌ Hapus Gambar
                  </button>
                </div>
              ) : (
                <div>
                  <div className="text-6xl mb-4">📸</div>
                  <label className="cursor-pointer">
                    <span className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-semibold inline-block transition-colors">
                      Pilih Gambar
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                  <p className="text-sm text-gray-500 mt-2">JPG, PNG, atau GIF (Maks. 5MB)</p>
                </div>
              )}
            </div>
            {errors.image && <p className="text-red-500 text-sm mt-1">{errors.image}</p>}
          </div>

          {/* Document Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              📄 Upload Dokumen Proposal/Perizinan <span className="text-gray-400">(Opsional)</span>
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-500 transition-colors">
              {documentPreview ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-3 bg-gray-50 p-4 rounded-lg">
                    <span className="text-4xl">📄</span>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">{documentPreview}</p>
                      <p className="text-sm text-gray-500">Dokumen berhasil diupload</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setDocumentPreview(null);
                      setFormData(prev => ({ ...prev, documents: null }));
                    }}
                    className="text-red-600 hover:text-red-700 font-semibold"
                  >
                    ❌ Hapus Dokumen
                  </button>
                </div>
              ) : (
                <div>
                  <div className="text-6xl mb-4">📎</div>
                  <label className="cursor-pointer">
                    <span className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-semibold inline-block transition-colors">
                      Pilih Dokumen
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleDocumentChange}
                      className="hidden"
                    />
                  </label>
                  <p className="text-sm text-gray-500 mt-2">PDF atau Word (Maks. 10MB)</p>
                  <p className="text-xs text-gray-400 mt-1">Contoh: Proposal event, surat izin, dll</p>
                </div>
              )}
            </div>
            {errors.documents && <p className="text-red-500 text-sm mt-1">{errors.documents}</p>}
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <p className="text-sm text-blue-800">
              <strong>💡 Tips:</strong> Gunakan gambar berkualitas tinggi dengan rasio 16:9 untuk tampilan terbaik. 
              Pastikan semua informasi akurat karena akan ditampilkan kepada calon pembeli.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onBack}
              className="flex-1 px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold rounded-lg transition-all duration-300"
            >
              ⬅️ Kembali
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              Lanjut ke Konfirmasi ➡️
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

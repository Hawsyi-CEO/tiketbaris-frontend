import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { DOMAIN } from '../../config/api';

export default function EditEventPanitia() {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [newDocuments, setNewDocuments] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    capacity: '',
    price: '',
    image_url: ''
  });

  useEffect(() => {
    fetchEventData();
  }, [eventId]);

  const fetchEventData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/panitia/events/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const event = response.data;
      const eventDate = new Date(event.date);
      const dateStr = eventDate.toISOString().split('T')[0];
      const timeStr = eventDate.toTimeString().slice(0, 5);

      setFormData({
        title: event.title || '',
        description: event.description || '',
        date: dateStr,
        time: timeStr,
        location: event.location || '',
        capacity: event.capacity || event.stock || '',
        price: event.price || '',
        image_url: event.image_url || ''
      });

      if (event.image_url) {
        setImagePreview(event.image_url);
      }

      // Parse dokumen jika ada
      if (event.documents) {
        try {
          // Try parsing as JSON array first (new format)
          const docs = JSON.parse(event.documents);
          setDocuments(Array.isArray(docs) ? docs : []);
        } catch (e) {
          // If parsing fails, it's old format (plain URL string)
          // Convert to new format
          if (typeof event.documents === 'string' && event.documents.trim()) {
            const filename = event.documents.split('/').pop();
            setDocuments([{
              name: filename,
              url: event.documents,
              size: 0,
              type: 'application/octet-stream'
            }]);
          }
        }
      }

      setLoading(false);
    } catch (err) {
      console.error('Error fetching event:', err);
      setError('❌ Gagal memuat data event');
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError('Format gambar harus JPG, PNG, GIF, atau WebP');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError('Ukuran gambar maksimal 5MB');
        return;
      }

      setImageFile(file);
      setError('');

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDocumentAdd = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      if (file.size > 10 * 1024 * 1024) {
        setError(`File ${file.name} terlalu besar (max 10MB)`);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setNewDocuments(prev => [...prev, {
          id: Date.now() + Math.random(),
          name: file.name,
          file: file,
          preview: reader.result,
          type: file.type
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveDocument = (docId) => {
    setNewDocuments(prev => prev.filter(doc => doc.id !== docId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      if (!formData.title || !formData.date || !formData.time || !formData.location || !formData.price || !formData.capacity) {
        setError('Mohon isi semua field yang required');
        setSubmitting(false);
        return;
      }

      const dateTime = `${formData.date}T${formData.time}:00`;

      // Use upload route if there's new image OR new documents
      if (imageFile || newDocuments.length > 0) {
        const uploadFormData = new FormData();
        uploadFormData.append('title', formData.title);
        uploadFormData.append('description', formData.description);
        uploadFormData.append('date', dateTime);
        uploadFormData.append('location', formData.location);
        uploadFormData.append('capacity', formData.capacity);
        uploadFormData.append('price', formData.price);
        
        // Append image if exists
        if (imageFile) {
          uploadFormData.append('image_file', imageFile);
        }

        // Append documents if exists
        newDocuments.forEach((doc) => {
          uploadFormData.append('documents', doc.file);
        });

        const response = await axios.put(`/api/panitia/events/${eventId}-upload`, uploadFormData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });

        if (response.data) {
          alert('Event berhasil diupdate!');
          setImageFile(null);
          setNewDocuments([]);
          navigate('/panitia/dashboard');
        }
      } else {
        // No file uploads, just update text fields
        const eventData = {
          title: formData.title,
          description: formData.description,
          date: dateTime,
          location: formData.location,
          capacity: formData.capacity,
          price: formData.price
        };

        const response = await axios.put(`/api/panitia/events/${eventId}`, eventData, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data) {
          alert('Event berhasil diupdate!');
          navigate('/panitia/dashboard');
        }
      }
    } catch (err) {
      console.error('Error updating event:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          err.message || 
                          'Gagal mengupdate event';
      setError(`❌ ${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/panitia/dashboard');
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    if (!formData.image_url) {
      setImagePreview('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Responsive */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 sm:py-4 gap-2 sm:gap-3">
            <div className="flex-1">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 leading-tight">
                🎪 tiketbaris.id - Edit Event
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">Form Edit Event</p>
            </div>
            <button 
              onClick={handleCancel} 
              className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors duration-200 text-sm"
            >
              ← Kembali
            </button>
          </div>
        </div>
      </header>

      {/* Main Content - Responsive */}
      <main className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="bg-white rounded-lg shadow-md p-3 sm:p-6 lg:p-8">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">
            ✏️ Edit Event
          </h2>

          {error && (
            <div className="mb-3 sm:mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs sm:text-sm leading-relaxed">
              {error}
            </div>
          )}

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              {/* Title Field - Full Width */}
              <div className="w-full">
                <label htmlFor="title" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                  Nama Event <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                  required
                />
              </div>

              {/* Description Field - Full Width */}
              <div className="w-full">
                <label htmlFor="description" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                  Deskripsi Event
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="4"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-vertical text-sm"
                  style={{minHeight: '100px'}}
                ></textarea>
              </div>

              {/* Date & Time - Responsive Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="w-full">
                  <label htmlFor="date" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                    Tanggal Event <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                    required
                  />
                </div>

                <div className="w-full">
                  <label htmlFor="time" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                    Waktu Event <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="time"
                    id="time"
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                    required
                  />
                </div>
              </div>

              {/* Location, Capacity, Price - Responsive Grid (1 col on mobile, 3 cols on desktop) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div className="w-full sm:col-span-2 lg:col-span-1">
                  <label htmlFor="location" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                    Kota/Lokasi <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                    required
                  />
                </div>

                <div className="w-full">
                  <label htmlFor="capacity" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                    Kapasitas Tiket <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    id="capacity"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                    min="1"
                    required
                  />
                </div>

                <div className="w-full">
                  <label htmlFor="price" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                    Harga Tiket (Rp) <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                    min="0"
                    step="1000"
                    required
                  />
                </div>
              </div>

              {/* Image Upload Section - Responsive */}
              <div className="w-full">
                <label htmlFor="image_file" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                  📸 Upload Gambar Event (Opsional)
                </label>
                <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-500 transition-colors">
                  <input
                    type="file"
                    id="image_file"
                    name="image_file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={submitting}
                  />
                  <div className="text-center">
                    <div className="text-4xl sm:text-5xl mb-3">📁</div>
                    <p className="text-sm sm:text-base font-medium text-gray-700 mb-1">
                      Klik untuk memilih gambar baru
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500 mb-1">
                      atau drag & drop gambar di sini
                    </p>
                    <p className="text-xs text-gray-400">
                      JPG, PNG, GIF, WebP • Max 5MB
                    </p>
                  </div>
                </div>

                {imagePreview && (
                  <div className="mt-3 sm:mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="relative w-full">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-full max-w-full sm:max-w-sm md:max-w-md mx-auto rounded-lg shadow-md object-cover"
                      />
                      {imageFile && (
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
                          title="Hapus gambar"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700">{imageFile?.name || 'Gambar saat ini'}</p>
                      {imageFile && <p className="text-xs text-gray-500 mt-1">{(imageFile?.size / 1024).toFixed(2)} KB</p>}
                    </div>
                  </div>
                )}
              </div>

              {/* Documents Section - Responsive */}
              <div className="border-t-2 border-gray-200 pt-4 sm:pt-6">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 sm:mb-3">📄 Dokumen Tambahan (Opsional)</h3>
                <p className="text-xs text-gray-600 mb-3 sm:mb-4">
                  Tambahkan atau update dokumen seperti peraturan, regulasi, atau informasi tambahan tentang event
                </p>

                {/* Existing Documents */}
                {documents.length > 0 && (
                  <div className="mb-4 sm:mb-5">
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">📄 Dokumen yang Sudah Ada</label>
                    <div className="space-y-2">
                      {documents.map((doc, index) => (
                        <div 
                          key={index} 
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 p-2.5 sm:p-3 bg-green-50 border border-green-200 rounded-lg"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-base sm:text-lg flex-shrink-0">
                              {doc.name?.endsWith('.pdf') ? '📕' :
                               doc.name?.endsWith('.doc') || doc.name?.endsWith('.docx') ? '📘' :
                               doc.name?.endsWith('.xls') || doc.name?.endsWith('.xlsx') ? '📗' :
                               doc.name?.endsWith('.ppt') || doc.name?.endsWith('.pptx') ? '🎨' : '📎'}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{doc.name}</p>
                              <p className="text-xs text-green-600 mt-1">✅ Tersimpan</p>
                            </div>
                          </div>
                          <a 
                            href={`${DOMAIN}${doc.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full sm:w-auto text-center px-3 sm:px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs sm:text-sm font-semibold transition-colors flex-shrink-0"
                          >
                            ⬇️ Download
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="w-full">
                  <label htmlFor="documents" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                    📤 Upload Dokumen Baru (PDF, DOC, TXT, dan format lainnya)
                  </label>
                  <input
                    type="file"
                    id="documents"
                    multiple
                    onChange={handleDocumentAdd}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm file:mr-2 sm:file:mr-4 file:py-1.5 sm:file:py-2 file:px-3 sm:file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx"
                  />
                  <p className="text-xs text-gray-500 mt-1.5 sm:mt-2">Maksimal 10MB per file. Bisa upload multiple file sekaligus</p>
                </div>

                {newDocuments.length > 0 && (
                  <div className="mt-3 sm:mt-4">
                    <h4 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2">Dokumen baru yang akan diupload:</h4>
                    <div className="space-y-2">
                      {newDocuments.map(doc => (
                        <div 
                          key={doc.id} 
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 p-2.5 sm:p-3 bg-gray-50 border border-gray-200 rounded-lg"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-base sm:text-lg flex-shrink-0">📎</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{doc.name}</p>
                              <p className="text-xs text-gray-500 mt-1">Siap diupload</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveDocument(doc.id)}
                            className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs sm:text-sm font-semibold transition-colors flex-shrink-0"
                          >
                            ✕ Hapus
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons - Responsive */}
              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="w-full sm:flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors duration-200 text-sm"
                >
                  ❌ Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors duration-200 text-sm"
                >
                  {submitting ? '⏳ Menyimpan...' : '✅ Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    );
  }

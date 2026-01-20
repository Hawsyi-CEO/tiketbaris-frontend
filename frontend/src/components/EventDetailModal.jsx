import { useState } from 'react';
import { DOMAIN } from '../config/api';

export default function EventDetailModal({ event, onClose, onCheckout }) {
  const [activeTab, setActiveTab] = useState('detail');

  if (!event) return null;

  // Check if event has expired
  const eventDate = new Date(event.date);
  const now = new Date();
  const isPastEvent = eventDate < now;
  const isSoldOut = event.status === 'sold_out' || event.stock <= 0;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Parse documents safely
  let documents = [];
  if (event.documents) {
    try {
      documents = typeof event.documents === 'string' 
        ? JSON.parse(event.documents) 
        : event.documents;
    } catch (e) {
      console.error('Error parsing documents:', e);
      documents = [];
    }
  }

  // Get full image URL
  const imageUrl = event.image_url 
    ? (event.image_url.startsWith('http') ? event.image_url : event.image_url)
    : 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+CiAgPGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMzAwLDE1MCkiPgogICAgPHRleHQgeD0iMCIgeT0iMCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjI0IiBmb250LXdlaWdodD0iYm9sZCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzZiNzI4MCI+CiAgICAgIPCfkZ/vuI8gRXZlbnQgSW1hZ2UKICAgIDwvdGV4dD4KICA8L2c+Cjwvc3ZnPgo=';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative">
          <div className="aspect-video bg-gradient-to-r from-blue-100 to-purple-100 relative">
            <img 
              src={imageUrl} 
              alt={event.title}
              className="w-full h-full object-cover"
            />
            <div className={`absolute top-4 left-4 px-4 py-2 rounded-full font-semibold text-sm ${
              isPastEvent ? 'bg-gray-600' : isSoldOut ? 'bg-red-600' : event.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'
            } text-white`}>
              {isPastEvent ? '⏰ Event Telah Lewat' : isSoldOut ? '🚫 SOLD OUT' : event.status === 'active' ? '✅ Aktif' : '⏳ Pending'}
            </div>
          </div>
          <button 
            className="absolute top-4 right-4 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full w-10 h-10 flex items-center justify-center transition-all shadow-lg text-xl"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b bg-gray-50">
          <button 
            className={`flex-1 px-6 py-4 font-semibold transition-all ${
              activeTab === 'detail' 
                ? 'text-blue-600 border-b-2 border-blue-600 bg-white' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setActiveTab('detail')}
          >
            📋 Detail Event
          </button>
          <button 
            className={`flex-1 px-6 py-4 font-semibold transition-all ${
              activeTab === 'documents' 
                ? 'text-blue-600 border-b-2 border-blue-600 bg-white' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setActiveTab('documents')}
          >
            📄 Dokumen ({documents.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'detail' && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-gray-900">{event.title}</h2>

              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">Informasi Event</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl">
                    <span className="text-2xl">📅</span>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Tanggal & Waktu</p>
                      <p className="text-sm font-semibold text-gray-900">{formatDate(event.date)}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-xl">
                    <span className="text-2xl">📍</span>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Lokasi</p>
                      <p className="text-sm font-semibold text-gray-900">{event.location}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-xl">
                    <span className="text-2xl">🎟️</span>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Ketersediaan Tiket</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {event.stock} Tiket {event.stock <= 10 ? '⚠️ Terbatas' : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-green-50 rounded-xl">
                    <span className="text-2xl">💰</span>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Harga Tiket</p>
                      <p className="text-xl font-bold text-green-600">
                        Rp {event.price.toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">Deskripsi</h3>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {event.description || 'Tidak ada deskripsi'}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <button 
                  className={`w-full px-6 py-4 rounded-xl font-bold text-lg transition-all ${
                    isPastEvent || isSoldOut
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-lg hover:scale-105'
                  }`}
                  onClick={() => {
                    console.log('🔘 Button clicked!');
                    console.log('Event ID:', event.id);
                    console.log('isPastEvent:', isPastEvent, 'isSoldOut:', isSoldOut);
                    if (!isPastEvent && !isSoldOut && onCheckout) {
                      console.log('Calling onCheckout with event.id:', event.id);
                      onCheckout(event.id);
                      onClose();
                    } else {
                      console.log('Button action blocked:', { isPastEvent, isSoldOut, hasOnCheckout: !!onCheckout });
                    }
                  }}
                  disabled={isPastEvent || isSoldOut}
                >
                  {isPastEvent ? '⏰ Event Telah Lewat' : isSoldOut ? '🚫 SOLD OUT' : '🛒 Beli Tiket Sekarang'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-800">Dokumen Pendukung</h3>
              
              {documents.length === 0 ? (
                <div className="text-center py-12">
                  <span className="text-6xl">📭</span>
                  <p className="text-gray-500 mt-4">Tidak ada dokumen untuk event ini</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {documents.map((doc, index) => {
                    const docUrl = doc.url.startsWith('http') 
                      ? doc.url 
                      : `${DOMAIN}${doc.url}`;
                    
                    return (
                      <div key={index} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all">
                        <div className="text-3xl">
                          {doc.name.endsWith('.pdf') ? '📕' :
                           doc.name.endsWith('.doc') || doc.name.endsWith('.docx') ? '📘' :
                           doc.name.endsWith('.xls') || doc.name.endsWith('.xlsx') ? '📗' :
                           doc.name.endsWith('.ppt') || doc.name.endsWith('.pptx') ? '🎨' :
                           doc.name.endsWith('.txt') ? '📄' : '📎'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate" title={doc.name}>
                            {doc.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {doc.name.split('.').pop().toUpperCase()}
                          </p>
                        </div>
                        <a 
                          href={docUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-2xl hover:scale-110 transition-transform"
                          download={doc.name}
                        >
                          ⬇️
                        </a>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

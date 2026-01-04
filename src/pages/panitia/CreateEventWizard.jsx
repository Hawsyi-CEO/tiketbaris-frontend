import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import TermsAndConditions from '../../components/TermsAndConditions';
import CreateEventForm from '../../components/CreateEventForm';
import EventConfirmation from '../../components/EventConfirmation';
import NotificationModal from '../../components/NotificationModal';
import Toast from '../../components/Toast';

export default function CreateEventWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [eventData, setEventData] = useState(null);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [eventCreated, setEventCreated] = useState(false);
  const [notification, setNotification] = useState({ isOpen: false, type: 'info', title: '', message: '', details: null });
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const navigate = useNavigate();

  // Auto navigation setelah event created
  useEffect(() => {
    if (eventCreated) {
      const timer = setTimeout(() => {
        console.log('🚀 Auto navigating to dashboard...');
        navigate('/panitia/dashboard', { 
          state: { fromCreateEvent: true },
          replace: true 
        });
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [eventCreated, navigate]);

  console.log('CreateEventWizard - Current Step:', currentStep);

  // Step 1: Terms Acceptance
  const handleTermsAccept = () => {
    console.log('Terms accepted, moving to step 2');
    setCurrentStep(2);
  };

  const handleTermsCancel = () => {
    if (window.confirm('Apakah Anda yakin ingin membatalkan pembuatan event?')) {
      navigate('/panitia/dashboard');
    }
  };

  // Step 2: Event Form
  const handleFormNext = (formData) => {
    setEventData(formData);
    setCurrentStep(3);
  };

  const handleFormBack = () => {
    setCurrentStep(1);
  };

  // Step 3: Confirmation
  const handleConfirmBack = () => {
    setCurrentStep(2);
  };

  const handleConfirmCancel = () => {
    if (window.confirm('Apakah Anda yakin ingin membatalkan pembuatan event? Semua data akan hilang.')) {
      navigate('/panitia/dashboard');
    }
  };

  const handleConfirm = async () => {
    setIsCreatingEvent(true);
    
    try {
      const token = localStorage.getItem('token');
      
      // Prepare form data for upload
      const formData = new FormData();
      formData.append('title', eventData.title);
      formData.append('description', eventData.description);
      formData.append('date', eventData.date);
      formData.append('location', eventData.location);
      formData.append('price', eventData.price);
      formData.append('stock', eventData.stock);
      formData.append('category', eventData.category);
      formData.append('terms_agreed', 'true');
      
      if (eventData.image) {
        formData.append('image_file', eventData.image);
      }

      if (eventData.documents) {
        formData.append('document_file', eventData.documents);
      }

      console.log('🔄 Creating event...');
      const response = await axios.post('/api/events', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('✅ Event created successfully:', response.data);

      // Reset loading state
      setIsCreatingEvent(false);
      
      // IMMEDIATE NAVIGATION - tidak tunggu notification
      setToast({ show: true, message: '🎉 Event berhasil dibuat! Menuju dashboard...', type: 'success' });
      
      // Navigate immediately
      setTimeout(() => {
        navigate('/panitia/dashboard', { 
          state: { 
            fromCreateEvent: true,
            newEventTitle: eventData.title 
          },
          replace: true 
        });
      }, 500);

      // Show notification tapi tidak block navigation
      setNotification({
        isOpen: true,
        type: 'success',
        title: 'Event Berhasil Dibuat! 🎉',
        message: 'Event Anda sudah aktif dan dapat dilihat oleh calon pembeli.',
        details: {
          'Nama Event': eventData.title,
          'Tanggal': new Date(eventData.date).toLocaleDateString('id-ID'),
          'Harga Tiket': `Rp ${parseInt(eventData.price).toLocaleString('id-ID')}`,
          'Stok Tiket': `${eventData.stock} tiket`,
          'Status': 'Aktif ✅'
        }
      });
    } catch (error) {
      console.error('❌ Error creating event:', error);
      
      // Reset loading state
      setIsCreatingEvent(false);
      
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Gagal Membuat Event',
        message: error.response?.data?.error || 'Terjadi kesalahan saat membuat event. Silakan coba lagi.',
        details: 'Pastikan semua data sudah benar dan koneksi internet stabil'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 py-4 sm:py-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4 sm:mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">🎪 Buat Event Baru</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">Ikuti langkah-langkah untuk mempublikasikan event Anda</p>
          </div>
          <button
            onClick={() => navigate('/panitia/dashboard')}
            className="px-3 py-2 sm:px-4 text-gray-600 hover:text-gray-900 font-semibold text-sm sm:text-base"
          >
            ❌ Tutup
          </button>
        </div>
      </div>

      {/* Wizard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {currentStep === 1 && (
          <div className="text-center text-gray-500 py-8">
            <p>Loading Terms & Conditions...</p>
          </div>
        )}
        
        {currentStep === 2 && (
          <CreateEventForm
            onNext={handleFormNext}
            onBack={handleFormBack}
            initialData={eventData}
          />
        )}
        
        {currentStep === 3 && (
          <EventConfirmation
            eventData={eventData}
            onConfirm={handleConfirm}
            onBack={handleConfirmBack}
            onCancel={handleConfirmCancel}
            isCreating={isCreatingEvent}
          />
        )}
      </div>

      {/* Terms Modal - Rendered outside main content */}
      {currentStep === 1 && (
        <TermsAndConditions 
          onAccept={handleTermsAccept}
          onCancel={handleTermsCancel}
        />
      )}

      {/* Notification Modal */}
      <NotificationModal
        isOpen={notification.isOpen}
        onClose={() => setNotification({ ...notification, isOpen: false })}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        details={notification.details}
        onConfirm={notification.onConfirm}
      />

      {/* Toast Notification */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
    </div>
  );
}

import { useState } from 'react';
import './RoleSelectionModal.css';

export default function RoleSelectionModal({ isOpen, onSelectRole, onClose, loading = false }) {
  const [selectedRole, setSelectedRole] = useState('user');

  if (!isOpen) return null;

  const handleConfirm = () => {
    onSelectRole(selectedRole);
  };

  return (
    <div className="role-modal-overlay" onClick={(e) => e.target === e.currentTarget && !loading && onClose()}>
      <div className="role-modal-container">
        <div className="role-modal-header">
          <h2 className="role-modal-title">🎭 Pilih Role Anda</h2>
          <p className="role-modal-subtitle">Tentukan bagaimana Anda ingin menggunakan platform kami</p>
        </div>

        <div className="role-modal-body">
          <div 
            className={`role-option ${selectedRole === 'user' ? 'role-option-selected' : ''}`}
            onClick={() => !loading && setSelectedRole('user')}
          >
            <div className="role-option-icon">👤</div>
            <div className="role-option-content">
              <h3 className="role-option-title">User (Pembeli Tiket)</h3>
              <p className="role-option-description">
                Beli tiket event favorit Anda dengan mudah dan aman
              </p>
              <ul className="role-option-features">
                <li>✓ Beli tiket event</li>
                <li>✓ Kelola pembelian</li>
                <li>✓ Scan tiket digital</li>
              </ul>
            </div>
            <div className="role-option-radio">
              <input 
                type="radio" 
                name="role" 
                value="user"
                checked={selectedRole === 'user'}
                onChange={() => setSelectedRole('user')}
                disabled={loading}
              />
            </div>
          </div>

          <div 
            className={`role-option ${selectedRole === 'panitia' ? 'role-option-selected' : ''}`}
            onClick={() => !loading && setSelectedRole('panitia')}
          >
            <div className="role-option-icon">🎭</div>
            <div className="role-option-content">
              <h3 className="role-option-title">Panitia (Penyelenggara Event)</h3>
              <p className="role-option-description">
                Buat dan kelola event Anda sendiri dengan fitur lengkap
              </p>
              <ul className="role-option-features">
                <li>✓ Buat event</li>
                <li>✓ Kelola penjualan</li>
                <li>✓ Dashboard analytics</li>
              </ul>
              <p className="text-orange-600 text-sm mt-2 font-semibold">
                ⚠️ Pilih ini HANYA jika Anda ingin membuat event
              </p>
            </div>
            <div className="role-option-radio">
              <input 
                type="radio" 
                name="role" 
                value="panitia"
                checked={selectedRole === 'panitia'}
                onChange={() => setSelectedRole('panitia')}
                disabled={loading}
              />
            </div>
          </div>
        </div>

        <div className="role-modal-footer">
          <button 
            className="role-modal-button role-modal-button-secondary"
            onClick={onClose}
            disabled={loading}
          >
            Batal
          </button>
          <button 
            className="role-modal-button role-modal-button-primary"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="role-modal-spinner"></span>
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <span>Lanjutkan</span>
                <span>→</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Smartphone,
  Monitor,
  Trash2,
  LogOut,
  Shield,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import api from '../../services/api';

export default function ActiveDevices() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/sessions/my-devices');
      setSessions(response.data.devices || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      alert('Gagal memuat data device');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutDevice = async (sessionId) => {
    if (!confirm('Yakin ingin logout dari device ini?')) return;

    try {
      setActionLoading(sessionId);
      await api.delete(`/sessions/device/${sessionId}`);
      alert('✅ Berhasil logout dari device tersebut');
      fetchSessions();
    } catch (error) {
      console.error('Error logging out device:', error);
      alert(error.response?.data?.error || 'Gagal logout dari device');
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogoutAll = async () => {
    if (!confirm('Yakin ingin logout dari SEMUA device lain kecuali device ini?')) return;

    try {
      setActionLoading('all');
      const token = localStorage.getItem('token');
      await api.post('/sessions/logout-all-others', { sessionToken: token });
      alert('✅ Berhasil logout dari semua device lain');
      fetchSessions();
    } catch (error) {
      console.error('Error logging out all:', error);
      alert('Gagal logout dari semua device');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
            <CheckCircle className="w-3 h-3" />
            Aktif
          </span>
        );
      case 'recent':
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
            <Clock className="w-3 h-3" />
            Aktif Baru-baru Ini
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold">
            <Clock className="w-3 h-3" />
            Tidak Aktif
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data device...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white hover:text-blue-100 mb-4 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Kembali</span>
          </button>

          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Device & Sesi Aktif</h1>
              <p className="text-blue-100 text-sm">Kelola device yang mengakses akun Anda</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Keamanan Akun</h3>
              <p className="text-sm text-blue-800">
                Berikut adalah daftar device yang pernah login ke akun Anda. 
                Jika ada device yang tidak Anda kenali, segera logout dari device tersebut dan ubah password Anda.
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-md">
            <p className="text-sm text-gray-600 mb-1">Total Device</p>
            <p className="text-2xl font-bold text-gray-900">{sessions.length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-md">
            <p className="text-sm text-gray-600 mb-1">Aktif</p>
            <p className="text-2xl font-bold text-green-600">
              {sessions.filter(s => s.status === 'active').length}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-md col-span-2 md:col-span-1">
            <p className="text-sm text-gray-600 mb-1">Device Ini</p>
            <p className="text-2xl font-bold text-blue-600">
              {sessions.filter(s => s.isCurrent).length}
            </p>
          </div>
        </div>

        {/* Logout All Button */}
        {sessions.length > 1 && (
          <button
            onClick={handleLogoutAll}
            disabled={actionLoading === 'all'}
            className="w-full mb-6 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold shadow-md"
          >
            <LogOut className="w-5 h-5" />
            {actionLoading === 'all' ? 'Memproses...' : 'Logout dari Semua Device Lain'}
          </button>
        )}

        {/* Sessions List */}
        <div className="space-y-4">
          {sessions.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center shadow-md">
              <Monitor className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Tidak ada sesi aktif</p>
            </div>
          ) : (
            sessions.map(session => (
              <div
                key={session.id}
                className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-6 ${
                  session.isCurrent ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Device Icon */}
                  <div className="flex-shrink-0">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                      session.status === 'active' ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      {session.deviceType === 'mobile' ? (
                        <Smartphone className={`w-7 h-7 ${
                          session.status === 'active' ? 'text-green-600' : 'text-gray-600'
                        }`} />
                      ) : (
                        <Monitor className={`w-7 h-7 ${
                          session.status === 'active' ? 'text-green-600' : 'text-gray-600'
                        }`} />
                      )}
                    </div>
                  </div>

                  {/* Device Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                          {session.deviceName}
                          {session.isCurrent && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full font-semibold">
                              Device Ini
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {session.os} • {session.browser}
                        </p>
                      </div>
                      {getStatusBadge(session.status)}
                    </div>

                    <div className="space-y-1 mb-4">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">IP Address:</span> {session.ipAddress}
                      </p>
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Login:</span> {session.loginTime}
                      </p>
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Terakhir Aktif:</span> {session.lastActiveText}
                      </p>
                    </div>

                    {/* Actions */}
                    {!session.isCurrent && (
                      <button
                        onClick={() => handleLogoutDevice(session.id)}
                        disabled={actionLoading === session.id}
                        className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-4 h-4" />
                        {actionLoading === session.id ? 'Memproses...' : 'Logout dari Device Ini'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Security Tips */}
        <div className="mt-8 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Shield className="w-5 h-5 text-yellow-600" />
            Tips Keamanan
          </h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex gap-2">
              <span>•</span>
              <span>Logout dari device yang tidak Anda kenali segera</span>
            </li>
            <li className="flex gap-2">
              <span>•</span>
              <span>Gunakan password yang kuat dan unik untuk akun Anda</span>
            </li>
            <li className="flex gap-2">
              <span>•</span>
              <span>Jangan share informasi login Anda dengan orang lain</span>
            </li>
            <li className="flex gap-2">
              <span>•</span>
              <span>Logout dari device publik setelah selesai digunakan</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import axios from 'axios';

export default function DiagnosticsPage() {
  const [status, setStatus] = useState({
    backend: 'Checking...',
    frontend: 'Connected',
    database: 'Checking...',
    token: localStorage.getItem('token') ? 'Found' : 'Not found'
  });
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    const checkBackend = async () => {
      try {
        // Test backend connection
        const response = await axios.get('/api/health');
        setStatus(prev => ({ ...prev, backend: 'Connected ✅' }));
      } catch (error) {
        setStatus(prev => ({ ...prev, backend: 'Failed ❌' }));
        setErrors(prev => [...prev, `Backend Error: ${error.message}`]);
      }

      try {
        // Test database through auth endpoint
        const response = await axios.post('/api/auth/login', {
          email: 'test@test.com',
          password: 'test'
        });
      } catch (error) {
        if (error.response?.status === 401) {
          setStatus(prev => ({ ...prev, database: 'Connected ✅ (Auth failed as expected)' }));
        } else if (error.code === 'ECONNREFUSED' || error.message.includes('Network')) {
          setStatus(prev => ({ ...prev, database: 'Failed ❌ (No backend)' }));
        } else {
          setStatus(prev => ({ ...prev, database: 'Connected ✅' }));
        }
      }
    };

    checkBackend();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">🔍 Diagnostics</h1>

        <div className="grid grid-cols-2 gap-4 mb-8">
          {Object.entries(status).map(([key, value]) => (
            <div key={key} className="bg-gray-50 p-4 rounded">
              <p className="text-sm font-semibold text-gray-600 capitalize">{key}</p>
              <p className="text-lg font-bold text-gray-800">{value}</p>
            </div>
          ))}
        </div>

        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded p-4 mb-6">
            <h2 className="font-bold text-red-800 mb-2">Errors:</h2>
            <ul className="space-y-1">
              {errors.map((error, i) => (
                <li key={i} className="text-sm text-red-700">• {error}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded p-4">
          <h2 className="font-bold text-blue-800 mb-2">Checklist:</h2>
          <ul className="space-y-2">
            <li className="text-sm text-blue-700">
              ✓ Frontend running at http://localhost:3001
            </li>
            <li className="text-sm text-blue-700">
              {status.backend === 'Connected ✅' ? '✓' : '✗'} Backend running at http://localhost:5000
            </li>
            <li className="text-sm text-blue-700">
              {status.database === 'Connected ✅ (Auth failed as expected)' ? '✓' : '✗'} MySQL database connected
            </li>
            <li className="text-sm text-blue-700">
              {status.token === 'Found' ? '✓' : '✗'} Token stored (Login first to get token)
            </li>
          </ul>
        </div>

        <div className="mt-6 space-y-2">
          <a href="/" className="block w-full text-center bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
            Back to Home
          </a>
          <a href="/login" className="block w-full text-center bg-green-600 text-white py-2 rounded hover:bg-green-700">
            Go to Login
          </a>
        </div>
      </div>
    </div>
  );
}


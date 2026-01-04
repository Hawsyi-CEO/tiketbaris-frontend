// Simple test untuk cek API endpoints
fetch('http://localhost:5000/api/health')
  .then(response => response.json())
  .then(data => {
    console.log('✅ Health check:', data);
    
    // Test midtrans test route
    return fetch('http://localhost:5000/api/midtrans/test');
  })
  .then(response => response.json())
  .then(data => {
    console.log('✅ Midtrans test route:', data);
  })
  .catch(error => {
    console.log('❌ Error:', error.message);
  });
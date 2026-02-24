// ============================================
// Partner API Demo - Forbasi Jabar
// ============================================

// Placeholder image as data URI
const PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200' viewBox='0 0 400 200'%3E%3Crect fill='%23e5e7eb' width='400' height='200'/%3E%3Ctext fill='%239ca3af' font-family='sans-serif' font-size='16' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";

// Handle broken images
function handleImageError(img) {
  img.onerror = null;
  img.src = PLACEHOLDER_IMAGE;
}

// ============================================
// Auto-detect Environment Configuration
// ============================================
const ENVIRONMENTS = {
  local: {
    apiUrl: 'http://localhost:5020/api/partner',
    imageBaseUrl: 'http://localhost:5020',
    name: 'Local Development'
  },
  production: {
    apiUrl: 'https://tiketbaris.id/api/partner',
    imageBaseUrl: 'https://tiketbaris.id',
    name: 'Production (Tiket Baris)'
  },
  jabar: {
    // Jika Jabar punya API sendiri, bisa ditambahkan di sini
    apiUrl: 'https://tiketbaris.id/api/partner',
    imageBaseUrl: 'https://tiketbaris.id',
    name: 'Production (Jabar)'
  }
};

// Auto-detect environment based on current hostname
function detectEnvironment() {
  const hostname = window.location.hostname;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'local';
  } else if (hostname.includes('jabar.forbasi.or.id') || hostname.includes('forbasi')) {
    return 'jabar';
  } else {
    return 'production';
  }
}

// Current environment
let currentEnv = detectEnvironment();

// Configuration (auto-configured based on environment)
const CONFIG = {
  ...ENVIRONMENTS[currentEnv],
  apiKey: 'pk_a6b20f5a10ae11f1822bd8bbc1f7a49b',
  apiSecret: 'sk_68728b0b6f7043a63b2865925948e8792f2c384bd3ac0803a69d57b63ced696d',
  jwtSecret: 'jwt_dae8788e372e78395b454b896d0c95677833a9b20ec32d27ee6c0a1682d01e82'
};

// Test connectivity and auto-switch if needed
async function testConnectivity() {
  console.log(`[Config] Environment detected: ${CONFIG.name}`);
  console.log(`[Config] API URL: ${CONFIG.apiUrl}`);
  console.log(`[Config] Image Base: ${CONFIG.imageBaseUrl}`);
  
  // If local, check if production is also available
  if (currentEnv === 'local') {
    try {
      const response = await fetch('https://tiketbaris.id/api/partner/health', {
        method: 'GET',
        headers: {
          'X-Partner-Key': CONFIG.apiKey,
          'X-Partner-Secret': CONFIG.apiSecret
        },
        signal: AbortSignal.timeout(3000)
      });
      if (response.ok) {
        console.log('[Config] Production server reachable - images will load from tiketbaris.id');
        CONFIG.imageBaseUrl = 'https://tiketbaris.id';
      }
    } catch (e) {
      console.log('[Config] Production server not reachable, using local URLs');
    }
  }
}

// State
let currentUser = null;
let selectedRole = 'user';
let searchTimeout = null;

// ============================================
// JWT Token Generation (Client-side simulation)
// ============================================
function generateUserToken(userData) {
  const payload = {
    external_user_id: `jabar_${Date.now()}`,
    email: userData.email,
    name: userData.name,
    role: userData.role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
  };
  
  // Using jwt-encode library
  return jwt_encode(payload, CONFIG.jwtSecret);
}

// ============================================
// API Helper Functions
// ============================================
function getHeaders(includeUserToken = false) {
  const headers = {
    'Content-Type': 'application/json',
    'X-Partner-Key': CONFIG.apiKey,
    'X-Partner-Secret': CONFIG.apiSecret
  };
  
  if (includeUserToken && currentUser?.token) {
    headers['X-User-Token'] = currentUser.token;
  }
  
  return headers;
}

async function apiRequest(endpoint, options = {}) {
  const url = `${CONFIG.apiUrl}${endpoint}`;
  const needsAuth = options.auth !== false;
  
  try {
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers: getHeaders(needsAuth),
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || data.error || 'API Error');
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// ============================================
// UI Helper Functions
// ============================================
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  const icon = document.getElementById('toastIcon');
  const msg = document.getElementById('toastMessage');
  
  msg.textContent = message;
  icon.className = type === 'success' 
    ? 'fas fa-check-circle text-green-400' 
    : type === 'error' 
      ? 'fas fa-exclamation-circle text-red-400'
      : 'fas fa-info-circle text-blue-400';
  
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3000);
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function getStatusBadge(status) {
  const badges = {
    'approved': '<span class="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Approved</span>',
    'pending': '<span class="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">Pending</span>',
    'rejected': '<span class="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Rejected</span>',
    'active': '<span class="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Active</span>',
    'used': '<span class="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">Used</span>',
    'paid': '<span class="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Paid</span>',
    'pending_payment': '<span class="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">Pending</span>',
    'cancelled': '<span class="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Cancelled</span>'
  };
  return badges[status] || `<span class="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">${status}</span>`;
}

// ============================================
// Tab Navigation
// ============================================
function showTab(tabName) {
  // Hide all content
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
  // Show selected content
  document.getElementById(`content-${tabName}`).classList.remove('hidden');
  
  // Update tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('text-primary', 'border-primary');
    btn.classList.add('text-gray-500', 'border-transparent');
  });
  const activeTab = document.getElementById(`tab-${tabName}`);
  activeTab.classList.remove('text-gray-500', 'border-transparent');
  activeTab.classList.add('text-primary', 'border-primary');
  
  // Load tab content
  if (tabName === 'events') {
    loadEvents();
  } else if (tabName === 'mytickets' && currentUser) {
    loadMyTickets();
  } else if (tabName === 'admin' && currentUser?.role === 'admin') {
    loadAdminDashboard();
  }
}

// ============================================
// Login/Logout Functions
// ============================================
function showLoginModal() {
  document.getElementById('loginModal').classList.remove('hidden');
  document.getElementById('loginModal').classList.add('flex');
}

function hideLoginModal() {
  document.getElementById('loginModal').classList.add('hidden');
  document.getElementById('loginModal').classList.remove('flex');
}

function selectRole(role) {
  selectedRole = role;
  document.querySelectorAll('.role-btn').forEach(btn => {
    btn.classList.remove('border-primary', 'bg-primary/5');
    btn.classList.add('border-gray-200');
    btn.querySelector('i').classList.remove('text-primary');
    btn.querySelector('i').classList.add('text-gray-400');
    btn.querySelector('p').classList.remove('text-primary');
    btn.querySelector('p').classList.add('text-gray-600');
  });
  
  const selected = document.getElementById(`role-${role}`);
  selected.classList.remove('border-gray-200');
  selected.classList.add('border-primary', 'bg-primary/5');
  selected.querySelector('i').classList.remove('text-gray-400');
  selected.querySelector('i').classList.add('text-primary');
  selected.querySelector('p').classList.remove('text-gray-600');
  selected.querySelector('p').classList.add('text-primary');
}

async function doLogin() {
  const email = document.getElementById('loginEmail').value;
  const name = document.getElementById('loginName').value;
  
  if (!email || !name) {
    showToast('Email dan nama harus diisi', 'error');
    return;
  }
  
  // Generate JWT token
  const token = generateUserToken({
    email,
    name,
    role: selectedRole
  });
  
  currentUser = {
    email,
    name,
    role: selectedRole,
    token
  };
  
  // Save to localStorage
  localStorage.setItem('partnerDemo_user', JSON.stringify(currentUser));
  
  // Update UI
  updateUserUI();
  hideLoginModal();
  showToast(`Logged in sebagai ${name} (${selectedRole})`);
  
  // Verify with API
  try {
    const userData = await apiRequest('/users/me');
    console.log('User verified with API:', userData);
  } catch (error) {
    console.log('User sync info:', error.message);
  }
  
  // Reload current tab
  const activeTab = document.querySelector('.tab-btn.text-primary');
  if (activeTab) {
    const tabName = activeTab.id.replace('tab-', '');
    showTab(tabName);
  }
}

function logout() {
  currentUser = null;
  localStorage.removeItem('partnerDemo_user');
  updateUserUI();
  showToast('Logged out', 'info');
  showTab('events');
}

function updateUserUI() {
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const userInfo = document.getElementById('userInfo');
  const userName = document.getElementById('userName');
  const adminTab = document.getElementById('tab-admin');
  const ticketsRequireLogin = document.getElementById('ticketsRequireLogin');
  const ticketsList = document.getElementById('ticketsList');
  
  if (currentUser) {
    loginBtn.classList.add('hidden');
    logoutBtn.classList.remove('hidden');
    userInfo.classList.remove('hidden');
    userInfo.classList.add('flex');
    userName.textContent = `${currentUser.name} (${currentUser.role})`;
    
    if (currentUser.role === 'admin') {
      adminTab.classList.remove('hidden');
    } else {
      adminTab.classList.add('hidden');
    }
    
    ticketsRequireLogin.classList.add('hidden');
    ticketsList.classList.remove('hidden');
  } else {
    loginBtn.classList.remove('hidden');
    logoutBtn.classList.add('hidden');
    userInfo.classList.add('hidden');
    userInfo.classList.remove('flex');
    adminTab.classList.add('hidden');
    
    ticketsRequireLogin.classList.remove('hidden');
    ticketsList.classList.add('hidden');
  }
}

// ============================================
// Events Functions
// ============================================
async function loadEvents() {
  const grid = document.getElementById('eventsGrid');
  const emptyState = document.getElementById('emptyEvents');
  const apiStatus = document.getElementById('apiStatus');
  const search = document.getElementById('searchInput').value;
  
  grid.innerHTML = `
    <div class="col-span-full flex justify-center py-12">
      <div class="loader"></div>
    </div>
  `;
  
  try {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    params.append('limit', '12');
    
    const response = await apiRequest(`/events?${params.toString()}`, { auth: false });
    const events = response.data || response.events || [];
    
    // Update API status
    apiStatus.innerHTML = `
      <div class="flex items-center space-x-3">
        <i class="fas fa-check-circle text-green-600 text-xl"></i>
        <div>
          <span class="text-green-700">Terhubung ke ${CONFIG.name}</span>
          <p class="text-xs text-gray-500">Images: ${CONFIG.imageBaseUrl}</p>
        </div>
      </div>
      <span class="text-sm text-gray-500">${events.length} event ditemukan</span>
    `;
    apiStatus.classList.remove('bg-blue-50', 'border-blue-200');
    apiStatus.classList.add('bg-green-50', 'border-green-200');
    
    if (events.length === 0) {
      grid.innerHTML = '';
      emptyState.classList.remove('hidden');
      return;
    }
    
    emptyState.classList.add('hidden');
    grid.innerHTML = events.map(event => createEventCard(event)).join('');
    
  } catch (error) {
    apiStatus.innerHTML = `
      <div class="flex items-center space-x-3">
        <i class="fas fa-exclamation-triangle text-red-600 text-xl"></i>
        <span class="text-red-700">Gagal terhubung: ${error.message}</span>
      </div>
      <button onclick="loadEvents()" class="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200">Retry</button>
    `;
    apiStatus.classList.remove('bg-blue-50', 'border-blue-200');
    apiStatus.classList.add('bg-red-50', 'border-red-200');
    grid.innerHTML = '';
  }
}

// Helper function to get proper image URL
function getImageUrl(rawImage) {
  if (!rawImage) return PLACEHOLDER_IMAGE;
  if (rawImage.startsWith('http')) return rawImage;
  return `${CONFIG.imageBaseUrl}${rawImage}`;
}

function createEventCard(event) {
  const imageUrl = getImageUrl(event.image_url || event.image);
  
  return `
    <div class="bg-white rounded-xl shadow-sm overflow-hidden card-hover transition-all duration-300 cursor-pointer" onclick="showEventDetail(${event.id})">
      <div class="aspect-video bg-gray-100 relative overflow-hidden">
        <img src="${imageUrl}" alt="${event.name || event.title}" 
          class="w-full h-full object-cover" onerror="handleImageError(this)">
        <div class="absolute top-3 right-3">
          ${getStatusBadge(event.status || 'approved')}
        </div>
      </div>
      <div class="p-5">
        <h3 class="font-bold text-lg text-gray-800 mb-2 line-clamp-2">${event.name || event.title}</h3>
        <div class="space-y-2 text-sm text-gray-500">
          <div class="flex items-center">
            <i class="fas fa-calendar-alt w-5"></i>
            <span>${formatDate(event.date || event.event_date)}</span>
          </div>
          <div class="flex items-center">
            <i class="fas fa-map-marker-alt w-5"></i>
            <span class="truncate">${event.location || event.venue || '-'}</span>
          </div>
        </div>
        <div class="mt-4 flex items-center justify-between">
          <span class="text-primary font-bold text-lg">${formatCurrency(event.price || 0)}</span>
          <span class="text-gray-400 text-sm">${event.available_tickets || event.quota || 0} tiket</span>
        </div>
      </div>
    </div>
  `;
}

async function showEventDetail(eventId) {
  const modal = document.getElementById('eventModal');
  const content = document.getElementById('eventModalContent');
  
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  
  content.innerHTML = `
    <div class="p-12 flex justify-center">
      <div class="loader"></div>
    </div>
  `;
  
  try {
    const response = await apiRequest(`/events/${eventId}`, { auth: false });
    const event = response.data || response.event || response;
    
    const imageUrl = getImageUrl(event.image_url || event.image);
    
    content.innerHTML = `
      <div class="aspect-video bg-gray-100 relative">
        <img src="${imageUrl}" alt="${event.name || event.title}" 
          class="w-full h-full object-cover" onerror="handleImageError(this)">
        <button onclick="hideEventModal()" class="absolute top-4 right-4 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full text-white transition">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="p-6">
        <div class="flex items-start justify-between mb-4">
          <div>
            <h2 class="text-2xl font-bold text-gray-800">${event.name || event.title}</h2>
            <p class="text-gray-500 mt-1">${event.organizer || 'Forbasi Jabar'}</p>
          </div>
          ${getStatusBadge(event.status || 'approved')}
        </div>
        
        <div class="grid grid-cols-2 gap-4 mb-6">
          <div class="bg-gray-50 p-4 rounded-lg">
            <i class="fas fa-calendar-alt text-primary mb-2"></i>
            <p class="text-sm text-gray-500">Tanggal</p>
            <p class="font-medium">${formatDate(event.date || event.event_date)}</p>
          </div>
          <div class="bg-gray-50 p-4 rounded-lg">
            <i class="fas fa-map-marker-alt text-primary mb-2"></i>
            <p class="text-sm text-gray-500">Lokasi</p>
            <p class="font-medium">${event.location || event.venue || '-'}</p>
          </div>
          <div class="bg-gray-50 p-4 rounded-lg">
            <i class="fas fa-ticket-alt text-primary mb-2"></i>
            <p class="text-sm text-gray-500">Tersedia</p>
            <p class="font-medium">${event.available_tickets || event.quota || 0} tiket</p>
          </div>
          <div class="bg-gray-50 p-4 rounded-lg">
            <i class="fas fa-tag text-primary mb-2"></i>
            <p class="text-sm text-gray-500">Harga</p>
            <p class="font-bold text-primary text-lg">${formatCurrency(event.price || 0)}</p>
          </div>
        </div>
        
        <div class="mb-6">
          <h3 class="font-semibold text-gray-800 mb-2">Deskripsi</h3>
          <p class="text-gray-600">${event.description || 'Tidak ada deskripsi'}</p>
        </div>
        
        <div class="flex gap-4">
          <button onclick="buyTicket(${event.id})" 
            class="flex-1 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-medium ${!currentUser ? 'opacity-50' : ''}"
            ${!currentUser ? 'disabled' : ''}>
            <i class="fas fa-shopping-cart mr-2"></i>
            ${currentUser ? 'Beli Tiket' : 'Login untuk Beli'}
          </button>
          <button onclick="hideEventModal()" class="px-6 py-3 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition">
            Tutup
          </button>
        </div>
      </div>
    `;
  } catch (error) {
    content.innerHTML = `
      <div class="p-12 text-center">
        <i class="fas fa-exclamation-triangle text-red-500 text-4xl mb-4"></i>
        <p class="text-gray-600">Gagal memuat detail event</p>
        <p class="text-sm text-gray-400 mt-2">${error.message}</p>
        <button onclick="hideEventModal()" class="mt-4 px-6 py-2 bg-gray-100 rounded-lg text-gray-600 hover:bg-gray-200">Tutup</button>
      </div>
    `;
  }
}

function hideEventModal() {
  document.getElementById('eventModal').classList.add('hidden');
  document.getElementById('eventModal').classList.remove('flex');
}

// ============================================
// Ticket Functions
// ============================================
async function buyTicket(eventId) {
  if (!currentUser) {
    showLoginModal();
    return;
  }
  
  try {
    showToast('Memproses checkout...', 'info');
    
    const response = await apiRequest('/checkout', {
      method: 'POST',
      body: {
        event_id: eventId,
        quantity: 1
      }
    });
    
    if (response.payment_url) {
      // Redirect to Midtrans
      window.open(response.payment_url, '_blank');
      showToast('Halaman pembayaran dibuka di tab baru');
    } else {
      showToast('Checkout berhasil! Order ID: ' + response.order_id);
    }
    
    hideEventModal();
    
  } catch (error) {
    showToast('Checkout gagal: ' + error.message, 'error');
  }
}

async function loadMyTickets() {
  const grid = document.getElementById('ticketsGrid');
  
  if (!currentUser) return;
  
  grid.innerHTML = `
    <div class="col-span-full flex justify-center py-12">
      <div class="loader"></div>
    </div>
  `;
  
  try {
    const response = await apiRequest('/tickets');
    const tickets = response.data || response.tickets || [];
    
    if (tickets.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full text-center py-12">
          <i class="fas fa-ticket-alt text-6xl text-gray-300 mb-4"></i>
          <h3 class="text-xl font-semibold text-gray-600 mb-2">Belum ada tiket</h3>
          <p class="text-gray-400">Anda belum membeli tiket event apapun</p>
        </div>
      `;
      return;
    }
    
    grid.innerHTML = tickets.map(ticket => `
      <div class="bg-white rounded-xl shadow-sm p-6">
        <div class="flex items-start justify-between mb-4">
          <div>
            <h3 class="font-bold text-gray-800">${ticket.event_name || ticket.event?.name || 'Event'}</h3>
            <p class="text-sm text-gray-500">${formatDate(ticket.event_date || ticket.event?.date)}</p>
          </div>
          ${getStatusBadge(ticket.status)}
        </div>
        <div class="bg-gray-50 p-4 rounded-lg text-center">
          <p class="text-xs text-gray-500 mb-1">Kode Tiket</p>
          <p class="font-mono font-bold text-lg text-primary">${ticket.ticket_code || ticket.code}</p>
        </div>
      </div>
    `).join('');
    
  } catch (error) {
    grid.innerHTML = `
      <div class="col-span-full text-center py-12">
        <i class="fas fa-exclamation-triangle text-red-500 text-4xl mb-4"></i>
        <p class="text-gray-600">Gagal memuat tiket</p>
        <p class="text-sm text-gray-400">${error.message}</p>
      </div>
    `;
  }
}

// ============================================
// Admin Functions
// ============================================
async function loadAdminDashboard() {
  if (!currentUser || currentUser.role !== 'admin') return;
  
  try {
    const response = await apiRequest('/admin/dashboard');
    const stats = response.data || response;
    
    document.getElementById('stat-events').textContent = stats.total_events || stats.events || 0;
    document.getElementById('stat-transactions').textContent = stats.total_transactions || stats.transactions || 0;
    document.getElementById('stat-users').textContent = stats.total_users || stats.users || 0;
    document.getElementById('stat-revenue').textContent = formatCurrency(stats.total_revenue || stats.revenue || 0);
    
    // Load recent transactions
    loadRecentTransactions();
    
  } catch (error) {
    showToast('Gagal memuat dashboard: ' + error.message, 'error');
  }
}

async function loadRecentTransactions() {
  const tbody = document.getElementById('recentTransactions');
  
  try {
    const response = await apiRequest('/admin/transactions?limit=5');
    const transactions = response.data || response.transactions || [];
    
    if (transactions.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="py-8 text-center text-gray-400">Belum ada transaksi</td>
        </tr>
      `;
      return;
    }
    
    tbody.innerHTML = transactions.map(tx => `
      <tr class="border-b last:border-0">
        <td class="py-3 font-mono text-sm">${tx.order_id || tx.id}</td>
        <td class="py-3">${tx.event_name || tx.event?.name || '-'}</td>
        <td class="py-3">${tx.user_name || tx.user?.name || '-'}</td>
        <td class="py-3 font-medium">${formatCurrency(tx.amount || tx.total || 0)}</td>
        <td class="py-3">${getStatusBadge(tx.status || tx.payment_status)}</td>
      </tr>
    `).join('');
    
  } catch (error) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="py-8 text-center text-red-400">Gagal memuat transaksi</td>
      </tr>
    `;
  }
}

// ============================================
// Search
// ============================================
function debounceSearch() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    loadEvents();
  }, 300);
}

// ============================================
// Initialize
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
  // Test connectivity and auto-configure image URLs
  await testConnectivity();
  
  // Restore user from localStorage
  const savedUser = localStorage.getItem('partnerDemo_user');
  if (savedUser) {
    try {
      currentUser = JSON.parse(savedUser);
      updateUserUI();
    } catch (e) {
      console.error('Failed to restore user:', e);
    }
  }
  
  // Load events
  loadEvents();
  
  // Close modals on outside click
  document.getElementById('loginModal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) hideLoginModal();
  });
  document.getElementById('eventModal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) hideEventModal();
  });
});

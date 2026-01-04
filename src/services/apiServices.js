import api from './api';

export const authService = {
  register: (data) => api.post('/auth/register', data),
  googleAuth: (credential) => api.post('/auth/google', { credential }),
  login: (email, password) => api.post('/auth/login', { email, password }),
  verifyToken: () => api.get('/auth/verify'),
  logout: () => {
    localStorage.removeItem('token');
  }
};

export const eventService = {
  getAllEvents: () => api.get('/events'),
  getEventById: (id) => api.get(`/events/${id}`),
  createEvent: (data) => api.post('/events', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getUserEvents: () => api.get('/events/user/my-events'),
};

export const checkoutService = {
  processCheckout: (data) => api.post('/checkout/process', data),
  getTransaction: (orderId) => api.get(`/checkout/transaction/${orderId}`)
};

export const userService = {
  getProfile: () => api.get('/user/profile'),
  getTransactions: () => api.get('/user/transactions')
};

export const withdrawalService = {
  getWithdrawals: () => api.get('/withdrawals'),
  requestWithdrawal: (amount) => api.post('/withdrawals/request', { amount })
};

export const adminService = {
  getPendingEvents: () => api.get('/admin/pending-events'),
  approveEvent: (id) => api.put(`/admin/approve-event/${id}`),
  declineEvent: (id) => api.put(`/admin/decline-event/${id}`),
  deleteEvent: (id) => api.delete(`/admin/event/${id}`),
  getAllUsers: () => api.get('/admin/users'),
  getPartnerships: () => api.get('/admin/partnerships'),
  approvePartnership: (id) => api.put(`/admin/partnership/${id}/approve`)
};

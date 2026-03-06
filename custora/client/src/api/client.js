import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    headers: { 'Content-Type': 'application/json' },
});

// JWT interceptor
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth
export const authApi = {
    login: (data) => api.post('/auth/login', data),
    register: (data) => api.post('/auth/register', data),
};

// Filaments
export const filamentsApi = {
    getAll: () => api.get('/filaments'),
    getById: (id) => api.get(`/filaments/${id}`),
    create: (data) => api.post('/filaments', data),
    update: (id, data) => api.put(`/filaments/${id}`, data),
    delete: (id) => api.delete(`/filaments/${id}`),
};

// Printers
export const printersApi = {
    getAll: () => api.get('/printers'),
    getById: (id) => api.get(`/printers/${id}`),
    create: (data) => api.post('/printers', data),
    update: (id, data) => api.put(`/printers/${id}`, data),
    delete: (id) => api.delete(`/printers/${id}`),
};

// Orders
export const ordersApi = {
    getAll: () => api.get('/orders'),
    create: (data) => api.post('/orders', data),
    update: (id, data) => api.put(`/orders/${id}`, data),
    delete: (id) => api.delete(`/orders/${id}`),
};

// Products
export const productsApi = {
    getAll: () => api.get('/products'),
    getById: (id) => api.get(`/products/${id}`),
    create: (data) => api.post('/products', data),
    update: (id, data) => api.put(`/products/${id}`, data),
    delete: (id) => api.delete(`/products/${id}`),
};

// Maintenance
export const maintenanceApi = {
    getAll: () => api.get('/maintenance'),
    create: (data) => api.post('/maintenance', data),
    update: (id, data) => api.put(`/maintenance/${id}`, data),
    delete: (id) => api.delete(`/maintenance/${id}`),
};

// Settings
export const settingsApi = {
    get: () => api.get('/settings'),
    update: (data) => api.put('/settings', data),
    addPackaging: (data) => api.post('/settings/packaging', data),
    updatePackaging: (id, data) => api.put(`/settings/packaging/${id}`, data),
    deletePackaging: (id) => api.delete(`/settings/packaging/${id}`),
};

// Calculator
export const calculatorApi = {
    compute: (data) => api.post('/calculator/compute', data),
};

// Reports
export const reportsApi = {
    getFinancial: () => api.get('/reports/financial'),
};

export default api;

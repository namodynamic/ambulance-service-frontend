import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const apiRequest = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiRequest.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 🧾 Interfaces
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  fullName: string;
  email: string;
  password: string;
  phoneNumber: string;
}

export interface AmbulanceData {
  plateNumber: string;
  driverName: string;
  location: string;
}

export interface AmbulanceResponse extends AmbulanceData {
  id: number;
  available: boolean;
}

export interface RequestData {
  patientName: string;
  phoneNumber: string;
  location: string;
  reason: string;
}

export interface RequestResponse extends RequestData {
  id: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
}

// Auth Helpers
export const isAuthenticated = (): boolean => !!localStorage.getItem('token');

export const isAdmin = (): boolean => {
  const user = localStorage.getItem('user');
  if (!user) return false;
  return JSON.parse(user).role === 'ADMIN';
};

// Auth API
export const authAPI = {
  login: async (credentials: LoginCredentials) => {
    const response = await apiRequest.post('/auth/login', credentials);
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    return response.data;
  },

  register: async (data: RegisterData) => {
    const response = await apiRequest.post('/auth/register', data);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};

// Ambulance API
export const ambulanceAPI = {
  getAll: async (): Promise<AmbulanceResponse[]> => {
    const res = await apiRequest.get('/ambulances');
    return res.data;
  },

  getAvailable: async (): Promise<AmbulanceResponse[]> => {
    const res = await apiRequest.get('/ambulances/available');
    return res.data;
  },

  add: async (data: AmbulanceData): Promise<AmbulanceResponse> => {
    const res = await apiRequest.post('/ambulances', data);
    return res.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiRequest.delete(`/ambulances/${id}`);
  },
};

// Request API
export const requestAPI = {
  make: async (data: RequestData): Promise<RequestResponse> => {
    const res = await apiRequest.post('/requests', data);
    return res.data;
  },

  getMyRequests: async (): Promise<RequestResponse[]> => {
    const res = await apiRequest.get('/requests/my');
    return res.data;
  },

  trackStatus: async (id: number): Promise<RequestResponse> => {
    const res = await apiRequest.get(`/requests/${id}`);
    return res.data;
  },
};

// Admin API
export const adminAPI = {
  getAllRequests: async (): Promise<RequestResponse[]> => {
    const res = await apiRequest.get('/admin/requests');
    return res.data;
  },

  assignAmbulance: async (requestId: number, ambulanceId: number): Promise<RequestResponse> => {
    const res = await apiRequest.post(`/admin/requests/${requestId}/assign`, { ambulanceId });
    return res.data;
  },

  updateRequestStatus: async (requestId: number, status: RequestResponse['status']) => {
    const res = await apiRequest.patch(`/admin/requests/${requestId}`, { status });
    return res.data;
  },
};


export const userAPI = {
  getCurrentUser: async () => {
    const res = await axios.get("/users/me", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
    return res.data
  },
}

export const utils = {
  isAuthenticated: () => !!localStorage.getItem("token"),
  isAdmin: () => localStorage.getItem("role") === "ADMIN",
  saveAuthToken: (token: string, remember: boolean) => {
    if (remember) {
      localStorage.setItem("token", token)
    } else {
      sessionStorage.setItem("token", token)
    }
  },
  saveUserRole: (role: string, remember: boolean) => {
    if (remember) {
      localStorage.setItem("role", role)
    } else {
      sessionStorage.setItem("role", role)
    }
  },
}


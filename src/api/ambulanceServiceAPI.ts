import axios, { AxiosError } from "axios";

export interface ApiError {
  error?: string;
  message?: string;
  status?: number;
}

export interface AuthResponse {
  token: string;
  username: string;
  role: "USER" | "DISPATCHER" | "ADMIN";
}

export interface LoginCredentials {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
  role?: "ROLE_USER";
}

export interface AmbulanceData {
  id?: number;
  plateNumber: string;
  driverName: string;
  location: string;
  available: boolean;
  status?: "AVAILABLE" | "ON_DUTY" | "MAINTENANCE";
  createdAt?: string;
  updatedAt?: string;
}

export interface EmergencyRequest {
  id?: number;
  patientName: string;
  phoneNumber: string;
  location: string;
  reason: string;
  status: "PENDING" | "ASSIGNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  assignedAmbulanceId?: number;
  assignedAmbulance?: AmbulanceData;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: number;
  updatedBy?: number;
}

export interface User {
  id?: number;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  role: "USER" | "DISPATCHER" | "ADMIN";
  enabled?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
const API_BASE_URL = `${BASE_URL}/api`;

const apiRequest = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Important for cookies/sessions and CORS
});

apiRequest.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiRequest.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (credentials: LoginCredentials) => {
    const response = await apiRequest.post<AuthResponse>(
      "/auth/login",
      credentials
    );

    const { token, username, role } = response.data;
    const storage = credentials.rememberMe ? localStorage : sessionStorage;

    storage.setItem("token", token);
    storage.setItem("user", JSON.stringify({ username, role }));

    return response.data;
  },

  register: async (data: RegisterData) => {
    const response = await apiRequest.post<{
      message: string;
      user: User;
    }>("/auth/register", data);
    return response.data;
  },

  logout: async () => {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");

    if (token) {
      try {
        await apiRequest.post("/auth/logout");
      } catch (error) {
        console.error("Error during logout:", error);
      }
    }
  },

  refreshToken: async () => {
    const response = await apiRequest.post<{ token: string }>(
      "/auth/refresh-token"
    );
    return response.data.token;
  },
};

export const getCurrentUser = (): User | null => {
  const userStr =
    localStorage.getItem("user") || sessionStorage.getItem("user");
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

// Ambulance API
export const ambulanceAPI = {
  getAll: async (): Promise<AmbulanceData[]> => {
    const response = await apiRequest.get<AmbulanceData[]>("/ambulances");
    return response.data;
  },

  getAvailable: async (): Promise<AmbulanceData[]> => {
    const response = await apiRequest.get<AmbulanceData[]>(
      "/ambulances/available"
    );
    return response.data;
  },

  getById: async (id: number): Promise<AmbulanceData> => {
    const response = await apiRequest.get<AmbulanceData>(
      `/ambulances/${id}`
    );
    return response.data;
  },

  create: async (data: Omit<AmbulanceData, "id">): Promise<AmbulanceData> => {
    const response = await apiRequest.post<AmbulanceData>(
      "/ambulances",
      data
    );
    return response.data;
  },

  update: async (
    id: number,
    data: Partial<AmbulanceData>
  ): Promise<AmbulanceData> => {
    const response = await apiRequest.put<AmbulanceData>(
      `/ambulances/${id}`,
      data
    );
    return response.data;
  },

  updateStatus: async (id: number, status: AmbulanceData["status"]) => {
    const response = await apiRequest.patch(`/ambulances/${id}/status`, {
      status,
    });
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiRequest.delete(`/ambulances/${id}`);
  },
};

// Emergency Request API
export const requestAPI = {
  create: async (
    data: Omit<EmergencyRequest, "id">
  ): Promise<EmergencyRequest> => {
    const response = await apiRequest.post<EmergencyRequest>(
      "/requests",
      data
    );
    return response.data;
  },

  getAll: async (): Promise<EmergencyRequest[]> => {
    const response = await apiRequest.get<EmergencyRequest[]>("/requests");
    return response.data;
  },

  getById: async (id: number): Promise<EmergencyRequest> => {
    const response = await apiRequest.get<EmergencyRequest>(
      `/requests/${id}`
    );
    return response.data;
  },

  getMyRequests: async (): Promise<EmergencyRequest[]> => {
    const response = await apiRequest.get<EmergencyRequest[]>(
      "/requests/my"
    );
    return response.data;
  },

  updateStatus: async (
    id: number,
    status: EmergencyRequest["status"]
  ): Promise<EmergencyRequest> => {
    const response = await apiRequest.patch<EmergencyRequest>(
      `/requests/${id}/status`,
      { status }
    );
    return response.data;
  },

  assignAmbulance: async (
    requestId: number,
    ambulanceId: number
  ): Promise<EmergencyRequest> => {
    const response = await apiRequest.post<EmergencyRequest>(
      `/requests/${requestId}/assign`,
      { ambulanceId }
    );
    return response.data;
  },

  getRequestHistory: async (requestId: number) => {
    const response = await apiRequest.get(`/requests/${requestId}/history`);
    return response.data;
  },
};

// User Management API
export const userAPI = {
  getAll: async (): Promise<User[]> => {
    const response = await apiRequest.get<User[]>("/users");
    return response.data;
  },

  getById: async (id: number): Promise<User> => {
    const response = await apiRequest.get<User>(`/users/${id}`);
    return response.data;
  },

  create: async (data: Omit<User, "id">): Promise<User> => {
    const response = await apiRequest.post<User>("/users", data);
    return response.data;
  },

  update: async (id: number, data: Partial<User>): Promise<User> => {
    const response = await apiRequest.put<User>(`/users/${id}`, data);
    return response.data;
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await apiRequest.patch<User>("/users/me", data);
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await apiRequest.patch("/users/me/password", {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiRequest.delete(`/users/${id}`);
  },
};

// Utility functions
export const utils = {
  isAuthenticated(): boolean {
    return (
      !!localStorage.getItem("authToken") ||
      !!sessionStorage.getItem("authToken")
    );
  },

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === "ADMIN";
  },

  isDispatcher(): boolean {
    const user = this.getCurrentUser();
    return user?.role === "DISPATCHER";
  },

  getCurrentUser(): User | null {
    try {
      const userStr =
        localStorage.getItem("user") || sessionStorage.getItem("user");
      if (!userStr || userStr === "undefined" || userStr === "null") {
        return null;
      }
      const user = JSON.parse(userStr);
      return user as User;
    } catch (error) {
      console.error("Error parsing user data:", error);
      localStorage.removeItem("user");
      sessionStorage.removeItem("user");
      return null;
    }
  },

  saveAuthToken(token: string, rememberMe = false): void {
    if (rememberMe) {
      localStorage.setItem("authToken", token);
    } else {
      sessionStorage.setItem("authToken", token);
    }
  },

  saveUserRole(role: string, rememberMe = false): void {
    if (rememberMe) {
      localStorage.setItem("userRole", role);
    } else {
      sessionStorage.setItem("userRole", role);
    }
  },

  clearAuth(): void {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    localStorage.removeItem("userRole");
    sessionStorage.removeItem("authToken");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("userRole");
  },
};

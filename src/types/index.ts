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

export interface EmergencyRequest {
  id?: number
  user?: User | null
  userName: string
  patientName: string
  userContact: string
  location: string
  emergencyDescription: string
  medicalNotes?: string
  ambulance?: AmbulanceData | null
  status: "PENDING" | "DISPATCHED" | "COMPLETED" | "IN_PROGRESS" | "ARRIVED" | "CANCELLED"
  requestTime?: string
  createdAt?: string
  updatedAt?: string
}

export interface AmbulanceData {
  id?: number
  licensePlate?: string
  driverName?: string
  currentLocation?: string
  location?: string
  status?: "AVAILABLE" | "DISPATCHED" | "MAINTENANCE" | "OUT_OF_SERVICE" | "UNAVAILABLE" | "ON_DUTY"
  availability?: "AVAILABLE" | "DISPATCHED" | "MAINTENANCE" | "OUT_OF_SERVICE" | "UNAVAILABLE" | "ON_DUTY"
  createdAt?: string
  updatedAt?: string
}

export interface Patient {
  id?: number
  name: string
  contact: string
  medicalNotes: string
  createdAt?: string
  updatedAt?: string
}

export interface ServiceHistory {
  id?: number
  requestId: number
  ambulanceId: number
  patientId: number
  status: "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
  notes: string
  arrivalTime?: string
  completionTime?: string
  createdAt?: string
}

export interface PaginatedResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

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

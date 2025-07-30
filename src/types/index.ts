export type RequestStatus =
  | "PENDING"
  | "DISPATCHED"
  | "COMPLETED"
  | "IN_PROGRESS"
  | "ARRIVED"
  | "CANCELLED";
export type Role = "USER" | "DISPATCHER" | "ADMIN";
export type AmbulanceStatus =
  | "AVAILABLE"
  | "DISPATCHED"
  | "MAINTENANCE"
  | "OUT_OF_SERVICE"
  | "UNAVAILABLE"
  | "ON_DUTY";
export type ServiceHistoryStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "ARRIVED";

export interface User {
  id?: number;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  role: Role;
  enabled?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface EmergencyRequest {
  id?: number;
  user?: User | null;
  userName: string;
  patientName: string;
  userContact: string;
  location: string;
  emergencyDescription: string;
  medicalNotes?: string;
  ambulance?: AmbulanceData | null;
  status: RequestStatus;
  requestTime?: string;
  statusHistory: RequestStatusHistory[];
  createdAt?: string;
  updatedAt?: string;
  deleted?: boolean
}

export interface AmbulanceData {
  id?: number;
  licensePlate?: string;
  driverName?: string;
  currentLocation?: string;
  location?: string;
  status?: AmbulanceStatus;
  availability?: AmbulanceStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface Patient {
  id?: number;
  name: string;
  contact: string;
  medicalNotes: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ServiceHistory {
  id?: number;
  requestId: number;
  ambulanceId: number;
  patientId: number;
  status: ServiceHistoryStatus;
  notes: string;
  arrivalTime?: string;
  completionTime?: string;
  createdAt?: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface ApiError {
  error?: string;
  message?: string;
  status?: number;
}

export interface AuthResponse {
  token: string;
  username: string;
  role: Role;
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

export interface RequestStatusHistory {
  id: number;
  oldStatus: RequestStatus;
  newStatus: RequestStatus;
  notes: string;
  changedBy: string;
  createdAt: string;
}

export interface UserRequestHistory {
  id: number;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
  user: User;
  userName: string;
  userContact: string;
  location: string;
  emergencyDescription: string;
  requestTime: string;
  status: string;
  statusHistory: RequestStatusHistory[];
}

"use client"

import React, { createContext, useState, useEffect } from "react"
import { authAPI, getCurrentUser, utils, type User } from "@/api/ambulanceServiceAPI"


interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isAdmin: boolean
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>
  logout: () => void
  loading: boolean
}

type AuthUser = {
  username: string;
  role: 'USER' | 'DISPATCHER' | 'ADMIN';
};

const AuthContext = createContext<AuthContextType | undefined>(undefined)
export { AuthContext }


export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      if (utils.isAuthenticated()) {
        try {
          const userData = await getCurrentUser()
          setUser(userData)
        } catch (err) {
          console.error("Error fetching current user:", err)
          authAPI.logout()
        }
      }
      setLoading(false)
    }

    initAuth()
  }, [])

 const login = async (username: string, password: string, rememberMe = false) => {
  const response = await authAPI.login({ username, password });
  utils.saveAuthToken(response.token, rememberMe);
  utils.saveUserRole(response.role, rememberMe);

  const user: AuthUser = {
  username: response.username,
  role: response.role,
};
if (rememberMe) {
  localStorage.setItem("user", JSON.stringify(user));
} else {
  sessionStorage.setItem("user", JSON.stringify(user));
}
setUser(user);
}

 const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('authToken');
  localStorage.removeItem('userRole');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
  sessionStorage.removeItem('authToken');
  sessionStorage.removeItem('userRole');
  setUser(null);
};

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isAdmin: utils.isAdmin(),
    login,
    logout,
    loading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

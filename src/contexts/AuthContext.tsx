"use client"

import React, { createContext, useState, useEffect } from "react"
import { authAPI, userAPI, utils } from "@/api/ambulanceServiceAPI"

interface User {
  id: string
  name: string
  email: string
  role: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isAdmin: boolean
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)
export { AuthContext }


export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      if (utils.isAuthenticated()) {
        try {
          const userData = await userAPI.getCurrentUser()
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

  const login = async (email: string, password: string, rememberMe = false) => {
    const response = await authAPI.login({ email, password })

    utils.saveAuthToken(response.token, rememberMe)
    utils.saveUserRole(response.role, rememberMe)

    const userData = await userAPI.getCurrentUser()
    setUser(userData)
  }

  const logout = () => {
    authAPI.logout()
    setUser(null)
  }

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

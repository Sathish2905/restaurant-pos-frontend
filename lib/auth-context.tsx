"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { type User, type UserRole, UserRoles } from "./types"
import { api } from "./api"

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  register: (name: string, email: string, password: string, role?: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("pos-token")
      if (token) {
        try {
          const user = await api.getMe()
          if (user) {
            setUser(user)
          } else {
            // Token invalid
            localStorage.removeItem("pos-token")
            localStorage.removeItem("pos-user")
          }
        } catch (error) {
          localStorage.removeItem("pos-token")
          localStorage.removeItem("pos-user")
        }
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const user = await api.login(email, password)
      if (user) {
        setUser(user)
        localStorage.setItem("pos-user", JSON.stringify(user))
        return true
      }
      return false
    } catch (error) {
      console.error("Login failed", error)
      return false
    }
  }

  const register = async (name: string, email: string, password: string, role?: string): Promise<boolean> => {
    try {
      // Create user object with default role 'staff' if not specified
      const userData = {
        name,
        email,
        password,
        role: (role as UserRole) || UserRoles.STAFF
      }

      const user = await api.register(userData)

      if (user) {
        setUser(user)
        localStorage.setItem("pos-user", JSON.stringify(user))
        return true
      }
      return false
    } catch (error) {
      console.error("Registration failed", error)
      return false
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("pos-user")
    localStorage.removeItem("pos-token")
  }

  return <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

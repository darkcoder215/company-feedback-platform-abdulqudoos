'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { UserSession, UserRole, ROLE_PERMISSIONS } from '@/lib/types';

interface AuthContextType {
  user: UserSession | null;
  isAuthenticated: boolean;
  login: (name: string, email: string, role: UserRole, department?: string) => void;
  logout: () => void;
  canViewAllEmployees: boolean;
  canViewReviews: boolean;
  canViewHrComments: boolean;
  canUploadData: boolean;
  canManageAccess: boolean;
  isDepartmentOnly: boolean;
  userDepartment: string | undefined;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'thmanyah_user_session';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  const login = useCallback((name: string, email: string, role: UserRole, department?: string) => {
    const session: UserSession = { name, email, role, department };
    setUser(session);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const perms = user ? ROLE_PERMISSIONS[user.role] : ROLE_PERMISSIONS.viewer;

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      login,
      logout,
      canViewAllEmployees: perms.canViewAllEmployees,
      canViewReviews: perms.canViewReviews,
      canViewHrComments: perms.canViewHrComments,
      canUploadData: perms.canUploadData,
      canManageAccess: perms.canManageAccess,
      isDepartmentOnly: perms.departmentOnly,
      userDepartment: user?.department,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

import React, { createContext, useState } from 'react';
import {
  setLoggedInUser,
  getLoggedInUser,
  logoutUser,
} from '../utils/storage';
import { API_BASE } from '../config/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() =>
    localStorage.getItem('jwtToken') ? getLoggedInUser() : null
  );

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        return { success: false, error: 'Usuario o contraseña incorrectos.' };
      }

      const data = await response.json();
      const authenticatedUser = {
        email: data.email,
        role: data.rol.toLowerCase(),
      };

      localStorage.setItem('jwtToken', data.token);
      setUser(authenticatedUser);
      setLoggedInUser(authenticatedUser);
      return { success: true, user: authenticatedUser };
    } catch {
      return {
        success: false,
        error: 'No se pudo conectar con el servidor. Intenta nuevamente.',
      };
    }
  };

  const register = async (email, password, password2) => {
    if (password !== password2) {
      return { success: false, error: 'Las contraseñas no coinciden.' };
    }

    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: email.split('@')[0],
          email,
          password,
        }),
      });

      if (!response.ok) {
        const message = await response.text();
        return {
          success: false,
          error: message || 'No se pudo completar el registro.',
        };
      }

      return { success: true };
    } catch {
      return {
        success: false,
        error: 'No se pudo conectar con el servidor. Intenta nuevamente.',
      };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('jwtToken');
    logoutUser();
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

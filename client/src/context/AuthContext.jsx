import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('mock_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Mock login — replace body with axios.post('/api/auth/login') later
  const login = async (email, password) => {
    if (!email || !password) throw new Error('Email and password are required.');
    const mockUser = {
      id: 1,
      name: email.split('@')[0],
      email,
      role: 'Admin', // Default mock role
    };
    localStorage.setItem('mock_user', JSON.stringify(mockUser));
    setUser(mockUser);
  };

  // Mock register — replace body with axios.post('/api/auth/register') later
  const register = async ({ name, email, password, role }) => {
    if (!name || !email || !password) throw new Error('All fields are required.');
    const mockUser = { id: 1, name, email, role: role || 'Admin' };
    localStorage.setItem('mock_user', JSON.stringify(mockUser));
    setUser(mockUser);
  };

  const logout = () => {
    localStorage.removeItem('mock_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
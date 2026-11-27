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
      username: email.split('@')[0],
      email,
      role: 'Admin',
      businessName: 'Acme Corp',
      businessIdentifier: 'BIZ-8492',
      status: 'active',
    };
    localStorage.setItem('mock_user', JSON.stringify(mockUser));
    setUser(mockUser);
    return mockUser;
  };

  // Mock register — supports creating a business (Admin) or requesting to join (Pending)
  const register = async ({ username, email, password, mode, businessName, businessIdentifier }) => {
    if (!username || !email || !password) {
      throw new Error('Username, email, and password are required.');
    }

    if (mode === 'create') {
      if (!businessName?.trim()) {
        throw new Error('Please enter a business name.');
      }
      const generatedIdentifier = `BIZ-${Math.floor(1000 + Math.random() * 9000)}`;
      const mockUser = {
        id: 1,
        username: username.trim(),
        email: email.trim(),
        role: 'Admin',
        businessName: businessName.trim(),
        businessIdentifier: generatedIdentifier,
        status: 'active',
      };
      localStorage.setItem('mock_user', JSON.stringify(mockUser));
      setUser(mockUser);
      return mockUser;
    } else {
      if (!businessIdentifier?.trim()) {
        throw new Error('Please enter a valid Business Identifier.');
      }
      // Pending approval: do not log into dashboard yet, return pending state
      return {
        username: username.trim(),
        email: email.trim(),
        businessIdentifier: businessIdentifier.trim().toUpperCase(),
        status: 'pending',
      };
    }
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
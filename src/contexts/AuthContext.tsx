import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type UserRole = 'manager' | 'worker';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  isLoading: boolean;
}

// Demo credentials
export const DEMO_CREDENTIALS = {
  manager: { email: 'manager@demo.com', password: 'manager123' },
  worker: { email: 'worker@demo.com', password: 'worker123' },
};

const DEMO_USERS: Record<string, User> = {
  'manager@demo.com': { id: '1', email: 'manager@demo.com', role: 'manager', name: 'John Manager' },
  'worker@demo.com': { id: '2', email: 'worker@demo.com', role: 'worker', name: 'Jane Worker' },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('auth-user');
    if (stored) {
      setUser(JSON.parse(stored));
    }
    setIsLoading(false);
  }, []);

  const login = (email: string, password: string) => {
    const normalizedEmail = email.toLowerCase().trim();
    
    // Check manager credentials
    if (
      normalizedEmail === DEMO_CREDENTIALS.manager.email &&
      password === DEMO_CREDENTIALS.manager.password
    ) {
      const userData = DEMO_USERS[normalizedEmail];
      setUser(userData);
      localStorage.setItem('auth-user', JSON.stringify(userData));
      return { success: true };
    }
    
    // Check worker credentials
    if (
      normalizedEmail === DEMO_CREDENTIALS.worker.email &&
      password === DEMO_CREDENTIALS.worker.password
    ) {
      const userData = DEMO_USERS[normalizedEmail];
      setUser(userData);
      localStorage.setItem('auth-user', JSON.stringify(userData));
      return { success: true };
    }
    
    return { success: false, error: 'Invalid email or password' };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth-user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

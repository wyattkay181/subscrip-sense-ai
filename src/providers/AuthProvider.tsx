
import React, { createContext, useContext } from 'react';

interface AuthContextType {
  session: null;
  user: null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const signOut = async () => {
    // No-op since we don't have authentication
  };

  return (
    <AuthContext.Provider value={{ session: null, user: null, loading: false, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

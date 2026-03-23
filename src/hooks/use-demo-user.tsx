import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface DemoUser {
  id: string;
  username: string;
  email: string;
}

interface DemoUserContextType {
  user: DemoUser | null;
  isDemo: boolean;
  loginAsDemo: () => void;
  logout: () => void;
}

const DemoUserContext = createContext<DemoUserContextType>({
  user: null,
  isDemo: true,
  loginAsDemo: () => {},
  logout: () => {},
});

const DEMO_USER: DemoUser = {
  id: "demo-user-001",
  username: "demo_trader",
  email: "demo@trustp2p.com",
};

const STORAGE_KEY = "trustp2p_demo_user";

export function DemoUserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DemoUser | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  });

  const loginAsDemo = () => {
    setUser(DEMO_USER);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEMO_USER));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <DemoUserContext.Provider value={{ user, isDemo: true, loginAsDemo, logout }}>
      {children}
    </DemoUserContext.Provider>
  );
}

export const useDemoUser = () => useContext(DemoUserContext);

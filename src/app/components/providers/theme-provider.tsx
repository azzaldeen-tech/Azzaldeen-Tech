'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

const ThemeContext = createContext({
  theme: 'dark',
  setTheme: (_theme: string) => {},
});

export function ThemeProvider({ children }: { children: ReactNode; [key: string]: any }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: 'dark', setTheme: () => {} }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

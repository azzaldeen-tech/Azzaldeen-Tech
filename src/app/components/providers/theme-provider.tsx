'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type Theme = 'light' | 'dark' | 'system';
type ResolvedTheme = Exclude<Theme, 'system'>;

type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
};

type ThemeProviderProps = {
  children: ReactNode;
  defaultTheme?: Theme;
  enableSystem?: boolean;
  storageKey?: string;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function isTheme(value: string | null): value is Theme {
  return value === 'light' || value === 'dark' || value === 'system';
}

function resolveTheme(theme: Theme, enableSystem: boolean): ResolvedTheme {
  if (theme !== 'system' || !enableSystem || typeof window === 'undefined') {
    return theme === 'dark' ? 'dark' : 'light';
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  enableSystem = true,
  storageKey = 'theme',
}: ThemeProviderProps) {
  // 1. نبدأ بقيم افتراضية آمنة تماماً للسيرفر لمنع أي خطأ Prerender
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('dark');
  const [mounted, setMounted] = useState(false);

  // 2. قراءة localStorage وتحديث الحالة فور تحميل المتصفح فقط
  useEffect(() => {
    setMounted(true);
    try {
      const storedTheme = localStorage.getItem(storageKey);
      if (isTheme(storedTheme)) {
        setThemeState(storedTheme);
        setResolvedTheme(resolveTheme(storedTheme, enableSystem));
      } else {
        setResolvedTheme(resolveTheme(defaultTheme, enableSystem));
      }
    } catch (error) {
      console.error('Unable to read the saved theme preference.', error);
    }
  }, [defaultTheme, enableSystem, storageKey]);

  useEffect(() => {
    if (mounted) {
      document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
    }
  }, [resolvedTheme, mounted]);

  const applyTheme = useCallback(
    (selectedTheme: Theme) => {
      const resolved = resolveTheme(selectedTheme, enableSystem);
      if (typeof window !== 'undefined') {
        document.documentElement.classList.toggle('dark', resolved === 'dark');
      }
      setResolvedTheme(resolved);
    },
    [enableSystem],
  );

  const setTheme = useCallback(
    (nextTheme: Theme) => {
      setThemeState(nextTheme);
      try {
        localStorage.setItem(storageKey, nextTheme);
      } catch (error) {
        console.error('Unable to save the theme preference.', error);
      }
      applyTheme(nextTheme);
    },
    [applyTheme, storageKey],
  );

  useEffect(() => {
    if (theme === 'system' && enableSystem) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('system');
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [applyTheme, enableSystem, theme]);

  const contextValue = useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [resolvedTheme, setTheme, theme],
  );

  // 3. منع عرض محتوى يعتمد على الثيم بصورة خاطئة قبل اكتمال الـ Mounting على العميل
  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider.');
  }
  return context;
}

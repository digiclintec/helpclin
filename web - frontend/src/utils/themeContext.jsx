import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext({
  themePreference: 'system',
  resolvedTheme: 'light',
  setThemePreference: () => {}
});

const STORAGE_KEY = 'helpclin_theme_preference';

export function ThemeProvider({ children }) {
  const [themePreference, setThemePreferenceState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || 'system';
    } catch {
      return 'system';
    }
  });

  const [systemIsDark, setSystemIsDark] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Listen to OS theme changes in real time (Windows, macOS, iOS, Android)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const updateSystemPreference = (e) => {
      setSystemIsDark(e.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', updateSystemPreference);
      return () => mediaQuery.removeEventListener('change', updateSystemPreference);
    } else if (mediaQuery.addListener) {
      // Legacy browsers / older iOS
      mediaQuery.addListener(updateSystemPreference);
      return () => mediaQuery.removeListener(updateSystemPreference);
    }
  }, []);

  const resolvedTheme = themePreference === 'system'
    ? (systemIsDark ? 'dark' : 'light')
    : themePreference;

  const setThemePreference = (newPreference) => {
    setThemePreferenceState(newPreference);
    try {
      localStorage.setItem(STORAGE_KEY, newPreference);
    } catch (e) {
      console.warn('Could not persist theme preference in localStorage:', e);
    }
  };

  // Sync mobile browser status bar (<meta name="theme-color">)
  useEffect(() => {
    let metaThemeColor = document.querySelector("meta[name='theme-color']");
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.name = 'theme-color';
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.content = resolvedTheme === 'dark' ? '#0e1721' : '#ffffff';
  }, [resolvedTheme]);

  return (
    <ThemeContext.Provider value={{ themePreference, resolvedTheme, setThemePreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

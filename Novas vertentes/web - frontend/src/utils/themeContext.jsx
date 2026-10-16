import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext({
  themePreference: 'light',
  resolvedTheme: 'light',
  systemIsDark: false,
  hasChosenTheme: false,
  showSyncPrompt: false,
  enableSystemSync: () => {},
  keepLightMode: () => {},
  dismissPrompt: () => {},
  setThemePreference: () => {}
});

const STORAGE_KEY = 'helpclin_theme_preference';
const CHOSEN_KEY = 'helpclin_theme_chosen';

export function ThemeProvider({ children }) {
  // Has the user explicitly made a choice?
  const [hasChosenTheme, setHasChosenTheme] = useState(() => {
    try {
      return localStorage.getItem(CHOSEN_KEY) === 'true';
    } catch {
      return false;
    }
  });

  // If the user already made a choice, use their stored preference; otherwise, start in 'light' mode
  const [themePreference, setThemePreferenceState] = useState(() => {
    try {
      const chosen = localStorage.getItem(CHOSEN_KEY) === 'true';
      if (chosen) {
        return localStorage.getItem(STORAGE_KEY) || 'light';
      }
      return 'light'; // Default to Light Mode so it never forces dark mode without the client's choice
    } catch {
      return 'light';
    }
  });

  // Detect whether the client's OS / device has dark mode enabled (Windows, macOS, iOS, Android)
  const [systemIsDark, setSystemIsDark] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Prompt the client to sync with their device if their system is dark and they haven't chosen yet
  const [showSyncPrompt, setShowSyncPrompt] = useState(() => {
    try {
      const chosen = localStorage.getItem(CHOSEN_KEY) === 'true';
      if (chosen) return false;
      if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
      return false;
    } catch {
      return false;
    }
  });

  // Listen to OS theme changes in real time (Windows, macOS, iOS, Android)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const updateSystemPreference = (e) => {
      setSystemIsDark(e.matches);
      // If the client hasn't chosen yet and their system switches to dark, offer the sync option
      if (!hasChosenTheme && e.matches) {
        setShowSyncPrompt(true);
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', updateSystemPreference);
      return () => mediaQuery.removeEventListener('change', updateSystemPreference);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(updateSystemPreference);
      return () => mediaQuery.removeListener(updateSystemPreference);
    }
  }, [hasChosenTheme]);

  const resolvedTheme = themePreference === 'system'
    ? (systemIsDark ? 'dark' : 'light')
    : themePreference;

  const setThemePreference = (newPreference) => {
    setThemePreferenceState(newPreference);
    setHasChosenTheme(true);
    setShowSyncPrompt(false);
    try {
      localStorage.setItem(STORAGE_KEY, newPreference);
      localStorage.setItem(CHOSEN_KEY, 'true');
    } catch (e) {
      console.warn('Could not persist theme preference in localStorage:', e);
    }
  };

  const enableSystemSync = () => {
    setThemePreference('system');
  };

  const keepLightMode = () => {
    setThemePreference('light');
  };

  const dismissPrompt = () => {
    setShowSyncPrompt(false);
    setHasChosenTheme(true);
    try {
      localStorage.setItem(CHOSEN_KEY, 'true');
    } catch (e) {
      console.warn('Could not save prompt dismissal in localStorage:', e);
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
    <ThemeContext.Provider
      value={{
        themePreference,
        resolvedTheme,
        systemIsDark,
        hasChosenTheme,
        showSyncPrompt,
        enableSystemSync,
        keepLightMode,
        dismissPrompt,
        setThemePreference
      }}
    >
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

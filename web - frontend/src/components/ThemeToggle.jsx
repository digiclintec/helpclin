import { Check, ChevronDown, Laptop, Moon, Sun } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export const THEME_OPTIONS = [
  { id: 'light', label: 'Modo Claro', icon: Sun, desc: 'Visual clássico e luminoso' },
  { id: 'dark', label: 'Modo Escuro', icon: Moon, desc: 'Descanso visual e alto contraste' },
  { id: 'system', label: 'Automático (Sistema)', icon: Laptop, desc: 'Sincroniza com as configurações do seu dispositivo' }
];

export function applyTheme(mode) {
  let isDark = false;
  if (mode === 'dark') {
    isDark = true;
  } else if (mode === 'light') {
    isDark = false;
  } else {
    // system preference
    isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  if (isDark) {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
  }
}

function ThemeToggle() {
  const [themeMode, setThemeMode] = useState(() => {
    try {
      return localStorage.getItem('helpclin_theme_mode') || 'system';
    } catch {
      return 'system';
    }
  });
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Apply theme on mount and when themeMode changes
  useEffect(() => {
    applyTheme(themeMode);
    try {
      localStorage.setItem('helpclin_theme_mode', themeMode);
    } catch (e) {
      console.error(e);
    }

    if (themeMode === 'system' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('system');
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [themeMode]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') setIsOpen(false);
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const activeOption = THEME_OPTIONS.find((opt) => opt.id === themeMode) || THEME_OPTIONS[2];
  const ActiveIcon = activeOption.icon;

  return (
    <div className="theme-toggle-container" ref={containerRef}>
      <button
        className="theme-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Alternar tema de cores"
        aria-expanded={isOpen}
        title={`Tema: ${activeOption.label}`}
      >
        <ActiveIcon size={17} className="theme-toggle-icon" />
        <span className="theme-toggle-label">{activeOption.id === 'system' ? 'Sistema' : activeOption.label.replace('Modo ', '')}</span>
        <ChevronDown size={13} className={`theme-toggle-chevron ${isOpen ? 'theme-toggle-chevron--open' : ''}`} />
      </button>

      {isOpen && (
        <div className="theme-dropdown-menu" role="menu">
          <div className="theme-dropdown-header">
            <strong>Tema de exibição</strong>
            <span>Escolha a aparência da sua preferência</span>
          </div>

          <div className="theme-options-list">
            {THEME_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isSelected = themeMode === option.id;
              return (
                <button
                  key={option.id}
                  className={`theme-option-item ${isSelected ? 'theme-option-item--selected' : ''}`}
                  onClick={() => {
                    setThemeMode(option.id);
                    setIsOpen(false);
                  }}
                  role="menuitem"
                >
                  <div className="theme-option-icon-box">
                    <Icon size={16} />
                  </div>
                  <div className="theme-option-text">
                    <span className="theme-option-name">{option.label}</span>
                    <span className="theme-option-desc">{option.desc}</span>
                  </div>
                  {isSelected && <Check size={16} className="theme-option-check" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default ThemeToggle;

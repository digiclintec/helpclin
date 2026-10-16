import { Check, Laptop, Moon, Sun } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTheme } from '../utils/themeContext.jsx';

const THEME_OPTIONS = [
  {
    id: 'system',
    label: 'Sistema (Auto)',
    description: 'Sincroniza com o seu dispositivo (Windows, macOS, iOS, Android)',
    icon: Laptop
  },
  {
    id: 'light',
    label: 'Modo Claro',
    description: 'Aparência clara tradicional e luminosa',
    icon: Sun
  },
  {
    id: 'dark',
    label: 'Modo Escuro',
    description: 'Aparência suave, relaxante para os olhos e sem reflexos',
    icon: Moon
  }
];

export default function ThemeToggle() {
  const { themePreference, resolvedTheme, setThemePreference } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Current icon to display on the trigger
  const CurrentIcon = themePreference === 'system'
    ? Laptop
    : (resolvedTheme === 'dark' ? Moon : Sun);

  const getTriggerLabel = () => {
    if (themePreference === 'system') return 'Sistema';
    return resolvedTheme === 'dark' ? 'Escuro' : 'Claro';
  };

  return (
    <div className="theme-toggle-wrapper" ref={dropdownRef}>
      <button
        type="button"
        className={`theme-toggle-btn ${isOpen ? 'theme-toggle-btn--active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Selecionar tema de exibição"
        title={`Tema: ${getTriggerLabel()} (clique para alterar)`}
      >
        <span className="theme-toggle-icon-wrap">
          <CurrentIcon size={16} />
        </span>
        <span className="theme-toggle-label">{getTriggerLabel()}</span>
        {themePreference === 'system' && (
          <span className="theme-toggle-badge" title="Sincronizado com o sistema operacional">
            Auto
          </span>
        )}
      </button>

      {isOpen && (
        <div className="theme-dropdown-menu" role="menu">
          <div className="theme-dropdown-header">
            <strong>Tema de Exibição</strong>
            <span>Personalize sua experiência visual</span>
          </div>

          <div className="theme-dropdown-list">
            {THEME_OPTIONS.map(({ id, label, description, icon: OptionIcon }) => {
              const isSelected = themePreference === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="menuitem"
                  className={`theme-dropdown-item ${isSelected ? 'theme-dropdown-item--selected' : ''}`}
                  onClick={() => {
                    setThemePreference(id);
                    setIsOpen(false);
                  }}
                >
                  <div className="theme-dropdown-item-icon">
                    <OptionIcon size={16} />
                  </div>
                  <div className="theme-dropdown-item-content">
                    <div className="theme-dropdown-item-title">
                      <strong>{label}</strong>
                      {id === 'system' && (
                        <span className="theme-item-auto-tag">
                          {resolvedTheme === 'dark' ? 'Atualmente Escuro' : 'Atualmente Claro'}
                        </span>
                      )}
                    </div>
                    <small>{description}</small>
                  </div>
                  {isSelected && (
                    <div className="theme-dropdown-item-check">
                      <Check size={14} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

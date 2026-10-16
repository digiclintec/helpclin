import { Laptop, Moon, Sun, X } from 'lucide-react';
import { useTheme } from '../utils/themeContext.jsx';

export default function ThemeSyncPrompt() {
  const { showSyncPrompt, enableSystemSync, keepLightMode, dismissPrompt } = useTheme();

  if (!showSyncPrompt) return null;

  return (
    <aside className="theme-sync-prompt" role="dialog" aria-labelledby="theme-prompt-heading">
      <div className="theme-prompt-header">
        <div className="theme-prompt-icon-wrap">
          <Moon size={18} />
        </div>
        <div className="theme-prompt-title-group">
          <strong id="theme-prompt-heading">Modo Escuro Detectado</strong>
          <span>Tema do seu sistema operacional</span>
        </div>
        <button
          type="button"
          className="theme-prompt-close-btn"
          onClick={dismissPrompt}
          aria-label="Dispensar aviso de tema"
          title="Fechar"
        >
          <X size={16} />
        </button>
      </div>

      <div className="theme-prompt-body">
        <p>
          Detectamos que seu dispositivo (Windows, Mac ou Celular) está com o <b>Modo Escuro</b> ativado.
          Gostaria de ativar a sincronização automática no HelpClin para acompanhar o seu aparelho?
        </p>
      </div>

      <div className="theme-prompt-actions">
        <button
          type="button"
          className="theme-prompt-btn-primary"
          onClick={enableSystemSync}
        >
          <Laptop size={15} />
          <span>Ativar com meu Sistema</span>
        </button>
        <button
          type="button"
          className="theme-prompt-btn-secondary"
          onClick={keepLightMode}
        >
          <Sun size={14} />
          <span>Manter Modo Claro</span>
        </button>
      </div>
    </aside>
  );
}

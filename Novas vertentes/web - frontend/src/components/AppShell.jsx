import {
  Award,
  BarChart3,
  CheckCircle2,
  FileCheck,
  FileText,
  Headset,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Printer,
  QrCode,
  RotateCcw,
  Settings as SettingsIcon,
  ShieldCheck,
  Users,
  Wrench,
  X
} from 'lucide-react';
import { useState } from 'react';
import NotificationCenter from './NotificationCenter.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import ThemeSyncPrompt from './ThemeSyncPrompt.jsx';
import { ThemeProvider, useTheme } from '../utils/themeContext.jsx';
import { getStoredUser } from '../services/api.js';
import { formatUserVerticalsSummary } from '../utils/verticalUtils.js';

// Menu simplified: core navigation + exclusively "Planos Recorrentes" and "Laudos e Certificados"
const MENU_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/dashboard'
  },
  {
    id: 'chamados',
    label: 'Chamados',
    icon: Headset,
    href: '/chamados'
  },
  {
    id: 'ordens',
    label: 'Ordens de Serviço',
    icon: Wrench,
    href: '/ordens'
  },
  {
    id: 'recorrentes',
    label: 'Planos Recorrentes',
    icon: RotateCcw,
    href: '/servicos?tab=recorrentes',
    badge: 'Auto'
  },
  {
    id: 'laudos',
    label: 'Laudos e Certificados',
    icon: Award,
    action: 'laudos',
    badge: 'RBC'
  },
  {
    id: 'inventario',
    label: 'Equipamentos',
    icon: Package,
    href: '/inventario'
  },
  {
    id: 'relatorios',
    label: 'Relatórios',
    icon: BarChart3,
    href: '/relatorios'
  },
  {
    id: 'usuarios',
    label: 'Usuários',
    icon: Users,
    href: '/usuarios',
    adminOnly: true
  },
  {
    id: 'configuracoes',
    label: 'Configurações',
    icon: SettingsIcon,
    href: '/configuracoes',
    adminOnly: true
  }
];

function checkItemActive(item, currentPath) {
  const searchParams = new URLSearchParams(window.location.search);
  const currentTab = searchParams.get('tab');

  if (item.id === 'recorrentes') {
    return (
      (currentPath === '/servicos' || currentPath === '/ordens') &&
      (currentTab === 'recorrentes' || currentTab === 'recurring')
    );
  }
  if (item.id === 'ordens') {
    return (
      (currentPath === '/ordens' || currentPath === '/servicos') &&
      currentTab !== 'recorrentes' &&
      currentTab !== 'recurring'
    );
  }
  if (item.id === 'chamados') return currentPath === '/chamados';
  if (item.id === 'dashboard') return currentPath === '/dashboard';
  if (item.id === 'inventario') return currentPath === '/inventario';
  if (item.id === 'relatorios') return currentPath === '/relatorios';
  if (item.id === 'usuarios') return currentPath === '/usuarios';
  if (item.id === 'configuracoes') return currentPath === '/configuracoes' || currentPath === '/gestao';
  return false;
}

function AppShellInner({ children }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { resolvedTheme } = useTheme();
  const currentPath = window.location.pathname;
  const user = getStoredUser();

  // Modals for Laudos e Certificados & RBC Inspector
  const [isCertificadosOpen, setIsCertificadosOpen] = useState(false);
  const [certificadosTab, setCertificadosTab] = useState('calibracao');
  const [selectedCert, setSelectedCert] = useState(null);

  if (!user) {
    window.location.replace('/login');
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f7f8f5',
          color: '#123b3d',
          fontFamily: 'sans-serif'
        }}
      >
        <p style={{ fontWeight: 600 }}>Redirecionando para o login...</p>
      </div>
    );
  }

  const userName = user?.name || 'Rodrigo Evangelista Santos';
  const userInitials =
    userName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || 'RS';
  const roleLabel =
    user?.role === 'admin'
      ? 'Administrador'
      : user?.role === 'technician'
      ? 'Técnico Especialista'
      : 'Cliente';

  const availableMenuItems = MENU_ITEMS.filter((item) => !item.adminOnly || user?.role === 'admin');

  function handleLogout() {
    localStorage.removeItem('helpclin_user');
    window.location.href = '/login';
  }

  function handleItemClick(item) {
    if (item.action === 'laudos') {
      setIsCertificadosOpen(true);
      return;
    }
    if (item.href) {
      window.location.href = item.href;
    }
  }

  // Active breadcrumb label
  const activeMenu = availableMenuItems.find((item) => checkItemActive(item, currentPath));
  const breadcrumbLabel = activeMenu ? activeMenu.label : 'Painel de Gestão';

  return (
    <div className="app-shell" data-theme={resolvedTheme}>
      <aside className={`sidebar ${isMenuOpen ? 'sidebar--open' : ''}`}>
        {/* User Profile Header (Teal Brand Header) */}
        <div className="sidebar-user-header">
          <div className="sidebar-user-top">
            <div className="sidebar-avatar">
              {user?.avatar || user?.photo ? (
                <img
                  src={user.avatar || user.photo}
                  alt={userName}
                  className="sidebar-avatar-img"
                />
              ) : (
                <div className="sidebar-avatar-img">{userInitials}</div>
              )}
            </div>

            <div className="sidebar-user-info">
              <strong className="sidebar-user-name" title={userName}>
                {userName}
              </strong>
              <span className="sidebar-user-role">{roleLabel}</span>
              {user?.role !== 'admin' && user?.role !== 'technician' && (
                <span
                  style={{
                    fontSize: '9.5px',
                    color: '#a4ddce',
                    background: 'rgba(255, 255, 255, 0.12)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    marginTop: '3px',
                    width: 'fit-content',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '145px',
                    fontWeight: 600
                  }}
                  title={formatUserVerticalsSummary(user)}
                >
                  {formatUserVerticalsSummary(user)}
                </span>
              )}
            </div>

            <div className="sidebar-header-actions">
              <a
                href="/configuracoes"
                className="sidebar-header-action-btn"
                title="Configurações do Sistema"
                aria-label="Configurações"
              >
                <SettingsIcon size={18} />
              </a>
              <a
                href="/gestao"
                className="sidebar-header-action-btn"
                title="Gestão HelpClin & Módulos"
                aria-label="Gestão e Segurança"
              >
                <ShieldCheck size={18} />
              </a>
              <button
                type="button"
                className="sidebar-header-action-btn sidebar-close-btn"
                onClick={() => setIsMenuOpen(false)}
                aria-label="Fechar menu"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Simplified Main Navigation (Direct single-click, no complex accordions) */}
        <nav className="sidebar-nav-list" aria-label="Navegação principal">
          {availableMenuItems.map((item) => {
            const isItemActive = checkItemActive(item, currentPath);
            const Icon = item.icon;

            if (item.href) {
              return (
                <a
                  key={item.id}
                  href={item.href}
                  className={`sidebar-nav-row ${isItemActive ? 'sidebar-nav-row--active' : ''}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <div className="sidebar-nav-left">
                    <Icon size={18} strokeWidth={1.8} className="sidebar-nav-icon" />
                    <span className="sidebar-nav-label">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`sidebar-nav-badge ${item.id === 'recorrentes' ? 'sidebar-nav-badge--recorrente' : ''}`}>
                      {item.badge}
                    </span>
                  )}
                </a>
              );
            }

            return (
              <button
                key={item.id}
                type="button"
                className={`sidebar-nav-row ${isItemActive ? 'sidebar-nav-row--active' : ''}`}
                onClick={() => {
                  handleItemClick(item);
                  setIsMenuOpen(false);
                }}
              >
                <div className="sidebar-nav-left">
                  <Icon size={18} strokeWidth={1.8} className="sidebar-nav-icon" />
                  <span className="sidebar-nav-label">{item.label}</span>
                </div>
                {item.badge && (
                  <span className="sidebar-nav-badge sidebar-nav-badge--laudos">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer with Logout & Version */}
        <div className="sidebar-bottom-bar">
          <button
            type="button"
            className="sidebar-logout-btn"
            onClick={handleLogout}
            title="Sair da conta"
          >
            <LogOut size={15} />
            <span>Sair do Sistema</span>
          </button>
          <span className="sidebar-version-badge">HelpClin v2.4</span>
        </div>
      </aside>

      {isMenuOpen && (
        <button
          className="sidebar-overlay"
          onClick={() => setIsMenuOpen(false)}
          aria-label="Fechar menu"
        />
      )}

      <main className="main-content">
        <header className="topbar">
          <button
            className="icon-button menu-toggle"
            onClick={() => setIsMenuOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu size={22} />
          </button>

          <div className="breadcrumb">
            <span>HelpClin</span>
            <span>/</span>
            <strong>{breadcrumbLabel}</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
            <ThemeToggle />
            <NotificationCenter />
            <button
              className="icon-button topbar-logout-btn"
              onClick={handleLogout}
              aria-label="Sair da conta"
              title="Sair da conta"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                color: 'var(--muted)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {children}
        <ThemeSyncPrompt />
      </main>

      {/* Modal: Certificados e Laudos Técnicos */}
      {isCertificadosOpen && (
        <div className="modal-backdrop">
          <div className="modal-container" style={{ maxWidth: '820px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: '#e0f2fe',
                    color: '#0369a1',
                    display: 'grid',
                    placeItems: 'center'
                  }}
                >
                  <Award size={20} />
                </div>
                <div>
                  <h2>Certificados e Laudos Técnicos</h2>
                  <p>Documentação metrológica rastreável RBC, ensaios de segurança elétrica e laudos de conformidade.</p>
                </div>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setIsCertificadosOpen(false)}
                aria-label="Fechar"
              >
                <X size={20} />
              </button>
            </div>

            {/* Sub-abas do menu de Certificados e Laudos */}
            <div
              style={{
                display: 'flex',
                gap: '4px',
                padding: '12px 20px 0',
                borderBottom: '1px solid var(--line)',
                background: '#f8faf9',
                overflowX: 'auto'
              }}
            >
              <button
                type="button"
                className={`dash-tab-btn ${certificadosTab === 'calibracao' ? 'dash-tab-btn--active' : ''}`}
                onClick={() => setCertificadosTab('calibracao')}
                style={{ padding: '8px 12px', fontSize: '11.5px', whiteSpace: 'nowrap' }}
              >
                Certificado de calibração
              </button>
              <button
                type="button"
                className={`dash-tab-btn ${certificadosTab === 'rascunho' ? 'dash-tab-btn--active' : ''}`}
                onClick={() => setCertificadosTab('rascunho')}
                style={{ padding: '8px 12px', fontSize: '11.5px', whiteSpace: 'nowrap' }}
              >
                Rascunho de calibração
              </button>
              <button
                type="button"
                className={`dash-tab-btn ${certificadosTab === 'padroes' ? 'dash-tab-btn--active' : ''}`}
                onClick={() => setCertificadosTab('padroes')}
                style={{ padding: '8px 12px', fontSize: '11.5px', whiteSpace: 'nowrap' }}
              >
                Certificados de padrões
              </button>
              <button
                type="button"
                className={`dash-tab-btn ${certificadosTab === 'seguranca' ? 'dash-tab-btn--active' : ''}`}
                onClick={() => setCertificadosTab('seguranca')}
                style={{ padding: '8px 12px', fontSize: '11.5px', whiteSpace: 'nowrap' }}
              >
                Testes de segurança elétrica
              </button>
              <button
                type="button"
                className={`dash-tab-btn ${certificadosTab === 'obsolescencia' ? 'dash-tab-btn--active' : ''}`}
                onClick={() => setCertificadosTab('obsolescencia')}
                style={{ padding: '8px 12px', fontSize: '11.5px', whiteSpace: 'nowrap' }}
              >
                Laudos de obsolescência
              </button>
            </div>

            <div className="modal-body" style={{ padding: '20px' }}>
              {/* Aba 1: Certificado de calibração */}
              {certificadosTab === 'calibracao' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      background: '#f8faf9',
                      border: '1px solid var(--line)',
                      borderRadius: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <CheckCircle2 size={20} style={{ color: '#059669', flexShrink: 0 }} />
                      <div>
                        <strong style={{ fontSize: '13px' }}>
                          Certificado RBC-2026-0042 • Desfibrilador Cardioversor Mindray D3
                        </strong>
                        <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block' }}>
                          Ensaio metrológico de Joules, tempo de carga e sincronismo • Emitido: 15/10/2025 • Validade: 15/10/2026
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="order-status-badge order-status-badge--completed" style={{ fontSize: '11px' }}>
                        Válido RBC
                      </span>
                      <button
                        type="button"
                        className="secondary-button"
                        style={{ fontSize: '11px', padding: '4px 10px' }}
                        onClick={() =>
                          setSelectedCert({
                            numero: 'CAL-RBC-2026-0042',
                            equipamento: 'Desfibrilador Bifásico Mindray BeneHeart D3',
                            serie: 'EQ-MED-0104 (SN: 89324021)',
                            setor: 'UTI Geral Adulto - Leito 02',
                            dataCalibracao: '15/10/2025',
                            validade: '15/10/2026',
                            engenheiro: 'Eng. Rodrigo Evangelista (CREA 506921/SP)',
                            incerteza: 'U = 0.8% (k=2, 95.45% de confiança)',
                            conclusao:
                              'Equipamento calibrado e aprovado em conformidade metrológica com rastreabilidade RBC/INMETRO e IEC 60601-2-4.'
                          })
                        }
                      >
                        Visualizar Laudo
                      </button>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      background: '#f8faf9',
                      border: '1px solid var(--line)',
                      borderRadius: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <CheckCircle2 size={20} style={{ color: '#059669', flexShrink: 0 }} />
                      <div>
                        <strong style={{ fontSize: '13px' }}>
                          Certificado RBC-2026-0019 • Ventilador Mecânico Maquet Servo-i
                        </strong>
                        <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block' }}>
                          Calibração de sensores de fluxo e pressão inspiratória/expiratória • Emitido: 02/07/2026 • Validade: 02/07/2027
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="order-status-badge order-status-badge--completed" style={{ fontSize: '11px' }}>
                        Válido RBC
                      </span>
                      <button
                        type="button"
                        className="secondary-button"
                        style={{ fontSize: '11px', padding: '4px 10px' }}
                        onClick={() =>
                          setSelectedCert({
                            numero: 'CAL-RBC-2026-0019',
                            equipamento: 'Ventilador Mecânico Pulmonar Maquet Servo-i',
                            serie: 'EQ-MED-0088 (SN: MQ-99238)',
                            setor: 'UTI Neonatal / Pediátrica',
                            dataCalibracao: '02/07/2026',
                            validade: '02/07/2027',
                            engenheiro: 'Eng. Rodrigo Evangelista (CREA 506921/SP)',
                            incerteza: 'U = 1.1% (k=2)',
                            conclusao:
                              'Calibração pneumática de volume e pressão aprovada conforme recomendação do fabricante e ONA nível 3.'
                          })
                        }
                      >
                        Visualizar Laudo
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Aba 2: Rascunho de calibração */}
              {certificadosTab === 'rascunho' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      background: '#fffbeb',
                      border: '1px solid #fef3c7',
                      borderRadius: '10px'
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '13px', color: '#92400e' }}>
                        Rascunho de Certificado #CAL-DRAFT-019 • Incubadora Neonatal Fanem 1186
                      </strong>
                      <span style={{ fontSize: '11px', color: '#b45309', display: 'block' }}>
                        Ensaio térmico em andamento • Aguardando estabilização da sonda de umidade relativa (ponto 60%)
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', background: '#fef3c7', color: '#92400e' }}>
                      Em Edição
                    </span>
                  </div>
                </div>
              )}

              {/* Aba 3: Certificados de padrões */}
              {certificadosTab === 'padroes' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      background: '#f8faf9',
                      border: '1px solid var(--line)',
                      borderRadius: '10px'
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '13px' }}>
                        Padrão Metrológico RBC: Analisador de Desfibrilador Fluke Biomedical Impulse 7000DP
                      </strong>
                      <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block' }}>
                        Certificado de Rastreabilidade INMETRO/RBC nº 10928/2025 • Validade do Padrão: 18/04/2027
                      </span>
                    </div>
                    <span className="order-status-badge order-status-badge--completed" style={{ fontSize: '11px' }}>
                      Rastreado RBC
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      background: '#f8faf9',
                      border: '1px solid var(--line)',
                      borderRadius: '10px'
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '13px' }}>
                        Padrão Metrológico RBC: Analisador de Segurança Elétrica Rigel 288+
                      </strong>
                      <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block' }}>
                        Certificado RBC nº 44102/2025 • Rastreabilidade NBR IEC 60601-1 • Validade: 05/11/2026
                      </span>
                    </div>
                    <span className="order-status-badge order-status-badge--completed" style={{ fontSize: '11px' }}>
                      Rastreado RBC
                    </span>
                  </div>
                </div>
              )}

              {/* Aba 4: Testes de segurança elétrica */}
              {certificadosTab === 'seguranca' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      background: '#f8faf9',
                      border: '1px solid var(--line)',
                      borderRadius: '10px'
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '13px' }}>
                        Laudo de Segurança Elétrica NBR IEC 60601-1 • Bloco de Monitores Cirúrgicos
                      </strong>
                      <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block' }}>
                        Resistência do condutor terra (0.08 Ω) • Corrente de fuga no chassi (42 µA) • Status: Conforme
                      </span>
                    </div>
                    <span className="order-status-badge order-status-badge--completed" style={{ fontSize: '11px' }}>
                      Aprovado
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      background: '#f8faf9',
                      border: '1px solid var(--line)',
                      borderRadius: '10px'
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '13px' }}>
                        Ensaio NBR IEC 60601-2-2 • Bisturi Eletrônico Bloco Cirúrgico
                      </strong>
                      <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block' }}>
                        Corrente de fuga em alta frequência e isolamento do eletrodo neutro REM • Status: Conforme
                      </span>
                    </div>
                    <span className="order-status-badge order-status-badge--completed" style={{ fontSize: '11px' }}>
                      Aprovado
                    </span>
                  </div>
                </div>
              )}

              {/* Aba 5: Laudos de obsolescência */}
              {certificadosTab === 'obsolescencia' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      background: '#fef2f2',
                      border: '1px solid #fee2e2',
                      borderRadius: '10px'
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '13px', color: '#991b1b' }}>
                        Laudo Técnico de Sucateamento #OBS-2026-03 • Desfibrilador HP Codemaster
                      </strong>
                      <span style={{ fontSize: '11px', color: '#b91c1c', display: 'block' }}>
                        Equipamento descontinuado pelo fabricante • Falta de capacitor de alta tensão e módulos de reposição • Parecer: Desativação
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: '#dc2626',
                        color: '#fff'
                      }}
                    >
                      Desativar
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      background: '#f8faf9',
                      border: '1px solid var(--line)',
                      borderRadius: '10px'
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '13px' }}>
                        Parecer de Vida Útil #OBS-2026-04 • Bomba de Infusão Samtronic 550T (Ano 2011)
                      </strong>
                      <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block' }}>
                        Mais de 14 anos de serviço • Custo acumulado de manutenções corretivas supera 80% de um ativo novo
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: '#f59e0b',
                        color: '#fff'
                      }}
                    >
                      Avaliar Troca
                    </span>
                  </div>
                </div>
              )}

              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <a
                  href="/servicos?tab=recorrentes"
                  className="primary-button"
                  style={{ fontSize: '12px', padding: '8px 14px' }}
                >
                  Ir para Planos Recorrentes
                </a>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setIsCertificadosOpen(false)}
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Visualizador Tecnológico de Certificado RBC */}
      {selectedCert && (
        <div className="modal-backdrop">
          <div className="modal-container" style={{ maxWidth: '680px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: '#ecfdf5',
                    color: '#059669',
                    display: 'grid',
                    placeItems: 'center'
                  }}
                >
                  <FileCheck size={20} />
                </div>
                <div>
                  <h2>Laudo Oficial de Calibração Metrológica RBC</h2>
                  <p>{selectedCert.numero}</p>
                </div>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setSelectedCert(null)}
                aria-label="Fechar"
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '20px' }}>
              <div className="tech-certificate-card">
                <div className="tech-certificate-top">
                  <div>
                    <span className="tech-certificate-badge">Rastreável RBC / INMETRO</span>
                    <h3 style={{ margin: '8px 0 4px', fontSize: '15px', color: 'var(--teal)' }}>
                      {selectedCert.equipamento}
                    </h3>
                    <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                      Identificação: <strong>{selectedCert.serie}</strong> • Setor: {selectedCert.setor}
                    </p>
                  </div>
                </div>

                <div className="tech-certificate-grid">
                  <div>
                    <span className="tech-certificate-label">Data da Calibração</span>
                    <strong className="tech-certificate-val">{selectedCert.dataCalibracao}</strong>
                  </div>
                  <div>
                    <span className="tech-certificate-label">Validade Metrológica</span>
                    <strong className="tech-certificate-val" style={{ color: '#059669' }}>
                      {selectedCert.validade}
                    </strong>
                  </div>
                  <div>
                    <span className="tech-certificate-label">Incerteza Expandida</span>
                    <strong className="tech-certificate-val">{selectedCert.incerteza}</strong>
                  </div>
                  <div>
                    <span className="tech-certificate-label">Parecer Técnico</span>
                    <strong className="tech-certificate-val" style={{ color: '#059669' }}>
                      Aprovado sem Restrições
                    </strong>
                  </div>
                </div>

                <div className="tech-certificate-conclusion">
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                    Conclusão e Conformidade:
                  </span>
                  <p style={{ margin: 0, fontSize: '12px', lineHeight: 1.5 }}>
                    {selectedCert.conclusao}
                  </p>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: '1px solid #e2e8e5',
                    paddingTop: '14px',
                    flexWrap: 'wrap',
                    gap: '10px'
                  }}
                >
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>
                      Responsável Técnico:
                    </span>
                    <strong style={{ fontSize: '12px', color: 'var(--teal)' }}>
                      {selectedCert.engenheiro}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <QrCode size={28} style={{ color: '#0f766e' }} />
                    <div style={{ textAlign: 'left' }}>
                      <span className="tech-certificate-hash">HASH SHA-256: 7f8a...9c4b</span>
                      <small style={{ display: 'block', fontSize: '9px', color: '#64748b' }}>
                        Assinatura Digital ICP-Brasil
                      </small>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => window.print()}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
                >
                  <Printer size={15} />
                  <span>Imprimir / Salvar Laudo</span>
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setSelectedCert(null)}
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AppShell({ children }) {
  return (
    <ThemeProvider>
      <AppShellInner>{children}</AppShellInner>
    </ThemeProvider>
  );
}

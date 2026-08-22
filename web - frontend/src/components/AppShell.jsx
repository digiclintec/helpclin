import { BarChart3, FilePlus2, Headset, LayoutDashboard, LogOut, Menu, UserCheck, X, Monitor } from 'lucide-react';
import { useState } from 'react';
import NotificationCenter from './NotificationCenter.jsx';
import { getStoredUser } from '../services/api.js';

const navigation = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Chamados', icon: Headset, href: '/chamados' },
  { label: 'Ordens de serviço', icon: FilePlus2, href: '/ordens' },
  { label: 'Inventário', icon: Monitor, href: '/inventario' },
  { label: 'Relatórios', icon: BarChart3, href: '/relatorios' }
];

function AppShell({ children }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const currentPath = window.location.pathname;
  const user = getStoredUser();

  if (!user) {
    window.location.replace('/admin');
    return null;
  }

  const userName = user?.name ?? 'Usuário';
  const userInitials = userName.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  const roleLabel = user?.role === 'admin' ? 'Administrador' : 'Usuário';
  const navigationItems = [...navigation, ...(user?.role === 'admin' ? [{ label: 'Usuários', icon: UserCheck, href: '/usuarios' }] : [])];

  function handleLogout() {
    localStorage.removeItem('helpclin_user');
    window.location.href = '/admin';
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${isMenuOpen ? 'sidebar--open' : ''}`}>
        <div className="brand">
          <span className="brand-mark">H</span>
          <span>helpclin</span>
          <button className="icon-button sidebar-close" onClick={() => setIsMenuOpen(false)} aria-label="Fechar menu">
            <X size={20} />
          </button>
        </div>
        <p className="sidebar-label">Gestão clínica</p>
        <nav className="main-nav" aria-label="Navegação principal">
          {navigationItems.map(({ label, icon: Icon, href }) => (
            <a className={`nav-item ${currentPath === href ? 'nav-item--active' : ''}`} href={href} onClick={() => setIsMenuOpen(false)} key={label}>
              <Icon size={19} strokeWidth={1.8} />
              <span>{label}</span>
            </a>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="profile-mini">
            <div className="avatar avatar--small">{userInitials || 'US'}</div>
            <div><strong>{userName}</strong><span>{roleLabel}</span></div>
            <button className="logout-button" onClick={handleLogout} aria-label="Sair da conta" title="Sair"><LogOut size={16} /></button>
          </div>
        </div>
      </aside>
      {isMenuOpen && <button className="sidebar-overlay" onClick={() => setIsMenuOpen(false)} aria-label="Fechar menu" />}
      <main className="main-content">
        <header className="topbar">
          <button className="icon-button menu-toggle" onClick={() => setIsMenuOpen(true)} aria-label="Abrir menu"><Menu size={22} /></button>
          <div className="breadcrumb"><span>HelpClin</span><span>/</span><strong>{navigationItems.find(({ href }) => href === currentPath)?.label ?? 'Chamados'}</strong></div>
          <NotificationCenter />
        </header>
        {children}
      </main>
    </div>
  );
}

export default AppShell;

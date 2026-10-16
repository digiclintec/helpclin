import AdminLogin from './pages/AdminLogin.jsx';
import AppShell from './components/AppShell.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ServiceOrders from './pages/ServiceOrders.jsx';
import Register from './pages/Register.jsx';
import Reports from './pages/Reports.jsx';
import Tickets from './pages/Tickets.jsx';
import AdminUsers from './pages/AdminUsers.jsx';
import Inventory from './pages/Inventory.jsx';
import LandingPage from './pages/LandingPage.jsx';
import Settings from './pages/Settings.jsx';
import { getStoredUser } from './services/api.js';

function App() {
  const user = getStoredUser();

  // Protected route guard: redirect unauthenticated visitors to /login
  const protectedRoutes = ['/dashboard', '/ordens', '/servicos', '/chamados', '/relatorios', '/usuarios', '/inventario', '/configuracoes', '/gestao'];
  if (protectedRoutes.includes(window.location.pathname) && !user) {
    window.location.replace('/login');
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f7f8f5',
        color: '#123b3d',
        fontFamily: 'sans-serif',
        padding: '20px'
      }}>
        <div style={{ textAlign: 'center', background: '#fff', padding: '30px 40px', borderRadius: '14px', border: '1px solid #dce7df', boxShadow: '0 4px 14px rgba(0,0,0,0.05)' }}>
          <p style={{ fontWeight: 700, fontSize: '16px', margin: '0 0 8px' }}>Redirecionando para o acesso seguro...</p>
          <p style={{ color: '#5e726e', fontSize: '13px', margin: 0 }}>
            Se não redirecionar automaticamente, <a href="/login" style={{ color: '#e78368', fontWeight: 'bold' }}>clique aqui para entrar</a>.
          </p>
        </div>
      </div>
    );
  }

  if (window.location.pathname === '/login' || window.location.pathname === '/admin') {
    return <AdminLogin />;
  }

  if (window.location.pathname === '/registro') {
    return <Register />;
  }

  if (window.location.pathname === '/dashboard') {
    return <AppShell><Dashboard /></AppShell>;
  }

  if (window.location.pathname === '/ordens' || window.location.pathname === '/servicos') {
    return <AppShell><ServiceOrders /></AppShell>;
  }

  if (window.location.pathname === '/chamados') {
    return <AppShell><Tickets /></AppShell>;
  }

  if (window.location.pathname === '/relatorios') {
    return <AppShell><Reports /></AppShell>;
  }

  if (window.location.pathname === '/usuarios') {
    return <AppShell><AdminUsers /></AppShell>;
  }

  if (window.location.pathname === '/inventario') {
    return <AppShell><Inventory /></AppShell>;
  }

  if (window.location.pathname === '/configuracoes' || window.location.pathname === '/gestao') {
    return <AppShell><Settings /></AppShell>;
  }

  return <LandingPage />;
}

export default App;

import { ArrowRight, BarChart3, Check, ChevronDown, CircleCheck, Clock3, Headset, Menu, ShieldCheck, Sparkles, Stethoscope, UsersRound, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import AdminLogin from './pages/AdminLogin.jsx';
import AppShell from './components/AppShell.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ServiceOrders from './pages/ServiceOrders.jsx';
import Register from './pages/Register.jsx';
import Reports from './pages/Reports.jsx';
import Tickets from './pages/Tickets.jsx';
import AdminUsers from './pages/AdminUsers.jsx';
import Inventory from './pages/Inventory.jsx';
import { getStoredUser } from './services/api.js';

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const user = getStoredUser();

  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 15);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Protected route guard: redirect unauthenticated visitors to /admin
  const protectedRoutes = ['/dashboard', '/ordens', '/chamados', '/relatorios', '/usuarios', '/inventario'];
  if (protectedRoutes.includes(window.location.pathname) && !user) {
    window.location.replace('/admin');
    return null;
  }

  if (window.location.pathname === '/admin') {
    return <AdminLogin />;
  }

  if (window.location.pathname === '/registro') {
    return <Register />;
  }

  if (window.location.pathname === '/dashboard') {
    return <AppShell><Dashboard /></AppShell>;
  }

  if (window.location.pathname === '/ordens') {
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

  return (
    <div className="landing-page">
      <header className={`site-header ${isScrolled ? 'site-header--scrolled' : ''}`}>
        <div className="site-header-container">
          <a className="logo" href="#top" aria-label="HelpClinTec início">
            <span className="logo-mark"><Stethoscope size={20} strokeWidth={2.4} /></span>
            <span>help<span>clin</span>tec</span>
          </a>

          <button
            className="mobile-menu-button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? 'Fechar menu' : 'Abrir menu'}
          >
            {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <nav className={`site-nav ${isMenuOpen ? 'site-nav--open' : ''}`}>
            <div className="site-nav-links">
              <a className="nav-link" href="#solucoes" onClick={() => setIsMenuOpen(false)}>
                Soluções <ChevronDown size={14} />
              </a>
              <a className="nav-link" href="#beneficios" onClick={() => setIsMenuOpen(false)}>
                Por que a HelpClinTec
              </a>
              <a className="nav-link" href="#depoimento" onClick={() => setIsMenuOpen(false)}>
                Clientes
              </a>
              <a className="nav-link" href="#contato" onClick={() => setIsMenuOpen(false)}>
                Contato
              </a>
              <a className="nav-link" href={user ? "/chamados" : "/admin"} onClick={() => setIsMenuOpen(false)}>
                Painel de chamados
              </a>
            </div>

            <div className="site-header-actions">
              <a className="header-button header-button--cta" href="#contato" onClick={() => setIsMenuOpen(false)}>
                <span>Falar com especialista</span>
                <ArrowRight size={16} />
              </a>
            </div>
          </nav>
        </div>
      </header>
      <main id="top">
        <section className="hero-section"><div className="hero-copy"><p className="eyebrow"><span className="eyebrow-dot" />Tecnologia que cuida do seu cuidado</p><h1>A inteligência por trás de uma <em>clínica mais humana.</em></h1><p className="hero-description">Centralize sua operação, simplifique a rotina da equipe e ofereça uma experiência de saúde que seus pacientes percebem.</p><div className="hero-actions"><a className="button button--primary" href="#contato">Conheça a HelpClinTec <ArrowRight size={17} /></a><a className="button button--quiet" href="#solucoes">Explorar soluções <span>↓</span></a></div><div className="hero-proof"><div className="avatar-stack"><span>MS</span><span>AF</span><span>LP</span><span>+</span></div><p><strong>+ de 500 clínicas</strong><br />já cuidam melhor com a gente</p></div></div><div className="hero-visual"><div className="visual-note visual-note--top"><CircleCheck size={17} /><span>Agenda otimizada<br /><strong>+28% de eficiência</strong></span></div><div className="visual-frame"><img src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1100&q=85" alt="Profissional de saúde utilizando tecnologia em uma clínica" /><div className="image-overlay" /><div className="hero-caption"><span>Gestão que acompanha o seu ritmo</span><ArrowRight size={18} /></div></div><div className="visual-note visual-note--bottom"><span className="note-icon"><ShieldCheck size={16} /></span><span>Dados protegidos<br /><strong>LGPD em cada detalhe</strong></span></div></div></section>
        <section className="trust-strip"><p>Feita para quem faz a saúde acontecer</p><div><span>CLÍNICA <b>VIVA</b></span><span>+med</span><span>saúde<span className="trust-accent">.</span>integral</span><span>Instituto <b>Ser</b></span></div></section>
        <section className="solutions-section" id="solucoes"><div className="section-intro"><p className="eyebrow">Uma plataforma, toda a sua clínica</p><h2>Tudo conectado para você focar no que <em>realmente importa.</em></h2><p>Menos planilhas, menos retrabalho e muito mais tempo para a sua equipe estar presente.</p></div><div className="solution-grid"><article className="solution-card solution-card--featured"><div className="card-icon"><BarChart3 size={22} /></div><p className="card-number">01 / Gestão</p><h3>Clareza para decidir melhor</h3><p>Indicadores que transformam dados da sua operação em decisões mais inteligentes.</p><a href="#contato">Conhecer gestão <ArrowRight size={15} /></a><div className="mini-chart"><span /><span /><span /><span /><span /><span /><i /></div></article><article className="solution-card"><div className="card-icon card-icon--coral"><UsersRound size={22} /></div><p className="card-number">02 / Experiência</p><h3>Jornada mais leve para todos</h3><p>Do agendamento ao retorno, uma experiência simples para pacientes e equipe.</p><a href="#contato">Ver experiência <ArrowRight size={15} /></a></article><article className="solution-card"><div className="card-icon card-icon--blue"><Clock3 size={22} /></div><p className="card-number">03 / Rotina</p><h3>Tempo de volta para você</h3><p>Automatize tarefas e deixe o sistema cuidar do operacional.</p><a href="#contato">Ganhar tempo <ArrowRight size={15} /></a></article></div></section>
        <section className="benefits-section" id="beneficios"><div className="benefit-quote"><Sparkles size={24} /><blockquote>“A melhor tecnologia é aquela que desaparece na rotina e deixa o cuidado aparecer.”</blockquote><p>O jeito HelpClinTec de fazer</p></div><div className="benefit-list"><p className="eyebrow eyebrow--light">Por dentro da solução</p><h2>O seu jeito de cuidar,<br /><em>potencializado.</em></h2><div className="benefit-row"><Check size={17} /><span><strong>Implementação próxima</strong> para sua equipe começar com segurança.</span></div><div className="benefit-row"><Check size={17} /><span><strong>Suporte de verdade</strong>, com pessoas que entendem sua rotina.</span></div><div className="benefit-row"><Check size={17} /><span><strong>Segurança sem atalhos</strong> para proteger cada história.</span></div></div></section>
        <section className="testimonial-section" id="depoimento"><div className="testimonial-mark">“</div><blockquote>A HelpClinTec nos devolveu o controle da clínica. Hoje a equipe trabalha com mais tranquilidade e nossos pacientes sentem a diferença.</blockquote><div className="testimonial-author"><div className="author-avatar">RC</div><div><strong>Dra. Renata Campos</strong><span>Diretora clínica, Clínica Horizonte</span></div></div></section>
        <section className="contact-section" id="contato"><div><p className="eyebrow eyebrow--light">Pronto para o próximo passo?</p><h2>Vamos construir uma<br /><em>clínica extraordinária.</em></h2></div><a className="button button--light" href="mailto:ola@helpclintec.com.br">Falar com um especialista <ArrowRight size={17} /></a></section>
      </main>
      <footer className="site-footer"><a className="logo logo--footer" href="#top"><span className="logo-mark"><Stethoscope size={18} /></span><span>help<span>clin</span>tec</span></a><p>© 2026 HelpClinTec. Tecnologia para cuidar melhor.</p><div><a href="#contato">Privacidade</a><a href="#contato">Termos</a><a href="#contato">LinkedIn</a></div></footer>
    </div>
  );
}

export default App;

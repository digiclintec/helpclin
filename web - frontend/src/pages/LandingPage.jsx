import React, { useEffect, useState } from 'react';
import {
  Activity,
  ArrowRight,
  BarChart3,
  Boxes,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock,
  Code2,
  Cpu,
  Database,
  ExternalLink,
  FileCheck2,
  Globe,
  Headset,
  Laptop,
  Layers,
  LogIn,
  Mail,
  Menu,
  MessageSquare,
  Phone,
  Send,
  Server,
  ShieldCheck,
  Sparkles,
  Terminal,
  Users,
  Workflow,
  Wrench,
  X,
  Zap
} from 'lucide-react';
import './LandingPage.css';
import { getStoredUser } from '../services/api.js';

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [selectedSystemType, setSelectedSystemType] = useState('os');
  const [selectedPhase, setSelectedPhase] = useState('zero');
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactForm, setContactForm] = useState({
    nome: '',
    empresa: '',
    telefone: '',
    email: '',
    sistema: 'os',
    mensagem: ''
  });

  const user = getStoredUser();

  useEffect(() => {
    document.title = 'Blessed Soluções Tec | Sistemas SaaS, ERP, CRM & APIs REST para Empresas';
    function handleScroll() {
      setIsScrolled(window.scrollY > 20);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Catálogo completo de Sistemas Desenvolvidos pela Blessed Soluções Tec
  const systemsCatalog = {
    os: {
      id: 'os',
      name: 'Sistema de O.S. & Service Desk',
      tag: 'Flagship • Case Real',
      icon: <Wrench size={24} />,
      class: 'os',
      shortDesc: 'Controle operacional de chamados, ordens de serviço, relatórios formais em folha A4 e auditoria de faturamento em tempo real.',
      features: [
        'Acompanhamento de SLA dinâmico por criticidade',
        'Geração de relatórios oficiais em folha A4 vertical para impressão e PDF',
        'Módulo de auditoria de ciclo de faturamento (Criação ➔ Conclusão ➔ Pgto)',
        'Inventário patrimonial de equipamentos e ativos com histórico técnico'
      ],
      techs: ['React', 'Node.js', 'PostgreSQL', 'PDF A4 Engine', 'SLA Timer'],
      simArch: 'Frontend React + API REST Node.js + Banco PostgreSQL + Módulo de Impressão A4',
      simEstimatedTime: '3 a 5 semanas para entrega funcional'
    },
    crm: {
      id: 'crm',
      name: 'CRM & Funil de Vendas B2B',
      tag: 'Comercial & Prospecção',
      icon: <Users size={24} />,
      class: 'crm',
      shortDesc: 'Centralize clientes, propostas comerciais, pipeline de oportunidades e histórico de negociações em uma plataforma ágil e sem fricção.',
      features: [
        'Funil de vendas visual em formato Kanban customizável',
        'Histórico unificado de conversas, e-mails e propostas enviadas',
        'Automação de lembretes e tarefas de follow-up da equipe comercial',
        'Dashboard com taxa de conversão, ticket médio e projeção de receita'
      ],
      techs: ['Kanban Interativo', 'REST Webhooks', 'Automação Comercial', 'Analytics B2B'],
      simArch: 'Single Page Application (SPA) + Microserviço de Notificações + Database Cloud',
      simEstimatedTime: '3 a 4 semanas para versão operacional'
    },
    erp: {
      id: 'erp',
      name: 'ERP & Gestão Empresarial',
      tag: 'Finanças & Operação',
      icon: <Building2 size={24} />,
      class: 'erp',
      shortDesc: 'Plataforma integrada para gestão de receitas, despesas, fluxo de caixa, controle de estoque patrimonial e auditoria contábil.',
      features: [
        'Auditoria rigorosa de contas a pagar, receber e prazos críticos de faturamento',
        'Gestão de estoque com alertas de ponto de pedido e inventário físico',
        'Emissão e exportação em 1 clique para planilhas XLS e documentos PDF',
        'Controle multi-empresa e centro de custos segmentado por filial ou setor'
      ],
      techs: ['Motor Financeiro', 'Export XLS/PDF', 'Auditoria Fiscal', 'Cloud Security'],
      simArch: 'Arquitetura Multi-Tenant Modular + Banco Relacional com Backup Automatizado',
      simEstimatedTime: '4 a 6 semanas para implantação'
    },
    web: {
      id: 'web',
      name: 'Sites & Portais de Alta Conversão',
      tag: 'Web & Presença Digital',
      icon: <Globe size={24} />,
      class: 'web',
      shortDesc: 'Websites corporativos de última geração, páginas de vendas, portais de atendimento e landing pages ultrarrápidas otimizadas para o Google.',
      features: [
        'Design moderno exclusivo com microinterações e padrão visual internacional',
        'Otimização técnica para mecanismos de busca (SEO 100% no Google)',
        'Integração direta com WhatsApp, gateways de formulário e ferramentas de CRM',
        'Carregamento instantâneo via CDN global e certificado de segurança SSL'
      ],
      techs: ['React / Vite', 'SEO Técnico Avançado', 'Design UI/UX Exclusivo', 'Fast CDN'],
      simArch: 'Jamstack Ultrarrápido + CDN Global + Painel de Administração Integrado',
      simEstimatedTime: '1 a 2 semanas para publicação'
    },
    api: {
      id: 'api',
      name: 'APIs RESTful & Microserviços',
      tag: 'Engenharia de Software',
      icon: <Server size={24} />,
      class: 'api',
      shortDesc: 'Arquitetura de dados para conectar sistemas legados, gateways de pagamento, integrações com terceiros e automações corporativas seguras.',
      features: [
        'APIs REST padronizadas com documentação interativa Swagger/OpenAPI',
        'Autenticação de alto nível com tokens JWT, OAuth2 e controle de permissões',
        'Webhooks em tempo real e filas de processamento assíncrono para alta demanda',
        'Monitoramento de latência em milissegundos e logs de auditoria detalhados'
      ],
      techs: ['Node.js / Express', 'JWT / OAuth2', 'REST Webhooks', 'Docker Containers'],
      simArch: 'API Gateway RESTful Desacoplada + Fila Assíncrona de Eventos + Docker',
      simEstimatedTime: '2 a 4 semanas por suíte de integração'
    },
    ris: {
      id: 'ris',
      name: 'Sistemas RIS & Saúde Especializada',
      tag: 'Healthtech Especializada',
      icon: <Activity size={24} />,
      class: 'ris',
      shortDesc: 'Radiology Information System (RIS), prontuários eletrônicos e módulos de fluxo clínico para gestão de exames, diagnósticos e laudos.',
      features: [
        'Gestão de fluxo de exames, laudos radiológicos e entrega digital de resultados',
        'Conexão segura com servidores de imagem PACS e modalidades de diagnóstico',
        'Rastreabilidade clínica completa em conformidade com normas técnicas e LGPD',
        'Agendamento inteligente com triagem de risco e protocolo médico automatizado'
      ],
      techs: ['RIS / PACS Ready', 'Laudos Digitais', 'Protocolos Clínicos', 'LGPD Saúde'],
      simArch: 'Backend com Criptografia de Dados Médicos + Visualizador de Laudos + Audit Trail',
      simEstimatedTime: '4 a 8 semanas para homologação'
    }
  };

  const currentSystem = systemsCatalog[selectedSystemType] || systemsCatalog.os;

  function handleQuickContact(e) {
    e.preventDefault();
    setContactSubmitted(true);
  }

  function handleWhatsAppRedirect(customText = null) {
    const text = customText || encodeURIComponent(
      `Olá! Estive no site da Blessed Soluções Tec e gostaria de solicitar uma conversa sobre o desenvolvimento de um ${currentSystem.name} para a minha empresa (${contactForm.empresa || 'minha empresa'}).`
    );
    window.open(`https://api.whatsapp.com/send?phone=5511999999999&text=${text}`, '_blank');
  }

  function handleSimulatedWhatsApp() {
    const phaseLabel = selectedPhase === 'zero' ? 'Novo projeto do zero' : selectedPhase === 'modernize' ? 'Modernizar sistema existente' : 'Integração de APIs com sistemas legados';
    const msg = encodeURIComponent(
      `Olá! Acessei o simulador da Blessed Soluções Tec e selecionei:\n\n• Sistema: ${currentSystem.name}\n• Estágio: ${phaseLabel}\n• Arquitetura sugerida: ${currentSystem.simArch}\n\nGostaria de entender melhor os detalhes e valores para implantar na minha empresa.`
    );
    window.open(`https://api.whatsapp.com/send?phone=5511999999999&text=${msg}`, '_blank');
  }

  return (
    <div className="blessed-landing">
      {/* ── 1. HEADER MODERNO B2B ESTILO APPLE.COM ── */}
      <header className={`blessed-header ${isScrolled ? 'blessed-header--scrolled' : ''}`}>
        <div className="blessed-header__container">
          <a className="blessed-brand" href="#top" aria-label="Blessed Soluções Tec">
            <div className="blessed-brand__icon-wrap">
              <div className="blessed-brand__icon">
                <Zap size={21} strokeWidth={2.5} />
              </div>
              <span className="brand-led-aura" />
            </div>
            <div className="blessed-brand__text">
              <span className="blessed-brand__name">
                Blessed <span>Soluções Tec</span>
              </span>
              <div className="blessed-brand__badge">
                <span className="mini-led-dot" />
                <span className="blessed-brand__sub">Sistemas SaaS & Tech</span>
              </div>
            </div>
          </a>

          <button
            className="blessed-menu-toggle"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? 'Fechar menu' : 'Abrir menu'}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <nav className={`blessed-nav ${isMenuOpen ? 'blessed-nav--open' : ''}`}>
            <div className="blessed-nav__links">
              <a href="#sistemas" onClick={() => setIsMenuOpen(false)} className="nav-item">
                <span>Sistemas</span>
              </a>
              <a href="#simulador" onClick={() => setIsMenuOpen(false)} className="nav-item">
                <span>Simulador</span>
              </a>
              <a href="#case" onClick={() => setIsMenuOpen(false)} className="nav-item">
                <span>Case O.S.</span>
              </a>
              <a href="#diferenciais" onClick={() => setIsMenuOpen(false)} className="nav-item">
                <span>Diferenciais</span>
              </a>
              <a href="#contato" onClick={() => setIsMenuOpen(false)} className="nav-item">
                <span>Contato</span>
              </a>
            </div>

            <div className="blessed-nav__actions">
              <a
                className="btn-apple-shiny btn-apple-shiny--portal"
                href="/login"
                onClick={() => setIsMenuOpen(false)}
                title="Acessar o Painel e Tela de Login do SaaS"
              >
                <span className="btn-sheen" />
                <Laptop size={15} className="btn-icon" />
                <span className="btn-text">Acessar Painel</span>
              </a>

              <button
                type="button"
                className="btn-apple-shiny btn-apple-shiny--whatsapp"
                onClick={() => {
                  setIsMenuOpen(false);
                  handleWhatsAppRedirect();
                }}
                title="Falar agora com a equipe no WhatsApp"
              >
                <span className="btn-sheen" />
                <span className="live-led-dot">
                  <span className="live-led-dot__ping" />
                  <span className="live-led-dot__core" />
                </span>
                <MessageSquare size={15} className="btn-icon" />
                <span className="btn-text">Falar no WhatsApp</span>
              </button>
            </div>
          </nav>
        </div>
      </header>

      <main id="top">
        {/* ── 2. HERO SECTION DE ALTO IMPACTO ── */}
        <section className="blessed-hero">
          <div className="blessed-hero__container">
            <div className="blessed-hero__content">
              <div className="blessed-badge">
                <span className="pulse-led" />
                <span>Fábrica de Software SaaS & Tecnologia B2B</span>
              </div>

              <h1 className="blessed-hero__title">
                Desenvolvemos <span className="gradient-text">Sistemas SaaS</span>, ERPs, CRMs e APIs que escalam o seu negócio.
              </h1>

              <p className="blessed-hero__desc">
                A <strong>Blessed Soluções Tec</strong> é uma empresa de tecnologia focada em atender outras empresas. 
                Construímos desde sites e portais de alta performance até sistemas completos de Ordens de Serviço (O.S.), 
                gestão financeira ERP, relacionamento CRM, arquiteturas REST e integrações RIS especializadas.
              </p>

              <div className="blessed-hero__actions">
                <a
                  className="btn-blessed btn-blessed--os-hero btn-blessed--large"
                  href="/login"
                  title="Acessar o SaaS de Ordens de Serviço"
                >
                  <Wrench size={18} />
                  <span>Acessar SaaS de Ordens de Serviço</span>
                  <ArrowRight size={16} />
                </a>

                <a
                  className="btn-blessed btn-blessed--login-hero btn-blessed--large"
                  href="/login"
                  title="Fazer Login no Sistema"
                >
                  <LogIn size={18} />
                  <span>Entrar / Tela de Login</span>
                </a>

                <a className="btn-blessed btn-blessed--secondary btn-blessed--large" href="#contato">
                  <span>Solicitar Orçamento</span>
                </a>
              </div>

              <div className="blessed-hero__trust">
                <span className="trust-item"><CheckCircle2 size={15} /> Código 100% Proprietário</span>
                <span className="trust-item"><CheckCircle2 size={15} /> Arquitetura Nuvem & REST</span>
                <span className="trust-item"><CheckCircle2 size={15} /> Relatórios A4 & Exportação</span>
                <span className="trust-item"><CheckCircle2 size={15} /> Suporte Técnico B2B</span>
              </div>
            </div>

            {/* Mockup Interativo do Painel Multi-SaaS Blessed */}
            <div className="blessed-mockup-wrapper">
              <div className="blessed-mockup-glow" />
              <div className="blessed-card-console">
                <div className="console-topbar">
                  <div className="console-dots">
                    <span className="dot red" />
                    <span className="dot yellow" />
                    <span className="dot green" />
                  </div>
                  <span className="console-title">
                    <Terminal size={13} color="#38bdf8" /> blessed-cloud-gateway • v2.6.4 (prod)
                  </span>
                  <span className="console-status-badge online">Ativo</span>
                </div>

                <div className="console-metrics-bar">
                  <div className="metric-pill">
                    <span>Sistemas Ativos</span>
                    <strong>6 Módulos</strong>
                  </div>
                  <div className="metric-pill">
                    <span>Latência Média</span>
                    <strong>16ms</strong>
                  </div>
                  <div className="metric-pill">
                    <span>Uptime Anual</span>
                    <strong>99.98%</strong>
                  </div>
                </div>

                <div className="console-body">
                  <div
                    className="console-item"
                    style={{ cursor: 'pointer' }}
                    onClick={() => window.location.href = '/login'}
                    title="Clique para acessar o sistema de O.S."
                  >
                    <div className="console-item-left">
                      <div className="console-icon os">
                        <Wrench size={16} />
                      </div>
                      <div className="console-item-info">
                        <strong>Sistema de O.S. & Chamados</strong>
                        <span>Clique para entrar no sistema de ordens de serviço</span>
                      </div>
                    </div>
                    <span className="console-status-badge online" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <LogIn size={11} /> Entrar no SaaS
                    </span>
                  </div>

                  <div className="console-item">
                    <div className="console-item-left">
                      <div className="console-icon erp">
                        <Building2 size={16} />
                      </div>
                      <div className="console-item-info">
                        <strong>ERP & Gestão Empresarial</strong>
                        <span>Faturamento • Fluxo de Caixa • Patrimônio</span>
                      </div>
                    </div>
                    <span className="console-status-badge synced">Sincronizado</span>
                  </div>

                  <div className="console-item">
                    <div className="console-item-left">
                      <div className="console-icon crm">
                        <Users size={16} />
                      </div>
                      <div className="console-item-info">
                        <strong>CRM & Funil de Vendas B2B</strong>
                        <span>Pipeline Kanban • Gestão de Contratos</span>
                      </div>
                    </div>
                    <span className="console-status-badge online">Ativo</span>
                  </div>

                  <div className="console-item">
                    <div className="console-item-left">
                      <div className="console-icon api">
                        <Server size={16} />
                      </div>
                      <div className="console-item-info">
                        <strong>APIs RESTful & Microserviços</strong>
                        <span>Webhooks • Autenticação JWT • Gateway</span>
                      </div>
                    </div>
                    <span className="console-status-badge synced">24ms Uptime</span>
                  </div>
                </div>

                <div className="console-footer">
                  <ShieldCheck size={14} color="#10b981" />
                  <span>Infraestrutura em nuvem segura, escalável e com criptografia de ponta a ponta.</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 3. STATS & NÚMEROS DA EMPRESA ── */}
        <section className="blessed-stats-bar">
          <div className="blessed-stats-bar__container">
            <div className="stat-box">
              <strong>100%</strong>
              <span>Sistemas Sob Medida para o seu Nicho</span>
            </div>
            <div className="stat-box">
              <strong>99.9%</strong>
              <span>Disponibilidade e Uptime em Nuvem</span>
            </div>
            <div className="stat-box">
              <strong>6+</strong>
              <span>Módulos de Soluções (O.S., ERP, CRM, APIs)</span>
            </div>
            <div className="stat-box">
              <strong>Zero</strong>
              <span>Burocracia de Templates Travados</span>
            </div>
          </div>
        </section>

        {/* ── 4. SISTEMAS CRIADOS (O CORE DO PORTFÓLIO DA BLESSED) ── */}
        <section className="blessed-systems" id="sistemas">
          <div className="blessed-systems__container">
            <div className="blessed-section-head">
              <span className="blessed-section-tag">PORTFÓLIO DE ENGENHARIA</span>
              <h2>Sistemas e Soluções que Desenvolvemos</h2>
              <p>
                Cada empresa possui fluxos únicos. Na <strong>Blessed Soluções Tec</strong>, desenvolvemos plataformas 
                robustas, inteligentes e modernas exatamente adaptadas ao seu modelo de negócio.
              </p>
            </div>

            <div className="blessed-systems__grid">
              {/* Card 1: Sistema de O.S. (Nosso grande case!) */}
              <div className="system-card system-card--featured">
                <div className="system-card__badge">Case Real em Produção</div>
                <div className="system-card__header">
                  <div className="system-icon os">
                    <Wrench size={26} />
                  </div>
                  <span className="system-tag">Ordens de Serviço</span>
                </div>

                <h3>Sistema de O.S. & Service Desk</h3>
                <p>
                  Plataforma definitiva para abertura de chamados, controle de fila de atendimento, 
                  SLA dinâmico, geração de relatórios com diagramação oficial A4 e controle de faturamento técnico.
                </p>

                <ul className="system-card__features">
                  <li><CheckCircle2 size={16} /> Triagem automática por setor e criticidade (Urgente/Normal/Baixa)</li>
                  <li><CheckCircle2 size={16} /> Relatórios executivos em folha A4 com proporção milimétrica</li>
                  <li><CheckCircle2 size={16} /> Auditoria do ciclo de faturamento (Ordens faturadas x pendentes)</li>
                  <li><CheckCircle2 size={16} /> Cadastro de ativos clínicos, hospitalares ou industriais</li>
                </ul>

                <div className="system-card__tags">
                  <span className="tech-chip">React</span>
                  <span className="tech-chip">Node.js</span>
                  <span className="tech-chip">PostgreSQL</span>
                  <span className="tech-chip">A4 PDF Engine</span>
                  <span className="tech-chip">SLA em Tempo Real</span>
                </div>

                <div style={{ marginTop: '18px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                  <a href="/login" className="btn-blessed btn-blessed--os-direct btn-blessed--full" title="Ir para o SaaS de Ordens de Serviço">
                    <Wrench size={16} />
                    <span>Acessar SaaS de Ordens de Serviço (Login)</span>
                    <ArrowRight size={15} />
                  </a>
                </div>
              </div>

              {/* Card 2: CRM */}
              <div className="system-card">
                <div className="system-card__header">
                  <div className="system-icon crm">
                    <Users size={26} />
                  </div>
                  <span className="system-tag">Comercial & Vendas</span>
                </div>

                <h3>CRM Corporativo B2B</h3>
                <p>
                  Acelere as vendas da sua empresa com controle total do funil comercial, histórico detalhado de 
                  contatos empresariais, propostas em PDF e automações de follow-up.
                </p>

                <ul className="system-card__features">
                  <li><CheckCircle2 size={16} /> Pipeline de vendas visual no modelo Kanban interativo</li>
                  <li><CheckCircle2 size={16} /> Histórico de interações, propostas e contratos assinados</li>
                  <li><CheckCircle2 size={16} /> Alertas de follow-up para vendedores não perderem negócios</li>
                  <li><CheckCircle2 size={16} /> Gráficos de conversão, ticket médio e projeções de faturamento</li>
                </ul>

                <div className="system-card__tags">
                  <span className="tech-chip">Kanban Dinâmico</span>
                  <span className="tech-chip">Gestão de Leads</span>
                  <span className="tech-chip">Propostas Comerciais</span>
                  <span className="tech-chip">Métricas B2B</span>
                </div>
              </div>

              {/* Card 3: ERP */}
              <div className="system-card">
                <div className="system-card__header">
                  <div className="system-icon erp">
                    <Building2 size={26} />
                  </div>
                  <span className="system-tag">Operação & Finanças</span>
                </div>

                <h3>ERP & Gestão Empresarial</h3>
                <p>
                  Software integrado de gestão para dar visibilidade absoluta sobre fluxo de caixa, 
                  contas a pagar e receber, inventário de ativos e conciliação bancária.
                </p>

                <ul className="system-card__features">
                  <li><CheckCircle2 size={16} /> Auditoria de faturamento com alerta de vencimentos em 30 dias</li>
                  <li><CheckCircle2 size={16} /> Controle de estoque, movimentações e histórico de insumos</li>
                  <li><CheckCircle2 size={16} /> Exportação nativa para planilhas Excel (.XLS) e relatórios PDF</li>
                  <li><CheckCircle2 size={16} /> Separação clara por centro de custos, filiais ou setores</li>
                </ul>

                <div className="system-card__tags">
                  <span className="tech-chip">Fluxo de Caixa</span>
                  <span className="tech-chip">Export XLS / CSV</span>
                  <span className="tech-chip">Auditoria Contábil</span>
                  <span className="tech-chip">Gestão Patrimonial</span>
                </div>
              </div>

              {/* Card 4: Sites de Alta Conversão */}
              <div className="system-card">
                <div className="system-card__header">
                  <div className="system-icon web">
                    <Globe size={26} />
                  </div>
                  <span className="system-tag">Web & Presença Digital</span>
                </div>

                <h3>Sites & Portais de Alta Conversão</h3>
                <p>
                  Desenvolvimento de websites corporativos modernos, páginas de captura ultrarrápidas 
                  e portais de clientes com estética premium e carregamento instantâneo.
                </p>

                <ul className="system-card__features">
                  <li><CheckCircle2 size={16} /> Design exclusivo com estética moderna (Glassmorphism e Microinterações)</li>
                  <li><CheckCircle2 size={16} /> Otimização para SEO técnico para posicionamento de destaque no Google</li>
                  <li><CheckCircle2 size={16} /> Totalmente responsivo para celulares, tablets e telas widescreen</li>
                  <li><CheckCircle2 size={16} /> Conexão direta com WhatsApp e captura de leads automatizada</li>
                </ul>

                <div className="system-card__tags">
                  <span className="tech-chip">React / Vite</span>
                  <span className="tech-chip">SEO 100% Google</span>
                  <span className="tech-chip">Alta Velocidade</span>
                  <span className="tech-chip">UI/UX Premium</span>
                </div>
              </div>

              {/* Card 5: APIs RESTful */}
              <div className="system-card">
                <div className="system-card__header">
                  <div className="system-icon api">
                    <Server size={26} />
                  </div>
                  <span className="system-tag">Engenharia de Software</span>
                </div>

                <h3>APIs RESTful & Microserviços</h3>
                <p>
                  Engenharia de ponta a ponta para conectar seus sistemas a ferramentas de terceiros, 
                  gateways de pagamento, webhooks e automação de banco de dados.
                </p>

                <ul className="system-card__features">
                  <li><CheckCircle2 size={16} /> Arquitetura RESTful limpa com rotas organizadas e versionadas</li>
                  <li><CheckCircle2 size={16} /> Autenticação segura por tokens JWT e controle de níveis de acesso</li>
                  <li><CheckCircle2 size={16} /> Webhooks em tempo real para sincronização com outros softwares</li>
                  <li><CheckCircle2 size={16} /> Documentação clara para que sua equipe interna utilize com facilidade</li>
                </ul>

                <div className="system-card__tags">
                  <span className="tech-chip">RESTful API</span>
                  <span className="tech-chip">Node.js / Express</span>
                  <span className="tech-chip">Webhooks</span>
                  <span className="tech-chip">PostgreSQL / MySQL</span>
                </div>
              </div>

              {/* Card 6: RIS e Sistemas de Saúde */}
              <div className="system-card">
                <div className="system-card__header">
                  <div className="system-icon ris">
                    <Activity size={26} />
                  </div>
                  <span className="system-tag">Healthtech & Clínicas</span>
                </div>

                <h3>Sistemas RIS & Saúde Especializada</h3>
                <p>
                  Sistemas de Informação Radiológica (RIS) e softwares clínicos para gestão de exames, 
                  triagem médica, laudos radiológicos digitais e prontuários eletrônicos.
                </p>

                <ul className="system-card__features">
                  <li><CheckCircle2 size={16} /> Gestão da jornada do paciente: Recepção ➔ Exame ➔ Laudo</li>
                  <li><CheckCircle2 size={16} /> Conformidade estrita com normas da ANVISA, ONA e LGPD Saúde</li>
                  <li><CheckCircle2 size={16} /> Emissão de laudos com assinatura digital e entrega online</li>
                  <li><CheckCircle2 size={16} /> Comunicação integrada com equipamentos de diagnóstico e PACS</li>
                </ul>

                <div className="system-card__tags">
                  <span className="tech-chip">Módulos RIS / PACS</span>
                  <span className="tech-chip">Laudos Digitais</span>
                  <span className="tech-chip">LGPD Saúde</span>
                  <span className="tech-chip">Fluxo Clínico</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 5. SIMULADOR INTERATIVO DE PROJETOS SAAS ── */}
        <section className="blessed-simulator" id="simulador">
          <div className="blessed-simulator__container">
            <div className="blessed-section-head blessed-section-head--white">
              <span className="blessed-section-tag blessed-section-tag--white">PLANEJAMENTO TECNOLÓGICO</span>
              <h2>Simulador de Escopo para o seu Sistema</h2>
              <p>
                Selecione o tipo de tecnologia que a sua empresa precisa e veja instantaneamente a arquitetura recomendada.
              </p>
            </div>

            <div className="sim-glass-card">
              <div className="sim-steps-grid">
                {/* Lado Esquerdo: Seletores */}
                <div className="sim-selectors-col">
                  <span className="sim-step-title">
                    <Boxes size={18} /> 1. Escolha o tipo de solução:
                  </span>

                  <div className="sim-options-grid">
                    <button
                      type="button"
                      className={`sim-option-btn ${selectedSystemType === 'os' ? 'sim-option-btn--active' : ''}`}
                      onClick={() => setSelectedSystemType('os')}
                    >
                      <Wrench size={20} color="#38bdf8" />
                      <div>
                        <strong>Sistema de O.S.</strong>
                        <span>Chamados & Laudos A4</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      className={`sim-option-btn ${selectedSystemType === 'crm' ? 'sim-option-btn--active' : ''}`}
                      onClick={() => setSelectedSystemType('crm')}
                    >
                      <Users size={20} color="#fbbf24" />
                      <div>
                        <strong>CRM Comercial</strong>
                        <span>Funil Kanban & Propostas</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      className={`sim-option-btn ${selectedSystemType === 'erp' ? 'sim-option-btn--active' : ''}`}
                      onClick={() => setSelectedSystemType('erp')}
                    >
                      <Building2 size={20} color="#34d399" />
                      <div>
                        <strong>ERP Financeiro</strong>
                        <span>Faturamento & Estoque</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      className={`sim-option-btn ${selectedSystemType === 'web' ? 'sim-option-btn--active' : ''}`}
                      onClick={() => setSelectedSystemType('web')}
                    >
                      <Globe size={20} color="#c084fc" />
                      <div>
                        <strong>Site & Portal Web</strong>
                        <span>Alta Conversão & SEO</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      className={`sim-option-btn ${selectedSystemType === 'api' ? 'sim-option-btn--active' : ''}`}
                      onClick={() => setSelectedSystemType('api')}
                    >
                      <Server size={20} color="#60a5fa" />
                      <div>
                        <strong>APIs RESTful</strong>
                        <span>Microserviços & Webhooks</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      className={`sim-option-btn ${selectedSystemType === 'ris' ? 'sim-option-btn--active' : ''}`}
                      onClick={() => setSelectedSystemType('ris')}
                    >
                      <Activity size={20} color="#f472b6" />
                      <div>
                        <strong>Sistemas RIS / Saúde</strong>
                        <span>Exames, Laudos & PACS</span>
                      </div>
                    </button>
                  </div>

                  <span className="sim-step-title" style={{ marginTop: '20px' }}>
                    <Workflow size={18} /> 2. Qual é a fase atual da sua empresa?
                  </span>

                  <div className="sim-phase-group">
                    <button
                      type="button"
                      className={`sim-phase-btn ${selectedPhase === 'zero' ? 'sim-phase-btn--active' : ''}`}
                      onClick={() => setSelectedPhase('zero')}
                    >
                      Novo Projeto do Zero
                    </button>

                    <button
                      type="button"
                      className={`sim-phase-btn ${selectedPhase === 'modernize' ? 'sim-phase-btn--active' : ''}`}
                      onClick={() => setSelectedPhase('modernize')}
                    >
                      Modernizar Sistema Antigo
                    </button>

                    <button
                      type="button"
                      className={`sim-phase-btn ${selectedPhase === 'integrate' ? 'sim-phase-btn--active' : ''}`}
                      onClick={() => setSelectedPhase('integrate')}
                    >
                      Integração de APIs
                    </button>
                  </div>
                </div>

                {/* Lado Direito: Diagnóstico Recomendado */}
                <div className="sim-result-panel">
                  <span className="result-badge">
                    <Sparkles size={13} /> Diagnóstico Tecnológico Blessed
                  </span>

                  <h4>{currentSystem.name}</h4>
                  <p className="sim-result-desc">{currentSystem.shortDesc}</p>

                  <div className="result-specs-list">
                    <div className="spec-item">
                      <span>Stack de Arquitetura Recomendada:</span>
                      <strong>{currentSystem.simArch}</strong>
                    </div>

                    <div className="spec-item">
                      <span>Prazo Médio Estimado:</span>
                      <strong>{currentSystem.simEstimatedTime}</strong>
                    </div>

                    <div className="spec-item">
                      <span>Segurança & Infraestrutura:</span>
                      <strong>Hospedagem Cloud + Banco Relacional com Backups + SSL + LGPD</strong>
                    </div>
                  </div>

                  <div className="sim-action-area">
                    <button
                      type="button"
                      className="btn-blessed btn-blessed--whatsapp btn-blessed--large btn-blessed--full"
                      onClick={handleSimulatedWhatsApp}
                    >
                      <MessageSquare size={16} />
                      <span>Falar com Especialista sobre esse Escopo</span>
                    </button>

                    <a
                      className="btn-blessed btn-blessed--secondary btn-blessed--full"
                      href="#contato"
                      onClick={() => setContactForm({ ...contactForm, sistema: selectedSystemType })}
                    >
                      <span>Preencher Formulário de Proposta</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 6. SPOTLIGHT DO NOSSO CASE REAL (HelpClinTec) ── */}
        <section className="blessed-case-spotlight" id="case">
          <div className="blessed-case__container">
            <div className="blessed-case__info">
              <span className="case-badge">
                <Code2 size={14} /> CASE REAL DESENVOLVIDO PELA BLESSED
              </span>

              <h2>Plataforma HelpClinTec: Excelência em Ordens de Serviço</h2>

              <p>
                Como prova prática da capacidade técnica da <strong>Blessed Soluções Tec</strong>, desenvolvemos 
                e mantemos o <strong>HelpClinTec</strong> — um sistema robusto voltado para hospitais e clínicas com 
                mais de 100 ativos cadastrados, chamados técnicos em tempo real e auditoria financeira avançada.
              </p>

              <div className="case-highlights">
                <div className="case-highlight-item">
                  <CheckCircle2 size={16} />
                  <span>Emissão de relatórios em folha A4 com proporção vertical exata</span>
                </div>

                <div className="case-highlight-item">
                  <CheckCircle2 size={16} />
                  <span>Controle de SLA dinâmico por criticidade com alertas de prazo</span>
                </div>

                <div className="case-highlight-item">
                  <CheckCircle2 size={16} />
                  <span>Auditoria do ciclo financeiro (Criação ➔ Conclusão ➔ Pagamento)</span>
                </div>

                <div className="case-highlight-item">
                  <CheckCircle2 size={16} />
                  <span>Controle patrimonial de equipamentos biomédicos e prediais</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                <a className="btn-blessed btn-blessed--os-hero btn-blessed--large" href="/login">
                  <LogIn size={17} />
                  <span>Entrar no SaaS de Ordens de Serviço (Login)</span>
                  <ArrowRight size={16} />
                </a>

                <button
                  className="btn-blessed btn-blessed--secondary btn-blessed--large"
                  onClick={() => handleWhatsAppRedirect(encodeURIComponent('Olá! Vi o case do HelpClinTec e gostaria de um sistema similar para a minha operação.'))}
                >
                  <MessageSquare size={16} />
                  <span>Quero um Sistema Similar</span>
                </button>
              </div>
            </div>

            <div className="case-preview-card">
              <div className="preview-bar">
                <strong style={{ color: '#0f172a', fontSize: '14px' }}>HelpClinTec • Painel Operacional</strong>
                <span className="preview-status">
                  <span className="pulse-led" /> Em Produção
                </span>
              </div>

              <div className="preview-row">
                <div>
                  <strong style={{ display: 'block', color: '#1e3a7a' }}>OS-00015 • Tomografia Computadorizada</strong>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Centro Cirúrgico • Preventiva</span>
                </div>
                <span style={{ background: '#ecfdf5', color: '#059669', padding: '3px 8px', borderRadius: '4px', fontWeight: 700, fontSize: '11px' }}>
                  Faturada 16/10/2026
                </span>
              </div>

              <div className="preview-row">
                <div>
                  <strong style={{ display: 'block', color: '#1e3a7a' }}>OS-00014 • Impressora Térmica Zebra</strong>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Recepção Triagem • Suporte T.I.</span>
                </div>
                <span style={{ background: '#ecfdf5', color: '#059669', padding: '3px 8px', borderRadius: '4px', fontWeight: 700, fontSize: '11px' }}>
                  Faturada 16/10/2026
                </span>
              </div>

              <div className="preview-row">
                <div>
                  <strong style={{ display: 'block', color: '#1e3a7a' }}>OS-00013 • Notebook Dell Assistencial</strong>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Escritório Gestão • Sistema PEP</span>
                </div>
                <span style={{ background: '#fff7ed', color: '#c2410c', padding: '3px 8px', borderRadius: '4px', fontWeight: 700, fontSize: '11px' }}>
                  Aguardando Fat. (12/30d)
                </span>
              </div>

              <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px', color: '#64748b' }}>
                <span>Impressão oficial A4 disponível com 1 clique</span>
                <span style={{ fontWeight: 700, color: '#2563eb' }}>100% Personalizado</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── 7. DIFERENCIAIS DA BLESSED SOLUÇÕES TEC ── */}
        <section className="blessed-differentials" id="diferenciais">
          <div className="blessed-differentials__container">
            <div className="blessed-section-head">
              <span className="blessed-section-tag">POR QUE A BLESSED?</span>
              <h2>Tecnologia Feita por Quem Entende de Negócio</h2>
              <p>
                Não entregamos apenas código; criamos ferramentas que organizam equipes, reduzem custos 
                e transformam processos manuais em automações lucrativas.
              </p>
            </div>

            <div className="differentials-grid">
              <div className="diff-card">
                <div className="diff-card__icon">
                  <Zap size={22} />
                </div>
                <h4>Velocidade & Ciclos Ágeis</h4>
                <p>
                  Entregamos versões funcionais em semanas (não em meses). Você acompanha a evolução do sistema 
                  em tempo real com validações contínuas.
                </p>
              </div>

              <div className="diff-card">
                <div className="diff-card__icon">
                  <Cpu size={22} />
                </div>
                <h4>Código 100% Proprietário</h4>
                <p>
                  O sistema pertence à sua empresa. Sem taxas ocultas por licença de terceiros ou restrições 
                  que impedem o crescimento da sua operação.
                </p>
              </div>

              <div className="diff-card">
                <div className="diff-card__icon">
                  <Laptop size={22} />
                </div>
                <h4>Design UI/UX de Nível Internacional</h4>
                <p>
                  Telas intuitivas, agradáveis e modernas. Os colaboradores da sua empresa aprendem a usar o sistema 
                  no primeiro dia sem necessidade de manuais complicados.
                </p>
              </div>

              <div className="diff-card">
                <div className="diff-card__icon">
                  <ShieldCheck size={22} />
                </div>
                <h4>Segurança & Criptografia</h4>
                <p>
                  Backups automáticos, autenticação com tokens JWT, proteção contra invasões e 
                  conformidade com a LGPD em todas as rotas e bancos de dados.
                </p>
              </div>

              <div className="diff-card">
                <div className="diff-card__icon">
                  <FileCheck2 size={22} />
                </div>
                <h4>Relatórios e Documentos Formais</h4>
                <p>
                  Sistemas capazes de gerar folhas oficiais A4, planilhas XLS estruturadas e laudos técnicos 
                  com layout corporativo aprovado para auditorias e clientes.
                </p>
              </div>

              <div className="diff-card">
                <div className="diff-card__icon">
                  <Headset size={22} />
                </div>
                <h4>Suporte Humanizado B2B</h4>
                <p>
                  Fale diretamente com os desenvolvedores responsáveis pela sua plataforma. Atendimento 
                  rápido via WhatsApp, telefone ou e-mail sem robôs travados.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 8. CONTATO & SOLICITAÇÃO DE PROPOSTA ── */}
        <section className="blessed-contact" id="contato">
          <div className="blessed-contact__container">
            <div className="contact-info-block">
              <span className="blessed-section-tag">VAMOS CONVERSAR?</span>
              <h2>Tire sua ideia do papel com a Blessed Soluções Tec</h2>
              <p>
                Conte-nos sobre o desafio da sua empresa. Nossa equipe técnica analisará sua necessidade 
                e apresentará uma proposta comercial sem compromisso.
              </p>

              <div className="contact-channels">
                <a
                  className="channel-card"
                  href="https://api.whatsapp.com/send?phone=5511999999999&text=Olá!%20Gostaria%20de%20falar%20com%20a%20Blessed%20Soluções%20Tec%20sobre%20um%20projeto."
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="channel-icon" style={{ color: '#059669' }}>
                    <MessageSquare size={20} />
                  </div>
                  <div>
                    <strong>Conversar no WhatsApp</strong>
                    <span>Atendimento rápido e direto com nossos especialistas</span>
                  </div>
                </a>

                <div className="channel-card">
                  <div className="channel-icon" style={{ color: '#2563eb' }}>
                    <Mail size={20} />
                  </div>
                  <div>
                    <strong>E-mail Corporativo</strong>
                    <span>contato@blessedsolucoes.com.br</span>
                  </div>
                </div>

                <div className="channel-card">
                  <div className="channel-icon" style={{ color: '#7c3aed' }}>
                    <Clock size={20} />
                  </div>
                  <div>
                    <strong>Horário de Atendimento</strong>
                    <span>Segunda a Sexta, das 08h às 18h (Plantão B2B)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Formulário de Diagnóstico */}
            <div className="contact-form-card">
              {contactSubmitted ? (
                <div className="form-success-box">
                  <CheckCircle2 size={54} color="#059669" style={{ margin: '0 auto' }} />
                  <h4>Solicitação Enviada com Sucesso!</h4>
                  <p>
                    Obrigado, <strong>{contactForm.nome || 'Parceiro'}</strong>! Recebemos sua mensagem da empresa{' '}
                    <strong>{contactForm.empresa || 'sua empresa'}</strong>. Entraremos em contato em até 2 horas comerciais.
                  </p>

                  <button
                    type="button"
                    className="btn-blessed btn-blessed--whatsapp btn-blessed--large btn-blessed--full"
                    onClick={() => handleWhatsAppRedirect()}
                  >
                    <MessageSquare size={16} />
                    <span>Falar Agora no WhatsApp para Agilizar</span>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleQuickContact}>
                  <h3>Solicitar Proposta Comercial</h3>
                  <p>Preencha os dados abaixo para receber uma estimativa personalizada:</p>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="c-nome">Seu Nome *</label>
                      <input
                        id="c-nome"
                        type="text"
                        required
                        placeholder="Ex: Rodrigo Santos"
                        value={contactForm.nome}
                        onChange={(e) => setContactForm({ ...contactForm, nome: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="c-empresa">Nome da sua Empresa *</label>
                      <input
                        id="c-empresa"
                        type="text"
                        required
                        placeholder="Ex: Clínica Med / Indústria XYZ"
                        value={contactForm.empresa}
                        onChange={(e) => setContactForm({ ...contactForm, empresa: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="c-tel">Telefone / WhatsApp *</label>
                      <input
                        id="c-tel"
                        type="tel"
                        required
                        placeholder="(11) 98765-4321"
                        value={contactForm.telefone}
                        onChange={(e) => setContactForm({ ...contactForm, telefone: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="c-email">E-mail Corporativo</label>
                      <input
                        id="c-email"
                        type="email"
                        placeholder="rodrigo@suaempresa.com.br"
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="c-sistema">Qual solução você deseja desenvolver? *</label>
                    <select
                      id="c-sistema"
                      value={contactForm.sistema}
                      onChange={(e) => setContactForm({ ...contactForm, sistema: e.target.value })}
                    >
                      <option value="os">Sistema de Ordens de Serviço (O.S.) & Chamados</option>
                      <option value="crm">CRM & Funil de Vendas B2B</option>
                      <option value="erp">ERP & Gestão Empresarial / Financeira</option>
                      <option value="web">Website Corporativo / Landing Page de Alta Conversão</option>
                      <option value="api">APIs RESTful & Integração entre Softwares</option>
                      <option value="ris">Sistemas RIS & Saúde Especializada</option>
                      <option value="outro">Outro Sistema / Software Sob Medida</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="c-msg">Conte um pouco sobre o que precisa:</label>
                    <textarea
                      id="c-msg"
                      rows={3}
                      placeholder="Ex: Precisamos de um sistema para gerenciar 50 técnicos em campo e emitir relatórios em folha A4..."
                      value={contactForm.mensagem}
                      onChange={(e) => setContactForm({ ...contactForm, mensagem: e.target.value })}
                    />
                  </div>

                  <button type="submit" className="btn-blessed btn-blessed--primary btn-blessed--large btn-blessed--full">
                    <Send size={16} />
                    <span>Enviar Solicitação de Proposta</span>
                  </button>

                  <div style={{ textAlign: 'center', margin: '14px 0', fontSize: '12px', color: '#94a3b8' }}>
                    — ou se preferir atendimento imediato —
                  </div>

                  <button
                    type="button"
                    className="btn-blessed btn-blessed--whatsapp btn-blessed--full"
                    onClick={() => handleWhatsAppRedirect()}
                  >
                    <MessageSquare size={16} />
                    <span>Conversar Direto no WhatsApp</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* ── 9. FOOTER CORPORATIVO BLESSED ── */}
      <footer className="blessed-footer">
        <div className="blessed-footer__container">
          <div className="footer-top">
            <div className="footer-brand-col">
              <div className="blessed-brand">
                <div className="blessed-brand__icon" style={{ width: '36px', height: '36px' }}>
                  <Zap size={18} strokeWidth={2.6} />
                </div>
                <div className="blessed-brand__text">
                  <span className="blessed-brand__name" style={{ color: '#ffffff', fontSize: '18px' }}>
                    Blessed <span style={{ color: '#38bdf8' }}>Soluções Tec</span>
                  </span>
                </div>
              </div>
              <p>
                Fábrica de software e soluções SaaS B2B. Desenvolvemos sistemas corporativos, ERPs, CRMs, 
                portais web e integrações de alto impacto para impulsionar a operação de empresas.
              </p>
            </div>

            <div className="footer-col">
              <h5>Sistemas</h5>
              <ul>
                <li><a href="#sistemas">Sistema de O.S. & Chamados</a></li>
                <li><a href="#sistemas">CRM & Funil de Vendas</a></li>
                <li><a href="#sistemas">ERP & Gestão Empresarial</a></li>
                <li><a href="#sistemas">Sites & Landing Pages</a></li>
                <li><a href="#sistemas">APIs RESTful & Webhooks</a></li>
                <li><a href="#sistemas">Sistemas RIS & Saúde</a></li>
              </ul>
            </div>

            <div className="footer-col">
              <h5>Navegação</h5>
              <ul>
                <li><a href="#top">Início</a></li>
                <li><a href="#simulador">Simulador de Escopo</a></li>
                <li><a href="#case">Case O.S. HelpClin</a></li>
                <li><a href="#diferenciais">Nossos Diferenciais</a></li>
                <li><a href="#contato">Fale com Especialista</a></li>
              </ul>
            </div>

            <div className="footer-col">
              <h5>Acesso ao Sistema</h5>
              <ul>
                <li>
                  <a href="/login" style={{ color: '#38bdf8', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <LogIn size={15} /> <strong>Tela de Login (Entrar)</strong>
                  </a>
                </li>
                <li>
                  <a href="/login" style={{ color: '#ffffff', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Wrench size={15} /> <strong>SaaS de Ordens de Serviço</strong>
                  </a>
                </li>
                <li><a href="/ordens">Painel de Ordens de Serviço</a></li>
                <li><a href="/relatorios">Emissão de Relatórios A4</a></li>
                <li><a href="/configuracoes">Configurações</a></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <span>© 2026 Blessed Soluções Tec • CNPJ & Soluções Tecnológicas B2B. Todos os direitos reservados.</span>
            <span>Desenvolvido com excelência técnica, código limpo e arquitetura em nuvem.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

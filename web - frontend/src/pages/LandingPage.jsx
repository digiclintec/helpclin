import React, { useEffect, useState } from 'react';
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileCheck2,
  Headset,
  Layers,
  Lock,
  Mail,
  Menu,
  MessageSquare,
  Phone,
  Send,
  Server,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Stethoscope,
  Users,
  Wrench,
  X,
  Zap
} from 'lucide-react';
import './LandingPage.css';
import { getStoredUser } from '../services/api.js';

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mockupTab, setMockupTab] = useState('chat'); // 'chat' | 'os'
  const [simulatorStep, setSimulatorStep] = useState(0);
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactForm, setContactForm] = useState({
    nome: '',
    empresa: '',
    telefone: '',
    email: '',
    sistema: 'combo',
    mensagem: ''
  });

  const user = getStoredUser();

  useEffect(() => {
    document.title = 'HelpClin & Helpchat | Central de Atendimento WhatsApp & Gestão de Ordens de Serviço';
    function handleScroll() {
      setIsScrolled(window.scrollY > 20);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  function handleQuickContact(e) {
    e.preventDefault();
    setContactSubmitted(true);
    const text = encodeURIComponent(
      `Olá! Tenho interesse nas soluções da HelpClinTec.
*Nome:* ${contactForm.nome || 'Não informado'}
*Empresa:* ${contactForm.empresa || 'Não informada'}
*Telefone:* ${contactForm.telefone || 'Não informado'}
*Sistema de interesse:* ${contactForm.sistema}
*Mensagem:* ${contactForm.mensagem || 'Gostaria de uma demonstração e valores.'}`
    );
    window.open(`https://api.whatsapp.com/send?phone=5511999999999&text=${text}`, '_blank');
  }

  function handleDirectWhatsApp(systemName = 'Suite Completa') {
    const text = encodeURIComponent(
      `Olá! Gostaria de saber mais sobre a revenda e contratação do sistema: ${systemName}. Pode me apresentar uma demonstração?`
    );
    window.open(`https://api.whatsapp.com/send?phone=5511999999999&text=${text}`, '_blank');
  }

  // Passos do Simulador Interativo
  const simulatorFlow = [
    {
      title: '1. Entrada no WhatsApp (Helpchat)',
      badge: 'Atendimento Omnichannel',
      desc: 'O cliente ou paciente envia uma mensagem para o WhatsApp da sua empresa. O Helpchat recebe instantaneamente e inicia a conversa.',
      actionPreview: 'Mensagem recebida: "Boa tarde, meu equipamento está com alerta ou preciso agendar um suporte técnico."',
      metric: 'Tempo de resposta: < 5 segundos'
    },
    {
      title: '2. Triagem Automática & Fila de Espera',
      badge: 'Chatbot Inteligente',
      desc: 'O robô interativo apresenta o menu de opções da sua empresa, coleta dados do cliente e direciona para a equipe correta sem filas.',
      actionPreview: 'Menu: [1] Atendimento Clínico • [2] Suporte de T.I. • [3] Manutenção Predial • [4] Financeiro',
      metric: '100% dos clientes atendidos 24h/dia'
    },
    {
      title: '3. Abertura de Chamado no HelpClin OS',
      badge: 'Integração Técnica',
      desc: 'Com um clique ou automação, a demanda gera um chamado técnico formal no HelpClin OS com SLA dinâmico calculado pela criticidade.',
      actionPreview: 'O.S. #4829 criada com prioridade Alta • Atribuída ao Engenheiro/Técnico de plantão.',
      metric: 'SLA rastreado em tempo real'
    },
    {
      title: '4. Conclusão & Envio do Laudo A4 no WhatsApp',
      badge: 'Laudo Pericial & PDF',
      desc: 'O técnico finaliza o serviço pelo painel HelpClin, emite o laudo A4 em PDF com assinatura digital e o documento é enviado de volta ao cliente pelo próprio WhatsApp!',
      actionPreview: 'PDF "Laudo_OS_4829.pdf" gerado com conformidade ANVISA/RBC e entregue ao solicitante.',
      metric: 'Ciclo completo fechado sem burocracia'
    }
  ];

  return (
    <div className="landing-page-clean">
      {/* ── Header Enxuto & Moderno ── */}
      <header className={`clean-header ${isScrolled ? 'clean-header--scrolled' : ''}`}>
        <div className="clean-header__container">
          <a className="clean-brand" href="#top" aria-label="HelpClinTec">
            <span className="clean-brand__icon">
              <Activity size={22} strokeWidth={2.5} />
            </span>
            <div className="clean-brand__text">
              <span className="clean-brand__name">help<span>clin</span>tec</span>
              <span className="clean-brand__sub">Sistemas SaaS & Gestão</span>
            </div>
          </a>

          <button
            className="clean-menu-toggle"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? 'Fechar menu' : 'Abrir menu'}
          >
            {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <nav className={`clean-nav ${isMenuOpen ? 'clean-nav--open' : ''}`}>
            <a href="#solucoes" onClick={() => setIsMenuOpen(false)}>Sistemas</a>
            <a href="#fluxo" onClick={() => setIsMenuOpen(false)}>Como Funciona</a>
            <a href="#planos" onClick={() => setIsMenuOpen(false)}>Planos & Revenda</a>
            <a href="#contato" onClick={() => setIsMenuOpen(false)}>Contato</a>

            <div className="clean-nav__actions">
              <a
                className="clean-btn clean-btn--subtle"
                href={user ? '/portal' : '/login'}
                onClick={() => setIsMenuOpen(false)}
              >
                <Layers size={16} color="var(--clean-coral-500)" />
                <span>{user ? 'Acessar Portal' : 'Portal do Cliente'}</span>
              </a>

              <button
                className="clean-btn clean-btn--whatsapp"
                onClick={() => {
                  setIsMenuOpen(false);
                  handleDirectWhatsApp('Demonstração');
                }}
              >
                <Smartphone size={16} />
                <span>Falar no WhatsApp</span>
              </button>
            </div>
          </nav>
        </div>
      </header>

      <main id="top">
        {/* ── Hero Limpo & Direto ── */}
        <section className="clean-hero">
          <div className="clean-hero__container">
            <div className="clean-hero__content">
              <div className="clean-badge">
                <Sparkles size={14} />
                <span>Ecossistema SaaS • Atendimento & Service Desk</span>
              </div>

              <h1 className="clean-hero__title">
                Central de atendimento no <span className="text-whatsapp">WhatsApp</span> & Gestão de <span className="text-coral">Ordens de Serviço</span>
              </h1>

              <p className="clean-hero__desc">
                Potencialize sua operação com a suíte integrada: atenda centenas de clientes com múltiplos atendentes no <strong>Helpchat</strong> e controle chamados, ordens de serviço e laudos A4 com o <strong>HelpClin OS</strong>.
              </p>

              <div className="clean-hero__actions">
                <a className="clean-btn clean-btn--large clean-btn--coral" href={user ? '/portal' : '/login'}>
                  <Layers size={18} />
                  <span>Acessar Portal do Cliente</span>
                  <ArrowRight size={16} />
                </a>

                <a
                  className="clean-btn clean-btn--large clean-btn--outline"
                  href="http://chat.helpclintec.com.br/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageSquare size={17} color="#25d366" />
                  <span>Testar Helpchat</span>
                  <ExternalLink size={14} />
                </a>
              </div>

              <div className="clean-trust-badges">
                <span>✓ WhatsApp Multi-Atendentes</span>
                <span>✓ Ordens de Serviço & Laudos A4</span>
                <span>✓ Painel com SLA Dinâmico</span>
                <span>✓ Portal Único de Revenda</span>
              </div>
            </div>

            {/* Mockup Interativo com abas Helpchat / HelpClin */}
            <div className="clean-hero__visual">
              <div className="clean-card-mockup">
                <div className="mockup-top">
                  <div className="mockup-dots">
                    <span className="dot red" />
                    <span className="dot yellow" />
                    <span className="dot green" />
                  </div>

                  <div className="mockup-tabs">
                    <button
                      type="button"
                      className={`mockup-tab-btn ${mockupTab === 'chat' ? 'mockup-tab-btn--active' : ''}`}
                      onClick={() => setMockupTab('chat')}
                    >
                      <MessageSquare size={13} color="#25d366" />
                      <span>Helpchat</span>
                    </button>
                    <button
                      type="button"
                      className={`mockup-tab-btn ${mockupTab === 'os' ? 'mockup-tab-btn--active' : ''}`}
                      onClick={() => setMockupTab('os')}
                    >
                      <Wrench size={13} color="var(--clean-coral-500)" />
                      <span>HelpClin OS</span>
                    </button>
                  </div>
                </div>

                {mockupTab === 'chat' ? (
                  <div className="mockup-list">
                    <div className="mockup-item">
                      <div className="mockup-icon whatsapp">
                        <MessageSquare size={18} />
                      </div>
                      <div className="mockup-info">
                        <strong>Clínica Santa Maria • Recepção</strong>
                        <span>"Agendamento confirmado para às 14:30 com Dr. Carlos"</span>
                      </div>
                      <span className="tag-whatsapp">Respondido</span>
                    </div>

                    <div className="mockup-item">
                      <div className="mockup-icon whatsapp">
                        <MessageSquare size={18} />
                      </div>
                      <div className="mockup-info">
                        <strong>Hospital Metropolitano • UTI</strong>
                        <span>"Técnico a caminho para conferência de monitor multiparâmetro"</span>
                      </div>
                      <span className="tag-crit">Em Fila</span>
                    </div>

                    <div className="mockup-item">
                      <div className="mockup-icon whatsapp">
                        <MessageSquare size={18} />
                      </div>
                      <div className="mockup-info">
                        <strong>Laboratório Biovida • Faturamento</strong>
                        <span>"Envio automático de relatório mensal concluído com sucesso."</span>
                      </div>
                      <span className="tag-ok">Concluído</span>
                    </div>
                  </div>
                ) : (
                  <div className="mockup-list">
                    <div className="mockup-item">
                      <div className="mockup-icon ti">
                        <Server size={18} />
                      </div>
                      <div className="mockup-info">
                        <strong>Servidor PEP / Prontuário Eletrônico</strong>
                        <span>Setor: Centro Cirúrgico • SLA: 15 min</span>
                      </div>
                      <span className="tag-crit">Crítico</span>
                    </div>

                    <div className="mockup-item">
                      <div className="mockup-icon clinical">
                        <Stethoscope size={18} />
                      </div>
                      <div className="mockup-info">
                        <strong>Desfibrilador Bifásico Mindray</strong>
                        <span>O.S. Preventiva e Calibração RBC em dia</span>
                      </div>
                      <span className="tag-ok">Em Dia</span>
                    </div>

                    <div className="mockup-item">
                      <div className="mockup-icon predial">
                        <Activity size={18} />
                      </div>
                      <div className="mockup-info">
                        <strong>Central de Oxigênio & Gases Medicinais</strong>
                        <span>Monitoramento e laudo emitido em PDF A4</span>
                      </div>
                      <span className="tag-neutro">Normal</span>
                    </div>
                  </div>
                )}

                <div className="mockup-footer">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileCheck2 size={15} color="var(--clean-coral-500)" />
                    {mockupTab === 'chat'
                      ? 'Helpchat: chat.helpclintec.com.br integrado'
                      : 'HelpClin OS: Laudos digitais e auditoria em tempo real'}
                  </span>
                  <span style={{ color: '#25d366', fontWeight: 700 }}>● Sistema Operacional</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 3 Pilares Principais (Cards Claros e Elegantes) ── */}
        <section className="clean-pillars" id="solucoes">
          <div className="clean-section-head">
            <span className="clean-tag">Sistemas Integrados</span>
            <h2>Tecnologia focada em produtividade e receita</h2>
            <p>
              Escolha os módulos ideais para o seu modelo de negócio ou revenda para seus próprios clientes.
            </p>
          </div>

          <div className="clean-pillars__grid">
            {/* Pilar 1: Helpchat */}
            <div className="pillar-card pillar-card--featured">
              <span className="pillar-card__badge">Destaque de Vendas</span>
              <div className="pillar-card__icon whatsapp">
                <MessageSquare size={26} strokeWidth={2.2} />
              </div>
              <h3>Helpchat Omnichannel</h3>
              <p>
                Transforme o WhatsApp da sua empresa em uma central com múltiplos atendentes no mesmo número,
                chatbots inteligentes de autoatendimento e métricas de desempenho.
              </p>

              <ul className="pillar-card__list">
                <li>
                  <CheckCircle2 size={16} />
                  <span>Múltiplos atendentes em 1 só WhatsApp</span>
                </li>
                <li>
                  <CheckCircle2 size={16} />
                  <span>Chatbot de triagem e autoatendimento 24/7</span>
                </li>
                <li>
                  <CheckCircle2 size={16} />
                  <span>Departamentos (Vendas, Suporte, Financeiro)</span>
                </li>
                <li>
                  <CheckCircle2 size={16} />
                  <span>Acesso direto via web e PWA para celular</span>
                </li>
              </ul>

              <a
                href="http://chat.helpclintec.com.br/"
                target="_blank"
                rel="noopener noreferrer"
                className="clean-btn clean-btn--full clean-btn--whatsapp"
              >
                <span>Conhecer o Helpchat</span>
                <ExternalLink size={15} />
              </a>
            </div>

            {/* Pilar 2: HelpClin OS */}
            <div className="pillar-card">
              <div className="pillar-card__icon helpclin">
                <Wrench size={26} strokeWidth={2.2} />
              </div>
              <h3>HelpClin OS & Service Desk</h3>
              <p>
                Gestão completa de chamados técnicos, ordens de serviço com laudo oficial em folha A4 vertical,
                controle de manutenções preventivas e inventário técnico.
              </p>

              <ul className="pillar-card__list">
                <li>
                  <CheckCircle2 size={16} />
                  <span>Abertura rápida de chamados com SLA dinâmico</span>
                </li>
                <li>
                  <CheckCircle2 size={16} />
                  <span>Laudo técnico em folha A4 para impressão e PDF</span>
                </li>
                <li>
                  <CheckCircle2 size={16} />
                  <span>Inventário com histórico e peças aplicadas</span>
                </li>
                <li>
                  <CheckCircle2 size={16} />
                  <span>Módulos de T.I., Engenharia Clínica e Predial</span>
                </li>
              </ul>

              <a href="/login" className="clean-btn clean-btn--full clean-btn--primary">
                <span>Acessar Painel de O.S.</span>
                <ArrowRight size={15} />
              </a>
            </div>

            {/* Pilar 3: Portal do Cliente */}
            <div className="pillar-card">
              <div className="pillar-card__icon portal">
                <Layers size={26} strokeWidth={2.2} />
              </div>
              <h3>Portal Unificado & Revenda</h3>
              <p>
                Um hub exclusivo onde você cadastra clientes, define quais sistemas cada um pode acessar e
                permite que seus clientes usem suas ferramentas com uma experiência corporativa.
              </p>

              <ul className="pillar-card__list">
                <li>
                  <CheckCircle2 size={16} />
                  <span>Painel unificado com login único para clientes</span>
                </li>
                <li>
                  <CheckCircle2 size={16} />
                  <span>Cadastre empresas e libere acessos sob demanda</span>
                </li>
                <li>
                  <CheckCircle2 size={16} />
                  <span>Envio de dados de acesso pelo WhatsApp com 1 clique</span>
                </li>
                <li>
                  <CheckCircle2 size={16} />
                  <span>Ideal para revenda e prestadores de serviço</span>
                </li>
              </ul>

              <a href={user ? '/portal' : '/login'} className="clean-btn clean-btn--full clean-btn--subtle">
                <span>Entrar no Portal</span>
                <ArrowRight size={15} />
              </a>
            </div>
          </div>
        </section>

        {/* ── Simulador / Demonstração do Fluxo ── */}
        <section className="clean-simulator" id="fluxo">
          <div className="clean-section-head">
            <span className="clean-tag">Integração Prática</span>
            <h2>Como os sistemas trabalham juntos</h2>
            <p>
              Veja o fluxo operacional desde o primeiro contato do cliente até o laudo final entregue.
            </p>
          </div>

          <div className="clean-simulator__container">
            <div className="simulator-nav">
              {simulatorFlow.map((step, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`simulator-nav-btn ${simulatorStep === idx ? 'simulator-nav-btn--active' : ''}`}
                  onClick={() => setSimulatorStep(idx)}
                >
                  <span>Passo {idx + 1}</span>
                </button>
              ))}
            </div>

            <div className="simulator-content-box">
              <span className="clean-tag">{simulatorFlow[simulatorStep].badge}</span>
              <h3 style={{ margin: '6px 0 12px', fontSize: '22px', fontWeight: 800 }}>
                {simulatorFlow[simulatorStep].title}
              </h3>
              <p style={{ fontSize: '15px', color: 'var(--clean-muted)', margin: '0 0 16px', lineHeight: 1.6 }}>
                {simulatorFlow[simulatorStep].desc}
              </p>

              <div
                style={{
                  background: '#f1f8f5',
                  padding: '14px 18px',
                  borderRadius: '10px',
                  border: '1px solid #d4e7de',
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  color: 'var(--clean-teal-800)',
                  marginBottom: '14px'
                }}
              >
                {simulatorFlow[simulatorStep].actionPreview}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700, color: 'var(--clean-mint-500)' }}>
                <span>✓ {simulatorFlow[simulatorStep].metric}</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {simulatorStep > 0 && (
                    <button
                      type="button"
                      className="clean-btn clean-btn--subtle"
                      onClick={() => setSimulatorStep(simulatorStep - 1)}
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                    >
                      Anterior
                    </button>
                  )}
                  {simulatorStep < simulatorFlow.length - 1 && (
                    <button
                      type="button"
                      className="clean-btn clean-btn--primary"
                      onClick={() => setSimulatorStep(simulatorStep + 1)}
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                    >
                      Próximo Passo
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Tabela de Planos & Modelo de Revenda ── */}
        <section className="clean-plans" id="planos">
          <div className="clean-section-head">
            <span className="clean-tag">Planos Transparentes</span>
            <h2>Contrate para sua empresa ou revenda</h2>
            <p>
              Estruturas flexíveis de mensalidade para clínicas, hospitais ou revendedores autorizados.
            </p>
          </div>

          <div className="clean-plans__grid">
            {/* Plano 1: Helpchat */}
            <div className="plan-card">
              <h3 className="plan-card__title">Helpchat WhatsApp</h3>
              <p className="plan-card__desc">Ideal para clínicas e empresas que precisam organizar o atendimento.</p>
              <div className="plan-card__price">
                <span className="currency">R$</span>
                <span className="amount">149</span>
                <span className="period">/mês</span>
              </div>

              <ul className="plan-card__features">
                <li><CheckCircle2 size={16} /><span>1 Conexão WhatsApp Oficial</span></li>
                <li><CheckCircle2 size={16} /><span>Até 3 atendentes inclusos</span></li>
                <li><CheckCircle2 size={16} /><span>Chatbot de autoatendimento 24h</span></li>
                <li><CheckCircle2 size={16} /><span>Filas de atendimento ilimitadas</span></li>
                <li><CheckCircle2 size={16} /><span>Suporte técnico via WhatsApp</span></li>
              </ul>

              <button
                onClick={() => handleDirectWhatsApp('Plano Helpchat (R$ 149/mês)')}
                className="clean-btn clean-btn--full clean-btn--whatsapp"
              >
                <span>Contratar Helpchat</span>
                <ArrowRight size={15} />
              </button>
            </div>

            {/* Plano 2: Combo Suite (Destaque) */}
            <div className="plan-card plan-card--highlight">
              <span className="plan-card__badge">Mais Recomendado</span>
              <h3 className="plan-card__title">Combo Suite Completa</h3>
              <p className="plan-card__desc">Helpchat + HelpClin OS integrados no mesmo Portal do Cliente.</p>
              <div className="plan-card__price">
                <span className="currency">R$</span>
                <span className="amount">299</span>
                <span className="period">/mês</span>
              </div>

              <ul className="plan-card__features">
                <li><CheckCircle2 size={16} /><span><strong>Tudo do Helpchat</strong> (WhatsApp multi-atendente)</span></li>
                <li><CheckCircle2 size={16} /><span><strong>Tudo do HelpClin OS</strong> (Ordens de Serviço & Laudos A4)</span></li>
                <li><CheckCircle2 size={16} /><span><strong>Portal Unificado</strong> de Acesso e Licenciamento</span></li>
                <li><CheckCircle2 size={16} /><span>Até 5 atendentes + técnicos ilimitados</span></li>
                <li><CheckCircle2 size={16} /><span>Suporte VIP e Implantação guiada</span></li>
              </ul>

              <button
                onClick={() => handleDirectWhatsApp('Combo Suite Completa (R$ 299/mês)')}
                className="clean-btn clean-btn--full clean-btn--coral"
              >
                <span>Contratar Suite Completa</span>
                <ArrowRight size={15} />
              </button>
            </div>

            {/* Plano 3: HelpClin OS */}
            <div className="plan-card">
              <h3 className="plan-card__title">HelpClin OS Service Desk</h3>
              <p className="plan-card__desc">Foco total em ordens de serviço, manutenção e conformidade técnica.</p>
              <div className="plan-card__price">
                <span className="currency">R$</span>
                <span className="amount">199</span>
                <span className="period">/mês</span>
              </div>

              <ul className="plan-card__features">
                <li><CheckCircle2 size={16} /><span>Chamados e Ordens de Serviço ilimitadas</span></li>
                <li><CheckCircle2 size={16} /><span>Geração e impressão de Laudos A4 em PDF</span></li>
                <li><CheckCircle2 size={16} /><span>Controle de SLA dinâmico por criticidade</span></li>
                <li><CheckCircle2 size={16} /><span>Inventário e histórico patrimonial</span></li>
                <li><CheckCircle2 size={16} /><span>Módulos de T.I., Clínica e Predial</span></li>
              </ul>

              <button
                onClick={() => handleDirectWhatsApp('Plano HelpClin OS (R$ 199/mês)')}
                className="clean-btn clean-btn--full clean-btn--primary"
              >
                <span>Contratar HelpClin OS</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </section>

        {/* ── Formulário de Contato Rápido ── */}
        <section className="clean-contact" id="contato">
          <div className="clean-contact__container">
            <div className="contact-info">
              <span className="clean-tag">Fale Conosco</span>
              <h3>Pronto para modernizar sua empresa ou revender?</h3>
              <p>
                Tire suas dúvidas técnicas, solicite uma demonstração personalizada ou converse sobre a revenda de licenças na sua região.
              </p>

              <div className="contact-channels">
                <div className="contact-channel-item">
                  <Smartphone size={18} />
                  <span>WhatsApp Comercial: (11) 99999-9999</span>
                </div>
                <div className="contact-channel-item">
                  <Mail size={18} />
                  <span>contato@helpclintec.com.br</span>
                </div>
                <div className="contact-channel-item">
                  <ExternalLink size={18} />
                  <span>chat.helpclintec.com.br</span>
                </div>
              </div>
            </div>

            <form className="contact-form" onSubmit={handleQuickContact}>
              <div className="contact-field">
                <label>Seu Nome Completo</label>
                <input
                  type="text"
                  placeholder="Ex: Rodrigo Santos"
                  value={contactForm.nome}
                  onChange={(e) => setContactForm({ ...contactForm, nome: e.target.value })}
                  required
                />
              </div>

              <div className="contact-field">
                <label>Nome da sua Empresa ou Clínica</label>
                <input
                  type="text"
                  placeholder="Ex: Clínica Saúde Total"
                  value={contactForm.empresa}
                  onChange={(e) => setContactForm({ ...contactForm, empresa: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="contact-field">
                  <label>WhatsApp</label>
                  <input
                    type="tel"
                    placeholder="(00) 00000-0000"
                    value={contactForm.telefone}
                    onChange={(e) => setContactForm({ ...contactForm, telefone: e.target.value })}
                    required
                  />
                </div>

                <div className="contact-field">
                  <label>Sistema de Interesse</label>
                  <select
                    value={contactForm.sistema}
                    onChange={(e) => setContactForm({ ...contactForm, sistema: e.target.value })}
                  >
                    <option value="combo">Combo Suite (Helpchat + OS)</option>
                    <option value="helpchat">Helpchat (WhatsApp)</option>
                    <option value="helpclin">HelpClin OS (Ordens & Laudos)</option>
                    <option value="revenda">Quero Revender na Minha Região</option>
                  </select>
                </div>
              </div>

              <div className="contact-field">
                <label>Mensagem ou Dúvida (Opcional)</label>
                <textarea
                  rows={3}
                  placeholder="Conte um pouco sobre sua necessidade ou volume de atendimentos..."
                  value={contactForm.mensagem}
                  onChange={(e) => setContactForm({ ...contactForm, mensagem: e.target.value })}
                />
              </div>

              <button type="submit" className="clean-btn clean-btn--large clean-btn--coral">
                <Send size={16} />
                <span>Enviar e Abrir no WhatsApp</span>
              </button>
            </form>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="clean-footer">
        <div className="clean-footer__container">
          <div className="clean-brand">
            <span className="clean-brand__icon">
              <Activity size={22} strokeWidth={2.5} />
            </span>
            <div className="clean-brand__text">
              <span className="clean-brand__name" style={{ color: '#fff' }}>help<span>clin</span>tec</span>
              <span className="clean-brand__sub">Tecnologia & SaaS</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            <a href="#solucoes" style={{ color: '#a3c2bd', textDecoration: 'none', fontSize: '13px' }}>Sistemas</a>
            <a href="http://chat.helpclintec.com.br/" target="_blank" rel="noopener noreferrer" style={{ color: '#a3c2bd', textDecoration: 'none', fontSize: '13px' }}>Helpchat Online</a>
            <a href="/portal" style={{ color: '#a3c2bd', textDecoration: 'none', fontSize: '13px' }}>Portal do Cliente</a>
            <a href="/login" style={{ color: '#a3c2bd', textDecoration: 'none', fontSize: '13px' }}>Acesso Administrativo</a>
          </div>
        </div>

        <div className="clean-footer__bottom">
          <span>© {new Date().getFullYear()} HelpClinTec & Helpchat. Todos os direitos reservados.</span>
          <span>Desenvolvido para alta performance operacional e escala SaaS.</span>
        </div>
      </footer>
    </div>
  );
}

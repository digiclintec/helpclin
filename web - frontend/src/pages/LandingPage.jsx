import React, { useEffect, useState } from 'react';
import {
  Activity,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileCheck2,
  Headset,
  Menu,
  MessageSquare,
  Monitor,
  Send,
  Server,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Wrench,
  X,
  Zap
} from 'lucide-react';
import './LandingPage.css';
import { getStoredUser } from '../services/api.js';

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [category, setCategory] = useState('ti'); // 'ti' | 'clinical' | 'predial'
  const [selectedProblem, setSelectedProblem] = useState(0);
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactForm, setContactForm] = useState({
    nome: '',
    telefone: '',
    instituicao: ''
  });

  const user = getStoredUser();

  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 20);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Simulação enxuta de chamados por vertente
  const problemsData = {
    ti: [
      {
        title: 'Instabilidade no Prontuário Eletrônico (PEP/PACS)',
        desc: 'Médicos e enfermagem com lentidão para prescrever e checar pacientes.',
        priority: 'Crítica',
        sla: '15 min',
        destino: 'Equipe de Sistemas & Banco de Dados',
        acao: 'Abertura de O.S. Emergencial • Verificação de conexão com servidor e failover.'
      },
      {
        title: 'Falha na Impressão de Pulseiras / Triagem',
        desc: 'Impressora térmica Zebra de identificação de pacientes travada na recepção.',
        priority: 'Alta',
        sla: '30 min',
        destino: 'Suporte Técnico N1 / Hardware',
        acao: 'Troca de fita/rolo térmico e reconfiguração do spooler de rede médica.'
      },
      {
        title: 'Queda de Link de Internet & Wi-Fi Assistencial',
        desc: 'Carrinhos móveis de medicação desconectando durante administração.',
        priority: 'Alta',
        sla: '20 min',
        destino: 'Redes & Conectividade Crítica',
        acao: 'Diagnóstico de access point do setor e direcionamento para rota de contingência.'
      }
    ],
    clinical: [
      {
        title: 'Monitor Multiparâmetro com Alarme Falso de ECG',
        desc: 'Monitor de sinais vitais acusando erro no leito de UTI Adulto.',
        priority: 'Crítica',
        sla: '15 min',
        destino: 'Engenharia Clínica • Plantão Biomédico',
        acao: 'Substituição imediata de transdutores e validação com simulador de paciente.'
      },
      {
        title: 'Bomba de Infusão com Erro de Oclusão',
        desc: 'Bomba de seringa com bloqueio no centro cirúrgico.',
        priority: 'Crítica',
        sla: '20 min',
        destino: 'Técnico de Manutenção Biomédica',
        acao: 'Retirada para bancada técnica e substituição imediata por backup calibrado.'
      },
      {
        title: 'Calibração Periódica e Ensaio de Segurança (RBC)',
        desc: 'Desfibrilador bifásico necessita ensaio de energia e conformidade ANVISA.',
        priority: 'Média',
        sla: '240 min',
        destino: 'Engenheiro Clínico Responsável',
        acao: 'Emissão de O.S. Preventiva, ensaio metrológico e emissão de certificado RBC.'
      }
    ],
    predial: [
      {
        title: 'Grupo Gerador em Falha de Partida / Queda de Rede',
        desc: 'Comutação de emergência após oscilação da concessionária elétrica.',
        priority: 'Crítica',
        sla: '10 min',
        destino: 'Engenharia Predial • Plantão Elétrico',
        acao: 'Acionamento manual do quadro QTA, partida forçada e teste de baterias.'
      },
      {
        title: 'Alarme de Baixa Pressão na Central de Oxigênio (O2)',
        desc: 'Queda de pressão na linha de gases medicinais dos leitos críticos.',
        priority: 'Crítica',
        sla: '10 min',
        destino: 'Central de Gases Medicinais & Utilidades',
        acao: 'Manobra para banco de cilindros reserva e inspeção de válvulas reguladoras.'
      },
      {
        title: 'Climatização do Centro Cirúrgico Fora do PMOC',
        desc: 'Pressão diferencial e temperatura fora do padrão exigido pela ANVISA.',
        priority: 'Alta',
        sla: '30 min',
        destino: 'Climatização Hospitalar (HVAC/PMOC)',
        acao: 'Troca de filtros absolutos, aferição de vazão e recalibração de termostato.'
      }
    ]
  };

  const currentProblems = problemsData[category] || problemsData.ti;
  const activeProblem = currentProblems[selectedProblem] || currentProblems[0];

  function handleQuickContact(e) {
    e.preventDefault();
    setContactSubmitted(true);
  }

  function handleWhatsAppRedirect() {
    const text = encodeURIComponent(
      `Olá! Tenho interesse no sistema HelpClinTec para gestão de chamados na minha instituição (${contactForm.instituicao || 'minha clínica/hospital'}). Gostaria de ver uma demonstração.`
    );
    window.open(`https://api.whatsapp.com/send?phone=5511999999999&text=${text}`, '_blank');
  }

  return (
    <div className="landing-page-clean">
      {/* ── Header Enxuto ── */}
      <header className={`clean-header ${isScrolled ? 'clean-header--scrolled' : ''}`}>
        <div className="clean-header__container">
          <a className="clean-brand" href="#top" aria-label="HelpClinTec">
            <span className="clean-brand__icon">
              <Activity size={20} strokeWidth={2.5} />
            </span>
            <div className="clean-brand__text">
              <span className="clean-brand__name">help<span>clin</span>tec</span>
              <span className="clean-brand__sub">Tecnologia em Saúde</span>
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
            <a href="#servicos" onClick={() => setIsMenuOpen(false)}>Serviços</a>
            <a href="#simulador" onClick={() => setIsMenuOpen(false)}>Simulador</a>
            <a href="#conformidade" onClick={() => setIsMenuOpen(false)}>Conformidade</a>
            <a href="#contato" onClick={() => setIsMenuOpen(false)}>Contato</a>

            <div className="clean-nav__actions">
              <a
                className="clean-btn clean-btn--subtle"
                href={user ? '/dashboard' : '/login'}
                onClick={() => setIsMenuOpen(false)}
              >
                <Headset size={16} />
                <span>{user ? 'Acessar Painel' : 'Área do Cliente'}</span>
              </a>

              <button
                className="clean-btn clean-btn--primary"
                onClick={() => {
                  setIsMenuOpen(false);
                  handleWhatsAppRedirect();
                }}
              >
                <span>Falar no WhatsApp</span>
                <ArrowRight size={14} />
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
                <span>Service Desk Hospitalar & Biomédico</span>
              </div>

              <h1 className="clean-hero__title">
                Chamados e Ordens de Serviço para{' '}
                <span className="text-coral">T.I., Clínica e Predial</span>
              </h1>

              <p className="clean-hero__desc">
                Centralize falhas em prontuários eletrônicos, manutenção de equipamentos biomédicos
                e infraestrutura crítica em uma única plataforma ágil, inteligente e sem burocracia.
              </p>

              <div className="clean-hero__actions">
                <a className="clean-btn clean-btn--large clean-btn--coral" href={user ? '/dashboard' : '/login'}>
                  <Headset size={18} />
                  <span>Acessar Painel do Sistema</span>
                  <ArrowRight size={16} />
                </a>

                <a className="clean-btn clean-btn--large clean-btn--outline" href="#simulador">
                  <Wrench size={17} />
                  <span>Testar Simulador</span>
                </a>
              </div>

              <div className="clean-trust-badges">
                <span title="Agência Nacional de Vigilância Sanitária">✓ RDC ANVISA nº 509</span>
                <span>✓ Padrão ONA</span>
                <span>✓ Calibrações RBC</span>
                <span>✓ LGPD Saúde</span>
              </div>
            </div>

            {/* Mockup Limpo da Tela de Chamados */}
            <div className="clean-hero__visual">
              <div className="clean-card-mockup">
                <div className="mockup-top">
                  <div className="mockup-dots">
                    <span className="dot red" />
                    <span className="dot yellow" />
                    <span className="dot green" />
                  </div>
                  <span className="mockup-status">
                    <span className="live-pulse" /> Painel de Chamados • Tempo Real
                  </span>
                </div>

                <div className="mockup-list">
                  <div className="mockup-item critical">
                    <div className="mockup-icon ti">
                      <Server size={16} />
                    </div>
                    <div className="mockup-info">
                      <strong>Prontuário Eletrônico PEP / Servidor</strong>
                      <span>Setor: Centro Cirúrgico • SLA: 15 min</span>
                    </div>
                    <span className="tag-crit">Crítico</span>
                  </div>

                  <div className="mockup-item active">
                    <div className="mockup-icon clinical">
                      <Stethoscope size={16} />
                    </div>
                    <div className="mockup-info">
                      <strong>Desfibrilador Bifásico Mindray</strong>
                      <span>Calibração Periódica em Dia • O.S. Preventiva</span>
                    </div>
                    <span className="tag-ok">Em Dia</span>
                  </div>

                  <div className="mockup-item">
                    <div className="mockup-icon predial">
                      <Building2 size={16} />
                    </div>
                    <div className="mockup-info">
                      <strong>Central de Oxigênio & Gases Medicinais</strong>
                      <span>Pressão Monitorada • Válvulas Inspecionadas</span>
                    </div>
                    <span className="tag-neutro">Normal</span>
                  </div>
                </div>

                <div className="mockup-footer">
                  <FileCheck2 size={15} />
                  <span>Laudo digital e assinatura de entrega em cada O.S.</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 3 Pilares Principais (Cards Claros e Elegantes) ── */}
        <section className="clean-pillars" id="servicos">
          <div className="clean-section-head">
            <span className="clean-tag">ESPECIALIDADES ATENDIDAS</span>
            <h2>Três vertentes essenciais em uma só ferramenta</h2>
            <p>Atendimento integrado com fluxo direcionado para os profissionais certos em segundos.</p>
          </div>

          <div className="clean-pillars__grid">
            {/* Card 1: T.I. */}
            <div className="pillar-card">
              <div className="pillar-card__icon ti">
                <Server size={24} />
              </div>
              <h3>T.I. em Saúde</h3>
              <p>Suporte especializado em prontuários eletrônicos, redes assistenciais e conectividade hospitalar.</p>
              <ul className="pillar-bullets">
                <li><CheckCircle2 size={15} /> Suporte a PEP, Tasy, MV, Clinux e PACS</li>
                <li><CheckCircle2 size={15} /> Wi-Fi assistencial e redes hospitalares</li>
                <li><CheckCircle2 size={15} /> Impressoras térmicas de pulseiras de pacientes</li>
                <li><CheckCircle2 size={15} /> Gestão de acessos e segurança LGPD</li>
              </ul>
            </div>

            {/* Card 2: Engenharia Clínica */}
            <div className="pillar-card pillar-card--featured">
              <div className="pillar-badge">Mais Utilizado</div>
              <div className="pillar-card__icon clinical">
                <Stethoscope size={24} />
              </div>
              <h3>Engenharia Clínica</h3>
              <p>Ciclo completo de manutenção e gestão de ativos biomédicos de suporte à vida.</p>
              <ul className="pillar-bullets">
                <li><CheckCircle2 size={15} /> Manutenção corretiva de emergência</li>
                <li><CheckCircle2 size={15} /> Cronograma de manutenções preventivas</li>
                <li><CheckCircle2 size={15} /> Calibrações com certificados rastreáveis (RBC)</li>
                <li><CheckCircle2 size={15} /> Inventário patrimonial e histórico técnico</li>
              </ul>
            </div>

            {/* Card 3: Predial */}
            <div className="pillar-card">
              <div className="pillar-card__icon predial">
                <Building2 size={24} />
              </div>
              <h3>Engenharia Predial</h3>
              <p>Controle rigoroso das utilidades críticas para evitar qualquer parada nas áreas assistenciais.</p>
              <ul className="pillar-bullets">
                <li><CheckCircle2 size={15} /> Geradores e quadros elétricos de emergência</li>
                <li><CheckCircle2 size={15} /> Centrais de gases medicinais e vácuo clínico</li>
                <li><CheckCircle2 size={15} /> Climatização com controle de pressão (PMOC)</li>
                <li><CheckCircle2 size={15} /> Hidrantes, reservatórios e segurança predial</li>
              </ul>
            </div>
          </div>
        </section>

        {/* ── Simulador Interativo Simples e Intuitivo ── */}
        <section className="clean-simulator" id="simulador">
          <div className="clean-simulator__container">
            <div className="clean-section-head clean-section-head--white">
              <span className="clean-tag clean-tag--white">EXPERIMENTE NA PRÁTICA</span>
              <h2>Simulador de Abertura de Chamado</h2>
              <p>Veja como o sistema calcula o SLA e direciona a ocorrência automaticamente.</p>
            </div>

            <div className="sim-box">
              {/* Controles de Categoria */}
              <div className="sim-tabs">
                <button
                  className={`sim-tab ${category === 'ti' ? 'active' : ''}`}
                  onClick={() => {
                    setCategory('ti');
                    setSelectedProblem(0);
                  }}
                >
                  <Server size={16} />
                  <span>T.I. em Saúde</span>
                </button>

                <button
                  className={`sim-tab ${category === 'clinical' ? 'active' : ''}`}
                  onClick={() => {
                    setCategory('clinical');
                    setSelectedProblem(0);
                  }}
                >
                  <Stethoscope size={16} />
                  <span>Engenharia Clínica</span>
                </button>

                <button
                  className={`sim-tab ${category === 'predial' ? 'active' : ''}`}
                  onClick={() => {
                    setCategory('predial');
                    setSelectedProblem(0);
                  }}
                >
                  <Building2 size={16} />
                  <span>Engenharia Predial</span>
                </button>
              </div>

              {/* Seletor de Ocorrência */}
              <div className="sim-problem-list">
                {currentProblems.map((prob, idx) => (
                  <button
                    key={idx}
                    className={`sim-problem-btn ${selectedProblem === idx ? 'active' : ''}`}
                    onClick={() => setSelectedProblem(idx)}
                  >
                    <span className="sim-radio" />
                    <span>{prob.title}</span>
                  </button>
                ))}
              </div>

              {/* Resultado Gerado */}
              <div className="sim-result-card">
                <div className="sim-result-header">
                  <div>
                    <span className="sim-ticket-code">
                      {category === 'ti' ? '#TI-2026-9041' : category === 'clinical' ? '#EC-2026-3812' : '#EP-2026-1940'}
                    </span>
                    <h4>{activeProblem.title}</h4>
                  </div>
                  <span className={`sim-prio ${activeProblem.priority === 'Crítica' ? 'crit' : 'high'}`}>
                    Prioridade: {activeProblem.priority}
                  </span>
                </div>

                <p className="sim-desc">{activeProblem.desc}</p>

                <div className="sim-meta-grid">
                  <div className="meta-box">
                    <span>Tempo Máximo (SLA):</span>
                    <strong><Clock size={14} /> {activeProblem.sla}</strong>
                  </div>

                  <div className="meta-box">
                    <span>Especialidade Destino:</span>
                    <strong>{activeProblem.destino}</strong>
                  </div>
                </div>

                <div className="sim-action">
                  <strong><Wrench size={14} /> Procedimento Técnico HelpClin:</strong>
                  <p>{activeProblem.acao}</p>
                </div>

                <div className="sim-btn-wrap">
                  <a className="clean-btn clean-btn--coral clean-btn--full" href={user ? '/chamados' : '/login'}>
                    <span>Abrir Chamado Real no Sistema</span>
                    <ArrowRight size={15} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Indicadores & Resultados Rápidos ── */}
        <section className="clean-stats" id="conformidade">
          <div className="clean-stats__container">
            <div className="stat-item">
              <strong>+99.8%</strong>
              <span>Disponibilidade do Parque Hospitalar</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <strong>-65%</strong>
              <span>No Tempo Médio de Resolução (MTTR)</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <strong>100%</strong>
              <span>Rastreabilidade em Conformidade ANVISA & ONA</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <strong>Zero</strong>
              <span>Perda de Dados Assistenciais (LGPD)</span>
            </div>
          </div>
        </section>

        {/* ── Contato / Demonstração Rápida ── */}
        <section className="clean-contact" id="contato">
          <div className="clean-contact__container">
            <div className="clean-contact__info">
              <span className="clean-tag">IMPLANTAÇÃO ÁGIL</span>
              <h2>Quer implantar o HelpClinTec na sua instituição?</h2>
              <p>
                Fale com nossos consultores especializados em tecnologia hospitalar.
                Apresentamos o sistema e estruturamos uma demonstração adaptada à sua rotina.
              </p>

              <div className="contact-benefits">
                <div className="b-item">✓ Treinamento completo para equipe e solicitantes</div>
                <div className="b-item">✓ Importação assistida do seu parque de equipamentos</div>
                <div className="b-item">✓ Suporte especializado que compreende termos médicos</div>
              </div>
            </div>

            <div className="clean-contact__box">
              {contactSubmitted ? (
                <div className="contact-success">
                  <CheckCircle2 size={44} color="#35785d" />
                  <h3>Solicitação Enviada!</h3>
                  <p>
                    Obrigado, <strong>{contactForm.nome || 'Doutor(a)'}</strong>. Nossa equipe técnica
                    entrará em contato em breve.
                  </p>
                  <button
                    className="clean-btn clean-btn--coral clean-btn--full"
                    onClick={handleWhatsAppRedirect}
                  >
                    <MessageSquare size={16} />
                    <span>Falar Imediatamente no WhatsApp</span>
                  </button>
                </div>
              ) : (
                <form className="clean-form" onSubmit={handleQuickContact}>
                  <h3>Solicitar Demonstração</h3>
                  <p>Preencha os dados e receba uma apresentação guiada:</p>

                  <div className="field">
                    <label htmlFor="f-nome">Seu Nome *</label>
                    <input
                      id="f-nome"
                      type="text"
                      required
                      placeholder="Ex: Carlos Silva ou Dra. Mariana"
                      value={contactForm.nome}
                      onChange={(e) => setContactForm({ ...contactForm, nome: e.target.value })}
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="f-tel">Telefone / WhatsApp *</label>
                    <input
                      id="f-tel"
                      type="tel"
                      required
                      placeholder="(11) 98765-4321"
                      value={contactForm.telefone}
                      onChange={(e) => setContactForm({ ...contactForm, telefone: e.target.value })}
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="f-inst">Nome da Clínica ou Hospital *</label>
                    <input
                      id="f-inst"
                      type="text"
                      required
                      placeholder="Ex: Hospital Samaritano ou Clínica Vida"
                      value={contactForm.instituicao}
                      onChange={(e) => setContactForm({ ...contactForm, instituicao: e.target.value })}
                    />
                  </div>

                  <button type="submit" className="clean-btn clean-btn--coral clean-btn--full clean-btn--large">
                    <Send size={16} />
                    <span>Solicitar Apresentação Técnica</span>
                  </button>

                  <div className="form-or">ou</div>

                  <button
                    type="button"
                    className="clean-btn clean-btn--outline clean-btn--full"
                    onClick={handleWhatsAppRedirect}
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

      {/* ── Footer Minimalista ── */}
      <footer className="clean-footer">
        <div className="clean-footer__container">
          <div className="footer-brand">
            <span className="brand-dot" />
            <strong>help<span>clin</span>tec</strong>
            <span>• Sistema de Chamados em Saúde</span>
          </div>

          <div className="footer-links">
            <a href={user ? '/dashboard' : '/login'}>Área do Cliente</a>
            <a href="#servicos">Especialidades</a>
            <a href="#simulador">Simulador</a>
            <a href="#contato">Fale Conosco</a>
          </div>

          <p className="footer-copy">
            © 2026 HelpClinTec Soluções em Saúde. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}

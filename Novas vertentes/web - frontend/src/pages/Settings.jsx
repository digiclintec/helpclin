import {
  AlertTriangle,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  DollarSign,
  FileCheck2,
  Layers,
  Lock,
  Mail,
  Monitor,
  RefreshCw,
  Save,
  Server,
  Settings as SettingsIcon,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Users,
  Wrench
} from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  DEFAULT_BILLING_SETTINGS,
  getClientBillingSettings,
  saveClientBillingSettings
} from '../utils/billingUtils.js';
import { getStoredUser } from '../services/api.js';

export default function Settings() {
  const user = getStoredUser();
  const isAdmin = user?.role === 'admin';

  const [settings, setSettings] = useState(getClientBillingSettings);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    const p = new URLSearchParams(window.location.search).get('tab');
    return (p === 'contract' || p === 'billing' || p === 'modules') ? p : 'modules';
  });

  useEffect(() => {
    function handleSettingsSync(event) {
      if (event.detail) {
        setSettings(event.detail);
      }
    }
    window.addEventListener('helpclin_settings_changed', handleSettingsSync);
    return () => window.removeEventListener('helpclin_settings_changed', handleSettingsSync);
  }, []);

  function handleToggleModule(moduleKey, value) {
    const updated = {
      ...settings,
      [moduleKey]: value
    };
    setSettings(updated);
    setHasChanges(true);
    saveClientBillingSettings(updated);
    triggerSuccessNotification();
  }

  function handleToggleBilling(enabled) {
    const updated = {
      ...settings,
      billingEnabled: enabled
    };
    setSettings(updated);
    setHasChanges(true);
    saveClientBillingSettings(updated);
    triggerSuccessNotification();
  }

  function handleUpdateField(key, value) {
    const updated = {
      ...settings,
      [key]: value
    };
    setSettings(updated);
    setHasChanges(true);
  }

  function handleSaveAll() {
    saveClientBillingSettings(settings);
    setHasChanges(false);
    triggerSuccessNotification();
  }

  function triggerSuccessNotification() {
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
    }, 3200);
  }

  function handleResetDefaults() {
    if (window.confirm('Deseja restaurar as configurações padrão da HelpClin para este cliente?')) {
      setSettings(DEFAULT_BILLING_SETTINGS);
      saveClientBillingSettings(DEFAULT_BILLING_SETTINGS);
      setHasChanges(false);
      triggerSuccessNotification();
    }
  }

  const activeModulesCount = [settings.moduleTI, settings.moduleClinical, settings.modulePredial].filter(Boolean).length;

  const getStatusInfo = () => {
    switch (settings.contractStatus) {
      case 'trial':
        return {
          text: 'Período de Testes (Trial)',
          icon: '🟡',
          pillClass: 'settings-status-indicator-pill--trial'
        };
      case 'paused':
        return {
          text: 'Contrato Pausado / Negociação',
          icon: '🔴',
          pillClass: 'settings-status-indicator-pill--paused'
        };
      case 'active':
      default:
        return {
          text: 'Contrato Ativo & Regular',
          icon: '🟢',
          pillClass: 'settings-status-indicator-pill--active'
        };
    }
  };

  const statusInfo = getStatusInfo();

  // ── Se o usuário NÃO for Administrador da HelpClin (Acesso Restrito) ──
  if (!isAdmin) {
    return (
      <div className="settings-page">
        <div className="settings-restricted-wrapper">
          <div className="settings-restricted-icon-box">
            <ShieldAlert size={28} />
          </div>

          <span className="settings-restricted-tag">
            Acesso Restrito à Gestão HelpClin
          </span>

          <h2>Painel de Licenciamento & Módulos</h2>

          <p>
            Apenas os administradores autorizados da <strong>HelpClin</strong> possuem prerrogativa
            para ativar ou desativar verticais contratuais (<strong>T.I., Engenharia Clínica, Engenharia Predial</strong>)
            e parâmetros operacionais desta unidade.
          </p>

          <div className="settings-restricted-scope-box">
            <strong>Módulos Ativos Atualmente no seu Contrato:</strong>
            <ul>
              <li>T.I. em Saúde & Sistemas: <strong>{settings.moduleTI ? 'Liberado' : 'Não Contratado'}</strong></li>
              <li>Engenharia Clínica & Biomédica: <strong>{settings.moduleClinical ? 'Liberado' : 'Não Contratado'}</strong></li>
              <li>Engenharia Predial & Facilities: <strong>{settings.modulePredial ? 'Liberado' : 'Não Contratado'}</strong></li>
              <li>Modelo Operacional: <strong>{settings.billingEnabled ? 'Modo Freelancer (Com Cobrança)' : 'Modo Equipe Própria (Sem Cobrança)'}</strong></li>
            </ul>
          </div>

          <a
            href="/dashboard"
            className="btn btn--primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}
          >
            Voltar para o Dashboard
          </a>
        </div>
      </div>
    );
  }

  // ── Painel Master de Gestão HelpClin (Admin) - Layout Desconstruído ──
  return (
    <div className="settings-page">
      {/* Cabeçalho Executivo Desconstruído */}
      <header className="settings-header">
        <div className="settings-header__title-group">
          <div className="settings-header__badge">
            <span className="pulse-dot" />
            <ShieldCheck size={14} />
            <span>Painel Master de Governança HelpClin</span>
          </div>
          <h1>Administração de Módulos & Licenciamento</h1>
          <p>
            Controle exclusivo da equipe HelpClin para definir quais verticais (T.I., Engenharia Clínica, Engenharia Predial),
            modelo operacional de faturamento e dados cadastrais esta unidade terá liberado no painel.
          </p>
        </div>

        <div className="settings-header__actions">
          <button
            type="button"
            className="btn btn--subtle btn-subtle"
            onClick={handleResetDefaults}
            title="Restaurar valores padrão HelpClin"
          >
            <RefreshCw size={15} />
            <span>Restaurar Padrão</span>
          </button>

          <button
            type="button"
            className={`btn btn--primary ${saveSuccess ? 'btn-primary--success' : ''}`}
            onClick={handleSaveAll}
          >
            {saveSuccess ? <Check size={16} /> : <Save size={16} />}
            <span>{saveSuccess ? 'Alterações Salvas!' : hasChanges ? 'Salvar Contrato' : 'Configurações em Dia'}</span>
          </button>
        </div>
      </header>

      {/* Faixa Desconstruída de Resumo Executivo */}
      <div className="settings-overview-strip">
        <div className="overview-pill">
          <span className="overview-pill-label">
            <Building2 size={13} />
            Unidade Hospitalar
          </span>
          <span className="overview-pill-val" title={settings.organizationName}>
            {settings.organizationName || 'Não Informada'}
          </span>
        </div>

        <div className="overview-pill">
          <span className="overview-pill-label">
            <FileCheck2 size={13} />
            Status da Licença
          </span>
          <span className="overview-pill-val">
            {statusInfo.icon} {statusInfo.text}
          </span>
        </div>

        <div className="overview-pill">
          <span className="overview-pill-label">
            <Layers size={13} />
            Verticais no Contrato
          </span>
          <span className="overview-pill-val">
            <strong style={{ color: activeModulesCount > 0 ? '#059669' : '#dc2626' }}>
              {activeModulesCount} de 3
            </strong>
            <span style={{ fontSize: '12px', fontWeight: 600, opacity: 0.85 }}>Liberadas</span>
          </span>
        </div>

        <div className="overview-pill">
          <span className="overview-pill-label">
            <DollarSign size={13} />
            Modelo Operacional
          </span>
          <span className="overview-pill-val">
            {settings.billingEnabled ? '💼 Modo Freelancer' : '🏥 Equipe Própria'}
          </span>
        </div>
      </div>

      {/* Abas Desconstruídas de Navegação */}
      <div className="settings-tabs-container">
        <button
          type="button"
          className={`settings-tab-btn ${activeTab === 'modules' ? 'settings-tab-btn--active' : ''}`}
          onClick={() => setActiveTab('modules')}
        >
          <Layers size={16} />
          <span>Módulos Contratuais (T.I., Clínica, Predial)</span>
        </button>

        <button
          type="button"
          className={`settings-tab-btn ${activeTab === 'billing' ? 'settings-tab-btn--active' : ''}`}
          onClick={() => setActiveTab('billing')}
        >
          <DollarSign size={16} />
          <span>Modelo Operacional (Freelancer vs Próprio)</span>
        </button>

        <button
          type="button"
          className={`settings-tab-btn ${activeTab === 'contract' ? 'settings-tab-btn--active' : ''}`}
          onClick={() => setActiveTab('contract')}
        >
          <Building2 size={16} />
          <span>Dados da Unidade & Contrato</span>
        </button>
      </div>

      {/* Notificação Flutuante de Sucesso */}
      {saveSuccess && (
        <div className="settings-toast-banner">
          <CheckCircle2 size={19} className="toast-icon" />
          <div className="toast-content">
            Configurações contratuais e dados da unidade sincronizados com sucesso em tempo real!
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          ABA 1: ATIVAÇÃO DOS MÓDULOS CONTRATUAIS (VERTICAIS) - DESCONSTRUÍDO
          ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'modules' && (
        <div className="settings-tab-content">
          <div className="settings-deconstructed-card">
            <div className="settings-card-header">
              <div className="settings-card-title-group">
                <div className="settings-card-icon-wrap">
                  <Layers size={22} />
                </div>
                <div>
                  <h2>Gestão de Escopo & Verticais Contratadas</h2>
                  <p>
                    Se o hospital ou clínica não contratou uma das áreas abaixo, desative-a. A vertical será
                    ocultada dinamicamente nos formulários de chamados, inventário técnico e relatórios do cliente.
                  </p>
                </div>
              </div>
            </div>

            {/* 1. MÓDULO T.I. EM SAÚDE */}
            <div className={`settings-module-card settings-module-card--ti ${settings.moduleTI ? 'settings-module-card--active' : ''}`}>
              <div className="settings-module-card__header">
                <div className="settings-module-card__info">
                  <div className="settings-module-icon settings-module-icon--ti">
                    <Server size={24} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                      <h3>1. Módulo T.I. em Saúde & Infraestrutura Digital</h3>
                      <span className={`module-tag ${settings.moduleTI ? 'module-tag--active-ti' : ''}`}>
                        {settings.moduleTI ? '● LIBERADO NO CONTRATO' : '○ BLOQUEADO PARA O CLIENTE'}
                      </span>
                    </div>
                    <p className="settings-module-desc">
                      Suporte técnico a Prontuários Eletrônicos (PEP, MV, Tasy, Clinux), rede assistencial Wi-Fi cirúrgico,
                      servidores PACS e impressoras térmicas Zebra de identificação de pacientes.
                    </p>
                    <div className="settings-module-tags">
                      <span className="module-tag">✓ Abertura de chamados de T.I.</span>
                      <span className="module-tag">✓ Suporte a PEP & Certificação Digital</span>
                      <span className="module-tag">✓ SLA de Redes & Servidores PACS</span>
                      <span className="module-tag">✓ Gestão de Acessos & LGPD</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className={`settings-module-toggle-btn ${settings.moduleTI ? 'settings-module-toggle-btn--active' : 'settings-module-toggle-btn--inactive'}`}
                  onClick={() => handleToggleModule('moduleTI', !settings.moduleTI)}
                >
                  {settings.moduleTI ? '✓ Módulo Ativo' : 'Ativar Módulo'}
                </button>
              </div>
            </div>

            {/* 2. MÓDULO ENGENHARIA CLÍNICA */}
            <div className={`settings-module-card settings-module-card--clinical ${settings.moduleClinical ? 'settings-module-card--active' : ''}`}>
              <div className="settings-module-card__header">
                <div className="settings-module-card__info">
                  <div className="settings-module-icon settings-module-icon--clinical">
                    <Stethoscope size={24} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                      <h3>2. Módulo Engenharia Clínica & Parque Biomédico</h3>
                      <span className={`module-tag ${settings.moduleClinical ? 'module-tag--active-clinical' : ''}`}>
                        {settings.moduleClinical ? '● LIBERADO NO CONTRATO' : '○ BLOQUEADO PARA O CLIENTE'}
                      </span>
                    </div>
                    <p className="settings-module-desc">
                      Manutenção preventiva e corretiva de equipamentos biomédicos de suporte à vida,
                      controle rigoroso de calibrações com padrões rastreáveis RBC e laudos técnicos ANVISA/ONA.
                    </p>
                    <div className="settings-module-tags">
                      <span className="module-tag">✓ Chamados biomédicos prioritários</span>
                      <span className="module-tag">✓ Cronograma de Calibrações RBC</span>
                      <span className="module-tag">✓ Gestão de Inventário Hospitalar</span>
                      <span className="module-tag">✓ Laudos e Certificados de Conformidade</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className={`settings-module-toggle-btn ${settings.moduleClinical ? 'settings-module-toggle-btn--active' : 'settings-module-toggle-btn--inactive'}`}
                  onClick={() => handleToggleModule('moduleClinical', !settings.moduleClinical)}
                >
                  {settings.moduleClinical ? '✓ Módulo Ativo' : 'Ativar Módulo'}
                </button>
              </div>
            </div>

            {/* 3. MÓDULO ENGENHARIA PREDIAL */}
            <div className={`settings-module-card settings-module-card--predial ${settings.modulePredial ? 'settings-module-card--active' : ''}`}>
              <div className="settings-module-card__header">
                <div className="settings-module-card__info">
                  <div className="settings-module-icon settings-module-icon--predial">
                    <Building2 size={24} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                      <h3>3. Módulo Engenharia Predial & Facilities Críticos</h3>
                      <span className={`module-tag ${settings.modulePredial ? 'module-tag--active-predial' : ''}`}>
                        {settings.modulePredial ? '● LIBERADO NO CONTRATO' : '○ BLOQUEADO PARA O CLIENTE'}
                      </span>
                    </div>
                    <p className="settings-module-desc">
                      Gestão de grupos geradores de emergência, quadros elétricos críticos (QTA), rede de oxigênio medicinal,
                      vácuo clínico, climatização cirúrgica (PMOC) e segurança contra incêndio.
                    </p>
                    <div className="settings-module-tags">
                      <span className="module-tag">✓ Alertas de queda de rede e gerador</span>
                      <span className="module-tag">✓ Pressão de gases medicinais e vácuo</span>
                      <span className="module-tag">✓ Conformidade PMOC & Climatização</span>
                      <span className="module-tag">✓ Manutenção Predial Assistencial</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className={`settings-module-toggle-btn ${settings.modulePredial ? 'settings-module-toggle-btn--active' : 'settings-module-toggle-btn--inactive'}`}
                  onClick={() => handleToggleModule('modulePredial', !settings.modulePredial)}
                >
                  {settings.modulePredial ? '✓ Módulo Ativo' : 'Ativar Módulo'}
                </button>
              </div>
            </div>
          </div>

          {/* Matriz Desconstruída de Impacto no Cliente */}
          <div className="settings-deconstructed-card">
            <div className="settings-card-header">
              <div className="settings-card-title-group">
                <div className="settings-card-icon-wrap settings-card-icon-wrap--blue">
                  <Monitor size={22} />
                </div>
                <div>
                  <h2>Simulação de Impacto na Interface do Cliente</h2>
                  <p>Visualize como a navegação e o escopo de trabalho deste hospital/clínica se adaptam em tempo real:</p>
                </div>
              </div>
            </div>

            <div className="settings-matrix-wrap">
              <table className="settings-matrix-table">
                <thead>
                  <tr>
                    <th>Vertical Assistencial</th>
                    <th>Status no Painel</th>
                    <th>Abertura de Chamados</th>
                    <th>Inventário / Relatórios</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 800 }}>💻 T.I. em Saúde</td>
                    <td>
                      <span style={{ color: settings.moduleTI ? '#059669' : '#94a3b8', fontWeight: 800 }}>
                        {settings.moduleTI ? '● Ativo' : '○ Inativo'}
                      </span>
                    </td>
                    <td>
                      {settings.moduleTI ? 'Exibe opções de PEP, Redes e Impressoras' : 'Ocultado do formulário do cliente'}
                    </td>
                    <td>
                      {settings.moduleTI ? 'Ativos de informática incluídos nos KPIs' : 'Não contabiliza'}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 800 }}>🩺 Engenharia Clínica</td>
                    <td>
                      <span style={{ color: settings.moduleClinical ? '#059669' : '#94a3b8', fontWeight: 800 }}>
                        {settings.moduleClinical ? '● Ativo' : '○ Inativo'}
                      </span>
                    </td>
                    <td>
                      {settings.moduleClinical ? 'Exibe chamados biomédicos e suporte à vida' : 'Ocultado do formulário do cliente'}
                    </td>
                    <td>
                      {settings.moduleClinical ? 'Calibrações RBC e Preventivas ANVISA ativas' : 'Não contabiliza'}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 800 }}>🏢 Engenharia Predial</td>
                    <td>
                      <span style={{ color: settings.modulePredial ? '#059669' : '#94a3b8', fontWeight: 800 }}>
                        {settings.modulePredial ? '● Ativo' : '○ Inativo'}
                      </span>
                    </td>
                    <td>
                      {settings.modulePredial ? 'Exibe geradores, gases medicinais e PMOC' : 'Ocultado do formulário do cliente'}
                    </td>
                    <td>
                      {settings.modulePredial ? 'Utilidades, ar condicionado e quadros elétricos' : 'Não contabiliza'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          ABA 2: MODELO OPERACIONAL (FREELANCER VS PRÓPRIO) - DESCONSTRUÍDO
          ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'billing' && (
        <div className="settings-tab-content">
          <div className="settings-deconstructed-card">
            <div className="settings-card-header">
              <div className="settings-card-title-group">
                <div className="settings-card-icon-wrap settings-card-icon-wrap--amber">
                  <DollarSign size={22} />
                </div>
                <div>
                  <h2>Modelo de Operação do Cliente</h2>
                  <p>
                    Defina se este cliente opera com fluxo financeiro de faturamento/cobrança de ordens de serviço
                    ou opera como equipe assistencial própria interna (sem cobrança).
                  </p>
                </div>
              </div>
            </div>

            <div className="settings-mode-grid">
              {/* Opção 1: Modo Freelancer */}
              <div
                className={`billing-mode-card ${settings.billingEnabled ? 'billing-mode-card--active' : ''}`}
                onClick={() => handleToggleBilling(true)}
              >
                <div className="mode-card-header">
                  <div className="mode-icon mode-icon--freelancer">
                    <DollarSign size={24} />
                  </div>
                  <div>
                    <h3>Modo Freelancer / Terceirizado</h3>
                    <span className="mode-pill mode-pill--active">COM MÓDULO DE COBRANÇA</span>
                  </div>
                </div>

                <p className="mode-desc">
                  Recomendado para prestadores autônomos, consultorias e empresas terceirizadas.
                  Habilita o ciclo financeiro das Ordens de Serviço:
                </p>

                <ul className="mode-features">
                  <li><Check size={16} /> <strong>Prazo de faturamento</strong> de até 30 dias após conclusão técnica</li>
                  <li><Check size={16} /> Alertas de <strong>⚠️ Faturamento Atrasado</strong> para ordens acima de 30 dias</li>
                  <li><Check size={16} /> Status <strong>Faturada</strong> e confirmação de recebimento de pagamentos</li>
                  <li><Check size={16} /> Aba e métricas financeiras nos Relatórios Executivos</li>
                </ul>

                <button
                  className={`btn ${settings.billingEnabled ? 'btn--coral' : 'btn--outline'} btn--full`}
                  type="button"
                >
                  {settings.billingEnabled ? '✓ Modo Freelancer Ativo' : 'Mudar para Modo Freelancer'}
                </button>
              </div>

              {/* Opção 2: Modo Equipe Própria */}
              <div
                className={`billing-mode-card ${!settings.billingEnabled ? 'billing-mode-card--active' : ''}`}
                onClick={() => handleToggleBilling(false)}
              >
                <div className="mode-card-header">
                  <div className="mode-icon mode-icon--internal">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <h3>Modo Equipe Própria / Hospitalar</h3>
                    <span className="mode-pill mode-pill--neutral">100% ASSISTENCIAL (SEM COBRANÇA)</span>
                  </div>
                </div>

                <p className="mode-desc">
                  Recomendado para hospitais, clínicas e redes com equipe técnica interna (CLT ou cooperados).
                  Foco 100% assistencial:
                </p>

                <ul className="mode-features">
                  <li><Check size={16} /> <strong>Sem alertas de cobrança</strong> ou faturamento pendente no painel</li>
                  <li><Check size={16} /> Conclusão técnica finaliza a Ordem de Serviço diretamente</li>
                  <li><Check size={16} /> Dashboard e relatórios focados em <strong>SLA, MTTR, MTBF e Calibrações</strong></li>
                  <li><Check size={16} /> Fluxo simplificado sem etapas de cobrança financeira</li>
                </ul>

                <button
                  className={`btn ${!settings.billingEnabled ? 'btn--primary' : 'btn--outline'} btn--full`}
                  type="button"
                >
                  {!settings.billingEnabled ? '✓ Modo Equipe Própria Ativo' : 'Mudar para Modo Equipe Própria'}
                </button>
              </div>
            </div>
          </div>

          {/* Parâmetros Operacionais de Cobrança */}
          <div className="settings-deconstructed-card">
            <div className="settings-card-header">
              <div className="settings-card-title-group">
                <div className="settings-card-icon-wrap">
                  <SettingsIcon size={22} />
                </div>
                <div>
                  <h2>Parâmetros de Faturamento</h2>
                  <p>Ajuste os prazos e visualização de alertas financeiros quando o Modo Freelancer estiver ativado.</p>
                </div>
              </div>
            </div>

            <div className="settings-form-grid-2">
              <div className="settings-form-group">
                <label className="settings-form-label" htmlFor="billingMaxDays">
                  Prazo Máximo para Faturamento (Dias)
                </label>
                <input
                  id="billingMaxDays"
                  className="settings-input settings-input--no-icon"
                  type="number"
                  min="1"
                  max="180"
                  value={settings.billingMaxDays || 30}
                  disabled={!settings.billingEnabled}
                  onChange={(e) => handleUpdateField('billingMaxDays', Number(e.target.value))}
                />
                <span className="settings-field-hint">
                  Padrão contratual: 30 dias após a conclusão técnica do serviço.
                </span>
              </div>

              <div className="settings-form-group">
                <label className="settings-form-label" htmlFor="showAlertBanners">
                  Alertas de Faturamento no Dashboard
                </label>
                <select
                  id="showAlertBanners"
                  className="settings-select"
                  value={String(settings.showAlertBanners)}
                  disabled={!settings.billingEnabled}
                  onChange={(e) => handleUpdateField('showAlertBanners', e.target.value === 'true')}
                >
                  <option value="true">Exibir faixa de ordens atrasadas no Dashboard</option>
                  <option value="false">Ocultar alertas na tela inicial</option>
                </select>
                <span className="settings-field-hint">
                  Controla o aviso destacado de faturamento no topo do sistema.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          ABA 3: DADOS DA UNIDADE E CONTRATO (DESCONSTRUÍDO!)
          ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'contract' && (
        <div className="settings-tab-content">
          {/* Card 1: Identificação da Instituição Hospitalar */}
          <div className="settings-deconstructed-card">
            <div className="settings-card-header">
              <div className="settings-card-title-group">
                <div className="settings-card-icon-wrap">
                  <Building2 size={22} />
                </div>
                <div>
                  <h2>Identificação da Instituição Hospitalar</h2>
                  <p>Razão social e dados fiscais do cliente para emissão de laudos RBC, relatórios e controle de ativos.</p>
                </div>
              </div>
            </div>

            <div className="settings-form-grid-2">
              <div className="settings-form-group">
                <label className="settings-form-label" htmlFor="orgName">
                  <span>Razão Social / Nome da Clínica ou Hospital <span className="req">*</span></span>
                </label>
                <div className="settings-input-wrapper">
                  <Building2 size={16} className="settings-input-icon" />
                  <input
                    id="orgName"
                    className="settings-input"
                    type="text"
                    value={settings.organizationName || ''}
                    placeholder="Ex: Hospital Samaritano de Saúde Ltda"
                    onChange={(e) => handleUpdateField('organizationName', e.target.value)}
                  />
                </div>
                <span className="settings-field-hint">
                  Nome oficial que encabeça relatórios técnicos, ordens de serviço e laudos RBC.
                </span>
              </div>

              <div className="settings-form-group">
                <label className="settings-form-label" htmlFor="clientCnpj">
                  <span>CNPJ da Instituição <span className="req">*</span></span>
                </label>
                <div className="settings-input-wrapper">
                  <FileCheck2 size={16} className="settings-input-icon" />
                  <input
                    id="clientCnpj"
                    className="settings-input"
                    type="text"
                    value={settings.clientCnpj || ''}
                    placeholder="00.000.000/0001-00"
                    onChange={(e) => handleUpdateField('clientCnpj', e.target.value)}
                  />
                </div>
                <span className="settings-field-hint">
                  Identificação fiscal oficial vinculada ao contrato de prestação HelpClin.
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Vigência Contratual & Contato Executivo */}
          <div className="settings-deconstructed-card">
            <div className="settings-card-header">
              <div className="settings-card-title-group">
                <div className="settings-card-icon-wrap settings-card-icon-wrap--amber">
                  <FileCheck2 size={22} />
                </div>
                <div>
                  <h2>Vigência Contratual & Contato Executivo</h2>
                  <p>Status do licenciamento no sistema e e-mail do gestor ou diretoria responsável pela unidade.</p>
                </div>
              </div>
            </div>

            <div className="settings-form-grid-2">
              <div className="settings-form-group">
                <label className="settings-form-label" htmlFor="contractStatus">
                  <span>Status do Contrato HelpClin <span className="req">*</span></span>
                </label>
                <select
                  id="contractStatus"
                  className="settings-select"
                  value={settings.contractStatus || 'active'}
                  onChange={(e) => handleUpdateField('contractStatus', e.target.value)}
                >
                  <option value="active">🟢 Contrato Ativo & Regular</option>
                  <option value="trial">🟡 Período de Testes / Implantação (Trial)</option>
                  <option value="paused">🔴 Contrato Pausado / Em Negociação</option>
                </select>
                <div className={`settings-status-indicator-pill ${statusInfo.pillClass}`}>
                  <span>{statusInfo.icon}</span>
                  <span>{statusInfo.text}</span>
                </div>
              </div>

              <div className="settings-form-group">
                <label className="settings-form-label" htmlFor="contactEmail">
                  <span>E-mail Principal do Gestor da Unidade <span className="req">*</span></span>
                </label>
                <div className="settings-input-wrapper">
                  <Mail size={16} className="settings-input-icon" />
                  <input
                    id="contactEmail"
                    className="settings-input"
                    type="email"
                    value={settings.contactEmail || ''}
                    placeholder="diretoria@hospital.com.br"
                    onChange={(e) => handleUpdateField('contactEmail', e.target.value)}
                  />
                </div>
                <span className="settings-field-hint">
                  Destinatário para recebimento de laudos de auditoria e métricas de SLA.
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Prerrogativas & Notas Internas da HelpClin */}
          <div className="settings-deconstructed-card">
            <div className="settings-card-header">
              <div className="settings-card-title-group">
                <div className="settings-card-icon-wrap">
                  <Lock size={22} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <h2>Prerrogativas & Notas Internas da HelpClin</h2>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: 'rgba(231, 131, 104, 0.15)',
                      color: 'var(--coral)',
                      letterSpacing: '0.04em'
                    }}>
                      CONFIDENCIAL • VISÍVEL APENAS PARA ADMINS
                    </span>
                  </div>
                  <p>Registro interno da equipe HelpClin sobre acordos de nível de serviço, plantonistas e particularidades.</p>
                </div>
              </div>
            </div>

            <div className="settings-form-group settings-form-group--full">
              <label className="settings-form-label" htmlFor="adminNotes">
                <span>Observações Internas da HelpClin</span>
              </label>
              <textarea
                id="adminNotes"
                className="settings-textarea"
                rows={4}
                value={settings.adminNotes || ''}
                placeholder="Anotações internas sobre escopo técnico, plantonistas, acordos de SLA diferenciados e contatos de emergência..."
                onChange={(e) => handleUpdateField('adminNotes', e.target.value)}
              />
              <span className="settings-field-hint">
                <ShieldAlert size={13} style={{ color: 'var(--coral)', flexShrink: 0 }} />
                <span>Estas observações são restritas à equipe gestora HelpClin e nunca serão visíveis aos usuários comuns do hospital.</span>
              </span>
            </div>
          </div>

          {/* Deck de Ações Desconstruído */}
          <div className="settings-action-deck">
            <div className="settings-action-status">
              {hasChanges ? (
                <>
                  <span style={{ color: '#d97706' }}>●</span>
                  <span>Você possui alterações pendentes de confirmação</span>
                </>
              ) : (
                <>
                  <span style={{ color: '#059669' }}>●</span>
                  <span>Todas as configurações estão sincronizadas em tempo real</span>
                </>
              )}
            </div>

            <div className="settings-action-buttons">
              <button
                type="button"
                className="btn btn--subtle btn-subtle"
                onClick={handleResetDefaults}
              >
                <RefreshCw size={15} />
                <span>Restaurar Padrão</span>
              </button>

              <button
                type="button"
                className="btn btn--primary"
                onClick={handleSaveAll}
              >
                <Save size={16} />
                <span>Salvar Dados Contratuais</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

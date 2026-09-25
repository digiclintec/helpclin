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
  const [activeTab, setActiveTab] = useState('modules'); // 'modules', 'billing', 'contract'

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
    }, 3000);
  }

  function handleResetDefaults() {
    if (window.confirm('Deseja restaurar as configurações padrão da HelpClin para este cliente?')) {
      setSettings(DEFAULT_BILLING_SETTINGS);
      saveClientBillingSettings(DEFAULT_BILLING_SETTINGS);
      setHasChanges(false);
      triggerSuccessNotification();
    }
  }

  // ── Se o usuário NÃO for Administrador da HelpClin ──
  if (!isAdmin) {
    return (
      <div className="settings-page">
        <div className="settings-container">
          <div style={{
            maxWidth: '620px',
            margin: '60px auto',
            background: '#ffffff',
            borderRadius: '18px',
            border: '1px solid #dce7df',
            boxShadow: '0 10px 30px rgba(18, 59, 61, 0.06)',
            padding: '44px 36px',
            textAlign: 'center'
          }}>
            <div style={{
              width: '58px',
              height: '58px',
              borderRadius: '50%',
              background: '#fef2f2',
              color: '#dc2626',
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 20px'
            }}>
              <ShieldAlert size={28} />
            </div>

            <span style={{
              display: 'inline-block',
              fontSize: '11px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#dc2626',
              background: '#fef2f2',
              padding: '4px 12px',
              borderRadius: '20px',
              marginBottom: '14px'
            }}>
              Acesso Restrito à Gestão HelpClin
            </span>

            <h2 style={{
              color: '#123b3d',
              fontFamily: 'Manrope, sans-serif',
              fontSize: '24px',
              fontWeight: 800,
              margin: '0 0 14px'
            }}>
              Painel de Licenciamento & Módulos
            </h2>

            <p style={{
              color: '#5e726e',
              fontSize: '14px',
              lineHeight: 1.65,
              margin: '0 0 24px'
            }}>
              Apenas os administradores da <strong>HelpClin</strong> possuem autorização contratual para
              ativar ou desativar os módulos de <strong>T.I., Engenharia Clínica, Engenharia Predial</strong> e
              o modelo de cobrança deste cliente.
            </p>

            <div style={{
              background: '#f8faf8',
              border: '1px solid #e2e8e5',
              borderRadius: '12px',
              padding: '16px 20px',
              textAlign: 'left',
              marginBottom: '26px',
              fontSize: '13px',
              color: '#143b3d'
            }}>
              <p style={{ margin: '0 0 6px', fontWeight: 700, color: '#123b3d' }}>
                Módulos Ativos Atualmente no seu Contrato:
              </p>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#5e726e', lineHeight: 1.6 }}>
                <li>T.I. em Saúde: <strong>{settings.moduleTI ? 'Liberado' : 'Não Contratado'}</strong></li>
                <li>Engenharia Clínica: <strong>{settings.moduleClinical ? 'Liberado' : 'Não Contratado'}</strong></li>
                <li>Engenharia Predial: <strong>{settings.modulePredial ? 'Liberado' : 'Não Contratado'}</strong></li>
                <li>Modelo: <strong>{settings.billingEnabled ? 'Modo Freelancer' : 'Modo Equipe Própria'}</strong></li>
              </ul>
            </div>

            <a
              href="/dashboard"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                borderRadius: '10px',
                background: '#123b3d',
                color: '#ffffff',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: 700
              }}
            >
              Voltar para o Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ── Painel Master de Gestão HelpClin (Admin) ──
  return (
    <div className="settings-page">
      <div className="settings-container">
        {/* Cabeçalho Executivo */}
        <header className="settings-header">
          <div className="settings-header__title-group">
            <div className="settings-header__badge" style={{ background: '#fef3c7', borderColor: '#fde68a', color: '#b45309' }}>
              <ShieldCheck size={14} color="#b45309" />
              <span>Painel Master de Gestão HelpClin</span>
            </div>
            <h1>Administração de Módulos & Licenciamento do Cliente</h1>
            <p>
              Controle exclusivo da equipe HelpClin para definir quais verticais (T.I., Engenharia Clínica, Engenharia Predial)
              e modelo de cobrança este cliente terá liberado no painel dele.
            </p>
          </div>

          <div className="settings-header__actions">
            <button
              className="btn btn--subtle"
              onClick={handleResetDefaults}
              title="Restaurar valores padrão"
            >
              <RefreshCw size={15} />
              <span>Restaurar Padrão</span>
            </button>

            <button
              className={`btn btn--primary ${saveSuccess ? 'btn--success' : ''}`}
              onClick={handleSaveAll}
            >
              {saveSuccess ? <Check size={16} /> : <Save size={16} />}
              <span>{saveSuccess ? 'Alterações Salvas!' : hasChanges ? 'Salvar Contrato' : 'Configurações em Dia'}</span>
            </button>
          </div>
        </header>

        {/* Abas de Navegação da Gestão */}
        <div className="settings-tabs">
          <button
            className={`settings-tab ${activeTab === 'modules' ? 'settings-tab--active' : ''}`}
            onClick={() => setActiveTab('modules')}
          >
            <Layers size={17} />
            <span>Módulos Contratuais (T.I., Clínica, Predial)</span>
          </button>

          <button
            className={`settings-tab ${activeTab === 'billing' ? 'settings-tab--active' : ''}`}
            onClick={() => setActiveTab('billing')}
          >
            <DollarSign size={17} />
            <span>Modelo Operacional (Freelancer vs Próprio)</span>
          </button>

          <button
            className={`settings-tab ${activeTab === 'contract' ? 'settings-tab--active' : ''}`}
            onClick={() => setActiveTab('contract')}
          >
            <Building2 size={17} />
            <span>Dados da Unidade & Contrato</span>
          </button>
        </div>

        {/* Notificação Flutuante de Sucesso */}
        {saveSuccess && (
          <div className="settings-alert-bar settings-alert-bar--success">
            <CheckCircle2 size={18} />
            <span>Módulos e permissões do cliente atualizados com sucesso em tempo real!</span>
          </div>
        )}

        {/* ── ABA 1: ATIVAÇÃO DOS MÓDULOS CONTRATUAIS ── */}
        {activeTab === 'modules' && (
          <div className="settings-tab-content">
            <div className="settings-card" style={{ borderLeft: '4px solid #194e50' }}>
              <div className="settings-card__header">
                <div>
                  <span className="settings-section-tag">GESTÃO DE ESCOPO DO CLIENTE</span>
                  <h2>Ativação das Verticais Contratadas</h2>
                  <p>
                    Se o cliente não contratou uma das áreas abaixo, desative-a. Ela será ocultada automaticamente
                    na tela de abertura de chamados, inventário e relatórios do cliente.
                  </p>
                </div>
              </div>

              <div className="settings-modules-grid" style={{ display: 'grid', gap: '18px', marginTop: '20px' }}>
                {/* 1. MÓDULO T.I. EM SAÚDE */}
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  padding: '22px',
                  borderRadius: '14px',
                  border: `1.5px solid ${settings.moduleTI ? '#2563eb' : '#dce7df'}`,
                  background: settings.moduleTI ? '#f8fafd' : '#fafbfa',
                  gap: '20px'
                }}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    <div style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '12px',
                      background: settings.moduleTI ? '#dbeafe' : '#f1f5f9',
                      color: settings.moduleTI ? '#1d4ed8' : '#64748b',
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0
                    }}>
                      <Server size={22} />
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <h3 style={{ margin: 0, fontSize: '17px', color: '#123b3d', fontWeight: 800 }}>
                          1. Módulo T.I. em Saúde & Sistemas
                        </h3>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: settings.moduleTI ? '#dbeafe' : '#f1f5f9',
                          color: settings.moduleTI ? '#1e40af' : '#64748b'
                        }}>
                          {settings.moduleTI ? 'LIBERADO NO CONTRATO' : 'BLOQUEADO PARA O CLIENTE'}
                        </span>
                      </div>

                      <p style={{ margin: '0 0 10px', fontSize: '13px', color: '#5e726e', lineHeight: 1.5 }}>
                        Suporte técnico a Prontuários Eletrônicos (PEP, MV, Tasy, Clinux), rede assistencial, Wi-Fi,
                        servidores PACS e impressoras térmicas Zebra de identificação de pacientes.
                      </p>

                      <div style={{ fontSize: '12px', color: '#1e40af', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        <span>✓ Abertura de chamados de T.I.</span>
                        <span>✓ Monitoramento de SLA de rede</span>
                        <span>✓ Permissões e LGPD</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={() => handleToggleModule('moduleTI', !settings.moduleTI)}
                      style={{
                        padding: '10px 18px',
                        borderRadius: '9px',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 700,
                        background: settings.moduleTI ? '#2563eb' : '#e2e8e5',
                        color: settings.moduleTI ? '#ffffff' : '#475569',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {settings.moduleTI ? 'Módulo Ativo' : 'Ativar Módulo'}
                    </button>
                  </div>
                </div>

                {/* 2. MÓDULO ENGENHARIA CLÍNICA */}
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  padding: '22px',
                  borderRadius: '14px',
                  border: `1.5px solid ${settings.moduleClinical ? '#16a34a' : '#dce7df'}`,
                  background: settings.moduleClinical ? '#f0fdf4' : '#fafbfa',
                  gap: '20px'
                }}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    <div style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '12px',
                      background: settings.moduleClinical ? '#dcfce7' : '#f1f5f9',
                      color: settings.moduleClinical ? '#15803d' : '#64748b',
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0
                    }}>
                      <Stethoscope size={22} />
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <h3 style={{ margin: 0, fontSize: '17px', color: '#123b3d', fontWeight: 800 }}>
                          2. Módulo Engenharia Clínica & Biomédica
                        </h3>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: settings.moduleClinical ? '#dcfce7' : '#f1f5f9',
                          color: settings.moduleClinical ? '#166534' : '#64748b'
                        }}>
                          {settings.moduleClinical ? 'LIBERADO NO CONTRATO' : 'BLOQUEADO PARA O CLIENTE'}
                        </span>
                      </div>

                      <p style={{ margin: '0 0 10px', fontSize: '13px', color: '#5e726e', lineHeight: 1.5 }}>
                        Manutenção corretiva e preventiva de equipamentos biomédicos de suporte à vida,
                        controle de calibrações com padrões rastreáveis RBC e laudos técnicos para ANVISA e ONA.
                      </p>

                      <div style={{ fontSize: '12px', color: '#15803d', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        <span>✓ Chamados biomédicos prioritários</span>
                        <span>✓ Cronograma de Calibrações RBC</span>
                        <span>✓ Gestão de Inventário Hospitalar</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={() => handleToggleModule('moduleClinical', !settings.moduleClinical)}
                      style={{
                        padding: '10px 18px',
                        borderRadius: '9px',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 700,
                        background: settings.moduleClinical ? '#16a34a' : '#e2e8e5',
                        color: settings.moduleClinical ? '#ffffff' : '#475569',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {settings.moduleClinical ? 'Módulo Ativo' : 'Ativar Módulo'}
                    </button>
                  </div>
                </div>

                {/* 3. MÓDULO ENGENHARIA PREDIAL */}
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  padding: '22px',
                  borderRadius: '14px',
                  border: `1.5px solid ${settings.modulePredial ? '#d97706' : '#dce7df'}`,
                  background: settings.modulePredial ? '#fffbeb' : '#fafbfa',
                  gap: '20px'
                }}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    <div style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '12px',
                      background: settings.modulePredial ? '#fef3c7' : '#f1f5f9',
                      color: settings.modulePredial ? '#b45309' : '#64748b',
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0
                    }}>
                      <Building2 size={22} />
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <h3 style={{ margin: 0, fontSize: '17px', color: '#123b3d', fontWeight: 800 }}>
                          3. Módulo Engenharia Predial & Facilities
                        </h3>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: settings.modulePredial ? '#fef3c7' : '#f1f5f9',
                          color: settings.modulePredial ? '#92400e' : '#64748b'
                        }}>
                          {settings.modulePredial ? 'LIBERADO NO CONTRATO' : 'BLOQUEADO PARA O CLIENTE'}
                        </span>
                      </div>

                      <p style={{ margin: '0 0 10px', fontSize: '13px', color: '#5e726e', lineHeight: 1.5 }}>
                        Gestão de grupos geradores de emergência, quadros elétricos críticos (QTA), rede de oxigênio medicinal,
                        vácuo clínico, climatização cirúrgica (PMOC) e segurança contra incêndio.
                      </p>

                      <div style={{ fontSize: '12px', color: '#b45309', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        <span>✓ Alertas de queda de rede e gerador</span>
                        <span>✓ Pressão de gases medicinais</span>
                        <span>✓ Conformidade PMOC & AVCB</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={() => handleToggleModule('modulePredial', !settings.modulePredial)}
                      style={{
                        padding: '10px 18px',
                        borderRadius: '9px',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 700,
                        background: settings.modulePredial ? '#d97706' : '#e2e8e5',
                        color: settings.modulePredial ? '#ffffff' : '#475569',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {settings.modulePredial ? 'Módulo Ativo' : 'Ativar Módulo'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Simulação em Tempo Real da Visão do Cliente */}
            <div className="settings-card" style={{ marginTop: '24px' }}>
              <div className="settings-card__header">
                <div>
                  <span className="settings-section-tag">SIMULAÇÃO DE IMPACTO NO CLIENTE</span>
                  <h2>Como o Cliente Verá o Sistema dele</h2>
                  <p>Confira quais verticais ficarão visíveis para os colaboradores deste hospital/clínica:</p>
                </div>
              </div>

              <div style={{ overflowX: 'auto', marginTop: '16px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#f1f8f5', color: '#123b3d' }}>
                      <th style={{ padding: '12px 14px', borderBottom: '1px solid #dce7df' }}>Especialidade</th>
                      <th style={{ padding: '12px 14px', borderBottom: '1px solid #dce7df' }}>Status no Painel</th>
                      <th style={{ padding: '12px 14px', borderBottom: '1px solid #dce7df' }}>Abertura de Chamados</th>
                      <th style={{ padding: '12px 14px', borderBottom: '1px solid #dce7df' }}>Inventário / Relatórios</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '12px 14px', borderBottom: '1px solid #edf3ef', fontWeight: 700 }}>💻 T.I. em Saúde</td>
                      <td style={{ padding: '12px 14px', borderBottom: '1px solid #edf3ef' }}>
                        <span style={{ color: settings.moduleTI ? '#16a34a' : '#94a3b8', fontWeight: 700 }}>
                          {settings.moduleTI ? '● Ativo' : '○ Inativo'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', borderBottom: '1px solid #edf3ef', color: '#5e726e' }}>
                        {settings.moduleTI ? 'Exibe opções de PEP, Redes e Impressoras' : 'Ocultado do formulário'}
                      </td>
                      <td style={{ padding: '12px 14px', borderBottom: '1px solid #edf3ef', color: '#5e726e' }}>
                        {settings.moduleTI ? 'Ativos de T.I. incluídos' : 'Não contabiliza'}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '12px 14px', borderBottom: '1px solid #edf3ef', fontWeight: 700 }}>🩺 Engenharia Clínica</td>
                      <td style={{ padding: '12px 14px', borderBottom: '1px solid #edf3ef' }}>
                        <span style={{ color: settings.moduleClinical ? '#16a34a' : '#94a3b8', fontWeight: 700 }}>
                          {settings.moduleClinical ? '● Ativo' : '○ Inativo'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', borderBottom: '1px solid #edf3ef', color: '#5e726e' }}>
                        {settings.moduleClinical ? 'Exibe chamados de monitores, respiradores e bombas' : 'Ocultado do formulário'}
                      </td>
                      <td style={{ padding: '12px 14px', borderBottom: '1px solid #edf3ef', color: '#5e726e' }}>
                        {settings.moduleClinical ? 'Calibrações RBC e Preventivas ANVISA' : 'Não contabiliza'}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '12px 14px', borderBottom: '1px solid #edf3ef', fontWeight: 700 }}>🏢 Engenharia Predial</td>
                      <td style={{ padding: '12px 14px', borderBottom: '1px solid #edf3ef' }}>
                        <span style={{ color: settings.modulePredial ? '#16a34a' : '#94a3b8', fontWeight: 700 }}>
                          {settings.modulePredial ? '● Ativo' : '○ Inativo'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', borderBottom: '1px solid #edf3ef', color: '#5e726e' }}>
                        {settings.modulePredial ? 'Exibe geradores, gases medicinais e PMOC' : 'Ocultado do formulário'}
                      </td>
                      <td style={{ padding: '12px 14px', borderBottom: '1px solid #edf3ef', color: '#5e726e' }}>
                        {settings.modulePredial ? 'Utilidades e geradores monitorados' : 'Não contabiliza'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── ABA 2: MODELO OPERACIONAL (FREELANCER VS PRÓPRIO) ── */}
        {activeTab === 'billing' && (
          <div className="settings-tab-content">
            <div className="settings-card">
              <div className="settings-card__header">
                <div>
                  <span className="settings-section-tag">GESTÃO DE COBRANÇAS HELPCLIN</span>
                  <h2>Modelo de Operação do Cliente</h2>
                  <p>
                    Defina se este cliente opera com regras de faturamento/cobrança de ordens de serviço
                    ou opera como equipe interna própria (sem cobrança).
                  </p>
                </div>
              </div>

              <div className="billing-mode-selector">
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
                    {settings.billingEnabled ? 'Modo Freelancer Ativo' : 'Mudar para Modo Freelancer'}
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
                      <span className="mode-pill mode-pill--neutral">SEM MÓDULO DE COBRANÇA</span>
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
                    {!settings.billingEnabled ? 'Modo Equipe Própria Ativo' : 'Mudar para Modo Equipe Própria'}
                  </button>
                </div>
              </div>

              {/* Parâmetros Adicionais */}
              <div className="settings-subcard" style={{ marginTop: '28px' }}>
                <h3>Parâmetros Operacionais de Cobrança</h3>
                <div className="settings-fields-grid">
                  <div className="setting-field">
                    <label htmlFor="billingMaxDays">Prazo Máximo para Faturamento (Dias)</label>
                    <input
                      id="billingMaxDays"
                      type="number"
                      min="1"
                      max="180"
                      value={settings.billingMaxDays || 30}
                      disabled={!settings.billingEnabled}
                      onChange={(e) => handleUpdateField('billingMaxDays', Number(e.target.value))}
                    />
                    <small>Padrão: 30 dias após a conclusão técnica do serviço.</small>
                  </div>

                  <div className="setting-field">
                    <label htmlFor="showAlertBanners">Alertas de Faturamento no Dashboard</label>
                    <select
                      id="showAlertBanners"
                      value={String(settings.showAlertBanners)}
                      disabled={!settings.billingEnabled}
                      onChange={(e) => handleUpdateField('showAlertBanners', e.target.value === 'true')}
                    >
                      <option value="true">Exibir faixa de ordens atrasadas no Dashboard</option>
                      <option value="false">Ocultar alertas na tela inicial</option>
                    </select>
                    <small>Controla o aviso destacado de faturamento no topo do sistema.</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── ABA 3: DADOS DA UNIDADE E CONTRATO ── */}
        {activeTab === 'contract' && (
          <div className="settings-tab-content">
            <div className="settings-card">
              <div className="settings-card__header">
                <div>
                  <span className="settings-section-tag">CADASTRO CONTRATUAL DO CLIENTE</span>
                  <h2>Informações da Unidade Hospitalar</h2>
                  <p>Identificação do cliente para emissão de laudos, relatórios e controle de contrato.</p>
                </div>
              </div>

              <div className="settings-fields-grid">
                <div className="setting-field">
                  <label htmlFor="orgName">Razão Social / Nome da Clínica ou Hospital</label>
                  <input
                    id="orgName"
                    type="text"
                    value={settings.organizationName || ''}
                    placeholder="Ex: Hospital Samaritano de Saúde Ltda"
                    onChange={(e) => handleUpdateField('organizationName', e.target.value)}
                  />
                </div>

                <div className="setting-field">
                  <label htmlFor="clientCnpj">CNPJ do Cliente</label>
                  <input
                    id="clientCnpj"
                    type="text"
                    value={settings.clientCnpj || ''}
                    placeholder="00.000.000/0001-00"
                    onChange={(e) => handleUpdateField('clientCnpj', e.target.value)}
                  />
                </div>

                <div className="setting-field">
                  <label htmlFor="contractStatus">Status do Contrato HelpClin</label>
                  <select
                    id="contractStatus"
                    value={settings.contractStatus || 'active'}
                    onChange={(e) => handleUpdateField('contractStatus', e.target.value)}
                  >
                    <option value="active">🟢 Contrato Ativo & Regular</option>
                    <option value="trial">🟡 Período de Testes / Implantação (Trial)</option>
                    <option value="paused">🔴 Contrato Pausado / Em Negociação</option>
                  </select>
                </div>

                <div className="setting-field">
                  <label htmlFor="contactEmail">E-mail Principal do Gestor da Unidade</label>
                  <input
                    id="contactEmail"
                    type="email"
                    value={settings.contactEmail || ''}
                    placeholder="diretoria@hospital.com.br"
                    onChange={(e) => handleUpdateField('contactEmail', e.target.value)}
                  />
                </div>

                <div className="setting-field setting-field--full">
                  <label htmlFor="adminNotes">Observações Internas da HelpClin (Visível apenas para Admins)</label>
                  <textarea
                    id="adminNotes"
                    rows={3}
                    value={settings.adminNotes || ''}
                    placeholder="Anotações internas sobre escopo técnico, plantonistas ou particularidades do cliente..."
                    onChange={(e) => handleUpdateField('adminNotes', e.target.value)}
                  />
                </div>
              </div>

              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
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
    </div>
  );
}

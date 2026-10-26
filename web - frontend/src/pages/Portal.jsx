import React, { useEffect, useState } from 'react';
import {
  Activity,
  ArrowRight,
  ExternalLink,
  MessageSquare,
  Wrench,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Users,
  LogOut,
  Headset,
  Settings,
  ChevronRight,
  Copy,
  Check,
  FileText,
  Smartphone,
  Layers,
  Lock
} from 'lucide-react';
import './Portal.css';
import { getStoredUser } from '../services/api.js';

export default function Portal() {
  const [copiedLink, setCopiedLink] = useState(false);
  const user = getStoredUser();

  useEffect(() => {
    document.title = 'Portal do Cliente | HelpClin & Helpchat Suite';
  }, []);

  const userName = user?.name || 'Cliente Parceiro';
  const userEmail = user?.email || 'cliente@empresa.com.br';
  const isAdmin = user?.role === 'admin';
  const roleLabel = isAdmin ? 'Administrador Geral' : user?.role === 'technician' ? 'Técnico Autorizado' : 'Cliente / Empresa';

  function handleLogout() {
    localStorage.removeItem('helpclin_user');
    window.location.href = '/login';
  }

  function handleCopyPortalLink() {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  }

  function handleWhatsAppSupport() {
    const message = encodeURIComponent(
      `Olá! Sou o cliente ${userName} (${userEmail}) e preciso de suporte com os meus sistemas HelpClin / Helpchat.`
    );
    window.open(`https://api.whatsapp.com/send?phone=5511999999999&text=${message}`, '_blank');
  }

  return (
    <div className="portal-page">
      {/* ── Header Superior do Portal ── */}
      <header className="portal-header">
        <div className="portal-header__inner">
          <a href="/" className="portal-brand" title="Voltar para a página inicial">
            <span className="portal-brand__icon">
              <Activity size={22} strokeWidth={2.5} />
            </span>
            <div className="portal-brand__text">
              <span className="portal-brand__name">help<span>clin</span>tec</span>
              <span className="portal-brand__sub">Portal de Sistemas & Clientes</span>
            </div>
          </a>

          <div className="portal-header__actions">
            {user ? (
              <>
                <div className="portal-user-badge">
                  <div className="portal-avatar">
                    {userName.slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                    <strong style={{ fontSize: '13px', lineHeight: 1.1 }}>{userName}</strong>
                    <span style={{ fontSize: '11px', color: 'var(--portal-muted)' }}>{roleLabel}</span>
                  </div>
                </div>

                {isAdmin && (
                  <a href="/usuarios" className="portal-btn portal-btn--ghost" title="Gerenciar Usuários e Revenda">
                    <Users size={16} />
                    <span>Gestão de Clientes</span>
                  </a>
                )}

                <button onClick={handleLogout} className="portal-btn portal-btn--ghost" title="Sair do Portal">
                  <LogOut size={16} />
                  <span>Sair</span>
                </button>
              </>
            ) : (
              <a href="/login" className="portal-btn portal-btn--coral">
                <span>Entrar no Portal</span>
                <ArrowRight size={15} />
              </a>
            )}
          </div>
        </div>
      </header>

      {/* ── Conteúdo Principal ── */}
      <main className="portal-main">
        {/* Banner de Boas-Vindas */}
        <section className="portal-hero">
          <div className="portal-hero__badge">
            <Sparkles size={14} />
            <span>Central Unificada de Sistemas SaaS</span>
          </div>

          <h1 className="portal-hero__title">
            Bem-vindo ao seu Portal de Aplicativos, {userName}!
          </h1>
          <p className="portal-hero__desc">
            Acesse abaixo todos os sistemas e módulos contratados pela sua empresa.
            Gerencie atendimentos pelo WhatsApp e controle suas manutenções técnicas em um único lugar.
          </p>

          <div className="portal-hero__stats">
            <div className="portal-stat-chip">
              <ShieldCheck size={16} color="#35785d" />
              <span>Assinatura Corporativa Ativa</span>
            </div>
            <div className="portal-stat-chip">
              <Clock size={16} color="#e78368" />
              <span>SLA & Suporte Prioritário</span>
            </div>
            <div className="portal-stat-chip">
              <Layers size={16} color="#60a5fa" />
              <span>2 Sistemas Integrados</span>
            </div>
          </div>
        </section>

        {/* ── Seção de Sistemas Liberados ── */}
        <div className="portal-section-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={22} color="var(--portal-coral)" />
            <span>Meus Sistemas Disponíveis</span>
          </div>
          <button
            onClick={handleCopyPortalLink}
            className="portal-btn portal-btn--ghost"
            style={{ fontSize: '12px', padding: '6px 12px' }}
          >
            {copiedLink ? <Check size={14} color="#35785d" /> : <Copy size={14} />}
            <span>{copiedLink ? 'Link do Portal Copiado!' : 'Copiar Link deste Portal'}</span>
          </button>
        </div>

        <div className="portal-grid">
          {/* ── Card 1: Helpchat (Omnichannel WhatsApp) ── */}
          <div className="system-card system-card--active system-card--whatsapp">
            <div className="system-card__header">
              <div className="system-card__icon-box whatsapp">
                <MessageSquare size={26} strokeWidth={2.2} />
              </div>
              <span className="system-status-pill active">
                <CheckCircle2 size={13} /> Sistema Ativo
              </span>
            </div>

            <span className="system-card__tagline">Atendimento & WhatsApp Multi-atendente</span>
            <h3 className="system-card__title">Helpchat Omnichannel</h3>
            <p className="system-card__desc">
              Central de atendimento para WhatsApp comercial, permitindo múltiplos atendentes no mesmo número,
              distribuição por filas, chatbots inteligentes e histórico unificado de clientes.
            </p>

            <div className="system-card__meta">
              <span><strong>Acesso:</strong> chat.helpclintec.com.br</span>
              <span style={{ color: '#25d366', fontWeight: 700 }}>● Online</span>
            </div>

            <ul className="system-card__features">
              <li>
                <CheckCircle2 size={15} />
                <span>Múltiplos atendentes em 1 único WhatsApp</span>
              </li>
              <li>
                <CheckCircle2 size={15} />
                <span>Respostas automáticas, menus e triagem 24h</span>
              </li>
              <li>
                <CheckCircle2 size={15} />
                <span>Painel de conversas e métricas da equipe</span>
              </li>
            </ul>

            <div className="system-card__actions">
              <a
                href="http://chat.helpclintec.com.br/"
                target="_blank"
                rel="noopener noreferrer"
                className="system-action-btn system-action-btn--whatsapp"
              >
                <span>Acessar Helpchat</span>
                <ExternalLink size={16} />
              </a>
              <button
                onClick={handleWhatsAppSupport}
                className="system-action-btn system-action-btn--outline"
              >
                <Smartphone size={15} />
                <span>Ajuda para Conectar WhatsApp</span>
              </button>
            </div>
          </div>

          {/* ── Card 2: HelpClin OS & Tickets (Service Desk) ── */}
          <div className="system-card system-card--active">
            <div className="system-card__header">
              <div className="system-card__icon-box helpclin">
                <Wrench size={26} strokeWidth={2.2} />
              </div>
              <span className="system-status-pill active">
                <CheckCircle2 size={13} /> Sistema Ativo
              </span>
            </div>

            <span className="system-card__tagline">Service Desk & Gestão de Manutenção</span>
            <h3 className="system-card__title">HelpClin OS & Chamados</h3>
            <p className="system-card__desc">
              Gestão operacional de chamados técnicos, emissão de ordens de serviço, relatórios formais
              em folha A4 com laudo pericial e controle patrimonial de ativos/equipamentos.
            </p>

            <div className="system-card__meta">
              <span><strong>Módulo:</strong> T.I., Clínica & Predial</span>
              <span style={{ color: 'var(--portal-coral)', fontWeight: 700 }}>● Conectado</span>
            </div>

            <ul className="system-card__features">
              <li>
                <CheckCircle2 size={15} />
                <span>Abertura e acompanhamento de chamados com SLA</span>
              </li>
              <li>
                <CheckCircle2 size={15} />
                <span>Ordens de Serviço com impressão de Laudo A4</span>
              </li>
              <li>
                <CheckCircle2 size={15} />
                <span>Auditoria de faturamento e peças substituídas</span>
              </li>
            </ul>

            <div className="system-card__actions">
              <a href="/dashboard" className="system-action-btn system-action-btn--primary">
                <span>Acessar Painel HelpClin</span>
                <ChevronRight size={17} />
              </a>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <a href="/chamados" className="system-action-btn system-action-btn--outline" style={{ fontSize: '13px' }}>
                  Abrir Chamado
                </a>
                <a href="/ordens" className="system-action-btn system-action-btn--outline" style={{ fontSize: '13px' }}>
                  Ver Ordens
                </a>
              </div>
            </div>
          </div>

          {/* ── Card 3: Módulo de Expansão / Revenda (Administrador) ── */}
          {isAdmin ? (
            <div className="system-card" style={{ borderTop: '4px solid #7c3aed' }}>
              <div className="system-card__header">
                <div className="system-card__icon-box hub">
                  <Users size={26} strokeWidth={2.2} />
                </div>
                <span className="system-status-pill" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
                  ★ Painel Master
                </span>
              </div>

              <span className="system-card__tagline" style={{ color: '#7c3aed' }}>Gestão de Licenças & Revenda</span>
              <h3 className="system-card__title">Central do Revendedor</h3>
              <p className="system-card__desc">
                Como administrador, você pode cadastrar novas empresas clientes, definir quais sistemas
                estarão liberados para cada conta e enviar os dados de acesso automaticamente por WhatsApp.
              </p>

              <div className="system-card__meta">
                <span><strong>Privilégio:</strong> Master Admin</span>
                <span style={{ color: '#7c3aed', fontWeight: 700 }}>Total</span>
              </div>

              <ul className="system-card__features">
                <li>
                  <CheckCircle2 size={15} />
                  <span>Cadastrar novos clientes e empresas</span>
                </li>
                <li>
                  <CheckCircle2 size={15} />
                  <span>Liberar / bloquear Helpchat e HelpClin por usuário</span>
                </li>
                <li>
                  <CheckCircle2 size={15} />
                  <span>Envio de dados de acesso com 1 clique</span>
                </li>
              </ul>

              <div className="system-card__actions">
                <a href="/usuarios" className="system-action-btn" style={{ background: '#7c3aed', color: '#fff' }}>
                  <Users size={16} />
                  <span>Gerenciar Clientes & Revenda</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="system-card system-card--locked">
              <div className="system-card__header">
                <div className="system-card__icon-box hub">
                  <Sparkles size={26} strokeWidth={2.2} />
                </div>
                <span className="system-status-pill locked">
                  <Lock size={12} /> Expansão
                </span>
              </div>

              <span className="system-card__tagline">Novas Vertentes & Módulos</span>
              <h3 className="system-card__title">Adicionar Novos Módulos</h3>
              <p className="system-card__desc">
                Precisa de mais atendentes no Helpchat, controle de inventário com QR Code patrimonial
                ou automações adicionais com inteligência artificial para o seu negócio?
              </p>

              <div className="system-card__meta">
                <span><strong>Upgrade:</strong> Disponível sob demanda</span>
                <span>Sob consulta</span>
              </div>

              <ul className="system-card__features">
                <li>
                  <CheckCircle2 size={15} />
                  <span>Pacotes de atendentes adicionais para WhatsApp</span>
                </li>
                <li>
                  <CheckCircle2 size={15} />
                  <span>Emissão de notas e faturamento automatizado</span>
                </li>
                <li>
                  <CheckCircle2 size={15} />
                  <span>Treinamento e parametrização inclusos</span>
                </li>
              </ul>

              <div className="system-card__actions">
                <button onClick={handleWhatsAppSupport} className="system-action-btn system-action-btn--outline">
                  <span>Solicitar Ativação de Módulos</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Suporte e Contato Rápido ── */}
        <section className="portal-support-bar">
          <div className="portal-support-info">
            <div className="portal-support-icon">
              <Headset size={24} />
            </div>
            <div className="portal-support-text">
              <h4>Precisa de ajuda ou deseja alterar seu plano?</h4>
              <p>Nossa equipe de suporte técnico e comercial está pronta para atender sua empresa.</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button onClick={handleWhatsAppSupport} className="portal-btn portal-btn--coral">
              <Smartphone size={16} />
              <span>Chamar no WhatsApp</span>
            </button>
            <a href="/" className="portal-btn portal-btn--ghost">
              <span>Ver Planos no Site</span>
            </a>
          </div>
        </section>
      </main>

      {/* ── Rodapé do Portal ── */}
      <footer className="portal-footer">
        <p>© {new Date().getFullYear()} HelpClin & Helpchat - Soluções em Tecnologia e Gestão SaaS. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}

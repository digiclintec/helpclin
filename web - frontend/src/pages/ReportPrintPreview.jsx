import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  FileText,
  Laptop,
  Maximize2,
  Printer,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Wrench
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import {
  getInventory,
  getServiceOrders,
  getStoredUser,
  getSupportTickets
} from '../services/api.js';
import {
  getDaysSinceCompletion,
  getEffectiveOrderStatus,
  getOrderStatusBadgeClass,
  getOrderStatusLabel,
  isBillingPending,
  isBilled,
  isPaymentInformed
} from '../utils/billingUtils.js';

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (isNaN(date.getTime())) return '—';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year}, ${hours}:${minutes}`;
}

function getPriorityLabel(priority) {
  const p = (priority || '').toLowerCase();
  if (['low', 'pouco urgente', 'baixa'].includes(p)) return 'Pouco urgente';
  if (p === 'normal') return 'Normal';
  if (['high', 'alta'].includes(p)) return 'Alta';
  if (['urgent', 'urgente'].includes(p)) return 'Urgente';
  return priority || 'Normal';
}

function getPriorityClass(priority) {
  const p = (priority || '').toLowerCase();
  if (['urgent', 'urgente'].includes(p)) return 'badge--urgent';
  if (['high', 'alta'].includes(p)) return 'badge--high';
  if (['low', 'baixa'].includes(p)) return 'badge--low';
  return 'badge--normal';
}

export default function ReportPrintPreview() {
  const searchParams = new URLSearchParams(window.location.search);
  const tipoParam = searchParams.get('tipo') || 'ordens'; // 'ordens' | 'chamados' | 'inventario'
  const orientacaoParam = searchParams.get('orientacao') || 'landscape'; // 'landscape' | 'portrait'

  const [orientation, setOrientation] = useState(orientacaoParam);
  const [reportType, setReportType] = useState(tipoParam);
  const [orders, setOrders] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [lastUpdated, setLastUpdated] = useState(() => new Date());

  // Load fresh data directly from backend database API
  async function loadData() {
    setIsLoading(true);
    setErrorMessage('');
    try {
      if (reportType === 'ordens') {
        const data = await getServiceOrders();
        setOrders(data || []);
      } else if (reportType === 'chamados') {
        const data = await getSupportTickets();
        setTickets(data || []);
      } else if (reportType === 'inventario') {
        const data = await getInventory();
        setInventory(data || []);
      }
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Erro ao buscar dados do relatório:', err);
      setErrorMessage(err.message || 'Não foi possível carregar os dados atualizados.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [reportType]);

  // Compute KPIs dynamically for Service Orders
  const orderKpis = useMemo(() => {
    let open = 0;
    let inProgress = 0;
    let completed = 0;
    let billingPending = 0;
    let billed = 0;
    let urgent = 0;

    orders.forEach((o) => {
      const eff = getEffectiveOrderStatus(o);
      if (eff === 'open') open++;
      else if (eff === 'in_progress') inProgress++;
      else if (eff === 'completed') completed++;
      else if (eff === 'billing_pending') billingPending++;
      else if (eff === 'billed') billed++;

      const p = (o.priority || '').toLowerCase();
      if (p === 'urgent' || p === 'urgente') urgent++;
    });

    return {
      total: orders.length,
      open,
      inProgress,
      completed,
      billingPending,
      billed,
      urgent
    };
  }, [orders]);

  // Compute KPIs dynamically for Tickets
  const ticketKpis = useMemo(() => {
    let unassigned = 0;
    let inProgress = 0;
    let resolved = 0;
    let urgent = 0;

    tickets.forEach((t) => {
      if (!t.assigned_to) unassigned++;
      if (t.status === 'in_progress') inProgress++;
      if (t.status === 'resolved') resolved++;
      const p = (t.priority || '').toLowerCase();
      if (p === 'urgent' || p === 'urgente') urgent++;
    });

    return {
      total: tickets.length,
      unassigned,
      inProgress,
      resolved,
      urgent
    };
  }, [tickets]);

  // Format emission timestamp
  const emissionString = useMemo(() => {
    const day = String(lastUpdated.getDate()).padStart(2, '0');
    const month = String(lastUpdated.getMonth() + 1).padStart(2, '0');
    const year = lastUpdated.getFullYear();
    const hours = String(lastUpdated.getHours()).padStart(2, '0');
    const minutes = String(lastUpdated.getMinutes()).padStart(2, '0');
    const seconds = String(lastUpdated.getSeconds()).padStart(2, '0');
    return `${day}/${month}/${year} às ${hours}:${minutes}:${seconds}`;
  }, [lastUpdated]);

  function handleToggleOrientation() {
    setOrientation((prev) => (prev === 'landscape' ? 'portrait' : 'landscape'));
  }

  function handlePrint() {
    window.print();
  }

  function handleGoBack() {
    if (reportType === 'chamados') window.location.href = '/chamados';
    else if (reportType === 'inventario') window.location.href = '/inventario';
    else window.location.href = '/ordens';
  }

  return (
    <div className="report-preview-page">
      {/* Dynamic Print CSS */}
      <style>{`
        @page {
          size: A4 ${orientation};
          margin: 6mm 6mm;
        }

        @media print {
          body {
            background: #ffffff !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .report-preview-action-bar {
            display: none !important;
          }
          .report-preview-document {
            max-width: 100% !important;
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}</style>

      {/* 1. TOP ACTION BAR (Hidden when printing or saving PDF) */}
      <header className="report-preview-action-bar">
        <div className="action-bar-left">
          <span className="action-bar-badge">
            <span className="pulse-dot" />
            Visualização de Impressão Oficial (A4)
          </span>
          <span className="action-bar-hint">
            Pressione <strong>F5</strong> a qualquer momento para recarregar com as últimas alterações do banco.
          </span>
        </div>

        <div className="action-bar-controls">
          <button
            type="button"
            className="btn-action btn-refresh"
            onClick={loadData}
            disabled={isLoading}
            title="Recarrega as informações mais recentes das ordens e chamados"
          >
            <RefreshCw size={15} className={isLoading ? 'spin-icon' : ''} />
            <span>{isLoading ? 'Atualizando...' : 'Atualizar Dados (F5)'}</span>
          </button>

          <button
            type="button"
            className="btn-action btn-orient"
            onClick={handleToggleOrientation}
            title="Alterna o formato da folha A4 entre Paisagem e Retrato"
          >
            <RotateCcw size={15} />
            <span>{orientation === 'landscape' ? 'Alternar para Retrato' : 'Alternar para Paisagem (Ideal)'}</span>
          </button>

          <button
            type="button"
            className="btn-action btn-close"
            onClick={handleGoBack}
            title="Fechar relatório e voltar para o sistema"
          >
            <ArrowLeft size={15} />
            <span>Voltar ao Sistema</span>
          </button>

          <button
            type="button"
            className="btn-action btn-print"
            onClick={handlePrint}
            title="Abrir diálogo de impressão do navegador ou salvar em PDF"
          >
            <Printer size={16} />
            <span>Imprimir / Salvar PDF</span>
          </button>
        </div>
      </header>

      {errorMessage && (
        <div className="report-preview-error">
          <AlertTriangle size={16} />
          <span>{errorMessage}</span>
          <button type="button" onClick={loadData}>Tentar novamente</button>
        </div>
      )}

      {/* 2. DOCUMENT PAPER (Simulates A4 Paper Layout) */}
      <main
        className={`report-preview-document ${
          orientation === 'landscape' ? 'document--landscape' : 'document--portrait'
        }`}
      >
        {/* Document Header */}
        <header className="document-header">
          <div className="header-brand">
            <div className="brand-logo-mark">H</div>
            <div className="brand-logo-details">
              <h2>help<span>clin</span>tec</h2>
              <p>Tecnologia Inteligente para Gestão e Manutenção Clínica</p>
            </div>
          </div>

          <div className="header-meta">
            <p>Emissão: <strong>{emissionString}</strong></p>
            <p>
              Registros: <strong>{reportType === 'ordens' ? orders.length : reportType === 'chamados' ? tickets.length : inventory.length} item(ns)</strong>
            </p>
            <p>
              Status: <strong className="status-autenticado"><ShieldCheck size={13} /> Documento Autenticado</strong>
            </p>
          </div>
        </header>

        {/* Title Banner */}
        <section className="document-title-banner">
          <h1>
            {reportType === 'ordens' && 'Relatório de Ordens de Serviço'}
            {reportType === 'chamados' && 'Relatório de Chamados Técnicos'}
            {reportType === 'inventario' && 'Relatório de Inventário & Ativos'}
          </h1>
          <p>
            {reportType === 'ordens' && `Listagem consolidada de ${orders.length} ordens de serviço filtradas`}
            {reportType === 'chamados' && `Listagem consolidada de ${tickets.length} chamados de suporte técnico`}
            {reportType === 'inventario' && `Listagem de ${inventory.length} equipamentos e ativos hospitalares`}
          </p>
        </section>

        {/* Summary Metric Cards */}
        {reportType === 'ordens' && (
          <section className="document-summary-grid">
            <div className="summary-box">
              <span>Total Filtrado</span>
              <strong>{orderKpis.total}</strong>
            </div>
            <div className="summary-box summary-box--open">
              <span>Abertas</span>
              <strong>{orderKpis.open}</strong>
            </div>
            <div className="summary-box summary-box--progress">
              <span>Em Andamento</span>
              <strong>{orderKpis.inProgress}</strong>
            </div>
            <div className="summary-box summary-box--completed">
              <span>Concluídas</span>
              <strong>{orderKpis.completed}</strong>
            </div>
            <div className="summary-box summary-box--pending">
              <span>Aguardando Faturamento (Prazo 30 dias)</span>
              <strong>{orderKpis.billingPending}</strong>
            </div>
            <div className="summary-box summary-box--billed">
              <span>Faturadas</span>
              <strong>{orderKpis.billed}</strong>
            </div>
            <div className="summary-box summary-box--urgent">
              <span>Urgentes / Atrasadas</span>
              <strong>{orderKpis.urgent}</strong>
            </div>
          </section>
        )}

        {reportType === 'chamados' && (
          <section className="document-summary-grid summary-grid--4">
            <div className="summary-box">
              <span>Total de Chamados</span>
              <strong>{ticketKpis.total}</strong>
            </div>
            <div className="summary-box summary-box--open">
              <span>Sem Responsável</span>
              <strong>{ticketKpis.unassigned}</strong>
            </div>
            <div className="summary-box summary-box--progress">
              <span>Em Andamento</span>
              <strong>{ticketKpis.inProgress}</strong>
            </div>
            <div className="summary-box summary-box--completed">
              <span>Resolvidos</span>
              <strong>{ticketKpis.resolved}</strong>
            </div>
          </section>
        )}

        {/* 3. TABLE WITH NEVER-CUT-OFF COLUMNS */}
        <section className="document-table-wrapper">
          {reportType === 'ordens' && (
            <table className="report-table">
              <thead>
                <tr>
                  <th style={{ width: '82px' }}>Prioridade</th>
                  <th style={{ width: '74px' }}>Número OS</th>
                  <th style={{ width: '92px' }}>Estado</th>
                  <th style={{ width: '130px' }}>Solicitante / Setor</th>
                  <th style={{ width: '150px' }}>Equipamento / Ativo</th>
                  <th style={{ width: '130px' }}>Responsável Técnico</th>
                  <th style={{ width: '130px' }}>Tipo de Serviço</th>
                  <th style={{ width: '105px' }}>Criada em</th>
                  <th style={{ width: '105px' }}>Concluída em</th>
                  {/* CRITICAL FIX: Explicit header, proper width, wrapping, never truncated */}
                  <th style={{ width: '135px' }} className="th-billing">
                    Data do Faturamento / Pagamento
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="table-empty-cell">
                      {isLoading ? 'Carregando registros do servidor...' : 'Nenhuma ordem de serviço encontrada.'}
                    </td>
                  </tr>
                ) : (
                  orders.map((o) => {
                    const eff = getEffectiveOrderStatus(o);
                    const billedDate = o.billed_at || (o.status === 'billed' ? o.updated_at : null);

                    return (
                      <tr key={o.id}>
                        <td>
                          <span className={`table-badge ${getPriorityClass(o.priority)}`}>
                            {getPriorityLabel(o.priority)}
                          </span>
                        </td>
                        <td>
                          <strong className="os-number">
                            OS-{String(o.order_number || o.id).padStart(5, '0')}
                          </strong>
                        </td>
                        <td>
                          <span className={`table-badge badge--${eff}`}>
                            {getOrderStatusLabel(eff)}
                          </span>
                        </td>
                        <td>
                          <div className="cell-main-text" title={o.patient_name || 'Setor Não Informado'}>
                            {o.patient_name || 'Setor Não Informado'}
                          </div>
                        </td>
                        <td>
                          <div className="cell-sub-item">
                            <span className="cell-icon">
                              {o.equipment_name ? <Laptop size={12} /> : <Wrench size={12} />}
                            </span>
                            <span className="cell-main-text" title={o.equipment_name || 'Serviço Geral'}>
                              {o.equipment_name || 'Serviço Geral'}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="cell-main-text" title={o.technician_name || 'Não atribuído'}>
                            {o.technician_name || 'Não atribuído'}
                          </div>
                        </td>
                        <td>
                          <div className="cell-service-type" title={o.service_type || 'Manutenção'}>
                            {o.service_type || 'Manutenção'}
                          </div>
                        </td>
                        <td className="cell-date">
                          {formatDate(o.created_at)}
                        </td>
                        <td className="cell-date">
                          {formatDate(o.completed_at)}
                        </td>
                        <td className="cell-billing">
                          {o.status === 'billed' || eff === 'billed' ? (
                            <div className="billing-paid">
                              <span className="billing-tag billing-tag--paid">
                                <CheckCircle2 size={11} /> Faturada
                              </span>
                              <span className="billing-date">
                                {formatDate(billedDate)}
                              </span>
                            </div>
                          ) : isBillingPending(o) ? (
                            <div className="billing-pending">
                              <span className="billing-tag billing-tag--pending">
                                <Clock size={11} /> Aguardando Faturamento
                              </span>
                              <span className="billing-sub">
                                ({getDaysSinceCompletion(o)}/30 dias)
                              </span>
                            </div>
                          ) : (
                            <div className="billing-open">
                              <span className="billing-tag billing-tag--open">
                                Em atendimento
                              </span>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}

          {reportType === 'chamados' && (
            <table className="report-table">
              <thead>
                <tr>
                  <th style={{ width: '85px' }}>Prioridade</th>
                  <th style={{ width: '90px' }}>Nº Chamado / OS</th>
                  <th style={{ width: '95px' }}>Estado</th>
                  <th style={{ width: '140px' }}>Setor / Empresa</th>
                  <th style={{ width: '160px' }}>Ativo / Serviço</th>
                  <th style={{ width: '140px' }}>Responsável</th>
                  <th>Problema Relatado</th>
                  <th style={{ width: '130px' }}>Solicitante</th>
                  <th style={{ width: '110px' }}>Data Abertura</th>
                </tr>
              </thead>
              <tbody>
                {tickets.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="table-empty-cell">
                      {isLoading ? 'Carregando chamados do servidor...' : 'Nenhum chamado técnico registrado.'}
                    </td>
                  </tr>
                ) : (
                  tickets.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <span className={`table-badge ${getPriorityClass(t.priority)}`}>
                          {getPriorityLabel(t.priority)}
                        </span>
                      </td>
                      <td>
                        <strong className="os-number">
                          OS-{String(t.service_order_number || t.ticket_number || t.id).padStart(5, '0')}
                        </strong>
                      </td>
                      <td>
                        <span className={`table-badge badge--${t.status === 'resolved' ? 'completed' : t.status}`}>
                          {t.status === 'resolved' ? 'Resolvido' : t.status === 'in_progress' ? 'Em andamento' : 'Aberto'}
                        </span>
                      </td>
                      <td>{t.company_sector || '—'}</td>
                      <td>{t.equipment_name || (t.ticket_type === 'equipment' ? 'Equipamento' : 'Serviço Geral')}</td>
                      <td>{t.assigned_to_name || 'Sem responsável'}</td>
                      <td>{t.related_problem || t.observations || '—'}</td>
                      <td>{t.requester || '—'}</td>
                      <td className="cell-date">{formatDate(t.created_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </section>

        {/* Document Footer */}
        <footer className="document-footer">
          <p>
            <strong>HelpClinTec</strong> • Sistema Integrado de Gestão Clínica e Suporte em Engenharia
          </p>
          <p className="footer-confidential">
            Documento Oficial Confidencial • Emitido pelo Painel de Controle • Página 1 de 1
          </p>
        </footer>
      </main>

      {/* Embedded Component CSS */}
      <style>{`
        .report-preview-page {
          min-height: 100vh;
          background: #eef3f0;
          padding: 24px 16px 60px 16px;
          font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #143b3d;
        }

        .report-preview-action-bar {
          max-width: 1140px;
          margin: 0 auto 20px auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          padding: 12px 20px;
          background: #ffffff;
          border: 1px solid #dce7df;
          border-radius: 12px;
          box-shadow: 0 4px 18px rgba(18, 59, 61, 0.06);
        }

        .action-bar-left {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .action-bar-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 4px 10px;
          border-radius: 20px;
          background: #e6f6ee;
          color: #0f6244;
          font-size: 12px;
          font-weight: 700;
        }

        .pulse-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #059669;
          animation: pulse 1.8s infinite;
        }

        @keyframes pulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(5, 150, 105, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(5, 150, 105, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(5, 150, 105, 0); }
        }

        .action-bar-hint {
          font-size: 12px;
          color: #5d7570;
        }

        .action-bar-controls {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .btn-action {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 38px;
          padding: 0 14px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.15s ease;
          border: 1px solid transparent;
        }

        .btn-refresh {
          background: #f1f7f4;
          color: #1c5446;
          border-color: #cde0d5;
        }
        .btn-refresh:hover {
          background: #e2f0e8;
        }

        .btn-orient {
          background: #ffffff;
          color: #123b3d;
          border-color: #dce7df;
        }
        .btn-orient:hover {
          background: #f8faf9;
          border-color: #c2d8c9;
        }

        .btn-close {
          background: #ffffff;
          color: #64748b;
          border-color: #dce7df;
        }
        .btn-close:hover {
          background: #f8fafc;
          color: #1e293b;
        }

        .btn-print {
          background: #123b3d;
          color: #ffffff;
          font-weight: 700;
          box-shadow: 0 3px 10px rgba(18, 59, 61, 0.2);
        }
        .btn-print:hover {
          background: #184b4d;
          transform: translateY(-1px);
        }

        .spin-icon {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .report-preview-error {
          max-width: 1140px;
          margin: 0 auto 16px auto;
          padding: 10px 16px;
          background: #fee2e2;
          color: #991b1b;
          border-radius: 8px;
          border: 1px solid #fecaca;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
        }
        .report-preview-error button {
          margin-left: auto;
          background: #991b1b;
          color: #fff;
          border: 0;
          padding: 4px 10px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
        }

        /* 2. DOCUMENT PAPER */
        .report-preview-document {
          margin: 0 auto;
          background: #ffffff;
          padding: 32px 36px;
          border: 1px solid #dce7df;
          border-radius: 14px;
          box-shadow: 0 8px 30px rgba(18, 59, 61, 0.08);
          box-sizing: border-box;
          transition: max-width 0.25s ease;
        }

        .document--landscape {
          max-width: 1140px;
        }

        .document--portrait {
          max-width: 860px;
        }

        /* Header */
        .document-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #123b3d;
          padding-bottom: 18px;
          margin-bottom: 22px;
          gap: 16px;
        }

        .header-brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .brand-logo-mark {
          display: grid;
          place-items: center;
          width: 44px;
          height: 44px;
          background: #e78368;
          color: #ffffff;
          border-radius: 12px;
          font-weight: 800;
          font-size: 22px;
          box-shadow: 0 4px 12px rgba(231, 131, 104, 0.3);
        }

        .brand-logo-details h2 {
          font-family: 'Manrope', sans-serif;
          font-size: 24px;
          font-weight: 800;
          color: #123b3d;
          letter-spacing: -0.5px;
          margin: 0;
          line-height: 1.1;
        }

        .brand-logo-details h2 span {
          color: #e78368;
        }

        .brand-logo-details p {
          font-size: 11px;
          color: #64748b;
          margin: 3px 0 0 0;
          font-weight: 500;
        }

        .header-meta {
          text-align: right;
          background: #f8faf8;
          border: 1px solid #e2ece5;
          padding: 8px 14px;
          border-radius: 8px;
          font-size: 11px;
          color: #64748b;
          line-height: 1.6;
        }

        .header-meta strong {
          color: #123b3d;
        }

        .status-autenticado {
          color: #059669 !important;
          display: inline-flex;
          align-items: center;
          gap: 3px;
        }

        /* Title Banner */
        .document-title-banner {
          text-align: center;
          margin: 0 auto 22px auto;
          max-width: 680px;
          padding: 14px 22px;
          background: linear-gradient(180deg, #f7faf8 0%, #ffffff 100%);
          border: 1px solid #e1eee6;
          border-radius: 10px;
        }

        .document-title-banner h1 {
          font-family: 'Manrope', sans-serif;
          font-size: 20px;
          font-weight: 800;
          color: #123b3d;
          margin: 0 0 4px 0;
          letter-spacing: -0.3px;
        }

        .document-title-banner p {
          font-size: 12px;
          color: #59716e;
          margin: 0;
        }

        /* Summary Grid */
        .document-summary-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 8px;
          margin-bottom: 22px;
        }

        .summary-grid--4 {
          grid-template-columns: repeat(4, 1fr);
        }

        .summary-box {
          background: #ffffff;
          border: 1px solid #dce7df;
          border-top: 3px solid #123b3d;
          border-radius: 8px;
          padding: 10px 8px;
          text-align: center;
          box-shadow: 0 2px 6px rgba(18, 59, 61, 0.02);
        }

        .summary-box--open { border-top-color: #059669; }
        .summary-box--progress { border-top-color: #d97706; }
        .summary-box--completed { border-top-color: #2563eb; }
        .summary-box--pending { border-top-color: #ea580c; }
        .summary-box--billed { border-top-color: #0d9488; }
        .summary-box--urgent { border-top-color: #dc2626; }

        .summary-box span {
          display: block;
          font-size: 9.5px;
          color: #64748b;
          font-weight: 700;
          text-transform: uppercase;
          margin-bottom: 4px;
          line-height: 1.2;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .summary-box strong {
          display: block;
          font-family: 'Manrope', sans-serif;
          font-size: 18px;
          font-weight: 800;
          color: #123b3d;
        }

        /* Table */
        .document-table-wrapper {
          width: 100%;
          overflow-x: auto;
          border: 1px solid #dce7df;
          border-radius: 10px;
          margin-bottom: 24px;
        }

        .report-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 10.5px;
          text-align: left;
        }

        .report-table thead tr {
          background: #123b3d;
          color: #ffffff;
        }

        .report-table th {
          padding: 9px 8px;
          font-weight: 700;
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          border-bottom: 2px solid #0d2a2b;
          line-height: 1.3;
          /* CRITICAL: Allow wrapping in table header so wide titles are never truncated */
          white-space: normal !important;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }

        .th-billing {
          background: #0f3234;
          color: #a7f3d0;
        }

        .report-table td {
          padding: 8px 8px;
          border-bottom: 1px solid #e7efe9;
          color: #223532;
          vertical-align: middle;
          font-size: 10.5px;
          line-height: 1.35;
        }

        .report-table tbody tr:nth-child(even) {
          background: #fbfdfc;
        }

        .report-table tbody tr:hover {
          background: #f3f8f5;
        }

        .table-empty-cell {
          text-align: center;
          padding: 36px 16px !important;
          color: #64748b;
          font-size: 13px;
        }

        /* Table Badges */
        .table-badge {
          display: inline-block;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
        }

        .badge--urgent { background: #fee2e2; color: #dc2626; }
        .badge--high { background: #ffedd5; color: #ea580c; }
        .badge--normal { background: #f1f5f9; color: #475569; }
        .badge--low { background: #e0f2fe; color: #0284c7; }

        .badge--open { background: #dcfce7; color: #15803d; }
        .badge--in_progress { background: #fef3c7; color: #b45309; }
        .badge--completed { background: #dbeafe; color: #1d4ed8; }
        .badge--billing_pending { background: #fff7ed; color: #c2410c; }
        .badge--billed { background: #ccfbf1; color: #0f766e; }

        .os-number {
          color: #123b3d;
          font-size: 11px;
          font-weight: 800;
          white-space: nowrap;
        }

        .cell-main-text {
          font-weight: 600;
          color: #143b3d;
          font-size: 10.5px;
          line-height: 1.25;
          word-break: break-word;
        }

        .cell-sub-item {
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .cell-icon {
          color: #4b8391;
          display: inline-flex;
          flex-shrink: 0;
        }

        .cell-service-type {
          font-size: 10px;
          color: #3b504d;
          line-height: 1.2;
          word-break: break-word;
        }

        .cell-date {
          font-size: 10px;
          color: #556c67;
          white-space: nowrap;
        }

        .cell-billing {
          vertical-align: middle;
        }

        .billing-paid {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .billing-tag {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 9.5px;
          font-weight: 700;
          width: fit-content;
        }

        .billing-tag--paid {
          background: #d1fae5;
          color: #065f46;
        }

        .billing-tag--pending {
          background: #ffedd5;
          color: #9a3412;
        }

        .billing-tag--open {
          background: #f1f5f9;
          color: #475569;
        }

        .billing-date {
          font-size: 9.5px;
          font-weight: 700;
          color: #047857;
          white-space: nowrap;
        }

        .billing-sub {
          font-size: 9px;
          color: #c2410c;
        }

        /* Footer */
        .document-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          border-top: 1px solid #dce7df;
          padding-top: 14px;
          font-size: 10.5px;
          color: #64748b;
        }

        .footer-confidential {
          color: #94a3b8;
          font-size: 10px;
        }
      `}</style>
    </div>
  );
}

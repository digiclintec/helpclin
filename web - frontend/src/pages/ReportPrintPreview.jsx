import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Laptop,
  Printer,
  ShieldCheck,
  Wrench
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import {
  getInventory,
  getServiceOrders,
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

function formatDateParts(value) {
  if (!value) return { date: '—', time: '' };
  const d = new Date(value);
  if (isNaN(d.getTime())) return { date: '—', time: '' };
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return {
    date: `${day}/${month}/${year}`,
    time: `${hours}:${minutes}`
  };
}

function formatDate(value) {
  const { date, time } = formatDateParts(value);
  if (!time) return date;
  return `${date}, ${time}`;
}

function getPriorityLabel(priority) {
  const p = (priority || '').toLowerCase();
  if (['low', 'pouco urgente', 'baixa'].includes(p)) return 'Baixa';
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
  const statusParam = searchParams.get('status') || '';
  const dateFromParam = searchParams.get('dataInicio') || '';
  const dateToParam = searchParams.get('dataFim') || '';

  const [reportType] = useState(tipoParam);
  const [orders, setOrders] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [customTitle, setCustomTitle] = useState('');
  const [customSubtitle, setCustomSubtitle] = useState('');
  const [activeFilterStatus, setActiveFilterStatus] = useState(statusParam);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [lastUpdated, setLastUpdated] = useState(() => new Date());

  function applyOrderFilters(rawOrders, filterStatus, dateFrom, dateTo) {
    if (!filterStatus && !dateFrom && !dateTo) return rawOrders;
    return rawOrders.filter((o) => {
      const eff = getEffectiveOrderStatus(o);
      const billed = isBilled(o) || o.status === 'billed';

      if (filterStatus === 'billed' && !billed) return false;
      if (filterStatus === 'billing_pending' && eff !== 'billing_pending') return false;
      if (filterStatus === 'open' && eff !== 'open') return false;
      if (filterStatus === 'in_progress' && eff !== 'in_progress') return false;
      if (filterStatus === 'completed' && eff !== 'completed') return false;
      if (filterStatus === 'urgent') {
        const p = (o.priority || '').toLowerCase();
        if (p !== 'urgent' && p !== 'urgente') return false;
      }

      if (dateFrom) {
        const d = new Date(o.created_at);
        if (d < new Date(`${dateFrom}T00:00:00`)) return false;
      }
      if (dateTo) {
        const d = new Date(o.created_at);
        if (d > new Date(`${dateTo}T23:59:59`)) return false;
      }

      return true;
    });
  }

  // Load fresh data directly from backend database API or sessionStorage
  async function loadData(forceApi = false) {
    setIsLoading(true);
    setErrorMessage('');

    // Se houver dados no sessionStorage salvos pelo exportToPdf da tela de relatórios
    if (!forceApi) {
      try {
        const rawPayload = sessionStorage.getItem('helpclin_print_report_payload');
        if (rawPayload) {
          const payload = JSON.parse(rawPayload);
          const isRecent = Date.now() - (payload.timestamp || 0) < 1000 * 60 * 30; // 30 min
          if (isRecent && payload.tipo === reportType && Array.isArray(payload.data)) {
            if (reportType === 'ordens') setOrders(payload.data);
            else if (reportType === 'chamados') setTickets(payload.data);
            else if (reportType === 'inventario') setInventory(payload.data);

            if (payload.title) setCustomTitle(payload.title);
            if (payload.subtitle) setCustomSubtitle(payload.subtitle);
            if (payload.filterStatus) setActiveFilterStatus(payload.filterStatus);

            setLastUpdated(new Date());
            setIsLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Erro ao carregar dados do sessionStorage:', err);
      }
    }

    try {
      const currentFilter = activeFilterStatus || statusParam;
      if (reportType === 'ordens') {
        const data = await getServiceOrders();
        const filtered = applyOrderFilters(data || [], currentFilter, dateFromParam, dateToParam);
        setOrders(filtered);
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

  // Compute KPIs dynamically for Inventory
  const inventoryKpis = useMemo(() => {
    let active = 0;
    let maintenance = 0;
    let inactive = 0;

    inventory.forEach((i) => {
      const s = (i.status || '').toLowerCase();
      if (['active', 'ativo', 'operacional'].includes(s)) active++;
      else if (['maintenance', 'manutencao', 'manutenção'].includes(s)) maintenance++;
      else inactive++;
    });

    return {
      total: inventory.length,
      active,
      maintenance,
      inactive
    };
  }, [inventory]);

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
      {/* Dynamic Print CSS for Standard A4 (Chamex 210mm x 297mm) */}
      <style>{`
        @page {
          size: A4 portrait;
          margin: 6mm 6mm 6mm 6mm;
        }

        @media print {
          html, body {
            width: 210mm !important;
            height: auto !important;
            background: #ffffff !important;
            padding: 0 !important;
            margin: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .report-preview-page {
            padding: 0 !important;
            margin: 0 !important;
            background: #ffffff !important;
          }

          .report-preview-action-bar,
          .report-preview-error {
            display: none !important;
          }

          .report-preview-document {
            width: 100% !important;
            max-width: 100% !important;
            min-height: auto !important;
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            border-radius: 0 !important;
          }

          .report-table {
            page-break-inside: auto;
          }

          .report-table tr {
            page-break-inside: avoid;
            break-inside: avoid;
          }

          .document-header,
          .document-title-banner,
          .document-summary-grid,
          .document-footer {
            page-break-inside: avoid;
            break-inside: avoid;
          }
        }
      `}</style>

      {/* 1. TOP ACTION BAR (Clean: Removed 'Atualizar Dados' and 'Alternar Orientação') */}
      <header className="report-preview-action-bar">
        <div className="action-bar-left">
          <span className="action-bar-badge">
            <span className="pulse-dot" />
            Padrão A4 (Chamex) • Folha Única
          </span>
          <span className="action-bar-hint">
            Pressione <strong>F5</strong> no teclado para atualizar dados do banco.
          </span>
        </div>

        <div className="action-bar-controls">
          <button
            type="button"
            className="btn-action btn-close"
            onClick={handleGoBack}
            title="Voltar ao sistema"
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

      {/* 2. DOCUMENT PAPER (Standard A4 Chamex: 210mm x 297mm) */}
      <main className="report-preview-document">
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
              Status: <strong className="status-autenticado"><ShieldCheck size={12} /> Autenticado</strong>
            </p>
          </div>
        </header>

        {/* Title Banner */}
        <section className="document-title-banner">
          <h1>
            {customTitle || (
              reportType === 'ordens'
                ? ((activeFilterStatus || statusParam) === 'billed'
                    ? 'Relatório Oficial de Ordens Faturadas'
                    : (activeFilterStatus || statusParam) === 'billing_pending'
                    ? 'Relatório Oficial de Ordens Aguardando Faturamento'
                    : 'Relatório Oficial de Ordens de Serviço')
                : reportType === 'chamados'
                ? 'Relatório Oficial de Chamados Técnicos'
                : 'Relatório Oficial de Inventário & Ativos'
            )}
          </h1>
          <p>
            {customSubtitle || (
              reportType === 'ordens'
                ? `Listagem consolidada de ${orders.length} ordens de serviço ${(activeFilterStatus || statusParam) === 'billed' ? 'faturadas' : 'filtradas'}`
                : reportType === 'chamados'
                ? `Listagem consolidada de ${tickets.length} chamados técnicos`
                : `Listagem consolidada de ${inventory.length} equipamentos e ativos`
            )}
          </p>
        </section>

        {/* Summary Metric Cards */}
        {reportType === 'ordens' && (
          <section className="document-summary-grid">
            <div className="summary-box">
              <span>Total</span>
              <strong>{orderKpis.total}</strong>
            </div>
            <div className="summary-box summary-box--open">
              <span>Abertas</span>
              <strong>{orderKpis.open}</strong>
            </div>
            <div className="summary-box summary-box--progress">
              <span>Andamento</span>
              <strong>{orderKpis.inProgress}</strong>
            </div>
            <div className="summary-box summary-box--completed">
              <span>Concluídas</span>
              <strong>{orderKpis.completed}</strong>
            </div>
            <div className="summary-box summary-box--pending">
              <span>Aguardando Fat.</span>
              <strong>{orderKpis.billingPending}</strong>
            </div>
            <div className="summary-box summary-box--billed">
              <span>Faturadas</span>
              <strong>{orderKpis.billed}</strong>
            </div>
            <div className="summary-box summary-box--urgent">
              <span>Urgentes</span>
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

        {reportType === 'inventario' && (
          <section className="document-summary-grid summary-grid--4">
            <div className="summary-box">
              <span>Total de Ativos</span>
              <strong>{inventoryKpis.total}</strong>
            </div>
            <div className="summary-box summary-box--open">
              <span>Operacionais</span>
              <strong>{inventoryKpis.active}</strong>
            </div>
            <div className="summary-box summary-box--progress">
              <span>Em Manutenção</span>
              <strong>{inventoryKpis.maintenance}</strong>
            </div>
            <div className="summary-box summary-box--urgent">
              <span>Inativos / Baixa</span>
              <strong>{inventoryKpis.inactive}</strong>
            </div>
          </section>
        )}

        {/* 3. TABLE WITH OPTIMIZED PROPORTIONS FOR STANDARD A4 (210mm) */}
        <section className="document-table-wrapper">
          {reportType === 'ordens' && (
            <table className="report-table">
              <thead>
                <tr>
                  <th style={{ width: '46px' }}>OS</th>
                  <th style={{ width: '56px' }}>Prioridade</th>
                  <th style={{ width: '68px' }}>Estado</th>
                  <th style={{ width: '105px' }}>Solicitante / Setor</th>
                  <th style={{ width: '115px' }}>Equipamento / Ativo</th>
                  <th style={{ width: '90px' }}>Responsável</th>
                  <th style={{ width: '75px' }}>Serviço</th>
                  <th style={{ width: '62px' }}>Criada em</th>
                  <th style={{ width: '62px' }}>Concluída em</th>
                  {/* CRITICAL: Explicit header, proper width, wrapping, never truncated */}
                  <th style={{ width: '84px' }} className="th-billing">
                    Data Fat. / Pagamento
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
                    const createdParts = formatDateParts(o.created_at);
                    const completedParts = formatDateParts(o.completed_at);
                    const billedParts = formatDateParts(billedDate);

                    return (
                      <tr key={o.id}>
                        <td>
                          <strong className="os-number">
                            OS-{String(o.order_number || o.id).padStart(5, '0')}
                          </strong>
                        </td>
                        <td>
                          <span className={`table-badge ${getPriorityClass(o.priority)}`}>
                            {getPriorityLabel(o.priority)}
                          </span>
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
                              {o.equipment_name ? <Laptop size={11} /> : <Wrench size={11} />}
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
                          <span className="date-dmy">{createdParts.date}</span>
                          {createdParts.time && <span className="date-time">{createdParts.time}</span>}
                        </td>
                        <td className="cell-date">
                          <span className="date-dmy">{completedParts.date}</span>
                          {completedParts.time && <span className="date-time">{completedParts.time}</span>}
                        </td>
                        <td className="cell-billing">
                          {o.status === 'billed' || eff === 'billed' ? (
                            <div className="billing-paid">
                              <span className="billing-tag billing-tag--paid">
                                <CheckCircle2 size={9} /> Faturada
                              </span>
                              <span className="billing-date">
                                {billedParts.date}
                                {billedParts.time && <small> {billedParts.time}</small>}
                              </span>
                            </div>
                          ) : isBillingPending(o) ? (
                            <div className="billing-pending">
                              <span className="billing-tag billing-tag--pending">
                                <Clock size={9} /> Aguardando Fat.
                              </span>
                              <span className="billing-sub">
                                ({getDaysSinceCompletion(o)}/30d)
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
                  <th style={{ width: '56px' }}>Prioridade</th>
                  <th style={{ width: '55px' }}>Nº OS</th>
                  <th style={{ width: '70px' }}>Estado</th>
                  <th style={{ width: '110px' }}>Setor / Empresa</th>
                  <th style={{ width: '115px' }}>Ativo / Serviço</th>
                  <th style={{ width: '95px' }}>Responsável</th>
                  <th>Problema Relatado</th>
                  <th style={{ width: '95px' }}>Solicitante</th>
                  <th style={{ width: '64px' }}>Data Abertura</th>
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
                  tickets.map((t) => {
                    const createdParts = formatDateParts(t.created_at);
                    return (
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
                        <td><div className="cell-main-text">{t.company_sector || '—'}</div></td>
                        <td><div className="cell-main-text">{t.equipment_name || (t.ticket_type === 'equipment' ? 'Equipamento' : 'Serviço Geral')}</div></td>
                        <td><div className="cell-main-text">{t.assigned_to_name || 'Sem responsável'}</div></td>
                        <td><div className="cell-service-type">{t.related_problem || t.observations || '—'}</div></td>
                        <td><div className="cell-main-text">{t.requester || '—'}</div></td>
                        <td className="cell-date">
                          <span className="date-dmy">{createdParts.date}</span>
                          {createdParts.time && <span className="date-time">{createdParts.time}</span>}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}

          {reportType === 'inventario' && (
            <table className="report-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>Código</th>
                  <th>Nome do Equipamento</th>
                  <th style={{ width: '70px' }}>Estado</th>
                  <th style={{ width: '110px' }}>Setor / Local</th>
                  <th style={{ width: '120px' }}>Fabricante / Modelo</th>
                  <th style={{ width: '90px' }}>Nº de Série</th>
                  <th style={{ width: '65px' }}>Atualizado</th>
                </tr>
              </thead>
              <tbody>
                {inventory.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="table-empty-cell">
                      {isLoading ? 'Carregando inventário...' : 'Nenhum equipamento registrado.'}
                    </td>
                  </tr>
                ) : (
                  inventory.map((item) => {
                    const upParts = formatDateParts(item.last_maintenance_at || item.updated_at);
                    return (
                      <tr key={item.id}>
                        <td><strong className="os-number">{item.asset_tag || item.code || `EQ-${item.id}`}</strong></td>
                        <td><div className="cell-main-text">{item.name || '—'}</div></td>
                        <td>
                          <span className={`table-badge badge--${item.status === 'active' ? 'open' : item.status === 'maintenance' ? 'in_progress' : 'low'}`}>
                            {item.status === 'active' ? 'Ativo' : item.status === 'maintenance' ? 'Manutenção' : item.status || 'Ativo'}
                          </span>
                        </td>
                        <td><div className="cell-main-text">{item.location || item.sector || '—'}</div></td>
                        <td><div className="cell-service-type">{item.manufacturer ? `${item.manufacturer} ${item.model || ''}` : item.model || '—'}</div></td>
                        <td><div className="cell-service-type">{item.serial_number || '—'}</div></td>
                        <td className="cell-date">
                          <span className="date-dmy">{upParts.date}</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </section>

        {/* Document Footer */}
        <footer className="document-footer">
          <p>
            <strong>HelpClinTec</strong> • Sistema Integrado de Gestão Clínica e Engenharia Biomédica
          </p>
          <p className="footer-confidential">
            Documento Oficial Autenticado • Emitido pelo Painel de Controle • Página 1 de 1
          </p>
        </footer>
      </main>

      {/* Embedded Component CSS */}
      <style>{`
        .report-preview-page {
          min-height: 100vh;
          background: #eef3f0;
          padding: 18px 12px 40px 12px;
          font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #143b3d;
        }

        .report-preview-action-bar {
          width: 210mm;
          max-width: 100%;
          margin: 0 auto 14px auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
          padding: 10px 16px;
          background: #ffffff;
          border: 1px solid #dce7df;
          border-radius: 10px;
          box-shadow: 0 4px 16px rgba(18, 59, 61, 0.05);
          box-sizing: border-box;
        }

        .action-bar-left {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .action-bar-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 9px;
          border-radius: 20px;
          background: #e6f6ee;
          color: #0f6244;
          font-size: 11.5px;
          font-weight: 700;
        }

        .pulse-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #059669;
          animation: pulse 1.8s infinite;
        }

        @keyframes pulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(5, 150, 105, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 5px rgba(5, 150, 105, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(5, 150, 105, 0); }
        }

        .action-bar-hint {
          font-size: 11.5px;
          color: #5d7570;
        }

        .action-bar-controls {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-action {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 36px;
          padding: 0 14px;
          border-radius: 8px;
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.15s ease;
          border: 1px solid transparent;
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

        .report-preview-error {
          width: 210mm;
          max-width: 100%;
          margin: 0 auto 14px auto;
          padding: 10px 14px;
          background: #fee2e2;
          color: #991b1b;
          border-radius: 8px;
          border: 1px solid #fecaca;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 12.5px;
          box-sizing: border-box;
        }
        .report-preview-error button {
          margin-left: auto;
          background: #991b1b;
          color: #fff;
          border: 0;
          padding: 4px 10px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 11.5px;
        }

        /* 2. DOCUMENT PAPER (Standard A4 Chamex: 210mm x 297mm) */
        .report-preview-document {
          margin: 0 auto;
          background: #ffffff;
          width: 210mm;
          max-width: 100%;
          min-height: 297mm;
          padding: 7mm 7mm;
          border: 1px solid #dce7df;
          border-radius: 4px;
          box-shadow: 0 4px 24px rgba(18, 59, 61, 0.08);
          box-sizing: border-box;
          font-size: 8pt;
        }

        /* Header */
        .document-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #123b3d;
          padding-bottom: 8px;
          margin-bottom: 8px;
          gap: 12px;
        }

        .header-brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .brand-logo-mark {
          display: grid;
          place-items: center;
          width: 34px;
          height: 34px;
          background: #e78368;
          color: #ffffff;
          border-radius: 8px;
          font-weight: 800;
          font-size: 17px;
          box-shadow: 0 2px 8px rgba(231, 131, 104, 0.3);
        }

        .brand-logo-details h2 {
          font-family: 'Manrope', sans-serif;
          font-size: 19px;
          font-weight: 800;
          color: #123b3d;
          letter-spacing: -0.4px;
          margin: 0;
          line-height: 1.05;
        }

        .brand-logo-details h2 span {
          color: #e78368;
        }

        .brand-logo-details p {
          font-size: 9px;
          color: #64748b;
          margin: 2px 0 0 0;
          font-weight: 500;
        }

        .header-meta {
          text-align: right;
          background: #f8faf8;
          border: 1px solid #e2ece5;
          padding: 5px 10px;
          border-radius: 6px;
          font-size: 8pt;
          color: #64748b;
          line-height: 1.35;
        }
        .header-meta p {
          margin: 0;
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
          margin: 0 auto 8px auto;
          padding: 6px 14px;
          background: linear-gradient(180deg, #f7faf8 0%, #ffffff 100%);
          border: 1px solid #e1eee6;
          border-radius: 6px;
        }

        .document-title-banner h1 {
          font-family: 'Manrope', sans-serif;
          font-size: 13pt;
          font-weight: 800;
          color: #123b3d;
          margin: 0 0 2px 0;
          letter-spacing: -0.2px;
        }

        .document-title-banner p {
          font-size: 8pt;
          color: #59716e;
          margin: 0;
        }

        /* Summary Grid */
        .document-summary-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 4px;
          margin-bottom: 8px;
        }

        .summary-grid--4 {
          grid-template-columns: repeat(4, 1fr);
        }

        .summary-box {
          background: #ffffff;
          border: 1px solid #dce7df;
          border-top: 2.5px solid #123b3d;
          border-radius: 6px;
          padding: 4px 2px;
          text-align: center;
          box-shadow: 0 1px 4px rgba(18, 59, 61, 0.02);
        }

        .summary-box--open { border-top-color: #059669; }
        .summary-box--progress { border-top-color: #d97706; }
        .summary-box--completed { border-top-color: #2563eb; }
        .summary-box--pending { border-top-color: #ea580c; }
        .summary-box--billed { border-top-color: #0d9488; }
        .summary-box--urgent { border-top-color: #dc2626; }

        .summary-box span {
          display: block;
          font-size: 6.8pt;
          color: #64748b;
          font-weight: 700;
          text-transform: uppercase;
          margin-bottom: 2px;
          line-height: 1.1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .summary-box strong {
          display: block;
          font-family: 'Manrope', sans-serif;
          font-size: 12.5pt;
          font-weight: 800;
          color: #123b3d;
          line-height: 1.05;
        }

        /* Table */
        .document-table-wrapper {
          width: 100%;
          border: 1px solid #dce7df;
          border-radius: 6px;
          margin-bottom: 10px;
          overflow: hidden;
        }

        .report-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 8pt;
          text-align: left;
          table-layout: auto;
        }

        .report-table thead tr {
          background: #123b3d;
          color: #ffffff;
        }

        .report-table th {
          padding: 5px 4px;
          font-weight: 700;
          font-size: 7.2pt;
          text-transform: uppercase;
          letter-spacing: 0.2px;
          border-bottom: 1.5px solid #0d2a2b;
          line-height: 1.2;
          white-space: normal !important;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }

        .th-billing {
          background: #0f3234;
          color: #a7f3d0;
          text-align: center;
        }

        .report-table td {
          padding: 4.5px 4px;
          border-bottom: 1px solid #e7efe9;
          color: #223532;
          vertical-align: middle;
          font-size: 8pt;
          line-height: 1.25;
        }

        .report-table tbody tr:nth-child(even) {
          background: #fbfdfc;
        }

        .table-empty-cell {
          text-align: center;
          padding: 24px 12px !important;
          color: #64748b;
          font-size: 9.5pt;
        }

        /* Table Badges */
        .table-badge {
          display: inline-block;
          padding: 1px 4px;
          border-radius: 3px;
          font-size: 7pt;
          font-weight: 700;
          text-transform: uppercase;
          line-height: 1.15;
          white-space: nowrap;
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
          font-size: 8pt;
          font-weight: 800;
          white-space: nowrap;
        }

        .cell-main-text {
          font-weight: 600;
          color: #143b3d;
          font-size: 8pt;
          line-height: 1.2;
          word-break: break-word;
        }

        .cell-sub-item {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .cell-icon {
          color: #4b8391;
          display: inline-flex;
          flex-shrink: 0;
        }

        .cell-service-type {
          font-size: 7.5pt;
          color: #3b504d;
          line-height: 1.15;
          word-break: break-word;
        }

        .cell-date {
          white-space: nowrap;
          line-height: 1.15;
        }

        .date-dmy {
          display: block;
          font-size: 7.5pt;
          font-weight: 600;
          color: #1e293b;
        }

        .date-time {
          display: block;
          font-size: 6.8pt;
          color: #64748b;
        }

        .cell-billing {
          vertical-align: middle;
          text-align: center;
        }

        .billing-paid, .billing-pending, .billing-open {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1px;
        }

        .billing-tag {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          padding: 1px 4px;
          border-radius: 3px;
          font-size: 7pt;
          font-weight: 700;
          width: fit-content;
          white-space: nowrap;
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
          font-size: 7pt;
          font-weight: 700;
          color: #047857;
          white-space: nowrap;
        }

        .billing-sub {
          font-size: 6.5pt;
          color: #c2410c;
        }

        /* Footer */
        .document-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
          border-top: 1px solid #dce7df;
          padding-top: 6px;
          font-size: 7.5pt;
          color: #64748b;
        }
        .document-footer p {
          margin: 0;
        }

        .footer-confidential {
          color: #94a3b8;
          font-size: 7pt;
        }
      `}</style>
    </div>
  );
}

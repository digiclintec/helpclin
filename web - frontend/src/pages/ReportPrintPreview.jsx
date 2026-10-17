import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  DollarSign,
  Headset,
  Laptop,
  Maximize2,
  Printer,
  RotateCcw,
  ShieldCheck,
  Wrench,
  ZoomIn,
  ZoomOut
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
  getOrderCreationToPaymentRelation,
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

function formatDateOnly(value) {
  if (!value) return '—';
  const { date } = formatDateParts(value);
  return date;
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
  const tipoParam = searchParams.get('tipo') || 'ordens'; // 'ordens' | 'chamados' | 'inventario' | 'faturamento'
  const statusParam = searchParams.get('status') || '';
  const dateFromParam = searchParams.get('dataInicio') || '';
  const dateToParam = searchParams.get('dataFim') || '';
  const orientParam = searchParams.get('orientacao') || 'portrait';
  const autoPrintParam = searchParams.get('autoprint') === '1' || searchParams.get('autoPrint') === 'true';

  const [reportType, setReportType] = useState(tipoParam);
  const [orientation, setOrientation] = useState(orientParam === 'landscape' ? 'landscape' : 'portrait');
  const [printScale, setPrintScale] = useState('100%'); // '100%' | '90%' | '80%'
  const [orders, setOrders] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [customTitle, setCustomTitle] = useState('');
  const [customSubtitle, setCustomSubtitle] = useState('');
  const [customSummary, setCustomSummary] = useState([]);
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

  // Load data from localStorage/sessionStorage payload or backend API
  async function loadData(forceApi = false) {
    setIsLoading(true);
    setErrorMessage('');

    if (!forceApi) {
      try {
        const rawPayload = localStorage.getItem('helpclin_print_report_payload') || sessionStorage.getItem('helpclin_print_report_payload');
        if (rawPayload) {
          const payload = JSON.parse(rawPayload);
          const isRecent = Date.now() - (payload.timestamp || 0) < 1000 * 60 * 60 * 2; // 2 hours
          if (isRecent && Array.isArray(payload.data)) {
            const detectedType = payload.tipo || reportType;
            setReportType(detectedType);

            if (detectedType === 'chamados') setTickets(payload.data);
            else if (detectedType === 'inventario') setInventory(payload.data);
            else setOrders(payload.data); // ordens & faturamento

            if (payload.title) setCustomTitle(payload.title);
            if (payload.subtitle) setCustomSubtitle(payload.subtitle);
            if (Array.isArray(payload.summary) && payload.summary.length > 0) {
              setCustomSummary(payload.summary);
            }
            if (payload.orientation) {
              setOrientation(payload.orientation === 'portrait' ? 'portrait' : 'landscape');
            }
            if (payload.filterStatus) setActiveFilterStatus(payload.filterStatus);

            setLastUpdated(new Date());
            setIsLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Erro ao carregar dados do storage:', err);
      }
    }

    try {
      const currentFilter = activeFilterStatus || statusParam;
      if (reportType === 'chamados') {
        const data = await getSupportTickets();
        setTickets(data || []);
      } else if (reportType === 'inventario') {
        const data = await getInventory();
        setInventory(data || []);
      } else {
        // ordens ou faturamento
        const data = await getServiceOrders();
        const filtered = applyOrderFilters(data || [], currentFilter, dateFromParam, dateToParam);
        setOrders(filtered);
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

  // Auto-print effect when autoPrintParam is true
  useEffect(() => {
    if (!isLoading && autoPrintParam) {
      const hasData = (reportType === 'chamados' && tickets.length > 0) ||
                      (reportType === 'inventario' && inventory.length > 0) ||
                      (orders.length > 0);
      if (hasData) {
        const timer = setTimeout(() => {
          window.print();
        }, 550);
        return () => clearTimeout(timer);
      }
    }
  }, [isLoading, autoPrintParam, reportType, orders.length, tickets.length, inventory.length]);

  // Compute KPIs dynamically for Service Orders & Billing
  const orderKpis = useMemo(() => {
    let open = 0;
    let inProgress = 0;
    let completed = 0;
    let billingPending = 0;
    let billed = 0;
    let urgent = 0;
    let totalCycleHours = 0;
    let billedWithCycle = 0;

    orders.forEach((o) => {
      const eff = getEffectiveOrderStatus(o);
      const rel = getOrderCreationToPaymentRelation(o);

      if (eff === 'open') open++;
      else if (eff === 'in_progress') inProgress++;
      else if (eff === 'completed') completed++;
      else if (eff === 'billing_pending') billingPending++;

      if (rel.isBilled) {
        billed++;
        if (rel.cycleHours !== null) {
          totalCycleHours += rel.cycleHours;
          billedWithCycle++;
        }
      }

      const p = (o.priority || '').toLowerCase();
      if (eff !== 'completed' && eff !== 'billed' && (p === 'urgent' || p === 'urgente' || p === 'high')) {
        urgent++;
      }
    });

    let avgCycle = '—';
    if (billedWithCycle > 0) {
      const avgHours = totalCycleHours / billedWithCycle;
      const days = Math.floor(avgHours / 24);
      if (days <= 0) avgCycle = `${Math.max(1, Math.round(avgHours))}h`;
      else if (days === 1) avgCycle = '1 dia';
      else avgCycle = `${days} dias`;
    }

    const billedPercent = orders.length > 0 ? Math.round((billed / orders.length) * 100) : 0;

    return {
      total: orders.length,
      open,
      inProgress,
      completed,
      billingPending,
      billed,
      notBilled: Math.max(0, orders.length - billed),
      urgent,
      avgCycle,
      billedPercent
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
    window.location.href = '/relatorios';
  }

  function toggleOrientation() {
    setOrientation((prev) => (prev === 'landscape' ? 'portrait' : 'landscape'));
  }

  return (
    <div className="report-preview-page">
      {/* 
        CRITICAL: Dynamic Page Setup for Standard ISO A4 (210mm x 297mm)
        - Landscape: 297mm x 210mm
        - Portrait: 210mm x 297mm
        - Safety margin: 8mm
      */}
      <style>{`
        @page {
          size: A4 ${orientation};
          margin: 8mm 8mm 8mm 8mm;
        }

        @media print {
          html, body {
            width: ${orientation === 'landscape' ? '297mm' : '210mm'} !important;
            min-height: ${orientation === 'landscape' ? '210mm' : '297mm'} !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .report-preview-action-bar,
          .report-preview-error,
          .no-print {
            display: none !important;
          }

          .report-preview-page {
            padding: 0 !important;
            margin: 0 !important;
            background: #ffffff !important;
          }

          .report-preview-document {
            width: 100% !important;
            max-width: 100% !important;
            min-height: calc(100vh - 16mm) !important;
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            border-radius: 0 !important;
            display: flex !important;
            flex-direction: column !important;
            zoom: ${printScale === '90%' ? '0.90' : printScale === '80%' ? '0.80' : '1'} !important;
          }

          .document-table-wrapper {
            width: 100% !important;
            flex: 1 0 auto !important;
          }

          .report-table {
            width: 100% !important;
            table-layout: fixed !important;
            page-break-inside: auto;
          }

          .report-table thead {
            display: table-header-group !important;
          }

          .report-table tfoot {
            display: table-footer-group !important;
          }

          .report-table tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          .document-header,
          .document-title-banner,
          .document-summary-grid {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          .document-footer {
            margin-top: auto !important;
            border-top: 1px solid #dce7df !important;
            padding-top: 8px !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>

      {/* 1. TOP ACTION BAR (Clean, intuitive toolbar with A4 controls) */}
      <header className="report-preview-action-bar no-print">
        <div className="action-bar-left">
          <button
            type="button"
            className="btn-action btn-close"
            onClick={handleGoBack}
            title="Voltar à Central de Relatórios"
          >
            <ArrowLeft size={15} />
            <span>Voltar aos Relatórios</span>
          </button>

          <span className="action-bar-badge">
            <span className="pulse-dot" />
            Padrão Folha A4 Oficial ({orientation === 'portrait' ? '210 × 297 mm • Vertical' : '297 × 210 mm • Horizontal'})
          </span>
        </div>

        <div className="action-bar-controls">
          {/* Orientation Toggle */}
          <button
            type="button"
            className="btn-action btn-toggle-orient"
            onClick={toggleOrientation}
            title="Alternar entre Retrato Vertical (210mm) e Paisagem Horizontal (297mm)"
          >
            <Maximize2 size={14} />
            <span>{orientation === 'portrait' ? 'Mudar para A4 Paisagem (Horizontal)' : 'Mudar para A4 Retrato (Vertical)'}</span>
          </button>

          {/* Scale Selector */}
          <div className="scale-control-group" title="Ajuste de escala do documento">
            <span className="scale-label">Escala:</span>
            <button
              type="button"
              className={`scale-btn ${printScale === '100%' ? 'scale-btn--active' : ''}`}
              onClick={() => setPrintScale('100%')}
            >
              100%
            </button>
            <button
              type="button"
              className={`scale-btn ${printScale === '90%' ? 'scale-btn--active' : ''}`}
              onClick={() => setPrintScale('90%')}
              title="Escala 90% (Mais linhas por folha)"
            >
              90%
            </button>
            <button
              type="button"
              className={`scale-btn ${printScale === '80%' ? 'scale-btn--active' : ''}`}
              onClick={() => setPrintScale('80%')}
              title="Escala 80% (Denso)"
            >
              80%
            </button>
          </div>

          {/* Primary Print Button */}
          <button
            type="button"
            className="btn-action btn-print"
            onClick={handlePrint}
            title="Abrir diálogo de impressão do navegador ou salvar em PDF (Ctrl + P)"
          >
            <Printer size={16} />
            <span>Imprimir Folha A4 / Salvar PDF</span>
          </button>
        </div>
      </header>

      {errorMessage && (
        <div className="report-preview-error no-print">
          <AlertTriangle size={16} />
          <span>{errorMessage}</span>
          <button type="button" onClick={() => loadData(true)}>Tentar novamente</button>
        </div>
      )}

      {/* 
        2. DOCUMENT PAPER (Standard ISO A4 Representation)
        - Exact dimensions: 297mm x 210mm (Landscape) or 210mm x 297mm (Portrait)
        - Authentic desk view with paper shadow
      */}
      <main
        className={`report-preview-document ${orientation === 'landscape' ? 'doc--landscape' : 'doc--portrait'}`}
        style={printScale !== '100%' ? { zoom: printScale === '90%' ? '0.90' : '0.80' } : undefined}
      >
        {/* Document Header */}
        <header className="document-header">
          <div className="header-brand">
            <div className="brand-logo-mark">H</div>
            <div className="brand-logo-details">
              <h2>help<span>clin</span>tec</h2>
              <p>Tecnologia Inteligente para Gestão Clínica & Engenharia Biomédica</p>
            </div>
          </div>

          <div className="header-meta">
            <p>Emissão: <strong>{emissionString}</strong></p>
            <p>
              Registros: <strong>{reportType === 'chamados' ? tickets.length : reportType === 'inventario' ? inventory.length : orders.length} item(ns)</strong>
            </p>
            <p>
              Formato: <strong>A4 ({orientation === 'portrait' ? '210 × 297 mm • Vertical' : '297 × 210 mm • Horizontal'})</strong>
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
              reportType === 'faturamento'
                ? 'Relatório Oficial de Auditoria Financeira & Faturamento'
                : reportType === 'chamados'
                ? 'Relatório Oficial de Chamados Técnicos & Suporte'
                : reportType === 'inventario'
                ? 'Relatório Oficial de Inventário & Parque Tecnológico'
                : ((activeFilterStatus || statusParam) === 'billed'
                    ? 'Relatório Oficial de Ordens Faturadas'
                    : (activeFilterStatus || statusParam) === 'billing_pending'
                    ? 'Relatório Oficial de Ordens Aguardando Faturamento'
                    : 'Relatório Oficial de Ordens de Serviço')
            )}
          </h1>
          <p>
            {customSubtitle || (
              reportType === 'faturamento'
                ? `Auditoria e controle do ciclo financeiro de ${orders.length} ordens de serviço`
                : reportType === 'chamados'
                ? `Listagem consolidada de ${tickets.length} chamados técnicos registrados`
                : reportType === 'inventario'
                ? `Listagem consolidada de ${inventory.length} equipamentos e ativos clínicos`
                : `Listagem consolidada de ${orders.length} ordens de serviço ${(activeFilterStatus || statusParam) === 'billed' ? 'faturadas' : 'filtradas'}`
            )}
          </p>
        </section>

        {/* Summary Metric Cards */}
        {customSummary && customSummary.length > 0 ? (
          <section className="document-summary-grid" style={{ gridTemplateColumns: `repeat(${Math.min(customSummary.length, 8)}, 1fr)` }}>
            {customSummary.map((item, idx) => (
              <div key={idx} className="summary-box">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </section>
        ) : reportType === 'faturamento' ? (
          <section className="document-summary-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
            <div className="summary-box">
              <span>Total Auditado</span>
              <strong>{orderKpis.total}</strong>
            </div>
            <div className="summary-box summary-box--billed">
              <span>Faturadas</span>
              <strong>{orderKpis.billed} ({orderKpis.billedPercent}%)</strong>
            </div>
            <div className="summary-box summary-box--pending">
              <span>Aguardando Fat.</span>
              <strong>{orderKpis.billingPending}</strong>
            </div>
            <div className="summary-box" style={{ borderTopColor: '#2563eb' }}>
              <span>Ciclo Médio</span>
              <strong>{orderKpis.avgCycle}</strong>
            </div>
            <div className="summary-box summary-box--urgent">
              <span>Urgentes / Atrasadas</span>
              <strong>{orderKpis.urgent}</strong>
            </div>
          </section>
        ) : reportType === 'ordens' ? (
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
              <strong>{orderKpis.billed} ({orderKpis.billedPercent}%)</strong>
            </div>
            <div className="summary-box summary-box--urgent">
              <span>Urgentes</span>
              <strong>{orderKpis.urgent}</strong>
            </div>
          </section>
        ) : reportType === 'chamados' ? (
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
        ) : (
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

        {/* 
          3. TABLE WITH STRICT 100% WIDTH AND EXACT COLUMN PROPORTIONS FOR A4
          - Never overflows printable boundary
          - Repeating thead on page breaks
          - Zero truncated words
        */}
        <section className="document-table-wrapper">
          {reportType === 'ordens' && (
            <table className="report-table">
              <thead>
                <tr>
                  <th style={{ width: orientation === 'portrait' ? '6.5%' : '6.5%' }}>Nº OS</th>
                  <th style={{ width: orientation === 'portrait' ? '7.5%' : '7%' }}>Prioridade</th>
                  <th style={{ width: orientation === 'portrait' ? '7.5%' : '7.5%' }}>Estado</th>
                  <th style={{ width: orientation === 'portrait' ? '13%' : '14.5%' }}>Solicitante / Setor</th>
                  <th style={{ width: orientation === 'portrait' ? '14%' : '15%' }}>Equipamento / Ativo</th>
                  <th style={{ width: orientation === 'portrait' ? '11.5%' : '12.5%' }}>Responsável</th>
                  <th style={{ width: orientation === 'portrait' ? '10%' : '9%' }}>Serviço</th>
                  <th style={{ width: orientation === 'portrait' ? '9%' : '8%' }}>Criação</th>
                  <th style={{ width: orientation === 'portrait' ? '9%' : '8%' }}>Conclusão</th>
                  <th style={{ width: orientation === 'portrait' ? '12%' : '12%' }} className="th-billing">
                    Faturamento
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
                          <div className="cell-main-text" title={o.patient_name || 'Recepção'}>
                            {o.patient_name || 'Recepção'}
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
                        <td className="cell-date-inline">
                          {createdParts.date && createdParts.date !== '—' ? (
                            <span className="date-single-line">
                              <span className="date-dmy-inline">{createdParts.date}</span>
                              {createdParts.time && <span className="date-time-inline">{createdParts.time}</span>}
                            </span>
                          ) : (
                            <span className="date-empty">—</span>
                          )}
                        </td>
                        <td className="cell-date-inline">
                          {completedParts.date && completedParts.date !== '—' ? (
                            <span className="date-single-line">
                              <span className="date-dmy-inline">{completedParts.date}</span>
                              {completedParts.time && <span className="date-time-inline">{completedParts.time}</span>}
                            </span>
                          ) : (
                            <span className="date-empty">—</span>
                          )}
                        </td>
                        <td className="cell-billing-inline">
                          {o.status === 'billed' || eff === 'billed' ? (
                            <span className="billing-badge-inline billing-badge-inline--paid" title={`Faturada em ${billedParts.date}`}>
                              <CheckCircle2 size={8.5} className="billing-badge-icon" />
                              <span className="billing-badge-status">Faturada</span>
                              {billedParts.date && billedParts.date !== '—' && (
                                <span className="billing-badge-date">{billedParts.date}</span>
                              )}
                            </span>
                          ) : isBillingPending(o) ? (
                            <span className="billing-badge-inline billing-badge-inline--pending" title={`Aguardando faturamento (${getDaysSinceCompletion(o)}/30 dias)`}>
                              <Clock size={8.5} className="billing-badge-icon" />
                              <span className="billing-badge-status">Aguardando</span>
                              <span className="billing-badge-sub">({getDaysSinceCompletion(o)}/30d)</span>
                            </span>
                          ) : (
                            <span className="billing-badge-inline billing-badge-inline--open">
                              <span className="billing-badge-status">Em atendimento</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}

          {reportType === 'faturamento' && (
            <table className="report-table">
              <thead>
                <tr>
                  <th style={{ width: '7%' }}>Nº OS</th>
                  <th style={{ width: '8%' }}>Estado OS</th>
                  <th style={{ width: '15%' }}>Solicitante / Setor</th>
                  <th style={{ width: '15%' }}>Equipamento / Ativo</th>
                  <th style={{ width: '10%' }}>Criada em</th>
                  <th style={{ width: '10%' }}>Concluída em</th>
                  <th style={{ width: '13%' }}>Situação Faturamento</th>
                  <th style={{ width: '10%' }}>Data Pagamento</th>
                  <th style={{ width: '12%' }} className="th-billing">Ciclo Criação ➔ Pgto</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="table-empty-cell">
                      {isLoading ? 'Carregando auditoria de faturamento...' : 'Nenhum registro financeiro encontrado.'}
                    </td>
                  </tr>
                ) : (
                  orders.map((o) => {
                    const eff = getEffectiveOrderStatus(o);
                    const rel = getOrderCreationToPaymentRelation(o);
                    const createdParts = formatDateParts(o.created_at);
                    const completedParts = formatDateParts(o.completed_at);
                    const billedParts = formatDateParts(rel.billedDate);

                    return (
                      <tr key={o.id}>
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
                        <td><div className="cell-main-text">{o.patient_name || 'Recepção'}</div></td>
                        <td><div className="cell-main-text">{o.equipment_name || 'Serviço Geral'}</div></td>
                        <td className="cell-date-inline">
                          <span className="date-single-line">
                            <span className="date-dmy-inline">{createdParts.date}</span>
                          </span>
                        </td>
                        <td className="cell-date-inline">
                          <span className="date-single-line">
                            <span className="date-dmy-inline">{completedParts.date}</span>
                          </span>
                        </td>
                        <td className="cell-billing-inline">
                          {rel.isBilled ? (
                            <span className="billing-badge-inline billing-badge-inline--paid">
                              <CheckCircle2 size={8.5} className="billing-badge-icon" />
                              <span className="billing-badge-status">Faturada (Paga)</span>
                            </span>
                          ) : isBillingPending(o) ? (
                            <span className="billing-badge-inline billing-badge-inline--pending">
                              <Clock size={8.5} className="billing-badge-icon" />
                              <span className="billing-badge-status">Aguardando</span>
                              <span className="billing-badge-sub">({getDaysSinceCompletion(o)}/30d)</span>
                            </span>
                          ) : (
                            <span className="billing-badge-inline billing-badge-inline--open">
                              <span className="billing-badge-status">Em atendimento</span>
                            </span>
                          )}
                        </td>
                        <td className="cell-date-inline">
                          {rel.billedDate ? (
                            <span className="billing-badge-date" style={{ fontWeight: 700, color: '#047857', fontSize: '6.5pt' }}>{billedParts.date}</span>
                          ) : (
                            <span className="date-empty">—</span>
                          )}
                        </td>
                        <td>
                          <div className={`report-relation-pill ${rel.isBilled ? 'report-relation-pill--billed' : 'report-relation-pill--pending'}`} style={{ fontSize: '6.6pt', padding: '1px 5px', whiteSpace: 'nowrap' }}>
                            <Clock size={8.5} /> {rel.elapsedText}
                          </div>
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
                  <th style={{ width: '8%' }}>Prioridade</th>
                  <th style={{ width: '8%' }}>Nº Chamado</th>
                  <th style={{ width: '9%' }}>Estado</th>
                  <th style={{ width: '15%' }}>Setor / Empresa</th>
                  <th style={{ width: '16%' }}>Ativo / Serviço</th>
                  <th style={{ width: '13%' }}>Responsável</th>
                  <th style={{ width: '17%' }}>Problema Relatado</th>
                  <th style={{ width: '7%' }}>Solicitante</th>
                  <th style={{ width: '7%' }}>Data Abertura</th>
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
                            CH-{String(t.service_order_number || t.ticket_number || t.id).padStart(5, '0')}
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
                        <td className="cell-date-inline">
                          <span className="date-single-line">
                            <span className="date-dmy-inline">{createdParts.date}</span>
                            {createdParts.time && <span className="date-time-inline">{createdParts.time}</span>}
                          </span>
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
                  <th style={{ width: '10%' }}>Código / Tag</th>
                  <th style={{ width: '22%' }}>Nome do Equipamento</th>
                  <th style={{ width: '10%' }}>Estado</th>
                  <th style={{ width: '16%' }}>Setor / Local</th>
                  <th style={{ width: '18%' }}>Fabricante / Modelo</th>
                  <th style={{ width: '14%' }}>Nº de Série</th>
                  <th style={{ width: '10%' }}>Atualizado em</th>
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
                        <td className="cell-date-inline">
                          <span className="date-single-line">
                            <span className="date-dmy-inline">{upParts.date}</span>
                          </span>
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
          <p className="footer-company">
            <strong>HelpClinTec</strong> • Sistema Integrado de Gestão Clínica e Engenharia Biomédica
          </p>
          <p className="footer-confidential">
            Documento Oficial Autenticado • Proporção Padrão Folha A4 • Emitido pelo Painel de Controle
          </p>
        </footer>
      </main>

      {/* Embedded Component CSS */}
      <style>{`
        .report-preview-page {
          min-height: 100vh;
          background: #e6ece8;
          padding: 16px 14px 40px 14px;
          font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #143b3d;
        }

        .report-preview-action-bar {
          width: 100%;
          max-width: ${orientation === 'landscape' ? '297mm' : '210mm'};
          margin: 0 auto 16px auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          padding: 10px 18px;
          background: #ffffff;
          border: 1px solid #dce7df;
          border-radius: 10px;
          box-shadow: 0 4px 16px rgba(18, 59, 61, 0.06);
          box-sizing: border-box;
          transition: max-width 0.2s ease;
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
          padding: 4px 10px;
          border-radius: 20px;
          background: #e6f6ee;
          color: #0f6244;
          font-size: 12px;
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
          color: #475569;
          border-color: #dce7df;
        }
        .btn-close:hover {
          background: #f8fafc;
          color: #1e293b;
        }

        .btn-toggle-orient {
          background: #f0f7f3;
          color: #123b3d;
          border-color: #c9ded3;
          font-weight: 700;
        }
        .btn-toggle-orient:hover {
          background: #e2f0e8;
          border-color: #123b3d;
        }

        .scale-control-group {
          display: inline-flex;
          align-items: center;
          background: #f1f5f3;
          border: 1px solid #dce7df;
          border-radius: 8px;
          padding: 2px 4px;
          gap: 2px;
        }
        .scale-label {
          font-size: 11px;
          font-weight: 700;
          color: #64748b;
          padding: 0 4px;
        }
        .scale-btn {
          border: none;
          background: transparent;
          color: #475569;
          font-size: 11px;
          font-weight: 600;
          padding: 3px 6px;
          border-radius: 5px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .scale-btn:hover {
          background: #e2ece5;
        }
        .scale-btn--active {
          background: #ffffff;
          color: #123b3d;
          font-weight: 800;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
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
          width: 100%;
          max-width: ${orientation === 'landscape' ? '297mm' : '210mm'};
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

        /* 
          2. A4 PAPER SHEET CONTAINER 
          - Exact ISO A4 dimensions
          - Realistic sheet shadow & desk feel
        */
        .report-preview-document {
          margin: 0 auto 40px auto;
          background: #ffffff;
          border: 1px solid #c8d8ce;
          border-radius: 4px;
          box-shadow: 0 10px 32px rgba(18, 59, 61, 0.12), 0 2px 6px rgba(0, 0, 0, 0.05);
          box-sizing: border-box;
          font-size: 8pt;
          transition: width 0.25s ease, min-height 0.25s ease;
          display: flex;
          flex-direction: column;
        }

        .document-table-wrapper {
          width: 100%;
          border: 1px solid #dce7df;
          border-radius: 6px;
          margin-bottom: 12px;
          overflow: hidden;
          flex: 1 0 auto;
        }

        .doc--landscape {
          width: 297mm;
          min-height: 210mm;
          max-width: 100%;
          padding: 8mm 10mm;
        }

        .doc--portrait {
          width: 210mm;
          min-height: 297mm;
          max-width: 100%;
          padding: 8mm 9mm;
        }

        .doc--portrait .document-summary-grid {
          grid-template-columns: repeat(4, 1fr) !important;
          gap: 6px !important;
        }

        .doc--portrait .summary-box {
          padding: 5px 6px !important;
        }

        .doc--portrait .summary-box span {
          font-size: 7pt !important;
        }

        .doc--portrait .summary-box strong {
          font-size: 13pt !important;
        }

        .doc--portrait .report-table th {
          padding: 5px 2px !important;
          font-size: 6.5pt !important;
          white-space: nowrap !important;
          letter-spacing: 0px !important;
        }

        .doc--portrait .report-table td {
          padding: 4px 2.5px !important;
          font-size: 6.9pt !important;
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
          font-size: 7.8pt;
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
          padding: 4px 4px;
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
          table-layout: fixed;
        }

        .report-table thead tr {
          background: #123b3d;
          color: #ffffff;
        }

        .report-table th {
          padding: 5px 4px;
          font-weight: 700;
          font-size: 6.8pt;
          text-transform: uppercase;
          letter-spacing: 0.1px;
          border-bottom: 1.5px solid #0d2a2b;
          line-height: 1.15;
          white-space: nowrap !important;
          vertical-align: middle;
        }

        .th-billing {
          background: #0f3234;
          color: #a7f3d0;
          text-align: center;
          white-space: nowrap !important;
        }

        .report-table td {
          padding: 4.5px 4px;
          border-bottom: 1px solid #e7efe9;
          color: #223532;
          vertical-align: middle;
          font-size: 7.2pt;
          line-height: 1.2;
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
          font-size: 6.8pt;
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
          font-size: 7.8pt;
          line-height: 1.2;
          overflow: hidden;
          text-overflow: ellipsis;
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
          font-size: 7.2pt;
          color: #3b504d;
          line-height: 1.15;
        }

        /* Single-line Date formatting */
        .cell-date, .cell-date-inline {
          white-space: nowrap !important;
          vertical-align: middle;
          line-height: 1.15;
        }

        .date-single-line {
          display: inline-flex;
          align-items: center;
          gap: 2.5px;
          white-space: nowrap !important;
          line-height: 1.1;
        }

        .date-dmy-inline {
          font-weight: 600;
          color: #1e293b;
          font-size: 6.5pt;
          letter-spacing: -0.15px;
          white-space: nowrap !important;
        }

        .date-time-inline {
          font-weight: 500;
          color: #64748b;
          font-size: 6pt;
          background: #f1f5f9;
          padding: 1px 3px;
          border-radius: 3px;
          white-space: nowrap !important;
        }

        .date-empty {
          color: #94a3b8;
          font-size: 7.5pt;
        }

        .date-dmy {
          font-size: 6.6pt;
          font-weight: 600;
          color: #1e293b;
          white-space: nowrap;
        }

        .date-time {
          font-size: 6pt;
          color: #64748b;
          white-space: nowrap;
        }

        /* Single-line Billing Badge */
        .cell-billing, .cell-billing-inline {
          vertical-align: middle;
          text-align: center;
          white-space: nowrap !important;
        }

        .billing-badge-inline {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 3px;
          padding: 1.5px 4.5px;
          border-radius: 4px;
          font-size: 6.3pt;
          font-weight: 700;
          white-space: nowrap !important;
          line-height: 1.15;
          box-sizing: border-box;
          max-width: 100%;
        }

        .billing-badge-inline--paid {
          background: #ecfdf5;
          color: #065f46;
          border: 1px solid #a7f3d0;
        }

        .billing-badge-inline--paid .billing-badge-date {
          color: #047857;
          font-weight: 700;
          font-size: 6.2pt;
          letter-spacing: -0.15px;
          white-space: nowrap !important;
        }

        .billing-badge-inline--pending {
          background: #fff7ed;
          color: #9a3412;
          border: 1px solid #fed7aa;
        }

        .billing-badge-inline--pending .billing-badge-sub {
          color: #c2410c;
          font-size: 5.8pt;
          font-weight: 600;
          white-space: nowrap !important;
        }

        .billing-badge-inline--open {
          background: #f1f5f9;
          color: #475569;
          border: 1px solid #e2e8f0;
          font-size: 6.1pt;
          white-space: nowrap !important;
        }

        .billing-badge-icon {
          flex-shrink: 0;
        }

        /* Footer */
        .document-footer {
          margin-top: auto;
          border-top: 1px solid #dce7df;
          padding-top: 8px;
          display: flex;
          flex-direction: column;
          gap: 2px;
          page-break-inside: avoid;
          break-inside: avoid;
        }

        .footer-company {
          font-size: 7.8pt;
          color: #143b3d;
          line-height: 1.35;
          margin: 0;
          font-weight: 500;
        }

        .footer-company strong {
          color: #123b3d;
          font-weight: 800;
        }

        .footer-confidential {
          color: #64748b;
          font-size: 7.2pt;
          line-height: 1.35;
          margin: 0;
        }
      `}</style>
    </div>
  );
}

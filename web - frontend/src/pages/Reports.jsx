import {
  Activity,
  AlertCircle,
  ArrowRight,
  BarChart3,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Clock3,
  DollarSign,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Headset,
  Laptop,
  Layers,
  Printer,
  RefreshCw,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  User,
  UserCheck,
  Users,
  Wrench,
  X
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import {
  getInventory,
  getReportSummary,
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
  isBilled
} from '../utils/billingUtils.js';
import { exportToPdf, exportToXls } from '../utils/exportReport.js';

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function formatDateOnly(value) {
  if (!value) return '';
  const [year, month, day] = value.split('-');
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

function getTodayString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getPastDaysString(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getFirstDayOfMonthString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
}

function getLastMonthRange() {
  const d = new Date();
  const first = new Date(d.getFullYear(), d.getMonth() - 1, 1);
  const last = new Date(d.getFullYear(), d.getMonth(), 0);

  const fYear = first.getFullYear();
  const fMonth = String(first.getMonth() + 1).padStart(2, '0');
  const fDay = String(first.getDate()).padStart(2, '0');

  const lYear = last.getFullYear();
  const lMonth = String(last.getMonth() + 1).padStart(2, '0');
  const lDay = String(last.getDate()).padStart(2, '0');

  return {
    start: `${fYear}-${fMonth}-${fDay}`,
    end: `${lYear}-${lMonth}-${lDay}`
  };
}

function Reports() {
  const user = getStoredUser();
  const [orders, setOrders] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // 1. FILTROS DE DATA (Período)
  const [datePreset, setDatePreset] = useState('30days');
  const [startDate, setStartDate] = useState(() => getPastDaysString(30));
  const [endDate, setEndDate] = useState(() => getTodayString());
  const [dateField, setDateField] = useState('created_at'); // 'created_at' | 'completed_at' | 'billed_at'

  // 2. FILTROS DE OPERAÇÃO E CONTEÚDO
  const [reportType, setReportType] = useState('all_orders'); // 'all_orders' | 'billed' | 'pending_billing'
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [technicianFilter, setTechnicianFilter] = useState('all');
  const [sectorFilter, setSectorFilter] = useState('all');
  const [serviceTypeFilter, setServiceTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 3. FILTRO DE KPI (clique direto nos cards de resumo)
  const [activeKpiFilter, setActiveKpiFilter] = useState('all');

  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const [ordersRes, ticketsRes, inventoryRes, summaryRes] = await Promise.allSettled([
        getServiceOrders(),
        getSupportTickets(),
        getInventory(),
        getReportSummary()
      ]);

      if (ordersRes.status === 'fulfilled') setOrders(ordersRes.value || []);
      if (ticketsRes.status === 'fulfilled') setTickets(ticketsRes.value || []);
      if (inventoryRes.status === 'fulfilled') setInventory(inventoryRes.value || []);
      if (summaryRes.status === 'fulfilled') setSummary(summaryRes.value || null);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  // Handle Date Preset Clicks
  function applyDatePreset(preset) {
    setDatePreset(preset);
    const today = getTodayString();

    switch (preset) {
      case 'today':
        setStartDate(today);
        setEndDate(today);
        break;
      case '7days':
        setStartDate(getPastDaysString(7));
        setEndDate(today);
        break;
      case '15days':
        setStartDate(getPastDaysString(15));
        setEndDate(today);
        break;
      case '30days':
        setStartDate(getPastDaysString(30));
        setEndDate(today);
        break;
      case 'this_month':
        setStartDate(getFirstDayOfMonthString());
        setEndDate(today);
        break;
      case 'last_month': {
        const { start, end } = getLastMonthRange();
        setStartDate(start);
        setEndDate(end);
        break;
      }
      case 'all':
        setStartDate('');
        setEndDate('');
        break;
      default:
        break;
    }
  }

  // Handle Custom Date Change
  function handleStartDateChange(value) {
    setStartDate(value);
    setDatePreset('custom');
  }

  function handleEndDateChange(value) {
    setEndDate(value);
    setDatePreset('custom');
  }

  // Reset all filters
  function handleResetFilters() {
    setDatePreset('30days');
    setStartDate(getPastDaysString(30));
    setEndDate(getTodayString());
    setDateField('created_at');
    setReportType('all_orders');
    setStatusFilter('all');
    setPriorityFilter('all');
    setTechnicianFilter('all');
    setSectorFilter('all');
    setServiceTypeFilter('all');
    setSearchQuery('');
    setActiveKpiFilter('all');
  }

  // Extract unique sectors, technicians and service types for dropdowns
  const { sectorList, technicianList, serviceTypeList } = useMemo(() => {
    const sectors = new Set();
    const technicians = new Set();
    const serviceTypes = new Set();

    orders.forEach((o) => {
      if (o.patient_name?.trim()) sectors.add(o.patient_name.trim());
      if (o.technician_name?.trim()) technicians.add(o.technician_name.trim());
      if (o.service_type?.trim()) serviceTypes.add(o.service_type.trim());
    });

    inventory.forEach((i) => {
      if (i.location?.trim()) sectors.add(i.location.trim());
    });

    return {
      sectorList: Array.from(sectors).sort(),
      technicianList: Array.from(technicians).sort(),
      serviceTypeList: Array.from(serviceTypes).sort()
    };
  }, [orders, inventory]);

  // Labels and badges helpers
  function getPriorityLabel(priority) {
    const p = (priority || '').toLowerCase();
    if (['low', 'pouco urgente', 'baixa'].includes(p)) return 'Pouco urgente';
    if (p === 'normal') return 'Normal';
    if (['high', 'alta'].includes(p)) return 'Alta';
    if (['urgent', 'urgente'].includes(p)) return 'Urgente';
    return priority || 'Normal';
  }

  function getPriorityBadgeClass(priority) {
    const p = (priority || '').toLowerCase();
    if (['low', 'pouco urgente', 'baixa'].includes(p)) return 'ticket-priority-badge--low';
    if (p === 'normal') return 'ticket-priority-badge--normal';
    if (['high', 'alta'].includes(p)) return 'ticket-priority-badge--high';
    if (['urgent', 'urgente'].includes(p)) return 'ticket-priority-badge--urgent';
    return 'ticket-priority-badge--normal';
  }

  // FILTERING LOGIC
  const now = new Date();

  // 1. First, filter by date range
  const dateFilteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Date filtering
      if (startDate || endDate) {
        let dateToTest = null;
        if (dateField === 'created_at') dateToTest = order.created_at;
        else if (dateField === 'completed_at') dateToTest = order.completed_at;
        else if (dateField === 'billed_at') dateToTest = order.billed_at;

        // If field is required but order has no date for that field (e.g. completed_at on open order)
        if (!dateToTest) {
          if (dateField !== 'created_at') return false;
          dateToTest = order.created_at;
        }

        const dateObj = new Date(dateToTest);
        if (isNaN(dateObj.getTime())) return true;

        if (startDate) {
          const start = new Date(`${startDate}T00:00:00`);
          if (dateObj < start) return false;
        }

        if (endDate) {
          const end = new Date(`${endDate}T23:59:59`);
          if (dateObj > end) return false;
        }
      }
      return true;
    });
  }, [orders, startDate, endDate, dateField]);

  // 2. Calculate Real Summary KPIs for the date period
  const kpiMetrics = useMemo(() => {
    let openCount = 0;
    let inProgressCount = 0;
    let completedCount = 0;
    let billingPendingCount = 0;
    let billedCount = 0;
    let urgentCount = 0;

    dateFilteredOrders.forEach((order) => {
      const effective = getEffectiveOrderStatus(order);
      if (effective === 'open') openCount++;
      if (effective === 'in_progress') inProgressCount++;
      if (effective === 'completed') completedCount++;
      if (effective === 'billing_pending') billingPendingCount++;
      if (effective === 'billed') billedCount++;

      const p = (order.priority || '').toLowerCase();
      const createdAt = new Date(order.created_at);
      const hoursOld = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
      if (effective !== 'completed' && effective !== 'billed' && (p === 'urgent' || p === 'high' || hoursOld > 24)) {
        urgentCount++;
      }
    });

    return {
      total: dateFilteredOrders.length,
      open: openCount,
      inProgress: inProgressCount,
      completed: completedCount,
      billingPending: billingPendingCount,
      billed: billedCount,
      urgent: urgentCount
    };
  }, [dateFilteredOrders, now]);

  // 3. Apply operational, attribute and text filters
  const finalFilteredOrders = useMemo(() => {
    return dateFilteredOrders.filter((order) => {
      const effective = getEffectiveOrderStatus(order);

      // Report Type Filter
      if (reportType === 'billed' && effective !== 'billed') return false;
      if (reportType === 'pending_billing' && effective !== 'billing_pending') return false;

      // KPI Card Click Filter
      if (activeKpiFilter === 'open' && effective !== 'open') return false;
      if (activeKpiFilter === 'in_progress' && effective !== 'in_progress') return false;
      if (activeKpiFilter === 'completed' && effective !== 'completed') return false;
      if (activeKpiFilter === 'billing_pending' && effective !== 'billing_pending') return false;
      if (activeKpiFilter === 'billed' && effective !== 'billed') return false;
      if (activeKpiFilter === 'urgent') {
        const p = (order.priority || '').toLowerCase();
        const createdAt = new Date(order.created_at);
        const hoursOld = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        const isUrgent = effective !== 'completed' && effective !== 'billed' && (p === 'urgent' || p === 'high' || hoursOld > 24);
        if (!isUrgent) return false;
      }

      // Status dropdown filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'billing_pending') {
          if (effective !== 'billing_pending') return false;
        } else if (statusFilter === 'billed') {
          if (effective !== 'billed') return false;
        } else if (order.status !== statusFilter) {
          return false;
        }
      }

      // Priority filter
      if (priorityFilter !== 'all') {
        const p = (order.priority || '').toLowerCase();
        if (priorityFilter === 'low' && !['low', 'pouco urgente', 'baixa'].includes(p)) return false;
        if (priorityFilter === 'normal' && p !== 'normal') return false;
        if (priorityFilter === 'high' && !['high', 'alta'].includes(p)) return false;
        if (priorityFilter === 'urgent' && !['urgent', 'urgente'].includes(p)) return false;
      }

      // Technician filter
      if (technicianFilter !== 'all') {
        if (order.technician_name !== technicianFilter && String(order.technician_id) !== technicianFilter) {
          return false;
        }
      }

      // Sector filter
      if (sectorFilter !== 'all') {
        if (order.patient_name !== sectorFilter) return false;
      }

      // Service Type filter
      if (serviceTypeFilter !== 'all') {
        if (order.service_type !== serviceTypeFilter) return false;
      }

      // Text search
      if (searchQuery.trim()) {
        const term = searchQuery.toLowerCase();
        const str = `${order.order_number || ''} ${order.patient_name || ''} ${order.service_type || ''} ${order.equipment_name || ''} ${order.technician_name || ''} ${order.description || ''} ${order.service_requested_description || ''} ${order.service_performed_description || ''}`.toLowerCase();
        if (!str.includes(term)) return false;
      }

      return true;
    });
  }, [
    dateFilteredOrders,
    reportType,
    activeKpiFilter,
    statusFilter,
    priorityFilter,
    technicianFilter,
    sectorFilter,
    serviceTypeFilter,
    searchQuery,
    now
  ]);

  // Description of selected period for the export subtitle
  const periodDescription = useMemo(() => {
    if (!startDate && !endDate) return 'Todo o período';
    if (startDate && endDate) {
      if (startDate === endDate) return `Data: ${formatDateOnly(startDate)}`;
      return `Período: ${formatDateOnly(startDate)} até ${formatDateOnly(endDate)}`;
    }
    if (startDate) return `A partir de ${formatDateOnly(startDate)}`;
    return `Até ${formatDateOnly(endDate)}`;
  }, [startDate, endDate]);

  // Export Columns (Exact match to the HelpClin authenticated report layout)
  const exportColumns = useMemo(() => [
    { header: 'Prioridade', accessor: (o) => getPriorityLabel(o.priority) },
    { header: 'Número OS', accessor: (o) => `OS-${String(o.order_number || o.id).padStart(5, '0')}` },
    { header: 'Estado', accessor: (o) => getOrderStatusLabel(getEffectiveOrderStatus(o)) },
    { header: 'Solicitante / Setor', accessor: (o) => o.patient_name || 'Recepção' },
    { header: 'Equipamento / Ativo', accessor: (o) => o.equipment_name || 'Serviço Geral' },
    { header: 'Responsável Técnico', accessor: (o) => o.technician_name || 'Não atribuído' },
    { header: 'Tipo de Serviço', accessor: (o) => o.service_type || 'Manutenção' },
    { header: 'Criada em', accessor: (o) => formatDate(o.created_at) },
    { header: 'Concluída em', accessor: (o) => formatDate(o.completed_at) },
    {
      header: 'Faturamento',
      accessor: (o) => {
        if (o.billed_at) return `Faturada (${formatDate(o.billed_at)})`;
        if (o.status === 'billed') return 'Faturada';
        if (isBillingPending(o)) return `Aguardando faturamento (${getDaysSinceCompletion(o)}/30 dias)`;
        return 'Pendente';
      }
    }
  ], []);

  // EXPORT HANDLERS
  function handleExportPdf() {
    exportToPdf({
      title: 'Relatório de Ordens de Serviço',
      subtitle: `Listagem de ${finalFilteredOrders.length} ordens de serviço filtradas • ${periodDescription}`,
      columns: exportColumns,
      data: finalFilteredOrders,
      summary: [
        { label: 'Total Filtrado', value: finalFilteredOrders.length },
        { label: 'Abertas', value: kpiMetrics.open },
        { label: 'Em Andamento', value: kpiMetrics.inProgress },
        { label: 'Concluídas', value: kpiMetrics.completed },
        { label: 'Aguardando Faturamento (Prazo 30 dias)', value: kpiMetrics.billingPending },
        { label: 'Faturadas', value: kpiMetrics.billed },
        { label: 'Urgentes / Atrasadas', value: kpiMetrics.urgent }
      ]
    });
  }

  function handleExportXls() {
    const filename = `Relatorio_HelpClin_${startDate || 'inicio'}_a_${endDate || 'fim'}`;
    exportToXls({
      title: `Relatório de Ordens de Serviço - HelpClin (${periodDescription})`,
      filename,
      columns: exportColumns,
      data: finalFilteredOrders
    });
  }

  return (
    <div className="simple-page reports-page" style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* 1. TOP HEADER */}
      <section className="simple-page-heading" style={{ marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <span className="dash-eyebrow" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <Sparkles size={13} /> Central de Inteligência e Auditoria
          </span>
          <h1 style={{ margin: '4px 0 6px 0', fontSize: '28px', color: 'var(--teal)', fontWeight: 800 }}>
            RELATÓRIOS E EXPORTAÇÃO
          </h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
            Filtre os atendimentos por data e gere relatórios autenticados em PDF e planilhas Excel.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="secondary-button"
            onClick={loadAllData}
            title="Recarregar dados"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={15} />
            <span>Atualizar</span>
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={handleExportXls}
            disabled={finalFilteredOrders.length === 0}
            title="Exportar dados filtrados para planilha Excel (.xls)"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <FileSpreadsheet size={16} style={{ color: '#059669' }} />
            <span>Exportar Excel</span>
          </button>

          <button
            type="button"
            className="primary-button"
            onClick={handleExportPdf}
            disabled={finalFilteredOrders.length === 0}
            title="Gerar e imprimir relatório oficial em PDF com layout autenticado"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              fontWeight: 700,
              boxShadow: '0 4px 14px rgba(231, 131, 104, 0.35)'
            }}
          >
            <Printer size={17} />
            <span>Exportar PDF / Imprimir</span>
          </button>
        </div>
      </section>

      {errorMessage && (
        <div className="dash-alert dash-alert--error" style={{ marginBottom: '20px' }}>
          {errorMessage}
        </div>
      )}

      {/* 2. DATE FILTER & PERIOD SELECTION CARD */}
      <section className="report-filter-card" style={{ marginBottom: '22px' }}>
        <div className="report-filter-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} style={{ color: 'var(--coral)' }} />
            <strong style={{ color: 'var(--teal)', fontSize: '15px' }}>Período do Relatório (Escolha de Data)</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '13px', color: '#64748b' }}>
              Período atual: <b>{periodDescription}</b>
            </span>
            {(datePreset !== '30days' || statusFilter !== 'all' || priorityFilter !== 'all' || technicianFilter !== 'all' || sectorFilter !== 'all' || searchQuery) && (
              <button
                type="button"
                className="secondary-button"
                onClick={handleResetFilters}
                style={{ padding: '4px 10px', height: '32px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                title="Restaurar todos os filtros para o padrão"
              >
                <RotateCcw size={13} /> Limpar Filtros
              </button>
            )}
          </div>
        </div>

        {/* Quick Date Presets */}
        <div className="report-preset-row">
          <span className="report-filter-label" style={{ marginRight: '6px' }}>Atalhos Rápidos:</span>
          <div className="report-preset-pills">
            <button
              type="button"
              className={`report-preset-pill ${datePreset === 'today' ? 'report-preset-pill--active' : ''}`}
              onClick={() => applyDatePreset('today')}
            >
              Hoje
            </button>
            <button
              type="button"
              className={`report-preset-pill ${datePreset === '7days' ? 'report-preset-pill--active' : ''}`}
              onClick={() => applyDatePreset('7days')}
            >
              Últimos 7 dias
            </button>
            <button
              type="button"
              className={`report-preset-pill ${datePreset === '15days' ? 'report-preset-pill--active' : ''}`}
              onClick={() => applyDatePreset('15days')}
            >
              Últimos 15 dias
            </button>
            <button
              type="button"
              className={`report-preset-pill ${datePreset === '30days' ? 'report-preset-pill--active' : ''}`}
              onClick={() => applyDatePreset('30days')}
            >
              Últimos 30 dias
            </button>
            <button
              type="button"
              className={`report-preset-pill ${datePreset === 'this_month' ? 'report-preset-pill--active' : ''}`}
              onClick={() => applyDatePreset('this_month')}
            >
              Este mês
            </button>
            <button
              type="button"
              className={`report-preset-pill ${datePreset === 'last_month' ? 'report-preset-pill--active' : ''}`}
              onClick={() => applyDatePreset('last_month')}
            >
              Mês anterior
            </button>
            <button
              type="button"
              className={`report-preset-pill ${datePreset === 'all' ? 'report-preset-pill--active' : ''}`}
              onClick={() => applyDatePreset('all')}
            >
              Todo o período
            </button>
          </div>
        </div>

        {/* Date Inputs & Field Filter */}
        <div className="report-date-inputs-grid">
          <div className="report-filter-field">
            <label>Data Inicial (De):</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => handleStartDateChange(e.target.value)}
              aria-label="Data Inicial do Relatório"
            />
          </div>

          <div className="report-filter-field">
            <label>Data Final (Até):</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => handleEndDateChange(e.target.value)}
              aria-label="Data Final do Relatório"
            />
          </div>

          <div className="report-filter-field">
            <label>Filtrar pela data de:</label>
            <select
              value={dateField}
              onChange={(e) => setDateField(e.target.value)}
              aria-label="Campo de Data para o filtro"
            >
              <option value="created_at">Data de Abertura / Criação</option>
              <option value="completed_at">Data de Conclusão Técnica</option>
              <option value="billed_at">Data de Faturamento / Pagamento</option>
            </select>
          </div>

          <div className="report-filter-field">
            <label>Tipo de Relatório:</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              aria-label="Categoria do relatório"
            >
              <option value="all_orders">Todas as Ordens de Serviço</option>
              <option value="billed">Apenas Ordens Faturadas</option>
              <option value="pending_billing">Pendências de Faturamento (&gt; 48h)</option>
            </select>
          </div>
        </div>

        {/* Operational Filters Row (Status, Priority, Technician, Sector, Search) */}
        <div className="report-secondary-filters-grid">
          <div className="report-filter-field">
            <label>Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filtrar por status"
            >
              <option value="all">Todos os status</option>
              <option value="open">Abertas</option>
              <option value="in_progress">Em andamento</option>
              <option value="completed">Concluídas</option>
              <option value="billing_pending">Aguardando Faturamento</option>
              <option value="billed">Faturadas</option>
              <option value="cancelled">Canceladas</option>
            </select>
          </div>

          <div className="report-filter-field">
            <label>Prioridade:</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              aria-label="Filtrar por prioridade"
            >
              <option value="all">Todas as prioridades</option>
              <option value="low">Pouco urgente</option>
              <option value="normal">Normal</option>
              <option value="high">Alta</option>
              <option value="urgent">Urgente</option>
            </select>
          </div>

          <div className="report-filter-field">
            <label>Responsável Técnico:</label>
            <select
              value={technicianFilter}
              onChange={(e) => setTechnicianFilter(e.target.value)}
              aria-label="Filtrar por responsável técnico"
            >
              <option value="all">Todos os técnicos</option>
              {technicianList.map((tech) => (
                <option key={tech} value={tech}>
                  {tech}
                </option>
              ))}
            </select>
          </div>

          <div className="report-filter-field">
            <label>Setor / Solicitante:</label>
            <select
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
              aria-label="Filtrar por setor ou solicitante"
            >
              <option value="all">Todos os setores</option>
              {sectorList.map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
          </div>

          <div className="report-filter-field report-filter-field--search">
            <label>Busca Textual:</label>
            <div className="search-control" style={{ width: '100%', height: '42px' }}>
              <Search size={16} />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Número da OS, equipamento, serviço, descrição..."
                aria-label="Busca textual na listagem"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 3. DYNAMIC SUMMARY CARDS (Exact match to the HelpClin authenticated report layout) */}
      <section className="report-summary-cards" style={{ marginBottom: '24px' }}>
        <article
          className={`report-summary-card ${activeKpiFilter === 'all' ? 'report-summary-card--active' : ''}`}
          onClick={() => setActiveKpiFilter('all')}
          title="Clique para ver todos os registros filtrados"
        >
          <span className="report-summary-label">Total Filtrado</span>
          <strong className="report-summary-value">{finalFilteredOrders.length}</strong>
          <small className="report-summary-hint">no período</small>
        </article>

        <article
          className={`report-summary-card report-summary-card--open ${activeKpiFilter === 'open' ? 'report-summary-card--active' : ''}`}
          onClick={() => setActiveKpiFilter(activeKpiFilter === 'open' ? 'all' : 'open')}
          title="Clique para filtrar apenas abertas"
        >
          <span className="report-summary-label">Abertas</span>
          <strong className="report-summary-value">{kpiMetrics.open}</strong>
          <small className="report-summary-hint">aguardando</small>
        </article>

        <article
          className={`report-summary-card report-summary-card--progress ${activeKpiFilter === 'in_progress' ? 'report-summary-card--active' : ''}`}
          onClick={() => setActiveKpiFilter(activeKpiFilter === 'in_progress' ? 'all' : 'in_progress')}
          title="Clique para filtrar apenas em andamento"
        >
          <span className="report-summary-label">Em Andamento</span>
          <strong className="report-summary-value">{kpiMetrics.inProgress}</strong>
          <small className="report-summary-hint">em execução</small>
        </article>

        <article
          className={`report-summary-card report-summary-card--completed ${activeKpiFilter === 'completed' ? 'report-summary-card--active' : ''}`}
          onClick={() => setActiveKpiFilter(activeKpiFilter === 'completed' ? 'all' : 'completed')}
          title="Clique para filtrar apenas concluídas"
        >
          <span className="report-summary-label">Concluídas</span>
          <strong className="report-summary-value">{kpiMetrics.completed}</strong>
          <small className="report-summary-hint">finalizadas</small>
        </article>

        <article
          className={`report-summary-card report-summary-card--pending ${activeKpiFilter === 'billing_pending' ? 'report-summary-card--active' : ''}`}
          onClick={() => setActiveKpiFilter(activeKpiFilter === 'billing_pending' ? 'all' : 'billing_pending')}
          title="Clique para filtrar pendentes de faturamento"
        >
          <span className="report-summary-label">Aguardando Faturamento</span>
          <strong className="report-summary-value">{kpiMetrics.billingPending}</strong>
          <small className="report-summary-hint">Prazo 30 dias</small>
        </article>

        <article
          className={`report-summary-card report-summary-card--billed ${activeKpiFilter === 'billed' ? 'report-summary-card--active' : ''}`}
          onClick={() => setActiveKpiFilter(activeKpiFilter === 'billed' ? 'all' : 'billed')}
          title="Clique para filtrar apenas faturadas"
        >
          <span className="report-summary-label">Faturadas</span>
          <strong className="report-summary-value">{kpiMetrics.billed}</strong>
          <small className="report-summary-hint">pagamento confirmado</small>
        </article>

        <article
          className={`report-summary-card report-summary-card--urgent ${activeKpiFilter === 'urgent' ? 'report-summary-card--active' : ''}`}
          onClick={() => setActiveKpiFilter(activeKpiFilter === 'urgent' ? 'all' : 'urgent')}
          title="Clique para filtrar urgentes ou com atraso"
        >
          <span className="report-summary-label">Urgentes / Atrasadas</span>
          <strong className="report-summary-value">{kpiMetrics.urgent}</strong>
          <small className="report-summary-hint">atenção imediata</small>
        </article>
      </section>

      {/* 4. PREVIEW TABLE OF FILTERED ORDERS */}
      <section className="dash-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ margin: '0 0 4px 0', fontSize: '18px', color: 'var(--teal)' }}>
              Pré-visualização do Relatório
            </h2>
            <span style={{ fontSize: '13px', color: '#64748b' }}>
              Listagem de <b>{finalFilteredOrders.length}</b> {finalFilteredOrders.length === 1 ? 'ordem de serviço filtrada' : 'ordens de serviço filtradas'} • {periodDescription}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              className="secondary-button"
              onClick={handleExportXls}
              disabled={finalFilteredOrders.length === 0}
              style={{ fontSize: '12px', height: '36px' }}
            >
              <FileSpreadsheet size={15} style={{ color: '#059669' }} /> XLS
            </button>
            <button
              type="button"
              className="primary-button"
              onClick={handleExportPdf}
              disabled={finalFilteredOrders.length === 0}
              style={{ fontSize: '12px', height: '36px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Printer size={15} /> Imprimir / PDF
            </button>
          </div>
        </div>

        {finalFilteredOrders.length === 0 ? (
          <div className="dash-empty-text" style={{ padding: '60px 20px', textAlign: 'center' }}>
            <FileText size={36} style={{ color: '#8faea1', margin: '0 auto 12px', display: 'block' }} />
            <strong style={{ display: 'block', color: 'var(--teal)', fontSize: '16px', marginBottom: '6px' }}>
              Nenhuma ordem encontrada para os filtros selecionados
            </strong>
            <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '500px', margin: '0 auto 16px' }}>
              Tente selecionar outro intervalo de datas, mudar o status ou limpar os filtros para visualizar os atendimentos.
            </p>
            <button
              type="button"
              className="secondary-button"
              onClick={handleResetFilters}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', margin: '0 auto' }}
            >
              <RotateCcw size={14} /> Restaurar Filtros
            </button>
          </div>
        ) : (
          <div className="helpclin-table-wrapper">
            <table className="helpclin-table">
              <thead>
                <tr>
                  <th style={{ width: '120px' }}>PRIORIDADE</th>
                  <th style={{ width: '110px' }}>NÚMERO OS</th>
                  <th style={{ width: '130px' }}>ESTADO</th>
                  <th>SOLICITANTE / SETOR</th>
                  <th>EQUIPAMENTO / ATIVO</th>
                  <th>RESPONSÁVEL TÉCNICO</th>
                  <th>TIPO DE SERVIÇO</th>
                  <th style={{ width: '140px' }}>CRIADA EM</th>
                  <th style={{ width: '140px' }}>CONCLUÍDA EM</th>
                  <th style={{ width: '160px' }}>FATURAMENTO</th>
                </tr>
              </thead>
              <tbody>
                {finalFilteredOrders.map((order) => {
                  const effective = getEffectiveOrderStatus(order);
                  return (
                    <tr key={order.id}>
                      <td>
                        <span className={`ticket-priority-badge ${getPriorityBadgeClass(order.priority)}`}>
                          {getPriorityLabel(order.priority)}
                        </span>
                      </td>
                      <td>
                        <strong style={{ color: 'var(--teal)', fontSize: '13px' }}>
                          OS-{String(order.order_number || order.id).padStart(5, '0')}
                        </strong>
                      </td>
                      <td>
                        <span className={`os-status-badge ${getOrderStatusBadgeClass(effective)}`}>
                          {getOrderStatusLabel(effective)}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--teal)' }}>
                        {order.patient_name || 'Recepção'}
                      </td>
                      <td>
                        <span style={{ fontWeight: 500 }}>
                          {order.equipment_name || 'Serviço Geral'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#2b6351' }}>
                          <UserCheck size={13} />
                          <span>{order.technician_name || 'Rodrigo Santos'}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: '13px' }}>
                        {order.service_type || 'Manutenção'}
                      </td>
                      <td style={{ fontSize: '13px', color: '#64748b' }}>
                        {formatDate(order.created_at)}
                      </td>
                      <td style={{ fontSize: '13px', color: '#64748b' }}>
                        {formatDate(order.completed_at)}
                      </td>
                      <td>
                        {order.billed_at ? (
                          <span style={{ fontSize: '12px', color: '#059669', fontWeight: 600 }}>
                            Faturada ({formatDate(order.billed_at)})
                          </span>
                        ) : order.status === 'billed' ? (
                          <span style={{ fontSize: '12px', color: '#059669', fontWeight: 600 }}>
                            Faturada
                          </span>
                        ) : isBillingPending(order) ? (
                          <span style={{ fontSize: '12px', color: '#b45309', fontWeight: 600 }}>
                            Aguardando ({getDaysSinceCompletion(order)}/30 dias)
                          </span>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#64748b' }}>
                            Em atendimento
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default Reports;

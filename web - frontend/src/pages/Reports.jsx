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
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  Headset,
  Laptop,
  Layers,
  Maximize2,
  Printer,
  RefreshCw,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Stethoscope,
  Timer,
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
  getOrderBilledDate,
  getOrderCreationToPaymentRelation,
  isBillingPending,
  isBilled,
  isPaymentInformed,
  isBillingModuleEnabled
} from '../utils/billingUtils.js';
import { exportToPdf, exportToXls } from '../utils/exportReport.js';
import { matchOrderSearch, matchTicketSearch, normalizeText } from '../utils/searchUtils.js';

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

  // 1. DADOS BRUTOS CARREGADOS DO BANCO
  const [orders, setOrders] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // 2. ABA ATIVA DE RELATÓRIO
  // 'orders' | 'tickets' | 'inventory' | 'billing'
  const [activeTab, setActiveTab] = useState('orders');

  // 3. CONFIGURAÇÃO DE IMPRESSÃO A4
  // 'portrait' (210x297mm - Vertical Padrão) | 'landscape' (297x210mm - Horizontal)
  const [printOrientation, setPrintOrientation] = useState('portrait');

  // 4. FILTROS DE PERÍODO & DATA
  const [datePreset, setDatePreset] = useState('30days');
  const [startDate, setStartDate] = useState(() => getPastDaysString(30));
  const [endDate, setEndDate] = useState(() => getTodayString());
  const [dateField, setDateField] = useState('created_at'); // 'created_at' | 'completed_at' | 'billed_at'

  // 5. FILTROS DE STATUS (Contextuais por aba)
  const [statusFilter, setStatusFilter] = useState('all');

  // 6. FILTROS AVANÇADOS & BUSCA
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [technicianFilter, setTechnicianFilter] = useState('all');
  const [sectorFilter, setSectorFilter] = useState('all');
  const [serviceTypeFilter, setServiceTypeFilter] = useState('all');
  const [billingEnabled, setBillingEnabled] = useState(isBillingModuleEnabled);

  useEffect(() => {
    loadAllData();

    function onSettingsChanged() {
      setBillingEnabled(isBillingModuleEnabled());
    }
    window.addEventListener('helpclin_settings_changed', onSettingsChanged);
    return () => window.removeEventListener('helpclin_settings_changed', onSettingsChanged);
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

  // Reset all filters
  function handleResetFilters() {
    setDatePreset('30days');
    setStartDate(getPastDaysString(30));
    setEndDate(getTodayString());
    setDateField('created_at');
    setStatusFilter('all');
    setPriorityFilter('all');
    setTechnicianFilter('all');
    setSectorFilter('all');
    setServiceTypeFilter('all');
    setSearchQuery('');
  }

  // Change active tab
  function handleTabChange(tab) {
    setActiveTab(tab);
    setStatusFilter('all');
    setSearchQuery('');
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

    tickets.forEach((t) => {
      if (t.company_sector?.trim()) sectors.add(t.company_sector.trim());
      if (t.assigned_to_name?.trim()) technicians.add(t.assigned_to_name.trim());
    });

    inventory.forEach((i) => {
      if (i.location?.trim()) sectors.add(i.location.trim());
      if (i.sector?.trim()) sectors.add(i.sector.trim());
    });

    return {
      sectorList: Array.from(sectors).sort(),
      technicianList: Array.from(technicians).sort(),
      serviceTypeList: Array.from(serviceTypes).sort()
    };
  }, [orders, tickets, inventory]);

  // Labels and badges helpers
  function getPriorityLabel(priority) {
    const p = (priority || '').toLowerCase();
    if (['low', 'pouco urgente', 'baixa'].includes(p)) return 'Baixa';
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

  const now = new Date();

  // ==========================================
  // 1. FILTERING LOGIC: ORDENS DE SERVIÇO & FATURAMENTO
  // ==========================================
  const dateFilteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (startDate || endDate) {
        let dateToTest = null;
        if (dateField === 'created_at') dateToTest = order.created_at;
        else if (dateField === 'completed_at') dateToTest = order.completed_at;
        else if (dateField === 'billed_at') dateToTest = order.billed_at;

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

  // KPIs de Ordens de Serviço
  const orderKpiMetrics = useMemo(() => {
    let openCount = 0;
    let inProgressCount = 0;
    let completedCount = 0;
    let billingPendingCount = 0;
    let billedCount = 0;
    let urgentCount = 0;
    let totalBilledHours = 0;
    let billedCountWithDates = 0;

    dateFilteredOrders.forEach((order) => {
      const effective = getEffectiveOrderStatus(order);
      const rel = getOrderCreationToPaymentRelation(order);

      if (effective === 'open') openCount++;
      if (effective === 'in_progress') inProgressCount++;
      if (effective === 'completed') completedCount++;
      if (effective === 'billing_pending') billingPendingCount++;

      if (rel.isBilled) {
        billedCount++;
        if (rel.cycleHours !== null) {
          totalBilledHours += rel.cycleHours;
          billedCountWithDates++;
        }
      }

      const p = (order.priority || '').toLowerCase();
      const createdAt = new Date(order.created_at);
      const hoursOld = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
      if (effective !== 'completed' && effective !== 'billed' && (p === 'urgent' || p === 'high' || hoursOld > 24)) {
        urgentCount++;
      }
    });

    const notBilledCount = Math.max(0, dateFilteredOrders.length - billedCount);
    let avgBillingCycle = '—';
    if (billedCountWithDates > 0) {
      const avgHours = totalBilledHours / billedCountWithDates;
      const avgDays = Math.floor(avgHours / 24);
      if (avgDays <= 0) {
        const roundedHours = Math.max(1, Math.round(avgHours));
        avgBillingCycle = roundedHours === 1 ? '1 hora' : `${roundedHours}h`;
      } else if (avgDays === 1) {
        avgBillingCycle = '1 dia';
      } else {
        avgBillingCycle = `${avgDays} dias`;
      }
    }

    const billedPercentage = dateFilteredOrders.length > 0
      ? Math.round((billedCount / dateFilteredOrders.length) * 100)
      : 0;

    return {
      total: dateFilteredOrders.length,
      open: openCount,
      inProgress: inProgressCount,
      completed: completedCount,
      billingPending: billingPendingCount,
      billed: billedCount,
      notBilled: notBilledCount,
      urgent: urgentCount,
      avgBillingCycle,
      billedPercentage
    };
  }, [dateFilteredOrders, now]);

  // Ordens de Serviço filtradas finais
  const finalFilteredOrders = useMemo(() => {
    return dateFilteredOrders.filter((order) => {
      const effective = getEffectiveOrderStatus(order);
      const rel = getOrderCreationToPaymentRelation(order);

      // Status filter
      if (statusFilter === 'billed' && !rel.isBilled) return false;
      if (statusFilter === 'not_billed' && rel.isBilled) return false;
      if (statusFilter === 'billing_pending' && effective !== 'billing_pending') return false;
      if (statusFilter === 'open' && effective !== 'open') return false;
      if (statusFilter === 'in_progress' && effective !== 'in_progress') return false;
      if (statusFilter === 'completed' && effective !== 'completed') return false;
      if (statusFilter === 'urgent') {
        const p = (order.priority || '').toLowerCase();
        const createdAt = new Date(order.created_at);
        const hoursOld = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        const isUrgent = effective !== 'completed' && effective !== 'billed' && (p === 'urgent' || p === 'high' || hoursOld > 24);
        if (!isUrgent) return false;
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

      // Search query
      if (searchQuery.trim() && !matchOrderSearch(order, searchQuery)) {
        return false;
      }

      return true;
    });
  }, [dateFilteredOrders, statusFilter, priorityFilter, technicianFilter, sectorFilter, serviceTypeFilter, searchQuery, now]);

  // Auditoria de Faturamento Filtrada
  const finalFilteredBilling = useMemo(() => {
    return dateFilteredOrders.filter((order) => {
      const effective = getEffectiveOrderStatus(order);
      const rel = getOrderCreationToPaymentRelation(order);

      // Na aba faturamento, consideramos ordens com conclusão ou faturamento
      if (statusFilter === 'billed' && !rel.isBilled) return false;
      if (statusFilter === 'billing_pending' && effective !== 'billing_pending') return false;
      if (statusFilter === 'critical') {
        const days = getDaysSinceCompletion(order);
        if (days < 20 || rel.isBilled) return false;
      }

      if (searchQuery.trim() && !matchOrderSearch(order, searchQuery)) {
        return false;
      }

      return true;
    });
  }, [dateFilteredOrders, statusFilter, searchQuery]);

  // ==========================================
  // 2. FILTERING LOGIC: CHAMADOS TÉCNICOS
  // ==========================================
  const dateFilteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      if (startDate || endDate) {
        const dateObj = new Date(ticket.created_at);
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
  }, [tickets, startDate, endDate]);

  const ticketKpiMetrics = useMemo(() => {
    let unassigned = 0;
    let inProgress = 0;
    let resolved = 0;
    let urgent = 0;

    dateFilteredTickets.forEach((t) => {
      if (!t.assigned_to) unassigned++;
      if (t.status === 'in_progress') inProgress++;
      if (t.status === 'resolved') resolved++;
      const p = (t.priority || '').toLowerCase();
      if (p === 'urgent' || p === 'urgente') urgent++;
    });

    return {
      total: dateFilteredTickets.length,
      unassigned,
      inProgress,
      resolved,
      urgent
    };
  }, [dateFilteredTickets]);

  const finalFilteredTickets = useMemo(() => {
    return dateFilteredTickets.filter((ticket) => {
      if (statusFilter === 'open' && ticket.assigned_to) return false;
      if (statusFilter === 'in_progress' && ticket.status !== 'in_progress') return false;
      if (statusFilter === 'resolved' && ticket.status !== 'resolved') return false;
      if (statusFilter === 'urgent') {
        const p = (ticket.priority || '').toLowerCase();
        if (p !== 'urgent' && p !== 'urgente') return false;
      }

      if (technicianFilter !== 'all') {
        if (ticket.assigned_to_name !== technicianFilter) return false;
      }

      if (sectorFilter !== 'all') {
        if (ticket.company_sector !== sectorFilter) return false;
      }

      if (searchQuery.trim() && !matchTicketSearch(ticket, searchQuery)) {
        return false;
      }

      return true;
    });
  }, [dateFilteredTickets, statusFilter, technicianFilter, sectorFilter, searchQuery]);

  // ==========================================
  // 3. FILTERING LOGIC: INVENTÁRIO & ATIVOS
  // ==========================================
  const inventoryKpiMetrics = useMemo(() => {
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

  const finalFilteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      const s = (item.status || '').toLowerCase();
      if (statusFilter === 'active' && !['active', 'ativo', 'operacional'].includes(s)) return false;
      if (statusFilter === 'maintenance' && !['maintenance', 'manutencao', 'manutenção'].includes(s)) return false;
      if (statusFilter === 'inactive' && ['active', 'ativo', 'operacional', 'maintenance', 'manutencao', 'manutenção'].includes(s)) return false;

      if (sectorFilter !== 'all') {
        if (item.location !== sectorFilter && item.sector !== sectorFilter) return false;
      }

      if (searchQuery.trim()) {
        const q = normalizeText(searchQuery);
        const nameMatch = normalizeText(item.name || '').includes(q);
        const tagMatch = normalizeText(item.asset_tag || item.code || '').includes(q);
        const modelMatch = normalizeText(item.model || '').includes(q);
        const serialMatch = normalizeText(item.serial_number || '').includes(q);
        if (!nameMatch && !tagMatch && !modelMatch && !serialMatch) return false;
      }

      return true;
    });
  }, [inventory, statusFilter, sectorFilter, searchQuery]);

  // Description of selected period for subtitle
  const periodDescription = useMemo(() => {
    if (!startDate && !endDate) return 'Todo o período';
    if (startDate && endDate) {
      if (startDate === endDate) return `Data: ${formatDateOnly(startDate)}`;
      return `Período: ${formatDateOnly(startDate)} até ${formatDateOnly(endDate)}`;
    }
    if (startDate) return `A partir de ${formatDateOnly(startDate)}`;
    return `Até ${formatDateOnly(endDate)}`;
  }, [startDate, endDate]);

  // ==========================================
  // EXPORT HANDLERS (A4 PRINT & EXCEL)
  // ==========================================
  function handlePrintA4(autoPrint = true) {
    if (activeTab === 'orders') {
      const isBilledOnly = statusFilter === 'billed';
      const customTitle = isBilledOnly
        ? 'Relatório Oficial de Ordens Faturadas'
        : statusFilter === 'billing_pending'
        ? 'Relatório Oficial de Ordens Aguardando Faturamento'
        : statusFilter === 'completed'
        ? 'Relatório Oficial de Ordens Concluídas'
        : 'Relatório Oficial de Ordens de Serviço';

      exportToPdf({
        title: customTitle,
        subtitle: `Listagem de ${finalFilteredOrders.length} ordens de serviço • ${periodDescription}`,
        data: finalFilteredOrders,
        tipo: 'ordens',
        orientation: printOrientation,
        autoPrint,
        filterStatus: statusFilter !== 'all' ? statusFilter : '',
        dateFrom: startDate,
        dateTo: endDate,
        summary: [
          { label: 'Total Filtrado', value: finalFilteredOrders.length },
          { label: 'Faturadas', value: `${orderKpiMetrics.billed} (${orderKpiMetrics.billedPercentage}%)` },
          { label: 'Não Faturadas', value: orderKpiMetrics.notBilled },
          { label: 'Ciclo Médio', value: orderKpiMetrics.avgBillingCycle },
          { label: 'Abertas', value: orderKpiMetrics.open },
          { label: 'Em Andamento', value: orderKpiMetrics.inProgress },
          { label: 'Concluídas', value: orderKpiMetrics.completed },
          { label: 'Urgentes', value: orderKpiMetrics.urgent }
        ]
      });
    } else if (activeTab === 'billing') {
      exportToPdf({
        title: 'Relatório Oficial de Auditoria Financeira & Faturamento',
        subtitle: `Ciclo e prazos de faturamento de ${finalFilteredBilling.length} ordens • ${periodDescription}`,
        data: finalFilteredBilling,
        tipo: 'faturamento',
        orientation: printOrientation,
        autoPrint,
        filterStatus: statusFilter !== 'all' ? statusFilter : '',
        dateFrom: startDate,
        dateTo: endDate,
        summary: [
          { label: 'Total Auditado', value: finalFilteredBilling.length },
          { label: 'Faturadas Confirmadas', value: `${orderKpiMetrics.billed} (${orderKpiMetrics.billedPercentage}%)` },
          { label: 'Aguardando Faturamento', value: orderKpiMetrics.billingPending },
          { label: 'Ciclo Médio (Criação ➔ Pgto)', value: orderKpiMetrics.avgBillingCycle },
          { label: 'Urgentes / Atrasadas', value: orderKpiMetrics.urgent }
        ]
      });
    } else if (activeTab === 'tickets') {
      exportToPdf({
        title: 'Relatório Oficial de Chamados Técnicos & Suporte',
        subtitle: `Listagem de ${finalFilteredTickets.length} chamados registrados • ${periodDescription}`,
        data: finalFilteredTickets,
        tipo: 'chamados',
        orientation: printOrientation,
        autoPrint,
        filterStatus: statusFilter !== 'all' ? statusFilter : '',
        dateFrom: startDate,
        dateTo: endDate,
        summary: [
          { label: 'Total de Chamados', value: finalFilteredTickets.length },
          { label: 'Sem Responsável', value: ticketKpiMetrics.unassigned },
          { label: 'Em Andamento', value: ticketKpiMetrics.inProgress },
          { label: 'Resolvidos', value: ticketKpiMetrics.resolved },
          { label: 'Urgentes', value: ticketKpiMetrics.urgent }
        ]
      });
    } else if (activeTab === 'inventory') {
      exportToPdf({
        title: 'Relatório Oficial de Inventário & Parque Tecnológico',
        subtitle: `Listagem de ${finalFilteredInventory.length} equipamentos e ativos clínicos`,
        data: finalFilteredInventory,
        tipo: 'inventario',
        orientation: printOrientation,
        autoPrint,
        summary: [
          { label: 'Total de Ativos', value: finalFilteredInventory.length },
          { label: 'Operacionais', value: inventoryKpiMetrics.active },
          { label: 'Em Manutenção', value: inventoryKpiMetrics.maintenance },
          { label: 'Inativos / Baixa', value: inventoryKpiMetrics.inactive }
        ]
      });
    }
  }

  function handleExportXls() {
    if (activeTab === 'orders' || activeTab === 'billing') {
      const dataToExport = activeTab === 'billing' ? finalFilteredBilling : finalFilteredOrders;
      const columns = [
        { header: 'Prioridade', accessor: (o) => getPriorityLabel(o.priority) },
        { header: 'Número OS', accessor: (o) => `OS-${String(o.order_number || o.id).padStart(5, '0')}` },
        { header: 'Estado', accessor: (o) => getOrderStatusLabel(getEffectiveOrderStatus(o)) },
        { header: 'Situação Faturamento', accessor: (o) => getOrderCreationToPaymentRelation(o).statusText },
        { header: 'Data Faturamento', accessor: (o) => getOrderCreationToPaymentRelation(o).billedDate ? formatDate(getOrderCreationToPaymentRelation(o).billedDate) : 'Não Faturada' },
        { header: 'Relação Criação ➔ Pagamento', accessor: (o) => getOrderCreationToPaymentRelation(o).elapsedText },
        { header: 'Solicitante / Setor', accessor: (o) => o.patient_name || 'Recepção' },
        { header: 'Equipamento / Ativo', accessor: (o) => o.equipment_name || 'Serviço Geral' },
        { header: 'Responsável Técnico', accessor: (o) => o.technician_name || 'Rodrigo Santos' },
        { header: 'Tipo de Serviço', accessor: (o) => o.service_type || 'Manutenção' },
        { header: 'Criada em', accessor: (o) => formatDate(o.created_at) },
        { header: 'Concluída em', accessor: (o) => formatDate(o.completed_at) }
      ];
      exportToXls({
        title: activeTab === 'billing' ? 'Relatório de Faturamento - HelpClin' : 'Relatório de Ordens de Serviço - HelpClin',
        filename: `Relatorio_HelpClin_${activeTab}_${startDate || 'inicio'}_a_${endDate || 'fim'}`,
        columns,
        data: dataToExport
      });
    } else if (activeTab === 'tickets') {
      const columns = [
        { header: 'Prioridade', accessor: (t) => getPriorityLabel(t.priority) },
        { header: 'Número Chamado', accessor: (t) => `CH-${String(t.service_order_number || t.ticket_number || t.id).padStart(5, '0')}` },
        { header: 'Estado', accessor: (t) => t.status === 'resolved' ? 'Resolvido' : t.status === 'in_progress' ? 'Em andamento' : 'Aberto' },
        { header: 'Setor / Empresa', accessor: (t) => t.company_sector || '—' },
        { header: 'Equipamento / Ativo', accessor: (t) => t.equipment_name || 'Serviço Geral' },
        { header: 'Responsável', accessor: (t) => t.assigned_to_name || 'Sem responsável' },
        { header: 'Problema Relatado', accessor: (t) => t.related_problem || t.observations || '—' },
        { header: 'Solicitante', accessor: (t) => t.requester || '—' },
        { header: 'Criado em', accessor: (t) => formatDate(t.created_at) }
      ];
      exportToXls({
        title: 'Relatório de Chamados Técnicos - HelpClin',
        filename: `Relatorio_HelpClin_Chamados_${startDate || 'inicio'}_a_${endDate || 'fim'}`,
        columns,
        data: finalFilteredTickets
      });
    } else if (activeTab === 'inventory') {
      const columns = [
        { header: 'Código / Tag', accessor: (i) => i.asset_tag || i.code || `EQ-${i.id}` },
        { header: 'Equipamento', accessor: (i) => i.name || '—' },
        { header: 'Estado Operacional', accessor: (i) => i.status === 'active' ? 'Ativo' : i.status === 'maintenance' ? 'Manutenção' : i.status || 'Ativo' },
        { header: 'Setor / Local', accessor: (i) => i.location || i.sector || '—' },
        { header: 'Fabricante', accessor: (i) => i.manufacturer || '—' },
        { header: 'Modelo', accessor: (i) => i.model || '—' },
        { header: 'Número de Série', accessor: (i) => i.serial_number || '—' },
        { header: 'Última Manutenção', accessor: (i) => formatDate(i.last_maintenance_at || i.updated_at) }
      ];
      exportToXls({
        title: 'Relatório de Inventário & Ativos - HelpClin',
        filename: `Relatorio_HelpClin_Inventario_${getTodayString()}`,
        columns,
        data: finalFilteredInventory
      });
    }
  }

  // Active records count
  const activeCount = activeTab === 'orders'
    ? finalFilteredOrders.length
    : activeTab === 'billing'
    ? finalFilteredBilling.length
    : activeTab === 'tickets'
    ? finalFilteredTickets.length
    : finalFilteredInventory.length;

  return (
    <div className="simple-page reports-page" style={{ maxWidth: '1440px', margin: '0 auto', paddingBottom: '70px' }}>
      {/* 1. TOP HEADER */}
      <section className="simple-page-heading" style={{ marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <span className="dash-eyebrow" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <Sparkles size={13} /> Central de Inteligência & Relatórios Clínicos
          </span>
          <h1 style={{ margin: '4px 0 6px 0', fontSize: '28px', color: 'var(--teal)', fontWeight: 800 }}>
            RELATÓRIOS E EXPORTAÇÃO
          </h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
            Emissão de relatórios autenticados, auditoria operacional e exportação nas proporções de folha A4 e planilhas Excel.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="secondary-button"
            onClick={loadAllData}
            title="Recarregar dados do servidor"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={15} className={isLoading ? 'spin-icon' : ''} />
            <span>Atualizar</span>
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={handleExportXls}
            disabled={activeCount === 0}
            title="Exportar dados filtrados para planilha Excel (.xls)"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <FileSpreadsheet size={16} style={{ color: '#059669' }} />
            <span>Exportar Excel</span>
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={() => handlePrintA4(false)}
            disabled={activeCount === 0}
            title="Abrir prévia visual da folha A4 com proporções reais"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Eye size={16} style={{ color: 'var(--teal)' }} />
            <span>Visualizar Folha A4</span>
          </button>

          <button
            type="button"
            className="primary-button"
            onClick={() => handlePrintA4(true)}
            disabled={activeCount === 0}
            title="Imprimir relatório oficial em PDF nas exatas proporções de uma folha A4"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 22px',
              fontWeight: 700,
              boxShadow: '0 4px 14px rgba(231, 131, 104, 0.35)'
            }}
          >
            <Printer size={17} />
            <span>Imprimir Relatório (A4)</span>
          </button>
        </div>
      </section>

      {errorMessage && (
        <div className="dash-alert dash-alert--error" style={{ marginBottom: '20px' }}>
          {errorMessage}
        </div>
      )}

      {/* 2. REPORT CATEGORY TABS (Estruturação Limpa e Organizada por Módulos) */}
      <nav className="reports-tab-nav" aria-label="Abas de Relatório">
        <button
          type="button"
          className={`reports-tab-btn ${activeTab === 'orders' ? 'reports-tab-btn--active' : ''}`}
          onClick={() => handleTabChange('orders')}
        >
          <Wrench size={16} />
          <span>Ordens de Serviço</span>
          <span className="reports-tab-badge">{orders.length}</span>
        </button>

        <button
          type="button"
          className={`reports-tab-btn ${activeTab === 'tickets' ? 'reports-tab-btn--active' : ''}`}
          onClick={() => handleTabChange('tickets')}
        >
          <Headset size={16} />
          <span>Chamados Técnicos</span>
          <span className="reports-tab-badge">{tickets.length}</span>
        </button>

        <button
          type="button"
          className={`reports-tab-btn ${activeTab === 'inventory' ? 'reports-tab-btn--active' : ''}`}
          onClick={() => handleTabChange('inventory')}
        >
          <Laptop size={16} />
          <span>Inventário & Ativos</span>
          <span className="reports-tab-badge">{inventory.length}</span>
        </button>

        {billingEnabled && (
          <button
            type="button"
            className={`reports-tab-btn ${activeTab === 'billing' ? 'reports-tab-btn--active' : ''}`}
            onClick={() => handleTabChange('billing')}
          >
            <DollarSign size={16} />
            <span>Auditoria & Faturamento</span>
            <span className="reports-tab-badge">{orderKpiMetrics.billed + orderKpiMetrics.billingPending}</span>
          </button>
        )}
      </nav>

      {/* 3. A4 PRINT CONFIGURATION BAR (Garante que a impressão saia no formato A4 desejado) */}
      <section className="reports-print-bar">
        <div className="reports-print-bar-left">
          <span className="reports-print-format-tag">
            <Printer size={14} /> Padrão de Impressão: Folha A4 ({printOrientation === 'portrait' ? '210 × 297 mm • Vertical' : '297 × 210 mm • Horizontal'})
          </span>
          <span style={{ fontSize: '13px', color: '#64748b' }}>
            Período Selecionado: <b>{periodDescription}</b>
          </span>
        </div>

        <div className="reports-print-bar-right">
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Orientação A4:</span>
          <div className="reports-orientation-selector">
            <button
              type="button"
              className={`reports-orientation-btn ${printOrientation === 'portrait' ? 'reports-orientation-btn--active' : ''}`}
              onClick={() => setPrintOrientation('portrait')}
              title="A4 Retrato (210x297mm) - Formato vertical padrão oficial de folha A4"
            >
              <FileText size={13} /> Vertical / Retrato (210mm)
            </button>
            <button
              type="button"
              className={`reports-orientation-btn ${printOrientation === 'landscape' ? 'reports-orientation-btn--active' : ''}`}
              onClick={() => setPrintOrientation('landscape')}
              title="A4 Paisagem (297x210mm) - Formato horizontal"
            >
              <Maximize2 size={13} /> Horizontal / Paisagem (297mm)
            </button>
          </div>
        </div>
      </section>

      {/* 4. UNIFIED FILTER CARD */}
      <section className="report-filter-card" style={{ marginBottom: '22px' }}>
        <div className="report-filter-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} style={{ color: 'var(--coral)' }} />
            <strong style={{ color: 'var(--teal)', fontSize: '15px' }}>
              Filtros de {activeTab === 'orders' ? 'Ordens de Serviço' : activeTab === 'tickets' ? 'Chamados' : activeTab === 'inventory' ? 'Inventário' : 'Faturamento'}
            </strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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

        {/* Row A: Presets de Período (Para Ordens, Chamados e Faturamento) */}
        {activeTab !== 'inventory' && (
          <div className="report-preset-row" style={{ marginBottom: '14px', paddingBottom: '12px' }}>
            <span className="report-filter-label" style={{ marginRight: '6px' }}>Período Rápido:</span>
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
                7 dias
              </button>
              <button
                type="button"
                className={`report-preset-pill ${datePreset === '15days' ? 'report-preset-pill--active' : ''}`}
                onClick={() => applyDatePreset('15days')}
              >
                15 dias
              </button>
              <button
                type="button"
                className={`report-preset-pill ${datePreset === '30days' ? 'report-preset-pill--active' : ''}`}
                onClick={() => applyDatePreset('30days')}
              >
                30 dias
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
        )}

        {/* Row B: Chips de Status Contextuais por Aba */}
        <div style={{ marginBottom: '16px' }}>
          <span className="report-filter-label" style={{ display: 'block', marginBottom: '8px', fontWeight: 700, fontSize: '12px', color: '#475569', textTransform: 'uppercase' }}>
            Situação / Status:
          </span>
          <div className="report-preset-pills" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {activeTab === 'orders' && (
              <>
                <button
                  type="button"
                  className={`report-preset-pill ${statusFilter === 'all' ? 'report-preset-pill--active' : ''}`}
                  onClick={() => setStatusFilter('all')}
                >
                  Todas ({orders.length})
                </button>
                {billingEnabled && (
                  <button
                    type="button"
                    className={`report-preset-pill ${statusFilter === 'billed' ? 'report-preset-pill--active' : ''}`}
                    onClick={() => setStatusFilter('billed')}
                    style={statusFilter === 'billed' ? { background: '#059669', borderColor: '#059669', color: '#fff', fontWeight: 700 } : {}}
                  >
                    🟢 Faturadas ({orderKpiMetrics.billed})
                  </button>
                )}
                {billingEnabled && (
                  <button
                    type="button"
                    className={`report-preset-pill ${statusFilter === 'billing_pending' ? 'report-preset-pill--active' : ''}`}
                    onClick={() => setStatusFilter('billing_pending')}
                    style={statusFilter === 'billing_pending' ? { background: '#ea580c', borderColor: '#ea580c', color: '#fff', fontWeight: 700 } : {}}
                  >
                    🟠 Aguardando Fat. ({orderKpiMetrics.billingPending})
                  </button>
                )}
                <button
                  type="button"
                  className={`report-preset-pill ${statusFilter === 'completed' ? 'report-preset-pill--active' : ''}`}
                  onClick={() => setStatusFilter('completed')}
                >
                  🔵 Concluídas ({orderKpiMetrics.completed})
                </button>
                <button
                  type="button"
                  className={`report-preset-pill ${statusFilter === 'in_progress' ? 'report-preset-pill--active' : ''}`}
                  onClick={() => setStatusFilter('in_progress')}
                >
                  🟡 Em Andamento ({orderKpiMetrics.inProgress})
                </button>
                <button
                  type="button"
                  className={`report-preset-pill ${statusFilter === 'open' ? 'report-preset-pill--active' : ''}`}
                  onClick={() => setStatusFilter('open')}
                >
                  ⚪ Abertas ({orderKpiMetrics.open})
                </button>
                <button
                  type="button"
                  className={`report-preset-pill ${statusFilter === 'urgent' ? 'report-preset-pill--active' : ''}`}
                  onClick={() => setStatusFilter('urgent')}
                >
                  🔴 Urgentes ({orderKpiMetrics.urgent})
                </button>
              </>
            )}

            {activeTab === 'billing' && (
              <>
                <button
                  type="button"
                  className={`report-preset-pill ${statusFilter === 'all' ? 'report-preset-pill--active' : ''}`}
                  onClick={() => setStatusFilter('all')}
                >
                  Todas ({dateFilteredOrders.length})
                </button>
                <button
                  type="button"
                  className={`report-preset-pill ${statusFilter === 'billed' ? 'report-preset-pill--active' : ''}`}
                  onClick={() => setStatusFilter('billed')}
                  style={statusFilter === 'billed' ? { background: '#059669', borderColor: '#059669', color: '#fff', fontWeight: 700 } : {}}
                >
                  🟢 Faturadas Confirmadas ({orderKpiMetrics.billed})
                </button>
                <button
                  type="button"
                  className={`report-preset-pill ${statusFilter === 'billing_pending' ? 'report-preset-pill--active' : ''}`}
                  onClick={() => setStatusFilter('billing_pending')}
                  style={statusFilter === 'billing_pending' ? { background: '#ea580c', borderColor: '#ea580c', color: '#fff', fontWeight: 700 } : {}}
                >
                  🟠 Aguardando Faturamento ({orderKpiMetrics.billingPending})
                </button>
                <button
                  type="button"
                  className={`report-preset-pill ${statusFilter === 'critical' ? 'report-preset-pill--active' : ''}`}
                  onClick={() => setStatusFilter('critical')}
                  style={statusFilter === 'critical' ? { background: '#dc2626', borderColor: '#dc2626', color: '#fff', fontWeight: 700 } : {}}
                >
                  🚨 Prazo Crítico (&gt;20 dias)
                </button>
              </>
            )}

            {activeTab === 'tickets' && (
              <>
                <button
                  type="button"
                  className={`report-preset-pill ${statusFilter === 'all' ? 'report-preset-pill--active' : ''}`}
                  onClick={() => setStatusFilter('all')}
                >
                  Todos ({tickets.length})
                </button>
                <button
                  type="button"
                  className={`report-preset-pill ${statusFilter === 'open' ? 'report-preset-pill--active' : ''}`}
                  onClick={() => setStatusFilter('open')}
                >
                  ⚪ Sem Responsável ({ticketKpiMetrics.unassigned})
                </button>
                <button
                  type="button"
                  className={`report-preset-pill ${statusFilter === 'in_progress' ? 'report-preset-pill--active' : ''}`}
                  onClick={() => setStatusFilter('in_progress')}
                >
                  🟡 Em Andamento ({ticketKpiMetrics.inProgress})
                </button>
                <button
                  type="button"
                  className={`report-preset-pill ${statusFilter === 'resolved' ? 'report-preset-pill--active' : ''}`}
                  onClick={() => setStatusFilter('resolved')}
                >
                  🔵 Resolvidos ({ticketKpiMetrics.resolved})
                </button>
                <button
                  type="button"
                  className={`report-preset-pill ${statusFilter === 'urgent' ? 'report-preset-pill--active' : ''}`}
                  onClick={() => setStatusFilter('urgent')}
                >
                  🔴 Urgentes ({ticketKpiMetrics.urgent})
                </button>
              </>
            )}

            {activeTab === 'inventory' && (
              <>
                <button
                  type="button"
                  className={`report-preset-pill ${statusFilter === 'all' ? 'report-preset-pill--active' : ''}`}
                  onClick={() => setStatusFilter('all')}
                >
                  Todos os Ativos ({inventory.length})
                </button>
                <button
                  type="button"
                  className={`report-preset-pill ${statusFilter === 'active' ? 'report-preset-pill--active' : ''}`}
                  onClick={() => setStatusFilter('active')}
                >
                  🟢 Operacionais / Ativos ({inventoryKpiMetrics.active})
                </button>
                <button
                  type="button"
                  className={`report-preset-pill ${statusFilter === 'maintenance' ? 'report-preset-pill--active' : ''}`}
                  onClick={() => setStatusFilter('maintenance')}
                >
                  🟡 Em Manutenção ({inventoryKpiMetrics.maintenance})
                </button>
                <button
                  type="button"
                  className={`report-preset-pill ${statusFilter === 'inactive' ? 'report-preset-pill--active' : ''}`}
                  onClick={() => setStatusFilter('inactive')}
                >
                  ⚪ Inativos / Baixa ({inventoryKpiMetrics.inactive})
                </button>
              </>
            )}
          </div>
        </div>

        {/* Row C: Busca & Intervalo de Datas */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', alignItems: 'flex-end', marginBottom: '14px' }}>
          {/* Busca Textual */}
          <div className="report-filter-field" style={{ minWidth: '260px' }}>
            <label>Buscar na Listagem:</label>
            <div className="search-control" style={{ width: '100%', height: '40px' }}>
              <Search size={16} />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nº da OS, equipamento, solicitante, tag..."
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

          {activeTab !== 'inventory' && (
            <>
              {/* Data Inicial */}
              <div className="report-filter-field">
                <label>Data Inicial:</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setDatePreset('custom');
                  }}
                  aria-label="Data Inicial do Relatório"
                  style={{ height: '40px' }}
                />
              </div>

              {/* Data Final */}
              <div className="report-filter-field">
                <label>Data Final:</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setDatePreset('custom');
                  }}
                  aria-label="Data Final do Relatório"
                  style={{ height: '40px' }}
                />
              </div>
            </>
          )}

          {/* Botão de Filtros Avançados */}
          <div style={{ display: 'flex', gap: '8px', height: '40px' }}>
            <button
              type="button"
              className="secondary-button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              style={{ height: '40px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
            >
              <Filter size={14} />
              <span>{showAdvancedFilters ? 'Ocultar Opções ▲' : 'Mais Filtros ▼'}</span>
            </button>
          </div>
        </div>

        {/* Row D: Filtros Avançados (Colapsáveis) */}
        {showAdvancedFilters && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #e2ece5' }}>
            {activeTab === 'orders' && (
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
            )}

            {(activeTab === 'orders' || activeTab === 'tickets') && (
              <div className="report-filter-field">
                <label>Prioridade:</label>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  aria-label="Filtrar por prioridade"
                >
                  <option value="all">Todas as prioridades</option>
                  <option value="low">Baixa</option>
                  <option value="normal">Normal</option>
                  <option value="high">Alta</option>
                  <option value="urgent">Urgente</option>
                </select>
              </div>
            )}

            {(activeTab === 'orders' || activeTab === 'tickets') && (
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
            )}

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

            {activeTab === 'orders' && serviceTypeList.length > 0 && (
              <div className="report-filter-field">
                <label>Tipo de Serviço:</label>
                <select
                  value={serviceTypeFilter}
                  onChange={(e) => setServiceTypeFilter(e.target.value)}
                  aria-label="Filtrar por tipo de serviço"
                >
                  <option value="all">Todos os tipos</option>
                  {serviceTypeList.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 5. INTERACTIVE SUMMARY KPI CARDS (Atualizados dinamicamente com os filtros) */}
      {activeTab === 'orders' && (
        <section className="report-summary-cards" style={{ marginBottom: '24px' }}>
          <article
            className={`report-summary-card ${statusFilter === 'all' ? 'report-summary-card--active' : ''}`}
            onClick={() => setStatusFilter('all')}
            title="Clique para ver todos os registros filtrados"
          >
            <span className="report-summary-label">Total Filtrado</span>
            <strong className="report-summary-value">{finalFilteredOrders.length}</strong>
            <small className="report-summary-hint">no período</small>
          </article>

          <article
            className={`report-summary-card report-summary-card--open ${statusFilter === 'open' ? 'report-summary-card--active' : ''}`}
            onClick={() => setStatusFilter(statusFilter === 'open' ? 'all' : 'open')}
            title="Clique para filtrar apenas abertas"
          >
            <span className="report-summary-label">Abertas</span>
            <strong className="report-summary-value">{orderKpiMetrics.open}</strong>
            <small className="report-summary-hint">aguardando</small>
          </article>

          <article
            className={`report-summary-card report-summary-card--progress ${statusFilter === 'in_progress' ? 'report-summary-card--active' : ''}`}
            onClick={() => setStatusFilter(statusFilter === 'in_progress' ? 'all' : 'in_progress')}
            title="Clique para filtrar apenas em andamento"
          >
            <span className="report-summary-label">Em Andamento</span>
            <strong className="report-summary-value">{orderKpiMetrics.inProgress}</strong>
            <small className="report-summary-hint">em execução</small>
          </article>

          <article
            className={`report-summary-card report-summary-card--completed ${statusFilter === 'completed' ? 'report-summary-card--active' : ''}`}
            onClick={() => setStatusFilter(statusFilter === 'completed' ? 'all' : 'completed')}
            title="Clique para filtrar apenas concluídas"
          >
            <span className="report-summary-label">Concluídas</span>
            <strong className="report-summary-value">{orderKpiMetrics.completed}</strong>
            <small className="report-summary-hint">finalizadas</small>
          </article>

          {billingEnabled && (
            <>
              <article
                className={`report-summary-card report-summary-card--billed ${statusFilter === 'billed' ? 'report-summary-card--active' : ''}`}
                onClick={() => setStatusFilter(statusFilter === 'billed' ? 'all' : 'billed')}
                title="Clique para filtrar apenas faturadas"
              >
                <span className="report-summary-label" style={{ color: '#059669' }}>Faturadas</span>
                <strong className="report-summary-value" style={{ color: '#059669' }}>{orderKpiMetrics.billed}</strong>
                <small className="report-summary-hint">confirmadas ({orderKpiMetrics.billedPercentage}%)</small>
              </article>

              <article
                className={`report-summary-card report-summary-card--not_billed ${statusFilter === 'billing_pending' ? 'report-summary-card--active' : ''}`}
                onClick={() => setStatusFilter(statusFilter === 'billing_pending' ? 'all' : 'billing_pending')}
                title="Clique para filtrar ordens aguardando faturamento"
              >
                <span className="report-summary-label" style={{ color: '#b45309' }}>Aguardando Fat.</span>
                <strong className="report-summary-value" style={{ color: '#b45309' }}>{orderKpiMetrics.billingPending}</strong>
                <small className="report-summary-hint">prazo 30 dias</small>
              </article>

              <article
                className="report-summary-card report-summary-card--cycle"
                title="Tempo médio decorrido entre a criação da ordem e o pagamento"
              >
                <span className="report-summary-label" style={{ color: '#2563eb' }}>Ciclo Médio</span>
                <strong className="report-summary-value" style={{ color: '#2563eb' }}>{orderKpiMetrics.avgBillingCycle}</strong>
                <small className="report-summary-hint">Criação ➔ Pagamento</small>
              </article>
            </>
          )}

          <article
            className={`report-summary-card report-summary-card--urgent ${statusFilter === 'urgent' ? 'report-summary-card--active' : ''}`}
            onClick={() => setStatusFilter(statusFilter === 'urgent' ? 'all' : 'urgent')}
            title="Clique para filtrar urgentes ou com atraso"
          >
            <span className="report-summary-label">Urgentes</span>
            <strong className="report-summary-value">{orderKpiMetrics.urgent}</strong>
            <small className="report-summary-hint">atenção imediata</small>
          </article>
        </section>
      )}

      {activeTab === 'billing' && (
        <section className="report-summary-cards" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(5, 1fr)' }}>
          <article
            className={`report-summary-card ${statusFilter === 'all' ? 'report-summary-card--active' : ''}`}
            onClick={() => setStatusFilter('all')}
            title="Clique para ver todas as ordens auditadas"
          >
            <span className="report-summary-label">Total Auditado</span>
            <strong className="report-summary-value">{finalFilteredBilling.length}</strong>
            <small className="report-summary-hint">no período</small>
          </article>

          <article
            className={`report-summary-card report-summary-card--billed ${statusFilter === 'billed' ? 'report-summary-card--active' : ''}`}
            onClick={() => setStatusFilter('billed')}
            title="Clique para filtrar ordens faturadas"
          >
            <span className="report-summary-label" style={{ color: '#059669' }}>Faturadas Confirmadas</span>
            <strong className="report-summary-value" style={{ color: '#059669' }}>{orderKpiMetrics.billed}</strong>
            <small className="report-summary-hint">recebidas ({orderKpiMetrics.billedPercentage}%)</small>
          </article>

          <article
            className={`report-summary-card report-summary-card--not_billed ${statusFilter === 'billing_pending' ? 'report-summary-card--active' : ''}`}
            onClick={() => setStatusFilter('billing_pending')}
            title="Clique para filtrar ordens aguardando faturamento"
          >
            <span className="report-summary-label" style={{ color: '#b45309' }}>Aguardando Faturamento</span>
            <strong className="report-summary-value" style={{ color: '#b45309' }}>{orderKpiMetrics.billingPending}</strong>
            <small className="report-summary-hint">prazo de até 30 dias</small>
          </article>

          <article className="report-summary-card report-summary-card--cycle">
            <span className="report-summary-label" style={{ color: '#2563eb' }}>Ciclo Médio Criação ➔ Pgto</span>
            <strong className="report-summary-value" style={{ color: '#2563eb' }}>{orderKpiMetrics.avgBillingCycle}</strong>
            <small className="report-summary-hint">tempo médio de giro</small>
          </article>

          <article
            className={`report-summary-card report-summary-card--urgent ${statusFilter === 'critical' ? 'report-summary-card--active' : ''}`}
            onClick={() => setStatusFilter('critical')}
            title="Ordens com mais de 20 dias após conclusão sem faturamento"
          >
            <span className="report-summary-label">Prazo Crítico</span>
            <strong className="report-summary-value" style={{ color: '#dc2626' }}>
              {finalFilteredBilling.filter((o) => getDaysSinceCompletion(o) >= 20 && !isBilled(o)).length}
            </strong>
            <small className="report-summary-hint">&gt; 20 dias concluídas</small>
          </article>
        </section>
      )}

      {activeTab === 'tickets' && (
        <section className="report-summary-cards" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(5, 1fr)' }}>
          <article
            className={`report-summary-card ${statusFilter === 'all' ? 'report-summary-card--active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            <span className="report-summary-label">Total de Chamados</span>
            <strong className="report-summary-value">{finalFilteredTickets.length}</strong>
            <small className="report-summary-hint">no período</small>
          </article>

          <article
            className={`report-summary-card report-summary-card--open ${statusFilter === 'open' ? 'report-summary-card--active' : ''}`}
            onClick={() => setStatusFilter('open')}
          >
            <span className="report-summary-label">Sem Responsável</span>
            <strong className="report-summary-value">{ticketKpiMetrics.unassigned}</strong>
            <small className="report-summary-hint">aguardando triagem</small>
          </article>

          <article
            className={`report-summary-card report-summary-card--progress ${statusFilter === 'in_progress' ? 'report-summary-card--active' : ''}`}
            onClick={() => setStatusFilter('in_progress')}
          >
            <span className="report-summary-label">Em Andamento</span>
            <strong className="report-summary-value">{ticketKpiMetrics.inProgress}</strong>
            <small className="report-summary-hint">em atendimento</small>
          </article>

          <article
            className={`report-summary-card report-summary-card--completed ${statusFilter === 'resolved' ? 'report-summary-card--active' : ''}`}
            onClick={() => setStatusFilter('resolved')}
          >
            <span className="report-summary-label">Resolvidos</span>
            <strong className="report-summary-value">{ticketKpiMetrics.resolved}</strong>
            <small className="report-summary-hint">finalizados</small>
          </article>

          <article
            className={`report-summary-card report-summary-card--urgent ${statusFilter === 'urgent' ? 'report-summary-card--active' : ''}`}
            onClick={() => setStatusFilter('urgent')}
          >
            <span className="report-summary-label">Urgentes</span>
            <strong className="report-summary-value">{ticketKpiMetrics.urgent}</strong>
            <small className="report-summary-hint">alta prioridade</small>
          </article>
        </section>
      )}

      {activeTab === 'inventory' && (
        <section className="report-summary-cards" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <article
            className={`report-summary-card ${statusFilter === 'all' ? 'report-summary-card--active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            <span className="report-summary-label">Total de Ativos</span>
            <strong className="report-summary-value">{finalFilteredInventory.length}</strong>
            <small className="report-summary-hint">cadastrados</small>
          </article>

          <article
            className={`report-summary-card report-summary-card--completed ${statusFilter === 'active' ? 'report-summary-card--active' : ''}`}
            onClick={() => setStatusFilter('active')}
          >
            <span className="report-summary-label" style={{ color: '#059669' }}>Operacionais / Ativos</span>
            <strong className="report-summary-value" style={{ color: '#059669' }}>{inventoryKpiMetrics.active}</strong>
            <small className="report-summary-hint">em pleno funcionamento</small>
          </article>

          <article
            className={`report-summary-card report-summary-card--progress ${statusFilter === 'maintenance' ? 'report-summary-card--active' : ''}`}
            onClick={() => setStatusFilter('maintenance')}
          >
            <span className="report-summary-label" style={{ color: '#d97706' }}>Em Manutenção</span>
            <strong className="report-summary-value" style={{ color: '#d97706' }}>{inventoryKpiMetrics.maintenance}</strong>
            <small className="report-summary-hint">em oficina ou calibração</small>
          </article>

          <article
            className={`report-summary-card ${statusFilter === 'inactive' ? 'report-summary-card--active' : ''}`}
            onClick={() => setStatusFilter('inactive')}
          >
            <span className="report-summary-label">Inativos / Baixa</span>
            <strong className="report-summary-value">{inventoryKpiMetrics.inactive}</strong>
            <small className="report-summary-hint">desativados</small>
          </article>
        </section>
      )}

      {/* 6. PREVIEW TABLE OF ACTIVE DATA */}
      <section className="dash-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ margin: '0 0 4px 0', fontSize: '18px', color: 'var(--teal)' }}>
              {activeTab === 'orders' ? 'Pré-visualização: Ordens de Serviço' : activeTab === 'billing' ? 'Pré-visualização: Auditoria de Faturamento' : activeTab === 'tickets' ? 'Pré-visualização: Chamados Técnicos' : 'Pré-visualização: Inventário de Ativos'}
            </h2>
            <span style={{ fontSize: '13px', color: '#64748b', display: 'block' }}>
              Exibindo <b>{activeCount}</b> {activeCount === 1 ? 'registro filtrado' : 'registros filtrados'} • {periodDescription} • Saída: <b>A4 {printOrientation === 'landscape' ? 'Paisagem' : 'Retrato'}</b>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="secondary-button"
              onClick={handleExportXls}
              disabled={activeCount === 0}
              style={{ fontSize: '12px', height: '36px' }}
            >
              <FileSpreadsheet size={15} style={{ color: '#059669' }} /> XLS
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => handlePrintA4(false)}
              disabled={activeCount === 0}
              style={{ fontSize: '12px', height: '36px' }}
            >
              <Eye size={15} style={{ color: 'var(--teal)' }} /> Ver Folha A4
            </button>
            <button
              type="button"
              className="primary-button"
              onClick={() => handlePrintA4(true)}
              disabled={activeCount === 0}
              style={{ fontSize: '12px', height: '36px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Printer size={15} /> Imprimir A4
            </button>
          </div>
        </div>

        {activeCount === 0 ? (
          <div className="dash-empty-text" style={{ padding: '60px 20px', textAlign: 'center' }}>
            <FileText size={36} style={{ color: '#8faea1', margin: '0 auto 12px', display: 'block' }} />
            <strong style={{ display: 'block', color: 'var(--teal)', fontSize: '16px', marginBottom: '6px' }}>
              Nenhum registro encontrado para os filtros selecionados
            </strong>
            <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '500px', margin: '0 auto 16px' }}>
              Tente selecionar outro intervalo de datas, mudar o status ou limpar os filtros para visualizar os dados.
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
            {activeTab === 'orders' && (
              <table className="helpclin-table">
                <thead>
                  <tr>
                    <th style={{ width: '95px' }}>PRIORIDADE</th>
                    <th style={{ width: '95px' }}>NÚMERO OS</th>
                    <th style={{ width: '105px' }}>ESTADO</th>
                    <th style={{ width: '175px' }}>STATUS FATURAMENTO & DATA</th>
                    <th style={{ width: '200px' }}>RELAÇÃO CRIAÇÃO ➔ PAGAMENTO</th>
                    <th>SOLICITANTE / SETOR</th>
                    <th>EQUIPAMENTO / ATIVO</th>
                    <th>RESPONSÁVEL TÉCNICO</th>
                    <th style={{ width: '130px' }}>CRIADA EM</th>
                    <th style={{ width: '130px' }}>CONCLUÍDA EM</th>
                  </tr>
                </thead>
                <tbody>
                  {finalFilteredOrders.map((order) => {
                    const effective = getEffectiveOrderStatus(order);
                    const rel = getOrderCreationToPaymentRelation(order);
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
                        <td>
                          {rel.isBilled ? (
                            <div>
                              <span className="os-status-badge os-status-badge--billed" style={{ fontSize: '10px', padding: '2px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <CheckCircle2 size={11} /> Faturada
                              </span>
                              <div style={{ fontSize: '11px', color: '#065f46', fontWeight: 700, marginTop: '3px' }}>
                                {formatDate(rel.billedDate)}
                              </div>
                            </div>
                          ) : rel.isPaymentInformed ? (
                            <div>
                              <span className="os-status-badge os-status-badge--payment_informed" style={{ fontSize: '10px', padding: '2px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <Clock size={11} /> Pgto Informado
                              </span>
                              <div style={{ fontSize: '11px', color: '#92400e', fontWeight: 600, marginTop: '3px' }}>
                                {formatDate(rel.billedDate)}
                              </div>
                            </div>
                          ) : (
                            <div>
                              <span className="os-status-badge os-status-badge--not_billed" style={{ fontSize: '10px', padding: '2px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <AlertCircle size={11} /> Não Faturada
                              </span>
                              <div style={{ fontSize: '11px', color: '#9a3412', marginTop: '3px' }}>
                                {isBillingPending(order) ? `Aguardando (${getDaysSinceCompletion(order)}/30d)` : 'Em atendimento'}
                              </div>
                            </div>
                          )}
                        </td>
                        <td>
                          <div className="report-relation-cell">
                            {rel.isBilled ? (
                              <>
                                <div className="report-relation-pill report-relation-pill--billed">
                                  <Clock3 size={12} />
                                  <span>{rel.elapsedText}</span>
                                </div>
                                <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <span>{formatDateOnly(order.created_at ? new Date(order.created_at).toISOString().slice(0, 10) : '')}</span>
                                  <ArrowRight size={10} style={{ color: '#059669' }} />
                                  <span style={{ color: '#059669', fontWeight: 600 }}>
                                    {formatDateOnly(rel.billedDate ? new Date(rel.billedDate).toISOString().slice(0, 10) : '')}
                                  </span>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="report-relation-pill report-relation-pill--pending">
                                  <Timer size={12} />
                                  <span>{rel.elapsedText}</span>
                                </div>
                                <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                                  Criada em {formatDate(order.created_at)}
                                </div>
                              </>
                            )}
                          </div>
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
                        <td style={{ fontSize: '13px', color: '#64748b' }}>
                          {formatDate(order.created_at)}
                        </td>
                        <td style={{ fontSize: '13px', color: '#64748b' }}>
                          {formatDate(order.completed_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {activeTab === 'billing' && (
              <table className="helpclin-table">
                <thead>
                  <tr>
                    <th style={{ width: '95px' }}>NÚMERO OS</th>
                    <th style={{ width: '105px' }}>ESTADO</th>
                    <th>SOLICITANTE / SETOR</th>
                    <th>EQUIPAMENTO / ATIVO</th>
                    <th style={{ width: '130px' }}>CRIADA EM</th>
                    <th style={{ width: '130px' }}>CONCLUÍDA EM</th>
                    <th style={{ width: '170px' }}>SITUAÇÃO FATURAMENTO</th>
                    <th style={{ width: '140px' }}>DATA PAGAMENTO</th>
                    <th style={{ width: '200px' }}>CICLO CRIAÇÃO ➔ PGTO</th>
                  </tr>
                </thead>
                <tbody>
                  {finalFilteredBilling.map((order) => {
                    const effective = getEffectiveOrderStatus(order);
                    const rel = getOrderCreationToPaymentRelation(order);
                    return (
                      <tr key={order.id}>
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
                        <td style={{ fontWeight: 600, color: 'var(--teal)' }}>{order.patient_name || 'Recepção'}</td>
                        <td>{order.equipment_name || 'Serviço Geral'}</td>
                        <td style={{ fontSize: '13px', color: '#64748b' }}>{formatDate(order.created_at)}</td>
                        <td style={{ fontSize: '13px', color: '#64748b' }}>{formatDate(order.completed_at)}</td>
                        <td>
                          {rel.isBilled ? (
                            <span className="os-status-badge os-status-badge--billed" style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <CheckCircle2 size={12} /> Faturada (Paga)
                            </span>
                          ) : (
                            <span className="os-status-badge os-status-badge--not_billed" style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <Clock size={12} /> Aguardando ({getDaysSinceCompletion(order)}/30d)
                            </span>
                          )}
                        </td>
                        <td style={{ fontSize: '13px', fontWeight: 600, color: rel.billedDate ? '#065f46' : '#94a3b8' }}>
                          {rel.billedDate ? formatDate(rel.billedDate) : '—'}
                        </td>
                        <td>
                          <div className={`report-relation-pill ${rel.isBilled ? 'report-relation-pill--billed' : 'report-relation-pill--pending'}`}>
                            <Clock3 size={12} />
                            <span>{rel.elapsedText}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {activeTab === 'tickets' && (
              <table className="helpclin-table">
                <thead>
                  <tr>
                    <th style={{ width: '95px' }}>PRIORIDADE</th>
                    <th style={{ width: '100px' }}>Nº CHAMADO</th>
                    <th style={{ width: '105px' }}>ESTADO</th>
                    <th>SETOR / EMPRESA</th>
                    <th>EQUIPAMENTO / ATIVO</th>
                    <th>RESPONSÁVEL</th>
                    <th>PROBLEMA RELATADO</th>
                    <th>SOLICITANTE</th>
                    <th style={{ width: '130px' }}>ABERTO EM</th>
                  </tr>
                </thead>
                <tbody>
                  {finalFilteredTickets.map((ticket) => (
                    <tr key={ticket.id}>
                      <td>
                        <span className={`ticket-priority-badge ${getPriorityBadgeClass(ticket.priority)}`}>
                          {getPriorityLabel(ticket.priority)}
                        </span>
                      </td>
                      <td>
                        <strong style={{ color: 'var(--teal)', fontSize: '13px' }}>
                          CH-{String(ticket.service_order_number || ticket.ticket_number || ticket.id).padStart(5, '0')}
                        </strong>
                      </td>
                      <td>
                        <span className={`os-status-badge ${ticket.status === 'resolved' ? 'os-status-badge--completed' : ticket.status === 'in_progress' ? 'os-status-badge--in_progress' : 'os-status-badge--open'}`}>
                          {ticket.status === 'resolved' ? 'Resolvido' : ticket.status === 'in_progress' ? 'Em andamento' : 'Aberto'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--teal)' }}>{ticket.company_sector || '—'}</td>
                      <td>{ticket.equipment_name || 'Serviço Geral'}</td>
                      <td>{ticket.assigned_to_name || 'Sem responsável'}</td>
                      <td>{ticket.related_problem || ticket.observations || '—'}</td>
                      <td>{ticket.requester || '—'}</td>
                      <td style={{ fontSize: '13px', color: '#64748b' }}>{formatDate(ticket.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'inventory' && (
              <table className="helpclin-table">
                <thead>
                  <tr>
                    <th style={{ width: '110px' }}>CÓDIGO / TAG</th>
                    <th>EQUIPAMENTO</th>
                    <th style={{ width: '110px' }}>ESTADO</th>
                    <th>SETOR / LOCAL</th>
                    <th>FABRICANTE / MODELO</th>
                    <th>Nº DE SÉRIE</th>
                    <th style={{ width: '130px' }}>ÚLTIMA MANUTENÇÃO</th>
                  </tr>
                </thead>
                <tbody>
                  {finalFilteredInventory.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong style={{ color: 'var(--teal)', fontSize: '13px' }}>
                          {item.asset_tag || item.code || `EQ-${item.id}`}
                        </strong>
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--teal)' }}>{item.name || '—'}</td>
                      <td>
                        <span className={`os-status-badge ${item.status === 'active' ? 'os-status-badge--completed' : item.status === 'maintenance' ? 'os-status-badge--in_progress' : 'os-status-badge--open'}`}>
                          {item.status === 'active' ? 'Ativo' : item.status === 'maintenance' ? 'Manutenção' : item.status || 'Ativo'}
                        </span>
                      </td>
                      <td>{item.location || item.sector || '—'}</td>
                      <td>{item.manufacturer ? `${item.manufacturer} ${item.model || ''}` : item.model || '—'}</td>
                      <td>{item.serial_number || '—'}</td>
                      <td style={{ fontSize: '13px', color: '#64748b' }}>{formatDate(item.last_maintenance_at || item.updated_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <footer className="report-summary-footer">
              <span>
                Total exibido: <strong>{activeCount} {activeCount === 1 ? 'registro' : 'registros'}</strong> • Sistema HelpClinTec
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={handleExportXls}
                  style={{ height: '32px', fontSize: '12px' }}
                >
                  <FileSpreadsheet size={14} style={{ color: '#059669' }} /> Exportar Planilha
                </button>
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => handlePrintA4(true)}
                  style={{ height: '32px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                >
                  <Printer size={14} /> Imprimir A4
                </button>
              </div>
            </footer>
          </div>
        )}
      </section>
    </div>
  );
}

export default Reports;

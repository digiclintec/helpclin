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
  Edit3,
  ExternalLink,
  FileCheck2,
  FilePlus2,
  FileSpreadsheet,
  FileText,
  Filter,
  Headset,
  Laptop,
  Layers,
  Monitor,
  PieChart,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Stethoscope,
  TrendingUp,
  User,
  UserCheck,
  Users,
  Wrench,
  Trash2,
  AlertTriangle,
  X
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import {
  createEquipment,
  createServiceOrder,
  createSupportTicket,
  deleteSupportTicket,
  getInventory,
  getReportSummary,
  getServiceOrders,
  getStoredUser,
  getSupportTickets,
  updateServiceOrder
} from '../services/api.js';
import {
  getDaysSinceCompletion,
  getEffectiveOrderStatus,
  getOrderStatusBadgeClass,
  getOrderStatusLabel,
  isBillingPending,
  isBilled,
  isBillingModuleEnabled
} from '../utils/billingUtils.js';
import { matchOrderSearch, matchTicketSearch } from '../utils/searchUtils.js';

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function timeAgo(dateString) {
  if (!dateString) return 'recentemente';
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  if (diffInMinutes < 1) return 'Agora mesmo';
  if (diffInMinutes < 60) return `Há ${diffInMinutes} min`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `Há ${diffInHours} ${diffInHours === 1 ? 'hora' : 'horas'}`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `Há ${diffInDays} ${diffInDays === 1 ? 'dia' : 'dias'}`;
}

function Dashboard() {
  const user = getStoredUser();
  const [orders, setOrders] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [billingEnabled, setBillingEnabled] = useState(isBillingModuleEnabled);

  // Sub-tabs
  const [activeTab, setActiveTab] = useState('geral');

  // Modals state
  const [editingOrder, setEditingOrder] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [isNewEquipModalOpen, setIsNewEquipModalOpen] = useState(false);

  // New Order Form state
  const [newOrder, setNewOrder] = useState({
    patientName: '',
    serviceType: 'Manutenção Preventiva',
    priority: 'Normal',
    equipmentName: '',
    description: '',
    dueDate: '',
    status: 'open'
  });

  // New Equipment Form state
  const [newEquipment, setNewEquipment] = useState({
    name: '',
    equipmentType: 'Biomédico',
    serialNumber: '',
    status: 'Ativo',
    location: ''
  });

  // Orders Filter state
  const [activeKpiFilter, setActiveKpiFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [onlyMyOrders, setOnlyMyOrders] = useState(false);
  const [search, setSearch] = useState('');
  const [billedSearch, setBilledSearch] = useState('');

  // Tickets tab & deletion state on Dashboard
  const [ticketSearch, setTicketSearch] = useState('');
  const [ticketStatusFilter, setTicketStatusFilter] = useState('all');
  const [ticketToDelete, setTicketToDelete] = useState(null);
  const [isDeletingTicket, setIsDeletingTicket] = useState(false);

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

  // Calculate 100% Real Metrics & KPIs
  const now = new Date();
  const kpis = useMemo(() => {
    let openCount = 0;
    let inProgressCount = 0;
    let completedCount = 0;
    let billingPendingCount = 0;
    let billedCount = 0;
    let urgentCount = 0;

    orders.forEach((o) => {
      const effective = getEffectiveOrderStatus(o);
      if (effective === 'open') openCount++;
      if (effective === 'in_progress') inProgressCount++;
      if (effective === 'completed') completedCount++;
      if (effective === 'billing_pending') billingPendingCount++;
      if (effective === 'billed') billedCount++;

      const p = (o.priority || '').toLowerCase();
      const createdAt = new Date(o.created_at);
      const hoursOld = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
      if (effective !== 'completed' && effective !== 'billed' && (p === 'urgent' || p === 'high' || hoursOld > 24)) {
        urgentCount++;
      }
    });

    const totalOrders = orders.length;
    // 1 chamado gera automaticamente 1 ordem de serviço com número de controle.
    // Cada ordem representa um atendimento real. Contabilizamos apenas chamados sem OS para compatibilidade.
    const unlinkedTicketsCount = tickets.filter(
      (t) =>
        !t.service_order_id &&
        !orders.some(
          (o) =>
            o.support_ticket_id === t.id ||
            (o.order_number != null &&
              (Number(o.order_number) === Number(t.service_order_number) ||
                Number(o.order_number) === Number(t.ticket_number)))
        )
    ).length;
    const totalServices = totalOrders + unlinkedTicketsCount;

    const resolvedTickets = tickets.filter((t) => t.status === 'resolved').length;
    const activeTickets = tickets.filter((t) => t.status !== 'resolved').length;
    const ticketResolutionRate = tickets.length ? Math.round((resolvedTickets / tickets.length) * 100) : 0;
    const totalFinished = completedCount + billingPendingCount + billedCount;
    const orderCompletionRate = totalOrders ? Math.round((totalFinished / totalOrders) * 100) : 0;
    const billingRate = totalFinished ? Math.round((billedCount / totalFinished) * 100) : 0;

    // Unique sectors / locations from actual data
    const sectorsSet = new Set();
    orders.forEach((o) => { if (o.patient_name?.trim()) sectorsSet.add(o.patient_name.trim()); });
    inventory.forEach((i) => { if (i.location?.trim()) sectorsSet.add(i.location.trim()); });
    const totalSectors = sectorsSet.size;

    // Distinct users/technicians from actual data
    const usersSet = new Set();
    if (user?.name) usersSet.add(user.name);
    orders.forEach((o) => {
      if (o.technician_name?.trim()) usersSet.add(o.technician_name.trim());
      if (o.patient_name?.trim()) usersSet.add(o.patient_name.trim());
    });
    tickets.forEach((t) => {
      if (t.requester_name?.trim()) usersSet.add(t.requester_name.trim());
      if (t.technician_name?.trim()) usersSet.add(t.technician_name.trim());
    });
    const totalTeam = Math.max(usersSet.size, 1);

    return {
      totalOrders,
      totalServices,
      open: openCount,
      inProgress: inProgressCount,
      completed: completedCount,
      billingPending: billingPendingCount,
      billed: billedCount,
      urgent: urgentCount,
      orderCompletionRate,
      billingRate,
      totalEquipments: inventory.length,
      totalSectors,
      totalTeam,
      activeTickets,
      resolvedTickets,
      ticketResolutionRate
    };
  }, [orders, tickets, inventory, user]);

  // Aggregate real activities from orders and tickets
  const recentActivities = useMemo(() => {
    const list = [];

    orders.slice(0, 8).forEach((o) => {
      list.push({
        id: `os-${o.id}`,
        type: 'os',
        title: `Ordem de Serviço OS-${String(o.order_number || o.id).padStart(5, '0')}`,
        action: o.status === 'completed' ? 'Finalizada' : o.status === 'in_progress' ? 'Em execução' : 'Criada',
        user: o.technician_name || o.patient_name || 'Técnico Responsável',
        date: o.created_at,
        icon: FilePlus2,
        color: o.status === 'completed' ? '#397c65' : '#e78368'
      });
    });

    tickets.slice(0, 8).forEach((t) => {
      const ticketNum = t.service_order_number 
        ? `OS-${String(t.service_order_number).padStart(5, '0')}` 
        : t.ticket_number 
        ? `#${String(t.ticket_number).padStart(5, '0')}` 
        : typeof t.id === 'string' && t.id.length > 8 
        ? `#${t.id.slice(0, 8).toUpperCase()}` 
        : `#${t.id || '00001'}`;

      const problemTitle = t.related_problem || t.title || t.equipment_name || 'Solicitação de suporte';

      list.push({
        id: `ticket-${t.id}`,
        type: 'ticket',
        title: `Chamado ${ticketNum}: ${problemTitle}`,
        action: t.status === 'resolved' ? 'Resolvido' : t.status === 'in_progress' ? 'Em atendimento' : 'Aberto',
        user: t.assigned_to_name || t.requester || 'Equipe Clínica',
        date: t.created_at,
        icon: Headset,
        color: '#4d8796'
      });
    });

    return list.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()).slice(0, 10);
  }, [orders, tickets]);

  // Real weekly data from backend summary
  const weeklyData = useMemo(() => {
    if (summary?.weekly && Array.isArray(summary.weekly) && summary.weekly.length > 0) {
      return summary.weekly;
    }
    return [];
  }, [summary]);

  const totalWeeklyVolume = useMemo(() => {
    return weeklyData.reduce((acc, item) => acc + (item.orders || 0) + (item.tickets || 0), 0);
  }, [weeklyData]);

  const maxWeeklyValue = Math.max(...weeklyData.map((item) => Math.max(item.orders || 0, item.tickets || 0)), 1);

  // Status breakdown calculations for Donut Chart (real data)
  const statusBreakdown = useMemo(() => {
    const total = orders.length;
    if (total === 0) {
      return {
        open: { count: 0, pct: 0, color: '#316c79', label: 'Aberta' },
        inProgress: { count: 0, pct: 0, color: '#e78368', label: 'Em execução' },
        completed: { count: 0, pct: 0, color: '#397c65', label: 'Finalizada / Concluída' },
        urgent: { count: 0, pct: 0, color: '#f59e0b', label: 'Urgente / Atraso' }
      };
    }

    const open = orders.filter((o) => o.status === 'open').length;
    const inProgress = orders.filter((o) => o.status === 'in_progress').length;
    const completed = orders.filter((o) => o.status === 'completed').length;
    const urgent = kpis.urgent;

    const openPct = Math.round((open / total) * 100);
    const inProgPct = Math.round((inProgress / total) * 100);
    const compPct = Math.round((completed / total) * 100);
    const otherPct = Math.max(0, 100 - (openPct + inProgPct + compPct));

    return {
      open: { count: open, pct: openPct, color: '#316c79', label: 'Aberta' },
      inProgress: { count: inProgress, pct: inProgPct, color: '#e78368', label: 'Em execução' },
      completed: { count: completed, pct: compPct, color: '#397c65', label: 'Finalizada / Concluída' },
      urgent: { count: urgent, pct: otherPct, color: '#f59e0b', label: 'Urgente / Atraso' }
    };
  }, [orders, kpis]);

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (activeKpiFilter === 'open' && order.status !== 'open') return false;
      if (activeKpiFilter === 'in_progress' && order.status !== 'in_progress') return false;
      if (activeKpiFilter === 'completed' && order.status !== 'completed') return false;
      if (activeKpiFilter === 'urgent') {
        const p = (order.priority || '').toLowerCase();
        const createdAt = new Date(order.created_at);
        const hoursOld = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        const isUrgent = order.status !== 'completed' && (p === 'urgent' || p === 'high' || hoursOld > 24);
        if (!isUrgent) return false;
      }

      if (statusFilter !== 'all' && order.status !== statusFilter) return false;

      if (priorityFilter !== 'all') {
        const p = (order.priority || '').toLowerCase();
        if (priorityFilter === 'low' && !['low', 'pouco urgente', 'baixa'].includes(p)) return false;
        if (priorityFilter === 'normal' && p !== 'normal') return false;
        if (priorityFilter === 'high' && !['high', 'alta'].includes(p)) return false;
        if (priorityFilter === 'urgent' && !['urgent', 'urgente'].includes(p)) return false;
      }

      if (onlyMyOrders && user) {
        const isMyTechnician = order.technician_id === user.id || order.technician_name === user.name;
        const isMyRequest = order.created_by === user.id || order.patient_name === user.name;
        if (!isMyTechnician && !isMyRequest) return false;
      }

      if (search.trim() && !matchOrderSearch(order, search)) {
        return false;
      }

      return true;
    });
  }, [orders, activeKpiFilter, statusFilter, priorityFilter, onlyMyOrders, search, user]);

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

  function getStatusLabel(status) {
    switch (status) {
      case 'open':
        return 'Aberta';
      case 'in_progress':
        return 'Em andamento';
      case 'completed':
        return 'Concluída';
      case 'cancelled':
        return 'Cancelada';
      default:
        return status;
    }
  }

  function getStatusBadgeClass(status) {
    switch (status) {
      case 'open':
        return 'os-status-badge--open';
      case 'in_progress':
        return 'os-status-badge--in_progress';
      case 'completed':
        return 'os-status-badge--completed';
      case 'cancelled':
        return 'os-status-badge--cancelled';
      default:
        return 'os-status-badge--open';
    }
  }


  // Billed Orders Filtering & Export
  const billedOrders = useMemo(() => {
    return orders.filter((o) => getEffectiveOrderStatus(o) === 'billed');
  }, [orders]);

  const filteredBilledOrders = useMemo(() => {
    if (!billedSearch.trim()) return billedOrders;
    return billedOrders.filter((o) => matchOrderSearch(o, billedSearch));
  }, [billedOrders, billedSearch]);

  // Filtered Tickets for Dashboard Chamados tab
  const filteredDashboardTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (ticketStatusFilter !== 'all' && t.status !== ticketStatusFilter) return false;
      if (ticketSearch.trim() && !matchTicketSearch(t, ticketSearch)) return false;
      return true;
    });
  }, [tickets, ticketStatusFilter, ticketSearch]);

  async function handleConfirmDeleteTicket() {
    if (!ticketToDelete) return;
    setIsDeletingTicket(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await deleteSupportTicket(ticketToDelete.id);
      setTickets((prev) => prev.filter((t) => t.id !== ticketToDelete.id));
      setSuccessMessage(`Chamado ${ticketToDelete.service_order_number ? `OS-${String(ticketToDelete.service_order_number).padStart(5, '0')}` : `#${ticketToDelete.ticket_number || ticketToDelete.id}`} excluído com sucesso.`);
      setTicketToDelete(null);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsDeletingTicket(false);
    }
  }

  // Create New Order
  async function handleCreateOrder(event) {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage('');
    try {
      const created = await createServiceOrder({
        patientName: newOrder.patientName,
        serviceType: newOrder.serviceType,
        priority: newOrder.priority,
        equipmentName: newOrder.equipmentName,
        description: newOrder.description,
        dueDate: newOrder.dueDate || null,
        status: newOrder.status,
        technicianId: user?.id || null
      });

      setOrders([created, ...orders]);
      setIsNewOrderModalOpen(false);
      setNewOrder({
        patientName: '',
        serviceType: 'Manutenção Preventiva',
        priority: 'Normal',
        equipmentName: '',
        description: '',
        dueDate: '',
        status: 'open'
      });
      setSuccessMessage(`Ordem OS-${String(created.order_number || created.id).padStart(5, '0')} criada com sucesso!`);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsSaving(false);
    }
  }

  // Create New Equipment
  async function handleCreateEquipment(event) {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage('');
    try {
      const created = await createEquipment(newEquipment);
      setInventory([created, ...inventory]);
      setIsNewEquipModalOpen(false);
      setNewEquipment({
        name: '',
        equipmentType: 'Biomédico',
        serialNumber: '',
        status: 'Ativo',
        location: ''
      });
      setSuccessMessage(`Equipamento "${created.name}" cadastrado com sucesso!`);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsSaving(false);
    }
  }

  // Save Order Edit
  async function saveOrder(event) {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const updated = await updateServiceOrder(editingOrder.id, {
        serviceType: editingOrder.service_type,
        priority: editingOrder.priority,
        dueDate: editingOrder.due_date,
        requestedDescription: editingOrder.service_requested_description ?? editingOrder.description,
        performedDescription: editingOrder.service_performed_description,
        status: editingOrder.status,
        technicianId: editingOrder.technician_id
      });

      setOrders(
        orders.map((order) =>
          order.id === updated.id
            ? { ...order, ...updated, technician_name: user?.id === updated.technician_id ? user.name : order.technician_name }
            : order
        )
      );
      setEditingOrder(null);
      setSuccessMessage(`Ordem OS-${String(editingOrder.order_number || editingOrder.id).padStart(5, '0')} atualizada com sucesso!`);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="dash-container">
      {/* 1. TOP HEADER & METRICS BAR */}
      <header className="dash-header-strip">
        <div className="dash-header-main">
          <div className="dash-title-group">
            <span className="dash-eyebrow">
              <Sparkles size={13} /> Sistema de Gestão de Atendimento
            </span>
            <div className="dash-heading-row">
              <h1>PAINEL DE CONTROLE</h1>
              <span className="dash-clinic-badge">HelpClin</span>
            </div>
            <p className="dash-subtitle">Visão geral e indicadores operacionais em tempo real.</p>
          </div>

          <div className="dash-header-actions">
            <a
              href="/chamados?novo=1"
              className="primary-button dash-new-ticket-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '10px',
                fontWeight: '700',
                fontSize: '13px',
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(231, 131, 104, 0.3)'
              }}
            >
              <Plus size={16} />
              <span>Novo Chamado</span>
            </a>
          </div>
        </div>

        {/* 2. SUB NAVIGATION TABS & QUICK STATS */}
        <div className="dash-header-bottom">
          <nav className="dash-nav-tabs">
            <button
              type="button"
              className={`dash-tab-btn ${activeTab === 'geral' ? 'dash-tab-btn--active' : ''}`}
              onClick={() => setActiveTab('geral')}
            >
              <BarChart3 size={16} />
              <span>Visão Geral & Relatórios</span>
            </button>
            <button
              type="button"
              className={`dash-tab-btn ${activeTab === 'chamados' ? 'dash-tab-btn--active' : ''}`}
              onClick={() => setActiveTab('chamados')}
            >
              <Headset size={16} />
              <span>Chamados ({tickets.length})</span>
            </button>
            {billingEnabled && (
              <button
                type="button"
                className={`dash-tab-btn ${activeTab === 'faturadas' ? 'dash-tab-btn--active' : ''}`}
                onClick={() => setActiveTab('faturadas')}
              >
                <DollarSign size={16} />
                <span>Ordens Faturadas ({kpis.billed})</span>
              </button>
            )}
            <a
              href="/ordens"
              className="dash-tab-btn"
              title="Ir para a tela de Ordens de Serviço"
            >
              <FileText size={16} />
              <span>Ordens de Serviço ({orders.length})</span>
            </a>
            <button
              type="button"
              className={`dash-tab-btn ${activeTab === 'atividades' ? 'dash-tab-btn--active' : ''}`}
              onClick={() => setActiveTab('atividades')}
            >
              <Activity size={16} />
              <span>Histórico de Atividades</span>
            </button>
          </nav>

          <div className="dash-header-meta">
            <div className="dash-meta-item" title="Total de equipamentos cadastrados">
              <Laptop size={14} />
              <span>Equipamentos:</span>
              <strong>{kpis.totalEquipments}</strong>
            </div>
            <div className="dash-meta-item" title="Setores cadastrados">
              <Building2 size={14} />
              <span>Setores:</span>
              <strong>{kpis.totalSectors}</strong>
            </div>
            <div className="dash-meta-item" title="Usuários ativos">
              <Users size={14} />
              <span>Equipe:</span>
              <strong>{kpis.totalTeam}</strong>
            </div>
            <div className="dash-meta-item" title="Taxa de conclusão de ordens">
              <CheckCircle2 size={14} />
              <span>Taxa de Conclusão:</span>
              <strong>{kpis.orderCompletionRate}%</strong>
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      {successMessage && <div className="dash-alert dash-alert--success">{successMessage}</div>}
      {errorMessage && <div className="dash-alert dash-alert--error">{errorMessage}</div>}

      {/* Freelancer Billing Alert Banner */}
      {billingEnabled && kpis.billingPending > 0 && (
        <div className="billing-client-alert" style={{ margin: '0 24px 20px 24px' }}>
          <AlertCircle size={22} style={{ color: '#b45309', flexShrink: 0, marginTop: '2px' }} />
          <div style={{ flex: 1 }}>
            <strong>Atenção Freelancer: {kpis.billingPending} Ordem{kpis.billingPending > 1 ? 'ns' : ''} com Pendência de Faturamento</strong>
            <p>
              Existem ordens concluídas com pendência de faturamento regulamentar. O cliente já foi notificado e você pode auditar e dar baixa a qualquer momento.
            </p>
          </div>
          <a
            href="/ordens"
            className="billing-quick-bill-btn"
            style={{ textDecoration: 'none' }}
          >
            Ver e Faturar Ordens
          </a>
        </div>
      )}

      {/* 3. TOP KPI SUMMARY CARDS */}
      <section className="dash-kpi-row">
        <article className="dash-kpi-card dash-kpi-card--primary">
          <div className="dash-kpi-header">
            <span className="dash-kpi-label">Total de Atendimentos</span>
            <div className="dash-kpi-icon-pill">
              <Layers size={16} />
            </div>
          </div>
          <strong className="dash-kpi-value">{kpis.totalServices}</strong>
          <div className="dash-kpi-trend dash-kpi-trend--positive">
            <Activity size={12} />
            <span>{kpis.totalOrders} ordens de serviço ativas</span>
          </div>
        </article>

        <article className="dash-kpi-card">
          <div className="dash-kpi-header">
            <span className="dash-kpi-label">OS's Criadas</span>
            <div className="dash-kpi-icon-pill dash-kpi-icon-pill--mint">
              <FilePlus2 size={16} />
            </div>
          </div>
          <strong className="dash-kpi-value">{kpis.totalOrders}</strong>
          <div className="dash-kpi-trend dash-kpi-trend--positive">
            <CheckCircle2 size={12} />
            <span>{kpis.open} abertas / aguardando</span>
          </div>
        </article>

        {billingEnabled ? (
          <>
            <article
              className="dash-kpi-card dash-kpi-card--billed"
              onClick={() => setActiveTab('faturadas')}
              role="button"
              tabIndex={0}
              style={{ cursor: 'pointer' }}
              title="Clique para ver a tela de ordens faturadas"
            >
              <div className="dash-kpi-header">
                <span className="dash-kpi-label">Ordens Faturadas</span>
                <div className="dash-kpi-icon-pill">
                  <CheckCircle2 size={16} />
                </div>
              </div>
              <strong className="dash-kpi-value">{kpis.billed}</strong>
              <div className="dash-kpi-trend">
                <ArrowRight size={12} />
                <span>{kpis.billingRate}% das finalizadas faturadas</span>
              </div>
            </article>

            <article
              className={`dash-kpi-card ${kpis.billingPending > 0 ? 'dash-kpi-card--pending' : ''}`}
              style={{ cursor: 'pointer' }}
              onClick={() => setActiveTab('faturadas')}
              role="button"
              tabIndex={0}
              title="Clique para ver o painel financeiro"
            >
              <div className="dash-kpi-header">
                <span className="dash-kpi-label">Faturamento Pendente</span>
                <div className="dash-kpi-icon-pill">
                  <Clock size={16} />
                </div>
              </div>
              <strong className="dash-kpi-value">{kpis.billingPending}</strong>
              <div className="dash-kpi-trend">
                <span>{kpis.billingPending > 0 ? `${kpis.billingPending} aguardando baixa` : 'Sem pendências financeiras'}</span>
              </div>
            </article>
          </>
        ) : (
          <>
            <article
              className="dash-kpi-card dash-kpi-card--billed"
              onClick={() => setActiveTab('geral')}
              role="button"
              tabIndex={0}
              style={{ cursor: 'pointer' }}
              title="Ordens concluídas pela equipe interna"
            >
              <div className="dash-kpi-header">
                <span className="dash-kpi-label">Ordens Concluídas</span>
                <div className="dash-kpi-icon-pill dash-kpi-icon-pill--mint">
                  <CheckCircle2 size={16} />
                </div>
              </div>
              <strong className="dash-kpi-value">{kpis.completed}</strong>
              <div className="dash-kpi-trend dash-kpi-trend--positive">
                <CheckCircle2 size={12} />
                <span>{kpis.orderCompletionRate}% taxa de conclusão técnica</span>
              </div>
            </article>

            <article
              className="dash-kpi-card"
              role="button"
              tabIndex={0}
              style={{ cursor: 'default' }}
              title="Modo Equipe Própria ativo: sem cobrança de O.S."
            >
              <div className="dash-kpi-header">
                <span className="dash-kpi-label">Modelo Operacional</span>
                <div className="dash-kpi-icon-pill dash-kpi-icon-pill--mint">
                  <ShieldCheck size={16} />
                </div>
              </div>
              <strong className="dash-kpi-value" style={{ fontSize: '18px', paddingTop: '4px' }}>Equipe Interna</strong>
              <div className="dash-kpi-trend">
                <span style={{ color: 'var(--muted)' }}>Cobrança por O.S. desativada</span>
              </div>
            </article>
          </>
        )}

        <article
          className="dash-kpi-card"
          onClick={() => setActiveTab('chamados')}
          role="button"
          tabIndex={0}
          style={{ cursor: 'pointer' }}
          title="Clique para ver e gerenciar chamados de suporte"
        >
          <div className="dash-kpi-header">
            <span className="dash-kpi-label">Chamados & Suporte</span>
            <div className="dash-kpi-icon-pill dash-kpi-icon-pill--coral">
              <Headset size={16} />
            </div>
          </div>
          <strong className="dash-kpi-value">{kpis.activeTickets}</strong>
          <div className="dash-kpi-trend dash-kpi-trend--neutral">
            <Clock3 size={12} />
            <span>{kpis.ticketResolutionRate}% taxa de resolução</span>
          </div>
        </article>
      </section>

      {/* 4. QUICK ACTION BAR */}
      <section className="dash-quick-bar">
        <button type="button" className="dash-quick-btn" onClick={() => setIsNewOrderModalOpen(true)}>
          <div className="dash-quick-icon dash-quick-icon--teal">
            <FilePlus2 size={18} />
          </div>
          <div className="dash-quick-info">
            <small>Nova</small>
            <strong>Ordem de Serviço</strong>
          </div>
        </button>

        <a href="/chamados?novo=1" className="dash-quick-btn">
          <div className="dash-quick-icon dash-quick-icon--blue">
            <Headset size={18} />
          </div>
          <div className="dash-quick-info">
            <small>Novo</small>
            <strong>Chamado Técnico</strong>
          </div>
        </a>

        <button type="button" className="dash-quick-btn" onClick={() => setIsNewEquipModalOpen(true)}>
          <div className="dash-quick-icon dash-quick-icon--mint">
            <Laptop size={18} />
          </div>
          <div className="dash-quick-info">
            <small>Novo</small>
            <strong>Equipamento</strong>
          </div>
        </button>

        <a href="/inventario" className="dash-quick-btn">
          <div className="dash-quick-icon dash-quick-icon--coral">
            <Building2 size={18} />
          </div>
          <div className="dash-quick-info">
            <small>Inventário</small>
            <strong>Gestão de Ativos</strong>
          </div>
        </a>
      </section>

      {/* 5. TAB 1: VISÃO GERAL & RELATÓRIOS (INTEGRATED REPORTS) */}
      {activeTab === 'geral' && (
        <>
          <div className="dash-analytics-grid">
            {/* Chart 1: Donut Chart - Status Distribution */}
            <article className="dash-card dash-chart-card">
              <div className="dash-card-header">
                <div>
                  <span className="dash-card-eyebrow">Distribuição de Status</span>
                  <h2>Ordens de Serviço</h2>
                </div>
                <a
                  href="/ordens"
                  className="dash-text-btn"
                  title="Ver todas as ordens"
                >
                  Ver listagem <ArrowRight size={14} />
                </a>
              </div>

              <div className="dash-donut-container">
                <div className="dash-donut-visual">
                  <div
                    className="dash-donut-ring"
                    style={{
                      background: orders.length === 0
                        ? '#e5eae7'
                        : `conic-gradient(
                            #397c65 0% ${statusBreakdown.completed.pct}%,
                            #e78368 ${statusBreakdown.completed.pct}% ${statusBreakdown.completed.pct + statusBreakdown.inProgress.pct}%,
                            #316c79 ${statusBreakdown.completed.pct + statusBreakdown.inProgress.pct}% ${statusBreakdown.completed.pct + statusBreakdown.inProgress.pct + statusBreakdown.open.pct}%,
                            #f59e0b ${statusBreakdown.completed.pct + statusBreakdown.inProgress.pct + statusBreakdown.open.pct}% 100%
                          )`
                    }}
                  >
                    <div className="dash-donut-center">
                      <strong>{orders.length}</strong>
                      <span>Total de OS</span>
                    </div>
                  </div>
                </div>

                <div className="dash-donut-legend">
                  <div className="dash-legend-item">
                    <i className="dash-dot" style={{ background: '#397c65' }} />
                    <span>Concluídas</span>
                    <b>{statusBreakdown.completed.count} ({statusBreakdown.completed.pct}%)</b>
                  </div>
                  <div className="dash-legend-item">
                    <i className="dash-dot" style={{ background: '#e78368' }} />
                    <span>Em execução</span>
                    <b>{statusBreakdown.inProgress.count} ({statusBreakdown.inProgress.pct}%)</b>
                  </div>
                  <div className="dash-legend-item">
                    <i className="dash-dot" style={{ background: '#316c79' }} />
                    <span>Abertas</span>
                    <b>{statusBreakdown.open.count} ({statusBreakdown.open.pct}%)</b>
                  </div>
                  <div className="dash-legend-item">
                    <i className="dash-dot" style={{ background: '#f59e0b' }} />
                    <span>Urgentes / Atraso</span>
                    <b>{statusBreakdown.urgent.count}</b>
                  </div>
                </div>
              </div>
            </article>

            {/* Chart 2: Bars Chart - Volume Evolution */}
            <article className="dash-card dash-chart-card">
              <div className="dash-card-header">
                <div>
                  <span className="dash-card-eyebrow">Volume de Atendimento</span>
                  <h2>Evolução por Período</h2>
                </div>
                <div className="dash-chart-legend-top">
                  <span><i className="dash-dot" style={{ background: 'var(--coral)' }} /> OS Criadas</span>
                  <span><i className="dash-dot" style={{ background: '#397c65' }} /> Chamados</span>
                </div>
              </div>

              {weeklyData.length === 0 || totalWeeklyVolume === 0 ? (
                <div className="dash-empty-text" style={{ padding: '60px 0', textAlign: 'center' }}>
                  <BarChart3 size={32} style={{ color: '#8faea1', margin: '0 auto 10px', display: 'block' }} />
                  <strong style={{ display: 'block', color: 'var(--teal)', marginBottom: '4px' }}>Sem atendimentos no período</strong>
                  <span style={{ fontSize: '12px', color: '#8faea1' }}>O gráfico será gerado automaticamente com os novos atendimentos registrados.</span>
                </div>
              ) : (
                <div className="dash-bars-wrap">
                  <div className="dash-y-labels">
                    <span>{maxWeeklyValue}</span>
                    <span>{Math.round(maxWeeklyValue * 0.75)}</span>
                    <span>{Math.round(maxWeeklyValue * 0.5)}</span>
                    <span>{Math.round(maxWeeklyValue * 0.25)}</span>
                    <span>0</span>
                  </div>

                  <div className="dash-bars-columns">
                    {weeklyData.map((item, idx) => (
                      <div className="dash-bar-col" key={idx}>
                        <div className="dash-bar-pair">
                          <div className="dash-bar-track" title={`${item.orders} ordens de serviço`}>
                            <div
                              className="dash-bar-fill dash-bar-fill--orders"
                              style={{ height: `${Math.min(100, (item.orders / maxWeeklyValue) * 100)}%` }}
                            />
                          </div>
                          <div className="dash-bar-track" title={`${item.tickets} chamados`}>
                            <div
                              className="dash-bar-fill dash-bar-fill--tickets"
                              style={{ height: `${Math.min(100, (item.tickets / maxWeeklyValue) * 100)}%` }}
                            />
                          </div>
                        </div>
                        <span className="dash-bar-label">{item.week}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </article>

            {/* Activity Feed Sidebar */}
            <article className="dash-card dash-activity-card">
              <div className="dash-card-header">
                <div>
                  <span className="dash-card-eyebrow">Tempo Real</span>
                  <h2>Histórico de Atividades</h2>
                </div>
                <button
                  type="button"
                  className="dash-reload-btn"
                  onClick={loadAllData}
                  title="Atualizar dados"
                >
                  <RefreshCw size={14} />
                </button>
              </div>

              <div className="dash-activity-list">
                {recentActivities.length === 0 ? (
                  <div className="dash-empty-text" style={{ padding: '40px 15px', textAlign: 'center' }}>
                    <Activity size={26} style={{ color: '#8faea1', margin: '0 auto 8px', display: 'block' }} />
                    <strong style={{ display: 'block', color: 'var(--teal)', fontSize: '13px', marginBottom: '4px' }}>
                      Nenhuma atividade recente
                    </strong>
                    <span style={{ fontSize: '11px', color: '#8faea1' }}>
                      Novas movimentações aparecerão aqui conforme chamados e ordens forem criados.
                    </span>
                  </div>
                ) : (
                  recentActivities.map((act) => {
                    const IconComponent = act.icon;
                    return (
                      <div className="dash-activity-item" key={act.id}>
                        <div className="dash-activity-icon" style={{ color: act.color, backgroundColor: `${act.color}18` }}>
                          <IconComponent size={15} />
                        </div>
                        <div className="dash-activity-details">
                          <strong>{act.title}</strong>
                          <span>
                            {act.action} • <small>{act.user}</small>
                          </span>
                        </div>
                        <time>{timeAgo(act.date)}</time>
                      </div>
                    );
                  })
                )}
              </div>
            </article>
          </div>

          {/* Quick Preview Table of Recent Orders */}
          <section className="dash-card" style={{ marginTop: '20px', padding: '24px' }}>
            <div className="dash-card-header" style={{ marginBottom: '18px' }}>
              <div>
                <span className="dash-card-eyebrow">Visão Operacional</span>
                <h2>Últimas Ordens de Serviço</h2>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <a
                  href="/ordens"
                  className="secondary-button"
                >
                  Ver Todas as {orders.length} Ordens <ArrowRight size={14} />
                </a>
              </div>
            </div>

            {orders.length === 0 ? (
              <div className="dash-empty-text" style={{ padding: '30px 0' }}>
                <FileText size={28} style={{ color: '#8faea1', margin: '0 auto 8px' }} />
                <span>Nenhuma ordem de serviço cadastrada no momento.</span>
              </div>
            ) : (
              <div className="helpclin-table-wrapper">
                <table className="helpclin-table">
                  <thead>
                    <tr>
                      <th style={{ width: '120px' }}>Prioridade</th>
                      <th style={{ width: '110px' }}>Número OS</th>
                      <th style={{ width: '130px' }}>Estado</th>
                      <th>Solicitante / Setor</th>
                      <th>Equipamento</th>
                      <th>Responsável Técnico</th>
                      <th>Data</th>
                      <th style={{ width: '80px', textAlign: 'center' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 5).map((order) => (
                      <tr key={order.id}>
                        <td>
                          <span className={`ticket-priority-badge ${getPriorityBadgeClass(order.priority)}`}>
                            {getPriorityLabel(order.priority)}
                          </span>
                        </td>
                        <td>
                          <strong style={{ color: 'var(--teal)' }}>
                            OS-{String(order.order_number || order.id).padStart(5, '0')}
                          </strong>
                        </td>
                        <td>
                          {(() => {
                            const effective = getEffectiveOrderStatus(order);
                            return (
                              <span className={`os-status-badge ${getOrderStatusBadgeClass(effective)}`}>
                                {getOrderStatusLabel(effective)}
                              </span>
                            );
                          })()}
                        </td>
                        <td>{order.patient_name || 'Setor Geral'}</td>
                        <td>{order.equipment_name || 'Serviço Geral'}</td>
                        <td>{order.technician_name || 'Não atribuído'}</td>
                        <td>{formatDate(order.created_at)}</td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className="order-edit-button"
                            onClick={() => setEditingOrder(order)}
                            title="Editar ordem de serviço"
                            style={{ margin: '0 auto' }}
                          >
                            <Edit3 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {/* 6. TAB 2: HISTÓRICO DE ATIVIDADES (AUDIT LOG) */}
      {activeTab === 'atividades' && (
        <section className="dash-card" style={{ padding: '24px' }}>
          <div className="dash-card-header" style={{ marginBottom: '20px' }}>
            <div>
              <span className="dash-card-eyebrow">Auditoria & Movimentações</span>
              <h2>Histórico Completo de Atividades</h2>
            </div>
            <button type="button" className="secondary-button" onClick={loadAllData}>
              <RefreshCw size={14} /> Atualizar Linha do Tempo
            </button>
          </div>

          <div className="dash-timeline">
            {recentActivities.length === 0 ? (
              <div className="dash-empty-text" style={{ padding: '60px 20px', textAlign: 'center' }}>
                <Activity size={32} style={{ color: '#8faea1', margin: '0 auto 12px', display: 'block' }} />
                <strong style={{ display: 'block', color: 'var(--teal)', fontSize: '15px', marginBottom: '6px' }}>
                  Nenhum registro no histórico
                </strong>
                <span style={{ fontSize: '12px', color: '#8faea1' }}>
                  A linha do tempo de auditoria será preenchida automaticamente conforme novos chamados forem abertos e ordens de serviço executadas.
                </span>
              </div>
            ) : (
              recentActivities.map((act) => {
                const IconComponent = act.icon;
                return (
                  <div className="dash-timeline-node" key={act.id}>
                    <div className="dash-timeline-badge" style={{ color: act.color, backgroundColor: `${act.color}20` }}>
                      <IconComponent size={18} />
                    </div>
                    <div className="dash-timeline-content">
                      <div className="dash-timeline-head">
                        <strong>{act.title}</strong>
                        <time>{formatDate(act.date)} ({timeAgo(act.date)})</time>
                      </div>
                      <p>
                        Ação: <b>{act.action}</b> — Responsável: <b>{act.user}</b>
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      )}

      {/* 7. TAB 3: ORDENS FATURADAS (TELA DE FATURAMENTO DEDICADA) */}
      {activeTab === 'faturadas' && (
        <section className="dash-faturadas-section" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Header da Tela de Ordens Faturadas */}
          <div className="dash-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <span className="dash-card-eyebrow" style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={14} /> Faturamento Confirmado
                </span>
                <h2 style={{ margin: '4px 0 8px 0', fontSize: '20px', color: 'var(--teal)' }}>
                  Ordens de Serviço Faturadas
                </h2>
                <p style={{ margin: 0, fontSize: '14px', color: '#64748b', maxWidth: '650px' }}>
                  Acompanhe e audite todas as ordens com faturamento formalizado pelo administrador freelancer. 
                  Ordens concluídas entram em pendência após 48h caso não faturadas.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <a href="/relatorios" className="secondary-button" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }} title="Ir para a Central de Relatórios">
                  <BarChart3 size={15} /> Central de Relatórios
                </a>
                <a href="/ordens" className="secondary-button" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={15} /> Todas as OS
                </a>
              </div>
            </div>

            {/* Mini KPIs de Faturamento */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '24px' }}>
              <div style={{ padding: '16px', borderRadius: '10px', background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#166534', display: 'block', marginBottom: '4px' }}>
                  Ordens Faturadas
                </span>
                <strong style={{ fontSize: '24px', color: '#15803d' }}>{kpis.billed}</strong>
                <span style={{ fontSize: '12px', color: '#166534', display: 'block', marginTop: '4px' }}>
                  Faturamento concluído
                </span>
              </div>

              <div style={{ padding: '16px', borderRadius: '10px', background: '#fffbeb', border: '1px solid #fde68a' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#92400e', display: 'block', marginBottom: '4px' }}>
                  Pendência de Faturamento
                </span>
                <strong style={{ fontSize: '24px', color: '#b45309' }}>{kpis.billingPending}</strong>
                <span style={{ fontSize: '12px', color: '#92400e', display: 'block', marginTop: '4px' }}>
                  Aguardando faturamento (&gt; 48h)
                </span>
              </div>

              <div style={{ padding: '16px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                  Taxa de Faturamento
                </span>
                <strong style={{ fontSize: '24px', color: 'var(--teal)' }}>{kpis.billingRate}%</strong>
                <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginTop: '4px' }}>
                  Das ordens finalizadas
                </span>
              </div>

              <div style={{ padding: '16px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                  Total Finalizadas
                </span>
                <strong style={{ fontSize: '24px', color: 'var(--ink)' }}>
                  {kpis.completed + kpis.billingPending + kpis.billed}
                </strong>
                <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginTop: '4px' }}>
                  Prontas para cobrança
                </span>
              </div>
            </div>
          </div>

          {/* Barra de Filtros da Tela de Faturadas */}
          <div className="dash-card" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="search-control" style={{ width: '320px' }}>
                  <Search size={16} />
                  <input
                    value={billedSearch}
                    onChange={(e) => setBilledSearch(e.target.value)}
                    placeholder="Filtrar por OS, setor, serviço ou técnico..."
                    aria-label="Filtrar ordens faturadas"
                  />
                </div>
                {billedSearch && (
                  <button
                    type="button"
                    className="secondary-button"
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                    onClick={() => setBilledSearch('')}
                  >
                    Limpar
                  </button>
                )}
              </div>

              <span style={{ fontSize: '13px', color: '#64748b' }}>
                Mostrando <b>{filteredBilledOrders.length}</b> de <b>{billedOrders.length}</b> faturadas
              </span>
            </div>
          </div>

          {/* Listagem / Tabela de Ordens Faturadas */}
          <div className="dash-card" style={{ padding: '0', overflow: 'hidden' }}>
            {filteredBilledOrders.length === 0 ? (
              <div className="dash-empty-text" style={{ padding: '60px 20px', textAlign: 'center' }}>
                <CheckCircle2 size={36} style={{ color: '#8faea1', margin: '0 auto 12px', display: 'block' }} />
                <strong style={{ display: 'block', color: 'var(--teal)', fontSize: '16px', marginBottom: '6px' }}>
                  {billedSearch ? 'Nenhuma ordem faturada encontrada para a busca' : 'Nenhuma ordem de serviço faturada no momento'}
                </strong>
                <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '500px', margin: '0 auto 16px' }}>
                  {billedSearch
                    ? 'Tente ajustar os termos de pesquisa para localizar a ordem faturada.'
                    : 'Quando uma ordem de serviço concluída for faturada pelo administrador, ela aparecerá listada aqui permanentemente com os dados de quitação.'}
                </p>
                <a href="/ordens" className="primary-button" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={16} /> Ver Ordens de Serviço
                </a>
              </div>
            ) : (
              <div className="helpclin-table-wrapper">
                <table className="helpclin-table">
                  <thead>
                    <tr>
                      <th style={{ width: '110px' }}>Ordem</th>
                      <th>Setor / Solicitante</th>
                      <th>Serviço / Ativo</th>
                      <th>Técnico Responsável</th>
                      <th style={{ width: '135px' }}>Concluída em</th>
                      <th style={{ width: '160px' }}>Data do Pagamento / Faturamento</th>
                      <th style={{ width: '120px' }}>Status</th>
                      <th style={{ width: '90px', textAlign: 'right' }}>Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBilledOrders.map((order) => (
                      <tr key={order.id}>
                        <td>
                          <span style={{ fontWeight: 700, color: 'var(--teal)', fontSize: '13px' }}>
                            OS-{String(order.order_number || order.id).padStart(5, '0')}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--teal)' }}>
                          {order.patient_name}
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 500 }}>{order.service_type}</span>
                            {order.equipment_name && (
                              <small style={{ color: '#64748b' }}>{order.equipment_name}</small>
                            )}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#2b6351', fontWeight: 500 }}>
                            <UserCheck size={14} />
                            <span>{order.technician_name || 'Técnico Responsável'}</span>
                          </div>
                        </td>
                        <td style={{ fontSize: '13px', color: '#475569' }}>
                          {formatDate(order.completed_at || order.updated_at)}
                        </td>
                        <td style={{ fontSize: '13px', color: '#065f46', fontWeight: 600 }}>
                          {formatDate(order.billed_at || order.updated_at)}
                        </td>
                        <td>
                          <span className="os-status-badge os-status-badge--billed" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle2 size={12} /> Faturada
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="secondary-button"
                            style={{ padding: '4px 10px', fontSize: '12px' }}
                            onClick={() => setEditingOrder(order)}
                          >
                            Ver
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 8. TAB 4: CHAMADOS DE SUPORTE (GERENCIAMENTO NO DASHBOARD) */}
      {activeTab === 'chamados' && (
        <section className="dash-chamados-section" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="dash-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <span className="dash-card-eyebrow" style={{ color: '#e78368', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Headset size={14} /> Atendimento & Suporte
                </span>
                <h2 style={{ margin: '4px 0 8px 0', fontSize: '20px', color: 'var(--teal)' }}>
                  Chamados Técnicos Registrados
                </h2>
                <p style={{ margin: 0, fontSize: '14px', color: '#64748b', maxWidth: '650px' }}>
                  Acompanhe os chamados de suporte, filtre por situação e apague chamados realizados para testes.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <a
                  href="/chamados?novo=1"
                  className="primary-button"
                  style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
                >
                  <Plus size={15} /> Novo Chamado
                </a>
                <a
                  href="/chamados"
                  className="secondary-button"
                  style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
                >
                  Central Completa <ArrowRight size={14} />
                </a>
              </div>
            </div>

            {/* Mini KPIs de Chamados */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '14px', marginTop: '24px' }}>
              <div
                style={{ padding: '14px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', cursor: 'pointer' }}
                onClick={() => setTicketStatusFilter('all')}
              >
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569', display: 'block', textTransform: 'uppercase' }}>Total</span>
                <strong style={{ fontSize: '22px', color: 'var(--teal)' }}>{tickets.length}</strong>
                <small style={{ color: '#64748b', display: 'block' }}>registrados</small>
              </div>

              <div
                style={{ padding: '14px', borderRadius: '10px', background: '#eff6ff', border: '1px solid #bfdbfe', cursor: 'pointer' }}
                onClick={() => setTicketStatusFilter('open')}
              >
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#1e40af', display: 'block', textTransform: 'uppercase' }}>Abertos</span>
                <strong style={{ fontSize: '22px', color: '#1d4ed8' }}>{tickets.filter((t) => t.status === 'open').length}</strong>
                <small style={{ color: '#1e40af', display: 'block' }}>aguardando</small>
              </div>

              <div
                style={{ padding: '14px', borderRadius: '10px', background: '#fff7ed', border: '1px solid #fed7aa', cursor: 'pointer' }}
                onClick={() => setTicketStatusFilter('in_progress')}
              >
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#9a3412', display: 'block', textTransform: 'uppercase' }}>Em Andamento</span>
                <strong style={{ fontSize: '22px', color: '#c2410c' }}>{tickets.filter((t) => t.status === 'in_progress').length}</strong>
                <small style={{ color: '#9a3412', display: 'block' }}>em execução</small>
              </div>

              <div
                style={{ padding: '14px', borderRadius: '10px', background: '#f0fdf4', border: '1px solid #bbf7d0', cursor: 'pointer' }}
                onClick={() => setTicketStatusFilter('resolved')}
              >
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#166534', display: 'block', textTransform: 'uppercase' }}>Resolvidos</span>
                <strong style={{ fontSize: '22px', color: '#15803d' }}>{tickets.filter((t) => t.status === 'resolved').length}</strong>
                <small style={{ color: '#166534', display: 'block' }}>finalizados</small>
              </div>

              <div
                style={{ padding: '14px', borderRadius: '10px', background: '#fef2f2', border: '1px solid #fecaca', cursor: 'pointer' }}
                onClick={() => setTicketStatusFilter('cancelled')}
              >
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#991b1b', display: 'block', textTransform: 'uppercase' }}>Cancelados / Teste</span>
                <strong style={{ fontSize: '22px', color: '#dc2626' }}>{tickets.filter((t) => t.status === 'cancelled').length}</strong>
                <small style={{ color: '#991b1b', display: 'block' }}>OS apagada / cancelado</small>
              </div>
            </div>
          </div>

          {/* Barra de Filtros de Chamados */}
          <div className="dash-card" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <div className="search-control" style={{ width: '280px' }}>
                  <Search size={16} />
                  <input
                    value={ticketSearch}
                    onChange={(e) => setTicketSearch(e.target.value)}
                    placeholder="Filtrar por OS, setor, problema, técnico..."
                    aria-label="Filtrar chamados"
                  />
                </div>

                <select
                  value={ticketStatusFilter}
                  onChange={(e) => setTicketStatusFilter(e.target.value)}
                  style={{
                    height: '38px',
                    padding: '0 12px',
                    border: '1px solid var(--line)',
                    borderRadius: '9px',
                    background: '#fbfcfa',
                    color: 'var(--teal)',
                    fontSize: '12px',
                    fontWeight: 600
                  }}
                  aria-label="Filtro de status de chamado"
                >
                  <option value="all">Todos os status</option>
                  <option value="open">Abertos</option>
                  <option value="in_progress">Em andamento</option>
                  <option value="resolved">Resolvidos</option>
                  <option value="cancelled">Cancelados / Testes</option>
                </select>

                {(ticketSearch || ticketStatusFilter !== 'all') && (
                  <button
                    type="button"
                    className="secondary-button"
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                    onClick={() => {
                      setTicketSearch('');
                      setTicketStatusFilter('all');
                    }}
                  >
                    Limpar
                  </button>
                )}
              </div>

              <span style={{ fontSize: '13px', color: '#64748b' }}>
                Mostrando <b>{filteredDashboardTickets.length}</b> de <b>{tickets.length}</b> chamados
              </span>
            </div>
          </div>

          {/* Listagem de Chamados */}
          <div className="dash-card" style={{ padding: '0', overflow: 'hidden' }}>
            {filteredDashboardTickets.length === 0 ? (
              <div className="dash-empty-text" style={{ padding: '60px 20px', textAlign: 'center' }}>
                <Headset size={36} style={{ color: '#8faea1', margin: '0 auto 12px', display: 'block' }} />
                <strong style={{ display: 'block', color: 'var(--teal)', fontSize: '16px', marginBottom: '6px' }}>
                  {ticketSearch || ticketStatusFilter !== 'all' ? 'Nenhum chamado encontrado para os filtros' : 'Nenhum chamado registrado'}
                </strong>
                <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '500px', margin: '0 auto 16px' }}>
                  {ticketSearch || ticketStatusFilter !== 'all'
                    ? 'Tente ajustar os termos de pesquisa ou selecionar outro status.'
                    : 'Novas solicitações de suporte aparecerão aqui.'}
                </p>
                <a href="/chamados?novo=1" className="primary-button" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <Plus size={16} /> Abrir Chamado
                </a>
              </div>
            ) : (
              <div className="helpclin-table-wrapper">
                <table className="helpclin-table">
                  <thead>
                    <tr>
                      <th style={{ width: '110px' }}>Chamado / OS</th>
                      <th style={{ width: '120px' }}>Situação</th>
                      <th>Solicitante / Setor</th>
                      <th>Equipamento / Ativo</th>
                      <th>Problema Relatado</th>
                      <th>Responsável Técnico</th>
                      <th style={{ width: '130px' }}>Aberto em</th>
                      <th style={{ width: '140px', textAlign: 'center' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDashboardTickets.map((ticket) => (
                      <tr key={ticket.id}>
                        <td>
                          <span style={{ fontWeight: 700, color: 'var(--teal)', fontSize: '13px' }}>
                            OS-{String(ticket.service_order_number || ticket.ticket_number || ticket.id).padStart(5, '0')}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`ticket-status ticket-status--${ticket.status}`}
                            style={{
                              fontSize: '11px',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              display: 'inline-block',
                              backgroundColor: ticket.status === 'cancelled' ? '#fee2e2' : undefined,
                              color: ticket.status === 'cancelled' ? '#b91c1c' : undefined
                            }}
                          >
                            {ticket.status === 'open'
                              ? 'Aberto'
                              : ticket.status === 'in_progress'
                              ? 'Em andamento'
                              : ticket.status === 'cancelled'
                              ? 'Cancelado'
                              : 'Resolvido'}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--teal)' }}>
                          {ticket.requester || ticket.company_sector || 'Recepção'}
                        </td>
                        <td>{ticket.equipment_name || 'Serviço Geral'}</td>
                        <td>
                          <div style={{ maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={ticket.related_problem || ticket.title}>
                            {ticket.related_problem || ticket.title || '—'}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: ticket.assigned_to_name ? '#2b6351' : '#94a3b8' }}>
                            <UserCheck size={13} />
                            <span>{ticket.assigned_to_name || 'Aguardando atendimento'}</span>
                          </div>
                        </td>
                        <td style={{ fontSize: '13px', color: '#64748b' }}>
                          {formatDate(ticket.created_at)}
                        </td>
                        <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            {ticket.service_order_id ? (
                              <a
                                href="/ordens"
                                className="secondary-button"
                                style={{ padding: '4px 8px', fontSize: '11px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                title="Acessar Ordem de Serviço"
                              >
                                Ver na OS <ExternalLink size={11} />
                              </a>
                            ) : (
                              <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>
                                {ticket.status === 'cancelled' ? 'OS Cancelada' : 'Sem OS'}
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={() => setTicketToDelete(ticket)}
                              className="secondary-button"
                              style={{
                                padding: '4px 7px',
                                fontSize: '11px',
                                color: '#dc2626',
                                borderColor: '#fecaca',
                                backgroundColor: '#fff',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                cursor: 'pointer'
                              }}
                              title="Apagar chamado de teste"
                            >
                              <Trash2 size={12} />
                              <span>Apagar</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}

      {/* MODAL: NOVA ORDEM DE SERVIÇO */}
      {isNewOrderModalOpen && (
        <div className="dash-modal-backdrop" onClick={() => setIsNewOrderModalOpen(false)}>
          <div className="dash-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dash-modal-header">
              <h2>Nova Ordem de Serviço</h2>
              <button type="button" className="dash-modal-close" onClick={() => setIsNewOrderModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="dash-modal-form">
              <div className="dash-form-row">
                <div className="dash-form-field">
                  <label>Solicitante / Setor *</label>
                  <input
                    required
                    value={newOrder.patientName}
                    onChange={(e) => setNewOrder({ ...newOrder, patientName: e.target.value })}
                    placeholder="Ex: UTI Adulto / Dr. Carlos"
                  />
                </div>
                <div className="dash-form-field">
                  <label>Equipamento / Ativo</label>
                  <input
                    value={newOrder.equipmentName}
                    onChange={(e) => setNewOrder({ ...newOrder, equipmentName: e.target.value })}
                    placeholder="Ex: Monitor Multiparamétrico"
                  />
                </div>
              </div>

              <div className="dash-form-row">
                <div className="dash-form-field">
                  <label>Tipo de Serviço</label>
                  <select
                    value={newOrder.serviceType}
                    onChange={(e) => setNewOrder({ ...newOrder, serviceType: e.target.value })}
                  >
                    <option value="Manutenção Preventiva">Manutenção Preventiva</option>
                    <option value="Manutenção Corretiva">Manutenção Corretiva</option>
                    <option value="Calibração">Calibração</option>
                    <option value="Instalação / Treinamento">Instalação / Treinamento</option>
                    <option value="Inspeção Técnica">Inspeção Técnica</option>
                  </select>
                </div>
                <div className="dash-form-field">
                  <label>Prioridade</label>
                  <select
                    value={newOrder.priority}
                    onChange={(e) => setNewOrder({ ...newOrder, priority: e.target.value })}
                  >
                    <option value="Pouco urgente">Pouco urgente</option>
                    <option value="Normal">Normal</option>
                    <option value="Alta">Alta</option>
                    <option value="Urgente">Urgente</option>
                  </select>
                </div>
              </div>

              <div className="dash-form-field">
                <label>Descrição da Solicitação *</label>
                <textarea
                  required
                  rows={3}
                  value={newOrder.description}
                  onChange={(e) => setNewOrder({ ...newOrder, description: e.target.value })}
                  placeholder="Detalhe o problema apresentado ou o serviço a ser realizado..."
                />
              </div>

              <div className="dash-modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setIsNewOrderModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="primary-button" disabled={isSaving}>
                  {isSaving ? 'Criando OS...' : 'Criar Ordem de Serviço'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NOVO EQUIPAMENTO */}
      {isNewEquipModalOpen && (
        <div className="dash-modal-backdrop" onClick={() => setIsNewEquipModalOpen(false)}>
          <div className="dash-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dash-modal-header">
              <h2>Cadastrar Novo Equipamento</h2>
              <button type="button" className="dash-modal-close" onClick={() => setIsNewEquipModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateEquipment} className="dash-modal-form">
              <div className="dash-form-row">
                <div className="dash-form-field">
                  <label>Nome do Equipamento *</label>
                  <input
                    required
                    value={newEquipment.name}
                    onChange={(e) => setNewEquipment({ ...newEquipment, name: e.target.value })}
                    placeholder="Ex: Desfibrilador CardioMax"
                  />
                </div>
                <div className="dash-form-field">
                  <label>Tipo / Categoria *</label>
                  <input
                    required
                    value={newEquipment.equipmentType}
                    onChange={(e) => setNewEquipment({ ...newEquipment, equipmentType: e.target.value })}
                    placeholder="Ex: Biomédico, Diagnóstico, TI"
                  />
                </div>
              </div>

              <div className="dash-form-row">
                <div className="dash-form-field">
                  <label>Número de Série / Tag</label>
                  <input
                    value={newEquipment.serialNumber}
                    onChange={(e) => setNewEquipment({ ...newEquipment, serialNumber: e.target.value })}
                    placeholder="Ex: SN-94820-BR"
                  />
                </div>
                <div className="dash-form-field">
                  <label>Localização / Setor</label>
                  <input
                    value={newEquipment.location}
                    onChange={(e) => setNewEquipment({ ...newEquipment, location: e.target.value })}
                    placeholder="Ex: Bloco Cirúrgico B, Sala 04"
                  />
                </div>
              </div>

              <div className="dash-modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setIsNewEquipModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="primary-button" disabled={isSaving}>
                  {isSaving ? 'Salvando...' : 'Cadastrar Equipamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR ORDEM DE SERVIÇO */}
      {editingOrder && (
        <div className="order-editor-backdrop" onClick={() => setEditingOrder(null)}>
          <div className="order-editor" onClick={(e) => e.stopPropagation()}>
            <div className="order-editor-heading">
              <div>
                <p className="eyebrow" style={{ margin: 0 }}>Gerenciamento de OS</p>
                <h2>Editar OS-{String(editingOrder.order_number || editingOrder.id).padStart(5, '0')}</h2>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setEditingOrder(null)}
                aria-label="Fechar"
              >
                <X size={20} />
              </button>
            </div>

            <label>
              Solicitante / Setor
              <input value={editingOrder.patient_name || ''} disabled style={{ opacity: 0.8 }} />
            </label>

            <label>
              Equipamento
              <input value={editingOrder.equipment_name || 'Serviço Geral'} disabled style={{ opacity: 0.8 }} />
            </label>

            <label>
              Tipo de Serviço
              <select
                value={editingOrder.service_type || 'Manutenção'}
                onChange={(e) => setEditingOrder({ ...editingOrder, service_type: e.target.value })}
              >
                <option value="Manutenção Preventiva">Manutenção Preventiva</option>
                <option value="Manutenção Corretiva">Manutenção Corretiva</option>
                <option value="Calibração">Calibração</option>
                <option value="Instalação / Treinamento">Instalação / Treinamento</option>
                <option value="Inspeção Técnica">Inspeção Técnica</option>
              </select>
            </label>

            <label>
              Prioridade
              <select
                value={editingOrder.priority || 'Normal'}
                onChange={(e) => setEditingOrder({ ...editingOrder, priority: e.target.value })}
              >
                <option value="Pouco urgente">Pouco urgente</option>
                <option value="Normal">Normal</option>
                <option value="Alta">Alta</option>
                <option value="Urgente">Urgente</option>
              </select>
            </label>

            <label>
              Status da OS
              <select
                value={editingOrder.status || 'open'}
                onChange={(e) => setEditingOrder({ ...editingOrder, status: e.target.value })}
              >
                <option value="open">Aberta</option>
                <option value="in_progress">Em andamento</option>
                <option value="completed">Concluída</option>
                <option value="cancelled">Cancelada</option>
              </select>
            </label>

            <label>
              Data Limite / Prazo
              <input
                type="date"
                value={editingOrder.due_date ? editingOrder.due_date.slice(0, 10) : ''}
                onChange={(e) => setEditingOrder({ ...editingOrder, due_date: e.target.value })}
              />
            </label>

            <label style={{ gridColumn: '1 / -1' }}>
              Descrição Solicitada / Observação Inicial
              <textarea
                rows={2}
                value={editingOrder.service_requested_description ?? editingOrder.description ?? ''}
                onChange={(e) =>
                  setEditingOrder({
                    ...editingOrder,
                    service_requested_description: e.target.value,
                    description: e.target.value
                  })
                }
                placeholder="Descrição inicial ou observação solicitada..."
              />
            </label>

            <label style={{ gridColumn: '1 / -1' }}>
              Descrição do Serviço Realizado / Parecer Técnico
              <textarea
                rows={3}
                value={editingOrder.service_performed_description || ''}
                onChange={(e) => setEditingOrder({ ...editingOrder, service_performed_description: e.target.value })}
                placeholder="Descreva as peças trocadas, procedimentos executados e testes realizados..."
              />
            </label>

            <div className="order-editor-actions">
              <button type="button" className="secondary-button" onClick={() => setEditingOrder(null)}>
                Cancelar
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={saveOrder}
                disabled={isSaving}
              >
                {isSaving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAÇÃO DE EXCLUSÃO DE CHAMADO */}
      {ticketToDelete && (
        <div className="dash-modal-backdrop" onClick={() => setTicketToDelete(null)}>
          <div className="dash-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="dash-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#dc2626' }}>
                <AlertTriangle size={20} />
                <h2 style={{ fontSize: '17px', margin: 0, color: '#dc2626' }}>Excluir Chamado de Teste</h2>
              </div>
              <button type="button" className="dash-modal-close" onClick={() => setTicketToDelete(null)}>
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: '16px 20px', color: '#475569', fontSize: '13px', lineHeight: '1.5' }}>
              <p style={{ margin: '0 0 10px 0' }}>
                Tem certeza que deseja apagar o chamado <strong>{ticketToDelete.service_order_number ? `OS-${String(ticketToDelete.service_order_number).padStart(5, '0')}` : `#${ticketToDelete.ticket_number || ticketToDelete.id}`}</strong>?
              </p>
              <p style={{ margin: 0, color: '#64748b', fontSize: '12px' }}>
                Esta ação removerá este registro de teste definitivamente do banco de dados e do histórico operacional.
              </p>
            </div>
            <div className="dash-modal-actions" style={{ padding: '12px 20px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" className="secondary-button" onClick={() => setTicketToDelete(null)} disabled={isDeletingTicket}>
                Cancelar
              </button>
              <button
                type="button"
                className="primary-button"
                style={{ backgroundColor: '#dc2626', borderColor: '#dc2626', color: '#fff' }}
                onClick={handleConfirmDeleteTicket}
                disabled={isDeletingTicket}
              >
                {isDeletingTicket ? 'Excluindo...' : 'Confirmar Exclusão'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;

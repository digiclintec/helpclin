import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock,
  DollarSign,
  Edit3,
  FileText,
  Filter,
  Laptop,
  Lock,
  Plus,
  Printer,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  Wrench,
  X
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import ExportDropdown from '../components/ExportDropdown.jsx';
import BillingConfirmationModal from '../components/BillingConfirmationModal.jsx';
import {
  confirmPaymentReceipt,
  deleteServiceOrder,
  getServiceOrders,
  getStoredUser,
  getSupportTickets,
  informServiceOrderPayment,
  rejectPaymentReceipt,
  updateServiceOrder
} from '../services/api.js';
import {
  BILLING_MAX_DAYS,
  getDaysSinceCompletion,
  getEffectiveOrderStatus,
  getOrderStatusBadgeClass,
  getOrderStatusLabel,
  isAwaitingBilling,
  isBillingOverdue,
  isBillingPending,
  isBilled,
  isPaymentInformed,
  isWaitingTechnicianConfirmation
} from '../utils/billingUtils.js';
import { exportToPdf, exportToXls, printServiceOrder } from '../utils/exportReport.js';

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

function ServiceOrders() {
  const user = getStoredUser();
  const isAdmin = user?.role === 'admin';
  const isTechnician = user?.role === 'technician' || isAdmin;
  const isClient = !isTechnician;
  const [orders, setOrders] = useState([]);
  const [userTickets, setUserTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Editing modal state
  const [editingOrder, setEditingOrder] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmingBillingOrder, setConfirmingBillingOrder] = useState(null);

  // Filters
  const [activeKpiFilter, setActiveKpiFilter] = useState('all'); // 'all', 'open', 'in_progress', 'completed', 'payment_informed', 'billing_pending', 'billed', 'urgent'
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [technicianFilter, setTechnicianFilter] = useState('all');
  const [onlyMyOrders, setOnlyMyOrders] = useState(false);
  const [search, setSearch] = useState('');

  // Delete modal state
  const [deletingOrder, setDeletingOrder] = useState(null);
  const [deleteLinkedTicket, setDeleteLinkedTicket] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    setIsLoading(true);
    try {
      if (isClient) {
        const [ordersData, ticketsData] = await Promise.all([
          getServiceOrders(),
          getSupportTickets().catch(() => [])
        ]);
        setOrders(ordersData);
        setUserTickets(ticketsData);
      } else {
        const data = await getServiceOrders();
        setOrders(data);
      }
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  // Client visibility isolation
  const clientVisibleOrders = useMemo(() => {
    if (!isClient) return orders;

    const userOsNumbers = new Set(
      userTickets
        .filter((t) => {
          const isMyTicket =
            (t.created_by && user?.id && t.created_by === user.id) ||
            (t.requester && user?.name && t.requester.toLowerCase().trim() === user.name.toLowerCase().trim());
          return isMyTicket;
        })
        .map((t) => t.service_order_number || t.order_number)
        .filter(Boolean)
        .map(Number)
    );

    return orders.filter((o) => {
      if (o.created_by && user?.id && o.created_by === user.id) return true;
      if (o.patient_name && user?.name && o.patient_name.toLowerCase().trim() === user.name.toLowerCase().trim()) return true;
      if (o.order_number && userOsNumbers.has(Number(o.order_number))) return true;
      return false;
    });
  }, [orders, isClient, user, userTickets]);

  const techniciansList = useMemo(() => {
    const list = clientVisibleOrders.map((o) => o.technician_name).filter(Boolean);
    return Array.from(new Set(list)).sort();
  }, [clientVisibleOrders]);

  function isOrderAccepted(order) {
    if (!order) return false;
    const effective = getEffectiveOrderStatus(order);
    return Boolean(order.technician_id) && effective !== 'open' && effective !== 'cancelled';
  }

  function startEditing(order) {
    if (!isOrderAccepted(order)) {
      const effective = getEffectiveOrderStatus(order);
      if (effective === 'cancelled' || order.status === 'cancelled') {
        setErrorMessage(`A ordem OS-${String(order.order_number).padStart(5, '0')} está cancelada e não pode ser editada.`);
      } else {
        setErrorMessage(`A ordem OS-${String(order.order_number).padStart(5, '0')} precisa ser aceita pelo técnico na tela de Chamados antes de poder ser editada.`);
      }
      setSuccessMessage('');
      return;
    }

    let normalizedPriority = 'Normal';
    const p = (order.priority || '').toLowerCase();
    if (['low', 'pouco urgente', 'baixa'].includes(p)) normalizedPriority = 'Pouco urgente';
    else if (p === 'normal') normalizedPriority = 'Normal';
    else if (['high', 'alta'].includes(p)) normalizedPriority = 'Alta';
    else if (['urgent', 'urgente'].includes(p)) normalizedPriority = 'Urgente';

    const effective = getEffectiveOrderStatus(order);

    setEditingOrder({
      ...order,
      priority: normalizedPriority,
      status: effective
    });
    setErrorMessage('');
    setSuccessMessage('');
  }

  function closeEditing() {
    setEditingOrder(null);
  }

  async function handleQuickBill(order, customPaymentDate) {
    if (!order) return;
    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const paymentDateIso = customPaymentDate
        ? new Date(customPaymentDate + (customPaymentDate.includes('T') ? '' : 'T12:00:00Z')).toISOString()
        : new Date().toISOString();

      const updated = await informServiceOrderPayment(order.id, paymentDateIso);

      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id
            ? {
                ...o,
                ...updated,
                status: 'payment_informed',
                payment_informed_at: paymentDateIso
              }
            : o
        )
      );
      if (editingOrder?.id === order.id) {
        setEditingOrder(null);
      }
      setConfirmingBillingOrder(null);
      setSuccessMessage(`Pagamento da ordem OS-${String(order.order_number).padStart(5, '0')} informado com sucesso! Aguardando conferência e confirmação do técnico.`);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleConfirmReceipt(order) {
    if (!order) return;
    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const updated = await confirmPaymentReceipt(order.id, user?.id);
      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id
            ? {
                ...o,
                ...updated,
                status: 'billed',
                billed_at: updated.billed_at,
                payment_informed_at: updated.payment_informed_at,
                technician_name: user?.name || o.technician_name
              }
            : o
        )
      );
      if (editingOrder?.id === order.id) {
        setEditingOrder(null);
      }
      setSuccessMessage(`Recebimento confirmado pelo técnico com sucesso! Ordem OS-${String(order.order_number).padStart(5, '0')} faturada.`);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRejectReceipt(order) {
    if (!order) return;
    const confirmed = window.confirm(
      `Confirmar que o pagamento da OS-${String(order.order_number).padStart(5, '0')} NÃO foi recebido do cliente?\n\nA ordem retornará para "Pendente de Pagamento" para que o cliente verifique.`
    );
    if (!confirmed) return;

    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const updated = await rejectPaymentReceipt(order.id, user?.id, 'Pagamento não identificado pelo técnico');
      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id
            ? {
                ...o,
                ...updated,
                status: 'billing_pending',
                billed_at: null,
                payment_informed_at: null,
                payment_rejection_reason: 'Pagamento não identificado pelo técnico'
              }
            : o
        )
      );
      if (editingOrder?.id === order.id) {
        setEditingOrder(null);
      }
      setSuccessMessage(`O técnico informou que não recebeu o pagamento. A ordem OS-${String(order.order_number).padStart(5, '0')} retornou para Pendente de Pagamento.`);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSaving(false);
    }
  }

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
          order.id === updated.id ? { ...order, ...updated, technician_name: user?.id === updated.technician_id ? user.name : order.technician_name } : order
        )
      );
      setEditingOrder(null);
      const isNowBilled = updated.status === 'billed';
      setSuccessMessage(
        isNowBilled
          ? `Ordem OS-${String(editingOrder.order_number).padStart(5, '0')} faturada com sucesso! Acesso técnico concedido.`
          : `Ordem OS-${String(editingOrder.order_number).padStart(5, '0')} atualizada com sucesso!`
      );
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deletingOrder) return;
    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const res = await deleteServiceOrder(deletingOrder.id, true);
      setOrders((prev) => prev.filter((o) => o.id !== deletingOrder.id));
      if (editingOrder?.id === deletingOrder.id) {
        setEditingOrder(null);
      }
      const orderNum = String(deletingOrder.order_number).padStart(5, '0');
      setDeletingOrder(null);
      setSuccessMessage(res.message || `Ordem de serviço OS-${orderNum} excluída com sucesso.`);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSaving(false);
    }
  }

  // Calculate KPIs
  const now = new Date();
  const kpis = useMemo(() => {
    let openCount = 0;
    let inProgressCount = 0;
    let completedCount = 0;
    let paymentInformedCount = 0;
    let billingPendingCount = 0;
    let billingOverdueCount = 0;
    let billedCount = 0;
    let urgentCount = 0;

    clientVisibleOrders.forEach((o) => {
      const effective = getEffectiveOrderStatus(o);
      if (effective === 'open') openCount++;
      if (effective === 'in_progress') inProgressCount++;
      if (effective === 'completed') completedCount++;
      if (isPaymentInformed(o)) paymentInformedCount++;
      if (isAwaitingBilling(o)) {
        billingPendingCount++;
        if (isBillingOverdue(o)) {
          billingOverdueCount++;
        }
      }
      if (isBilled(o)) billedCount++;

      const p = (o.priority || '').toLowerCase();
      const createdAt = new Date(o.created_at);
      const hoursOld = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
      if (effective !== 'completed' && effective !== 'billed' && (p === 'urgent' || p === 'high' || hoursOld > 24)) {
        urgentCount++;
      }
    });

    return {
      total: clientVisibleOrders.length,
      open: openCount,
      inProgress: inProgressCount,
      completed: completedCount,
      paymentInformed: paymentInformedCount,
      billingPending: billingPendingCount,
      billingOverdue: billingOverdueCount,
      billed: billedCount,
      urgent: urgentCount
    };
  }, [clientVisibleOrders]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return clientVisibleOrders.filter((order) => {
      const effective = getEffectiveOrderStatus(order);

      // 1. KPI Tab Filter
      if (activeKpiFilter === 'open' && effective !== 'open') return false;
      if (activeKpiFilter === 'in_progress' && effective !== 'in_progress') return false;
      if (activeKpiFilter === 'completed' && effective !== 'completed') return false;
      if (activeKpiFilter === 'payment_informed' && !isPaymentInformed(order)) return false;
      if (activeKpiFilter === 'billing_pending' && !isAwaitingBilling(order)) return false;
      if (activeKpiFilter === 'billed' && !isBilled(order)) return false;
      if (activeKpiFilter === 'urgent') {
        const p = (order.priority || '').toLowerCase();
        const createdAt = new Date(order.created_at);
        const hoursOld = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        const isUrgent = effective !== 'completed' && effective !== 'billed' && (p === 'urgent' || p === 'high' || hoursOld > 24);
        if (!isUrgent) return false;
      }

      // 2. Status Filter Dropdown
      if (statusFilter !== 'all') {
        if (statusFilter === 'payment_informed') {
          if (!isPaymentInformed(order)) return false;
        } else if (statusFilter === 'billing_pending') {
          if (!isAwaitingBilling(order)) return false;
        } else if (effective !== statusFilter) {
          return false;
        }
      }

      // 3. Priority Filter Dropdown
      if (priorityFilter !== 'all') {
        const p = (order.priority || '').toLowerCase();
        if (priorityFilter === 'low' && !['low', 'pouco urgente', 'baixa'].includes(p)) return false;
        if (priorityFilter === 'normal' && p !== 'normal') return false;
        if (priorityFilter === 'high' && !['high', 'alta'].includes(p)) return false;
        if (priorityFilter === 'urgent' && !['urgent', 'urgente'].includes(p)) return false;
      }

      // 4. Technician Filter Dropdown
      if (technicianFilter !== 'all') {
        if (technicianFilter === '__unassigned__') {
          if (order.technician_name || order.technician_id) return false;
        } else if (technicianFilter === '__my__') {
          const isMyTechnician = order.technician_id === user?.id || order.technician_name === user?.name;
          if (!isMyTechnician) return false;
        } else {
          if (order.technician_name !== technicianFilter) return false;
        }
      }

      // 5. Connected User Filter (for technicians to filter their assigned orders)
      if (onlyMyOrders && user && isTechnician) {
        const isMyTechnician = order.technician_id === user.id || order.technician_name === user.name;
        if (!isMyTechnician) return false;
      }

      // 6. Search Text
      if (search.trim()) {
        const term = search.toLowerCase();
        const str = `${order.order_number || ''} ${order.patient_name || ''} ${order.service_type || ''} ${order.equipment_name || ''} ${order.technician_name || ''} ${order.description || ''} ${order.service_requested_description || ''} ${order.service_performed_description || ''}`.toLowerCase();
        if (!str.includes(term)) return false;
      }

      return true;
    });
  }, [clientVisibleOrders, activeKpiFilter, statusFilter, priorityFilter, technicianFilter, onlyMyOrders, search, user, isTechnician]);

  const isFiltered =
    activeKpiFilter !== 'all' ||
    statusFilter !== 'all' ||
    priorityFilter !== 'all' ||
    technicianFilter !== 'all' ||
    onlyMyOrders ||
    search.trim() !== '';

  function handleClearFilters() {
    setActiveKpiFilter('all');
    setStatusFilter('all');
    setPriorityFilter('all');
    setTechnicianFilter('all');
    setOnlyMyOrders(false);
    setSearch('');
  }

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

  const exportColumns = [
    { header: 'Prioridade', accessor: (o) => getPriorityLabel(o.priority) },
    { header: 'Número OS', accessor: (o) => `OS-${String(o.order_number).padStart(5, '0')}` },
    { header: 'Estado', accessor: (o) => getOrderStatusLabel(getEffectiveOrderStatus(o)) },
    { header: 'Solicitante / Setor', accessor: (o) => o.patient_name || 'Setor Não Informado' },
    { header: 'Equipamento / Ativo', accessor: (o) => o.equipment_name || 'Serviço Geral' },
    { header: 'Responsável Técnico', accessor: (o) => o.technician_name || 'Não atribuído' },
    { header: 'Tipo de Serviço', accessor: (o) => o.service_type || 'Manutenção' },
    { header: 'Criada em', accessor: (o) => formatDate(o.created_at) },
    { header: 'Concluída em', accessor: (o) => formatDate(o.completed_at) },
    { header: 'Data do Faturamento / Pagamento', accessor: (o) => (o.billed_at ? formatDate(o.billed_at) : (o.status === 'billed' ? 'Faturada' : 'Pendente')) },
    { header: 'Situação de Faturamento', accessor: (o) => o.status === 'billed' ? `Faturada em ${formatDate(o.billed_at || o.updated_at)}` : (isAwaitingBilling(o) ? `Aguardando faturamento (${getDaysSinceCompletion(o)}/30 dias)` : 'Em atendimento') },
    { header: 'Descrição Solicitada', accessor: (o) => o.service_requested_description || o.description || '—' },
    { header: 'Serviço Realizado', accessor: (o) => o.service_performed_description || '—' }
  ];

  function handleExportXls() {
    exportToXls({
      title: 'Relatório de Ordens de Serviço',
      filename: 'Relatorio_Ordens_Servico_HelpClin',
      columns: exportColumns,
      data: filteredOrders
    });
  }

  function handleExportPdf() {
    exportToPdf({
      title: 'Relatório de Ordens de Serviço',
      subtitle: `Listagem de ${filteredOrders.length} ordens de serviço filtradas`,
      columns: exportColumns,
      data: filteredOrders,
      summary: [
        { label: 'Total Filtrado', value: filteredOrders.length },
        { label: 'Abertas', value: kpis.open },
        { label: 'Em Andamento', value: kpis.inProgress },
        { label: 'Concluídas', value: kpis.completed },
        { label: 'Aguardando Faturamento (Prazo 30 dias)', value: kpis.billingPending },
        { label: 'Faturadas', value: kpis.billed },
        { label: 'Urgentes / Atrasadas', value: kpis.urgent }
      ]
    });
  }

  return (
    <div className="simple-page orders-page">
      {/* Top Header */}
      <section className="simple-page-heading">
        <div>
          <p className="eyebrow">Central de Operações</p>
          <h1>Ordens de Serviço</h1>
          <p>Consulte, gerencie e atualize as ordens de serviço geradas a partir dos chamados técnicos.</p>
        </div>
        <div className="simple-page-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={handleExportPdf}
            title="Imprimir listagem oficial das ordens de serviço filtradas"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Printer size={15} /> Imprimir Lista
          </button>
          <ExportDropdown onExportXls={handleExportXls} onExportPdf={handleExportPdf} />
          <div className="work-order-user" style={{ margin: 0 }}>
            <span>Usuário:</span>
            <strong>{user?.name ?? 'Administrador'}</strong>
          </div>
        </div>
      </section>

      {successMessage && <p className="ticket-feedback" style={{ marginBottom: '16px' }}>{successMessage}</p>}
      {errorMessage && !editingOrder && <p className="ticket-feedback data-state--error" style={{ marginBottom: '16px', background: '#fee2e2' }}>{errorMessage}</p>}

      {/* Interactive Metric / KPI Cards */}
      <div className="tickets-kpi-grid">
        <div
          className={`ticket-kpi-card ${activeKpiFilter === 'all' ? 'ticket-kpi-card--active' : ''}`}
          onClick={() => setActiveKpiFilter('all')}
          role="button"
          tabIndex={0}
        >
          <div className="ticket-kpi-info">
            <span className="ticket-kpi-title">Total</span>
            <span className="ticket-kpi-sub">Todas as ordens</span>
          </div>
          <strong className="ticket-kpi-count">{kpis.total}</strong>
        </div>

        <div
          className={`ticket-kpi-card ${activeKpiFilter === 'open' ? 'ticket-kpi-card--active' : ''}`}
          onClick={() => setActiveKpiFilter('open')}
          role="button"
          tabIndex={0}
        >
          <div className="ticket-kpi-info">
            <span className="ticket-kpi-title">Abertas</span>
            <span className="ticket-kpi-sub">Aguardando início</span>
          </div>
          <strong className="ticket-kpi-count">{kpis.open}</strong>
        </div>

        <div
          className={`ticket-kpi-card ${activeKpiFilter === 'in_progress' ? 'ticket-kpi-card--active' : ''}`}
          onClick={() => setActiveKpiFilter('in_progress')}
          role="button"
          tabIndex={0}
        >
          <div className="ticket-kpi-info">
            <span className="ticket-kpi-title">Em andamento</span>
            <span className="ticket-kpi-sub">Em execução técnica</span>
          </div>
          <strong className="ticket-kpi-count">{kpis.inProgress}</strong>
        </div>

        <div
          className={`ticket-kpi-card ${activeKpiFilter === 'completed' ? 'ticket-kpi-card--active' : ''}`}
          onClick={() => setActiveKpiFilter('completed')}
          role="button"
          tabIndex={0}
        >
          <div className="ticket-kpi-info">
            <span className="ticket-kpi-title">Concluídas</span>
            <span className="ticket-kpi-sub">Atendimentos finalizados</span>
          </div>
          <strong className="ticket-kpi-count">{kpis.completed}</strong>
        </div>

        <div
          className={`ticket-kpi-card ${activeKpiFilter === 'payment_informed' ? 'ticket-kpi-card--active' : ''}`}
          onClick={() => setActiveKpiFilter('payment_informed')}
          role="button"
          tabIndex={0}
          style={{ borderLeft: '3px solid #d97706' }}
        >
          <div className="ticket-kpi-info">
            <span className="ticket-kpi-title" style={{ color: '#92400e' }}>Aguardando Confirmação</span>
            <span className="ticket-kpi-sub">Pgto informado pelo cliente</span>
          </div>
          <strong className="ticket-kpi-count" style={{ color: '#92400e' }}>{kpis.paymentInformed}</strong>
        </div>

        <div
          className={`ticket-kpi-card ${activeKpiFilter === 'billing_pending' ? 'ticket-kpi-card--active' : ''}`}
          onClick={() => setActiveKpiFilter('billing_pending')}
          role="button"
          tabIndex={0}
          style={{ borderLeft: kpis.billingOverdue > 0 ? '3px solid #dc2626' : '3px solid #ea580c' }}
        >
          <div className="ticket-kpi-info">
            <span className="ticket-kpi-title" style={{ color: kpis.billingOverdue > 0 ? '#b91c1c' : '#c2410c' }}>Aguardando Faturamento</span>
            <span className="ticket-kpi-sub">{kpis.billingOverdue > 0 ? `${kpis.billingOverdue} com atraso (> 30d)` : 'Prazo de até 30 dias'}</span>
          </div>
          <strong className="ticket-kpi-count" style={{ color: kpis.billingOverdue > 0 ? '#b91c1c' : '#c2410c' }}>{kpis.billingPending}</strong>
        </div>

        <div
          className={`ticket-kpi-card ${activeKpiFilter === 'billed' ? 'ticket-kpi-card--active' : ''}`}
          onClick={() => setActiveKpiFilter('billed')}
          role="button"
          tabIndex={0}
          style={{ borderLeft: '3px solid #059669' }}
        >
          <div className="ticket-kpi-info">
            <span className="ticket-kpi-title" style={{ color: '#065f46' }}>Faturadas</span>
            <span className="ticket-kpi-sub">Pagas &amp; liberadas</span>
          </div>
          <strong className="ticket-kpi-count" style={{ color: '#065f46' }}>{kpis.billed}</strong>
        </div>

        <div
          className={`ticket-kpi-card ${activeKpiFilter === 'urgent' ? 'ticket-kpi-card--active' : ''}`}
          onClick={() => setActiveKpiFilter('urgent')}
          role="button"
          tabIndex={0}
        >
          <div className="ticket-kpi-info">
            <span className="ticket-kpi-title">Urgentes / Atrasadas</span>
            <span className="ticket-kpi-sub">Atenção prioritária</span>
          </div>
          <strong className="ticket-kpi-count">{kpis.urgent}</strong>
        </div>
      </div>

      {/* Toolbar Filters (Aligned to Left) */}
      <div className="tickets-filter-bar" style={{ justifyContent: 'flex-start', gap: '10px' }}>
        <div className="tickets-filter-left" style={{ flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            className="ticket-reload-btn"
            onClick={loadOrders}
            title="Recarregar lista"
            aria-label="Recarregar lista"
          >
            <RefreshCw size={15} />
          </button>

          <div className="search-control" style={{ width: '250px' }}>
            <Search size={16} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar OS, local, serviço..."
              aria-label="Pesquisar ordens de serviço"
            />
          </div>

          <select
            className="ticket-filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filtrar por estado"
          >
            <option value="all">Todos os estados</option>
            <option value="open">Abertas</option>
            <option value="in_progress">Em andamento</option>
            <option value="completed">Concluídas</option>
            <option value="payment_informed">Aguardando Confirmação do Técnico</option>
            <option value="billing_pending">Aguardando Faturamento (Prazo 30 dias)</option>
            <option value="billed">Faturadas (Pagas)</option>
            <option value="cancelled">Canceladas</option>
          </select>

          <select
            className="ticket-filter-select"
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

          {/* Technician Filter */}
          <select
            className="ticket-filter-select"
            value={technicianFilter}
            onChange={(e) => setTechnicianFilter(e.target.value)}
            aria-label="Filtrar por técnico"
          >
            <option value="all">Todos os técnicos</option>
            {isTechnician && <option value="__my__">Minhas ordens atribuídas</option>}
            <option value="__unassigned__">Sem técnico atribuído</option>
            {techniciansList.map((tech) => (
              <option key={tech} value={tech}>
                Técnico: {tech}
              </option>
            ))}
          </select>

          {/* Quick Clear Filter Button */}
          {isFiltered && (
            <button
              type="button"
              className="ticket-filter-btn"
              onClick={handleClearFilters}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                borderRadius: '8px',
                background: '#fee2e2',
                color: '#dc2626',
                border: '1px solid #fecaca',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
              title="Limpar todos os filtros ativos"
            >
              <RotateCcw size={13} /> Limpar Filtros
            </button>
          )}

          {isTechnician && (
            <label className="ticket-filter-checkbox" style={{ marginLeft: '4px' }}>
              <input
                type="checkbox"
                checked={onlyMyOrders}
                onChange={(e) => setOnlyMyOrders(e.target.checked)}
              />
              Filtrar por usuário conectado
            </label>
          )}
        </div>
      </div>

      {/* Table Section */}
      <section className="ticket-list-card" style={{ padding: '0', overflow: 'hidden' }}>
        {isLoading ? (
          <div className="data-state">Carregando ordens de serviço...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="user-empty-state" style={{ padding: '3.5rem', textAlign: 'center' }}>
            <FileText size={32} style={{ margin: '0 auto', color: '#67a486' }} />
            <strong style={{ display: 'block', marginTop: '1rem' }}>
              {search || activeKpiFilter !== 'all' || statusFilter !== 'all' || priorityFilter !== 'all' || onlyMyOrders
                ? 'Nenhuma ordem de serviço encontrada para os filtros aplicados'
                : 'Nenhuma ordem de serviço registrada'}
            </strong>
            <span>
              {search || activeKpiFilter !== 'all'
                ? 'Tente ajustar os filtros ou termo de busca para visualizar outras ordens.'
                : 'Novas ordens de serviço surgirão automaticamente a partir dos chamados atendidos.'}
            </span>
          </div>
        ) : (
          <div className="helpclin-table-wrapper">
            <table className="helpclin-table">
              <thead>
                <tr>
                  <th style={{ width: isTechnician ? '185px' : '70px', minWidth: isTechnician ? '185px' : '70px', textAlign: 'left' }}>Ações</th>
                  <th style={{ width: '110px', minWidth: '110px' }}>OS &amp; Prioridade</th>
                  <th style={{ width: '135px', minWidth: '135px' }}>Estado</th>
                  <th style={{ width: '19%' }}>Solicitante &amp; Ativo</th>
                  <th style={{ width: '19%' }}>Serviço &amp; Técnico</th>
                  <th style={{ width: '80px', minWidth: '80px' }}>Data</th>
                  <th>Observações</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const priorityText = getPriorityLabel(order.priority);
                  const priorityClass = getPriorityBadgeClass(order.priority);
                  const daysOld = getDaysSinceCompletion(order);
                  const isOrderAwaiting = isAwaitingBilling(order);
                  const isOrderOverdue = isBillingOverdue(order);
                  const isOrderBilled = isBilled(order);
                  const isOrderPaymentInformed = isPaymentInformed(order);
                  const effectiveStatus = getEffectiveOrderStatus(order);
                  const statusText = getOrderStatusLabel(effectiveStatus);
                  const statusClass = getOrderStatusBadgeClass(effectiveStatus);

                  return (
                    <tr key={order.id}>
                      {/* 1. Action Buttons */}
                      <td style={{ textAlign: 'left', whiteSpace: 'nowrap', verticalAlign: 'middle', width: isTechnician ? '185px' : '70px', minWidth: isTechnician ? '185px' : '70px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '4px', flexWrap: 'nowrap' }}>
                          {/* Print Button */}
                          <button
                            type="button"
                            className="inventory-action-btn"
                            onClick={() => printServiceOrder(order)}
                            title={`Imprimir ficha da OS-${String(order.order_number).padStart(5, '0')}`}
                            aria-label={`Imprimir ficha da OS ${order.order_number}`}
                            style={{ width: '26px', height: '26px', flexShrink: 0, padding: 0 }}
                          >
                            <Printer size={13} />
                          </button>

                          {isOrderAwaiting && (
                            <button
                              type="button"
                              className="billing-quick-bill-btn"
                              onClick={() => setConfirmingBillingOrder(order)}
                              disabled={isSaving}
                              style={{ width: '26px', height: '26px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                              title="Informar faturamento"
                              aria-label="Informar faturamento"
                            >
                              <DollarSign size={13} />
                            </button>
                          )}

                          {isOrderPaymentInformed && isTechnician && (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
                              <button
                                type="button"
                                onClick={() => handleConfirmReceipt(order)}
                                disabled={isSaving}
                                style={{
                                  padding: '0 6px',
                                  height: '26px',
                                  backgroundColor: '#059669',
                                  color: '#ffffff',
                                  border: '1px solid #059669',
                                  borderRadius: '5px',
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '2px',
                                  cursor: 'pointer',
                                  whiteSpace: 'nowrap',
                                  flexShrink: 0
                                }}
                                title="Confirmar que recebeu o pagamento do cliente (SIM)"
                                aria-label="Confirmar recebimento (SIM)"
                              >
                                <Check size={11} /> SIM
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRejectReceipt(order)}
                                disabled={isSaving}
                                style={{
                                  padding: '0 6px',
                                  height: '26px',
                                  backgroundColor: '#fef2f2',
                                  color: '#dc2626',
                                  border: '1px solid #fecaca',
                                  borderRadius: '5px',
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '2px',
                                  cursor: 'pointer',
                                  whiteSpace: 'nowrap',
                                  flexShrink: 0
                                }}
                                title="Informar que NÃO recebeu do cliente (Volta para pendente de pagamento)"
                                aria-label="Não recebido (NÃO)"
                              >
                                <X size={11} /> NÃO
                              </button>
                            </div>
                          )}

                          {isTechnician && (
                            isOrderAccepted(order) ? (
                              <button
                                type="button"
                                className="inventory-action-btn"
                                onClick={() => startEditing(order)}
                                title={`Editar OS-${String(order.order_number).padStart(5, '0')}`}
                                aria-label={`Editar OS ${order.order_number}`}
                                style={{ width: '26px', height: '26px', flexShrink: 0, padding: 0 }}
                              >
                                <Edit3 size={13} />
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="inventory-action-btn"
                                onClick={() => {
                                  const effective = getEffectiveOrderStatus(order);
                                  if (effective === 'cancelled' || order.status === 'cancelled') {
                                    setErrorMessage(`A ordem OS-${String(order.order_number).padStart(5, '0')} está cancelada e não pode ser editada.`);
                                  } else {
                                    setErrorMessage(`A ordem OS-${String(order.order_number).padStart(5, '0')} precisa ser aceita na tela de Chamados pelo técnico antes de poder ser editada.`);
                                  }
                                  setSuccessMessage('');
                                }}
                                title={order.status === 'cancelled' ? 'Ordem cancelada' : 'Aguardando aceite do técnico na tela de Chamados para liberar a edição'}
                                aria-label="Edição bloqueada"
                                style={{
                                  width: '26px',
                                  height: '26px',
                                  flexShrink: 0,
                                  padding: 0,
                                  backgroundColor: '#f1f5f9',
                                  color: '#94a3b8',
                                  borderColor: '#cbd5e1',
                                  cursor: 'not-allowed'
                                }}
                              >
                                <Lock size={12} />
                              </button>
                            )
                          )}

                          {isTechnician && (
                            <button
                              type="button"
                              className="inventory-action-btn inventory-action-btn--delete"
                              onClick={() => {
                                setDeletingOrder(order);
                                setDeleteLinkedTicket(true);
                              }}
                              title={`Excluir OS-${String(order.order_number).padStart(5, '0')}`}
                              aria-label={`Excluir OS ${order.order_number}`}
                              style={{ width: '26px', height: '26px', flexShrink: 0, padding: 0 }}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* 2. OS & Prioridade */}
                      <td style={{ width: '110px', minWidth: '110px', paddingLeft: '8px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <strong style={{ color: 'var(--teal)', fontSize: '12px', whiteSpace: 'nowrap' }}>
                            OS-{String(order.order_number).padStart(5, '0')}
                          </strong>
                          <span className={`ticket-priority-badge ${priorityClass}`} style={{ alignSelf: 'flex-start', fontSize: '9px', padding: '2px 6px', whiteSpace: 'nowrap' }}>
                            {priorityText}
                          </span>
                        </div>
                      </td>

                      {/* 3. Estado & Faturamento */}
                      <td style={{ width: '135px', minWidth: '135px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          {isOrderBilled ? (
                            <>
                              <span className="os-status-badge os-status-badge--billed" style={{ fontSize: '10px', padding: '2px 6px' }}>
                                <CheckCircle2 size={10} /> Faturada
                              </span>
                              {order.billed_at && (
                                <span style={{ fontSize: '9px', color: '#047857', fontWeight: 600 }}>
                                  Pgto: {new Intl.DateTimeFormat('pt-BR').format(new Date(order.billed_at))}
                                </span>
                              )}
                            </>
                          ) : isOrderPaymentInformed ? (
                            <>
                              <span className="os-status-badge" style={{ background: '#fef3c7', color: '#92400e', borderColor: '#fde68a', fontSize: '10px', padding: '2px 6px' }}>
                                <Clock size={10} style={{ color: '#d97706' }} /> Confirmação
                              </span>
                              <span style={{ fontSize: '9px', color: '#b45309', fontWeight: 600 }}>
                                {order.payment_informed_at ? `Pgto inf: ${new Intl.DateTimeFormat('pt-BR').format(new Date(order.payment_informed_at))}` : 'Aguardando técnico'}
                              </span>
                            </>
                          ) : isOrderAwaiting ? (
                            isOrderOverdue ? (
                              <>
                                <span className="os-status-badge os-status-badge--billing_pending" style={{ fontSize: '10px', padding: '2px 6px' }}>
                                  <AlertTriangle size={10} /> ⚠️ Atrasada
                                </span>
                                <span style={{ fontSize: '9px', color: '#b91c1c', fontWeight: 600 }}>
                                  {daysOld}d (&gt; 30d)
                                </span>
                              </>
                            ) : (
                              <>
                                <span className="os-status-badge" style={{ background: '#fff7ed', color: '#c2410c', borderColor: '#fed7aa', fontSize: '10px', padding: '2px 6px' }}>
                                  <Clock size={10} style={{ color: '#ea580c' }} /> Aguard. Fatura
                                </span>
                                <span style={{ fontSize: '9px', color: '#ea580c', fontWeight: 500 }}>
                                  {daysOld}d / 30 dias
                                </span>
                              </>
                            )
                          ) : (
                            <>
                              <span className={`os-status-badge ${statusClass}`} style={{ fontSize: '10px', padding: '2px 6px' }}>
                                {statusText}
                              </span>
                              {!isOrderAccepted(order) && order.status !== 'cancelled' && (
                                <span style={{ fontSize: '9px', color: '#64748b', fontWeight: 600 }}>
                                  Aguardando aceite
                                </span>
                              )}
                            </>
                          )}
                          {order.payment_rejection_reason && !isOrderBilled && !isOrderPaymentInformed && (
                            <span style={{ fontSize: '9px', color: '#dc2626', background: '#fef2f2', padding: '1px 4px', borderRadius: '3px', border: '1px solid #fecaca' }}>
                              ⚠️ Pgto não ident.
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 4. Solicitante & Ativo */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <strong style={{ color: 'var(--teal)', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }} title={order.patient_name || 'Setor Não Informado'}>
                            {order.patient_name || 'Setor Não Informado'}
                          </strong>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#59716e', fontSize: '11px' }}>
                            <span style={{ color: '#4d8796', display: 'inline-flex' }}>
                              {order.equipment_name ? <Laptop size={13} /> : <Wrench size={13} />}
                            </span>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={order.equipment_name || 'Serviço Geral'}>
                              {order.equipment_name || 'Serviço Geral'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 5. Serviço & Técnico */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ color: 'var(--ink)', fontSize: '12px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={order.service_type || 'Manutenção Corretiva'}>
                            {order.service_type || 'Manutenção Corretiva'}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: order.technician_name ? '#2b6351' : '#9aa6a2' }}>
                            <UserCheck size={12} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontStyle: order.technician_name ? 'normal' : 'italic' }} title={order.technician_name || 'Técnico não atribuído'}>
                              {order.technician_name || 'Não atribuído'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 6. Data */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', fontSize: '11px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                          <span>{new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(order.created_at))}</span>
                          <span style={{ fontSize: '10px', color: '#9aa6a2' }}>{new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(order.created_at))}</span>
                        </div>
                      </td>

                      {/* 7. Observações / Descrições */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <span
                            style={{
                              color: 'var(--teal)',
                              fontSize: '11px',
                              fontWeight: 600,
                              lineHeight: 1.25,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical'
                            }}
                            title={order.service_requested_description || order.description || 'Sem descrição'}
                          >
                            {order.service_requested_description || order.description || 'Sem descrição'}
                          </span>
                          {order.service_performed_description && (
                            <span
                              style={{
                                fontSize: '10px',
                                color: '#1f6e52',
                                background: '#ecfdf5',
                                padding: '2px 5px',
                                borderRadius: '4px',
                                border: '1px solid #d1fae5',
                                lineHeight: 1.2,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                              title={`Técnico: ${order.service_performed_description}`}
                            >
                              <strong>Téc:</strong> {order.service_performed_description}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Edit Order Modal */}
      {editingOrder && (() => {
        const isOrderAwaiting = isAwaitingBilling(editingOrder);
        const isOrderOverdue = isBillingOverdue(editingOrder);
        const isTechnicianLocked = !isAdmin && isOrderOverdue;
        const daysSinceCompletion = getDaysSinceCompletion(editingOrder);
        const isOrderBilled = isBilled(editingOrder);

        return (
          <div
            className="inventory-modal-backdrop"
            onClick={(e) => {
              if (e.target === e.currentTarget) closeEditing();
            }}
          >
            <div className="inventory-modal" style={{ width: 'min(100%, 580px)' }}>
              <div className="inventory-modal-header">
                <div>
                  <p className="eyebrow">OS-{String(editingOrder.order_number).padStart(5, '0')}</p>
                  <h2>Editar Ordem de Serviço</h2>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    className="inventory-action-btn"
                    onClick={() => printServiceOrder(editingOrder)}
                    title="Imprimir ficha desta OS"
                    aria-label="Imprimir ficha desta OS"
                  >
                    <Printer size={15} />
                  </button>
                  {isTechnician && (
                    <button
                      type="button"
                      className="inventory-action-btn inventory-action-btn--delete"
                      onClick={() => setDeletingOrder(editingOrder)}
                      title="Excluir esta ordem de serviço"
                      aria-label="Excluir ordem de serviço"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                  <button
                    type="button"
                    className="inventory-modal-close"
                    onClick={closeEditing}
                    aria-label="Fechar"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {errorMessage && <p className="ticket-feedback" style={{ marginBottom: '16px', background: '#fee2e2', color: '#dc2626' }}>{errorMessage}</p>}

              {/* Technician Lock Banner (only if overdue > 30 days) */}
              {isTechnicianLocked && (
                <div className="billing-technician-lock" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flex: 1 }}>
                    <Lock size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <strong>⚠️ Acesso Técnico Bloqueado: Faturamento Atrasado (&gt; 30 dias)</strong>
                      <span>Esta ordem de serviço foi concluída há {daysSinceCompletion} dias e ultrapassou o prazo de 30 dias para faturamento. O acesso a modificações está bloqueado até a confirmação de quitação pelo administrador.</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="billing-quick-bill-btn"
                    onClick={() => setConfirmingBillingOrder(editingOrder)}
                    disabled={isSaving}
                    style={{ marginLeft: 'auto', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                    title="Informar faturamento"
                    aria-label="Informar faturamento"
                  >
                    <DollarSign size={16} />
                  </button>
                </div>
              )}

              {/* Admin Billing Alert & Action */}
              {isAdmin && isOrderAwaiting && (
                <div
                  className="billing-client-alert"
                  style={{
                    background: isOrderOverdue ? '#fef2f2' : '#fff7ed',
                    borderColor: isOrderOverdue ? '#fecaca' : '#fed7aa',
                    color: isOrderOverdue ? '#991b1b' : '#c2410c'
                  }}
                >
                  {isOrderOverdue ? (
                    <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: '2px', color: '#dc2626' }} />
                  ) : (
                    <Clock size={20} style={{ flexShrink: 0, marginTop: '2px', color: '#ea580c' }} />
                  )}
                  <div style={{ flex: 1 }}>
                    <strong style={{ color: isOrderOverdue ? '#991b1b' : '#9a3412' }}>
                      {isOrderOverdue
                        ? '⚠️ Faturamento Atrasado (> 30 dias)'
                        : 'Aguardando Faturamento (Prazo de 30 dias)'}
                    </strong>
                    <p style={{ margin: '4px 0 0', color: isOrderOverdue ? '#7f1d1d' : '#9a3412' }}>
                      {isOrderOverdue
                        ? `Esta OS foi concluída há ${daysSinceCompletion} dias e ultrapassou o prazo de 30 dias para faturamento.`
                        : `Esta OS foi concluída há ${daysSinceCompletion} dias e está aguardando quitação dentro do prazo regular de 30 dias.`}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="billing-quick-bill-btn"
                    onClick={() => setConfirmingBillingOrder(editingOrder)}
                    disabled={isSaving}
                  >
                    <CheckCircle2 size={15} /> Confirmar &amp; Faturar
                  </button>
                </div>
              )}

              {/* Order Billed Notification */}
              {isOrderBilled && (
                <div className="billing-client-alert billing-client-alert--success">
                  <CheckCircle2 size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>Ordem Faturada</strong>
                    <p>Pagamento confirmado pelo administrador. Acesso técnico liberado.</p>
                  </div>
                </div>
              )}

              <form onSubmit={saveOrder} className="inventory-form">
                {/* Requester & Linked Equipment */}
                <div className="inventory-grid-2">
                  <div className="inventory-field">
                    <label>Solicitante / Setor</label>
                    <input
                      value={editingOrder.patient_name || ''}
                      disabled
                      style={{ background: '#f0f3f1', cursor: 'not-allowed', color: '#687b76' }}
                    />
                  </div>

                  <div className="inventory-field">
                    <label>Equipamento Vinculado</label>
                    <input
                      value={editingOrder.equipment_name || 'Nenhum equipamento vinculado'}
                      disabled
                      style={{ background: '#f0f3f1', cursor: 'not-allowed', color: '#687b76' }}
                    />
                  </div>
                </div>

                {/* Service Type & Priority */}
                <div className="inventory-grid-2">
                  <div className="inventory-field">
                    <label>
                      Tipo de Serviço <span className="required">*</span>
                    </label>
                    <input
                      value={editingOrder.service_type || ''}
                      onChange={(e) => setEditingOrder({ ...editingOrder, service_type: e.target.value })}
                      required
                      disabled={isTechnicianLocked}
                      placeholder="Ex: Manutenção Corretiva, Calibração..."
                    />
                  </div>

                  <div className="inventory-field">
                    <label>
                      Prioridade <span className="required">*</span>
                    </label>
                    <select
                      value={editingOrder.priority}
                      onChange={(e) => setEditingOrder({ ...editingOrder, priority: e.target.value })}
                      required
                      disabled={isTechnicianLocked}
                    >
                      <option value="Pouco urgente">Pouco urgente</option>
                      <option value="Normal">Normal</option>
                      <option value="Alta">Alta</option>
                      <option value="Urgente">Urgente</option>
                    </select>
                  </div>
                </div>

                {/* Status */}
                <div className="inventory-field">
                  <label>
                    Estado da Ordem <span className="required">*</span>
                  </label>
                  <select
                    value={editingOrder.status}
                    onChange={(e) => setEditingOrder({ ...editingOrder, status: e.target.value })}
                    disabled={isTechnicianLocked}
                    required
                  >
                    <option value="open">Aberta (Pendente de atendimento)</option>
                    <option value="in_progress">Em andamento (Técnico trabalhando)</option>
                    <option value="completed">Concluída (Finalizada recentemente)</option>
                    <option value="billing_pending">Pendência de Faturamento (Aguardando pagamento)</option>
                    <option value="billed">Faturada (Paga - Acesso concedido ao técnico)</option>
                    <option value="cancelled">Cancelada</option>
                  </select>
                </div>

                {/* Requested Description */}
                <div className="inventory-field">
                  <label>Descrição Solicitada / Observação</label>
                  <textarea
                    value={editingOrder.service_requested_description ?? editingOrder.description ?? ''}
                    onChange={(e) =>
                      setEditingOrder({
                        ...editingOrder,
                        service_requested_description: e.target.value,
                        description: e.target.value
                      })
                    }
                    disabled={isTechnicianLocked}
                    rows={2}
                    placeholder="Descrição da solicitação ou observação..."
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1px solid var(--line)',
                      borderRadius: '10px',
                      outline: '0',
                      color: 'var(--teal)',
                      background: '#fbfcfa',
                      fontFamily: 'inherit',
                      fontSize: '13px'
                    }}
                  />
                </div>

                {/* Performed Service */}
                <div className="inventory-field">
                  <label>Serviço Realizado pelo Técnico</label>
                  <textarea
                    value={editingOrder.service_performed_description || ''}
                    onChange={(e) =>
                      setEditingOrder({ ...editingOrder, service_performed_description: e.target.value })
                    }
                    disabled={isTechnicianLocked}
                    rows={4}
                    placeholder="Descreva detalhadamente o diagnóstico, peças trocadas e ações realizadas..."
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: '1px solid var(--line)',
                      borderRadius: '10px',
                      outline: '0',
                      color: 'var(--teal)',
                      background: '#fbfcfa',
                      fontFamily: 'inherit',
                      fontSize: '13px'
                    }}
                  />
                </div>

                {/* Modal Actions */}
                <div className="inventory-modal-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={closeEditing}
                    disabled={isSaving}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="primary-button"
                    disabled={isSaving || isTechnicianLocked}
                  >
                    {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Confirmation Modal for Billing */}
      <BillingConfirmationModal
        isOpen={Boolean(confirmingBillingOrder)}
        order={confirmingBillingOrder}
        onConfirm={async (selectedPaymentDate) => {
          const target = confirmingBillingOrder;
          setConfirmingBillingOrder(null);
          await handleQuickBill(target, selectedPaymentDate);
        }}
        onClose={() => setConfirmingBillingOrder(null)}
        isSubmitting={isSaving}
      />

      {/* Delete Confirmation Modal */}
      {deletingOrder && (
        <div
          className="inventory-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSaving) setDeletingOrder(null);
          }}
        >
          <div className="inventory-modal" style={{ width: 'min(100%, 480px)' }}>
            <div className="inventory-modal-header">
              <div>
                <p className="eyebrow" style={{ color: '#dc2626' }}>Exclusão de Registro</p>
                <h2 style={{ color: '#991b1b' }}>Excluir Ordem de Serviço</h2>
              </div>
              <button
                type="button"
                className="inventory-modal-close"
                onClick={() => !isSaving && setDeletingOrder(null)}
                aria-label="Fechar"
                disabled={isSaving}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '8px 0 16px 0', fontSize: '13px', color: '#374151', lineHeight: 1.5 }}>
              <p style={{ marginBottom: '12px' }}>
                Tem certeza que deseja excluir permanentemente a ordem de serviço{' '}
                <strong style={{ color: 'var(--teal)' }}>
                  OS-{String(deletingOrder.order_number).padStart(5, '0')}
                </strong>
                ?
              </p>

              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fee2e2',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  marginBottom: '14px',
                  display: 'flex',
                  gap: '10px',
                  color: '#991b1b',
                  fontSize: '12px'
                }}
              >
                <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>Atenção: Ação irreversível!</strong>
                  <p style={{ marginTop: '3px', color: '#b91c1c' }}>
                    Esta ordem de serviço e o chamado técnico correspondente serão permanentemente excluídos do sistema.
                  </p>
                </div>
              </div>

              <div
                style={{
                  background: '#f8faf9',
                  border: '1px solid #e5ede8',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  fontSize: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <div>
                  <span style={{ color: '#6f7f7c' }}>Solicitante / Setor: </span>
                  <strong>{deletingOrder.patient_name || 'Setor Não Informado'}</strong>
                </div>
                <div>
                  <span style={{ color: '#6f7f7c' }}>Equipamento / Ativo: </span>
                  <strong>{deletingOrder.equipment_name || 'Serviço Geral'}</strong>
                </div>
                <div>
                  <span style={{ color: '#6f7f7c' }}>Tipo de Atendimento: </span>
                  <strong>{deletingOrder.service_type || 'Manutenção'}</strong>
                </div>
              </div>
            </div>

            <div className="inventory-modal-actions" style={{ justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setDeletingOrder(null)}
                disabled={isSaving}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={handleConfirmDelete}
                disabled={isSaving}
                style={{
                  background: '#dc2626',
                  borderColor: '#dc2626',
                  color: '#ffffff',
                  boxShadow: '0 2px 8px rgba(220, 38, 38, 0.25)'
                }}
              >
                {isSaving ? 'Excluindo...' : 'Sim, Excluir Ordem'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ServiceOrders;


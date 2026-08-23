import {
  CheckCircle2,
  Clock,
  Edit3,
  FileText,
  Laptop,
  Plus,
  RefreshCw,
  Search,
  UserCheck,
  Wrench,
  X
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import ExportDropdown from '../components/ExportDropdown.jsx';
import { getServiceOrders, getStoredUser, updateServiceOrder } from '../services/api.js';
import { exportToPdf, exportToXls } from '../utils/exportReport.js';

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
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Editing modal state
  const [editingOrder, setEditingOrder] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Filters
  const [activeKpiFilter, setActiveKpiFilter] = useState('all'); // 'all', 'open', 'in_progress', 'completed', 'urgent'
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [onlyMyOrders, setOnlyMyOrders] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    setIsLoading(true);
    try {
      const data = await getServiceOrders();
      setOrders(data);
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  function startEditing(order) {
    let normalizedPriority = 'Normal';
    const p = (order.priority || '').toLowerCase();
    if (['low', 'pouco urgente', 'baixa'].includes(p)) normalizedPriority = 'Pouco urgente';
    else if (p === 'normal') normalizedPriority = 'Normal';
    else if (['high', 'alta'].includes(p)) normalizedPriority = 'Alta';
    else if (['urgent', 'urgente'].includes(p)) normalizedPriority = 'Urgente';

    setEditingOrder({
      ...order,
      priority: normalizedPriority
    });
    setErrorMessage('');
    setSuccessMessage('');
  }

  function closeEditing() {
    setEditingOrder(null);
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
      setSuccessMessage(`Ordem OS-${String(editingOrder.order_number).padStart(5, '0')} atualizada com sucesso!`);
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
    let urgentCount = 0;

    orders.forEach((o) => {
      if (o.status === 'open') openCount++;
      if (o.status === 'in_progress') inProgressCount++;
      if (o.status === 'completed') completedCount++;

      const p = (o.priority || '').toLowerCase();
      const createdAt = new Date(o.created_at);
      const hoursOld = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
      if (o.status !== 'completed' && (p === 'urgent' || p === 'high' || hoursOld > 24)) {
        urgentCount++;
      }
    });

    return {
      total: orders.length,
      open: openCount,
      inProgress: inProgressCount,
      completed: completedCount,
      urgent: urgentCount
    };
  }, [orders]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // 1. KPI Tab Filter
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

      // 2. Status Filter Dropdown
      if (statusFilter !== 'all' && order.status !== statusFilter) return false;

      // 3. Priority Filter Dropdown
      if (priorityFilter !== 'all') {
        const p = (order.priority || '').toLowerCase();
        if (priorityFilter === 'low' && !['low', 'pouco urgente', 'baixa'].includes(p)) return false;
        if (priorityFilter === 'normal' && p !== 'normal') return false;
        if (priorityFilter === 'high' && !['high', 'alta'].includes(p)) return false;
        if (priorityFilter === 'urgent' && !['urgent', 'urgente'].includes(p)) return false;
      }

      // 4. Connected User Filter
      if (onlyMyOrders && user) {
        const isMyTechnician = order.technician_id === user.id || order.technician_name === user.name;
        const isMyRequest = order.created_by === user.id || order.patient_name === user.name;
        if (!isMyTechnician && !isMyRequest) return false;
      }

      // 5. Search Text
      if (search.trim()) {
        const term = search.toLowerCase();
        const str = `${order.order_number || ''} ${order.patient_name || ''} ${order.service_type || ''} ${order.equipment_name || ''} ${order.technician_name || ''} ${order.description || ''} ${order.service_requested_description || ''} ${order.service_performed_description || ''}`.toLowerCase();
        if (!str.includes(term)) return false;
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

  const exportColumns = [
    { header: 'Prioridade', accessor: (o) => getPriorityLabel(o.priority) },
    { header: 'Número OS', accessor: (o) => `OS-${String(o.order_number).padStart(5, '0')}` },
    { header: 'Estado', accessor: (o) => getStatusLabel(o.status) },
    { header: 'Solicitante / Setor', accessor: (o) => o.patient_name || 'Setor Não Informado' },
    { header: 'Equipamento / Ativo', accessor: (o) => o.equipment_name || 'Serviço Geral' },
    { header: 'Responsável Técnico', accessor: (o) => o.technician_name || 'Não atribuído' },
    { header: 'Tipo de Serviço', accessor: (o) => o.service_type || 'Manutenção' },
    { header: 'Criada em', accessor: (o) => formatDate(o.created_at) },
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

        <div
          className={`ticket-kpi-card ${activeKpiFilter === 'completed' ? 'ticket-kpi-card--active' : ''}`}
          onClick={() => setActiveKpiFilter('completed')}
          role="button"
          tabIndex={0}
        >
          <div className="ticket-kpi-info">
            <span className="ticket-kpi-title">Concluídas</span>
            <span className="ticket-kpi-sub">Ordens finalizadas</span>
          </div>
          <strong className="ticket-kpi-count">{kpis.completed}</strong>
        </div>
      </div>

      {/* Toolbar Filters */}
      <div className="tickets-filter-bar">
        <div className="tickets-filter-left">
          <button
            type="button"
            className="ticket-reload-btn"
            onClick={loadOrders}
            title="Recarregar lista"
            aria-label="Recarregar lista"
          >
            <RefreshCw size={15} />
          </button>

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

          <label className="ticket-filter-checkbox">
            <input
              type="checkbox"
              checked={onlyMyOrders}
              onChange={(e) => setOnlyMyOrders(e.target.checked)}
            />
            Filtrar por usuário conectado
          </label>
        </div>

        <div className="search-control" style={{ width: '260px' }}>
          <Search size={16} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar por OS, local, serviço..."
            aria-label="Pesquisar ordens de serviço"
          />
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
                  <th style={{ width: '115px' }}>Prioridade</th>
                  <th style={{ width: '90px' }}>Número OS</th>
                  <th style={{ width: '105px' }}>Estado</th>
                  <th>Solicitante / Setor</th>
                  <th>Equipamento / Ativo</th>
                  <th>Responsável Técnico</th>
                  <th>Tipo de Serviço</th>
                  <th style={{ width: '120px' }}>Criada em</th>
                  <th>Observações / Serviço</th>
                  <th style={{ width: '50px', textAlign: 'right' }}>Ação</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const priorityText = getPriorityLabel(order.priority);
                  const priorityClass = getPriorityBadgeClass(order.priority);
                  const statusText = getStatusLabel(order.status);
                  const statusClass = getStatusBadgeClass(order.status);

                  return (
                    <tr key={order.id}>
                      {/* Priority */}
                      <td>
                        <span className={`ticket-priority-badge ${priorityClass}`}>
                          {priorityText}
                        </span>
                      </td>

                      {/* OS Number */}
                      <td style={{ fontWeight: 700, color: 'var(--teal)', fontSize: '12px' }}>
                        OS-{String(order.order_number).padStart(5, '0')}
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`os-status-badge ${statusClass}`}>
                          {statusText}
                        </span>
                      </td>

                      {/* Requester / Sector */}
                      <td style={{ color: 'var(--teal)', fontWeight: 600 }}>
                        {order.patient_name || 'Setor Não Informado'}
                      </td>

                      {/* Equipment / Asset */}
                      <td style={{ color: 'var(--ink)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: '#4d8796' }}>
                            {order.equipment_name ? <Laptop size={15} /> : <Wrench size={15} />}
                          </span>
                          <span style={{ fontWeight: order.equipment_name ? 600 : 400 }}>
                            {order.equipment_name || 'Serviço Geral'}
                          </span>
                        </div>
                      </td>

                      {/* Responsible Technician */}
                      <td>
                        {order.technician_name ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#2b6351', fontWeight: 600 }}>
                            <UserCheck size={14} />
                            <span>{order.technician_name}</span>
                          </div>
                        ) : (
                          <span style={{ color: '#9aa6a2', fontStyle: 'italic' }}>Técnico não atribuído</span>
                        )}
                      </td>

                      {/* Service Type */}
                      <td style={{ color: 'var(--muted)' }}>
                        {order.service_type || 'Manutenção Corretiva'}
                      </td>

                      {/* Created At */}
                      <td style={{ color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                        {formatDate(order.created_at)}
                      </td>

                      {/* Observations / Requested vs Performed Description */}
                      <td style={{ color: 'var(--muted)', maxWidth: '240px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ color: 'var(--teal)', fontSize: '12px', fontWeight: 600, lineHeight: 1.3 }}>
                            {order.service_requested_description || order.description || 'Sem descrição'}
                          </span>
                          {order.service_performed_description ? (
                            <span style={{ fontSize: '11px', color: '#1f6e52', background: '#ecfdf5', padding: '3px 7px', borderRadius: '5px', border: '1px solid #d1fae5', lineHeight: 1.3 }}>
                              <strong>Técnico:</strong> {order.service_performed_description}
                            </span>
                          ) : (
                            <span style={{ fontSize: '11px', color: '#9aa6a2', fontStyle: 'italic' }}>
                              Aguardando parecer técnico
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Action */}
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="inventory-action-btn"
                          onClick={() => startEditing(order)}
                          title={`Editar OS-${String(order.order_number).padStart(5, '0')}`}
                          aria-label={`Editar OS ${order.order_number}`}
                        >
                          <Edit3 size={15} />
                        </button>
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
      {editingOrder && (
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
              <button
                type="button"
                className="inventory-modal-close"
                onClick={closeEditing}
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            {errorMessage && <p className="ticket-feedback" style={{ marginBottom: '16px', background: '#fee2e2', color: '#dc2626' }}>{errorMessage}</p>}

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
                  required
                >
                  <option value="open">Aberta (Pendente de atendimento)</option>
                  <option value="in_progress">Em andamento (Técnico trabalhando)</option>
                  <option value="completed">Concluída (Finalizada com sucesso)</option>
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
                  disabled={isSaving}
                >
                  {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ServiceOrders;


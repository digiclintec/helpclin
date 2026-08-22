import { ArrowRight, Edit3, FileText, Search, Wrench } from 'lucide-react';
import { useEffect, useState } from 'react';

import { getServiceOrders, getStoredUser, updateServiceOrder } from '../services/api.js';

function formatDate(value) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
}

function Dashboard() {
  const user = getStoredUser();
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [editingOrder, setEditingOrder] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    getServiceOrders()
      .then(setOrders)
      .catch((error) => setErrorMessage(error.message))
      .finally(() => setIsLoading(false));
  }, []);

  const filteredOrders = orders.filter((order) => `${order.order_number} ${order.patient_name} ${order.service_type}`.toLowerCase().includes(search.toLowerCase()));

  function startEditing(order) {
    setEditingOrder({ ...order, priority: order.priority === 'high' ? 'Alta' : order.priority === 'urgent' ? 'Urgente' : 'Normal' });
    setErrorMessage('');
  }

  async function saveOrder(event) {
    event.preventDefault();
    setIsSaving(true);
    try {
      const updated = await updateServiceOrder(editingOrder.id, { serviceType: editingOrder.service_type, priority: editingOrder.priority, dueDate: editingOrder.due_date, performedDescription: editingOrder.service_performed_description, status: editingOrder.status, technicianId: editingOrder.technician_id });
      setOrders(orders.map((order) => order.id === updated.id ? { ...order, ...updated } : order));
      setEditingOrder(null);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSaving(false);
    }
  }

  return <div className="simple-page orders-page"><section className="simple-page-heading"><div><p className="eyebrow">Central de operações</p><h1>Ordens de serviço</h1><p>Consulte e atualize as ordens geradas a partir dos chamados.</p></div><div className="work-order-user"><span>Olá, {user?.name ?? 'Usuário'}</span><strong>{orders.length} ordens registradas</strong></div></section><section className="ticket-list-card"><div className="list-toolbar"><div><p className="eyebrow">Histórico</p><h2>Ordens registradas <span>{orders.length}</span></h2></div><div className="search-control"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar ordem" aria-label="Buscar ordem" /></div></div>{isLoading && <div className="data-state">Carregando ordens de serviço...</div>}{errorMessage && <div className="data-state data-state--error">{errorMessage}</div>}{!isLoading && !errorMessage && filteredOrders.length === 0 && <div className="data-state"><FileText size={25} /><strong>{search ? 'Nenhuma ordem encontrada' : 'Nenhuma ordem registrada'}</strong><span>{search ? 'Tente outro termo de busca.' : 'Novas ordens aparecerão aqui quando um chamado for aberto.'}</span></div>}{!isLoading && !errorMessage && filteredOrders.length > 0 && <div className="ticket-list">{filteredOrders.map((order) => <article className="ticket-row ticket-row--order" key={order.id}><div className="ticket-row-icon"><Wrench size={17} /></div><div className="ticket-main"><strong>OS-{String(order.order_number).padStart(5, '0')}</strong><span>{order.patient_name}</span><small>{order.technician_name ? `Técnico: ${order.technician_name}` : 'Técnico não atribuído'}</small></div><span className="ticket-priority ticket-priority--normal">{order.priority}</span><span className={`ticket-status ticket-status--${order.status}`}>{order.status === 'in_progress' ? 'Em andamento' : order.status === 'completed' ? 'Concluída' : order.status}</span><time>{formatDate(order.created_at)}</time><button className="order-edit-button" onClick={() => startEditing(order)} aria-label={`Editar OS ${order.order_number}`}><Edit3 size={15} /></button></article>)}</div>}</section>{editingOrder && <div className="order-editor-backdrop"><form className="order-editor" onSubmit={saveOrder}><div className="order-editor-heading"><div><p className="eyebrow">OS-{String(editingOrder.order_number).padStart(5, '0')}</p><h2>Editar ordem de serviço</h2></div><button type="button" className="icon-button" onClick={() => setEditingOrder(null)} aria-label="Fechar edição">×</button></div><label>Solicitante<input value={editingOrder.patient_name} disabled /></label><label>Serviço<input value={editingOrder.service_type} onChange={(event) => setEditingOrder({ ...editingOrder, service_type: event.target.value })} required /></label><label>Estado<select value={editingOrder.status} onChange={(event) => setEditingOrder({ ...editingOrder, status: event.target.value })}><option value="open">Aberta</option><option value="in_progress">Em andamento</option><option value="completed">Concluída</option><option value="cancelled">Cancelada</option></select></label><label>Prioridade<select value={editingOrder.priority} onChange={(event) => setEditingOrder({ ...editingOrder, priority: event.target.value })}><option>Normal</option><option>Alta</option><option>Urgente</option></select></label><label>Descrição solicitada<input value={editingOrder.service_requested_description ?? editingOrder.description ?? ''} disabled /></label><label>Serviço realizado<textarea value={editingOrder.service_performed_description ?? ''} onChange={(event) => setEditingOrder({ ...editingOrder, service_performed_description: event.target.value })} rows="4" placeholder="Descreva o que foi realizado pelo técnico" /></label><div className="order-editor-actions"><button type="button" className="secondary-button" onClick={() => setEditingOrder(null)}>Cancelar</button><button type="submit" className="primary-button" disabled={isSaving}>{isSaving ? 'Salvando...' : 'Salvar alterações'}</button></div></form></div>}</div>;
}

export default Dashboard;

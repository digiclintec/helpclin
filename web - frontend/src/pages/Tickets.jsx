import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileUp,
  Filter,
  Headset,
  Laptop,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  UserCheck,
  Wrench,
  X
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import ExportDropdown from '../components/ExportDropdown.jsx';
import {
  assignSupportTicket,
  createSupportTicket,
  getInventory,
  getStoredUser,
  getSupportTickets
} from '../services/api.js';
import { exportToPdf, exportToXls } from '../utils/exportReport.js';

const SERVICE_PROBLEMS = [
  'Dificuldades com sistema Clinux',
  'Lentidão ou travamento no sistema',
  'Erro de login / Senha bloqueada',
  'Sem conexão com a internet / Rede oscilando',
  'Falha na impressão de prontuários / laudos',
  'Problema no e-mail corporativo',
  'Instalação / Atualização de software',
  'Cadastro / Permissão de acesso de usuário',
  'Outro problema (detalhado nas observações)'
];

function getEquipmentProblemSuggestions(selectedEquipment) {
  if (!selectedEquipment) {
    return [
      'Equipamento não liga / Sem energia',
      'Superaquecimento / Ruído excessivo',
      'Mau contato em cabos ou conectores',
      'Falha de funcionamento intermitente',
      'Necessidade de manutenção preventiva / Calibração',
      'Dano físico / Peça quebrada',
      'Outro problema (detalhado nas observações)'
    ];
  }

  const type = (selectedEquipment.equipment_type || '').toLowerCase();
  const name = (selectedEquipment.name || '').toLowerCase();

  if (type.includes('impress') || name.includes('impress') || name.includes('epson') || name.includes('hp') || name.includes('zebra')) {
    return [
      'Impressora travada / Não imprime',
      'Atolamento de papel constante',
      'Qualidade de impressão ruim / Falha de tinta ou toner',
      'Impressora offline / Não reconhecida na rede',
      'Necessidade de troca de suprimento / Toner / Fita',
      'Luz de erro piscando no painel',
      'Outro problema (detalhado nas observações)'
    ];
  }

  if (type.includes('monitor') || name.includes('monitor') || name.includes('tela') || name.includes('display')) {
    return [
      'Monitor sem sinal de vídeo',
      'Tela piscando ou com linhas / faixas',
      'Monitor não liga / Sem energia',
      'Cabo HDMI / DisplayPort com mau contato',
      'Imagem desfocada / Resolução incorreta',
      'Outro problema (detalhado nas observações)'
    ];
  }

  if (type.includes('computador') || type.includes('notebook') || name.includes('computador') || name.includes('notebook') || name.includes('pc') || name.includes('cpu') || name.includes('desktop')) {
    return [
      'Computador não liga / Não dá vídeo',
      'Lentidão extrema / Travando o Windows',
      'Tela azul / Reiniciando sozinho',
      'Teclado / Mouse / Leitor com defeito',
      'Sem acesso à rede local / Wi-Fi',
      'Barulho excessivo na ventoinha / Cooler',
      'Outro problema (detalhado nas observações)'
    ];
  }

  if (type.includes('balan') || type.includes('clínic') || name.includes('balan') || name.includes('sensor') || name.includes('cardio') || name.includes('eletro')) {
    return [
      'Erro de calibração / Leitura oscilando',
      'Equipamento não liga / Bateria não carrega',
      'Display apagado / Dígitos falhando',
      'Cabo de alimentação ou sensor com defeito',
      'Alarme sonoro / Código de erro no visor',
      'Outro problema (detalhado nas observações)'
    ];
  }

  return [
    'Equipamento não liga / Sem energia',
    'Superaquecimento / Ruído excessivo',
    'Mau contato elétrico ou conector danificado',
    'Falha de funcionamento intermitente',
    'Necessidade de calibração / Manutenção preventiva',
    'Dano físico / Peça quebrada',
    'Outro problema (detalhado nas observações)'
  ];
}

const emptyForm = {
  ticketType: 'equipment',
  companySector: '',
  location: '',
  relatedProblem: '',
  observations: '',
  attachmentName: '',
  priority: 'Normal',
  equipmentId: ''
};

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

function Tickets() {
  const user = getStoredUser();
  const [tickets, setTickets] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState('');

  // Modals and forms
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [assigningId, setAssigningId] = useState(null);

  // Filters
  const [activeKpiFilter, setActiveKpiFilter] = useState('all'); // 'all', 'unassigned', 'overdue', 'in_progress', 'resolved'
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [onlyMyTickets, setOnlyMyTickets] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    try {
      const [ticketsData, inventoryData] = await Promise.all([
        getSupportTickets(),
        getInventory()
      ]);
      setTickets(ticketsData);
      setInventory(inventoryData);
      setFeedback('');
    } catch (error) {
      setFeedback(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  // Selected equipment object and suggestions
  const selectedEquipment = useMemo(() => {
    if (!form.equipmentId) return null;
    return inventory.find((eq) => String(eq.id) === String(form.equipmentId)) || null;
  }, [form.equipmentId, inventory]);

  const currentProblemSuggestions = useMemo(() => {
    if (form.ticketType === 'service') {
      return SERVICE_PROBLEMS;
    }
    return getEquipmentProblemSuggestions(selectedEquipment);
  }, [form.ticketType, selectedEquipment]);

  function updateField(event) {
    const { name, value, type, files } = event.target;
    const val = type === 'file' ? files[0]?.name ?? '' : value;

    if (name === 'equipmentId') {
      const eq = inventory.find((item) => String(item.id) === String(val));
      setForm((prev) => ({
        ...prev,
        equipmentId: val,
        companySector: eq?.location || prev.companySector,
        location: eq?.location || prev.location
      }));
    } else if (name === 'ticketType') {
      setForm((prev) => ({
        ...prev,
        ticketType: val,
        equipmentId: val === 'service' ? '' : prev.equipmentId,
        relatedProblem: ''
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: val }));
    }
    setFeedback('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSaving(true);
    setFeedback('');
    try {
      const ticket = await createSupportTicket({
        ...form,
        location: form.location || form.companySector,
        createdBy: user?.id
      });
      setTickets([ticket, ...tickets]);
      setForm(emptyForm);
      setIsFormOpen(false);
      setFeedback(`Chamado criado com o protocolo ${ticket.protocol || 'OS-' + ticket.ticket_number}.`);
    } catch (error) {
      setFeedback(error.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAssign(ticketId) {
    setAssigningId(ticketId);
    setFeedback('');
    try {
      const updatedTicket = await assignSupportTicket(ticketId, user?.id);
      setTickets(
        tickets.map((t) =>
          t.id === ticketId ? { ...t, ...updatedTicket, assigned_to_name: user?.name, status: 'in_progress' } : t
        )
      );
      setFeedback('Chamado assumido com sucesso!');
    } catch (error) {
      setFeedback(error.message);
    } finally {
      setAssigningId(null);
    }
  }

  // Calculate KPIs
  const now = new Date();
  const kpis = useMemo(() => {
    let unassigned = 0;
    let inProgress = 0;
    let overdue = 0;
    let resolved = 0;

    tickets.forEach((t) => {
      const isUnassigned = !t.assigned_to_name && t.status !== 'resolved';
      if (isUnassigned) unassigned++;
      if (t.status === 'in_progress') inProgress++;
      if (t.status === 'resolved') resolved++;

      // Overdue logic: open/in_progress older than 24 hours or marked urgent
      const createdAt = new Date(t.created_at);
      const hoursOld = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
      if (t.status !== 'resolved' && (hoursOld > 24 || t.priority === 'urgent' || t.priority === 'Urgente')) {
        overdue++;
      }
    });

    return {
      total: tickets.length,
      unassigned,
      inProgress,
      overdue,
      resolved
    };
  }, [tickets]);

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      // 1. KPI Tab Filter
      if (activeKpiFilter === 'unassigned') {
        if (ticket.assigned_to_name || ticket.status === 'resolved') return false;
      } else if (activeKpiFilter === 'in_progress') {
        if (ticket.status !== 'in_progress') return false;
      } else if (activeKpiFilter === 'resolved') {
        if (ticket.status !== 'resolved') return false;
      } else if (activeKpiFilter === 'overdue') {
        const createdAt = new Date(ticket.created_at);
        const hoursOld = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        const isOverdue = ticket.status !== 'resolved' && (hoursOld > 24 || ticket.priority === 'urgent' || ticket.priority === 'Urgente');
        if (!isOverdue) return false;
      }

      // 2. Priority Filter
      if (priorityFilter !== 'all') {
        const p = (ticket.priority || '').toLowerCase();
        if (priorityFilter === 'low' && !['low', 'pouco urgente', 'baixa'].includes(p)) return false;
        if (priorityFilter === 'normal' && p !== 'normal') return false;
        if (priorityFilter === 'high' && !['high', 'alta'].includes(p)) return false;
        if (priorityFilter === 'urgent' && !['urgent', 'urgente'].includes(p)) return false;
      }

      // 3. Connected User Filter
      if (onlyMyTickets && user) {
        const isAssignedToMe = ticket.assigned_to === user.id || ticket.assigned_to_name === user.name;
        const isCreatedByMe = ticket.created_by === user.id || ticket.requester === user.name;
        if (!isAssignedToMe && !isCreatedByMe) return false;
      }

      // 4. Search Text
      if (search.trim()) {
        const term = search.toLowerCase();
        const str = `${ticket.ticket_number || ''} ${ticket.service_order_number || ''} ${ticket.related_problem || ''} ${ticket.company_sector || ''} ${ticket.location || ''} ${ticket.equipment_name || ''} ${ticket.assigned_to_name || ''} ${ticket.requester || ''} ${ticket.observations || ''}`.toLowerCase();
        if (!str.includes(term)) return false;
      }

      return true;
    });
  }, [tickets, activeKpiFilter, priorityFilter, onlyMyTickets, search, user]);

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
    { header: 'Prioridade', accessor: (t) => getPriorityLabel(t.priority) },
    { header: 'OS / Protocolo', accessor: (t) => `OS-${String(t.service_order_number || t.ticket_number).padStart(5, '0')}` },
    { header: 'Estado / Status', accessor: (t) => (t.status === 'resolved' ? 'Resolvido' : t.status === 'in_progress' ? 'Em andamento' : 'Aberto') },
    { header: 'Empresa / Setor', accessor: 'company_sector' },
    { header: 'Ativo / Serviço', accessor: (t) => t.equipment_name || (t.ticket_type === 'equipment' ? 'Equipamento' : 'Serviço Geral') },
    { header: 'Responsável', accessor: (t) => t.assigned_to_name || 'Sem responsável' },
    { header: 'Problema Relatado', accessor: 'related_problem' },
    { header: 'Observações / Solicitado', accessor: 'observations' },
    { header: 'Serviço Realizado pelo Técnico', accessor: (t) => t.service_performed_description || '—' },
    { header: 'Solicitante', accessor: (t) => t.requester || '—' },
    { header: 'Localização', accessor: 'location' },
    { header: 'Data de Abertura', accessor: (t) => formatDate(t.created_at) }
  ];

  function handleExportXls() {
    exportToXls({
      title: 'Relatório de Chamados',
      filename: 'Relatorio_Chamados_HelpClin',
      columns: exportColumns,
      data: filteredTickets
    });
  }

  function handleExportPdf() {
    exportToPdf({
      title: 'Relatório de Chamados',
      subtitle: `Listagem de ${filteredTickets.length} chamados filtrados`,
      columns: exportColumns,
      data: filteredTickets,
      summary: [
        { label: 'Total Filtrado', value: filteredTickets.length },
        { label: 'Sem Responsável', value: kpis.unassigned },
        { label: 'Em Andamento', value: kpis.inProgress },
        { label: 'Resolvidos', value: kpis.resolved }
      ]
    });
  }

  return (
    <div className="simple-page tickets-page">
      {/* Top Header */}
      <section className="simple-page-heading">
        <div>
          <p className="eyebrow">Central de Atendimento</p>
          <h1>Chamados</h1>
          <p>Gerencie, acompanhe e atribua os chamados abertos da clínica em tempo real.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ExportDropdown onExportXls={handleExportXls} onExportPdf={handleExportPdf} />
          <button
            className="primary-button"
            onClick={() => {
              setForm(emptyForm);
              setIsFormOpen(true);
            }}
            type="button"
          >
            <Plus size={16} /> Abrir Chamado
          </button>
        </div>
      </section>

      {feedback && !isFormOpen && <p className="ticket-feedback">{feedback}</p>}

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
            <span className="ticket-kpi-sub">Até o momento</span>
          </div>
          <strong className="ticket-kpi-count">{kpis.total}</strong>
        </div>

        <div
          className={`ticket-kpi-card ${activeKpiFilter === 'unassigned' ? 'ticket-kpi-card--active' : ''}`}
          onClick={() => setActiveKpiFilter('unassigned')}
          role="button"
          tabIndex={0}
        >
          <div className="ticket-kpi-info">
            <span className="ticket-kpi-title">A atender</span>
            <span className="ticket-kpi-sub">Sem responsável</span>
          </div>
          <strong className="ticket-kpi-count">{kpis.unassigned}</strong>
        </div>

        <div
          className={`ticket-kpi-card ${activeKpiFilter === 'overdue' ? 'ticket-kpi-card--active' : ''}`}
          onClick={() => setActiveKpiFilter('overdue')}
          role="button"
          tabIndex={0}
        >
          <div className="ticket-kpi-info">
            <span className="ticket-kpi-title">Vencidas</span>
            <span className="ticket-kpi-sub">Atendimento atrasado</span>
          </div>
          <strong className="ticket-kpi-count">{kpis.overdue}</strong>
        </div>

        <div
          className={`ticket-kpi-card ${activeKpiFilter === 'in_progress' ? 'ticket-kpi-card--active' : ''}`}
          onClick={() => setActiveKpiFilter('in_progress')}
          role="button"
          tabIndex={0}
        >
          <div className="ticket-kpi-info">
            <span className="ticket-kpi-title">Em andamento</span>
            <span className="ticket-kpi-sub">Em execução</span>
          </div>
          <strong className="ticket-kpi-count">{kpis.inProgress}</strong>
        </div>

        <div
          className={`ticket-kpi-card ${activeKpiFilter === 'resolved' ? 'ticket-kpi-card--active' : ''}`}
          onClick={() => setActiveKpiFilter('resolved')}
          role="button"
          tabIndex={0}
        >
          <div className="ticket-kpi-info">
            <span className="ticket-kpi-title">Resolvidos</span>
            <span className="ticket-kpi-sub">Chamados atendidos</span>
          </div>
          <strong className="ticket-kpi-count">{kpis.resolved}</strong>
        </div>
      </div>

      {/* Toolbar Filters */}
      <div className="tickets-filter-bar">
        <div className="tickets-filter-left">
          <button
            type="button"
            className="ticket-reload-btn"
            onClick={loadData}
            title="Recarregar lista"
            aria-label="Recarregar lista"
          >
            <RefreshCw size={15} />
          </button>

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
              checked={onlyMyTickets}
              onChange={(e) => setOnlyMyTickets(e.target.checked)}
            />
            Filtrar por usuário conectado
          </label>
        </div>

        <div className="search-control" style={{ width: '260px' }}>
          <Search size={16} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Busque por chamados..."
            aria-label="Busque por chamados"
          />
        </div>
      </div>

      {/* Table Section */}
      <section className="ticket-list-card" style={{ padding: '0', overflow: 'hidden' }}>
        {isLoading ? (
          <div className="data-state">Carregando chamados...</div>
        ) : filteredTickets.length === 0 ? (
          <div className="user-empty-state" style={{ padding: '3.5rem', textAlign: 'center' }}>
            <MessageSquare size={32} style={{ margin: '0 auto', color: '#67a486' }} />
            <strong style={{ display: 'block', marginTop: '1rem' }}>
              {search || activeKpiFilter !== 'all' || priorityFilter !== 'all' || onlyMyTickets
                ? 'Nenhum chamado encontrado para os filtros selecionados'
                : 'Nenhum chamado registrado'}
            </strong>
            <span>
              {search || activeKpiFilter !== 'all'
                ? 'Tente limpar os filtros para visualizar outros chamados.'
                : 'Clique em "Abrir Chamado" para registrar uma nova solicitação.'}
            </span>
          </div>
        ) : (
          <div className="helpclin-table-wrapper">
            <table className="helpclin-table">
              <thead>
                <tr>
                  <th style={{ width: '120px' }}>Prioridade</th>
                  <th style={{ width: '100px' }}>OS / Protocolo</th>
                  <th>Setor</th>
                  <th>Ativo / Serviço</th>
                  <th>Responsável</th>
                  <th>Problema Relatado</th>
                  <th>Solicitante / Local</th>
                  <th style={{ width: '120px' }}>Abertura</th>
                  <th style={{ width: '80px', textAlign: 'right' }}>Ação</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((ticket) => {
                  const isUnassigned = !ticket.assigned_to_name && ticket.status !== 'resolved';
                  const priorityText = getPriorityLabel(ticket.priority);
                  const badgeClass = getPriorityBadgeClass(ticket.priority);

                  return (
                    <tr key={ticket.id}>
                      {/* Priority */}
                      <td>
                        <span className={`ticket-priority-badge ${badgeClass}`}>
                          {priorityText}
                        </span>
                      </td>

                      {/* OS Number */}
                      <td style={{ fontWeight: 700, color: 'var(--teal)', fontSize: '12px' }}>
                        OS-{String(ticket.service_order_number || ticket.ticket_number).padStart(5, '0')}
                      </td>

                      {/* Company / Sector */}
                      <td style={{ color: 'var(--teal)', fontWeight: 600 }}>
                        {ticket.company_sector}
                      </td>

                      {/* Asset / Service */}
                      <td style={{ color: 'var(--ink)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: '#4d8796' }}>
                            {ticket.ticket_type === 'equipment' ? <Laptop size={15} /> : <Wrench size={15} />}
                          </span>
                          <span>
                            {ticket.equipment_name
                              ? ticket.equipment_name
                              : ticket.ticket_type === 'equipment'
                              ? 'Equipamento'
                              : 'Serviço Geral'}
                          </span>
                        </div>
                      </td>

                      {/* Responsible */}
                      <td>
                        {ticket.assigned_to_name ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#2b6351', fontWeight: 600 }}>
                            <UserCheck size={14} />
                            <span>{ticket.assigned_to_name}</span>
                          </div>
                        ) : (
                          <span style={{ color: '#9aa6a2', fontStyle: 'italic' }}>Sem responsável</span>
                        )}
                      </td>

                      {/* Related Problem & Observations & Technician Performed Service */}
                      <td style={{ color: 'var(--muted)', maxWidth: '220px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <strong style={{ color: 'var(--teal)', display: 'block', fontSize: '12px', fontWeight: 600 }}>
                            {ticket.related_problem}
                          </strong>
                          {ticket.observations && (
                            <span style={{ fontSize: '11px', color: '#687b76', lineHeight: 1.3 }}>
                              {ticket.observations}
                            </span>
                          )}
                          {ticket.service_performed_description ? (
                            <span style={{ fontSize: '11px', color: '#1f6e52', background: '#ecfdf5', padding: '3px 7px', borderRadius: '5px', border: '1px solid #d1fae5', marginTop: '2px', lineHeight: 1.3 }}>
                              <strong>Técnico:</strong> {ticket.service_performed_description}
                            </span>
                          ) : ticket.status === 'in_progress' ? (
                            <span style={{ fontSize: '10px', color: '#e78368', fontStyle: 'italic' }}>
                              Em execução pelo técnico
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* Requester / Location */}
                      <td style={{ color: 'var(--muted)' }}>
                        <span style={{ display: 'block', fontWeight: 600, color: 'var(--teal)' }}>
                          {ticket.requester || 'Solicitante'}
                        </span>
                        <span style={{ fontSize: '11px' }}>{ticket.location}</span>
                      </td>

                      {/* Date */}
                      <td style={{ color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                        {formatDate(ticket.created_at)}
                      </td>

                      {/* Action */}
                      <td style={{ textAlign: 'right' }}>
                        {isUnassigned ? (
                          <button
                            type="button"
                            className="ticket-attend-btn"
                            onClick={() => handleAssign(ticket.id)}
                            disabled={assigningId === ticket.id}
                            title="Assumir chamado"
                          >
                            {assigningId === ticket.id ? 'Atendendo...' : 'Atender'}
                            <ArrowRight size={13} />
                          </button>
                        ) : (
                          <span className="assigned-label" style={{ fontSize: '11px', padding: '5px 9px' }}>
                            {ticket.status === 'resolved' ? 'Resolvido' : 'Atendido'}
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

      {/* New Ticket Modal */}
      {isFormOpen && (
        <div
          className="inventory-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsFormOpen(false);
          }}
        >
          <div className="inventory-modal" style={{ width: 'min(100%, 580px)' }}>
            <div className="inventory-modal-header">
              <div>
                <p className="eyebrow">Nova Solicitação</p>
                <h2>Abertura de Chamado</h2>
              </div>
              <button
                type="button"
                className="inventory-modal-close"
                onClick={() => setIsFormOpen(false)}
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            {feedback && <p className="ticket-feedback" style={{ marginBottom: '16px' }}>{feedback}</p>}

            <form onSubmit={handleSubmit} className="inventory-form">
              {/* Type & Priority */}
              <div className="inventory-grid-2">
                <div className="inventory-field">
                  <label>
                    Tipo de chamado <span className="required">*</span>
                  </label>
                  <select
                    name="ticketType"
                    value={form.ticketType}
                    onChange={updateField}
                    required
                  >
                    <option value="equipment">Equipamento (Hardware)</option>
                    <option value="service">Serviço / Software / Rede</option>
                  </select>
                </div>

                <div className="inventory-field">
                  <label>
                    Prioridade <span className="required">*</span>
                  </label>
                  <select
                    name="priority"
                    value={form.priority}
                    onChange={updateField}
                    required
                  >
                    <option value="Pouco urgente">Pouco urgente</option>
                    <option value="Normal">Normal</option>
                    <option value="Alta">Alta</option>
                    <option value="Urgente">Urgente</option>
                  </select>
                </div>
              </div>

              {/* Equipment (if applicable) */}
              {form.ticketType === 'equipment' && (
                <div className="inventory-field">
                  <label>
                    Equipamento <span className="required">*</span>
                  </label>
                  <select
                    name="equipmentId"
                    value={form.equipmentId}
                    onChange={updateField}
                    required
                  >
                    <option value="">Selecione o equipamento cadastrado</option>
                    {inventory.map((eq) => (
                      <option key={eq.id} value={eq.id}>
                        {eq.name} — {eq.location || 'Sem local'} (S/N: {eq.serial_number || 'N/A'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Sector */}
              <div className="inventory-field">
                <label>
                  Setor <span className="required">*</span>
                </label>
                <input
                  name="companySector"
                  value={form.companySector}
                  onChange={updateField}
                  placeholder="Ex: Recepção, Consultório 1, Triagem..."
                  required
                />
              </div>

              {/* Problem Selection & Suggestions */}
              <div className="inventory-field">
                <label>
                  Problema relacionado <span className="required">*</span>
                </label>
                <select
                  name="relatedProblem"
                  value={form.relatedProblem}
                  onChange={updateField}
                  required
                >
                  <option value="">Selecione o problema relacionado...</option>
                  {currentProblemSuggestions.map((prob) => (
                    <option key={prob} value={prob}>
                      {prob}
                    </option>
                  ))}
                  {!currentProblemSuggestions.includes('Outro problema (detalhado nas observações)') && (
                    <option value="Outro problema (detalhado nas observações)">
                      Outro problema (detalhado nas observações)
                    </option>
                  )}
                </select>

                {/* Quick Selection Chips */}
                <div className="ticket-problem-chips">
                  {currentProblemSuggestions.slice(0, 5).map((prob) => (
                    <button
                      key={prob}
                      type="button"
                      className={`ticket-problem-chip ${form.relatedProblem === prob ? 'ticket-problem-chip--active' : ''}`}
                      onClick={() => setForm({ ...form, relatedProblem: prob })}
                    >
                      {prob}
                    </button>
                  ))}
                </div>
              </div>

              {/* Observations */}
              <div className="inventory-field">
                <label>
                  Observações detalhadas <span className="required">*</span>
                </label>
                <textarea
                  name="observations"
                  value={form.observations}
                  onChange={updateField}
                  placeholder="Descreva o que ocorreu com o máximo de detalhes..."
                  rows={3}
                  required
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

              {/* Attachment */}
              <div className="inventory-field">
                <label>Anexo (Opcional)</label>
                <label className="file-input">
                  <FileUp size={17} />
                  <span>{form.attachmentName || 'Clique para selecionar um arquivo'}</span>
                  <input name="attachmentName" type="file" onChange={updateField} />
                </label>
              </div>

              {/* Modal Actions */}
              <div className="inventory-modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setIsFormOpen(false)}
                  disabled={isSaving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={isSaving}
                >
                  {isSaving ? 'Registrando...' : 'Registrar Chamado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Tickets;


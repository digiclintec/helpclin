import { ArrowRight, CirclePlus, FileUp, Headset, MessageSquare, Search } from 'lucide-react';
import { useEffect, useState } from 'react';

import { assignSupportTicket, createSupportTicket, getStoredUser, getSupportTickets } from '../services/api.js';

const emptyForm = { ticketType: 'service', companySector: '', location: '', relatedProblem: '', observations: '', attachmentName: '' };

function Tickets() {
  const user = getStoredUser();
  const [tickets, setTickets] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [assigningId, setAssigningId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    getSupportTickets().then(setTickets).catch((error) => setFeedback(error.message)).finally(() => setIsLoading(false));
  }, []);

  function updateField(event) {
    const value = event.target.type === 'file' ? event.target.files[0]?.name ?? '' : event.target.value;
    setForm({ ...form, [event.target.name]: value });
    setFeedback('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSaving(true);
    setFeedback('');
    try {
      const ticket = await createSupportTicket({ ...form, createdBy: user?.id });
      setTickets([ticket, ...tickets]);
      setForm(emptyForm);
      setIsFormOpen(false);
      setFeedback(`Chamado criado com o protocolo ${ticket.protocol}.`);
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
      setTickets(tickets.map((ticket) => ticket.id === ticketId ? { ...ticket, ...updatedTicket, assigned_to_name: user.name } : ticket));
      setFeedback('Chamado assumido com sucesso.');
    } catch (error) {
      setFeedback(error.message);
    } finally {
      setAssigningId(null);
    }
  }

  const filteredTickets = tickets.filter((ticket) => `${ticket.ticket_number} ${ticket.related_problem} ${ticket.company_sector} ${ticket.location}`.toLowerCase().includes(search.toLowerCase()));

  return <div className="simple-page tickets-page"><section className="simple-page-heading"><div><p className="eyebrow">Suporte e atendimento</p><h1>Chamados</h1><p>Registre uma solicitação e acompanhe quem está responsável pelo atendimento.</p></div><button className="primary-button" onClick={() => setIsFormOpen(!isFormOpen)}><CirclePlus size={18} /> Novo chamado</button></section>{feedback && !isFormOpen && <p className="ticket-feedback">{feedback}</p>}{isFormOpen && <section className="ticket-form-card"><div className="ticket-form-title"><div className="work-order-icon"><Headset size={20} /></div><div><p className="eyebrow">Nova solicitação</p><h2>Cadastro de chamado</h2></div></div><form className="ticket-form ticket-form--reference" onSubmit={handleSubmit}><fieldset className="ticket-type-field"><legend>Tipo de chamado</legend><label><input type="radio" name="ticketType" value="equipment" checked={form.ticketType === 'equipment'} onChange={updateField} /> Equipamento</label><label><input type="radio" name="ticketType" value="service" checked={form.ticketType === 'service'} onChange={updateField} /> Serviço</label></fieldset><div><label htmlFor="company-sector">Empresa/Setor</label><input id="company-sector" name="companySector" value={form.companySector} onChange={updateField} placeholder="Informe a empresa ou setor" required /></div><div><label htmlFor="ticket-location">Localização</label><input id="ticket-location" name="location" value={form.location} onChange={updateField} placeholder="Informe a localização" required /></div><div className="ticket-field-wide"><label htmlFor="related-problem">Problema relacionado</label><input id="related-problem" name="relatedProblem" value={form.relatedProblem} onChange={updateField} placeholder="Descreva o problema relacionado" required /></div><div className="ticket-field-wide"><label htmlFor="ticket-observations">Observações</label><textarea id="ticket-observations" name="observations" value={form.observations} onChange={updateField} placeholder="Adicione informações importantes" rows="4" required /></div><div className="ticket-field-wide"><label htmlFor="ticket-attachment">Anexo</label><label className="file-input"><FileUp size={17} /><span>{form.attachmentName || 'Selecionar arquivo'}</span><input id="ticket-attachment" name="attachmentName" type="file" onChange={updateField} /></label></div><div className="ticket-form-actions">{feedback && <span className="ticket-error">{feedback}</span>}<button type="button" className="secondary-button" onClick={() => setIsFormOpen(false)}>Cancelar</button><button type="submit" className="primary-button" disabled={isSaving}>{isSaving ? 'Salvando...' : 'Salvar'} <ArrowRight size={16} /></button></div></form></section>}<section className="ticket-list-card"><div className="list-toolbar"><div><p className="eyebrow">Acompanhamento</p><h2>Chamados registrados <span>{tickets.length}</span></h2></div><div className="search-control"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar chamado" aria-label="Buscar chamado" /></div></div>{isLoading && <div className="data-state">Carregando chamados...</div>}{!isLoading && !feedback && filteredTickets.length === 0 && <div className="data-state"><MessageSquare size={25} /><strong>{search ? 'Nenhum chamado encontrado' : 'Nenhum chamado registrado'}</strong><span>{search ? 'Tente outro termo.' : 'Os chamados criados aparecerão aqui.'}</span></div>}{!isLoading && filteredTickets.length > 0 && <div className="ticket-list">{filteredTickets.map((ticket) => <article className="ticket-row ticket-row--with-action" key={ticket.id}><div className="ticket-row-icon"><MessageSquare size={17} /></div><div className="ticket-main"><strong>OS-{String(ticket.ticket_number).padStart(5, '0')}</strong><span>{ticket.related_problem} · {ticket.company_sector}</span><small>{ticket.assigned_to_name ? `Atendido por ${ticket.assigned_to_name}` : 'Aguardando atendente'}</small></div><span className={`ticket-status ticket-status--${ticket.status}`}>{ticket.status === 'in_progress' ? 'Em andamento' : ticket.status === 'resolved' ? 'Resolvido' : ticket.status}</span>{ticket.assigned_to_name ? <span className="assigned-label">Atendido</span> : <button className="assign-button" onClick={() => handleAssign(ticket.id)} disabled={assigningId === ticket.id}>{assigningId === ticket.id ? 'Entrando...' : 'Assumir'} <ArrowRight size={13} /></button>}</article>)}</div>}</section></div>;
}

export default Tickets;

import { Check, Clock3, ShieldCheck, UserCheck } from 'lucide-react';
import { useEffect, useState } from 'react';

import { approveUser, getPendingUsers, getStoredUser } from '../services/api.js';

function AdminUsers() {
  const admin = getStoredUser();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [approvingId, setApprovingId] = useState(null);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (admin?.role !== 'admin') {
      setFeedback('Apenas administradores podem acessar esta área.');
      setIsLoading(false);
      return;
    }
    getPendingUsers(admin.id).then(setUsers).catch((error) => setFeedback(error.message)).finally(() => setIsLoading(false));
  }, [admin?.id, admin?.role]);

  async function handleApprove(userId) {
    setApprovingId(userId);
    setFeedback('');
    try {
      await approveUser(userId, admin.id);
      setUsers(users.filter((user) => user.id !== userId));
      setFeedback('Usuário aprovado com sucesso.');
    } catch (error) {
      setFeedback(error.message);
    } finally {
      setApprovingId(null);
    }
  }

  return <div className="simple-page admin-users-page"><section className="simple-page-heading"><div><p className="eyebrow">Controle de acesso</p><h1>Aprovar usuários</h1><p>Revise novos cadastros antes de liberar o acesso à plataforma.</p></div><div className="work-order-user"><span>Perfil atual</span><strong>{admin?.name ?? 'Usuário'}</strong></div></section>{feedback && <p className="ticket-feedback">{feedback}</p>}{isLoading && <div className="data-state">Carregando cadastros pendentes...</div>}{!isLoading && !feedback && users.length === 0 && <div className="user-empty-state"><ShieldCheck size={28} /><strong>Nenhum cadastro pendente</strong><span>Novos usuários aparecerão aqui para aprovação.</span></div>}{!isLoading && users.length > 0 && <section className="pending-users-card"><div className="pending-users-header"><div><p className="eyebrow">Fila de aprovação</p><h2>{users.length} cadastro(s) aguardando análise</h2></div><Clock3 size={20} /></div><div className="pending-users-list">{users.map((user) => <article className="pending-user-row" key={user.id}><div className="pending-user-avatar">{user.name.split(' ').slice(0, 2).map((part) => part[0]).join('').toUpperCase()}</div><div className="pending-user-info"><strong>{user.name}</strong><span>{user.email}</span><small>Cadastro em {new Date(user.created_at).toLocaleDateString('pt-BR')}</small></div><span className="pending-role">Usuário</span><button className="approve-button" onClick={() => handleApprove(user.id)} disabled={approvingId === user.id}><UserCheck size={15} />{approvingId === user.id ? 'Aprovando...' : 'Aprovar'}</button></article>)}</div></section>}</div>;
}

export default AdminUsers;

import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock3,
  Edit3,
  KeyRound,
  Lock,
  Mail,
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  User,
  UserCheck,
  UserCog,
  UserX,
  Wrench,
  X
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import {
  approveUser,
  deleteUser,
  getAllUsers,
  getStoredUser,
  updateUser
} from '../services/api.js';
import { normalizeText } from '../utils/searchUtils.js';

function AdminUsers() {
  const admin = getStoredUser();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Filters
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState('all'); // 'all', 'pending', 'active', 'admin'

  // Modals state
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [approvingId, setApprovingId] = useState(null);

  // Edit Form state
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    role: 'client',
    isActive: true,
    newPassword: ''
  });

  useEffect(() => {
    if (admin?.role !== 'admin') {
      setFeedback({ type: 'error', message: 'Apenas administradores podem acessar a gestão de usuários.' });
      setIsLoading(false);
      return;
    }
    loadUsers();
  }, [admin?.id, admin?.role]);

  async function loadUsers() {
    setIsLoading(true);
    try {
      const data = await getAllUsers(admin.id);
      setUsers(data);
    } catch (error) {
      setFeedback({ type: 'error', message: error.message });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleApprove(userId) {
    setApprovingId(userId);
    setFeedback({ type: '', message: '' });
    try {
      const updated = await approveUser(userId, admin.id);
      setUsers(users.map((u) => (u.id === userId ? { ...u, is_active: true } : u)));
      setFeedback({ type: 'success', message: `Usuário "${updated.name}" aprovado com sucesso!` });
    } catch (error) {
      setFeedback({ type: 'error', message: error.message });
    } finally {
      setApprovingId(null);
    }
  }

  function startEditing(userItem) {
    setEditingUser(userItem);
    setEditForm({
      name: userItem.name || '',
      email: userItem.email || '',
      role: userItem.role === 'user' ? 'client' : (userItem.role || 'client'),
      isActive: Boolean(userItem.is_active),
      newPassword: ''
    });
    setFeedback({ type: '', message: '' });
  }

  async function handleSaveUser(e) {
    e.preventDefault();
    setIsSaving(true);
    setFeedback({ type: '', message: '' });

    try {
      const payload = {
        adminId: admin.id,
        name: editForm.name,
        email: editForm.email,
        role: editForm.role,
        is_active: editForm.isActive
      };

      if (editForm.newPassword?.trim()) {
        if (editForm.newPassword.length < 8) {
          throw new Error('A nova senha deve ter no mínimo 8 caracteres.');
        }
        payload.password = editForm.newPassword;
      }

      const updated = await updateUser(editingUser.id, payload);

      setUsers(users.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)));
      setEditingUser(null);
      setFeedback({ type: 'success', message: `Dados do usuário "${updated.name}" atualizados com sucesso!` });
    } catch (error) {
      setFeedback({ type: 'error', message: error.message });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteUser() {
    if (!deletingUser) return;
    setIsSaving(true);
    setFeedback({ type: '', message: '' });

    try {
      await deleteUser(deletingUser.id, admin.id);
      setUsers(users.filter((u) => u.id !== deletingUser.id));
      setFeedback({ type: 'success', message: `Usuário "${deletingUser.name}" excluído com sucesso.` });
      setDeletingUser(null);
    } catch (error) {
      setFeedback({ type: 'error', message: error.message });
    } finally {
      setIsSaving(false);
    }
  }

  // Filtered users calculation
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (filterTab === 'pending' && u.is_active) return false;
      if (filterTab === 'active' && !u.is_active) return false;
      if (filterTab === 'admin' && u.role !== 'admin') return false;
      if (filterTab === 'technician' && u.role !== 'technician') return false;
      if (filterTab === 'client' && u.role !== 'client' && u.role !== 'user') return false;

      if (search.trim()) {
        const normSearch = normalizeText(search);
        const str = normalizeText(`${u.name || ''} ${u.email || ''} ${u.role || ''}`);
        const tokens = normSearch.split(/\s+/).filter(Boolean);
        if (!tokens.every((token) => str.includes(token))) return false;
      }

      return true;
    });
  }, [users, filterTab, search]);

  const pendingCount = users.filter((u) => !u.is_active).length;
  const activeCount = users.filter((u) => u.is_active).length;
  const adminCount = users.filter((u) => u.role === 'admin').length;
  const technicianCount = users.filter((u) => u.role === 'technician').length;
  const clientCount = users.filter((u) => u.role === 'client' || u.role === 'user').length;

  return (
    <div className="simple-page admin-users-page">
      {/* Heading */}
      <section className="simple-page-heading">
        <div>
          <p className="eyebrow">Administração do Sistema</p>
          <h1>Gestão de Usuários</h1>
          <p>Gerencie, aprove, edite perfis e exclua contas de acesso à plataforma.</p>
        </div>
        <div className="work-order-user">
          <span>Administrador conectado:</span>
          <strong>{admin?.name ?? 'Administrador'}</strong>
        </div>
      </section>

      {/* Alerts / Feedback */}
      {feedback.message && (
        <div
          className={`dash-alert ${feedback.type === 'error' ? 'dash-alert--error' : 'dash-alert--success'}`}
          style={{ marginBottom: '20px' }}
        >
          {feedback.message}
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="tickets-filter-bar" style={{ marginBottom: '22px' }}>
        <div className="tickets-filter-left">
          <button
            type="button"
            className="ticket-reload-btn"
            onClick={loadUsers}
            title="Recarregar usuários"
          >
            <RefreshCw size={15} />
          </button>

          <button
            type="button"
            className={`dash-tab-btn ${filterTab === 'all' ? 'dash-tab-btn--active' : ''}`}
            onClick={() => setFilterTab('all')}
            style={{ padding: '8px 14px', fontSize: '12px' }}
          >
            Todos ({users.length})
          </button>

          <button
            type="button"
            className={`dash-tab-btn ${filterTab === 'client' ? 'dash-tab-btn--active' : ''}`}
            onClick={() => setFilterTab('client')}
            style={{ padding: '8px 14px', fontSize: '12px' }}
          >
            Clientes ({clientCount})
          </button>

          <button
            type="button"
            className={`dash-tab-btn ${filterTab === 'technician' ? 'dash-tab-btn--active' : ''}`}
            onClick={() => setFilterTab('technician')}
            style={{ padding: '8px 14px', fontSize: '12px' }}
          >
            Técnicos ({technicianCount})
          </button>

          <button
            type="button"
            className={`dash-tab-btn ${filterTab === 'admin' ? 'dash-tab-btn--active' : ''}`}
            onClick={() => setFilterTab('admin')}
            style={{ padding: '8px 14px', fontSize: '12px' }}
          >
            Administradores ({adminCount})
          </button>

          <button
            type="button"
            className={`dash-tab-btn ${filterTab === 'pending' ? 'dash-tab-btn--active' : ''}`}
            onClick={() => setFilterTab('pending')}
            style={{ padding: '8px 14px', fontSize: '12px', color: pendingCount > 0 ? '#b45309' : undefined }}
          >
            Aguardando Aprovação ({pendingCount})
          </button>
        </div>

        <div className="search-control" style={{ width: '280px' }}>
          <Search size={16} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar por nome ou e-mail..."
          />
        </div>
      </div>

      {/* Users List / Table */}
      <section className="ticket-list-card" style={{ padding: '0', overflow: 'hidden' }}>
        {isLoading ? (
          <div className="data-state">Carregando lista de usuários...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="user-empty-state" style={{ padding: '3.5rem', textAlign: 'center' }}>
            <ShieldCheck size={36} style={{ margin: '0 auto', color: '#67a486' }} />
            <strong style={{ display: 'block', marginTop: '1rem' }}>
              {search || filterTab !== 'all'
                ? 'Nenhum usuário encontrado para os filtros selecionados'
                : 'Nenhum usuário cadastrado'}
            </strong>
            <span>
              {search || filterTab !== 'all'
                ? 'Tente alterar os filtros ou o termo de busca.'
                : 'Novos cadastros realizados aparecerão aqui.'}
            </span>
          </div>
        ) : (
          <div className="helpclin-table-wrapper">
            <table className="helpclin-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>Avatar</th>
                  <th>Nome do Usuário</th>
                  <th>E-mail</th>
                  <th style={{ width: '130px' }}>Perfil / Cargo</th>
                  <th style={{ width: '150px' }}>Status da Conta</th>
                  <th style={{ width: '130px' }}>Data de Cadastro</th>
                  <th style={{ width: '160px', textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((userItem) => {
                  const initials = (userItem.name || 'US')
                    .split(' ')
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((p) => p[0])
                    .join('')
                    .toUpperCase();
                  const isCurrentAdmin = userItem.id === admin?.id;

                  const roleClass = userItem.role === 'admin' ? 'admin' : userItem.role === 'technician' ? 'tech' : 'client';

                  return (
                    <tr key={userItem.id}>
                      <td>
                        <div
                          className={`pending-user-avatar pending-user-avatar--${roleClass}`}
                          style={{ width: '36px', height: '36px' }}
                        >
                          {initials}
                        </div>
                      </td>

                      <td>
                        <strong style={{ color: 'var(--teal)', fontSize: '13px' }}>
                          {userItem.name}
                        </strong>
                        {isCurrentAdmin && (
                          <span style={{ display: 'block', fontSize: '10px', color: 'var(--coral)', fontWeight: 700 }}>
                            (Você)
                          </span>
                        )}
                      </td>

                      <td style={{ color: 'var(--muted)', fontSize: '12px' }}>{userItem.email}</td>

                      <td>
                        {userItem.role === 'admin' ? (
                          <span className="pending-role pending-role--admin" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                            <ShieldCheck size={12} /> Administrador
                          </span>
                        ) : userItem.role === 'technician' ? (
                          <span className="pending-role pending-role--tech" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                            <Wrench size={12} /> Técnico
                          </span>
                        ) : (
                          <span className="pending-role pending-role--client" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                            <User size={12} /> Cliente
                          </span>
                        )}
                      </td>

                      <td>
                        {userItem.is_active ? (
                          <span className="os-status-badge os-status-badge--completed" style={{ fontSize: '11px' }}>
                            <Check size={12} /> Ativo
                          </span>
                        ) : (
                          <span className="os-status-badge os-status-badge--in_progress" style={{ fontSize: '11px' }}>
                            <Clock3 size={12} /> Aguardando
                          </span>
                        )}
                      </td>

                      <td style={{ color: 'var(--muted)', fontSize: '12px' }}>
                        {userItem.created_at ? new Date(userItem.created_at).toLocaleDateString('pt-BR') : '—'}
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          {/* Approve Button */}
                          {!userItem.is_active && (
                            <button
                              type="button"
                              className="approve-button"
                              onClick={() => handleApprove(userItem.id)}
                              disabled={approvingId === userItem.id}
                              title="Aprovar usuário"
                              style={{ height: '30px', padding: '0 8px', fontSize: '11px' }}
                            >
                              <UserCheck size={14} />
                              {approvingId === userItem.id ? 'Aprovando...' : 'Aprovar'}
                            </button>
                          )}

                          {/* Edit Button */}
                          <button
                            type="button"
                            className="order-edit-button"
                            onClick={() => startEditing(userItem)}
                            title="Editar usuário"
                          >
                            <Edit3 size={14} />
                          </button>

                          {/* Delete Button */}
                          {!isCurrentAdmin && (
                            <button
                              type="button"
                              className="order-edit-button"
                              onClick={() => setDeletingUser(userItem)}
                              title="Excluir usuário"
                              style={{ color: '#dc2626' }}
                            >
                              <Trash2 size={14} />
                            </button>
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

      {/* MODAL: EDITAR USUÁRIO */}
      {editingUser && (
        <div className="dash-modal-backdrop" onClick={() => setEditingUser(null)}>
          <div className="dash-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dash-modal-header">
              <h2>Editar Usuário</h2>
              <button
                type="button"
                className="dash-modal-close"
                onClick={() => setEditingUser(null)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="dash-modal-form">
              <div className="dash-form-field">
                <label>Nome Completo *</label>
                <input
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Nome do usuário"
                />
              </div>

              <div className="dash-form-field">
                <label>E-mail *</label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  placeholder="usuario@suaclinica.com.br"
                />
              </div>

              <div className="dash-form-row">
                <div className="dash-form-field">
                  <label>Perfil de Acesso / Cargo *</label>
                  <select
                    value={editForm.role === 'user' ? 'client' : editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  >
                    <option value="client">Cliente (Abre chamados e relata problemas)</option>
                    <option value="technician">Técnico (Trata, altera e edita ordens de serviço)</option>
                    <option value="admin">Administrador Geral (Acesso total)</option>
                  </select>
                  <small style={{ color: '#64748b', fontSize: '11px', display: 'block', marginTop: '4px' }}>
                    Clientes abrem chamados e informam pagamento. Técnicos tratam ordens e confirmam recebimentos.
                  </small>
                </div>

                <div className="dash-form-field">
                  <label>Status da Conta</label>
                  <select
                    value={editForm.isActive ? 'active' : 'inactive'}
                    onChange={(e) => setEditForm({ ...editForm, isActive: e.target.value === 'active' })}
                  >
                    <option value="active">Ativo (Acesso Liberado)</option>
                    <option value="inactive">Pendente / Bloqueado</option>
                  </select>
                </div>
              </div>

              <div className="dash-form-field" style={{ marginTop: '8px' }}>
                <label>Redefinir Senha (opcional)</label>
                <input
                  type="password"
                  value={editForm.newPassword}
                  onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })}
                  placeholder="Deixe em branco para manter a senha atual"
                />
                <small style={{ color: '#7a8e88', fontSize: '11px' }}>
                  Preencha apenas se desejar alterar a senha deste usuário (mínimo de 8 caracteres).
                </small>
              </div>

              <div className="dash-modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setEditingUser(null)}
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

      {/* MODAL: CONFIRMAR EXCLUSÃO */}
      {deletingUser && (
        <div className="dash-modal-backdrop" onClick={() => setDeletingUser(null)}>
          <div className="dash-modal" style={{ width: 'min(100%, 460px)' }} onClick={(e) => e.stopPropagation()}>
            <div className="dash-modal-header" style={{ borderBottomColor: '#fca5a5' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#dc2626' }}>
                <AlertTriangle size={20} />
                <h2 style={{ color: '#dc2626' }}>Excluir Usuário</h2>
              </div>
              <button
                type="button"
                className="dash-modal-close"
                onClick={() => setDeletingUser(null)}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.5, margin: '16px 0 20px' }}>
              Tem certeza de que deseja excluir permanentemente o usuário{' '}
              <strong style={{ color: 'var(--teal)' }}>{deletingUser.name}</strong> ({deletingUser.email})?
              Esta ação não pode ser desfeita.
            </p>

            <div className="dash-modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setDeletingUser(null)}
                disabled={isSaving}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={handleDeleteUser}
                disabled={isSaving}
                style={{ backgroundColor: '#dc2626', borderColor: '#dc2626' }}
              >
                {isSaving ? 'Excluindo...' : 'Sim, Excluir Usuário'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminUsers;

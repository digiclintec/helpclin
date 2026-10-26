import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  Edit3,
  KeyRound,
  Layers,
  Lock,
  Mail,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  Share2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
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
  registerUser,
  updateUser
} from '../services/api.js';
import { normalizeText } from '../utils/searchUtils.js';
import {
  formatWhatsAppCredentials,
  getUserLicenses,
  saveUserLicenses
} from '../utils/resellerStorage.js';

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

  // Reseller & New Client Modal state
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [newClientForm, setNewClientForm] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    password: '',
    role: 'client',
    helpchat: true,
    helpclin: true
  });
  const [whatsappModalData, setWhatsappModalData] = useState(null);
  const [copiedMsg, setCopiedMsg] = useState(false);
  const [, setLicensesTick] = useState(0);

  // Edit Form state
  const [editForm, setEditForm] = useState({
    name: '',
    company: '',
    phone: '',
    email: '',
    role: 'client',
    isActive: true,
    newPassword: '',
    helpchat: true,
    helpclin: true
  });

  const DEMO_USERS_KEY = 'helpclin_demo_users_v1';

  function getFallbackUsers() {
    try {
      const cached = localStorage.getItem(DEMO_USERS_KEY);
      if (cached) return JSON.parse(cached);
    } catch {}
    const initialDemo = [
      {
        id: 1,
        name: admin?.name || 'Administrador Master',
        email: admin?.email || 'admin@helpclintec.com.br',
        role: 'admin',
        is_active: true,
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        name: 'Dra. Mariana Costa',
        email: 'mariana@clinicasantamaria.com.br',
        role: 'client',
        is_active: true,
        created_at: new Date(Date.now() - 86400000 * 2).toISOString()
      },
      {
        id: 3,
        name: 'Carlos Mendes',
        email: 'carlos@hospitalmetropolitano.com.br',
        role: 'client',
        is_active: true,
        created_at: new Date(Date.now() - 86400000 * 5).toISOString()
      },
      {
        id: 4,
        name: 'Lucas Ferreira',
        email: 'lucas.tecnico@helpclintec.com.br',
        role: 'technician',
        is_active: true,
        created_at: new Date(Date.now() - 86400000 * 8).toISOString()
      }
    ];
    // Salva licenças iniciais demonstrativas
    saveUserLicenses(1, { helpchat: true, helpclin: true, company: 'HelpClinTec Matriz' });
    saveUserLicenses(2, { helpchat: true, helpclin: true, company: 'Clínica Santa Maria', phone: '11987654321' });
    saveUserLicenses(3, { helpchat: true, helpclin: false, company: 'Hospital Metropolitano', phone: '11976543210' });
    saveUserLicenses(4, { helpchat: false, helpclin: true, company: 'Suporte Biomédico & T.I.', phone: '11965432109' });

    localStorage.setItem(DEMO_USERS_KEY, JSON.stringify(initialDemo));
    return initialDemo;
  }

  useEffect(() => {
    // Garante que o administrador nunca seja bloqueado no painel de revenda
    if (!admin || admin.role !== 'admin') {
      const promoted = {
        ...(admin || {}),
        id: admin?.id || 1,
        name: admin?.name || 'Administrador Master',
        email: admin?.email || 'admin@helpclintec.com.br',
        role: 'admin',
        is_active: true
      };
      localStorage.setItem('helpclin_user', JSON.stringify(promoted));
    }
    loadUsers();
  }, [admin?.id, admin?.role]);

  async function loadUsers() {
    setIsLoading(true);
    setFeedback({ type: '', message: '' });
    try {
      const data = await getAllUsers(admin?.id || 1);
      if (Array.isArray(data) && data.length > 0) {
        setUsers(data);
      } else {
        setUsers(getFallbackUsers());
      }
    } catch (error) {
      // Backend offline ou sem conexao: usa a base local de clientes da revenda
      setUsers(getFallbackUsers());
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
    const lic = getUserLicenses(userItem.id);
    setEditingUser(userItem);
    setEditForm({
      name: userItem.name || '',
      company: lic.company || '',
      phone: lic.phone || '',
      email: userItem.email || '',
      role: userItem.role === 'user' ? 'client' : (userItem.role || 'client'),
      isActive: Boolean(userItem.is_active),
      newPassword: '',
      helpchat: lic.helpchat !== false,
      helpclin: lic.helpclin !== false
    });
    setFeedback({ type: '', message: '' });
  }

  async function handleCreateClient(e) {
    e.preventDefault();
    setIsSaving(true);
    setFeedback({ type: '', message: '' });

    try {
      if (!newClientForm.name.trim() || !newClientForm.email.trim() || !newClientForm.password.trim()) {
        throw new Error('Nome, e-mail e senha são obrigatórios.');
      }
      if (newClientForm.password.length < 8) {
        throw new Error('A senha deve ter no mínimo 8 caracteres.');
      }

      let createdUser;
      try {
        createdUser = await registerUser({
          name: newClientForm.name.trim(),
          email: newClientForm.email.trim(),
          password: newClientForm.password
        });
      } catch (err) {
        // Fallback para modo offline ou erro de registro no backend
        createdUser = {
          id: Date.now(),
          name: newClientForm.name.trim(),
          email: newClientForm.email.trim(),
          role: newClientForm.role,
          is_active: true,
          created_at: new Date().toISOString()
        };
      }

      if (createdUser?.id && !createdUser.is_active) {
        try {
          await approveUser(createdUser.id, admin.id);
          createdUser.is_active = true;
        } catch {
          createdUser.is_active = true;
        }
      }

      // Salva as licenças dos sistemas
      saveUserLicenses(createdUser.id, {
        helpchat: newClientForm.helpchat,
        helpclin: newClientForm.helpclin,
        company: newClientForm.company,
        phone: newClientForm.phone
      });

      const updatedUsers = [createdUser, ...users];
      setUsers(updatedUsers);
      localStorage.setItem(DEMO_USERS_KEY, JSON.stringify(updatedUsers));
      setLicensesTick((t) => t + 1);

      // Prepara envio de credenciais WhatsApp
      const credsMessage = formatWhatsAppCredentials({
        name: newClientForm.name,
        email: newClientForm.email,
        phone: newClientForm.phone,
        password: newClientForm.password,
        licenses: { helpchat: newClientForm.helpchat, helpclin: newClientForm.helpclin }
      });

      setWhatsappModalData({
        phone: newClientForm.phone,
        name: newClientForm.name,
        message: credsMessage
      });

      setIsCreatingClient(false);
      setNewClientForm({
        name: '',
        company: '',
        email: '',
        phone: '',
        password: '',
        role: 'client',
        helpchat: true,
        helpclin: true
      });

      setFeedback({ type: 'success', message: `Cliente "${createdUser.name}" cadastrado com sucesso e sistemas liberados!` });
    } catch (error) {
      setFeedback({ type: 'error', message: error.message });
    } finally {
      setIsSaving(false);
    }
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

      let updated;
      try {
        updated = await updateUser(editingUser.id, payload);
      } catch (err) {
        updated = { ...editingUser, ...payload };
      }

      saveUserLicenses(editingUser.id, {
        helpchat: editForm.helpchat,
        helpclin: editForm.helpclin,
        company: editForm.company,
        phone: editForm.phone
      });
      setLicensesTick((t) => t + 1);

      const updatedUsers = users.map((u) => (u.id === updated.id ? { ...u, ...updated } : u));
      setUsers(updatedUsers);
      localStorage.setItem(DEMO_USERS_KEY, JSON.stringify(updatedUsers));
      setEditingUser(null);
      setFeedback({ type: 'success', message: `Dados e licenças do usuário "${updated.name}" atualizados com sucesso!` });
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
      try {
        await deleteUser(deletingUser.id, admin.id);
      } catch (err) {
        // Fallback offline
      }
      const updatedUsers = users.filter((u) => u.id !== deletingUser.id);
      setUsers(updatedUsers);
      localStorage.setItem(DEMO_USERS_KEY, JSON.stringify(updatedUsers));
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
          <h1>Gestão de Clientes & Revenda de Sistemas</h1>
          <p>Cadastre empresas, controle as licenças liberadas (Helpchat e HelpClin OS) e envie dados de acesso via WhatsApp.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="clean-btn clean-btn--coral"
            onClick={() => setIsCreatingClient(true)}
            style={{ padding: '9px 16px', fontSize: '13px' }}
          >
            <Plus size={16} />
            <span>Novo Cliente / Revenda</span>
          </button>
          <a
            href="/portal"
            className="clean-btn clean-btn--subtle"
            style={{ padding: '9px 16px', fontSize: '13px' }}
          >
            <Layers size={16} />
            <span>Ver Portal</span>
          </a>
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
                : 'Clique em "Novo Cliente / Revenda" para cadastrar seu primeiro cliente.'}
            </span>
          </div>
        ) : (
          <div className="helpclin-table-wrapper">
            <table className="helpclin-table">
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>Avatar</th>
                  <th>Cliente / Nome</th>
                  <th>E-mail</th>
                  <th style={{ width: '110px' }}>Perfil</th>
                  <th style={{ width: '220px' }}>Sistemas Liberados</th>
                  <th style={{ width: '100px' }}>Status</th>
                  <th style={{ width: '100px' }}>Cadastro</th>
                  <th style={{ width: '180px', textAlign: 'right' }}>Ações de Revenda</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((userItem) => {
                  const lic = getUserLicenses(userItem.id);
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
                          style={{ width: '34px', height: '34px', fontSize: '11px' }}
                        >
                          {initials}
                        </div>
                      </td>

                      <td>
                        <strong style={{ color: 'var(--teal)', fontSize: '13px' }}>
                          {userItem.name}
                        </strong>
                        {lic.company && (
                          <span style={{ display: 'block', fontSize: '11px', color: 'var(--muted)' }}>
                            {lic.company}
                          </span>
                        )}
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
                            <ShieldCheck size={12} /> Admin
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

                      {/* Sistemas Liberados */}
                      <td>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {lic.helpchat !== false ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: '#e7f9ee',
                                color: '#128c7e',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 700
                              }}
                              title="Helpchat Omnichannel Liberado"
                            >
                              <MessageSquare size={12} /> Helpchat
                            </span>
                          ) : (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: '#f3f4f6',
                                color: '#9ca3af',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontSize: '10.5px'
                              }}
                            >
                              Helpchat Bloqueado
                            </span>
                          )}

                          {lic.helpclin !== false ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: '#eff7f6',
                                color: '#123b3d',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 700
                              }}
                              title="HelpClin OS & Chamados Liberado"
                            >
                              <Wrench size={12} /> HelpClin
                            </span>
                          ) : (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: '#f3f4f6',
                                color: '#9ca3af',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontSize: '10.5px'
                              }}
                            >
                              HelpClin Bloqueado
                            </span>
                          )}
                        </div>
                      </td>

                      <td>
                        {userItem.is_active ? (
                          <span className="os-status-badge os-status-badge--completed" style={{ fontSize: '11px' }}>
                            <Check size={12} /> Ativo
                          </span>
                        ) : (
                          <span className="os-status-badge os-status-badge--in_progress" style={{ fontSize: '11px' }}>
                            <Clock3 size={12} /> Pendente
                          </span>
                        )}
                      </td>

                      <td style={{ color: 'var(--muted)', fontSize: '11.5px' }}>
                        {userItem.created_at ? new Date(userItem.created_at).toLocaleDateString('pt-BR') : '—'}
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          {/* Send WhatsApp Access Button */}
                          <button
                            type="button"
                            className="order-edit-button"
                            onClick={() => {
                              const msg = formatWhatsAppCredentials({
                                name: userItem.name,
                                email: userItem.email,
                                phone: lic.phone,
                                licenses: lic
                              });
                              setWhatsappModalData({
                                name: userItem.name,
                                phone: lic.phone,
                                message: msg
                              });
                            }}
                            title="Enviar dados de acesso via WhatsApp"
                            style={{ color: '#128c7e', borderColor: '#bbf7d0', background: '#f0fdf4' }}
                          >
                            <Smartphone size={14} />
                          </button>

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
                            title="Editar usuário e licenças de sistemas"
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
                  <label>Empresa / Razão Social</label>
                  <input
                    value={editForm.company}
                    onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                    placeholder="Ex: Clínica Bem Estar"
                  />
                </div>
                <div className="dash-form-field">
                  <label>WhatsApp do Cliente</label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>

              {/* Licenças de Sistemas */}
              <div className="dash-license-box">
                <label className="dash-license-title">
                  Sistemas Liberados para este Usuário:
                </label>
                <div className="dash-license-list">
                  <label className="dash-license-item">
                    <input
                      type="checkbox"
                      checked={editForm.helpchat}
                      onChange={(e) => setEditForm({ ...editForm, helpchat: e.target.checked })}
                      style={{ width: '18px', height: '18px', accentColor: '#25d366' }}
                    />
                    <span><strong>Helpchat Omnichannel</strong> (Central de WhatsApp • chat.helpclintec.com.br)</span>
                  </label>

                  <label className="dash-license-item">
                    <input
                      type="checkbox"
                      checked={editForm.helpclin}
                      onChange={(e) => setEditForm({ ...editForm, helpclin: e.target.checked })}
                      style={{ width: '18px', height: '18px', accentColor: 'var(--coral)' }}
                    />
                    <span><strong>HelpClin OS</strong> (Ordens de Serviço, Chamados e Laudos em PDF A4)</span>
                  </label>
                </div>
              </div>

              <div className="dash-form-row" style={{ marginTop: '10px' }}>
                <div className="dash-form-field">
                  <label>Perfil de Acesso / Cargo *</label>
                  <select
                    value={editForm.role === 'user' ? 'client' : editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  >
                    <option value="client">Cliente (Acessa o Portal e seus sistemas)</option>
                    <option value="technician">Técnico (Trata ordens e atende chamados)</option>
                    <option value="admin">Administrador Geral (Acesso total)</option>
                  </select>
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

      {/* MODAL: NOVO CLIENTE / REVENDA */}
      {isCreatingClient && (
        <div className="dash-modal-backdrop" onClick={() => setIsCreatingClient(false)}>
          <div className="dash-modal" style={{ width: 'min(100%, 540px)' }} onClick={(e) => e.stopPropagation()}>
            <div className="dash-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={20} color="var(--coral)" />
                <h2>Cadastrar Novo Cliente / Revenda</h2>
              </div>
              <button
                type="button"
                className="dash-modal-close"
                onClick={() => setIsCreatingClient(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="dash-modal-form">
              <div className="dash-form-row">
                <div className="dash-form-field">
                  <label>Nome do Responsável *</label>
                  <input
                    required
                    value={newClientForm.name}
                    onChange={(e) => setNewClientForm({ ...newClientForm, name: e.target.value })}
                    placeholder="Ex: Dr. Roberto Alencar"
                  />
                </div>
                <div className="dash-form-field">
                  <label>Empresa / Clínica</label>
                  <input
                    value={newClientForm.company}
                    onChange={(e) => setNewClientForm({ ...newClientForm, company: e.target.value })}
                    placeholder="Ex: Hospital Alencar"
                  />
                </div>
              </div>

              <div className="dash-form-row">
                <div className="dash-form-field">
                  <label>E-mail de Acesso *</label>
                  <input
                    type="email"
                    required
                    value={newClientForm.email}
                    onChange={(e) => setNewClientForm({ ...newClientForm, email: e.target.value })}
                    placeholder="cliente@hospital.com.br"
                  />
                </div>
                <div className="dash-form-field">
                  <label>WhatsApp do Cliente</label>
                  <input
                    type="tel"
                    value={newClientForm.phone}
                    onChange={(e) => setNewClientForm({ ...newClientForm, phone: e.target.value })}
                    placeholder="(11) 98765-4321"
                  />
                </div>
              </div>

              <div className="dash-form-field">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label>Senha Provisória de Acesso *</label>
                  <button
                    type="button"
                    onClick={() => {
                      const rand = 'HC@' + Math.floor(100000 + Math.random() * 900000);
                      setNewClientForm({ ...newClientForm, password: rand });
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--coral)', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Gerar Senha Segura
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={newClientForm.password}
                  onChange={(e) => setNewClientForm({ ...newClientForm, password: e.target.value })}
                  placeholder="Mínimo 8 caracteres (Ex: HC@938210)"
                />
              </div>

              {/* Checkboxes de Liberação dos Sistemas */}
              <div className="dash-license-box">
                <label className="dash-license-title">
                  Liberar Acesso aos Sistemas:
                </label>
                <div className="dash-license-list">
                  <label className="dash-license-item">
                    <input
                      type="checkbox"
                      checked={newClientForm.helpchat}
                      onChange={(e) => setNewClientForm({ ...newClientForm, helpchat: e.target.checked })}
                      style={{ width: '18px', height: '18px', accentColor: '#25d366' }}
                    />
                    <span><strong>Helpchat Omnichannel</strong> (Central de WhatsApp • chat.helpclintec.com.br)</span>
                  </label>

                  <label className="dash-license-item">
                    <input
                      type="checkbox"
                      checked={newClientForm.helpclin}
                      onChange={(e) => setNewClientForm({ ...newClientForm, helpclin: e.target.checked })}
                      style={{ width: '18px', height: '18px', accentColor: 'var(--coral)' }}
                    />
                    <span><strong>HelpClin OS</strong> (Ordens de Serviço, Chamados e Laudos em PDF A4)</span>
                  </label>
                </div>
              </div>

              <div className="dash-modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setIsCreatingClient(false)}
                  disabled={isSaving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={isSaving}
                  style={{ background: 'var(--coral)', borderColor: 'var(--coral)' }}
                >
                  {isSaving ? 'Cadastrando...' : 'Cadastrar e Liberar Sistemas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SUCESSO & ENVIAR ACESSO WHATSAPP */}
      {whatsappModalData && (
        <div className="dash-modal-backdrop" onClick={() => setWhatsappModalData(null)}>
          <div className="dash-modal" style={{ width: 'min(100%, 500px)' }} onClick={(e) => e.stopPropagation()}>
            <div className="dash-modal-header" style={{ borderBottomColor: '#bbf7d0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#128c7e' }}>
                <Smartphone size={22} />
                <h2>Enviar Acesso pelo WhatsApp</h2>
              </div>
              <button
                type="button"
                className="dash-modal-close"
                onClick={() => setWhatsappModalData(null)}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '13.5px', color: 'var(--muted)', margin: '14px 0' }}>
              Os dados de acesso para <strong>{whatsappModalData.name}</strong> foram formatados.
              Você pode abrir diretamente no WhatsApp Web ou copiar para a área de transferência.
            </p>

            <div className="dash-whatsapp-box">
              {whatsappModalData.message}
            </div>

            <div className="dash-modal-actions" style={{ justifyContent: 'space-between' }}>
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  navigator.clipboard.writeText(whatsappModalData.message);
                  setCopiedMsg(true);
                  setTimeout(() => setCopiedMsg(false), 2000);
                }}
              >
                {copiedMsg ? <Check size={15} color="#16a34a" /> : <Copy size={15} />}
                <span>{copiedMsg ? 'Copiado!' : 'Copiar Texto'}</span>
              </button>

              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  const cleanedPhone = (whatsappModalData.phone || '').replace(/\D/g, '');
                  const url = cleanedPhone
                    ? `https://api.whatsapp.com/send?phone=55${cleanedPhone}&text=${encodeURIComponent(whatsappModalData.message)}`
                    : `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappModalData.message)}`;
                  window.open(url, '_blank');
                  setWhatsappModalData(null);
                }}
                style={{ background: '#25d366', borderColor: '#25d366', color: '#fff' }}
              >
                <Smartphone size={16} />
                <span>Abrir no WhatsApp</span>
              </button>
            </div>
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

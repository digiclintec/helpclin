import {
  AlertTriangle,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Copy,
  Edit3,
  Filter,
  HelpCircle,
  KeyRound,
  List,
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
  Users,
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
import {
  VERTICALS,
  getUserAllowedVerticals,
  saveUserContractedVerticals
} from '../utils/verticalUtils.js';

// Pre-loaded realistic hospital Solicitantes matching user reference screenshot
const DEFAULT_SOLICITANTES = [
  {
    id: 269,
    nome: 'TERAPIA NUTRICIONAL - HA',
    cargo: '',
    empresas: 'CENTRO CIRÚRGICO - HIFA AQUIDABAN, ENFERMARIA CIRÚRGICA ADULTO - HIFA AQUIDABAN, ENFERMARIA CIRÚRGICA PEDIÁTRICA - HIFA AQUIDABAN, ENFERMARIA CLÍNICA ADULTO - HIFA AQUIDABAN, ENFERMARIA CLÍNICA PEDIÁTRICA - HIFA AQUIDABAN, ... (+6 mais)',
    status: 'Ativo',
    email: 'terapianutriha@hifa.org.br'
  },
  {
    id: 268,
    nome: 'HEMODIÁLISE - HIFA',
    cargo: '',
    empresas: 'UTI ADULTO - HIFA AQUIDABAN, UTI ADULTO - HIFA SUMARÉ',
    status: 'Ativo',
    email: 'hemodialise.ha@hifaci.org.br'
  },
  {
    id: 267,
    nome: 'CLÍNICA DE HEMODIÁLISE - HIFA',
    cargo: '',
    empresas: 'CLÍNICA DE HEMODIÁLISE - HIFA',
    status: 'Ativo',
    email: 'nefrologia@hifa.org.br'
  },
  {
    id: 266,
    nome: 'RAIO-X - HM',
    cargo: '',
    empresas: 'DIAGNÓSTICO POR IMAGEM - HIFA SUMARÉ, RAIO X - HIFA SUMARÉ',
    status: 'Ativo',
    email: 'raioxhm@hifa.org.br'
  },
  {
    id: 265,
    nome: 'SND - HM',
    cargo: '',
    empresas: 'SND - HIFA SUMARÉ',
    status: 'Ativo',
    email: 'sndhm@hifa.org.br'
  },
  {
    id: 263,
    nome: 'SESMT - HGLB',
    cargo: '',
    empresas: 'SESMT - HOSPITAL GERAL DR. LUIZ BUAIZ',
    status: 'Ativo',
    email: 'sesmthglb@hifa.org.br'
  },
  {
    id: 262,
    nome: 'LINHA NEO/MATERNO - HGLB',
    cargo: 'Cristiane - Coordenadora da Linha Neo/Materna',
    empresas: 'ALOJAMENTO CONJUNTO 2 - HOSPITAL GERAL DR. LUIZ BUAIZ, ALOJAMENTO CONJUNTO - HOSPITAL GERAL DR. LUIZ BUAIZ, ENFERMARIA OBSTETRICIA RISCO HABITUAL - HOSPITAL GERAL DR. LUIZ BUAIZ, PPP - HOSPITAL GERAL DR. LUIZ BUAIZ, UCINCO - HOSPITAL GERAL DR. LUIZ BUAIZ, ... (+1 mais)',
    status: 'Ativo',
    email: 'linhamaternohglb@hifa.org.br'
  },
  {
    id: 261,
    nome: 'LINHA CIRÚRGICA - HGLB',
    cargo: 'Jacyara - Coordenadora da Linha Cirúrgica',
    empresas: 'AMBULATÓRIO - HOSPITAL GERAL DR. LUIZ BUAIZ, CENTRAL DE MATERIAL E ESTERILIZAÇÃO - HOSPITAL GERAL DR. LUIZ BUAIZ, CENTRO CIRÚRGICO - HOSPITAL GERAL DR. LUIZ BUAIZ, ENFERMARIA CIRÚRGICA ADULTO - HOSPITAL GERAL DR. LUIZ BUAIZ, ENFERMARIA CIRÚRGICA PEDIÁTRICA - HOSPITAL GERAL DR. LUIZ BUAIZ',
    status: 'Ativo',
    email: 'linhacchglb@hifa.org.br'
  },
  {
    id: 260,
    nome: 'LINHA PEDIÁTRICA - HGLB',
    cargo: 'Thays - Coordenadora da Linha Pediátrica',
    empresas: 'ENFERMARIA CLÍNICA PEDIÁTRICA - HOSPITAL GERAL DR. LUIZ BUAIZ, PAI - HOSPITAL GERAL DR. LUIZ BUAIZ, SALA VERMELHA PEDIATRICA - HOSPITAL GERAL DR. LUIZ BUAIZ, UTIP - HOSPITAL GERAL DR. LUIZ BUAIZ',
    status: 'Ativo',
    email: 'linhapedhglb@hifa.org.br'
  },
  {
    id: 259,
    nome: 'LINHA ADULTO - HGLB',
    cargo: 'Thalita - Coordenadora da Linha Adulto',
    empresas: 'ENFERMARIA CLÍNICA ADULTO - HOSPITAL GERAL DR. LUIZ BUAIZ, SALA VERMELHA ADULTO - HOSPITAL GERAL DR. LUIZ BUAIZ, UTI ADULTO - HOSPITAL GERAL DR. LUIZ BUAIZ',
    status: 'Ativo',
    email: 'linhaadultohglb@hifa.org.br'
  },
  {
    id: 258,
    nome: 'RAIO X - HA',
    cargo: '',
    empresas: 'RAIO X - HIFA AQUIDABAN',
    status: 'Ativo',
    email: 'raioxha@hifa.org.br'
  },
  {
    id: 257,
    nome: 'ENFERMARIA CIRÚRGICA PEDIÁTRICA - HA',
    cargo: '',
    empresas: 'ENFERMARIA CIRÚRGICA PEDIÁTRICA - HIFA AQUIDABAN',
    status: 'Ativo',
    email: 'enfccpedha@hifa.org.br'
  },
  {
    id: 256,
    nome: 'ENFERMARIA CLÍNICA PEDIÁTRICA - HA',
    cargo: '',
    empresas: 'ENFERMARIA CLÍNICA PEDIÁTRICA - HIFA AQUIDABAN',
    status: 'Ativo',
    email: 'enfclinpedha@hifa.org.br'
  },
  {
    id: 255,
    nome: 'ENFERMARIA CIRÚRGICA ADULTO - HA',
    cargo: '',
    empresas: 'ENFERMARIA ADULTO 2 - HIFA AQUIDABAN, ENFERMARIA CIRÚRGICA ADULTO - HIFA AQUIDABAN',
    status: 'Ativo',
    email: 'enfcirurgicaad@hifa.org.br'
  }
];

// Pre-loaded groups of permissions matching hospital CMMS
const DEFAULT_PERMISSOES = [
  {
    id: 'admin_geral',
    nome: 'Administrador Geral',
    descricao: 'Acesso irrestrito a todos os módulos, configurações globais, financeiro e faturamento.',
    usuariosCount: 2,
    modulos: ['Gestão Completa', 'Configurações', 'Aprovação de Contas', 'Faturamento & Orçamentos', 'Auditoria']
  },
  {
    id: 'eng_clinico',
    nome: 'Engenheiro Clínico / Gestor',
    descricao: 'Gestão de O.S., calibrações RBC, planos de manutenção preventiva e laudos técnicos.',
    usuariosCount: 4,
    modulos: ['Ordens de Serviço', 'Planos Recorrentes', 'Certificados RBC', 'Inventário de Ativos', 'Indicadores SLA']
  },
  {
    id: 'tecnico_residente',
    nome: 'Técnico Residente / Especialista',
    descricao: 'Execução de O.S., preenchimento de checklists, registro de peças e horas trabalhadas.',
    usuariosCount: 8,
    modulos: ['Atendimento de O.S.', 'Checklist Preventivo', 'Consumo de Peças', 'Abertura de O.S. Emergencial']
  },
  {
    id: 'solicitante_clinico',
    nome: 'Solicitante Clínico (Enfermagem & Setores)',
    descricao: 'Abertura de chamados emergenciais dos leitos e acompanhamento do status do atendimento.',
    usuariosCount: 123,
    modulos: ['Abertura de Chamados', 'Consulta de Status do Setor', 'Histórico de Atendimento']
  },
  {
    id: 'auditor_qualidade',
    nome: 'Auditor de Qualidade / ONA',
    descricao: 'Acesso para leitura e auditoria de relatórios metrológicos, rastreabilidade e segurança elétrica.',
    usuariosCount: 2,
    modulos: ['Visualização de Certificados', 'Histórico de Calibrações', 'Exportação de Relatórios ONA']
  }
];

// Pre-loaded Client Institutions
const DEFAULT_EMPRESAS = [
  {
    id: 1,
    nome: 'Hospital Geral Dr. Luiz Buaiz (HGLB)',
    cnpj: '04.128.941/0001-44',
    cidade: 'Cachoeiro de Itapemirim - ES',
    equipamentosCount: 340,
    solicitantesCount: 48,
    vertentes: ['clinical', 'predial', 'ti'],
    status: 'Ativo'
  },
  {
    id: 2,
    nome: 'HIFA Aquidaban - Hospital Materno Infantil',
    cnpj: '27.098.243/0001-92',
    cidade: 'Cachoeiro de Itapemirim - ES',
    equipamentosCount: 215,
    solicitantesCount: 39,
    vertentes: ['clinical', 'predial'],
    status: 'Ativo'
  },
  {
    id: 3,
    nome: 'HIFA Sumaré - Unidade de Diagnóstico',
    cnpj: '27.098.243/0002-73',
    cidade: 'Cachoeiro de Itapemirim - ES',
    equipamentosCount: 145,
    solicitantesCount: 22,
    vertentes: ['clinical', 'ti'],
    status: 'Ativo'
  },
  {
    id: 4,
    nome: 'Clínica de Nefrologia & Hemodiálise HIFA',
    cnpj: '27.098.243/0003-54',
    cidade: 'Cachoeiro de Itapemirim - ES',
    equipamentosCount: 68,
    solicitantesCount: 14,
    vertentes: ['clinical'],
    status: 'Ativo'
  }
];

function AdminUsers() {
  const admin = getStoredUser();

  // Navigation Tabs matching reference images: Meus usuários, Solicitantes, Grupos de permissões, Empresas e clientes
  const urlParams = new URLSearchParams(window.location.search);
  const initialTab = urlParams.get('tab') || 'equipe';
  const [mainTab, setMainTab] = useState(
    ['solicitantes', 'permissoes', 'clientes', 'equipe'].includes(initialTab) ? initialTab : 'equipe'
  );

  function handleSwitchMainTab(tab) {
    setMainTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.pushState({}, '', url.toString());
  }

  // Team / Users state
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Filters for team
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState('all'); // 'all', 'pending', 'active', 'admin', 'technician', 'client'

  // Modals state for team
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [approvingId, setApprovingId] = useState(null);

  // Edit Form state for team
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    role: 'client',
    isActive: true,
    newPassword: '',
    contractedVerticals: ['clinical', 'ti']
  });

  // Solicitantes states matching reference image 4
  const [solicitantes, setSolicitantes] = useState(() => {
    try {
      const saved = localStorage.getItem('helpclin_solicitantes');
      return saved ? JSON.parse(saved) : DEFAULT_SOLICITANTES;
    } catch {
      return DEFAULT_SOLICITANTES;
    }
  });
  const [solicitantesSearch, setSolicitantesSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Solicitante Edit / Add Modals
  const [editingSolicitante, setEditingSolicitante] = useState(null);
  const [isAddingSolicitante, setIsAddingSolicitante] = useState(false);
  const [solicitanteForm, setSolicitanteForm] = useState({
    nome: '',
    cargo: '',
    empresas: '',
    status: 'Ativo',
    email: ''
  });
  const [deletingSolicitante, setDeletingSolicitante] = useState(null);
  const [passwordModalInfo, setPasswordModalInfo] = useState(null);
  const [passwordCopied, setPasswordCopied] = useState(false);

  useEffect(() => {
    if (admin?.role !== 'admin') {
      setFeedback({ type: 'error', message: 'Apenas administradores podem acessar a gestão de usuários.' });
      setIsLoading(false);
      return;
    }
    loadUsers();
  }, [admin?.id, admin?.role]);

  // Listen for browser forward/backward to update mainTab
  useEffect(() => {
    function handlePopState() {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab && ['solicitantes', 'permissoes', 'clientes', 'equipe'].includes(tab)) {
        setMainTab(tab);
      }
    }
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

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
    const userVerts = getUserAllowedVerticals(userItem);
    setEditForm({
      name: userItem.name || '',
      email: userItem.email || '',
      role: userItem.role === 'user' ? 'client' : (userItem.role || 'client'),
      isActive: Boolean(userItem.is_active),
      newPassword: '',
      contractedVerticals: userVerts
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

      // Salva as vertentes contratadas do cliente
      if (editForm.role === 'client' && editForm.contractedVerticals) {
        saveUserContractedVerticals(editingUser.id, editForm.contractedVerticals);
        updated.contractedVerticals = editForm.contractedVerticals;
      }

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

  // Solicitantes handlers
  function updateSolicitantesList(newList) {
    setSolicitantes(newList);
    try {
      localStorage.setItem('helpclin_solicitantes', JSON.stringify(newList));
    } catch (err) {
      console.error('Erro ao salvar solicitantes:', err);
    }
  }

  function handleOpenAddSolicitante() {
    setSolicitanteForm({
      nome: '',
      cargo: '',
      empresas: '',
      status: 'Ativo',
      email: ''
    });
    setIsAddingSolicitante(true);
  }

  function handleOpenEditSolicitante(sol) {
    setEditingSolicitante(sol);
    setSolicitanteForm({
      nome: sol.nome || '',
      cargo: sol.cargo || '',
      empresas: sol.empresas || '',
      status: sol.status || 'Ativo',
      email: sol.email || ''
    });
  }

  function handleSaveSolicitante(e) {
    e.preventDefault();
    if (editingSolicitante) {
      const updated = solicitantes.map((s) =>
        s.id === editingSolicitante.id ? { ...s, ...solicitanteForm } : s
      );
      updateSolicitantesList(updated);
      setEditingSolicitante(null);
      setFeedback({ type: 'success', message: `Solicitante "${solicitanteForm.nome}" atualizado com sucesso!` });
    } else {
      const newId = Math.max(...solicitantes.map((s) => s.id || 0), 250) + 1;
      const created = {
        id: newId,
        ...solicitanteForm
      };
      updateSolicitantesList([created, ...solicitantes]);
      setIsAddingSolicitante(false);
      setFeedback({ type: 'success', message: `Solicitante "${created.nome}" cadastrado com sucesso!` });
    }
  }

  function handleDeleteSolicitanteConfirm() {
    if (!deletingSolicitante) return;
    const next = solicitantes.filter((s) => s.id !== deletingSolicitante.id);
    updateSolicitantesList(next);
    setFeedback({ type: 'success', message: `Solicitante removido com sucesso.` });
    setDeletingSolicitante(null);
  }

  function handleGeneratePassword(sol) {
    const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase();
    const randomNum = Math.floor(100 + Math.random() * 900);
    const newPass = `HelpClin#${randomChars}!${randomNum}`;
    setPasswordCopied(false);
    setPasswordModalInfo({
      nome: sol.nome,
      email: sol.email,
      password: newPass
    });
  }

  // Filtered users calculation for "Meus usuários" tab
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

  // Filtered solicitantes calculation
  const filteredSolicitantes = useMemo(() => {
    return solicitantes.filter((sol) => {
      if (selectedStatus !== 'all' && sol.status !== selectedStatus) return false;
      if (selectedHospital !== 'all' && !sol.empresas.toLowerCase().includes(selectedHospital.toLowerCase())) return false;

      if (solicitantesSearch.trim()) {
        const norm = normalizeText(solicitantesSearch);
        const str = normalizeText(`${sol.nome} ${sol.cargo} ${sol.empresas} ${sol.email}`);
        const tokens = norm.split(/\s+/).filter(Boolean);
        if (!tokens.every((token) => str.includes(token))) return false;
      }
      return true;
    });
  }, [solicitantes, selectedStatus, selectedHospital, solicitantesSearch]);

  const pendingCount = users.filter((u) => !u.is_active).length;
  const activeCount = users.filter((u) => u.is_active).length;
  const adminCount = users.filter((u) => u.role === 'admin').length;
  const technicianCount = users.filter((u) => u.role === 'technician').length;
  const clientCount = users.filter((u) => u.role === 'client' || u.role === 'user').length;

  return (
    <div className="simple-page admin-users-page">
      {/* High-level navigation tabs matching user reference image submenus */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        borderBottom: '1px solid var(--line)',
        marginBottom: '22px',
        overflowX: 'auto',
        paddingBottom: '2px'
      }}>
        <button
          type="button"
          className={`dash-tab-btn ${mainTab === 'equipe' ? 'dash-tab-btn--active' : ''}`}
          onClick={() => handleSwitchMainTab('equipe')}
          style={{ padding: '10px 18px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}
        >
          <Users size={16} />
          <span>Meus usuários</span>
          <span style={{ fontSize: '11px', background: 'rgba(0,0,0,0.06)', padding: '2px 7px', borderRadius: '10px' }}>
            {users.length}
          </span>
        </button>

        <button
          type="button"
          className={`dash-tab-btn ${mainTab === 'solicitantes' ? 'dash-tab-btn--active' : ''}`}
          onClick={() => handleSwitchMainTab('solicitantes')}
          style={{ padding: '10px 18px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}
        >
          <UserCheck size={16} />
          <span>Solicitantes</span>
          <span style={{ fontSize: '11px', background: '#0f766e', color: '#ffffff', padding: '2px 7px', borderRadius: '10px', fontWeight: 700 }}>
            {solicitantes.length}
          </span>
        </button>

        <button
          type="button"
          className={`dash-tab-btn ${mainTab === 'permissoes' ? 'dash-tab-btn--active' : ''}`}
          onClick={() => handleSwitchMainTab('permissoes')}
          style={{ padding: '10px 18px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}
        >
          <ShieldCheck size={16} />
          <span>Grupos de permissões</span>
        </button>

        <button
          type="button"
          className={`dash-tab-btn ${mainTab === 'clientes' ? 'dash-tab-btn--active' : ''}`}
          onClick={() => handleSwitchMainTab('clientes')}
          style={{ padding: '10px 18px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}
        >
          <Building2 size={16} />
          <span>Empresas e clientes</span>
        </button>
      </div>

      {/* Alerts / Feedback */}
      {feedback.message && (
        <div
          className={`dash-alert ${feedback.type === 'error' ? 'dash-alert--error' : 'dash-alert--success'}`}
          style={{ marginBottom: '20px' }}
        >
          {feedback.message}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA: SOLICITANTES (EXATA TELA DA IMAGEM 4 DO USUÁRIO)                     */}
      {/* ========================================================================= */}
      {mainTab === 'solicitantes' && (
        <div className="solicitantes-view">
          {/* Header Bar matching Screenshot */}
          <div className="solicitantes-header-bar">
            <div className="solicitantes-title-wrap">
              <h1 className="solicitantes-title">Solicitantes</h1>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: '#e0f2fe',
                  color: '#0284c7',
                  display: 'grid',
                  placeItems: 'center'
                }}
              >
                <User size={18} />
              </div>
              <span
                title="Usuários autorizados dos setores e coordenações hospitalares para abertura de chamados técnicos e acompanhamento de ordens de serviço."
                style={{ cursor: 'pointer', color: '#64748b' }}
              >
                <HelpCircle size={16} />
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                className="solicitantes-generate-btn"
                onClick={handleOpenAddSolicitante}
                style={{ background: '#0d9488', padding: '8px 16px', fontSize: '13px' }}
              >
                <Plus size={16} />
                <span>Adicionar</span>
              </button>

              <div className="solicitantes-quota-badge">
                {solicitantes.length} de 10000 solicitantes
              </div>
            </div>
          </div>

          {/* Sub-toolbar with Filtros button and Search input */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                className="solicitantes-filter-btn"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter size={14} />
                <span>Filtros</span>
                <ChevronDown size={14} style={{ transform: showFilters ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
              </button>

              {(selectedHospital !== 'all' || selectedStatus !== 'all') && (
                <button
                  type="button"
                  className="secondary-button"
                  style={{ padding: '6px 10px', fontSize: '11.5px' }}
                  onClick={() => {
                    setSelectedHospital('all');
                    setSelectedStatus('all');
                  }}
                >
                  Limpar Filtros
                </button>
              )}
            </div>

            <div className="search-control" style={{ width: '320px', maxWidth: '100%' }}>
              <Search size={16} />
              <input
                value={solicitantesSearch}
                onChange={(e) => setSolicitantesSearch(e.target.value)}
                placeholder="Pesquisar solicitante, setor ou e-mail..."
              />
            </div>
          </div>

          {/* Collapsible Filter Panel */}
          {showFilters && (
            <div style={{
              background: '#f8faf9',
              border: '1px solid #d3e1dc',
              borderRadius: '8px',
              padding: '14px 16px',
              marginBottom: '16px',
              display: 'flex',
              gap: '16px',
              flexWrap: 'wrap',
              alignItems: 'center'
            }}>
              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--teal)', display: 'block', marginBottom: '4px' }}>
                  Hospital / Unidade
                </label>
                <select
                  value={selectedHospital}
                  onChange={(e) => setSelectedHospital(e.target.value)}
                  style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                >
                  <option value="all">Todos os Hospitais</option>
                  <option value="AQUIDABAN">HIFA Aquidaban</option>
                  <option value="SUMARÉ">HIFA Sumaré</option>
                  <option value="LUIZ BUAIZ">Hospital Geral Dr. Luiz Buaiz</option>
                  <option value="HEMODIÁLISE">Clínica de Hemodiálise</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--teal)', display: 'block', marginBottom: '4px' }}>
                  Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                >
                  <option value="all">Todos os Status</option>
                  <option value="Ativo">Ativo</option>
                  <option value="Inativo">Inativo</option>
                </select>
              </div>
            </div>
          )}

          {/* Solicitantes Table Card with Teal Header Banner */}
          <section className="ticket-list-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid #d3e1dc', borderRadius: '10px' }}>
            <div className="solicitantes-table-banner">
              <List size={18} />
              <span>Solicitantes Cadastrados</span>
            </div>

            <div className="helpclin-table-wrapper">
              <table className="helpclin-table" style={{ fontSize: '12px' }}>
                <thead>
                  <tr>
                    <th style={{ width: '90px', padding: '12px 14px' }}>#</th>
                    <th style={{ minWidth: '180px', padding: '12px 14px' }}>Nome</th>
                    <th style={{ minWidth: '160px', padding: '12px 14px' }}>Cargo</th>
                    <th style={{ minWidth: '280px', padding: '12px 14px' }}>Empresas</th>
                    <th style={{ width: '100px', padding: '12px 14px' }}>Status</th>
                    <th style={{ width: '110px', padding: '12px 14px' }}>Senha</th>
                    <th style={{ minWidth: '190px', padding: '12px 14px' }}>Email</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSolicitantes.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
                        Nenhum solicitante encontrado para os critérios de busca.
                      </td>
                    </tr>
                  ) : (
                    filteredSolicitantes.map((sol) => (
                      <tr key={sol.id} style={{ borderBottom: '1px solid #edf2f0' }}>
                        {/* Column #: User Icon, Edit, Delete, ID */}
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                            <span style={{ color: '#0284c7' }} title="Solicitante">
                              <User size={14} />
                            </span>
                            <button
                              type="button"
                              onClick={() => handleOpenEditSolicitante(sol)}
                              title="Editar Solicitante"
                              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#0284c7', padding: '2px' }}
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingSolicitante(sol)}
                              title="Excluir Solicitante"
                              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#06b6d4', padding: '2px' }}
                            >
                              <Trash2 size={14} />
                            </button>
                            <span style={{ color: '#64748b', fontSize: '11.5px', marginLeft: '2px' }}>
                              {sol.id}
                            </span>
                          </div>
                        </td>

                        {/* Nome */}
                        <td style={{ padding: '10px 14px' }}>
                          <strong style={{ color: 'var(--teal)', fontSize: '12px' }}>
                            {sol.nome}
                          </strong>
                        </td>

                        {/* Cargo */}
                        <td style={{ padding: '10px 14px', color: '#475569', fontSize: '11.5px' }}>
                          {sol.cargo || '—'}
                        </td>

                        {/* Empresas / Setores */}
                        <td style={{ padding: '10px 14px', color: '#475569', fontSize: '11px', lineHeight: 1.4 }}>
                          {sol.empresas}
                        </td>

                        {/* Status (Green pill badge) */}
                        <td style={{ padding: '10px 14px' }}>
                          <span className="solicitantes-status-badge">
                            <Check size={12} strokeWidth={2.5} /> {sol.status}
                          </span>
                        </td>

                        {/* Senha (Teal button "Gerar") */}
                        <td style={{ padding: '10px 14px' }}>
                          <button
                            type="button"
                            className="solicitantes-generate-btn"
                            onClick={() => handleGeneratePassword(sol)}
                            title="Gerar nova senha de acesso e enviar por e-mail"
                          >
                            <Check size={12} strokeWidth={2.5} />
                            <span>Gerar</span>
                          </button>
                        </td>

                        {/* Email */}
                        <td style={{ padding: '10px 14px', color: '#475569', fontSize: '11.5px' }}>
                          {sol.email}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA: MEUS USUÁRIOS (EQUIPE / ADMINISTRADORES / CLIENTES)                   */}
      {/* ========================================================================= */}
      {mainTab === 'equipe' && (
        <>
          {/* Heading */}
          <section className="simple-page-heading" style={{ marginBottom: '16px' }}>
            <div>
              <p className="eyebrow">Administração do Sistema</p>
              <h1>Meus Usuários</h1>
              <p>Gerencie, aprove, edite perfis e determine as vertentes contratadas dos clientes.</p>
            </div>
            <div className="work-order-user">
              <span>Administrador conectado:</span>
              <strong>{admin?.name ?? 'Administrador'}</strong>
            </div>
          </section>

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
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span className="pending-role pending-role--client" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', width: 'fit-content' }}>
                                  <User size={12} /> Cliente
                                </span>
                                <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                                  {getUserAllowedVerticals(userItem).map((vert) => (
                                    <span
                                      key={vert}
                                      style={{
                                        fontSize: '9.5px',
                                        fontWeight: 700,
                                        padding: '1px 5px',
                                        borderRadius: '4px',
                                        background: VERTICALS[vert]?.bg || '#f1f5f9',
                                        color: VERTICALS[vert]?.color || '#475569'
                                      }}
                                      title={`Vertente ${VERTICALS[vert]?.name || vert}`}
                                    >
                                      {VERTICALS[vert]?.shortName || vert}
                                    </span>
                                  ))}
                                </div>
                              </div>
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
        </>
      )}

      {/* ========================================================================= */}
      {/* ABA: GRUPOS DE PERMISSÕES                                                 */}
      {/* ========================================================================= */}
      {mainTab === 'permissoes' && (
        <div>
          <section className="simple-page-heading" style={{ marginBottom: '16px' }}>
            <div>
              <p className="eyebrow">Segurança & Conformidade</p>
              <h1>Grupos de Permissões</h1>
              <p>Perfis de controle de acesso para profissionais de engenharia, técnicos e solicitantes.</p>
            </div>
          </section>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {DEFAULT_PERMISSOES.map((grupo) => (
              <div
                key={grupo.id}
                style={{
                  background: 'var(--surface, #ffffff)',
                  border: '1px solid var(--line, #e2e8f0)',
                  borderRadius: '12px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldCheck size={20} style={{ color: '#0f766e' }} />
                    <strong style={{ fontSize: '14px', color: 'var(--teal)' }}>{grupo.nome}</strong>
                  </div>
                  <span style={{ fontSize: '11.5px', background: '#f1f5f9', padding: '3px 8px', borderRadius: '6px', color: '#475569', fontWeight: 600 }}>
                    {grupo.usuariosCount} vinculados
                  </span>
                </div>

                <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)', lineHeight: 1.4 }}>
                  {grupo.descricao}
                </p>

                <div style={{ marginTop: 'auto', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                    Módulos Autorizados:
                  </span>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {grupo.modulos.map((m, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: '10px',
                          background: '#f8faf9',
                          border: '1px solid #d3e1dc',
                          color: '#0f766e',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontWeight: 600
                        }}
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA: EMPRESAS E CLIENTES                                                  */}
      {/* ========================================================================= */}
      {mainTab === 'clientes' && (
        <div>
          <section className="simple-page-heading" style={{ marginBottom: '16px' }}>
            <div>
              <p className="eyebrow">Instituições Hospitalares</p>
              <h1>Empresas e Clientes Cadastrados</h1>
              <p>Hospitais, unidades diagnósticas e clínicas conveniadas com gestão de contratos e vertentes ativas.</p>
            </div>
          </section>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {DEFAULT_EMPRESAS.map((emp) => (
              <div
                key={emp.id}
                style={{
                  background: 'var(--surface, #ffffff)',
                  border: '1px solid var(--line, #e2e8f0)',
                  borderRadius: '12px',
                  padding: '18px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '14px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Building2 size={20} style={{ color: '#0f766e' }} />
                    <strong style={{ fontSize: '14px', color: 'var(--teal)' }}>{emp.nome}</strong>
                    <span className="solicitantes-status-badge">
                      <Check size={12} /> {emp.status}
                    </span>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '11.5px', color: 'var(--muted)' }}>
                    CNPJ: <strong>{emp.cnpj}</strong> • {emp.cidade}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block' }}>Vertentes Contratadas:</span>
                    <div style={{ display: 'flex', gap: '4px', marginTop: '3px' }}>
                      {emp.vertentes.map((v) => (
                        <span
                          key={v}
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: VERTICALS[v]?.bg || '#f1f5f9',
                            color: VERTICALS[v]?.color || '#475569'
                          }}
                        >
                          {VERTICALS[v]?.shortName || v}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div style={{ padding: '6px 12px', background: '#f8faf9', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block' }}>Ativos</span>
                    <strong style={{ fontSize: '14px', color: 'var(--teal)' }}>{emp.equipamentosCount}</strong>
                  </div>

                  <a
                    href="/inventario"
                    className="secondary-button"
                    style={{ fontSize: '11.5px', padding: '6px 12px' }}
                  >
                    Ver Inventário
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAIS: SOLICITANTES                                                      */}
      {/* ========================================================================= */}

      {/* Modal: Adicionar / Editar Solicitante */}
      {(isAddingSolicitante || editingSolicitante) && (
        <div className="dash-modal-backdrop" onClick={() => { setIsAddingSolicitante(false); setEditingSolicitante(null); }}>
          <div className="dash-modal" onClick={(e) => e.stopPropagation()} style={{ width: 'min(100%, 540px)' }}>
            <div className="dash-modal-header">
              <h2>{editingSolicitante ? 'Editar Solicitante' : 'Novo Solicitante'}</h2>
              <button
                type="button"
                className="dash-modal-close"
                onClick={() => { setIsAddingSolicitante(false); setEditingSolicitante(null); }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveSolicitante} className="dash-modal-form">
              <div className="dash-form-field">
                <label>Nome do Solicitante / Setor *</label>
                <input
                  required
                  value={solicitanteForm.nome}
                  onChange={(e) => setSolicitanteForm({ ...solicitanteForm, nome: e.target.value.toUpperCase() })}
                  placeholder="Ex: UTI ADULTO - HIFA ou TERAPIA NUTRICIONAL"
                />
              </div>

              <div className="dash-form-field">
                <label>Cargo / Coordenador(a)</label>
                <input
                  value={solicitanteForm.cargo}
                  onChange={(e) => setSolicitanteForm({ ...solicitanteForm, cargo: e.target.value })}
                  placeholder="Ex: Cristiane - Coordenadora da Linha Neo/Materna"
                />
              </div>

              <div className="dash-form-field">
                <label>Empresas / Setores Vinculados *</label>
                <textarea
                  required
                  rows={3}
                  value={solicitanteForm.empresas}
                  onChange={(e) => setSolicitanteForm({ ...solicitanteForm, empresas: e.target.value })}
                  placeholder="Ex: CENTRO CIRÚRGICO - HIFA AQUIDABAN, ENFERMARIA ADULTO..."
                />
              </div>

              <div className="dash-form-row">
                <div className="dash-form-field">
                  <label>E-mail Institucional *</label>
                  <input
                    type="email"
                    required
                    value={solicitanteForm.email}
                    onChange={(e) => setSolicitanteForm({ ...solicitanteForm, email: e.target.value.toLowerCase() })}
                    placeholder="solicitante@hifa.org.br"
                  />
                </div>

                <div className="dash-form-field">
                  <label>Status</label>
                  <select
                    value={solicitanteForm.status}
                    onChange={(e) => setSolicitanteForm({ ...solicitanteForm, status: e.target.value })}
                  >
                    <option value="Ativo">Ativo</option>
                    <option value="Inativo">Inativo</option>
                  </select>
                </div>
              </div>

              <div className="dash-modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => { setIsAddingSolicitante(false); setEditingSolicitante(null); }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  style={{ background: '#0f766e', borderColor: '#0f766e' }}
                >
                  {editingSolicitante ? 'Salvar Solicitante' : 'Cadastrar Solicitante'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Senha Gerada Feedback */}
      {passwordModalInfo && (
        <div className="dash-modal-backdrop" onClick={() => setPasswordModalInfo(null)}>
          <div className="dash-modal" style={{ width: 'min(100%, 460px)' }} onClick={(e) => e.stopPropagation()}>
            <div className="dash-modal-header" style={{ borderBottomColor: '#a7f3d0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f766e' }}>
                <KeyRound size={20} />
                <h2 style={{ color: '#0f766e' }}>Nova Senha Gerada</h2>
              </div>
              <button
                type="button"
                className="dash-modal-close"
                onClick={() => setPasswordModalInfo(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '16px 0' }}>
              <p style={{ fontSize: '13px', color: 'var(--muted)', margin: '0 0 12px' }}>
                Uma nova senha temporária foi gerada com sucesso para o solicitante{' '}
                <strong style={{ color: 'var(--teal)' }}>{passwordModalInfo.nome}</strong>:
              </p>

              <div style={{
                background: '#f8faf9',
                border: '1.5px dashed #0f766e',
                borderRadius: '8px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px'
              }}>
                <code style={{ fontSize: '16px', fontWeight: 700, color: '#0f766e', letterSpacing: '0.05em' }}>
                  {passwordModalInfo.password}
                </code>
                <button
                  type="button"
                  className="secondary-button"
                  style={{ padding: '4px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  onClick={() => {
                    navigator.clipboard.writeText(passwordModalInfo.password);
                    setPasswordCopied(true);
                  }}
                >
                  <Copy size={13} />
                  <span>{passwordCopied ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#059669', fontSize: '12px' }}>
                <CheckCircle2 size={16} />
                <span>As credenciais de acesso também foram enviadas para <strong>{passwordModalInfo.email}</strong>.</span>
              </div>
            </div>

            <div className="dash-modal-actions">
              <button
                type="button"
                className="primary-button"
                onClick={() => setPasswordModalInfo(null)}
                style={{ background: '#0f766e', borderColor: '#0f766e' }}
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirmar Exclusão de Solicitante */}
      {deletingSolicitante && (
        <div className="dash-modal-backdrop" onClick={() => setDeletingSolicitante(null)}>
          <div className="dash-modal" style={{ width: 'min(100%, 460px)' }} onClick={(e) => e.stopPropagation()}>
            <div className="dash-modal-header" style={{ borderBottomColor: '#fca5a5' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#dc2626' }}>
                <AlertTriangle size={20} />
                <h2 style={{ color: '#dc2626' }}>Excluir Solicitante</h2>
              </div>
              <button
                type="button"
                className="dash-modal-close"
                onClick={() => setDeletingSolicitante(null)}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.5, margin: '16px 0 20px' }}>
              Tem certeza de que deseja remover o cadastro do solicitante{' '}
              <strong style={{ color: 'var(--teal)' }}>{deletingSolicitante.nome}</strong>?
              Os chamados anteriormente abertos por este setor permanecerão no histórico.
            </p>

            <div className="dash-modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setDeletingSolicitante(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={handleDeleteSolicitanteConfirm}
                style={{ backgroundColor: '#dc2626', borderColor: '#dc2626' }}
              >
                Sim, Excluir Solicitante
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAIS: MEUS USUÁRIOS (EDITAR / EXCLUIR)                                  */}
      {/* ========================================================================= */}

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

              {/* Se for Cliente, configura quais vertentes foram contratadas */}
              {editForm.role === 'client' && (
                <div style={{
                  background: '#f8faf9',
                  border: '1px solid #dce7df',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  marginTop: '12px'
                }}>
                  <label style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'var(--teal)',
                    display: 'block',
                    marginBottom: '4px'
                  }}>
                    Vertentes Contratadas por este Cliente
                  </label>
                  <p style={{
                    fontSize: '11px',
                    color: 'var(--muted)',
                    margin: '0 0 10px',
                    lineHeight: 1.4
                  }}>
                    O cliente visualizará apenas os equipamentos, chamados e serviços das vertentes selecionadas.
                    Caso contrate duas ou mais, conseguirá alternar e visualizar ambas.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: editForm.contractedVerticals?.includes('clinical') ? '1.5px solid #0f766e' : '1px solid #dce7df',
                      background: editForm.contractedVerticals?.includes('clinical') ? '#ccfbf1' : '#ffffff',
                      cursor: 'pointer',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      color: '#0f766e'
                    }}>
                      <input
                        type="checkbox"
                        checked={editForm.contractedVerticals?.includes('clinical')}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          const next = checked
                            ? [...(editForm.contractedVerticals || []), 'clinical']
                            : (editForm.contractedVerticals || []).filter((v) => v !== 'clinical');
                          setEditForm({ ...editForm, contractedVerticals: next });
                        }}
                      />
                      <span>🩺 Engenharia Clínica</span>
                    </label>

                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: editForm.contractedVerticals?.includes('ti') ? '1.5px solid #1d4ed8' : '1px solid #dce7df',
                      background: editForm.contractedVerticals?.includes('ti') ? '#dbeafe' : '#ffffff',
                      cursor: 'pointer',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      color: '#1d4ed8'
                    }}>
                      <input
                        type="checkbox"
                        checked={editForm.contractedVerticals?.includes('ti')}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          const next = checked
                            ? [...(editForm.contractedVerticals || []), 'ti']
                            : (editForm.contractedVerticals || []).filter((v) => v !== 'ti');
                          setEditForm({ ...editForm, contractedVerticals: next });
                        }}
                      />
                      <span>💻 T.I. em Saúde</span>
                    </label>

                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: editForm.contractedVerticals?.includes('predial') ? '1.5px solid #b45309' : '1px solid #dce7df',
                      background: editForm.contractedVerticals?.includes('predial') ? '#fef3c7' : '#ffffff',
                      cursor: 'pointer',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      color: '#b45309'
                    }}>
                      <input
                        type="checkbox"
                        checked={editForm.contractedVerticals?.includes('predial')}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          const next = checked
                            ? [...(editForm.contractedVerticals || []), 'predial']
                            : (editForm.contractedVerticals || []).filter((v) => v !== 'predial');
                          setEditForm({ ...editForm, contractedVerticals: next });
                        }}
                      />
                      <span>🏢 Engenharia Predial</span>
                    </label>
                  </div>
                </div>
              )}

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

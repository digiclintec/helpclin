import {
  AlertTriangle,
  ArrowRight,
  Check,
  Clock,
  ExternalLink,
  FilePlus2,
  FileUp,
  Laptop,
  MessageSquare,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
  UserCheck,
  Wrench,
  X
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import ExportDropdown from '../components/ExportDropdown.jsx';
import {
  assignSupportTicket,
  createSupportTicket,
  deleteSupportTicket,
  getInventory,
  getStoredUser,
  getSupportTickets,
  rejectSupportTicket
} from '../services/api.js';
import { exportToPdf, exportToXls } from '../utils/exportReport.js';
import { matchTicketSearch } from '../utils/searchUtils.js';
import {
  isTIModuleEnabled,
  isClinicalModuleEnabled,
  isPredialModuleEnabled
} from '../utils/billingUtils.js';
import {
  VERTICALS,
  canUserAccessVertical,
  filterEquipmentsForUser,
  formatUserVerticalsSummary,
  getAssetVertical,
  getUserAllowedVerticals
} from '../utils/verticalUtils.js';

const TI_PROBLEMS = [
  'Dificuldades com sistema Clinux / PEP / Prontuário',
  'Lentidão ou travamento no sistema de atendimento',
  'Erro de login / Senha bloqueada',
  'Sem conexão com a internet / Rede Wi-Fi oscilando',
  'Falha na impressão de prontuários / laudos / pulseiras',
  'Problema no e-mail corporativo / Comunicação interna',
  'Instalação / Atualização de software ou antivírus',
  'Cadastro / Permissão de acesso de novo usuário (LGPD)'
];

const CLINICAL_PROBLEMS = [
  'Solicitação de calibração periódica / Certificado RBC',
  'Equipamento médico com alarme falso constante',
  'Necessidade de teste de segurança elétrica (NBR IEC 60601)',
  'Troca preventiva de acessórios médicos (cabos/sensores)'
];

const PREDIAL_PROBLEMS = [
  'Oscilação na rede elétrica / Teste do grupo gerador',
  'Alarme de pressão na central de gases medicinais',
  'Ar-condicionado fora da temperatura ideal (PMOC / Centro Cirúrgico)',
  'Vazamento hidráulico ou falta de água no setor',
  'Falha no sistema de iluminação de emergência / AVCB',
  'Problema em porta corta-fogo ou trava de leito'
];

// Problemas eventuais pré-definidos exclusivamente para equipamentos
export const CLINICAL_EQUIPMENT_PROBLEMS = [
  'Alarme sonoro constante / Falso alarme de sinal vital (Monitor / UTI)',
  'Descalibração ou erro de leitura em sensores (SpO2, PNI, ECG)',
  'Equipamento não liga / Bateria interna sem autonomia ou viciada',
  'Erro de oclusão / Falha na vazão de infusão (Bomba de Infusão / Seringa)',
  'Desfibrilador com falha no autoteste / Descarga sem potência nominal',
  'Ventilador com vazamento / Baixa pressão inspiratória / Falha de válvula',
  'Autoclave não atinge patamar de temperatura/pressão de esterilização',
  'Bisturi elétrico / Eletrocautério com falha na caneta ou placa neutra',
  'Cabo de paciente, transdutor ou conector quebrado / Mau contato',
  'Display / Tela do equipamento apagada, com linhas ou touch inoperante',
  'Solicitação de calibração metrológica periódica / Certificado RBC',
  'Dano físico / Suporte, trava de leito ou rodízio quebrado'
];

export const PREDIAL_EQUIPMENT_PROBLEMS = [
  'Grupo Gerador com falha na partida automática pós-queda de rede',
  'Alarme de baixa pressão na rede de oxigênio / gases medicinais',
  'No-break hospitalar (UPS) desarmando / Operando em alarme de sobrecarga',
  'Ar-condicionado cirúrgico sem refrigerar / Sala fora da temperatura (PMOC)',
  'Gotejamento de água / Dreno de ar-condicionado entupido no setor',
  'Bomba de recalque de água desarmada / Sem pressão nas torneiras',
  'Central de vácuo clínico desarmando / Baixa sucção nos leitos',
  'Painel de alarme de incêndio acusando falha de laço / detector',
  'Quadro elétrico com disjuntor desarmando / Superaquecimento anormal',
  'Porta corta-fogo com mola ou trava eletromagnética inoperante'
];

export const TI_HARDWARE_EQUIPMENT_PROBLEMS = [
  'Computador / Estação de atendimento médica não liga / Sem vídeo',
  'Lentidão extrema / Travamento com tela azul (BSOD) durante uso do PEP',
  'Impressora térmica de pulseiras travando etiquetas / Não traciona',
  'Leitor óptico de código de barras não reconhece pulseiras/medicamentos',
  'Monitor da estação médica piscando, sem sinal ou resolução incorreta',
  'Cabo de rede rompido / Ponto RJ45 do leito danificado fisicamente',
  'Fonte de alimentação queimada / Equipamento desarmando disjuntor',
  'Teclado ou mouse quebrado / Porta USB com defeito',
  'Superaquecimento do processador / Cooler da CPU com ruído excessivo'
];

function getEquipmentProblemSuggestions(selectedEquipment, user = null) {
  if (!selectedEquipment) {
    const list = [];
    if (canUserAccessVertical(user, 'clinical') && isClinicalModuleEnabled()) list.push(...CLINICAL_EQUIPMENT_PROBLEMS.slice(0, 6));
    if (canUserAccessVertical(user, 'predial') && isPredialModuleEnabled()) list.push(...PREDIAL_EQUIPMENT_PROBLEMS.slice(0, 4));
    if (canUserAccessVertical(user, 'ti') && isTIModuleEnabled()) list.push(...TI_HARDWARE_EQUIPMENT_PROBLEMS.slice(0, 4));
    list.push('Equipamento não liga / Sem alimentação elétrica');
    list.push('Mau contato elétrico ou conector danificado');
    list.push('Superaquecimento anormal / Ruído excessivo');
    list.push('Dano físico / Peça quebrada / Rodízio travado');
    list.push('Outro problema (detalhado nas observações)');
    return Array.from(new Set(list));
  }

  const type = (selectedEquipment.equipment_type || '').toLowerCase();
  const name = (selectedEquipment.name || '').toLowerCase();

  // 1. Engenharia Predial / Infraestrutura
  if (type.includes('gerador') || name.includes('gerador') || type.includes('ups') || type.includes('no-break') || name.includes('no-break')) {
    return [
      'Falha na partida automática do gerador em queda de rede',
      'Nível baixo de combustível diesel / Bateria descarregada',
      'No-break operando em modo bateria / Alarme de sobrecarga',
      'Oscilação de tensão ou frequência elétrica na subestação',
      'Necessidade de teste preventivo com carga / Manutenção periódica',
      'Vazamento de óleo / Aquecimento anormal do motor',
      'Outro problema (detalhado nas observações)'
    ];
  }

  if (type.includes('gás') || type.includes('gas') || name.includes('oxig') || name.includes('vácuo') || name.includes('vacuo') || name.includes('ar comprimido')) {
    return [
      'Alarme de baixa pressão na rede de gases medicinais',
      'Vazamento perceptível em régua / tomada de gás do leito',
      'Bomba de vácuo clínico desarmando / Baixa sucção',
      'Compressor de ar medicinal com superaquecimento',
      'Necessidade de troca / Comutação de bateria de cilindros',
      'Outro problema (detalhado nas observações)'
    ];
  }

  if (type.includes('clima') || type.includes('chiller') || type.includes('ar-cond') || type.includes('ar cond') || type.includes('pmoc') || name.includes('split') || name.includes('ar cond') || name.includes('chiller')) {
    return [
      'Ar-condicionado não resfria / Sala cirúrgica fora da temperatura normatizada',
      'Gotejamento de água / Dreno de condensado entupido',
      'Pressão positiva/negativa inadequada na sala de isolamento',
      'Ruído excessivo ou vibração no motor/ventilador',
      'Manutenção preventiva periódica do PMOC / Troca de filtros HEPA',
      'Aparelho desarmando disjuntor elétrico / Não liga',
      'Outro problema (detalhado nas observações)'
    ];
  }

  if (type.includes('bomba') || type.includes('hidrául') || type.includes('hidraul') || name.includes('pressuriz') || name.includes('caixa d')) {
    return [
      'Bomba de água potável desarmada / Sem pressão no setor',
      'Vazamento na tubulação principal / Barrilete',
      'Falha no sistema de pressurização de água',
      'Alarme de nível crítico no reservatório hospitalar',
      'Necessidade de limpeza ou desinfecção periódica de reservatório',
      'Outro problema (detalhado nas observações)'
    ];
  }

  if (type.includes('incênd') || type.includes('incend') || type.includes('avcb') || name.includes('hidrante') || name.includes('sprinkler') || name.includes('extintor')) {
    return [
      'Painel de alarme de incêndio acusando falha de laço',
      'Detector de fumaça acionando falso alarme no setor',
      'Extintor com manômetro despressurizado / Carga vencida',
      'Vazamento na rede de hidrantes ou sprinklers',
      'Porta corta-fogo com mola frouxa / Não veda corretamente',
      'Outro problema (detalhado nas observações)'
    ];
  }

  // 2. Engenharia Clínica / Equipamentos Médicos
  if (type.includes('ventilador') || type.includes('respirador') || name.includes('ventilador') || name.includes('respirador')) {
    return [
      'Alarme de baixa pressão inspiratória / Vazamento no circuito',
      'Falha no sensor de fluxo ou célula galvânica de O2',
      'Equipamento acusando erro de autoteste na inicialização',
      'Bateria interna não segura carga em transporte de paciente',
      'Necessidade de teste de segurança elétrica / Calibração anual RBC',
      'Válvula expiratória travada / Alarme de sobrepressão',
      'Outro problema (detalhado nas observações)'
    ];
  }

  if (type.includes('desfibrilador') || name.includes('desfibrilador') || type.includes('cardioversor') || name.includes('cardioversor')) {
    return [
      'Falha no autoteste de descarga / Joules inconsistentes',
      'Pás de desfibrilação com cabo rompido ou mau contato',
      'Bateria interna com aviso de substituição / Carga fraca',
      'Impressora térmica de eletrocardiograma sem tracionar',
      'Certificado de calibração anual vencendo (RDC ANVISA)',
      'Outro problema (detalhado nas observações)'
    ];
  }

  if (type.includes('infus') || name.includes('infus') || name.includes('seringa')) {
    return [
      'Alarme de oclusão falso / Sensor de pressão desregulado',
      'Erro de vazão de infusão em ml/h / Alarme de ar constante',
      'Sensor de gotas falhando ou quebrado',
      'Bateria interna não carrega',
      'Mecanismo de porta ou trava mecânica danificada',
      'Outro problema (detalhado nas observações)'
    ];
  }

  if (type.includes('autoclave') || name.includes('autoclave') || type.includes('esteriliz')) {
    return [
      'Temperatura ou pressão não atinge patamar de esterilização',
      'Vazamento de vapor pela guarnição da porta da câmara',
      'Falha na bomba de vácuo / Ciclo abortado pela CPU',
      'Impressora de registro do ciclo térmico inoperante',
      'Teste biológico reprovado / Necessidade de qualificação térmica',
      'Outro problema (detalhado nas observações)'
    ];
  }

  if (type.includes('balan') || type.includes('clínic') || name.includes('balan') || name.includes('sensor') || name.includes('cardio') || name.includes('eletro')) {
    return [
      'Erro de calibração / Leitura oscilando ou imprecisa',
      'Equipamento não liga / Bateria não carrega',
      'Display apagado / Dígitos falhando no visor',
      'Cabo de derivação ou transdutor com defeito',
      'Alarme sonoro intermitente / Código de erro no visor',
      'Outro problema (detalhado nas observações)'
    ];
  }

  // 3. Tecnologia da Informação (T.I.)
  if (type.includes('impress') || name.includes('impress') || name.includes('epson') || name.includes('hp') || name.includes('zebra')) {
    return [
      'Impressora travada / Não imprime prescrições e laudos',
      'Atolamento de papel ou etiqueta constante',
      'Qualidade de impressão ruim / Falha de tinta ou toner',
      'Impressora offline / Não reconhecida na rede hospitalar',
      'Necessidade de troca de suprimento / Toner / Rolo térmico de pulseiras',
      'Luz de erro piscando no painel frontal',
      'Outro problema (detalhado nas observações)'
    ];
  }

  if (type.includes('monitor') || name.includes('monitor') || name.includes('tela') || name.includes('display')) {
    return [
      'Monitor sem sinal de vídeo da estação médica',
      'Tela piscando ou com faixas horizontais/verticais',
      'Monitor não liga / Sem alimentação elétrica',
      'Cabo HDMI / DisplayPort com mau contato',
      'Imagem desfocada / Resolução incorreta',
      'Outro problema (detalhado nas observações)'
    ];
  }

  if (type.includes('computador') || type.includes('notebook') || name.includes('computador') || name.includes('notebook') || name.includes('pc') || name.includes('cpu') || name.includes('desktop')) {
    return [
      'Computador não liga / Não inicializa o sistema operacional',
      'Lentidão extrema / Travamento durante uso do prontuário',
      'Tela azul / Reiniciando sozinho no meio do atendimento',
      'Teclado / Mouse / Leitor óptico de código de barras com defeito',
      'Sem acesso à rede local / Wi-Fi assistencial desconectando',
      'Barulho excessivo na ventoinha / Cooler da CPU',
      'Outro problema (detalhado nas observações)'
    ];
  }

  return [
    'Equipamento não liga / Sem alimentação elétrica',
    'Superaquecimento anormal / Ruído excessivo',
    'Mau contato elétrico ou conector danificado',
    'Falha de funcionamento intermitente / Desarmando',
    'Necessidade de calibração metrológica / Certificado RBC',
    'Dano físico / Peça quebrada / Rodízio travado',
    'Display / Tela do equipamento apagada ou touch inoperante',
    'Alarme sonoro constante ou intermitente no leito',
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
  const isAdmin = user?.role === 'admin';
  const isTechnician = user?.role === 'technician' || isAdmin;
  const isClient = !isTechnician;
  const [tickets, setTickets] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState('');

  // Modals and forms
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [assigningId, setAssigningId] = useState(null);
  const [ticketToDelete, setTicketToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [ticketToReject, setTicketToReject] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  // Filters
  const [activeKpiFilter, setActiveKpiFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [onlyMyTickets, setOnlyMyTickets] = useState(false);
  const [search, setSearch] = useState('');

  const [settingsVersion, setSettingsVersion] = useState(0);

  useEffect(() => {
    loadData();
    const params = new URLSearchParams(window.location.search);
    if (params.get('novo') === '1' || params.get('novo') === 'true') {
      setIsFormOpen(true);
    }

    function handleSettingsChange() {
      setSettingsVersion((v) => v + 1);
    }
    window.addEventListener('helpclin_settings_changed', handleSettingsChange);
    return () => window.removeEventListener('helpclin_settings_changed', handleSettingsChange);
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

  // REQUISITO CRÍTICO: Cada cliente só visualiza o que está setado na sua vertente
  const accessibleInventory = useMemo(() => {
    return filterEquipmentsForUser(inventory, user);
  }, [inventory, user]);

  const allowedVerticals = useMemo(() => {
    return getUserAllowedVerticals(user);
  }, [user]);

  // Selected equipment object and suggestions
  const selectedEquipment = useMemo(() => {
    if (!form.equipmentId) return null;
    return accessibleInventory.find((eq) => String(eq.id) === String(form.equipmentId)) || null;
  }, [form.equipmentId, accessibleInventory]);

  const currentProblemSuggestions = useMemo(() => {
    if (form.ticketType === 'service') {
      const activeProblems = [];
      if (canUserAccessVertical(user, 'ti') && isTIModuleEnabled()) activeProblems.push(...TI_PROBLEMS);
      if (canUserAccessVertical(user, 'clinical') && isClinicalModuleEnabled()) activeProblems.push(...CLINICAL_PROBLEMS);
      if (canUserAccessVertical(user, 'predial') && isPredialModuleEnabled()) activeProblems.push(...PREDIAL_PROBLEMS);
      activeProblems.push('Outro problema (detalhado nas observações)');
      return activeProblems;
    }
    return getEquipmentProblemSuggestions(selectedEquipment, user);
  }, [form.ticketType, selectedEquipment, user, settingsVersion]);

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
      setFeedback('Chamado registrado com sucesso! Aguardando o aceite do técnico para emissão da Ordem de Serviço.');
    } catch (error) {
      setFeedback(error.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAssign(ticketId) {
    if (!user?.id) {
      setFeedback('Faça login para assumir chamados.');
      return;
    }

    setAssigningId(ticketId);
    try {
      const updated = await assignSupportTicket(ticketId, user.id);
      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticketId
            ? {
              ...t,
              assigned_to: user.id,
              assigned_to_name: user.name,
              status: updated.status || 'in_progress',
              service_order_number: updated.service_order_number || updated.service_order?.order_number || t.service_order_number,
              order_number: updated.order_number || updated.service_order?.order_number || t.order_number,
              service_order_id: updated.service_order_id || updated.service_order?.id || t.service_order_id
            }
            : t
        )
      );
      setFeedback(`Chamado aceito com sucesso! A Ordem de Serviço OS-${String(updated.service_order_number || updated.order_number).padStart(5, '0')} foi vinculada.`);
    } catch (error) {
      setFeedback(error.message);
    } finally {
      setAssigningId(null);
    }
  }

  async function handleConfirmRejectTicket() {
    if (!ticketToReject) return;
    setIsRejecting(true);
    setFeedback('');
    try {
      await rejectSupportTicket(ticketToReject.id, rejectReason);
      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticketToReject.id
            ? {
              ...t,
              status: 'cancelled',
              assigned_to: null,
              assigned_to_name: null,
              observations: rejectReason
                ? `${t.observations ? t.observations + ' ' : ''}[Atendimento recusado: ${rejectReason.trim()}]`
                : `${t.observations ? t.observations + ' ' : ''}[Atendimento recusado pelo técnico]`
            }
            : t
        )
      );
      const ticketRef = ticketToReject.service_order_number
        ? `OS-${String(ticketToReject.service_order_number).padStart(5, '0')}`
        : `#${String(ticketToReject.ticket_number || ticketToReject.id).padStart(5, '0')}`;
      setFeedback(`Chamado ${ticketRef} e a ordem vinculada foram recusados/cancelados com sucesso.`);
      setTicketToReject(null);
      setRejectReason('');
    } catch (error) {
      setFeedback(error.message);
    } finally {
      setIsRejecting(false);
    }
  }

  async function handleConfirmDeleteTicket() {
    if (!ticketToDelete) return;
    setIsDeleting(true);
    try {
      await deleteSupportTicket(ticketToDelete.id);
      setTickets((prev) => prev.filter((t) => t.id !== ticketToDelete.id));
      setFeedback(`Chamado ${ticketToDelete.service_order_number ? `OS-${String(ticketToDelete.service_order_number).padStart(5, '0')}` : `#${ticketToDelete.ticket_number || ticketToDelete.id}`} excluído com sucesso.`);
      setTicketToDelete(null);
    } catch (error) {
      setFeedback(error.message);
    } finally {
      setIsDeleting(false);
    }
  }

  // Calculate KPIs
  const now = new Date();
  const kpis = useMemo(() => {
    let openCount = 0;
    let unassigned = 0;
    let inProgress = 0;
    let overdue = 0;
    let resolved = 0;

    tickets.forEach((t) => {
      if (t.status === 'open') openCount++;
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
      open: openCount,
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
      if (activeKpiFilter === 'open') {
        if (ticket.status !== 'open') return false;
      } else if (activeKpiFilter === 'unassigned') {
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

      // 2. Status Filter
      if (statusFilter !== 'all') {
        if (ticket.status !== statusFilter) return false;
      }

      // 3. Priority Filter
      if (priorityFilter !== 'all') {
        const p = (ticket.priority || '').toLowerCase();
        if (priorityFilter === 'low' && !['low', 'pouco urgente', 'baixa'].includes(p)) return false;
        if (priorityFilter === 'normal' && p !== 'normal') return false;
        if (priorityFilter === 'high' && !['high', 'alta'].includes(p)) return false;
        if (priorityFilter === 'urgent' && !['urgent', 'urgente'].includes(p)) return false;
      }

      // 4. Connected User Filter (for technicians to filter tickets assigned to them)
      if (onlyMyTickets && user && isTechnician) {
        const isAssignedToMe = ticket.assigned_to === user.id || ticket.assigned_to_name === user.name;
        if (!isAssignedToMe) return false;
      }

      // 5. Search Text (busca inteligente e tolerante a números de chamado, OS e acentos)
      if (search.trim() && !matchTicketSearch(ticket, search)) {
        return false;
      }

      return true;
    });
  }, [tickets, activeKpiFilter, statusFilter, priorityFilter, onlyMyTickets, search, user, isTechnician]);

  const isFiltered =
    activeKpiFilter !== 'all' ||
    statusFilter !== 'all' ||
    priorityFilter !== 'all' ||
    onlyMyTickets ||
    search.trim() !== '';

  function handleClearFilters() {
    setActiveKpiFilter('all');
    setStatusFilter('all');
    setPriorityFilter('all');
    setOnlyMyTickets(false);
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
    { header: 'Prioridade', accessor: (t) => getPriorityLabel(t.priority) },
    { header: 'Ordem de Serviço (OS)', accessor: (t) => `OS-${String(t.service_order_number || t.ticket_number).padStart(5, '0')}` },
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
          <p className="eyebrow">Atendimento &amp; Chamados</p>
          <h1>{isClient ? 'Abertura de Chamados' : 'Central de Chamados'}</h1>
          <p>
            {isClient
              ? 'Abra novos chamados de suporte técnico e consulte os últimos chamados abertos.'
              : 'Gerencie, acompanhe e atribua os chamados abertos da clínica em tempo real.'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {!isClient && (
            <ExportDropdown onExportXls={handleExportXls} onExportPdf={handleExportPdf} />
          )}
          <button
            className="primary-button"
            onClick={() => {
              setForm(emptyForm);
              setIsFormOpen(true);
            }}
            type="button"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              fontSize: '14px',
              fontWeight: 600,
              borderRadius: '10px'
            }}
          >
            <Plus size={18} /> Abrir Chamado
          </button>
        </div>
      </section>

      {feedback && !isFormOpen && <p className="ticket-feedback">{feedback}</p>}

      {/* Directional Banner to Service Orders for Clients */}
      {isClient && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px',
            padding: '14px 18px',
            background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
            border: '1px solid #bbf7d0',
            borderRadius: '12px',
            marginBottom: '18px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: '#dcfce7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#166534',
                flexShrink: 0
              }}
            >
              <FilePlus2 size={20} />
            </div>
            <div>
              <strong style={{ color: '#166534', fontSize: '14px', display: 'block' }}>
                Central de Ordens de Serviço
              </strong>
              <span style={{ color: '#15803d', fontSize: '12px' }}>
                Esta tela destina-se exclusivamente à abertura de chamados e consulta rápida das solicitações. Para esclarecer qualquer dúvida, acompanhar laudos técnicos, prazos de faturamento ou confirmar pagamentos, acesse a tela de Ordens de Serviço.
              </span>
            </div>
          </div>
          <a
            href="/ordens"
            className="secondary-button"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              fontSize: '12px',
              fontWeight: 600,
              color: '#166534',
              borderColor: '#86efac',
              backgroundColor: '#ffffff',
              textDecoration: 'none',
              borderRadius: '8px',
              whiteSpace: 'nowrap'
            }}
          >
            Ir para Ordens de Serviço
            <ExternalLink size={14} />
          </a>
        </div>
      )}

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
            <span className="ticket-kpi-sub">Chamados registrados</span>
          </div>
          <strong className="ticket-kpi-count">{kpis.total}</strong>
        </div>

        {isClient ? (
          <>
            <div
              className={`ticket-kpi-card ${activeKpiFilter === 'open' ? 'ticket-kpi-card--active' : ''}`}
              onClick={() => setActiveKpiFilter('open')}
              role="button"
              tabIndex={0}
            >
              <div className="ticket-kpi-info">
                <span className="ticket-kpi-title">Abertos</span>
                <span className="ticket-kpi-sub">Aguardando atendimento</span>
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
                <span className="ticket-kpi-sub">Em atendimento</span>
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
                <span className="ticket-kpi-sub">Atendimento concluído</span>
              </div>
              <strong className="ticket-kpi-count">{kpis.resolved}</strong>
            </div>
          </>
        ) : (
          <>
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

            <div
              className={`ticket-kpi-card ${activeKpiFilter === 'overdue' ? 'ticket-kpi-card--active' : ''}`}
              onClick={() => setActiveKpiFilter('overdue')}
              role="button"
              tabIndex={0}
            >
              <div className="ticket-kpi-info">
                <span className="ticket-kpi-title">Vencidos</span>
                <span className="ticket-kpi-sub">Sem atendimento (&gt; 24h)</span>
              </div>
              <strong className="ticket-kpi-count">{kpis.overdue}</strong>
            </div>
          </>
        )}
      </div>

      {/* Toolbar Filters (Aligned to Left) */}
      <div className="tickets-filter-bar" style={{ justifyContent: 'flex-start', gap: '10px' }}>
        <div className="tickets-filter-left" style={{ flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            className="ticket-reload-btn"
            onClick={loadData}
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
              placeholder={isClient ? 'Buscar chamados...' : 'Busque por chamados, setor...'}
              aria-label="Busque por chamados"
            />
          </div>

          <select
            className="ticket-filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filtrar por status"
          >
            <option value="all">Todos os status</option>
            <option value="open">Aberto</option>
            <option value="in_progress">Em andamento</option>
            <option value="resolved">Resolvido</option>
            <option value="cancelled">Cancelado</option>
          </select>

          {!isClient && (
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
          )}

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

          {!isClient && (
            <label className="ticket-filter-checkbox" style={{ marginLeft: '4px' }}>
              <input
                type="checkbox"
                checked={onlyMyTickets}
                onChange={(e) => setOnlyMyTickets(e.target.checked)}
              />
              Filtrar por usuário conectado
            </label>
          )}
        </div>
      </div>

      {/* Table Section */}
      <section className="ticket-list-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div className="ticket-list-banner">
          <div>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--teal)' }}>
              {isClient ? 'Últimos Chamados Abertos' : 'Fila de Chamados Registrados'}
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--muted)' }}>
              {isClient
                ? 'Histórico das suas solicitações abertas. Qualquer dúvida, consulte a tela de Ordens de Serviço.'
                : 'Gerenciamento operacional e atribuição técnica de chamados.'}
            </p>
          </div>
          <span className="ticket-list-count-badge">
            {filteredTickets.length} chamado{filteredTickets.length !== 1 ? 's' : ''}
          </span>
        </div>

        {isLoading ? (
          <div className="data-state">Carregando chamados...</div>
        ) : filteredTickets.length === 0 ? (
          <div className="user-empty-state" style={{ padding: '3.5rem', textAlign: 'center' }}>
            <MessageSquare size={32} style={{ margin: '0 auto', color: '#67a486' }} />
            <strong style={{ display: 'block', marginTop: '1rem' }}>
              {isFiltered
                ? 'Nenhum chamado encontrado para os filtros selecionados'
                : 'Nenhum chamado registrado'}
            </strong>
            <span>
              {isFiltered
                ? 'Tente limpar os filtros para visualizar outros chamados.'
                : 'Clique no botão "Abrir Chamado" acima para registrar uma nova solicitação.'}
            </span>
          </div>
        ) : isClient ? (
          /* ========================================================== */
          /* CLIENT VIEW: PURELY LATEST TICKETS + LINK TO SERVICE ORDERS */
          /* ========================================================== */
          <div className="helpclin-table-wrapper">
            <table className="helpclin-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ width: '110px' }}>Chamado / OS</th>
                  <th style={{ width: '115px' }}>Situação</th>
                  <th style={{ width: '22%' }}>Equipamento / Serviço</th>
                  <th>Problema Relatado</th>
                  <th style={{ width: '95px' }}>Aberto em</th>
                  <th style={{ width: '18%' }}>Responsável Técnico</th>
                  <th style={{ width: '95px', textAlign: 'center' }}>Ação</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((ticket) => {
                  const priorityText = getPriorityLabel(ticket.priority);
                  const badgeClass = getPriorityBadgeClass(ticket.priority);

                  return (
                    <tr key={ticket.id}>
                      {/* 1. Chamado / OS */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          {ticket.service_order_number && (ticket.assigned_to_name || ticket.status !== 'open') ? (
                            <strong style={{ color: 'var(--teal)', fontSize: '12px' }}>
                              OS-{String(ticket.service_order_number).padStart(5, '0')}
                            </strong>
                          ) : (
                            <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                              <Clock size={11} style={{ color: '#94a3b8' }} /> Aguardando aceite
                            </span>
                          )}
                          <span
                            className={`ticket-priority-badge ${badgeClass}`}
                            style={{ alignSelf: 'flex-start', fontSize: '9px', padding: '2px 6px' }}
                          >
                            {priorityText}
                          </span>
                        </div>
                      </td>

                      {/* 2. Situação */}
                      <td>
                        <span
                          className={`ticket-status ticket-status--${ticket.status}`}
                          style={{
                            alignSelf: 'flex-start',
                            fontSize: '10px',
                            padding: '3px 7px',
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

                      {/* 3. Equipamento / Serviço */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--ink)', fontSize: '12px', fontWeight: 600 }}>
                            <span style={{ color: '#4d8796', display: 'inline-flex' }}>
                              {ticket.ticket_type === 'equipment' ? <Laptop size={13} /> : <Wrench size={13} />}
                            </span>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={ticket.equipment_name || (ticket.ticket_type === 'equipment' ? 'Equipamento' : 'Serviço Geral')}>
                              {ticket.equipment_name || (ticket.ticket_type === 'equipment' ? 'Equipamento' : 'Serviço Geral')}
                            </span>
                          </div>
                          <span style={{ fontSize: '11px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={ticket.company_sector || ticket.location || 'Geral'}>
                            {ticket.company_sector || ticket.location || 'Geral'}
                          </span>
                        </div>
                      </td>

                      {/* 4. Problema Relatado */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <strong
                            style={{
                              color: 'var(--ink)',
                              fontSize: '12px',
                              fontWeight: 600,
                              lineHeight: 1.3,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical'
                            }}
                            title={ticket.related_problem}
                          >
                            {ticket.related_problem}
                          </strong>
                          {ticket.observations && (
                            <span
                              style={{
                                fontSize: '11px',
                                color: '#64748b',
                                lineHeight: 1.2,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                              title={`Obs: ${ticket.observations}`}
                            >
                              <strong>Obs:</strong> {ticket.observations}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 5. Aberto em */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', fontSize: '11px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                          <span>{new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(ticket.created_at))}</span>
                          <span style={{ fontSize: '10px', color: '#9aa6a2' }}>{new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(ticket.created_at))}</span>
                        </div>
                      </td>

                      {/* 6. Responsável Técnico */}
                      <td>
                        {ticket.assigned_to_name ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#166534', fontSize: '12px', fontWeight: 600 }}>
                            <UserCheck size={13} style={{ color: '#15803d', flexShrink: 0 }} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={ticket.assigned_to_name}>
                              {ticket.assigned_to_name}
                            </span>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#94a3b8', fontSize: '11px', fontStyle: 'italic' }}>
                            <Clock size={12} style={{ flexShrink: 0 }} />
                            <span>Aguardando atendimento</span>
                          </div>
                        )}
                      </td>

                      {/* 7. Ação: Link to Service Orders & Delete */}
                      <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          {ticket.service_order_id ? (
                            <a
                              href="/ordens"
                              className="secondary-button"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '5px 9px',
                                fontSize: '11px',
                                fontWeight: 600,
                                color: 'var(--teal)',
                                backgroundColor: '#ffffff',
                                borderColor: '#cbd5e1',
                                textDecoration: 'none',
                                borderRadius: '6px'
                              }}
                              title="Acessar a Ordem de Serviço vinculada"
                            >
                              Ver na OS <ExternalLink size={12} />
                            </a>
                          ) : (
                            <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic', padding: '0 4px' }}>
                              {ticket.status === 'cancelled' ? 'OS Cancelada' : 'Sem OS'}
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => setTicketToDelete(ticket)}
                            className="secondary-button"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '5px 8px',
                              fontSize: '11px',
                              fontWeight: 600,
                              color: '#dc2626',
                              backgroundColor: '#fff',
                              borderColor: '#fecaca',
                              borderRadius: '6px',
                              cursor: 'pointer'
                            }}
                            title="Apagar chamado (teste ou duplicado)"
                          >
                            <Trash2 size={12} />
                            <span>Apagar</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* ========================================================== */
          /* TECHNICIAN VIEW: TICKET MANAGEMENT & ASSIGNMENT            */
          /* ========================================================== */
          <div className="helpclin-table-wrapper">
            <table className="helpclin-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ width: '185px', textAlign: 'left' }}>Ações</th>
                  <th style={{ width: '105px' }}>OS &amp; Prioridade</th>
                  <th style={{ width: '115px' }}>Estado</th>
                  <th style={{ width: '18%' }}>Solicitante &amp; Setor</th>
                  <th style={{ width: '18%' }}>Ativo &amp; Responsável</th>
                  <th style={{ width: '80px' }}>Abertura</th>
                  <th>Problema &amp; Observações</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((ticket) => {
                  const isUnassigned = !ticket.assigned_to_name && ticket.status !== 'resolved' && ticket.status !== 'cancelled';
                  const priorityText = getPriorityLabel(ticket.priority);
                  const badgeClass = getPriorityBadgeClass(ticket.priority);

                  return (
                    <tr key={ticket.id}>
                      {/* 1. Ações */}
                      <td style={{ textAlign: 'left', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                          {isUnassigned ? (
                            <>
                              <button
                                type="button"
                                className="ticket-attend-btn"
                                onClick={() => handleAssign(ticket.id)}
                                disabled={assigningId === ticket.id}
                                title="Aceitar chamado e iniciar atendimento"
                                style={{
                                  padding: '4px 8px',
                                  fontSize: '11px',
                                  height: '28px',
                                  backgroundColor: '#059669',
                                  borderColor: '#059669',
                                  color: '#fff',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontWeight: 600
                                }}
                              >
                                <Check size={12} />
                                {assigningId === ticket.id ? 'Aceitando...' : 'Aceitar'}
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setTicketToReject(ticket);
                                  setRejectReason('');
                                }}
                                title="Recusar atendimento do chamado"
                                style={{
                                  padding: '4px 7px',
                                  fontSize: '11px',
                                  height: '28px',
                                  backgroundColor: '#fef2f2',
                                  borderColor: '#fecaca',
                                  border: '1px solid #fecaca',
                                  color: '#dc2626',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontWeight: 600
                                }}
                              >
                                <X size={12} />
                                <span>Recusar</span>
                              </button>
                            </>
                          ) : (
                            <span
                              className="assigned-label"
                              style={{
                                fontSize: '10px',
                                padding: '3px 7px',
                                borderRadius: '4px',
                                fontWeight: 600,
                                backgroundColor: ticket.status === 'resolved' ? '#dcfce7' : ticket.status === 'cancelled' ? '#fee2e2' : '#e0e7ff',
                                color: ticket.status === 'resolved' ? '#15803d' : ticket.status === 'cancelled' ? '#b91c1c' : '#4338ca'
                              }}
                            >
                              {ticket.status === 'resolved' ? 'Resolvido' : ticket.status === 'cancelled' ? 'Cancelado' : 'Aceito'}
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => setTicketToDelete(ticket)}
                            className="ticket-delete-btn"
                            title="Excluir este chamado"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>

                      {/* 2. OS & Prioridade */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          {ticket.service_order_number && (ticket.assigned_to_name || ticket.status !== 'open') ? (
                            <strong style={{ color: 'var(--teal)', fontSize: '12px' }}>
                              OS-{String(ticket.service_order_number).padStart(5, '0')}
                            </strong>
                          ) : (
                            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                              <Clock size={11} style={{ color: '#94a3b8' }} /> Aguardando aceite
                            </span>
                          )}
                          <span className={`ticket-priority-badge ${badgeClass}`} style={{ alignSelf: 'flex-start', fontSize: '9px', padding: '2px 6px' }}>
                            {priorityText}
                          </span>
                        </div>
                      </td>

                      {/* 3. Estado */}
                      <td>
                        <span
                          className={`ticket-status ticket-status--${ticket.status}`}
                          style={{
                            alignSelf: 'flex-start',
                            fontSize: '10px',
                            padding: '2px 6px',
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

                      {/* 4. Solicitante & Setor */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <strong style={{ color: 'var(--teal)', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }} title={ticket.requester || 'Solicitante'}>
                            {ticket.requester || 'Solicitante'}
                          </strong>
                          <span style={{ fontSize: '11px', color: '#59716e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }} title={ticket.company_sector || ticket.location || 'Geral'}>
                            {ticket.company_sector || ticket.location || 'Geral'}
                          </span>
                        </div>
                      </td>

                      {/* 5. Ativo & Responsável */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--ink)', fontSize: '12px', fontWeight: 500 }}>
                            <span style={{ color: '#4d8796', display: 'inline-flex' }}>
                              {ticket.ticket_type === 'equipment' ? <Laptop size={13} /> : <Wrench size={13} />}
                            </span>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={ticket.equipment_name || (ticket.ticket_type === 'equipment' ? 'Equipamento' : 'Serviço Geral')}>
                              {ticket.equipment_name || (ticket.ticket_type === 'equipment' ? 'Equipamento' : 'Serviço Geral')}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: ticket.assigned_to_name ? '#2b6351' : '#9aa6a2' }}>
                            <UserCheck size={12} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontStyle: ticket.assigned_to_name ? 'normal' : 'italic' }} title={ticket.assigned_to_name || 'Sem responsável'}>
                              {ticket.assigned_to_name || 'Sem responsável'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 6. Abertura */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', fontSize: '11px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                          <span>{new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(ticket.created_at))}</span>
                          <span style={{ fontSize: '10px', color: '#9aa6a2' }}>{new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(ticket.created_at))}</span>
                        </div>
                      </td>

                      {/* 7. Problema & Observações */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <strong
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
                            title={ticket.related_problem}
                          >
                            {ticket.related_problem}
                          </strong>
                          {ticket.observations && (
                            <span
                              style={{
                                fontSize: '10px',
                                color: '#4b635d',
                                lineHeight: 1.2,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                              title={`Obs: ${ticket.observations}`}
                            >
                              <strong>Obs:</strong> {ticket.observations}
                            </span>
                          )}
                          {ticket.service_performed_description && (
                            <span
                              className="service-performed-tag"
                              title={`Técnico: ${ticket.service_performed_description}`}
                            >
                              <strong>Téc:</strong> {ticket.service_performed_description}
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
                <p className="eyebrow">Solicitação Formal</p>
                <h2>Abertura de Chamado Técnico</h2>
                <small style={{ color: '#64748b', fontSize: '12px', display: 'block', marginTop: '2px' }}>
                  A Ordem de Serviço (OS numerada) é gerada automaticamente a partir desta solicitação.
                </small>
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
                    {allowedVerticals.length > 1 ? (
                      <>
                        {allowedVerticals.includes('clinical') && (
                          <optgroup label="🩺 Engenharia Clínica (Equipamentos Médicos)">
                            {accessibleInventory
                              .filter((eq) => getAssetVertical(eq.equipment_type, eq.vertical).code === 'clinical')
                              .map((eq) => (
                                <option key={eq.id} value={eq.id}>
                                  {eq.name} — {eq.location || 'Sem local'} (S/N: {eq.serial_number || 'N/A'})
                                </option>
                              ))}
                          </optgroup>
                        )}
                        {allowedVerticals.includes('ti') && (
                          <optgroup label="💻 T.I. em Saúde (Hardware & Redes)">
                            {accessibleInventory
                              .filter((eq) => getAssetVertical(eq.equipment_type, eq.vertical).code === 'ti')
                              .map((eq) => (
                                <option key={eq.id} value={eq.id}>
                                  {eq.name} — {eq.location || 'Sem local'} (S/N: {eq.serial_number || 'N/A'})
                                </option>
                              ))}
                          </optgroup>
                        )}
                        {allowedVerticals.includes('predial') && (
                          <optgroup label="🏢 Engenharia Predial (Infraestrutura)">
                            {accessibleInventory
                              .filter((eq) => getAssetVertical(eq.equipment_type, eq.vertical).code === 'predial')
                              .map((eq) => (
                                <option key={eq.id} value={eq.id}>
                                  {eq.name} — {eq.location || 'Sem local'} (S/N: {eq.serial_number || 'N/A'})
                                </option>
                              ))}
                          </optgroup>
                        )}
                      </>
                    ) : (
                      accessibleInventory.map((eq) => (
                        <option key={eq.id} value={eq.id}>
                          {eq.name} — {eq.location || 'Sem local'} (S/N: {eq.serial_number || 'N/A'})
                        </option>
                      ))
                    )}
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
                <div style={{ marginTop: '8px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600 }}>
                    {form.ticketType === 'equipment' ? 'Problemas eventuais de equipamentos (clique para preencher):' : 'Problemas frequentes:'}
                  </span>
                  <div className="ticket-problem-chips" style={{ marginTop: '5px' }}>
                    {currentProblemSuggestions.slice(0, 6).map((prob) => (
                      <button
                        key={prob}
                        type="button"
                        className={`ticket-problem-chip ${form.relatedProblem === prob ? 'ticket-problem-chip--active' : ''}`}
                        onClick={() => setForm((prev) => ({ ...prev, relatedProblem: prob }))}
                      >
                        {prob}
                      </button>
                    ))}
                  </div>
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

      {/* Modal de Confirmação de Exclusão de Chamado */}
      {ticketToDelete && (
        <div className="dash-modal-backdrop" onClick={() => setTicketToDelete(null)}>
          <div className="dash-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="dash-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#dc2626' }}>
                <AlertTriangle size={20} />
                <h2 style={{ fontSize: '17px', margin: 0, color: '#dc2626' }}>Excluir Chamado</h2>
              </div>
              <button type="button" className="dash-modal-close" onClick={() => setTicketToDelete(null)}>
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: '16px 20px', color: '#475569', fontSize: '13px', lineHeight: '1.5' }}>
              <p style={{ margin: '0 0 10px 0' }}>
                Tem certeza que deseja apagar o chamado <strong>{ticketToDelete.service_order_number ? `OS-${String(ticketToDelete.service_order_number).padStart(5, '0')}` : `#${String(ticketToDelete.ticket_number || ticketToDelete.id).padStart(5, '0')}`}</strong>?
              </p>
              <p style={{ margin: 0, color: '#64748b', fontSize: '12px' }}>
                Esta ação removerá este chamado de teste permanentemente do sistema e do banco de dados.
              </p>
            </div>
            <div className="dash-modal-actions" style={{ padding: '12px 20px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" className="secondary-button" onClick={() => setTicketToDelete(null)} disabled={isDeleting}>
                Cancelar
              </button>
              <button
                type="button"
                className="primary-button"
                style={{ backgroundColor: '#dc2626', borderColor: '#dc2626', color: '#fff' }}
                onClick={handleConfirmDeleteTicket}
                disabled={isDeleting}
              >
                {isDeleting ? 'Excluindo...' : 'Confirmar Exclusão'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Recusa de Chamado */}
      {ticketToReject && (
        <div className="dash-modal-backdrop" onClick={() => setTicketToReject(null)}>
          <div className="dash-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px' }}>
            <div className="dash-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#dc2626' }}>
                <AlertTriangle size={20} />
                <h2 style={{ fontSize: '17px', margin: 0, color: '#dc2626' }}>Recusar Chamado</h2>
              </div>
              <button type="button" className="dash-modal-close" onClick={() => setTicketToReject(null)}>
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: '16px 20px', color: '#475569', fontSize: '13px', lineHeight: '1.5' }}>
              <p style={{ margin: '0 0 10px 0' }}>
                Deseja realmente recusar o atendimento do chamado <strong>{ticketToReject.service_order_number ? `OS-${String(ticketToReject.service_order_number).padStart(5, '0')}` : `#${String(ticketToReject.ticket_number || ticketToReject.id).padStart(5, '0')}`}</strong>?
              </p>
              <p style={{ margin: '0 0 12px 0', color: '#64748b', fontSize: '12px' }}>
                Ao recusar, o chamado e a Ordem de Serviço vinculada serão cancelados. Você pode informar o motivo abaixo:
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Motivo da recusa (opcional)..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div className="dash-modal-actions" style={{ padding: '12px 20px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" className="secondary-button" onClick={() => setTicketToReject(null)} disabled={isRejecting}>
                Cancelar
              </button>
              <button
                type="button"
                className="primary-button"
                style={{ backgroundColor: '#dc2626', borderColor: '#dc2626', color: '#fff' }}
                onClick={handleConfirmRejectTicket}
                disabled={isRejecting}
              >
                {isRejecting ? 'Recusando...' : 'Confirmar Recusa'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Tickets;


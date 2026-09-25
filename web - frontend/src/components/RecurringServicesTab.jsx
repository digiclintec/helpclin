import {
  AlertTriangle,
  BarChart3,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Edit3,
  ExternalLink,
  Filter,
  Info,
  Laptop,
  Pause,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Sparkles,
  Stethoscope,
  Trash2,
  Wrench,
  X,
  Zap
} from 'lucide-react';
import { Fragment, useEffect, useMemo, useState } from 'react';
import { createServiceOrder, getInventory, getStoredUser } from '../services/api.js';
import {
  VERTICALS,
  canUserAccessVertical,
  filterEquipmentsForUser,
  getUserAllowedVerticals
} from '../utils/verticalUtils.js';

const STORAGE_KEY = 'helpclin_recurring_plans';

const DEFAULT_RECURRING_PLANS = [
  {
    id: 'plan_1',
    title: 'Calibração Anual RBC - Desfibrilador Cardioversor',
    vertical: 'clinical',
    verticalName: 'Engenharia Clínica',
    serviceType: 'Calibração Metrológica RBC',
    equipmentId: '',
    equipmentName: 'Desfibrilador Bifásico Mindray BeneHeart D3',
    equipmentTag: 'EQ-MED-0104',
    sector: 'UTI Geral Adulto - Leito 02',
    periodicity: 'annual',
    periodicityLabel: 'Anual (a cada 12 meses)',
    periodicityDays: 365,
    nextExecutionDate: '2026-10-15',
    lastExecutionDate: '2025-10-15',
    priority: 'Alta',
    technicianName: 'Plantão Engenharia Clínica',
    status: 'active',
    ordersGeneratedCount: 2,
    generatedOrdersHistory: [
      { orderNumber: '10042', date: '2025-10-15', status: 'completed' },
      { orderNumber: '09814', date: '2024-10-14', status: 'completed' }
    ],
    checklist: `1. Inspeção física geral, integridade de pás e cabos
2. Ensaio metrológico de descarga com analisador (10J a 360J)
3. Medição do tempo de recarga até carga máxima (< 5s)
4. Ensaio de corrente de fuga e segurança elétrica (NBR IEC 60601-1)
5. Teste de sincronismo em modo cardioversão com simulador de ECG
6. Emissão de certificado RBC e fixação de selo metrológico com validade`,
    observations: 'Conforme RDC ANVISA nº 509/2013 e manual do fabricante.'
  },
  {
    id: 'plan_2',
    title: 'Manutenção Preventiva Trimestral - Ventiladores de UTI',
    vertical: 'clinical',
    verticalName: 'Engenharia Clínica',
    serviceType: 'Manutenção Preventiva Periódica',
    equipmentId: '',
    equipmentName: 'Ventilador Mecânico Pulmonar Maquet Servo-i',
    equipmentTag: 'EQ-MED-0088',
    sector: 'UTI Neonatal / Pediátrica',
    periodicity: 'quarterly',
    periodicityLabel: 'Trimestral (a cada 3 meses)',
    periodicityDays: 90,
    nextExecutionDate: '2026-10-02',
    lastExecutionDate: '2026-07-02',
    priority: 'Urgente',
    technicianName: 'Plantão Engenharia Clínica',
    status: 'active',
    ordersGeneratedCount: 3,
    generatedOrdersHistory: [
      { orderNumber: '10055', date: '2026-07-02', status: 'completed' }
    ],
    checklist: `1. Troca preventiva do diafragma da válvula expiratória
2. Calibração da célula galvânica de O2 e sensor de fluxo ultrassônico
3. Autoteste pré-uso de vazamento do circuito respiratório
4. Teste de autonomia da bateria interna em modo ventilação
5. Limpeza e assepsia dos filtros de ar de entrada`,
    observations: 'Equipamento crítico de suporte à vida.'
  },
  {
    id: 'plan_3',
    title: 'Inspeção Mensal e Teste com Carga - Grupo Gerador',
    vertical: 'predial',
    verticalName: 'Engenharia Predial',
    serviceType: 'Inspeção de Rotina & Teste de Carga',
    equipmentId: '',
    equipmentName: 'Grupo Moto-Gerador Stemac 500kVA QTA',
    equipmentTag: 'EQ-PRED-0012',
    sector: 'Subestação Principal / Casa de Força',
    periodicity: 'monthly',
    periodicityLabel: 'Mensal (a cada 30 dias)',
    periodicityDays: 30,
    nextExecutionDate: '2026-10-05',
    lastExecutionDate: '2026-09-05',
    priority: 'Alta',
    technicianName: 'Plantão Engenharia Predial',
    status: 'active',
    ordersGeneratedCount: 5,
    generatedOrdersHistory: [
      { orderNumber: '10061', date: '2026-09-05', status: 'completed' }
    ],
    checklist: `1. Checagem do nível de óleo lubrificante e líquido de arrefecimento
2. Medição da tensão e densidade do banco de baterias de partida
3. Teste de partida automática com simulação de queda de rede
4. Comutação do quadro QTA e operação sob carga assistencial por 30 min
5. Verificação de vazamento de diesel e registro no livro de bordo`,
    observations: 'Exigência da NBR 13534 e plano de contingência hospitalar.'
  },
  {
    id: 'plan_4',
    title: 'PMOC Semestral - Sistema de Climatização e Filtros HEPA',
    vertical: 'predial',
    verticalName: 'Engenharia Predial',
    serviceType: 'Plano de Manutenção, Operação e Controle (PMOC)',
    equipmentId: '',
    equipmentName: 'Central Chiller / Fan Coil Bloco Cirúrgico',
    equipmentTag: 'EQ-PRED-0034',
    sector: 'Centro Cirúrgico Central',
    periodicity: 'semiannual',
    periodicityLabel: 'Semestral (a cada 6 meses)',
    periodicityDays: 180,
    nextExecutionDate: '2026-11-20',
    lastExecutionDate: '2026-05-20',
    priority: 'Normal',
    technicianName: 'Equipe HVAC / PMOC',
    status: 'active',
    ordersGeneratedCount: 1,
    generatedOrdersHistory: [
      { orderNumber: '10029', date: '2026-05-20', status: 'completed' }
    ],
    checklist: `1. Troca preventiva dos pré-filtros G4 e filtros finos F8
2. Ensaio de estanqueidade e integridade dos filtros absolutos HEPA
3. Medição de vazão de ar e pressão positiva diferencial das salas cirúrgicas
4. Higienização das serpentinas e bandejas com biocida autorizado ANVISA
5. Coleta de amostras de ar para análise microbiológica laboratorial`,
    observations: 'Conforme Portaria MS 3.523/1998 e Resolução RE nº 09/ANVISA.'
  },
  {
    id: 'plan_5',
    title: 'Manutenção Preventiva Semestral - Bombas de Infusão',
    vertical: 'clinical',
    verticalName: 'Engenharia Clínica',
    serviceType: 'Manutenção Preventiva Periódica',
    equipmentId: '',
    equipmentName: 'Bomba de Infusão Universal Samtronic ST550',
    equipmentTag: 'EQ-MED-0120',
    sector: 'Centro de Terapia Intensiva (CTI)',
    periodicity: 'semiannual',
    periodicityLabel: 'Semestral (a cada 6 meses)',
    periodicityDays: 180,
    nextExecutionDate: '2026-10-30',
    lastExecutionDate: '2026-04-30',
    priority: 'Normal',
    technicianName: 'Plantão Engenharia Clínica',
    status: 'active',
    ordersGeneratedCount: 2,
    generatedOrdersHistory: [],
    checklist: `1. Limpeza do mecanismo de tracionamento peristáltico
2. Ensaio de precisão de vazão em ml/h com balança analítica
3. Teste de alarme de oclusão proximal e distal (pressão de corte)
4. Teste de detecção de bolha de ar na linha de infusão
5. Teste de autonomia de bateria contínua`,
    observations: 'Garantia de segurança na administração de drogas vasoativas.'
  },
  {
    id: 'plan_6',
    title: 'Inspeção Trimestral - Servidores e No-breaks do Data Center',
    vertical: 'ti',
    verticalName: 'T.I. em Saúde',
    serviceType: 'Manutenção Preventiva de Hardware',
    equipmentId: '',
    equipmentName: 'Rack de Servidores Dell PowerEdge / No-break APC 10kVA',
    equipmentTag: 'EQ-TI-0005',
    sector: 'CPD / Data Center Central',
    periodicity: 'quarterly',
    periodicityLabel: 'Trimestral (a cada 3 meses)',
    periodicityDays: 90,
    nextExecutionDate: '2026-10-10',
    lastExecutionDate: '2026-07-10',
    priority: 'Alta',
    technicianName: 'Infraestrutura & Redes TI',
    status: 'active',
    ordersGeneratedCount: 2,
    generatedOrdersHistory: [],
    checklist: `1. Inspeção de integridade física dos discos RAID nos servidores
2. Limpeza física de poeira nos módulos de ventilação do rack
3. Teste de autonomia do no-break de alimentação dos servidores do PEP
4. Verificação de temperatura e umidade da sala do CPD
5. Validação de rotinas de backup físico e conexões de fibra óptica`,
    observations: 'Ambiente de alta disponibilidade para prontuário eletrônico hospitalar.'
  }
];

function calculateNextExecutionDate(currentDateStr, periodicity) {
  const base = currentDateStr ? new Date(currentDateStr) : new Date();
  const d = isNaN(base.getTime()) ? new Date() : new Date(base);

  switch (periodicity) {
    case 'monthly':
      d.setMonth(d.getMonth() + 1);
      break;
    case 'bimonthly':
      d.setMonth(d.getMonth() + 2);
      break;
    case 'quarterly':
      d.setMonth(d.getMonth() + 3);
      break;
    case 'semiannual':
      d.setMonth(d.getMonth() + 6);
      break;
    case 'annual':
      d.setFullYear(d.getFullYear() + 1);
      break;
    case 'biannual':
      d.setFullYear(d.getFullYear() + 2);
      break;
    default:
      d.setMonth(d.getMonth() + 3);
  }
  return d.toISOString().split('T')[0];
}

function getPeriodicityLabel(periodicity) {
  switch (periodicity) {
    case 'monthly':
      return 'Mensal (a cada 30 dias)';
    case 'bimonthly':
      return 'Bimestral (a cada 60 dias)';
    case 'quarterly':
      return 'Trimestral (a cada 3 meses)';
    case 'semiannual':
      return 'Semestral (a cada 6 meses)';
    case 'annual':
      return 'Anual (a cada 12 meses)';
    case 'biannual':
      return 'Bianual (a cada 24 meses)';
    default:
      return 'Personalizada';
  }
}

function getDaysRemaining(nextDateStr) {
  if (!nextDateStr) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(nextDateStr + 'T00:00:00');
  if (isNaN(target.getTime())) return null;
  const diffTime = target.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function formatDateBr(dateStr) {
  if (!dateStr) return '—';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return new Intl.DateTimeFormat('pt-BR').format(d);
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const MONTH_SHORT = [
  'JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN',
  'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'
];

/**
 * Retorna a lista de meses (0 a 11) do ano em que o plano recorrente tem execução programada.
 */
function getPlanScheduledMonths(plan, targetYear = 2026) {
  if (!plan?.nextExecutionDate) return [];

  const parts = String(plan.nextExecutionDate).split('-');
  const execYear = parseInt(parts[0], 10);
  const execMonth = parseInt(parts[1], 10) - 1; // 0-indexed

  const periodicity = plan.periodicity || 'annual';
  const scheduledMonths = new Set();
  const base = isNaN(execMonth) ? 0 : execMonth;

  if (periodicity === 'monthly') {
    for (let m = 0; m < 12; m++) scheduledMonths.add(m);
  } else if (periodicity === 'bimonthly') {
    for (let m = 0; m < 12; m++) {
      if (Math.abs(m - base) % 2 === 0) scheduledMonths.add(m);
    }
  } else if (periodicity === 'quarterly') {
    for (let m = 0; m < 12; m++) {
      if (Math.abs(m - base) % 3 === 0) scheduledMonths.add(m);
    }
  } else if (periodicity === 'semiannual') {
    for (let m = 0; m < 12; m++) {
      if (Math.abs(m - base) % 6 === 0) scheduledMonths.add(m);
    }
  } else if (periodicity === 'annual') {
    if (!isNaN(execMonth)) scheduledMonths.add(execMonth);
  } else if (periodicity === 'biannual') {
    if (isNaN(execYear) || execYear === targetYear) {
      if (!isNaN(execMonth)) scheduledMonths.add(execMonth);
    }
  } else {
    if (!isNaN(execMonth)) scheduledMonths.add(execMonth);
  }

  return Array.from(scheduledMonths).sort((a, b) => a - b);
}

export default function RecurringServicesTab() {
  const user = getStoredUser();
  const isAdmin = user?.role === 'admin';
  const isTechnician = user?.role === 'technician' || isAdmin;
  const allowedVerticals = useMemo(() => getUserAllowedVerticals(user), [user]);

  const [plans, setPlans] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [search, setSearch] = useState('');
  const [verticalFilter, setVerticalFilter] = useState(() => {
    return allowedVerticals.length === 1 ? allowedVerticals[0] : 'all';
  });
  const [periodicityFilter, setPeriodicityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Month distribution filter (null or 0..11)
  const [selectedMonthFilter, setSelectedMonthFilter] = useState(null);

  // Expanded rows in list view
  const [expandedPlanIds, setExpandedPlanIds] = useState(new Set());

  // Form modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackType, setFeedbackType] = useState('success'); // 'success' | 'error'

  // History modal
  const [historyModalPlan, setHistoryModalPlan] = useState(null);

  // Form State
  const initialForm = {
    title: '',
    vertical: 'clinical',
    serviceType: 'Calibração Metrológica RBC',
    equipmentId: '',
    equipmentName: '',
    equipmentTag: '',
    sector: '',
    periodicity: 'quarterly',
    nextExecutionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    priority: 'Normal',
    technicianName: user?.name || 'Plantão Técnico',
    checklist: '',
    observations: ''
  };
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    loadPlans();
    loadEquipments();
  }, []);

  function loadPlans() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPlans(parsed);
          return;
        }
      }
      // Seed default
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_RECURRING_PLANS));
      setPlans(DEFAULT_RECURRING_PLANS);
    } catch {
      setPlans(DEFAULT_RECURRING_PLANS);
    }
  }

  async function loadEquipments() {
    try {
      const data = await getInventory();
      if (Array.isArray(data)) setInventory(data);
    } catch {
      // Ignorar caso inventário esteja indisponível
    }
  }

  function savePlans(newPlans) {
    setPlans(newPlans);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPlans));
    } catch (err) {
      console.error('Falha ao persistir planos recorrentes:', err);
    }
  }

  function toggleExpandRow(planId) {
    setExpandedPlanIds((prev) => {
      const next = new Set(prev);
      if (next.has(planId)) {
        next.delete(planId);
      } else {
        next.add(planId);
      }
      return next;
    });
  }

  // Planos acessíveis de acordo com as vertentes contratadas do cliente
  const accessiblePlans = useMemo(() => {
    return plans.filter((plan) => canUserAccessVertical(user, plan.vertical));
  }, [plans, user]);

  // KPIs
  const kpis = useMemo(() => {
    let activeCount = 0;
    let next30DaysCount = 0;
    let calibrationCount = 0;
    let totalGeneratedOrders = 0;

    accessiblePlans.forEach((p) => {
      if (p.status === 'active') activeCount++;
      const days = getDaysRemaining(p.nextExecutionDate);
      if (days !== null && days >= 0 && days <= 30 && p.status === 'active') {
        next30DaysCount++;
      }
      if (p.serviceType?.toLowerCase().includes('calibra')) {
        calibrationCount++;
      }
      totalGeneratedOrders += p.ordersGeneratedCount || 0;
    });

    return {
      activeCount,
      next30DaysCount,
      calibrationCount,
      totalGeneratedOrders
    };
  }, [accessiblePlans]);

  // Monthly stats for the annual distribution chart (Exercício 2026)
  const monthlyStats = useMemo(() => {
    const targetPlans = accessiblePlans.filter((plan) => {
      if (verticalFilter !== 'all' && plan.vertical !== verticalFilter) return false;
      if (statusFilter !== 'all' && plan.status !== statusFilter) return false;
      return true;
    });

    const currentMonthIdx = new Date().getMonth();

    const months = Array.from({ length: 12 }, (_, monthIdx) => {
      const plansInMonth = targetPlans.filter((plan) =>
        getPlanScheduledMonths(plan, 2026).includes(monthIdx)
      );

      let calibrationCount = 0;
      let preventiveCount = 0;
      let predialCount = 0;
      let tiCount = 0;

      plansInMonth.forEach((p) => {
        const st = (p.serviceType || '').toLowerCase();
        if (st.includes('calibra')) {
          calibrationCount++;
        } else if (p.vertical === 'predial' || st.includes('pmoc')) {
          predialCount++;
        } else if (p.vertical === 'ti') {
          tiCount++;
        } else {
          preventiveCount++;
        }
      });

      return {
        monthIdx,
        name: MONTH_NAMES[monthIdx],
        shortName: MONTH_SHORT[monthIdx],
        isCurrentMonth: monthIdx === currentMonthIdx,
        plans: plansInMonth,
        total: plansInMonth.length,
        calibrationCount,
        preventiveCount,
        predialCount,
        tiCount
      };
    });

    const totalYearExecutions = months.reduce((acc, m) => acc + m.total, 0);
    const maxMonthCount = Math.max(...months.map((m) => m.total), 1);
    const peakMonth = months.reduce((max, m) => (m.total > max.total ? m : max), months[0]);
    const totalCalibrationsInYear = months.reduce((acc, m) => acc + m.calibrationCount, 0);
    const totalPreventivesInYear = months.reduce((acc, m) => acc + m.preventiveCount, 0);
    const averagePerMonth = (totalYearExecutions / 12).toFixed(1);

    return {
      months,
      totalYearExecutions,
      maxMonthCount,
      peakMonth,
      totalCalibrationsInYear,
      totalPreventivesInYear,
      averagePerMonth,
      currentMonthIdx
    };
  }, [accessiblePlans, verticalFilter, statusFilter]);

  // Filtered plans for the list
  const filteredPlans = useMemo(() => {
    return accessiblePlans.filter((plan) => {
      if (verticalFilter !== 'all' && plan.vertical !== verticalFilter) return false;
      if (periodicityFilter !== 'all' && plan.periodicity !== periodicityFilter) return false;
      if (statusFilter !== 'all' && plan.status !== statusFilter) return false;

      // Filter by selected month from the distribution chart
      if (selectedMonthFilter !== null) {
        const scheduledMonths = getPlanScheduledMonths(plan, 2026);
        if (!scheduledMonths.includes(selectedMonthFilter)) return false;
      }

      if (search.trim()) {
        const q = search.toLowerCase();
        const matchTitle = plan.title?.toLowerCase().includes(q);
        const matchEq = plan.equipmentName?.toLowerCase().includes(q);
        const matchTag = plan.equipmentTag?.toLowerCase().includes(q);
        const matchSector = plan.sector?.toLowerCase().includes(q);
        const matchType = plan.serviceType?.toLowerCase().includes(q);
        if (!matchTitle && !matchEq && !matchTag && !matchSector && !matchType) return false;
      }

      return true;
    });
  }, [accessiblePlans, verticalFilter, periodicityFilter, statusFilter, selectedMonthFilter, search]);

  // Open Form for Create
  function handleOpenCreate() {
    setEditingPlan(null);
    setFormData({
      ...initialForm,
      technicianName: user?.name || 'Técnico Responsável',
      checklist: `1. Inspeção física geral e limpeza técnica
2. Testes de segurança elétrica e funcionalidade
3. Ensaio metrológico / calibração com simulador
4. Emissão de laudo técnico e etiquetagem`
    });
    setIsFormOpen(true);
  }

  // Open Form for Edit
  function handleOpenEdit(plan) {
    setEditingPlan(plan);
    setFormData({
      title: plan.title,
      vertical: plan.vertical || 'clinical',
      serviceType: plan.serviceType,
      equipmentId: plan.equipmentId || '',
      equipmentName: plan.equipmentName || '',
      equipmentTag: plan.equipmentTag || '',
      sector: plan.sector || '',
      periodicity: plan.periodicity || 'quarterly',
      nextExecutionDate: plan.nextExecutionDate || '',
      priority: plan.priority || 'Normal',
      technicianName: plan.technicianName || user?.name || '',
      checklist: plan.checklist || '',
      observations: plan.observations || ''
    });
    setIsFormOpen(true);
  }

  // Handle Equipment Select
  function handleEquipmentChange(eqId) {
    if (!eqId) {
      setFormData((prev) => ({
        ...prev,
        equipmentId: '',
        equipmentName: '',
        equipmentTag: ''
      }));
      return;
    }

    const eq = inventory.find((item) => String(item.id) === String(eqId));
    if (eq) {
      let defaultVertical = 'clinical';
      const t = (eq.equipment_type || '').toLowerCase();
      if (t.includes('gerador') || t.includes('clima') || t.includes('gás') || t.includes('bomba') || t.includes('elétr')) {
        defaultVertical = 'predial';
      } else if (t.includes('computador') || t.includes('impress') || t.includes('servidor') || t.includes('rede')) {
        defaultVertical = 'ti';
      }

      setFormData((prev) => ({
        ...prev,
        equipmentId: String(eq.id),
        equipmentName: eq.name,
        equipmentTag: eq.serial_number ? `SN: ${eq.serial_number}` : `ID #${eq.id}`,
        sector: eq.location || prev.sector,
        vertical: defaultVertical
      }));
    }
  }

  // Suggest Default Checklist based on Service Type
  function handleServiceTypeChange(st) {
    let check = formData.checklist;
    if (st.includes('Calibração')) {
      check = `1. Inspeção física geral, conectores e acessórios
2. Ensaio metrológico com padrões rastreados à RBC
3. Teste de conformidade conforme normas ABNT / NBR IEC
4. Cálculo de incerteza metrológica e aprovação
5. Emissão e fixação do selo de calibração RBC com data de validade`;
    } else if (st.includes('Preventiva')) {
      check = `1. Limpeza interna e externa dos módulos e ventilação
2. Substituição de vedações, filtros e peças de desgaste programado
3. Teste de carga de bateria interna e autonomia
4. Verificação de integridade de cabos e conectores de sinal
5. Autoteste completo do sistema com simulador de paciente`;
    } else if (st.includes('PMOC')) {
      check = `1. Troca de pré-filtros G4 e filtros finos F8
2. Ensaio de estanqueidade e integridade dos filtros HEPA
3. Higienização química de serpentina e bandejas
4. Verificação de pressão diferencial e vazão de ar
5. Medição de ruído e balanceamento de motores ventiladores`;
    } else if (st.includes('Segurança Elétrica')) {
      check = `1. Medição de resistência do condutor de proteção (terra < 0.2 ohms)
2. Medição da corrente de fuga no chassi e peças aplicadas (NBR IEC 60601-1)
3. Ensaio de isolamento da fonte de alimentação
4. Verificação de integridade dos plugues e pinos elétricos
5. Registro fotográfico e emissão de laudo de conformidade elétrica`;
    }

    setFormData((prev) => ({
      ...prev,
      serviceType: st,
      checklist: check
    }));
  }

  // Save Plan
  function handleSavePlan(e) {
    e.preventDefault();
    setIsSaving(true);

    const verticalNames = {
      clinical: 'Engenharia Clínica',
      predial: 'Engenharia Predial',
      ti: 'T.I. em Saúde'
    };

    if (editingPlan) {
      const updated = plans.map((p) => {
        if (p.id === editingPlan.id) {
          return {
            ...p,
            ...formData,
            verticalName: verticalNames[formData.vertical] || 'Engenharia Clínica',
            periodicityLabel: getPeriodicityLabel(formData.periodicity)
          };
        }
        return p;
      });
      savePlans(updated);
      setFeedbackType('success');
      setFeedbackMessage(`Plano "${formData.title}" atualizado com sucesso!`);
    } else {
      const newPlan = {
        id: `plan_${Date.now()}`,
        ...formData,
        verticalName: verticalNames[formData.vertical] || 'Engenharia Clínica',
        periodicityLabel: getPeriodicityLabel(formData.periodicity),
        status: 'active',
        ordersGeneratedCount: 0,
        generatedOrdersHistory: [],
        lastExecutionDate: null,
        createdAt: new Date().toISOString()
      };
      savePlans([newPlan, ...plans]);
      setFeedbackType('success');
      setFeedbackMessage(`Plano de serviço recorrente "${formData.title}" criado com sucesso!`);
    }

    setIsSaving(false);
    setIsFormOpen(false);
  }

  // Toggle Plan Status
  function handleToggleStatus(plan) {
    const newStatus = plan.status === 'active' ? 'paused' : 'active';
    const updated = plans.map((p) => (p.id === plan.id ? { ...p, status: newStatus } : p));
    savePlans(updated);
    setFeedbackType('success');
    setFeedbackMessage(
      `O plano "${plan.title}" foi ${newStatus === 'active' ? 'reativado' : 'pausado'}.`
    );
  }

  // Delete Plan
  function handleDeletePlan(plan) {
    if (!window.confirm(`Tem certeza que deseja excluir o plano recorrente "${plan.title}"?`)) {
      return;
    }
    const updated = plans.filter((p) => p.id !== plan.id);
    savePlans(updated);
    setFeedbackType('success');
    setFeedbackMessage(`Plano "${plan.title}" excluído.`);
  }

  // Trigger Instant Order Generation
  async function triggerOrderGeneration(plan) {
    setIsGenerating(true);
    setFeedbackMessage('');

    try {
      const nextDate = calculateNextExecutionDate(plan.nextExecutionDate || new Date(), plan.periodicity);

      const orderPayload = {
        patientName: `[Plano Preventivo] ${plan.equipmentName || plan.title}`,
        serviceType: `${plan.verticalName} - ${plan.serviceType}`,
        priority: plan.priority || 'Normal',
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        description: `PLANO RECORRENTE AUTOMÁTICO: ${plan.title}\nEquipamento: ${plan.equipmentName || 'Diversos'} (${plan.equipmentTag || 'S/TAG'})\nSetor: ${plan.sector}\nPeriodicidade: ${plan.periodicityLabel}\nPróxima execução agendada: ${formatDateBr(nextDate)}\n\nCHECKLIST TÉCNICO A REALIZAR:\n${plan.checklist}\n\nObservações: ${plan.observations || 'N/A'}`.trim(),
        createdBy: user?.id || 'admin'
      };

      const newOrder = await createServiceOrder(orderPayload);
      const orderNumber = newOrder?.order_number
        ? `OS-${String(newOrder.order_number).padStart(5, '0')}`
        : 'OS Gerada';

      const updatedPlans = plans.map((p) => {
        if (p.id === plan.id) {
          const history = p.generatedOrdersHistory || [];
          return {
            ...p,
            lastExecutionDate: new Date().toISOString().split('T')[0],
            nextExecutionDate: nextDate,
            ordersGeneratedCount: (p.ordersGeneratedCount || 0) + 1,
            generatedOrdersHistory: [
              {
                orderId: newOrder?.id,
                orderNumber: newOrder?.order_number || String(Date.now()).slice(-5),
                date: new Date().toISOString().split('T')[0],
                status: 'open'
              },
              ...history
            ]
          };
        }
        return p;
      });

      savePlans(updatedPlans);
      setFeedbackType('success');
      setFeedbackMessage(
        `✓ Ordem de Serviço ${orderNumber} aberta automaticamente com sucesso para "${plan.title}"! O próximo ciclo foi agendado para ${formatDateBr(nextDate)}.`
      );

      // Notify service orders tab
      window.dispatchEvent(new CustomEvent('helpclin_orders_updated'));
    } catch (err) {
      setFeedbackType('error');
      setFeedbackMessage(`Erro ao gerar O.S.: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  }

  // Scan & Auto-Generate for Due Dates
  async function handleScanAndGenerateDue() {
    setIsGenerating(true);
    setFeedbackMessage('');

    let generatedCount = 0;
    const nowStr = new Date().toISOString().split('T')[0];

    try {
      let currentPlans = [...plans];

      for (const plan of currentPlans) {
        if (plan.status !== 'active') continue;
        const days = getDaysRemaining(plan.nextExecutionDate);

        // Se data está vencida ou é hoje
        if (days !== null && days <= 0) {
          const nextDate = calculateNextExecutionDate(plan.nextExecutionDate, plan.periodicity);

          const orderPayload = {
            patientName: `[Plano Preventivo] ${plan.equipmentName || plan.title}`,
            serviceType: `${plan.verticalName} - ${plan.serviceType}`,
            priority: plan.priority || 'Normal',
            dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
            description: `PLANO RECORRENTE AUTOMÁTICO (CRONOGRAMA DE DATAS): ${plan.title}\nEquipamento: ${plan.equipmentName || 'Diversos'} (${plan.equipmentTag || 'S/TAG'})\nSetor: ${plan.sector}\nData Prevista no Plano: ${formatDateBr(plan.nextExecutionDate)}\n\nCHECKLIST TÉCNICO:\n${plan.checklist}\n\nObservações: ${plan.observations || 'N/A'}`.trim(),
            createdBy: user?.id || 'admin'
          };

          const newOrder = await createServiceOrder(orderPayload);
          generatedCount++;

          currentPlans = currentPlans.map((p) => {
            if (p.id === plan.id) {
              const history = p.generatedOrdersHistory || [];
              return {
                ...p,
                lastExecutionDate: nowStr,
                nextExecutionDate: nextDate,
                ordersGeneratedCount: (p.ordersGeneratedCount || 0) + 1,
                generatedOrdersHistory: [
                  {
                    orderId: newOrder?.id,
                    orderNumber: newOrder?.order_number || String(Date.now()).slice(-5),
                    date: nowStr,
                    status: 'open'
                  },
                  ...history
                ]
              };
            }
            return p;
          });
        }
      }

      if (generatedCount > 0) {
        savePlans(currentPlans);
        setFeedbackType('success');
        setFeedbackMessage(
          `✓ Verificação concluída: ${generatedCount} Ordem(ns) de Serviço preventiva(s) foram abertas automaticamente conforme o cronograma de datas!`
        );
        window.dispatchEvent(new CustomEvent('helpclin_orders_updated'));
      } else {
        setFeedbackType('success');
        setFeedbackMessage(
          'Tudo em dia! Nenhum plano recorrente possui data de execução vencida para hoje.'
        );
      }
    } catch (err) {
      setFeedbackType('error');
      setFeedbackMessage(`Erro na verificação de datas: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="recurring-services-container">
      {/* Feedback Alert */}
      {feedbackMessage && (
        <div
          className={`ticket-feedback ${feedbackType === 'error' ? 'data-state--error' : ''}`}
          style={{
            marginBottom: '20px',
            background: feedbackType === 'error' ? '#fee2e2' : '#ecfdf5',
            borderColor: feedbackType === 'error' ? '#f87171' : '#a7f3d0',
            color: feedbackType === 'error' ? '#991b1b' : '#065f46',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderRadius: '10px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {feedbackType === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
            <span style={{ fontSize: '14px', fontWeight: 600 }}>{feedbackMessage}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage('')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="recurring-kpi-grid">
        <div className="recurring-kpi-card">
          <div className="recurring-kpi-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
            <RotateCcw size={22} />
          </div>
          <div>
            <span className="recurring-kpi-label">Planos Ativos</span>
            <strong className="recurring-kpi-value">{kpis.activeCount}</strong>
            <span className="recurring-kpi-sub">Cronogramas em execução</span>
          </div>
        </div>

        <div className="recurring-kpi-card">
          <div className="recurring-kpi-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
            <Calendar size={22} />
          </div>
          <div>
            <span className="recurring-kpi-label">Próximos 30 dias</span>
            <strong className="recurring-kpi-value">{kpis.next30DaysCount}</strong>
            <span className="recurring-kpi-sub">Execuções programadas</span>
          </div>
        </div>

        <div className="recurring-kpi-card">
          <div className="recurring-kpi-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
            <Wrench size={22} />
          </div>
          <div>
            <span className="recurring-kpi-label">Calibrações RBC</span>
            <strong className="recurring-kpi-value">{kpis.calibrationCount}</strong>
            <span className="recurring-kpi-sub">Metrologia periódica</span>
          </div>
        </div>

        <div className="recurring-kpi-card">
          <div className="recurring-kpi-icon" style={{ background: '#fdf2f8', color: '#db2777' }}>
            <Zap size={22} />
          </div>
          <div>
            <span className="recurring-kpi-label">O.S. Automáticas</span>
            <strong className="recurring-kpi-value">{kpis.totalGeneratedOrders}</strong>
            <span className="recurring-kpi-sub">Geradas pelas datas</span>
          </div>
        </div>
      </div>

      {/* Executive Monthly Distribution Chart */}
      <div className="recurring-chart-card">
        <div className="recurring-chart-header">
          <div className="recurring-chart-title-group">
            <div className="recurring-chart-icon-box">
              <BarChart3 size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h2 className="recurring-chart-title">Cronograma & Distribuição Mensal de Planos Recorrentes</h2>
                <span className="recurring-year-badge">Exercício 2026</span>
              </div>
              <p className="recurring-chart-subtitle">
                Acompanhamento anual das ordens automáticas programadas mês a mês. Clique em qualquer mês para filtrar a lista abaixo.
              </p>
            </div>
          </div>

          {selectedMonthFilter !== null && (
            <div className="recurring-chart-filter-tag">
              <span>
                Filtrando: <strong>{MONTH_NAMES[selectedMonthFilter]}</strong> ({monthlyStats.months[selectedMonthFilter]?.total || 0} planos)
              </span>
              <button
                type="button"
                className="recurring-chart-clear-btn"
                onClick={() => setSelectedMonthFilter(null)}
                title="Remover filtro de mês e ver todos"
              >
                <X size={14} /> Limpar Filtro
              </button>
            </div>
          )}
        </div>

        {/* Quick metrics ribbon */}
        <div className="recurring-chart-kpis">
          <div className="recurring-chart-kpi-item">
            <span className="recurring-chart-kpi-num">{monthlyStats.totalYearExecutions}</span>
            <span className="recurring-chart-kpi-lbl">Execuções no Ano</span>
          </div>
          <div className="recurring-chart-kpi-item">
            <span className="recurring-chart-kpi-num" style={{ color: '#059669' }}>
              {monthlyStats.totalCalibrationsInYear}
            </span>
            <span className="recurring-chart-kpi-lbl">Calibrações RBC</span>
          </div>
          <div className="recurring-chart-kpi-item">
            <span className="recurring-chart-kpi-num" style={{ color: '#0284c7' }}>
              {monthlyStats.totalPreventivesInYear}
            </span>
            <span className="recurring-chart-kpi-lbl">Preventivas Clínicas</span>
          </div>
          <div className="recurring-chart-kpi-item">
            <span className="recurring-chart-kpi-num" style={{ color: 'var(--coral)' }}>
              {monthlyStats.peakMonth ? `${monthlyStats.peakMonth.name} (${monthlyStats.peakMonth.total})` : '—'}
            </span>
            <span className="recurring-chart-kpi-lbl">Mês de Maior Pico</span>
          </div>
          <div className="recurring-chart-kpi-item">
            <span className="recurring-chart-kpi-num" style={{ color: 'var(--teal)' }}>
              ~{monthlyStats.averagePerMonth}
            </span>
            <span className="recurring-chart-kpi-lbl">Média / Mês</span>
          </div>
        </div>

        {/* The 12-Month Bar Chart */}
        <div className="recurring-chart-bars-wrap">
          {monthlyStats.months.map((m) => {
            const isSelected = selectedMonthFilter === m.monthIdx;
            const heightPercent = m.total > 0
              ? Math.max(16, Math.round((m.total / monthlyStats.maxMonthCount) * 100))
              : 8;

            const calibPct = m.total > 0 ? (m.calibrationCount / m.total) * 100 : 0;
            const prevPct = m.total > 0 ? (m.preventiveCount / m.total) * 100 : 0;
            const predialPct = m.total > 0 ? (m.predialCount / m.total) * 100 : 0;
            const tiPct = m.total > 0 ? (m.tiCount / m.total) * 100 : 0;

            return (
              <div
                key={m.monthIdx}
                className={`recurring-chart-col ${isSelected ? 'recurring-chart-col--selected' : ''} ${m.isCurrentMonth ? 'recurring-chart-col--current' : ''}`}
                onClick={() => setSelectedMonthFilter(isSelected ? null : m.monthIdx)}
                role="button"
                tabIndex={0}
                title={`${m.name}: ${m.total} planos programados (${m.calibrationCount} Calibrações RBC, ${m.preventiveCount} Preventivas, ${m.predialCount} Predial, ${m.tiCount} TI). Clique para filtrar a lista.`}
              >
                {/* Count badge */}
                <span className={`recurring-chart-badge ${m.total > 0 ? 'recurring-chart-badge--has-data' : ''} ${isSelected ? 'recurring-chart-badge--selected' : ''}`}>
                  {m.total}
                </span>

                {/* Bar track */}
                <div className="recurring-chart-bar-outer">
                  <div
                    className="recurring-chart-bar-inner"
                    style={{ height: `${heightPercent}%` }}
                  >
                    {m.total > 0 ? (
                      <>
                        {calibPct > 0 && (
                          <div
                            className="recurring-chart-seg recurring-chart-seg--calib"
                            style={{ height: `${calibPct}%` }}
                            title={`Calibrações RBC: ${m.calibrationCount}`}
                          />
                        )}
                        {prevPct > 0 && (
                          <div
                            className="recurring-chart-seg recurring-chart-seg--prev"
                            style={{ height: `${prevPct}%` }}
                            title={`Preventiva Clínica: ${m.preventiveCount}`}
                          />
                        )}
                        {predialPct > 0 && (
                          <div
                            className="recurring-chart-seg recurring-chart-seg--predial"
                            style={{ height: `${predialPct}%` }}
                            title={`Engenharia Predial / PMOC: ${m.predialCount}`}
                          />
                        )}
                        {tiPct > 0 && (
                          <div
                            className="recurring-chart-seg recurring-chart-seg--ti"
                            style={{ height: `${tiPct}%` }}
                            title={`T.I. em Saúde: ${m.tiCount}`}
                          />
                        )}
                      </>
                    ) : (
                      <div className="recurring-chart-seg recurring-chart-seg--empty" />
                    )}
                  </div>
                </div>

                {/* Month Label */}
                <div className="recurring-chart-month-lbl-box">
                  <span className="recurring-chart-month-lbl">{m.shortName}</span>
                  {m.isCurrentMonth && (
                    <span className="recurring-chart-current-dot" title="Mês Atual" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="recurring-chart-legend">
          <div className="recurring-legend-item">
            <span className="recurring-legend-dot recurring-legend-dot--calib" />
            <span>Calibração RBC</span>
          </div>
          <div className="recurring-legend-item">
            <span className="recurring-legend-dot recurring-legend-dot--prev" />
            <span>Preventiva Clínica</span>
          </div>
          <div className="recurring-legend-item">
            <span className="recurring-legend-dot recurring-legend-dot--predial" />
            <span>Predial / PMOC</span>
          </div>
          <div className="recurring-legend-item">
            <span className="recurring-legend-dot recurring-legend-dot--ti" />
            <span>T.I. em Saúde</span>
          </div>

          {selectedMonthFilter !== null && (
            <button
              type="button"
              className="recurring-legend-clear-link"
              onClick={() => setSelectedMonthFilter(null)}
            >
              <RotateCcw size={12} /> Mostrar todos os meses
            </button>
          )}
        </div>
      </div>

      {/* Actions and Filters Bar */}
      <div className="recurring-toolbar">
        <div className="recurring-toolbar-left">
          <div className="search-control" style={{ width: '280px' }}>
            <Search size={16} />
            <input
              type="text"
              placeholder="Buscar plano, equipamento, setor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="filter-select"
            value={verticalFilter}
            onChange={(e) => setVerticalFilter(e.target.value)}
          >
            {allowedVerticals.length > 1 && (
              <option value="all">Todas as Vertentes Contratadas</option>
            )}
            {allowedVerticals.includes('clinical') && (
              <option value="clinical">Engenharia Clínica</option>
            )}
            {allowedVerticals.includes('ti') && (
              <option value="ti">T.I. em Saúde</option>
            )}
            {allowedVerticals.includes('predial') && (
              <option value="predial">Engenharia Predial</option>
            )}
          </select>

          <select
            className="filter-select"
            value={periodicityFilter}
            onChange={(e) => setPeriodicityFilter(e.target.value)}
          >
            <option value="all">Todas as Periodicidades</option>
            <option value="monthly">Mensal (30 dias)</option>
            <option value="bimonthly">Bimestral (60 dias)</option>
            <option value="quarterly">Trimestral (90 dias)</option>
            <option value="semiannual">Semestral (180 dias)</option>
            <option value="annual">Anual (12 meses)</option>
          </select>

          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Todos os Status</option>
            <option value="active">Apenas Ativos</option>
            <option value="paused">Apenas Pausados</option>
          </select>
        </div>

        <div className="recurring-toolbar-right">
          <button
            type="button"
            className="secondary-button"
            onClick={handleScanAndGenerateDue}
            disabled={isGenerating}
            title="Verificar datas programadas e abrir ordens de serviço pendentes"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={15} className={isGenerating ? 'spin-icon' : ''} />
            <span>Verificar Datas & Gerar O.S.</span>
          </button>

          {isTechnician && (
            <button
              type="button"
              className="primary-button"
              onClick={handleOpenCreate}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={16} />
              <span>Novo Plano Recorrente</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Month Filter Info Banner */}
      {selectedMonthFilter !== null && (
        <div className="recurring-active-month-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} style={{ color: 'var(--teal)' }} />
            <span>
              Exibindo <strong>{filteredPlans.length}</strong> plano(s) com rotina prevista para o mês de <strong>{MONTH_NAMES[selectedMonthFilter]} de 2026</strong>.
            </span>
          </div>
          <button
            type="button"
            className="link-button"
            onClick={() => setSelectedMonthFilter(null)}
            style={{ fontWeight: 600, color: 'var(--coral)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <X size={14} /> Ver todos os planos
          </button>
        </div>
      )}

      {/* List Table of Plans (Exclusively List Format) */}
      <div className="recurring-table-wrapper">
        <table className="recurring-table">
          <thead>
            <tr>
              <th style={{ width: '38px', textAlign: 'center' }}></th>
              <th style={{ width: '90px' }}>Status</th>
              <th>Plano Recorrente & Serviço</th>
              <th style={{ width: '150px' }}>Vertente</th>
              <th>Equipamento & Local</th>
              <th style={{ width: '130px' }}>Periodicidade</th>
              <th style={{ width: '140px' }}>Próxima Abertura</th>
              <th style={{ width: '100px', textAlign: 'center' }}>Histórico</th>
              <th style={{ width: '210px', textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredPlans.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <Clock size={40} style={{ color: 'var(--muted)', opacity: 0.5, marginBottom: '12px' }} />
                  <h3 style={{ fontSize: '16px', margin: '0 0 6px', color: 'var(--text)' }}>Nenhum plano recorrente encontrado</h3>
                  <p style={{ color: 'var(--muted)', fontSize: '13px', margin: '0 auto 16px', maxWidth: '420px' }}>
                    {selectedMonthFilter !== null
                      ? `Não há planos com rotina programada para ${MONTH_NAMES[selectedMonthFilter]}.`
                      : 'Não há planos correspondentes aos filtros selecionados. Defina periodicidades de calibração ou manutenção preventiva para abertura automática de O.S.'}
                  </p>
                  {selectedMonthFilter !== null && (
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => setSelectedMonthFilter(null)}
                      style={{ marginRight: '8px' }}
                    >
                      Limpar Filtro de Mês
                    </button>
                  )}
                  {isTechnician && (
                    <button type="button" className="primary-button" onClick={handleOpenCreate}>
                      <Plus size={15} /> Novo Plano
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              filteredPlans.map((plan) => {
                const isExpanded = expandedPlanIds.has(plan.id);
                const daysRemaining = getDaysRemaining(plan.nextExecutionDate);
                const isOverdue = daysRemaining !== null && daysRemaining < 0;
                const isDueToday = daysRemaining === 0;
                const isNear = daysRemaining !== null && daysRemaining > 0 && daysRemaining <= 15;

                const verticalIcon =
                  plan.vertical === 'predial' ? (
                    <Building2 size={13} />
                  ) : plan.vertical === 'ti' ? (
                    <Laptop size={13} />
                  ) : (
                    <Stethoscope size={13} />
                  );

                const verticalBadgeClass =
                  plan.vertical === 'predial'
                    ? 'vertical-badge--predial'
                    : plan.vertical === 'ti'
                    ? 'vertical-badge--ti'
                    : 'vertical-badge--clinical';

                const scheduledMonths = getPlanScheduledMonths(plan, 2026);

                return (
                  <Fragment key={plan.id}>
                    <tr
                      className={`recurring-table-row ${plan.status === 'paused' ? 'recurring-table-row--paused' : ''} ${isExpanded ? 'recurring-table-row--expanded' : ''}`}
                    >
                      {/* Expand Toggle */}
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="recurring-expand-btn"
                          onClick={() => toggleExpandRow(plan.id)}
                          title={isExpanded ? 'Recolher detalhes' : 'Expandir checklist e rotina'}
                        >
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </td>

                      {/* Status */}
                      <td>
                        {plan.status === 'active' ? (
                          <span className="recurring-status-pill recurring-status-pill--active" title="Plano Ativo">
                            <span className="pulse-dot" /> Ativo
                          </span>
                        ) : (
                          <span className="recurring-status-pill recurring-status-pill--paused" title="Plano Pausado">
                            Pausado
                          </span>
                        )}
                      </td>

                      {/* Plano & Serviço */}
                      <td>
                        <div className="recurring-plan-main-cell">
                          <strong className="recurring-plan-title">{plan.title}</strong>
                          <div className="recurring-plan-sub-tags">
                            <span className="recurring-type-tag">{plan.serviceType}</span>
                            {plan.priority && plan.priority !== 'Normal' && (
                              <span className={`recurring-priority-badge recurring-priority-badge--${plan.priority.toLowerCase()}`}>
                                {plan.priority}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Vertente */}
                      <td>
                        <span className={`recurring-vertical-badge ${verticalBadgeClass}`}>
                          {verticalIcon}
                          <span>{plan.verticalName || 'Engenharia Clínica'}</span>
                        </span>
                      </td>

                      {/* Equipamento & Setor */}
                      <td>
                        <div className="recurring-table-eq-cell">
                          <span className="recurring-table-eq-name">
                            {plan.equipmentName || 'Equipamento Geral'}
                          </span>
                          <span className="recurring-table-eq-sub">
                            {plan.equipmentTag ? `${plan.equipmentTag} • ` : ''}
                            {plan.sector || 'Setor Geral'}
                          </span>
                        </div>
                      </td>

                      {/* Periodicidade */}
                      <td>
                        <span className="recurring-periodicity-chip">
                          {plan.periodicityLabel}
                        </span>
                      </td>

                      {/* Próxima Execução */}
                      <td>
                        <div className="recurring-table-date-cell">
                          <strong className="recurring-table-date">
                            {formatDateBr(plan.nextExecutionDate)}
                          </strong>
                          {plan.status === 'active' && (
                            <span
                              className={`due-pill ${
                                isOverdue
                                  ? 'due-pill--overdue'
                                  : isDueToday
                                  ? 'due-pill--today'
                                  : isNear
                                  ? 'due-pill--near'
                                  : 'due-pill--future'
                              }`}
                            >
                              {isOverdue
                                ? `Vencido há ${Math.abs(daysRemaining)}d`
                                : isDueToday
                                ? 'Hoje!'
                                : `Em ${daysRemaining}d`}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Histórico */}
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="recurring-hist-btn"
                          onClick={() => setHistoryModalPlan(plan)}
                          title="Ver histórico de ordens geradas"
                        >
                          <Clock size={13} />
                          <span>{plan.ordersGeneratedCount || 0} O.S.</span>
                        </button>
                      </td>

                      {/* Ações */}
                      <td style={{ textAlign: 'right' }}>
                        <div className="recurring-table-actions">
                          <button
                            type="button"
                            className="list-action-zap-btn"
                            onClick={() => triggerOrderGeneration(plan)}
                            disabled={isGenerating}
                            title="Gerar Ordem de Serviço Imediata para este plano"
                          >
                            <Zap size={13} />
                            <span>Gerar O.S.</span>
                          </button>

                          <button
                            type="button"
                            className="icon-action-btn"
                            onClick={() => handleToggleStatus(plan)}
                            title={plan.status === 'active' ? 'Pausar Plano' : 'Ativar Plano'}
                          >
                            {plan.status === 'active' ? <Pause size={14} /> : <Play size={14} />}
                          </button>

                          {isTechnician && (
                            <button
                              type="button"
                              className="icon-action-btn"
                              onClick={() => handleOpenEdit(plan)}
                              title="Editar Plano Recorrente"
                            >
                              <Edit3 size={14} />
                            </button>
                          )}

                          {isTechnician && (
                            <button
                              type="button"
                              className="icon-action-btn icon-action-btn--delete"
                              onClick={() => handleDeletePlan(plan)}
                              title="Excluir Plano"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Expanded details row */}
                    {isExpanded && (
                      <tr className="recurring-table-expand-row">
                        <td colSpan={9}>
                          <div className="recurring-expand-content">
                            <div className="recurring-expand-col">
                              <h4>
                                <CheckCircle2 size={15} style={{ color: '#059669' }} />
                                Checklist Técnico da Rotina Preventiva
                              </h4>
                              <div className="recurring-checklist-box">
                                {plan.checklist ? (
                                  plan.checklist.split('\n').filter(Boolean).map((item, idx) => (
                                    <div key={idx} className="recurring-checklist-line">
                                      <span className="recurring-checklist-check">✓</span>
                                      <span>{item}</span>
                                    </div>
                                  ))
                                ) : (
                                  <span style={{ color: 'var(--muted)', fontSize: '12px' }}>
                                    Nenhum checklist especificado para este plano.
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="recurring-expand-col">
                              <h4>
                                <Calendar size={15} style={{ color: 'var(--teal)' }} />
                                Cronograma de Meses Previstos em 2026
                              </h4>
                              <div className="recurring-months-strip">
                                {MONTH_SHORT.map((mShort, idx) => {
                                  const isScheduled = scheduledMonths.includes(idx);
                                  const isSelected = selectedMonthFilter === idx;
                                  return (
                                    <span
                                      key={idx}
                                      className={`recurring-month-tag ${isScheduled ? 'recurring-month-tag--scheduled' : ''} ${isSelected ? 'recurring-month-tag--selected' : ''}`}
                                      title={isScheduled ? `${MONTH_NAMES[idx]}: Execução prevista` : `${MONTH_NAMES[idx]}: Não prevista`}
                                    >
                                      {mShort}
                                    </span>
                                  );
                                })}
                              </div>

                              <div className="recurring-expand-meta-grid">
                                <div>
                                  <span className="expand-meta-label">Responsável Técnico</span>
                                  <strong className="expand-meta-val">{plan.technicianName || 'Plantão Técnico HelpClin'}</strong>
                                </div>
                                <div>
                                  <span className="expand-meta-label">Última Execução</span>
                                  <strong className="expand-meta-val">{formatDateBr(plan.lastExecutionDate)}</strong>
                                </div>
                                <div style={{ gridColumn: '1 / -1' }}>
                                  <span className="expand-meta-label">Normas Regulatórias & Observações</span>
                                  <p className="expand-meta-obs">{plan.observations || 'Rotina preventiva em conformidade com as diretrizes do fabricante e RDC ANVISA.'}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Create / Edit Plan */}
      {isFormOpen && (
        <div className="modal-backdrop">
          <div className="modal-container recurring-modal">
            <div className="modal-header">
              <div>
                <h2>{editingPlan ? 'Editar Plano Recorrente' : 'Novo Plano Recorrente de Serviços'}</h2>
                <p>Configure a periodicidade de preventivas e calibrações para abertura automática de O.S.</p>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setIsFormOpen(false)}
                aria-label="Fechar"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="modal-body">
              <div className="inventory-field">
                <label>
                  Título do Plano <span className="required">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Calibração Anual RBC - Desfibriladores da Emergência"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="inventory-grid-2">
                <div className="inventory-field">
                  <label>
                    Vertente do Serviço <span className="required">*</span>
                  </label>
                  <select
                    value={formData.vertical}
                    onChange={(e) => setFormData({ ...formData, vertical: e.target.value })}
                    required
                  >
                    <option value="clinical">Engenharia Clínica (Equipamentos Médicos)</option>
                    <option value="predial">Engenharia Predial (Infraestrutura & Utilidades)</option>
                    <option value="ti">T.I. em Saúde (Hardware & Conectividade)</option>
                  </select>
                </div>

                <div className="inventory-field">
                  <label>
                    Tipo de Serviço Recorrente <span className="required">*</span>
                  </label>
                  <select
                    value={formData.serviceType}
                    onChange={(e) => handleServiceTypeChange(e.target.value)}
                    required
                  >
                    <option value="Calibração Metrológica RBC">Calibração Metrológica RBC (Rastreável)</option>
                    <option value="Manutenção Preventiva Periódica">Manutenção Preventiva Periódica</option>
                    <option value="Ensaio de Segurança Elétrica (NBR IEC 60601)">Ensaio de Segurança Elétrica (NBR IEC 60601)</option>
                    <option value="Plano de Manutenção, Operação e Controle (PMOC)">Plano PMOC / Climatização</option>
                    <option value="Inspeção de Rotina & Teste de Carga">Inspeção de Rotina & Teste de Carga</option>
                    <option value="Troca Programada de Peças e Acessórios">Troca Programada de Peças e Acessórios</option>
                  </select>
                </div>
              </div>

              <div className="inventory-grid-2">
                <div className="inventory-field">
                  <label>Vincular Equipamento Cadastrado</label>
                  <select
                    value={formData.equipmentId}
                    onChange={(e) => handleEquipmentChange(e.target.value)}
                  >
                    <option value="">Selecione um equipamento do inventário...</option>
                    {inventory.map((eq) => (
                      <option key={eq.id} value={eq.id}>
                        {eq.name} — {eq.location || 'Sem setor'} (SN: {eq.serial_number || 'N/A'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="inventory-field">
                  <label>
                    Nome do Equipamento / Alvo <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Desfibrilador Mindray D3"
                    value={formData.equipmentName}
                    onChange={(e) => setFormData({ ...formData, equipmentName: e.target.value })}
                  />
                </div>
              </div>

              <div className="inventory-grid-2">
                <div className="inventory-field">
                  <label>
                    Setor / Localização <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: UTI Geral Adulto, Bloco Cirúrgico..."
                    value={formData.sector}
                    onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                  />
                </div>

                <div className="inventory-field">
                  <label>Tag / Identificador / Número de Série</label>
                  <input
                    type="text"
                    placeholder="Ex: EQ-MED-0042 ou SN: 893240"
                    value={formData.equipmentTag}
                    onChange={(e) => setFormData({ ...formData, equipmentTag: e.target.value })}
                  />
                </div>
              </div>

              <div className="inventory-grid-3">
                <div className="inventory-field">
                  <label>
                    Periodicidade <span className="required">*</span>
                  </label>
                  <select
                    value={formData.periodicity}
                    onChange={(e) => setFormData({ ...formData, periodicity: e.target.value })}
                    required
                  >
                    <option value="monthly">Mensal (a cada 30 dias)</option>
                    <option value="bimonthly">Bimestral (a cada 60 dias)</option>
                    <option value="quarterly">Trimestral (a cada 90 dias)</option>
                    <option value="semiannual">Semestral (a cada 6 meses)</option>
                    <option value="annual">Anual (a cada 12 meses)</option>
                    <option value="biannual">Bianual (a cada 24 meses)</option>
                  </select>
                </div>

                <div className="inventory-field">
                  <label>
                    Próxima Data de Abertura <span className="required">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.nextExecutionDate}
                    onChange={(e) => setFormData({ ...formData, nextExecutionDate: e.target.value })}
                  />
                </div>

                <div className="inventory-field">
                  <label>Prioridade da O.S.</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  >
                    <option value="Pouco urgente">Pouco urgente</option>
                    <option value="Normal">Normal</option>
                    <option value="Alta">Alta</option>
                    <option value="Urgente">Urgente</option>
                  </select>
                </div>
              </div>

              <div className="inventory-field">
                <label>Técnico / Responsável Padrão</label>
                <input
                  type="text"
                  placeholder="Nome do técnico responsável pela execução"
                  value={formData.technicianName}
                  onChange={(e) => setFormData({ ...formData, technicianName: e.target.value })}
                />
              </div>

              <div className="inventory-field">
                <label>
                  Checklist Técnico / Procedimentos a Realizar na O.S. <span className="required">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Liste os passos da rotina preventiva que serão anexados à O.S. gerada..."
                  value={formData.checklist}
                  onChange={(e) => setFormData({ ...formData, checklist: e.target.value })}
                />
              </div>

              <div className="inventory-field">
                <label>Observações Regulatórias / Normas Aplicadas</label>
                <input
                  type="text"
                  placeholder="Ex: RDC ANVISA nº 509/2013, ONA nível 3, NBR 13534"
                  value={formData.observations}
                  onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                />
              </div>

              <div className="modal-actions" style={{ marginTop: '20px' }}>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setIsFormOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={isSaving}
                >
                  {isSaving ? 'Salvando...' : editingPlan ? 'Salvar Alterações' : 'Cadastrar Plano Recorrente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: History of Orders Generated by Plan */}
      {historyModalPlan && (
        <div className="modal-backdrop">
          <div className="modal-container" style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <div>
                <h2>Histórico de Ordens Geradas</h2>
                <p>Plano: {historyModalPlan.title}</p>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setHistoryModalPlan(null)}
                aria-label="Fechar"
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '20px' }}>
              <div style={{ marginBottom: '16px', display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1, padding: '12px', background: '#f8faf9', borderRadius: '8px', border: '1px solid #e2e8e5' }}>
                  <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block' }}>Total de Execuções</span>
                  <strong style={{ fontSize: '20px', color: 'var(--teal)' }}>{historyModalPlan.ordersGeneratedCount || 0}</strong>
                </div>
                <div style={{ flex: 1, padding: '12px', background: '#f8faf9', borderRadius: '8px', border: '1px solid #e2e8e5' }}>
                  <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block' }}>Próxima Prevista</span>
                  <strong style={{ fontSize: '16px', color: 'var(--coral)' }}>{formatDateBr(historyModalPlan.nextExecutionDate)}</strong>
                </div>
              </div>

              {(!historyModalPlan.generatedOrdersHistory || historyModalPlan.generatedOrdersHistory.length === 0) ? (
                <p style={{ textAlign: 'center', color: 'var(--muted)', padding: '20px 0', fontSize: '13px' }}>
                  Nenhuma ordem foi registrada ainda para este plano. Clique em "Gerar O.S. Agora" para iniciar o ciclo.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {historyModalPlan.generatedOrdersHistory.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        background: '#ffffff',
                        border: '1px solid var(--line)',
                        borderRadius: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <CheckCircle2 size={16} style={{ color: '#059669' }} />
                        <div>
                          <strong style={{ fontSize: '13px' }}>OS-{String(item.orderNumber).padStart(5, '0')}</strong>
                          <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block' }}>
                            Gerada em {formatDateBr(item.date)}
                          </span>
                        </div>
                      </div>
                      <span className="order-status-badge order-status-badge--completed" style={{ fontSize: '11px' }}>
                        {item.status === 'completed' ? 'Concluída' : 'Em Aberto'}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginTop: '20px', textAlign: 'right' }}>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setHistoryModalPlan(null)}
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

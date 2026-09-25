/**
 * Utilitários para gestão do ciclo de faturamento e estados da Ordem de Serviço
 * Regra de negócio HelpClin:
 * - As ordens de serviço têm prazo de 30 dias para serem faturadas após a conclusão técnica.
 * - Durante os 30 dias (dias <= 30), a ordem consta com observação de faturamento no prazo, sem qualquer exclamação (⚠️ ou !).
 * - Apenas ordens que ultrapassarem os 30 dias (dias > 30) recebem alerta com exclamações (⚠️ Faturamento Atrasado!).
 * - Ordens faturadas recebem status "Faturada".
 */

export const BILLING_MAX_DAYS = 30; // 30 dias de prazo padrão para faturamento
export const BILLING_PENDING_HOURS = 30 * 24; // 30 dias = 720 horas

export const VERTICAL_PRESETS = {
  ti: {
    id: 'ti',
    name: 'HelpClin T.I. em Saúde',
    moduleTI: true,
    moduleClinical: false,
    modulePredial: false,
    contractPlan: 'HelpClin T.I. em Saúde & Infraestrutura Hospitalar',
    primaryVertical: 'ti',
    themeColor: '#2563eb'
  },
  clinical: {
    id: 'clinical',
    name: 'HelpClin Engenharia Clínica',
    moduleTI: false,
    moduleClinical: true,
    modulePredial: false,
    contractPlan: 'HelpClin Engenharia Clínica & Parque Biomédico',
    primaryVertical: 'clinical',
    themeColor: '#059669'
  },
  predial: {
    id: 'predial',
    name: 'HelpClin Predial & Facilities',
    moduleTI: false,
    moduleClinical: false,
    modulePredial: true,
    contractPlan: 'HelpClin Predial, Geradores & PMOC',
    primaryVertical: 'facilities',
    themeColor: '#d97706'
  }
};

const activeVerticalEnv = typeof import.meta !== 'undefined' && import.meta.env?.VITE_VERTICAL;
const activeVerticalPreset = activeVerticalEnv && VERTICAL_PRESETS[activeVerticalEnv] ? VERTICAL_PRESETS[activeVerticalEnv] : null;

export const DEFAULT_BILLING_SETTINGS = {
  // Módulos Contratuais geridos exclusivamente pela Gestão HelpClin
  moduleTI: activeVerticalPreset ? activeVerticalPreset.moduleTI : true,
  moduleClinical: activeVerticalPreset ? activeVerticalPreset.moduleClinical : true,
  modulePredial: activeVerticalPreset ? activeVerticalPreset.modulePredial : true,
  billingEnabled: true, // true = Modo Freelancer (com cobrança); false = Modo Equipe Própria / Hospitalar (sem cobrança)

  billingMaxDays: 30, // Prazo em dias para faturamento
  showAlertBanners: true, // Exibir alertas no Dashboard
  allowClientSelfConfirm: false, // Cliente informa ou valida diretamente
  requireTechnicianConfirmation: true, // Exigir confirmação técnica
  organizationName: 'Unidade Hospitalar / Clínica',
  contactEmail: '',
  primaryVertical: activeVerticalPreset ? activeVerticalPreset.primaryVertical : 'all',
  contractStatus: 'active', // 'active' | 'trial' | 'paused'
  contractPlan: activeVerticalPreset ? activeVerticalPreset.contractPlan : 'Plano Tri-Vertical Completo',
  contractDate: '2026-01-01',
  clientCnpj: '12.345.678/0001-90',
  adminNotes: 'Módulos liberados conforme contrato de prestação de serviços HelpClin.'
};

/**
 * Retorna as configurações do cliente para o módulo de cobrança/faturamento e módulos contratuais.
 * @returns {typeof DEFAULT_BILLING_SETTINGS}
 */
export function getClientBillingSettings() {
  try {
    const raw = localStorage.getItem('helpclin_client_settings');
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_BILLING_SETTINGS, ...parsed };
    }
    // Fallback para chave legado se existir
    const legacyKey = localStorage.getItem('helpclin_billing_enabled');
    if (legacyKey !== null) {
      return { ...DEFAULT_BILLING_SETTINGS, billingEnabled: legacyKey !== 'false' };
    }
  } catch (e) {
    console.warn('Erro ao ler configurações de cobrança:', e);
  }
  return { ...DEFAULT_BILLING_SETTINGS };
}

/**
 * Salva as configurações de cobrança do cliente e despacha evento reativo.
 * @param {Partial<typeof DEFAULT_BILLING_SETTINGS>} newSettings
 * @returns {typeof DEFAULT_BILLING_SETTINGS}
 */
export function saveClientBillingSettings(newSettings) {
  try {
    const current = getClientBillingSettings();
    const updated = { ...current, ...newSettings };
    localStorage.setItem('helpclin_client_settings', JSON.stringify(updated));
    localStorage.setItem('helpclin_billing_enabled', String(updated.billingEnabled));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('helpclin_settings_changed', { detail: updated }));
    }
    return updated;
  } catch (e) {
    console.error('Erro ao salvar configurações de cobrança:', e);
    return null;
  }
}

/**
 * Verifica se o módulo de cobrança (Modo Freelancer) está ativado para o cliente.
 * @returns {boolean}
 */
export function isBillingModuleEnabled() {
  return getClientBillingSettings().billingEnabled !== false;
}

/**
 * Verifica se o módulo de T.I. em Saúde está ativado no contrato do cliente.
 * @returns {boolean}
 */
export function isTIModuleEnabled() {
  return getClientBillingSettings().moduleTI !== false;
}

/**
 * Verifica se o módulo de Engenharia Clínica está ativado no contrato do cliente.
 * @returns {boolean}
 */
export function isClinicalModuleEnabled() {
  return getClientBillingSettings().moduleClinical !== false;
}

/**
 * Verifica se o módulo de Engenharia Predial está ativado no contrato do cliente.
 * @returns {boolean}
 */
export function isPredialModuleEnabled() {
  return getClientBillingSettings().modulePredial !== false;
}

/**
 * Verifica se um módulo específico está liberado para o cliente.
 * @param {'ti'|'clinical'|'predial'|'billing'} moduleKey
 * @returns {boolean}
 */
export function isModuleActive(moduleKey) {
  const s = getClientBillingSettings();
  if (moduleKey === 'ti') return s.moduleTI !== false;
  if (moduleKey === 'clinical') return s.moduleClinical !== false;
  if (moduleKey === 'predial') return s.modulePredial !== false;
  if (moduleKey === 'billing') return s.billingEnabled !== false;
  return true;
}

/**
 * Retorna os dias decorridos desde a conclusão da ordem.
 * @param {Object} order
 * @returns {number}
 */
export function getDaysSinceCompletion(order) {
  if (!order) return 0;
  const completionTimestamp =
    order.completed_at ||
    order.service_order_completed_at ||
    order.updated_at ||
    order.service_order_updated_at ||
    order.created_at;

  if (!completionTimestamp) return 0;
  const completionDate = new Date(completionTimestamp);
  const diffInHours = (Date.now() - completionDate.getTime()) / (1000 * 60 * 60);
  return Math.max(0, Math.floor(diffInHours / 24));
}

/**
 * Verifica se a ordem já foi faturada.
 * @param {Object} order
 * @returns {boolean}
 */
export function isBilled(order) {
  if (!order) return false;
  return order.status === 'billed' || order.service_order_status === 'billed';
}

/**
 * Verifica se o cliente já informou o pagamento e aguarda confirmação do técnico.
 * @param {Object} order
 * @returns {boolean}
 */
export function isPaymentInformed(order) {
  if (!order) return false;
  const status = order.status || order.service_order_status;
  return status === 'payment_informed';
}

export function isWaitingTechnicianConfirmation(order) {
  return isPaymentInformed(order);
}

/**
 * Verifica se a ordem está concluída e aguarda faturamento pelo cliente (dentro do prazo ou atrasada).
 * Se o módulo de cobrança estiver desativado para o cliente, retorna false.
 * @param {Object} order
 * @returns {boolean}
 */
export function isAwaitingBilling(order) {
  if (!isBillingModuleEnabled()) return false;
  if (!order) return false;
  if (isBilled(order)) return false;
  if (isPaymentInformed(order)) return false;
  const status = order.status || order.service_order_status;
  if (status === 'cancelled') return false;
  return status === 'completed' || status === 'billing_pending' || order.is_completed === true;
}

/**
 * Verifica se o faturamento ultrapassou os dias regulamentares (atraso crítico).
 * Apenas estes casos devem exibir exclamações (⚠️ ou !).
 * Se o módulo de cobrança estiver desativado, retorna false.
 * @param {Object} order
 * @returns {boolean}
 */
export function isBillingOverdue(order) {
  if (!isBillingModuleEnabled()) return false;
  if (!isAwaitingBilling(order)) return false;
  const maxDays = getClientBillingSettings().billingMaxDays || BILLING_MAX_DAYS;
  return getDaysSinceCompletion(order) > maxDays;
}

/**
 * Verifica se a ordem está com faturamento pendente (aguardando baixa).
 * @param {Object} order
 * @returns {boolean}
 */
export function isBillingPending(order) {
  if (!isBillingModuleEnabled()) return false;
  return isAwaitingBilling(order);
}

/**
 * Calcula o estado efetivo da Ordem de Serviço considerando o prazo de faturamento (quando ativado).
 * Quando a cobrança está desativada (Modo Equipe Própria), ordens concluídas ficam como 'completed'.
 * @param {Object} order
 * @returns {'open'|'in_progress'|'completed'|'billing_pending'|'payment_informed'|'billed'|'cancelled'}
 */
export function getEffectiveOrderStatus(order) {
  if (!order) return 'open';

  // Se o módulo de cobrança estiver DESATIVADO (Modo Equipe Própria / Sem Cobrança):
  if (!isBillingModuleEnabled()) {
    const rawStatus = order.status || order.service_order_status || 'open';
    if (rawStatus === 'billing_pending' || rawStatus === 'payment_informed' || rawStatus === 'billed' || order.is_completed === true) {
      return 'completed';
    }
    return rawStatus;
  }

  // Se já foi faturada explicitamente
  if (isBilled(order)) return 'billed';

  // Se o cliente já informou o pagamento e aguarda confirmação do técnico
  if (isPaymentInformed(order)) return 'payment_informed';

  // Se ultrapassou os dias limite, status de faturamento atrasado
  if (isBillingOverdue(order)) return 'billing_pending';

  // Se está aguardando faturamento dentro do prazo normal (<= maxDays)
  if (isAwaitingBilling(order)) return 'completed';

  return order.status || order.service_order_status || 'open';
}

/**
 * Retorna o rótulo legível em português para cada estado.
 */
export function getOrderStatusLabel(status) {
  switch (status) {
    case 'open':
      return 'Aberta';
    case 'in_progress':
      return 'Em andamento';
    case 'completed':
      return 'Concluída';
    case 'billing_pending':
      return 'Faturamento Atrasado';
    case 'payment_informed':
      return 'Aguardando Confirmação';
    case 'billed':
      return 'Faturada';
    case 'cancelled':
      return 'Cancelada';
    default:
      return status || 'Aberta';
  }
}

/**
 * Retorna a classe CSS correspondente para o badge de status.
 */
export function getOrderStatusBadgeClass(status) {
  switch (status) {
    case 'open':
      return 'os-status-badge--open';
    case 'in_progress':
      return 'os-status-badge--in_progress';
    case 'completed':
      return 'os-status-badge--completed';
    case 'billing_pending':
      return 'os-status-badge--billing_pending';
    case 'payment_informed':
      return 'os-status-badge--payment_informed';
    case 'billed':
      return 'os-status-badge--billed';
    case 'cancelled':
      return 'os-status-badge--cancelled';
    default:
      return 'os-status-badge--open';
  }
}

/**
 * Retorna a data efetiva em que a ordem foi faturada ou teve pagamento informado.
 * @param {Object} order
 * @returns {string|null}
 */
export function getOrderBilledDate(order) {
  if (!order) return null;
  if (order.billed_at) return order.billed_at;
  if (order.status === 'billed' || order.service_order_status === 'billed') {
    return order.payment_informed_at || order.updated_at || order.completed_at || null;
  }
  if (order.payment_informed_at) return order.payment_informed_at;
  return null;
}

/**
 * Calcula a relação detalhada entre a criação e o pagamento/faturamento da ordem de serviço.
 * @param {Object} order
 * @returns {{
 *   isBilled: boolean,
 *   isPaymentInformed: boolean,
 *   billedDate: string|null,
 *   createdDate: string|null,
 *   cycleDays: number|null,
 *   cycleHours: number|null,
 *   elapsedText: string,
 *   summaryText: string,
 *   statusText: string,
 *   badgeClass: string
 * }}
 */
export function getOrderCreationToPaymentRelation(order) {
  if (!order) {
    return {
      isBilled: false,
      isPaymentInformed: false,
      billedDate: null,
      createdDate: null,
      cycleDays: null,
      cycleHours: null,
      elapsedText: '—',
      summaryText: '—',
      statusText: 'Não Faturada',
      badgeClass: 'os-status-badge--not_billed'
    };
  }

  // Se o módulo de cobrança estiver desativado pelo cliente
  if (!isBillingModuleEnabled()) {
    const isCompleted = order.status === 'completed' || order.service_order_status === 'completed' || order.is_completed;
    return {
      isBilled: false,
      isPaymentInformed: false,
      billedDate: null,
      createdDate: order.created_at || null,
      cycleDays: null,
      cycleHours: null,
      elapsedText: isCompleted ? 'Concluída' : 'Em atendimento',
      summaryText: isCompleted ? 'Concluída' : 'Em aberto',
      statusText: isCompleted ? 'Concluída (Equipe Interna)' : 'Em atendimento',
      badgeClass: isCompleted ? 'os-status-badge--completed' : 'os-status-badge--in_progress'
    };
  }

  const isOrderBilled = isBilled(order) || Boolean(order.billed_at);
  const isOrderPaymentInformed = isPaymentInformed(order) || Boolean(order.payment_informed_at);
  const billedDate = getOrderBilledDate(order);
  const createdDate = order.created_at;

  const createdTime = createdDate ? new Date(createdDate).getTime() : null;
  const paymentTime = billedDate ? new Date(billedDate).getTime() : null;

  // 1. Ordem FATURADA (ou com pagamento informado)
  if ((isOrderBilled || isOrderPaymentInformed) && paymentTime && createdTime && !isNaN(paymentTime) && !isNaN(createdTime)) {
    const diffMs = Math.max(0, paymentTime - createdTime);
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = Math.floor(diffHours / 24);

    let elapsedText = '';
    let summaryText = '';

    if (diffDays <= 0) {
      const roundedHours = Math.max(1, Math.round(diffHours));
      elapsedText = roundedHours === 1 ? 'Mesmo dia (1h decorrida)' : `Mesmo dia (${roundedHours}h decorridas)`;
      summaryText = '< 24h';
    } else if (diffDays === 1) {
      elapsedText = '1 dia decorrido';
      summaryText = '1 dia';
    } else {
      elapsedText = `${diffDays} dias decorridos`;
      summaryText = `${diffDays} dias`;
    }

    return {
      isBilled: isOrderBilled,
      isPaymentInformed: isOrderPaymentInformed && !isOrderBilled,
      billedDate,
      createdDate,
      cycleDays: diffDays,
      cycleHours: Math.round(diffHours),
      elapsedText,
      summaryText,
      statusText: isOrderBilled ? 'Faturada' : 'Pagamento Informado',
      badgeClass: isOrderBilled ? 'os-status-badge--billed' : 'os-status-badge--payment_informed'
    };
  }

  // 2. Ordem NÃO FATURADA: tempo decorrido desde a criação
  let elapsedDays = 0;
  let elapsedText = 'Pendente';
  let summaryText = 'Pendente';

  if (createdTime && !isNaN(createdTime)) {
    const diffHours = (Date.now() - createdTime) / (1000 * 60 * 60);
    elapsedDays = Math.max(0, Math.floor(diffHours / 24));
    if (elapsedDays <= 0) {
      elapsedText = 'Aberta hoje (sem pagamento)';
      summaryText = 'Hoje';
    } else if (elapsedDays === 1) {
      elapsedText = 'Aberta há 1 dia (sem pagamento)';
      summaryText = '1 dia';
    } else {
      elapsedText = `Aberta há ${elapsedDays} dias (sem pagamento)`;
      summaryText = `${elapsedDays} dias`;
    }
  }

  const effective = getEffectiveOrderStatus(order);
  let statusText = 'Não Faturada';
  if (effective === 'completed' || isAwaitingBilling(order)) {
    statusText = 'Não Faturada (Aguardando)';
  } else if (effective === 'cancelled') {
    statusText = 'Cancelada';
  } else {
    statusText = 'Não Faturada (Em Aberto)';
  }

  return {
    isBilled: false,
    isPaymentInformed: false,
    billedDate: null,
    createdDate,
    cycleDays: null,
    cycleHours: null,
    elapsedDays,
    elapsedText,
    summaryText,
    statusText,
    badgeClass: 'os-status-badge--not_billed'
  };
}

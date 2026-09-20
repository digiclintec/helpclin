/**
 * Utilitários para gestão do ciclo de faturamento e estados da Ordem de Serviço
 * Regra de negócio HelpClin:
 * - As ordens de serviço têm prazo de 30 dias para serem faturadas após a conclusão técnica.
 * - Durante os 30 dias (dias <= 30), a ordem consta com observação de faturamento no prazo, sem qualquer exclamação (⚠️ ou !).
 * - Apenas ordens que ultrapassarem os 30 dias (dias > 30) recebem alerta com exclamações (⚠️ Faturamento Atrasado!).
 * - Ordens faturadas recebem status "Faturada".
 */

export const BILLING_MAX_DAYS = 30; // 30 dias de prazo para faturamento
export const BILLING_PENDING_HOURS = 30 * 24; // 30 dias = 720 horas

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
 * @param {Object} order
 * @returns {boolean}
 */
export function isAwaitingBilling(order) {
  if (!order) return false;
  if (isBilled(order)) return false;
  if (isPaymentInformed(order)) return false;
  const status = order.status || order.service_order_status;
  if (status === 'cancelled') return false;
  return status === 'completed' || status === 'billing_pending' || order.is_completed === true;
}

/**
 * Verifica se o faturamento ultrapassou os 30 dias regulamentares (atraso crítico).
 * Apenas estes casos devem exibir exclamações (⚠️ ou !).
 * @param {Object} order
 * @returns {boolean}
 */
export function isBillingOverdue(order) {
  if (!isAwaitingBilling(order)) return false;
  return getDaysSinceCompletion(order) > BILLING_MAX_DAYS;
}

/**
 * Verifica se a ordem está com faturamento pendente (aguardando baixa).
 * @param {Object} order
 * @returns {boolean}
 */
export function isBillingPending(order) {
  return isAwaitingBilling(order);
}

/**
 * Calcula o estado efetivo da Ordem de Serviço considerando o prazo de 30 dias após a conclusão.
 * @param {Object} order
 * @returns {'open'|'in_progress'|'completed'|'billing_pending'|'payment_informed'|'billed'|'cancelled'}
 */
export function getEffectiveOrderStatus(order) {
  if (!order) return 'open';

  // Se já foi faturada explicitamente
  if (isBilled(order)) return 'billed';

  // Se o cliente já informou o pagamento e aguarda confirmação do técnico
  if (isPaymentInformed(order)) return 'payment_informed';

  // Se ultrapassou os 30 dias, status de faturamento atrasado
  if (isBillingOverdue(order)) return 'billing_pending';

  // Se está aguardando faturamento dentro do prazo normal (<= 30 dias)
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

/**
 * Utilitários para gestão do ciclo de faturamento e estados da Ordem de Serviço
 * Regra de negócio: Ordens concluídas há mais de 48 horas (2 dias) passam para
 * o estado "Pendência de Faturamento", alertando o cliente e bloqueando acesso
 * técnico até o faturamento manual pelo administrador freelancer.
 */

export const BILLING_PENDING_HOURS = 48; // 2 dias = 48 horas

/**
 * Calcula o estado efetivo da Ordem de Serviço considerando o prazo de 2 dias após a conclusão.
 * @param {Object} order
 * @returns {'open'|'in_progress'|'completed'|'billing_pending'|'billed'|'cancelled'}
 */
export function getEffectiveOrderStatus(order) {
  if (!order) return 'open';

  // Se já foi faturada explicitamente
  if (order.status === 'billed') return 'billed';

  // Se já foi gravada como pendência de faturamento
  if (order.status === 'billing_pending') return 'billing_pending';

  // Se estiver concluída, avaliar se já passaram 2 dias (48 horas)
  if (order.status === 'completed') {
    const completionTimestamp = order.completed_at || order.updated_at || order.created_at;
    if (completionTimestamp) {
      const completionDate = new Date(completionTimestamp);
      const elapsedHours = (Date.now() - completionDate.getTime()) / (1000 * 60 * 60);

      if (elapsedHours >= BILLING_PENDING_HOURS) {
        return 'billing_pending';
      }
    }
    return 'completed';
  }

  return order.status || 'open';
}

/**
 * Retorna os dias decorridos desde a conclusão da ordem.
 * @param {Object} order
 * @returns {number}
 */
export function getDaysSinceCompletion(order) {
  const completionTimestamp = order?.completed_at || order?.updated_at || order?.created_at;
  if (!completionTimestamp) return 0;
  const completionDate = new Date(completionTimestamp);
  const diffInHours = (Date.now() - completionDate.getTime()) / (1000 * 60 * 60);
  return Math.max(0, Math.floor(diffInHours / 24));
}

/**
 * Verifica se a ordem está com faturamento pendente.
 */
export function isBillingPending(order) {
  return getEffectiveOrderStatus(order) === 'billing_pending';
}

/**
 * Verifica se a ordem já foi faturada.
 */
export function isBilled(order) {
  return order?.status === 'billed';
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
      return 'Pendência de Faturamento';
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
    case 'billed':
      return 'os-status-badge--billed';
    case 'cancelled':
      return 'os-status-badge--cancelled';
    default:
      return 'os-status-badge--open';
  }
}

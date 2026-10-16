/**
 * Utilitários avançados para busca inteligente e tolerante a variações numéricas
 * no HelpClin (Ordens de Serviço e Chamados Técnicos).
 *
 * Resolve o problema onde digitar 'OS-15', '15', '015', '00015', 'os 15', '#15'
 * apagava a listagem porque a busca exigia correspondência textual idêntica.
 */

/**
 * Normaliza um texto removendo acentos, espaços extras e convertendo para minúsculas.
 * @param {string|number|null} text
 * @returns {string}
 */
export function normalizeText(text) {
  if (text == null) return '';
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Gera todas as representações possíveis de um número de OS ou chamado
 * (ex: '15', '015', '00015', 'os-15', 'os-00015', 'os 15', '#15', etc.)
 * @param {string|number|null} num
 * @returns {string[]}
 */
export function getOrderNumberVariations(num) {
  if (num == null || num === '') return [];
  const raw = String(num).trim();
  const digits = raw.replace(/\D/g, '');
  if (!digits) return [normalizeText(raw)];

  const cleanNum = digits.replace(/^0+/, '') || '0';
  const padded5 = cleanNum.padStart(5, '0');
  const padded4 = cleanNum.padStart(4, '0');
  const padded3 = cleanNum.padStart(3, '0');

  const set = new Set([
    cleanNum,
    padded5,
    padded4,
    padded3,
    'os-' + cleanNum,
    'os-' + padded5,
    'os' + cleanNum,
    'os' + padded5,
    'os ' + cleanNum,
    'os ' + padded5,
    '#' + cleanNum,
    '#' + padded5,
    'n ' + cleanNum,
    'n ' + padded5,
    'no ' + cleanNum,
    'no ' + padded5,
    'nº ' + cleanNum,
    'nº ' + padded5
  ]);
  return Array.from(set).map(normalizeText);
}

/**
 * Realiza busca inteligente em uma Ordem de Serviço.
 * Permite buscar por variações de número (ex: 15, 015, OS-15, OS-00015, os 15)
 * e também por texto sem diferenciação de acentos ou maiúsculas.
 *
 * @param {Object} order Objeto da Ordem de Serviço
 * @param {string} search Termo digitado pelo usuário
 * @returns {boolean}
 */
export function matchOrderSearch(order, search) {
  if (!search || !search.trim()) return true;
  if (!order) return false;

  const rawSearch = search.trim();
  const normSearch = normalizeText(rawSearch);

  // Extrai número da ordem (order_number ou service_order_number ou id)
  const orderNum = order.order_number ?? order.service_order_number ?? order.id;
  const numVariations = getOrderNumberVariations(orderNum);
  const rawNumDigits = String(orderNum || '').replace(/\D/g, '');
  const cleanNumDigits = rawNumDigits.replace(/^0+/, '') || '0';
  const padded5 = cleanNumDigits.padStart(5, '0');

  // Campos textuais combinados
  const textFields = [
    order.patient_name,
    order.service_type,
    order.equipment_name,
    order.technician_name,
    order.description,
    order.service_requested_description,
    order.service_performed_description,
    order.company_sector,
    order.location,
    order.requester,
    order.observations,
    order.related_problem
  ]
    .filter(Boolean)
    .map(normalizeText)
    .join(' ');

  // Se a busca completa bater diretamente com os campos textuais ou variações numéricas
  if (textFields.includes(normSearch)) return true;
  if (numVariations.some((v) => v.includes(normSearch))) return true;

  // Busca por múltiplos termos (ex: "hospital 15", "os-15 preventiva")
  const tokens = normSearch.split(/\s+/).filter(Boolean);

  return tokens.every((token) => {
    // 1. Termo bate com texto (sem acento)
    if (textFields.includes(token)) return true;

    // 2. Termo bate com variações do número
    if (numVariations.some((v) => v.includes(token))) return true;

    // 3. Termo bate com dígitos parciais ou com zeros
    const tokenDigits = token.replace(/\D/g, '');
    const cleanTokenDigits = tokenDigits.replace(/^0+/, '');

    if (cleanTokenDigits && cleanNumDigits) {
      if (cleanNumDigits.includes(cleanTokenDigits)) return true;
      if (padded5.includes(tokenDigits)) return true;
    }

    return false;
  });
}

/**
 * Realiza busca inteligente em um Chamado Técnico.
 * Suporta tanto o número do chamado (#00015, 15) quanto a Ordem de Serviço vinculada (OS-00015, OS-15).
 *
 * @param {Object} ticket Objeto do Chamado
 * @param {string} search Termo digitado pelo usuário
 * @returns {boolean}
 */
export function matchTicketSearch(ticket, search) {
  if (!search || !search.trim()) return true;
  if (!ticket) return false;

  const rawSearch = search.trim();
  const normSearch = normalizeText(rawSearch);

  // Variações do número do chamado e da OS vinculada
  const ticketNum = ticket.ticket_number ?? ticket.id;
  const osNum = ticket.service_order_number;

  const ticketVariations = getOrderNumberVariations(ticketNum);
  const osVariations = osNum != null ? getOrderNumberVariations(osNum) : [];
  const allNumVariations = [...ticketVariations, ...osVariations];

  const rawTicketDigits = String(ticketNum || '').replace(/\D/g, '');
  const cleanTicketDigits = rawTicketDigits.replace(/^0+/, '') || '0';
  const paddedTicket5 = cleanTicketDigits.padStart(5, '0');

  const rawOsDigits = osNum != null ? String(osNum).replace(/\D/g, '') : '';
  const cleanOsDigits = rawOsDigits.replace(/^0+/, '');
  const paddedOs5 = cleanOsDigits ? cleanOsDigits.padStart(5, '0') : '';

  // Campos textuais do chamado
  const textFields = [
    ticket.requester,
    ticket.company_sector,
    ticket.location,
    ticket.related_problem,
    ticket.equipment_name,
    ticket.assigned_to_name,
    ticket.observations,
    ticket.description
  ]
    .filter(Boolean)
    .map(normalizeText)
    .join(' ');

  if (textFields.includes(normSearch)) return true;
  if (allNumVariations.some((v) => v.includes(normSearch))) return true;

  const tokens = normSearch.split(/\s+/).filter(Boolean);

  return tokens.every((token) => {
    if (textFields.includes(token)) return true;
    if (allNumVariations.some((v) => v.includes(token))) return true;

    const tokenDigits = token.replace(/\D/g, '');
    const cleanTokenDigits = tokenDigits.replace(/^0+/, '');

    if (cleanTokenDigits) {
      if (cleanTicketDigits && cleanTicketDigits.includes(cleanTokenDigits)) return true;
      if (paddedTicket5.includes(tokenDigits)) return true;
      if (cleanOsDigits && cleanOsDigits.includes(cleanTokenDigits)) return true;
      if (paddedOs5 && paddedOs5.includes(tokenDigits)) return true;
    }

    return false;
  });
}

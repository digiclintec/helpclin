import { Building2, Laptop, Stethoscope } from 'lucide-react';
import { getClientBillingSettings } from './billingUtils.js';

/**
 * Definições oficiais das 3 vertentes de atuação HelpClin
 */
export const VERTICALS = {
  clinical: {
    id: 'clinical',
    name: 'Engenharia Clínica',
    shortName: 'Clínica',
    subtitle: 'Equipamentos Médicos, Biomédicos e Hospitalares',
    color: '#0f766e',
    bg: '#ccfbf1',
    border: '#99f6e4',
    badgeClass: 'vertical-badge--clinical',
    icon: Stethoscope
  },
  ti: {
    id: 'ti',
    name: 'T.I. em Saúde',
    shortName: 'T.I.',
    subtitle: 'Hardware, Estações Médicas, Redes e Suporte',
    color: '#1d4ed8',
    bg: '#dbeafe',
    border: '#bfdbfe',
    badgeClass: 'vertical-badge--ti',
    icon: Laptop
  },
  predial: {
    id: 'predial',
    name: 'Engenharia Predial',
    shortName: 'Predial',
    subtitle: 'Infraestrutura, Geradores, Gases e Climatização PMOC',
    color: '#b45309',
    bg: '#fef3c7',
    border: '#fde68a',
    badgeClass: 'vertical-badge--predial',
    icon: Building2
  }
};

/**
 * Retorna as vertentes contratuais liberadas para o usuário/cliente.
 * Administradores e técnicos têm acesso total a todas as vertentes.
 * Clientes só acessam o que está explicitamente setado na sua vertente contratada.
 * Se o cliente contratou 2 vertentes (ex: Clínica e T.I.), ele consegue ver ambas.
 * @param {Object} user - Objeto do usuário autenticado
 * @returns {Array<'clinical'|'ti'|'predial'>}
 */
export function getUserAllowedVerticals(user) {
  if (!user) return ['clinical', 'ti', 'predial'];

  // Administrador ou técnico têm acesso irrestrito a todas as vertentes
  if (user.role === 'admin' || user.role === 'technician') {
    return ['clinical', 'ti', 'predial'];
  }

  // 1. Verificar configuração específica salva para este usuário por ID
  const userVerticalsMap = getStoredUserVerticalsMap();
  if (user.id && Array.isArray(userVerticalsMap[user.id]) && userVerticalsMap[user.id].length > 0) {
    return userVerticalsMap[user.id];
  }

  // 2. Verificar campo no próprio objeto do usuário (armazenado na sessão)
  if (Array.isArray(user.contractedVerticals) && user.contractedVerticals.length > 0) {
    return user.contractedVerticals;
  }
  if (Array.isArray(user.verticals) && user.verticals.length > 0) {
    return user.verticals;
  }
  if (typeof user.vertical === 'string' && user.vertical && VERTICALS[user.vertical]) {
    return [user.vertical];
  }

  // 3. Fallback: Configurações contratuais gerais da organização (billingUtils)
  const billingSettings = getClientBillingSettings();
  const allowed = [];
  if (billingSettings.moduleClinical !== false) allowed.push('clinical');
  if (billingSettings.moduleTI !== false) allowed.push('ti');
  if (billingSettings.modulePredial !== false) allowed.push('predial');

  return allowed.length > 0 ? allowed : ['clinical', 'ti'];
}

/**
 * Retorna o mapa de vertentes de cada usuário salvo no navegador
 * @returns {Record<string, Array<string>>}
 */
export function getStoredUserVerticalsMap() {
  try {
    const raw = localStorage.getItem('helpclin_user_verticals');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Salva as vertentes contratadas para um usuário específico (gerenciado pelo Admin)
 * @param {string} userId - ID do usuário
 * @param {Array<string>|string} verticals - Array de códigos das vertentes
 */
export function saveUserContractedVerticals(userId, verticals) {
  try {
    const currentMap = getStoredUserVerticalsMap();
    const list = Array.isArray(verticals) ? verticals : [verticals];
    const updated = {
      ...currentMap,
      [userId]: list
    };
    localStorage.setItem('helpclin_user_verticals', JSON.stringify(updated));

    // Se for o usuário atualmente autenticado, atualiza o helpclin_user também
    const currentUser = JSON.parse(localStorage.getItem('helpclin_user') || 'null');
    if (currentUser && String(currentUser.id) === String(userId)) {
      currentUser.contractedVerticals = list;
      localStorage.setItem('helpclin_user', JSON.stringify(currentUser));
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('helpclin_verticals_changed', {
          detail: { userId, verticals: list }
        })
      );
    }
    return list;
  } catch (err) {
    console.error('Erro ao salvar vertentes do usuário:', err);
    return [];
  }
}

/**
 * Verifica se um usuário possui permissão para acessar uma vertente específica
 * @param {Object} user - Objeto do usuário
 * @param {'clinical'|'ti'|'predial'} verticalCode - Código da vertente
 * @returns {boolean}
 */
export function canUserAccessVertical(user, verticalCode) {
  if (!verticalCode) return true;
  const allowed = getUserAllowedVerticals(user);
  return allowed.includes(verticalCode);
}

/**
 * Identifica a vertente de um equipamento pelo tipo, nome ou campo vertical explícito
 * @param {string} type - Tipo do equipamento
 * @param {string} [explicitVertical] - Vertente explícita opcional
 */
export function getAssetVertical(type = '', explicitVertical = '') {
  if (explicitVertical && VERTICALS[explicitVertical]) {
    const v = VERTICALS[explicitVertical];
    return {
      name: v.name,
      shortName: v.shortName,
      code: v.id,
      color: v.color,
      bg: v.bg,
      border: v.border,
      icon: v.icon,
      badgeClass: v.badgeClass
    };
  }

  const t = (type || '').toLowerCase();

  // Predial
  if (
    t.includes('gerador') ||
    t.includes('ups') ||
    t.includes('no-break') ||
    t.includes('nobreak') ||
    t.includes('gás') ||
    t.includes('gas') ||
    t.includes('oxig') ||
    t.includes('vácuo') ||
    t.includes('vacuo') ||
    t.includes('clima') ||
    t.includes('chiller') ||
    t.includes('ar-cond') ||
    t.includes('pmoc') ||
    t.includes('subest') ||
    t.includes('elétr') ||
    t.includes('eletr') ||
    t.includes('bomba') ||
    t.includes('incênd') ||
    t.includes('incend') ||
    t.includes('avcb') ||
    t.includes('elevador')
  ) {
    const v = VERTICALS.predial;
    return {
      name: v.name,
      shortName: v.shortName,
      code: v.id,
      color: v.color,
      bg: v.bg,
      border: v.border,
      icon: v.icon,
      badgeClass: v.badgeClass
    };
  }

  // Clínica
  if (
    t.includes('respirador') ||
    t.includes('ventilador') ||
    t.includes('desfibrilador') ||
    t.includes('cardio') ||
    t.includes('infus') ||
    t.includes('eletroc') ||
    t.includes('autoclave') ||
    t.includes('bisturi') ||
    t.includes('diagnóst') ||
    t.includes('diagnost') ||
    t.includes('imagem') ||
    t.includes('multipar') ||
    t.includes('clínic') ||
    t.includes('clinic') ||
    t.includes('balan') ||
    t.includes('raio-x') ||
    t.includes('ultrassom') ||
    t.includes('pressão') ||
    t.includes('pressao') ||
    t.includes('oxímetro') ||
    t.includes('oximetro')
  ) {
    const v = VERTICALS.clinical;
    return {
      name: v.name,
      shortName: v.shortName,
      code: v.id,
      color: v.color,
      bg: v.bg,
      border: v.border,
      icon: v.icon,
      badgeClass: v.badgeClass
    };
  }

  // T.I.
  const v = VERTICALS.ti;
  return {
    name: v.name,
    shortName: v.shortName,
    code: v.id,
    color: v.color,
    bg: v.bg,
    border: v.border,
    icon: v.icon,
    badgeClass: v.badgeClass
  };
}

/**
 * Filtra uma lista de equipamentos mantendo apenas os ativos pertencentes
 * às vertentes contratadas do usuário.
 * @param {Array<Object>} equipments - Lista completa de equipamentos
 * @param {Object} user - Objeto do usuário
 * @returns {Array<Object>}
 */
export function filterEquipmentsForUser(equipments, user) {
  if (!Array.isArray(equipments)) return [];
  const allowed = getUserAllowedVerticals(user);
  return equipments.filter((eq) => {
    const vert = getAssetVertical(eq.equipment_type, eq.vertical);
    return allowed.includes(vert.code);
  });
}

/**
 * Retorna texto descritivo e amigável das vertentes contratadas
 * @param {Object} user
 * @returns {string}
 */
export function formatUserVerticalsSummary(user) {
  if (!user) return '';
  if (user.role === 'admin') return 'Administrador Geral';
  if (user.role === 'technician') return 'Técnico Especialista';

  const allowed = getUserAllowedVerticals(user);
  if (allowed.length === 3) return 'Plano Tri-Vertical (Clínica + T.I. + Predial)';
  if (allowed.includes('clinical') && allowed.includes('ti')) return 'Clínica + T.I. em Saúde';
  if (allowed.includes('clinical') && allowed.includes('predial')) return 'Clínica + Predial';
  if (allowed.includes('ti') && allowed.includes('predial')) return 'T.I. + Predial';
  if (allowed.includes('clinical')) return 'Engenharia Clínica';
  if (allowed.includes('ti')) return 'T.I. em Saúde';
  if (allowed.includes('predial')) return 'Engenharia Predial';
  return 'Sem vertente ativa';
}
